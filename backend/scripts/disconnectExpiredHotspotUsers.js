const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Tenant = require('../models/Tenant');
const HotspotUser = require('../models/HotspotUser');
const HotspotSession = require('../models/HotspotSession');
const MikrotikRouter = require('../models/MikrotikRouter');
const { connect, disconnect } = require('../utils/mikrotikUtils'); // Assuming this utility exists

const disconnectExpiredHotspotUsers = async () => {
  await connectDB();
  console.log('Connected to MongoDB.');

  try {
    const tenants = await Tenant.find({ status: 'active' });
    console.log(`Found ${tenants.length} active tenant(s).`);

    for (const tenant of tenants) {
      console.log(`Processing tenant: ${tenant.name} (${tenant._id})`);

      // 1. Handle expired HotspotUsers
      const expiredUsers = await HotspotUser.find({
        tenant: tenant._id,
        expiryDate: { $lt: new Date() },
      }).populate('mikrotikRouter');

      for (const user of expiredUsers) {
        if (!user.mikrotikRouter) {
          console.log(`  - Skipping user ${user.hotspotName} because they have no associated router.`);
          continue;
        }
        console.log(`  - Found expired HotspotUser: ${user.hotspotName}`);
        try {
          const conn = await connect(user.mikrotikRouter);
          console.log(`    - Connected to router ${user.mikrotikRouter.name}.`);
          
          // Find the active hotspot user by their name and remove them
          const activeUser = await conn.write('/ip/hotspot/active/print', [`?user=${user.hotspotName}`]);
          if (activeUser && activeUser.length > 0) {
            const userId = activeUser[0]['.id'];
            await conn.write('/ip/hotspot/active/remove', [`=.id=${userId}`]);
            console.log(`    - Successfully disconnected active session for ${user.hotspotName}.`);
          } else {
            console.log(`    - No active session found for ${user.hotspotName}.`);
          }

          // Optionally, you might want to remove the user from the main hotspot user list as well
          // await conn.write('/ip/hotspot/user/remove', [`=.name=${user.hotspotName}`]);
          // console.log(`    - Successfully removed user profile for ${user.hotspotName}.`);

          disconnect(conn);
        } catch (error) {
          console.error(`    - Error processing user ${user.hotspotName}:`, error.message);
        }
      }

      // 2. Handle expired HotspotSessions
      const expiredSessions = await HotspotSession.find({
        tenant: tenant._id,
        endTime: { $lt: new Date() },
      });

      for (const session of expiredSessions) {
        console.log(`  - Found expired HotspotSession for MAC: ${session.macAddress}`);
        // To disconnect a session, we need to find which router it's on.
        // This logic might need to be more complex if a tenant has multiple routers.
        // For now, we'll assume the first router for the tenant.
        const router = await MikrotikRouter.findOne({ tenant: tenant._id });
        if (!router) {
          console.log(`  - Skipping session for ${session.macAddress} because no router was found for the tenant.`);
          continue;
        }

        try {
          const conn = await connect(router);
          console.log(`    - Connected to router ${router.name}.`);

          // Find the active hotspot user by their MAC address and remove them
          const activeUser = await conn.write('/ip/hotspot/active/print', [`?mac-address=${session.macAddress}`]);
          if (activeUser && activeUser.length > 0) {
            const userId = activeUser[0]['.id'];
            await conn.write('/ip/hotspot/active/remove', [`=.id=${userId}`]);
            console.log(`    - Successfully disconnected active session for ${session.macAddress}.`);
          } else {
            console.log(`    - No active session found for ${session.macAddress}.`);
          }
          
          disconnect(conn);

          // After disconnecting, we should delete the expired session from our database
          await HotspotSession.findByIdAndDelete(session._id);
          console.log(`    - Deleted expired session from database.`);

        } catch (error) {
          console.error(`    - Error processing session for ${session.macAddress}:`, error.message);
        }
      }
    }
    console.log('Hotspot user cleanup process completed successfully!');
  } catch (error) {
    console.error('Error during hotspot user cleanup process:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

disconnectExpiredHotspotUsers();
