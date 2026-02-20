const mongoose = require('mongoose');
const MikrotikUser = require('../models/MikrotikUser');
const WalletTransaction = require('../models/WalletTransaction');
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue');
const { sendAcknowledgementSms } = require('./smsService');
const smsTriggers = require('../constants/smsTriggers');

/**
 * Helper to generate a unique 6-digit number for M-Pesa Reference.
 */
const generateUnique6DigitNumber = async (tenant) => {
  let isUnique = false;
  let randomNumber;
  while (!isUnique) {
    randomNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const existingUser = await MikrotikUser.findOne({ mPesaRefNo: randomNumber, tenant });
    if (!existingUser) isUnique = true;
  }
  return randomNumber;
};

/**
 * Helper to generate a random 6-letter string.
 */
const generateRandom6LetterString = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const UserService = {
  /**
   * Creates a new user and handles initial fees/SMS.
   */
  createMikrotikUser: async (userData, tenantId) => {
    let { mPesaRefNo, installationFee, sendWelcomeSms } = userData;

    // 1. Handle Reference Number generation
    if (mPesaRefNo === 'generate_6_digit_number') {
      mPesaRefNo = await generateUnique6DigitNumber(tenantId);
    } else if (mPesaRefNo === 'generate_6_letter_string') {
      mPesaRefNo = generateRandom6LetterString();
    }

    // 2. Create User in DB
    const mikrotikUser = await MikrotikUser.create({
      ...userData,
      mPesaRefNo,
      tenant: tenantId,
      provisionedOnMikrotik: false,
      syncStatus: 'pending',
    });

    // 3. Handle Installation Fee
    if (installationFee && parseFloat(installationFee) > 0) {
      const fee = parseFloat(installationFee);
      mikrotikUser.walletBalance -= fee;

      await WalletTransaction.create({
        tenant: tenantId,
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

    // 4. Trigger Hardware Sync
    await mikrotikSyncQueue.add('syncUser', {
      mikrotikUserId: mikrotikUser._id,
      tenantId,
    });

    // 5. Send Welcome SMS
    if (sendWelcomeSms) {
      sendAcknowledgementSms(smsTriggers.MIKROTIK_USER_CREATED, mikrotikUser.mobileNumber, {
        officialName: mikrotikUser.officialName,
        mPesaRefNo: mikrotikUser.mPesaRefNo,
        tenant: tenantId,
        mikrotikUser: mikrotikUser._id
      }).catch(err => console.error('[UserService] Welcome SMS failed:', err.message));
    }

    return mikrotikUser;
  },

  getPopulatedMikrotikUsers: async (tenantId) => {
    const query = { tenant: tenantId };
    const users = await MikrotikUser.find(query)
      .populate('mikrotikRouter')
      .populate('package')
      .populate('station');
    return users;
  },

  getPopulatedMikrotikUserById: async (userId, tenantId) => {
    const query = { _id: userId, tenant: tenantId };
    const user = await MikrotikUser.findOne(query)
      .populate('mikrotikRouter')
      .populate('package')
      .populate('station');
    return user;
  },

  getMikrotikClientsForSms: async (tenantId) => {
    const query = { tenant: tenantId };
    const clients = await MikrotikUser.find(query).select('_id officialName mobileNumber expiryDate');
    return clients;
  },

  getMonthlyNewSubscribers: async (tenantId) => {
    const query = { tenant: tenantId };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

    const count = await MikrotikUser.countDocuments(query);
    return { count };
  },

  getMonthlyPaidSubscribers: async (tenantId) => {
    const query = { tenant: tenantId };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    query.expiryDate = { $gte: new Date() };
    query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

    const count = await MikrotikUser.countDocuments(query);
    return { count };
  },

  getMonthlyTotalSubscribers: async (year, tenantId) => {
    const query = { tenant: tenantId };

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
    return monthlyTotals;
  },

  getMikrotikUserStatus: async (userId, tenantId) => {
    const query = { _id: userId, tenant: tenantId };

    const user = await MikrotikUser.findOne(query).populate('mikrotikRouter').populate('package');

    if (!user) {
      throw new Error('Mikrotik User not found');
    }

    const router = user.mikrotikRouter;

    if (!router) {
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
      return { status };
    } catch (error) {
      return { status: 'offline' }; // Return offline on any API error
    }
  },

  getMikrotikUserTraffic: async (userId, tenantId) => {
    const query = { _id: userId, tenant: tenantId };

    const user = await MikrotikUser.findOne(query).populate('mikrotikRouter');

    if (!user) {
      throw new Error('Mikrotik User not found');
    }

    const router = user.mikrotikRouter;

    if (!router) {
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
        console.log('Fetching traffic for PPPoE user:', user.username);
        const pppActiveUsers = await client.write('/ppp/active/print', [
          '=.proplist=name,interface'
        ]);
        console.log('PPP Active Users:', pppActiveUsers);
        const activeUser = pppActiveUsers.find(u => u.name === user.username);
        if (activeUser) {
          console.log('Active User Found:', activeUser);
          const interfaceName = activeUser.interface;
          const monitor = await client.write('/interface/monitor-traffic', [
            `=interface=${interfaceName}`,
            '=once='
          ]);
          console.log('Monitor Result:', monitor);
          if (monitor.length > 0) {
            trafficData.rxRate = parseInt(monitor[0]['rx-bits-per-second'], 10) / 8;
            trafficData.txRate = parseInt(monitor[0]['tx-bits-per-second'], 10) / 8;
          }
        } else {
          console.log('Active user not found');
        }
      } else if (user.serviceType === 'static') {
        console.log('Fetching traffic for static user:', user.username);
        const simpleQueues = await client.write('/queue/simple/print', [
          `?name=${user.username}`,
          '=.proplist=rate,bytes'
        ]);
        console.log('Simple Queues:', simpleQueues);
        if (simpleQueues.length > 0) {
          const [rxRate, txRate] = simpleQueues[0].rate.split('/');
          trafficData.rxRate = parseInt(rxRate, 10);
          trafficData.txRate = parseInt(txRate, 10);
          const [rxBytes, txBytes] = simpleQueues[0].bytes.split('/');
          trafficData.rxBytes = parseInt(rxBytes, 10);
          trafficData.txBytes = parseInt(txBytes, 10);
        }
      }

      await client.close();
      return trafficData;
    } catch (error) {
      return { rxRate: 0, txRate: 0, rxBytes: 0, txBytes: 0, error: `Could not fetch traffic: ${error.message}` };
    }
  },

  getMikrotikUsersByStation: async (stationId, tenantId) => {
    const query = { station: stationId, tenant: tenantId };

    const users = await MikrotikUser.find(query)
      .populate('package')
      .populate('mikrotikRouter', 'name');
    return users;
  },

  getDowntimeLogs: async (userId, tenantId) => {
    const query = { _id: userId, tenant: tenantId };

    const mikrotikUser = await MikrotikUser.findOne(query);
    if (!mikrotikUser) {
      throw new Error('Mikrotik user not found or not authorized');
    }

    const logs = await UserDowntimeLog.find({ mikrotikUser: userId }).sort({ downStartTime: -1 });
    return logs;
  },

  getDelayedPayments: async (daysOverdue, nameSearch, tenantId) => {
    if (!daysOverdue) {
      throw new Error('days_overdue query parameter is required');
    }

    const days = parseInt(daysOverdue, 10);
    if (isNaN(days)) {
      throw new Error('days_overdue must be a number');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter = { tenant: tenantId };

    filter.expiryDate = { $lt: today };

    if (nameSearch) {
      filter.$or = [
        { officialName: { $regex: nameSearch, $options: 'i' } },
        { username: { $regex: nameSearch, $options: 'i' } },
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

    return usersWithDaysOverdue;
  },

  getUserPaymentStats: async (userId, tenantId) => {
    try {
        const userQuery = { _id: userId, tenant: tenantId };

        const user = await MikrotikUser.findOne(userQuery);

        if (!user) {
            throw new Error('User not found');
        }

        // Query for M-Pesa transactions linked to this Mikrotik user
        const mpesaTransactions = await Transaction.find({
            mikrotikUser: userId,
            tenant: tenantId,
            paymentMethod: { $regex: /M-Pesa/i } // Find all M-Pesa related payments
        }).sort({ transactionDate: -1 });

        // Calculate statistics
        const totalSpentMpesa = mpesaTransactions.reduce((acc, curr) => acc + curr.amount, 0);
        const totalMpesaTransactions = mpesaTransactions.length;
        const lastMpesaPayment = totalMpesaTransactions > 0 ? mpesaTransactions[0] : null;
        const averageMpesaTransaction = totalMpesaTransactions > 0 ? totalSpentMpesa / totalMpesaTransactions : 0;

        return {
            totalSpentMpesa,
            lastMpesaPaymentDate: lastMpesaPayment ? lastMpesaPayment.transactionDate : null,
            lastMpesaPaymentAmount: lastMpesaPayment ? lastMpesaPayment.amount : null,
            totalMpesaTransactions,
            averageMpesaTransaction,
            mpesaTransactionHistory: mpesaTransactions, // Send the full history
        };
    } catch (error) {
        console.error(`Error fetching M-Pesa payment stats for user ${userId}:`, error);
        throw new Error('Internal Server Error');
    }
  },
  updateUser: async (id, updateData, tenantId) => {
    const user = await MikrotikUser.findOne({ _id: id, tenant: tenantId });
    if (!user) throw new Error('User not found');

    let needsSync = false;

    // Check if package or macAddress changed (hardware impacting)
    if (updateData.package && user.package.toString() !== updateData.package) {
      user.pendingPackage = updateData.package;
      needsSync = true;
    }
    if (updateData.macAddress && user.macAddress !== updateData.macAddress) {
      needsSync = true;
    }
    if (updateData.username && user.username !== updateData.username) {
        needsSync = true;
    }
    if (updateData.isSuspended !== undefined && user.isSuspended !== updateData.isSuspended) {
      needsSync = true;
    }

    // Apply updates
    Object.assign(user, updateData);

    if (needsSync) {
      user.syncStatus = 'pending';
    }

    const updatedUser = await user.save();

    if (needsSync) {
      await mikrotikSyncQueue.add('syncUser', {
        mikrotikUserId: updatedUser._id,
        tenantId,
      });
    }

    return updatedUser;
  },

  /**
   * Marks a user for deletion and triggers removal from hardware.
   */
  deleteUser: async (id, tenantId) => {
    const user = await MikrotikUser.findOne({ _id: id, tenant: tenantId });
    if (!user) throw new Error('User not found');

    // To be truly state-based, we'd need a 'isDeleted' flag.
    // For now, we'll use a specific job to ensure removal before DB deletion.
    await mikrotikSyncQueue.add('removeUser', {
      username: user.username,
      serviceType: user.serviceType,
      routerId: user.mikrotikRouter,
      tenantId,
    });

    await user.deleteOne();
    return { success: true };
  }
};

module.exports = UserService;
