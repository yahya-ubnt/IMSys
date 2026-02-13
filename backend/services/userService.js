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

  /**
   * Updates a user and marks for sync if hardware-impacting changes occur.
   */
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
