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
// Mikrotik API client will be integrated here later
// const MikrotikAPI = require('mikrotik'); // Example

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
  } = req.body;

  // Verify ownership of router
  const router = await MikrotikRouter.findById(mikrotikRouter);
  if (!router || router.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to use this router');
  }

  // Verify ownership of package
  const selectedPackage = await Package.findById(packageId);
  if (!selectedPackage || selectedPackage.user.toString() !== req.user._id.toString()) {
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

  const userExists = await MikrotikUser.findOne({ username, user: req.user._id });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this username already exists');
  }

  const mPesaRefNoExists = await MikrotikUser.findOne({ mPesaRefNo: finalMPesaRefNo, user: req.user._id });
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
    user: req.user._id, // Associate with the logged-in user
  });

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
        // Assuming mikrotikUser.ipAddress is available for static users
        // You might need to ensure this IP is set before this point or derive it.
        await client.write('/queue/simple/add', [
          `=name=${username}`,
          `=target=${ipAddress}`,
          `=max-limit=${selectedPackage.rateLimit}`,
        ]);
      }
    } catch (error) {
      console.error(`Mikrotik API Provisioning Error: ${error.message}`);
      // If Mikrotik provisioning fails, consider rolling back the user creation in your DB
      // For now, we'll just send an error response.
      res.status(500);
      throw new Error(`Failed to provision user on Mikrotik: ${error.message}`);
    } finally {
      if (client) {
        client.close();
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
  const users = await MikrotikUser.find({ user: req.user._id })
    .populate('mikrotikRouter')
    .populate('package');
  res.status(200).json(users);
});

// @desc    Get single Mikrotik User by ID
// @route   GET /api/mikrotik/users/:id
// @access  Private
const getMikrotikUserById = asyncHandler(async (req, res) => {
  const user = await MikrotikUser.findById(req.params.id)
    .populate('mikrotikRouter')
    .populate('package')
    .populate('station');

  if (user) {
    // Check for ownership
    if (user.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to view this Mikrotik user');
    }
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
  const user = await MikrotikUser.findById(req.params.id);

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

  const originalUsername = user.username; // Store original username
  const wasSuspended = user.isSuspended; // Capture current suspended status

  // Update fields
  user.mikrotikRouter = mikrotikRouter || user.mikrotikRouter;
  user.serviceType = serviceType || user.serviceType;
  user.package = packageId || user.package;
  user.username = username || user.username;
  user.pppoePassword = pppoePassword || user.pppoePassword; // Handle password update
  user.remoteAddress = remoteAddress || user.remoteAddress;
  user.ipAddress = ipAddress || user.ipAddress;
  user.officialName = officialName || user.officialName;
  user.emailAddress = emailAddress || user.emailAddress;
  user.apartment_house_number = apartment_house_number || user.apartment_house_number;
  user.door_number_unit_label = door_number_unit_label || user.door_number_unit_label;
  user.mPesaRefNo = mPesaRefNo || user.mPesaRefNo; // Handle mPesaRefNo update
  user.installationFee = installationFee || user.installationFee;
  user.billingCycle = billingCycle || user.billingCycle;
  user.mobileNumber = mobileNumber || user.mobileNumber;
  user.expiryDate = expiryDate || user.expiryDate;
  user.station = station || user.station;

  // Automatically re-activate if the user is front-dated
  if (expiryDate && new Date(expiryDate) > new Date()) {
    user.isSuspended = false;
  }

  const updatedUser = await user.save();
  console.log('updatedUser.mikrotikRouter ID:', updatedUser.mikrotikRouter); // Add this line

  const router = await MikrotikRouter.findById(updatedUser.mikrotikRouter);
  console.log('Fetched MikroTik Router:', router); // Add this line
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

          // --- START: Re-activation Logic ---
          let disabledStatus = 'yes'; // Default to disabled
          let profileToSet = 'Disconnect'; // Default to Disconnect profile

          // If user was suspended and is now active (expiryDate in future, isSuspended=false)
          // Or if user is explicitly being re-activated
          if (updatedUser.expiryDate > new Date() && updatedUser.isSuspended === false) {
            disabledStatus = 'no'; // Enable the user
            profileToSet = selectedPackage.profile; // Set to their actual package profile
            console.log(`Re-activating user ${updatedUser.username}: Setting disabled=${disabledStatus}, profile=${profileToSet}`);
          } else if (wasSuspended && updatedUser.isSuspended === false) {
            // Case where isSuspended is explicitly set to false, even if expiryDate is not in future
            disabledStatus = 'no';
            profileToSet = selectedPackage.profile;
            console.log(`Explicitly re-activating user ${updatedUser.username}: Setting disabled=${disabledStatus}, profile=${profileToSet}`);
          }
          // --- END: Re-activation Logic ---

          console.log(`Final disabledStatus for ${updatedUser.username}: ${disabledStatus}`);
          console.log(`Final profileToSet for ${updatedUser.username}: ${profileToSet}`);

          // Terminate Active Session if user is being disabled
          if (disabledStatus === 'yes') {
              const allActiveSessions = await client.write('/ppp/active/print');
              const activeSessions = allActiveSessions.filter(session => session.name === updatedUser.username);
              if (activeSessions.length > 0) {
                  for (const session of activeSessions) {
                      console.log(`[${new Date().toISOString()}] Attempting to remove active session with ID: ${session['.id']} for user ${updatedUser.username}.`);
                      await client.write('/ppp/active/remove', [`=.id=${session['.id']}`]);
                      console.log(`[${new Date().toISOString()}] Terminated active session for ${updatedUser.username} (ID: ${session['.id']}).`);
                  }
              } else {
                  console.log(`[${new Date().toISOString()}] No active session found for ${updatedUser.username}.`);
              }
          }

          const updateArgs = {
            name: updatedUser.username,
            password: updatedUser.pppoePassword,
            profile: profileToSet, // Use the determined profile
            service: selectedPackage.serviceType,
            disabled: disabledStatus, // Use the determined disabled status
          };
          if (updatedUser.remoteAddress) {
            updateArgs['remote-address'] = updatedUser.remoteAddress;
          }
          console.log('Mikrotik Update Args:', updateArgs); // Add this line
          try {
            const response = await client.write('/ppp/secret/set', [`=.id=${secretId}`, ...formatUpdateArgs(updateArgs)]);
            console.log('Mikrotik PPP Secret Set Response:', response);
          } catch (setError) {
            if (setError.errno === 'UNKNOWNREPLY') {
              console.warn(`Mikrotik PPP secret update for user ${updatedUser.username} returned UNKNOWNREPLY, treating as success.`);
            } else {
              throw setError; // Re-throw other errors
            }
          }
        } else {
          console.warn(`PPP Secret for user ${updatedUser.username} not found on Mikrotik. Cannot update.`);
        }
      } else if (updatedUser.serviceType === 'static') {
        const simpleQueues = await client.write('/queue/simple/print', [`?name=${originalUsername}`]);
        if (simpleQueues.length > 0) {
          const queueId = simpleQueues[0]['.id'];
          const selectedPackage = await Package.findById(updatedUser.package);

          let disabledStatus;
          let maxLimitToSet;

          if (updatedUser.expiryDate > new Date() && updatedUser.isSuspended === false) {
            disabledStatus = 'no';
            maxLimitToSet = selectedPackage.rateLimit;
            console.log(`Re-activating static user ${updatedUser.username}: Setting disabled=${disabledStatus}, max-limit=${maxLimitToSet}`);
          } else {
            // User is either expired or suspended
            disabledStatus = 'yes';
            maxLimitToSet = '1k/1k'; // Set to 1k/1k when disabled
            console.log(`De-activating static user ${updatedUser.username}: Setting disabled=${disabledStatus}, max-limit=${maxLimitToSet}`);
          }

          const updateArgs = {
            name: updatedUser.username,
            target: updatedUser.ipAddress, // Add this line to update the IP address
            'max-limit': maxLimitToSet,
          };
          try {
            const response = await client.write('/queue/simple/set', [`=.id=${queueId}`, ...formatUpdateArgs(updateArgs)]);
            console.log('Mikrotik Simple Queue Set Response:', response);
          } catch (setError) {
            if (setError.errno === 'UNKNOWNREPLY') {
              console.warn(`Mikrotik Simple Queue update for user ${updatedUser.username} returned UNKNOWNREPLY, treating as success.`);
            } else {
              throw setError; // Re-throw other errors
            }
          }
        } else {
          console.warn(`Simple Queue for static user ${updatedUser.username} not found on Mikrotik. Cannot update.`);
        }
      }
    } catch (error) {
      console.error(`Mikrotik API Update Error: ${error.message}`);
      // Do not throw error here, as the user has already been updated in the DB.
      // Log the error and proceed.
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
  const user = await MikrotikUser.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('Mikrotik User not found');
  }

  // Check for ownership
  if (user.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this Mikrotik user');
  }

  const router = await MikrotikRouter.findById(user.mikrotikRouter);
  if (!router) {
    console.warn(`Associated Mikrotik Router not found for user ${user.username}. Mikrotik de-provisioning skipped.`);
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

      if (user.serviceType === 'pppoe') {
        const pppSecrets = await client.write('/ppp/secret/print', [`?name=${user.username}`]);
        if (pppSecrets.length > 0) {
          const secretId = pppSecrets[0]['.id'];
          try {
            await client.write('/ppp/secret/remove', [`=.id=${secretId}`]);
            console.log(`Mikrotik PPP secret for user ${user.username} removed.`);
          } catch (removeError) {
            if (removeError.errno === 'UNKNOWNREPLY') {
              console.warn(`Mikrotik PPP secret removal for user ${user.username} returned UNKNOWNREPLY, treating as success.`);
            } else {
              throw removeError; // Re-throw other errors
            }
          }
        } else {
          console.warn(`PPP Secret for user ${user.username} not found on Mikrotik. Cannot remove.`);
        }
      } else if (user.serviceType === 'static') {
        const simpleQueues = await client.write('/queue/simple/print', [`?name=${user.username}`]);
        if (simpleQueues.length > 0) {
          const queueId = simpleQueues[0]['.id'];
          // await client.write('/queue/simple/remove', [`=.id=${queueId}`]); // Exceptional: Do not remove simple queue
        console.log(`Mikrotik Simple Queue for user ${user.username} not removed due to exception.`);
        } else {
          console.warn(`Simple Queue for user ${user.username} not found on Mikrotik. Cannot remove.`);
        }
      }
    } catch (error) {
      console.error(`Mikrotik API De-provisioning Error: ${error.message}`);
      // Do not throw error here, as the user should still be removed from the DB.
      // Log the error and proceed.
    } finally {
      if (client) {
        client.close();
      }
    }
  }

  await MikrotikUser.deleteOne({ _id: user._id });

  res.status(200).json({ message: 'Mikrotik User removed' });
});

// @desc    Get PPP Profiles from a Mikrotik Router
// @route   GET /api/mikrotik/routers/:id/ppp-profiles
// @access  Private


// @desc    Get PPP Services from a Mikrotik Router
// @route   GET /api/mikrotik/routers/:id/ppp-services
// @access  Private
const getMikrotikPppServices = asyncHandler(async (req, res) => {
  const router = await MikrotikRouter.findById(req.params.id);

  if (!router) {
    res.status(404);
    throw new Error('Mikrotik Router not found');
  }

  // --- Mikrotik API Integration (Placeholder) ---
  // In a real scenario, you would connect to the router and fetch PPP services.
  // Note: PPP services are usually a fixed list in RouterOS, but we agreed to fetch them.
  // Example:
  // const conn = new MikrotikAPI({ host: router.ipAddress, user: router.apiUsername, password: router.apiPassword, port: router.apiPort });
  // await conn.connect();
  // const services = await conn.write('/ppp/service/print'); // This command might not exist, usually fixed list
  // await conn.close();
  // res.status(200).json(services.map(s => s.name));
  // ------------------------------------------------

  res.status(200).json(['any', 'async', 'l2tp', 'ovpn', 'pppoe', 'pptp', 'sstp']); // Mock data
});

// @desc    Get Mikrotik Clients (for SMS dropdowns)
// @route   GET /api/mikrotik/users/clients-for-sms
// @access  Private
const getMikrotikClientsForSms = asyncHandler(async (req, res) => {
  const clients = await MikrotikUser.find({}).select('_id officialName mobileNumber');
  res.status(200).json(clients);
});

// @desc    Get count of new subscribers for the current month
// @route   GET /api/mikrotik/users/stats/monthly-new-subscribers
// @access  Private/Admin
const getMonthlyNewSubscribers = asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const count = await MikrotikUser.countDocuments({
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  res.status(200).json({ count });
});

// @desc    Get count of paid subscribers for the current month
// @route   GET /api/mikrotik/users/stats/monthly-paid-subscribers
// @access  Private/Admin
const getMonthlyPaidSubscribers = asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const count = await MikrotikUser.countDocuments({
    expiryDate: { $gte: new Date() }, // Expiry date is in the future
    createdAt: { $gte: startOfMonth, $lte: endOfMonth }, // Created in the current month
  });

  res.status(200).json({ count });
});

// @desc    Get monthly total subscribers for a given year
// @route   GET /api/mikrotik/users/stats/monthly-total-subscribers/:year
// @access  Private/Admin
const getMonthlyTotalSubscribers = asyncHandler(async (req, res) => {
  const { year } = req.params;

  const monthlyTotals = [];

  for (let i = 0; i < 12; i++) {
    const startOfMonth = new Date(year, i, 1);
    const endOfMonth = new Date(year, i + 1, 0); // Last day of the month

    const count = await MikrotikUser.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

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
  console.log(`Checking status for user ID: ${req.params.id}`);
  const user = await MikrotikUser.findById(req.params.id).populate('mikrotikRouter').populate('package');

  if (!user) {
    console.log(`User with ID: ${req.params.id} not found.`);
    res.status(404);
    throw new Error('Mikrotik User not found');
  }
  console.log(`Found user: ${user.username}, serviceType: ${user.serviceType}`);

  const router = user.mikrotikRouter;

  if (!router) {
    console.log(`Associated Mikrotik Router not found for user ${user.username}.`);
    res.status(404);
    throw new Error('Associated Mikrotik Router not found');
  }
  console.log(`Found router: ${router.name}, IP: ${router.ipAddress}`);

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
    console.log(`Connected to router ${router.name}.`);

    let status = 'offline';

    if (user.serviceType === 'pppoe') {
      console.log(`Checking PPPoE active for user: ${user.username}`);
      const pppActive = await client.write('/ppp/active/print');
      if (pppActive.some(session => session.name === user.username)) {
        status = 'online';
      }
    } else if (user.serviceType === 'static') {
      console.log(`Pinging static user IP: ${user.ipAddress}`);
      const pingReplies = await client.write('/ping', [`=address=${user.ipAddress}`, '=count=2']); // Send 2 pings for reliability
      
      // Check if any of the replies indicate a successful ping (e.g., has a 'time' field)
      if (pingReplies.some(reply => reply.time)) {
        status = 'online';
      }
    }

    await client.close();
    console.log(`Connection closed. Status: ${status}`);
    res.status(200).json({ status });
  } catch (error) {
    console.error(`Mikrotik API Error (User Status): ${error.message}`);
    try { if (client) client.close(); } catch (e) { /* ignore */ }
    res.status(200).json({ status: 'offline' }); // Return offline on any API error
  }
});

// @desc    Get Mikrotik User Traffic Statistics
// @route   GET /api/mikrotik/users/:id/traffic
// @access  Private
const getMikrotikUserTraffic = asyncHandler(async (req, res) => {
  console.log(`Fetching traffic for user ID: ${req.params.id}`);
  const user = await MikrotikUser.findById(req.params.id).populate('mikrotikRouter');

  if (!user) {
    console.log(`User with ID: ${req.params.id} not found.`);
    res.status(404);
    throw new Error('Mikrotik User not found');
  }
  console.log(`Found user: ${user.username}, serviceType: ${user.serviceType}`);

  const router = user.mikrotikRouter;

  if (!router) {
    console.log(`Associated Mikrotik Router not found for user ${user.username}.`);
    res.status(404);
    throw new Error('Associated Mikrotik Router not found');
  }
  console.log(`Found router: ${router.name}, IP: ${router.ipAddress}`);

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
    console.log(`Connected to router ${router.name}.`);

    let trafficData = {
      rxRate: 0, // receive rate (download)
      txRate: 0, // transmit rate (upload)
      rxBytes: 0, // received bytes (total download)
      txBytes: 0, // transmitted bytes (total upload)
    };

    if (user.serviceType === 'pppoe') {
      console.log(`Checking for active PPPoE session for user: ${user.username}`);
      const allPppActiveSessions = await client.write('/ppp/active/print');
      const pppActiveSessions = allPppActiveSessions.filter(session => session.name === user.username);
      console.log(`Raw PPPoE active sessions for ${user.username}:`, pppActiveSessions);

      if (pppActiveSessions.length > 0) {
        const activeSession = pppActiveSessions[0];
        const userIpAddress = activeSession.address;
        console.log(`Active PPPoE session found. User IP: ${userIpAddress}. Now trying to find corresponding interface by fetching all IP addresses.`);

        if (userIpAddress) {
          const allIpAddresses = await client.write('/ip/address/print'); // Fetch all IP addresses
          console.log(`Raw all IP addresses from Mikrotik:`, allIpAddresses);

          const ipAddressEntry = allIpAddresses.find(ip => {
            const networkAddress = ip.network ? ip.network.split('/')[0] : null;
            return networkAddress === userIpAddress;
          }); // Find matching IP by network property, stripping CIDR
          
          if (ipAddressEntry) {
            const interfaceName = ipAddressEntry.interface;
            console.log(`Found interface for IP ${userIpAddress}: ${interfaceName}`);

            if (interfaceName) {
              console.log(`Monitoring traffic on interface: ${interfaceName}`);
              const trafficMonitor = await client.write('/interface/monitor-traffic', [`=interface=${interfaceName}`, '=once']);
              console.log(`Raw traffic monitor data for interface ${interfaceName}:`, trafficMonitor);

              if (trafficMonitor.length > 0) {
                const trafficDataEntry = trafficMonitor[0];
                trafficData.rxRate = parseInt(trafficDataEntry['rx-bits-per-second'] || '0', 10) / 8; // Convert bits/s to bytes/s
                trafficData.txRate = parseInt(trafficDataEntry['tx-bits-per-second'] || '0', 10) / 8; // Convert bits/s to bytes/s
                trafficData.rxBytes = parseInt(trafficDataEntry['rx-bytes'] || '0', 10);
                trafficData.txBytes = parseInt(trafficDataEntry['tx-bytes'] || '0', 10);
              }
            } else {
              console.warn(`No interface found for IP address entry ${userIpAddress}.`);
            }
          } else {
            console.warn(`No matching IP address entry found for ${userIpAddress} in /ip/address/print.`);
          }
        } else {
          console.warn(`User ${user.username} has no IP address in active session.`);
        }
      } else {
        console.log(`No active PPPoE session found for user ${user.username}.`);
      }
    } else if (user.serviceType === 'static') {
      console.log(`Fetching simple queue for user: ${user.username}`);
      const simpleQueue = await client.write('/queue/simple/print', [`?name=${user.username}`]);
      console.log(`Raw simple queue for user ${user.username} from Mikrotik:`, simpleQueue); // Added logging
      if (simpleQueue.length > 0) {
        const queue = simpleQueue[0];
        console.log(`Found simple queue for user ${user.username}:`, queue);

        if (queue.bytes) {
          const [txBytes, rxBytes] = queue.bytes.split('/');
          trafficData.rxBytes = parseInt(txBytes, 10);
          trafficData.txBytes = parseInt(rxBytes, 10);
        }

        if (queue.rate) {
          const [txRate, rxRate] = queue.rate.split('/');
          trafficData.rxRate = parseInt(txRate, 10) / 8; // Convert bps to Bps
          trafficData.txRate = parseInt(rxRate, 10) / 8; // Convert bps to Bps
        }
      }
    }

    await client.close();
    console.log(`Connection closed. Traffic data:`, trafficData);
    res.status(200).json(trafficData);
  } catch (error) {
    console.error(`Mikrotik API Error (User Traffic): ${error.message}`);
    try { if (client) client.close(); } catch (e) { /* ignore */ }
    // If there's an error (e.g., user not found, router unreachable), return zero traffic
    res.status(200).json({
      rxRate: 0,
      txRate: 0,
      rxBytes: 0,
      txBytes: 0,
      error: `Could not fetch traffic: ${error.message}`
    });
  }
});

// @desc    Get all Mikrotik Users for a specific station
// @route   GET /api/devices/:stationId/users
// @access  Private
const getMikrotikUsersByStation = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  const users = await MikrotikUser.find({ station: stationId })
    .populate('package')
    .populate('mikrotikRouter', 'name');
  res.status(200).json(users);
});

// @desc    Get Downtime Logs for a Mikrotik User
// @route   GET /api/mikrotik/users/:userId/downtime-logs
// @access  Private/Admin
const getDowntimeLogs = asyncHandler(async (req, res) => {
  // First, ensure the MikrotikUser exists and belongs to the requesting user.
  const mikrotikUser = await MikrotikUser.findById(req.params.userId);
  if (!mikrotikUser || mikrotikUser.user.toString() !== req.user._id.toString()) {
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

  const filter = {
    expiryDate: { $lt: today },
  };

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
        const user = await MikrotikUser.findById(userId);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        // Check for ownership
        if (user.user.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to view payment stats for this Mikrotik user');
        }

        // Fetch application settings to get the grace period
        const settings = await ApplicationSettings.findOne({ user: req.user._id });
        const gracePeriodDays = settings ? settings.paymentGracePeriodDays : 3; // Default to 3 if not set

        const transactions = await WalletTransaction.find({ user: req.user._id, mikrotikUser: userId }).sort({ createdAt: 'asc' });

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
                // Handle cases where a debit exists but has not been paid yet
                const today = new Date();
                const daysDelayed = (today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24);
                paymentHistory.push({
                    billId: debit._id,
                    dueDate: debit.createdAt,
                    paidDate: null, // No payment date
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
  getMikrotikUsersByStation,
  getDowntimeLogs,
  getDelayedPayments,
  getUserPaymentStats,
};