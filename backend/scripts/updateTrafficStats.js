const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const TrafficLog = require('../models/TrafficLog');
const RouterOSAPI = require('node-routeros').RouterOSAPI;
const { decrypt } = require('../utils/crypto');

const updateTrafficStats = async () => {
  console.log('Starting traffic stats update...');
  await connectDB();
  const users = await MikrotikUser.find({}).populate('mikrotikRouter');

  for (const user of users) {
    if (!user.mikrotikRouter) {
      console.log(`User ${user.username} has no router assigned, skipping.`);
      continue;
    }

    const router = user.mikrotikRouter;
    let client;

    try {
      client = new RouterOSAPI({
        host: router.ipAddress,
        user: router.apiUsername,
        password: decrypt(router.apiPassword),
        port: router.apiPort,
        timeout: 10000,
      });
      await client.connect();

      let currentUpload = 0;
      let currentDownload = 0;

      if (user.serviceType === 'pppoe') {
        const pppSecrets = await client.write('/ppp/secret/print', [`?name=${user.username}`]);
        if (pppSecrets.length > 0) {
          const secret = pppSecrets[0];
          const [upload, download] = (secret.bytes || "0/0").split('/').map(Number);
          currentUpload = upload;
          currentDownload = download;
        }
      } else if (user.serviceType === 'static') {
        const simpleQueues = await client.write('/queue/simple/print', [`?name=${user.username}`]);
        if (simpleQueues.length > 0) {
          const queue = simpleQueues[0];
          const [upload, download] = (queue.bytes || "0/0").split('/').map(Number);
          currentUpload = upload;
          currentDownload = download;
        }
      }

      const lastUpload = user.lastUpload || 0;
      const lastDownload = user.lastDownload || 0;

      let uploadDelta = 0;
      let downloadDelta = 0;

      // Handle counter reset or initial run
      if (user.lastCounterTimestamp) { // This is a subsequent run
        if (currentUpload < lastUpload) { // Counter reset
          uploadDelta = currentUpload;
        } else {
          uploadDelta = currentUpload - lastUpload;
        }

        if (currentDownload < lastDownload) { // Counter reset
          downloadDelta = currentDownload;
        } else {
          downloadDelta = currentDownload - lastDownload;
        }
      } else { // This is the very first run for this user
        uploadDelta = currentUpload;
        downloadDelta = currentDownload;
      }
      
      if (uploadDelta > 0 || downloadDelta > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await TrafficLog.findOneAndUpdate(
          { user: user._id, date: today },
          { $inc: { upload: uploadDelta, download: downloadDelta } },
          { upsert: true, new: true }
        );
      }

      // Update user's last counter values
      user.lastUpload = currentUpload;
      user.lastDownload = currentDownload;
      user.lastCounterTimestamp = new Date();
      await user.save();

      console.log(`Updated traffic for ${user.username}: Down: ${downloadDelta}, Up: ${uploadDelta}`);

    } catch (error) {
      console.error(`Error updating traffic for user ${user.username}:`, error.message);
    } finally {
      if (client && client.connected) {
        client.close();
      }
    }
  }
  console.log('Finished traffic stats update.');
  mongoose.disconnect();
};

updateTrafficStats();
