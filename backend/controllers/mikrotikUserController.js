const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const MikrotikUser = require('../models/MikrotikUser');
const Package = require('../models/Package');
const MikrotikRouter = require('../models/MikrotikRouter');
const RouterOSAPI = require('node-routeros').RouterOSAPI;
const { decrypt } = require('../utils/crypto'); // Import decrypt function
const UserDowntimeLog = require('../models/UserDowntimeLog');
const WalletTransaction = require('../models/WalletTransaction');
const ApplicationSettings = require('../models/ApplicationSettings');
const { sendAcknowledgementSms } = require('../services/smsService');
const smsTriggers = require('../constants/smsTriggers');

// Helper function to generate a unique 6-digit number
const generateUnique6DigitNumber = async () => {
  let isUnique = false;
  let randomNumber;
  while (!isUnique) {
    randomNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const existingUser = await MikrotikUser.findOne({ mPesaRefNo: randomNumber });
    if (!existingUser) {
      isUnique = true;
    }
  }
  return randomNumber;
};

// Helper function to generate a random 6-letter string
const generateRandom6LetterString = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const formatUpdateArgs = (argsObject) => {
  return Object.entries(argsObject).map(([key, value]) => `=${key}=${value}`);
};

// @desc    Create a new Mikrotik User
// @route   POST /api/mikrotik/users
// @access  Private
const createMikrotikUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    mikrotikRouter,
    serviceType,
    package: packageId,
    username,
    pppoePassword,
    remoteAddress,
    ipAddress,
    officialName,
    emailAddress,
    apartment_house_number,
    door_number_unit_label,
    mPesaRefNo,
    installationFee,
    billingCycle,
    mobileNumber,
    expiryDate,
    station,
    sendWelcomeSms,
  } = req.body;

  // Verify ownership of router
  const router = await MikrotikRouter.findOne({ _id: mikrotikRouter, tenantOwner: req.user.tenantOwner });
  if (!router) {
    res.status(401);
    throw new Error('Not authorized to use this router');
  }

  // Verify ownership of package
  const selectedPackage = await Package.findOne({ _id: packageId, tenantOwner: req.user.tenantOwner });
  if (!selectedPackage) {
    res.status(401);
    throw new Error('Not authorized to use this package');
  }

  if (selectedPackage.serviceType !== serviceType) {
    res.status(400);
    throw new Error('Service type of user must match selected package service type');
  }

  // Validate package profile/rateLimit based on serviceType
  if (serviceType === 'pppoe' && !selectedPackage.profile) {
    res.status(400);
    throw new Error('The selected package is missing a PPP profile. Please edit the package to include a profile.');
  }
  if (serviceType === 'static' && !selectedPackage.rateLimit) {
    res.status(400);
    throw new Error('The selected package is missing a rate limit. Please edit the package to include a rate limit.');
  }

  // Validate PPPoE specific fields
  if (serviceType === 'pppoe') {
    if (!pppoePassword) {
      res.status(400);
      throw new Error('PPPoE password is required for PPPoE users');
    }
  }

  // Handle mPesaRefNo generation if requested
  let finalMPesaRefNo = mPesaRefNo;
  if (mPesaRefNo === 'generate_6_digit_number') {
    finalMPesaRefNo = await generateUnique6DigitNumber();
  } else if (mPesaRefNo === 'generate_6_letter_string') {
    finalMPesaRefNo = generateRandom6LetterString();
  }

  const userExists = await MikrotikUser.findOne({ username, tenantOwner: req.user.tenantOwner });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this username already exists');
  }

  const mPesaRefNoExists = await MikrotikUser.findOne({ mPesaRefNo: finalMPesaRefNo, tenantOwner: req.user.tenantOwner });
  if (mPesaRefNoExists) {
    res.status(400);
    throw new Error('M-Pesa Reference Number must be unique');
  }

  const mikrotikUser = await MikrotikUser.create({
    mikrotikRouter,
    serviceType,
    package: packageId,
    username,
    pppoePassword,
    remoteAddress,
    ipAddress,
    officialName,
    emailAddress,
    apartment_house_number,
    door_number_unit_label,
    mPesaRefNo: finalMPesaRefNo,
    installationFee,
    billingCycle,
    mobileNumber,
    expiryDate,
    station,
    tenantOwner: req.user.tenantOwner, // Associate with the logged-in user's tenant
  });

  // If there is an installation fee, create an initial debit for it.
  if (mikrotikUser && installationFee && parseFloat(installationFee) > 0) {
    const fee = parseFloat(installationFee);
    mikrotikUser.walletBalance -= fee;

    await WalletTransaction.create({
      tenantOwner: req.user.tenantOwner,
      mikrotikUser: mikrotikUser._id,
      transactionId: `DEBIT-INSTALL-${Date.now()}-${mikrotikUser.username}`,
      type: 'Debit',
      amount: fee,
      source: 'Installation Fee',
      balanceAfter: mikrotikUser.walletBalance,
      comment: 'Initial installation fee.',
    });

    await mikrotikUser.save();
  }

  if (mikrotikUser) {
    let client;
    try {
      client = new RouterOSAPI({
        host: router.ipAddress,
        user: router.apiUsername,
        password: decrypt(router.apiPassword),
        port: router.apiPort,
      });

      await client.connect();

      if (serviceType === 'pppoe') {
        const pppSecretArgs = [
          `=name=${username}`,
          `=password=${pppoePassword}`,
          `=profile=${selectedPackage.profile}`,
          `=service=${selectedPackage.serviceType}`,
        ];
        if (remoteAddress) {
          pppSecretArgs.push(`=remote-address=${remoteAddress}`);
        }
        await client.write('/ppp/secret/add', pppSecretArgs);
      } else if (serviceType === 'static') {
        await client.write('/queue/simple/add', [
          `=name=${username}`,
          `=target=${ipAddress}`,
          `=max-limit=${selectedPackage.rateLimit}`,
        ]);
      }
    } catch (error) {
      console.error(`Mikrotik API Provisioning Error: ${error.message}`);
      res.status(500);
      throw new Error(`Failed to provision user on Mikrotik: ${error.message}`);
    } finally {
      if (client) {
        client.close();
      }
    }
    if (sendWelcomeSms) {
      try {
          await sendAcknowledgementSms(
              smsTriggers.MIKROTIK_USER_CREATED,
              mikrotikUser.mobileNumber,
              {
                  officialName: mikrotikUser.officialName,
                  mPesaRefNo: mikrotikUser.mPesaRefNo,
                  tenantOwner: req.user.tenantOwner // Pass the tenant's user ID
              }
          );
      } catch (error) {
          console.error(`Failed to send acknowledgement SMS for new user ${mikrotikUser.username}:`, error);
      }
    }

    res.status(201).json(mikrotikUser);
  } else {
    res.status(400);
    throw new Error('Invalid Mikrotik user data');
  }
});

// @desc    Get all Mikrotik Users
// @route   GET /api/mikrotik/users
// @access  Private
const getMikrotikUsers = asyncHandler(async (req, res) => {
  let query = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const users = await MikrotikUser.find(query)
    .populate('mikrotikRouter')
    .populate('package')
    .populate('station');
  res.status(200).json(users);
});

// @desc    Get single Mikrotik User by ID
// @route   GET /api/mikrotik/users/:id
// @access  Private
const getMikrotikUserById = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const user = await MikrotikUser.findOne(query)
    .populate('mikrotikRouter')
    .populate('package')
    .populate('station');

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error('Mikrotik User not found');
  }
});

// @desc    Update a Mikrotik User
// @route   PUT /api/mikrotik/users/:id
// @access  Private
const updateMikrotikUser = asyncHandler(async (req, res) => {
  const user = await MikrotikUser.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (!user) {
    res.status(404);
    throw new Error('Mikrotik User not found');
  }

  const {
    mikrotikRouter,
    serviceType,
    package: packageId,
    username,
    pppoePassword,
    remoteAddress,
    ipAddress,
    officialName,
    emailAddress,
    apartment_house_number,
    door_number_unit_label,
    mPesaRefNo,
    installationFee,
    billingCycle,
    mobileNumber,
    expiryDate,
    isSuspended,
    station,
  } = req.body;

  const originalUsername = user.username;

  user.mikrotikRouter = mikrotikRouter || user.mikrotikRouter;
  user.serviceType = serviceType || user.serviceType;
  user.package = packageId || user.package;
  user.username = username || user.username;
  user.pppoePassword = pppoePassword || user.pppoePassword;
  user.remoteAddress = remoteAddress || user.remoteAddress;
  user.ipAddress = ipAddress || user.ipAddress;
  user.officialName = officialName || user.officialName;
  user.emailAddress = emailAddress || user.emailAddress;
  user.apartment_house_number = apartment_house_number || user.apartment_house_number;
  user.door_number_unit_label = door_number_unit_label || user.door_number_unit_label;
  user.mPesaRefNo = mPesaRefNo || user.mPesaRefNo;
  user.installationFee = installationFee || user.installationFee;
  user.billingCycle = billingCycle || user.billingCycle;
  user.mobileNumber = mobileNumber || user.mobileNumber;
  user.expiryDate = expiryDate || user.expiryDate;
  user.station = station || user.station;

  if (expiryDate && new Date(expiryDate) > new Date()) {
    user.isSuspended = false;
  }

  const updatedUser = await user.save();

  const router = await MikrotikRouter.findById(updatedUser.mikrotikRouter);
  if (!router) {
    console.warn(`Associated Mikrotik Router not found for user ${updatedUser.username}. Mikrotik update skipped.`);
  } else {
    let client;
    try {
      client = new RouterOSAPI({
        host: router.ipAddress,
        user: router.apiUsername,
        password: decrypt(router.apiPassword),
        port: router.apiPort,
      });

      await client.connect();

      if (updatedUser.serviceType === 'pppoe') {
        const pppSecrets = await client.write('/ppp/secret/print', [`?name=${originalUsername}`]);
        if (pppSecrets.length > 0) {
          const secretId = pppSecrets[0]['.id'];
          const selectedPackage = await Package.findById(updatedUser.package);

          let disabledStatus = updatedUser.isSuspended ? 'yes' : 'no';
          let profileToSet = updatedUser.isSuspended ? 'Disconnect' : selectedPackage.profile;

          if (disabledStatus === 'yes') {
              const allActiveSessions = await client.write('/ppp/active/print');
              const activeSessions = allActiveSessions.filter(session => session.name === updatedUser.username);
              for (const session of activeSessions) {
                  await client.write('/ppp/active/remove', [`=.id=${session['.id']}`]);
              }
          }

          const updateArgs = {
            name: updatedUser.username,
            password: updatedUser.pppoePassword,
            profile: profileToSet,
            service: selectedPackage.serviceType,
            disabled: disabledStatus,
          };
          if (updatedUser.remoteAddress) {
            updateArgs['remote-address'] = updatedUser.remoteAddress;
          }
          await client.write('/ppp/secret/set', [`=.id=${secretId}`, ...formatUpdateArgs(updateArgs)]);
        } else {
          console.warn(`PPP Secret for user ${updatedUser.username} not found on Mikrotik. Cannot update.`);
        }
      } else if (updatedUser.serviceType === 'static') {
        const simpleQueues = await client.write('/queue/simple/print', [`?name=${originalUsername}`]);
        if (simpleQueues.length > 0) {
          const queueId = simpleQueues[0]['.id'];
          const selectedPackage = await Package.findById(updatedUser.package);

          let disabledStatus = updatedUser.isSuspended ? 'yes' : 'no';
          let maxLimitToSet = updatedUser.isSuspended ? '1k/1k' : selectedPackage.rateLimit;

          const updateArgs = {
            name: updatedUser.username,
            target: updatedUser.ipAddress,
            'max-limit': maxLimitToSet,
            disabled: disabledStatus,
          };
          await client.write('/queue/simple/set', [`=.id=${queueId}`, ...formatUpdateArgs(updateArgs)]);
        } else {
          console.warn(`Simple Queue for static user ${updatedUser.username} not found on Mikrotik. Cannot update.`);
        }
      }
    } catch (error) {
      console.error(`Mikrotik API Update Error: ${error.message}`);
    } finally {
      if (client) {
        client.close();
      }
    }
  }

  res.status(200).json(updatedUser);
});

// @desc    Delete a Mikrotik User
// @route   DELETE /api/mikrotik/users/:id
// @access  Private
const deleteMikrotikUser = asyncHandler(async (req, res) => {
  const user = await MikrotikUser.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (!user) {
    res.status(404);
    throw new Error('Mikrotik User not found');
  }

  const router = await MikrotikRouter.findById(user.mikrotikRouter);
  if (router) {
    let client;
    try {
      client = new RouterOSAPI({
        host: router.ipAddress,
        user: router.apiUsername,
        password: decrypt(router.apiPassword),
        port: router.apiPort,
      });

      await client.connect();

      if (user.serviceType === 'pppoe') {
        const pppSecrets = await client.write('/ppp/secret/print', [`?name=${user.username}`]);
        if (pppSecrets.length > 0) {
          const secretId = pppSecrets[0]['.id'];
          await client.write('/ppp/secret/remove', [`=.id=${secretId}`]);
        }
      } else if (user.serviceType === 'static') {
        const simpleQueues = await client.write('/queue/simple/print', [`?name=${user.username}`]);
        if (simpleQueues.length > 0) {
          const queueId = simpleQueues[0]['.id'];
          await client.write('/queue/simple/remove', [`=.id=${queueId}`]);
        }
      }
    } catch (error) {
      console.error(`Mikrotik API De-provisioning Error: ${error.message}`);
    } finally {
      if (client) {
        client.close();
      }
    }
  }

  await user.deleteOne();

  res.status(200).json({ message: 'Mikrotik User removed' });
});

// @desc    Get Mikrotik Clients (for SMS dropdowns)
// @route   GET /api/mikrotik/users/clients-for-sms
// @access  Private
const getMikrotikClientsForSms = asyncHandler(async (req, res) => {
  let query = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const clients = await MikrotikUser.find(query).select('_id officialName mobileNumber');
  res.status(200).json(clients);
});

// @desc    Get count of new subscribers for the current month
// @route   GET /api/mikrotik/users/stats/monthly-new-subscribers
// @access  Private/Admin
const getMonthlyNewSubscribers = asyncHandler(async (req, res) => {
  let query = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

  const count = await MikrotikUser.countDocuments(query);

  res.status(200).json({ count });
});

// @desc    Get count of paid subscribers for the current month
// @route   GET /api/mikrotik/users/stats/monthly-paid-subscribers
// @access  Private/Admin
const getMonthlyPaidSubscribers = asyncHandler(async (req, res) => {
  let query = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  query.expiryDate = { $gte: new Date() };
  query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

  const count = await MikrotikUser.countDocuments(query);

  res.status(200).json({ count });
});

// @desc    Get monthly total subscribers for a given year
// @route   GET /api/mikrotik/users/stats/monthly-total-subscribers/:year
// @access  Private/Admin
const getMonthlyTotalSubscribers = asyncHandler(async (req, res) => {
  const { year } = req.params;

  let query = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const monthlyTotals = [];

  for (let i = 0; i < 12; i++) {
    const startOfMonth = new Date(year, i, 1);
    const endOfMonth = new Date(year, i + 1, 0); // Last day of the month

    query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

    const count = await MikrotikUser.countDocuments(query);

    monthlyTotals.push({
      month: i + 1, // Month number (1-12)
      total: count,
    });
  }

  res.status(200).json(monthlyTotals);
});

// @desc    Get Mikrotik User Status
// @route   GET /api/mikrotik/users/:id/status
// @access  Private
const getMikrotikUserStatus = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const user = await MikrotikUser.findOne(query).populate('mikrotikRouter').populate('package');

  if (!user) {
    res.status(404);
    throw new Error('Mikrotik User not found');
  }

  const router = user.mikrotikRouter;

  if (!router) {
    res.status(404);
    throw new Error('Associated Mikrotik Router not found');
  }

  let client;
  try {
    client = new RouterOSAPI({
      host: router.ipAddress,
      user: router.apiUsername,
      password: decrypt(router.apiPassword),
      port: router.apiPort,
      timeout: 5000, // 5 second timeout
    });

    await client.connect();

    let status = 'offline';

    if (user.serviceType === 'pppoe') {
      const pppActive = await client.write('/ppp/active/print');
      if (pppActive.some(session => session.name === user.username)) {
        status = 'online';
      }
    } else if (user.serviceType === 'static') {
      const pingReplies = await client.write('/ping', [`=address=${user.ipAddress}`, '=count=2']);
      if (pingReplies.some(reply => reply.time)) {
        status = 'online';
      }
    }

    await client.close();
    res.status(200).json({ status });
  } catch (error) {
    res.status(200).json({ status: 'offline' }); // Return offline on any API error
  }
});

// @desc    Get Mikrotik User Traffic Statistics
// @route   GET /api/mikrotik/users/:id/traffic
// @access  Private
const getMikrotikUserTraffic = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const user = await MikrotikUser.findOne(query).populate('mikrotikRouter');

  if (!user) {
    res.status(404);
    throw new Error('Mikrotik User not found');
  }

  const router = user.mikrotikRouter;

  if (!router) {
    res.status(404);
    throw new Error('Associated Mikrotik Router not found');
  }

  let client;
  try {
    client = new RouterOSAPI({
      host: router.ipAddress,
      user: router.apiUsername,
      password: decrypt(router.apiPassword),
      port: router.apiPort,
      timeout: 5000, // 5 second timeout
    });

    await client.connect();

    let trafficData = { rxRate: 0, txRate: 0, rxBytes: 0, txBytes: 0 };

    if (user.serviceType === 'pppoe') {
      const pppActive = await client.write('/ppp/active/print', [`?name=${user.username}`]);
      if (pppActive.length > 0) {
        const [rxBytes, txBytes] = pppActive[0].bytes.split('/');
        trafficData.rxBytes = parseInt(rxBytes, 10);
        trafficData.txBytes = parseInt(txBytes, 10);
      }
    } else if (user.serviceType === 'static') {
      const simpleQueues = await client.write('/queue/simple/print', [`?name=${user.username}`]);
      if (simpleQueues.length > 0) {
        const [rxBytes, txBytes] = simpleQueues[0].bytes.split('/');
        trafficData.rxBytes = parseInt(rxBytes, 10);
        trafficData.txBytes = parseInt(txBytes, 10);
      }
    }

    await client.close();
    res.status(200).json(trafficData);
  } catch (error) {
    res.status(200).json({ rxRate: 0, txRate: 0, rxBytes: 0, txBytes: 0, error: `Could not fetch traffic: ${error.message}` });
  }
});

// @desc    Get all Mikrotik Users for a specific station
// @route   GET /api/devices/:stationId/users
// @access  Private
const getMikrotikUsersByStation = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  let query = { station: stationId };
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const users = await MikrotikUser.find(query)
    .populate('package')
    .populate('mikrotikRouter', 'name');
  res.status(200).json(users);
});

// @desc    Get Downtime Logs for a Mikrotik User
// @route   GET /api/mikrotik/users/:userId/downtime-logs
// @access  Private/Admin
const getDowntimeLogs = asyncHandler(async (req, res) => {
  let query = { _id: req.params.userId };
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const mikrotikUser = await MikrotikUser.findOne(query);
  if (!mikrotikUser) {
    res.status(404);
    throw new Error('Mikrotik user not found or not authorized');
  }

  const logs = await UserDowntimeLog.find({ mikrotikUser: req.params.userId }).sort({ downStartTime: -1 });
  res.status(200).json(logs);
});

// @desc    Get users with delayed payments
// @route   GET /api/mikrotik/users/delayed-payments
// @access  Private/Admin
const getDelayedPayments = asyncHandler(async (req, res) => {
  const { days_overdue, name_search } = req.query;

  if (!days_overdue) {
    res.status(400);
    throw new Error('days_overdue query parameter is required');
  }

  const days = parseInt(days_overdue, 10);
  if (isNaN(days)) {
    res.status(400);
    throw new Error('days_overdue must be a number');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let filter = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    filter.tenantOwner = req.user.tenantOwner;
  }

  filter.expiryDate = { $lt: today };

  if (name_search) {
    filter.$or = [
      { officialName: { $regex: name_search, $options: 'i' } },
      { username: { $regex: name_search, $options: 'i' } },
    ];
  }

  const users = await MikrotikUser.find(filter).populate('package');

  const usersWithDaysOverdue = users
    .map(user => {
      const expiryDate = new Date(user.expiryDate);
      const diffTime = today.getTime() - expiryDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...user.toObject(),
        daysOverdue: diffDays,
      };
    })
    .filter(user => user.daysOverdue >= days);

  res.status(200).json(usersWithDaysOverdue);
});


// @desc    Get payment statistics for a single Mikrotik User
// @route   GET /api/mikrotik/users/:id/payment-stats
// @access  Private/Admin
const getUserPaymentStats = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        let userQuery = { _id: userId };
        if (!req.user.roles.includes('SUPER_ADMIN')) {
          userQuery.tenantOwner = req.user.tenantOwner;
        }

        const user = await MikrotikUser.findOne(userQuery);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        let settingsQuery = {};
        if (!req.user.roles.includes('SUPER_ADMIN')) {
          settingsQuery.tenantOwner = req.user.tenantOwner;
        }

        const settings = await ApplicationSettings.findOne(settingsQuery);
        const gracePeriodDays = settings ? settings.paymentGracePeriodDays : 3;

        let transactionQuery = { mikrotikUser: userId };
        if (!req.user.roles.includes('SUPER_ADMIN')) {
          transactionQuery.tenantOwner = req.user.tenantOwner;
        }

        const transactions = await WalletTransaction.find(transactionQuery).sort({ createdAt: 'asc' });

        const debitTransactions = transactions.filter(t => t.type === 'Debit');
        const creditTransactions = transactions.filter(t => t.type === 'Credit');

        let onTimePayments = 0;
        let latePayments = 0;
        let totalDelayDays = 0;
        const paymentHistory = [];

        debitTransactions.forEach(debit => {
            const dueDate = new Date(debit.createdAt);
            const gracePeriodEndDate = new Date(dueDate);
            gracePeriodEndDate.setDate(dueDate.getDate() + gracePeriodDays);

            const payment = creditTransactions.find(credit => 
                new Date(credit.createdAt) >= dueDate && credit.amount >= debit.amount
            );

            if (payment) {
                const paidDate = new Date(payment.createdAt);
                const delay = Math.max(0, (paidDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

                if (paidDate <= gracePeriodEndDate) {
                    onTimePayments++;
                    paymentHistory.push({
                        billId: debit._id,
                        dueDate: debit.createdAt,
                        paidDate: paidDate,
                        amount: debit.amount,
                        status: 'Paid (On-Time)',
                        daysDelayed: 0,
                    });
                } else {
                    latePayments++;
                    totalDelayDays += delay;
                    paymentHistory.push({
                        billId: debit._id,
                        dueDate: debit.createdAt,
                        paidDate: paidDate,
                        amount: debit.amount,
                        status: 'Paid (Late)',
                        daysDelayed: Math.round(delay),
                    });
                }
            } else {
                const today = new Date();
                const daysDelayed = (today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24);
                paymentHistory.push({
                    billId: debit._id,
                    dueDate: debit.createdAt,
                    paidDate: null,
                    amount: debit.amount,
                    status: 'Pending',
                    daysDelayed: Math.round(Math.max(0, daysDelayed)),
                });
            }
        });

        const totalPayments = onTimePayments + latePayments;
        const lifetimeValue = creditTransactions.reduce((acc, curr) => acc + curr.amount, 0);

        res.status(200).json({
            userId: user._id,
            name: user.officialName,
            totalPayments,
            onTimePayments,
            latePayments,
            onTimePaymentPercentage: totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0,
            averagePaymentDelay: latePayments > 0 ? totalDelayDays / latePayments : 0,
            lifetimeValue,
            paymentHistory,
        });
    } catch (error) {
        console.error(`Error fetching payment stats for user ${req.params.id}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = {
  createMikrotikUser,
  getMikrotikUsers,
  getMikrotikUserById,
  updateMikrotikUser,
  deleteMikrotikUser,
  getMikrotikClientsForSms,
  getMonthlyNewSubscribers,
  getMonthlyPaidSubscribers,
  getMonthlyTotalSubscribers,
  getMikrotikUserStatus,
  getMikrotikUserTraffic,
  getDowntimeLogs,
  getDelayedPayments,
  getUserPaymentStats,
  getMikrotikUsersByStation,
};