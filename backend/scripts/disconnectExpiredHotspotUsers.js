const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Tenant = require('../models/Tenant');
const HotspotUser = require('../models/HotspotUser');
const HotspotSession = require('../models/HotspotSession');
const MikrotikRouter = require('../models/MikrotikRouter');
const { getMikrotikApiClient } = require('../utils/mikrotikUtils');

const disconnectExpiredHotspotUsers = async () => {
  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Tenant ID is required as a command-line argument.');
    process.exit(1);
  }

  await connectDB();
  console.log('Connected to MongoDB.');

  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant || tenant.status !== 'active') {
      console.log(`Tenant ${tenantId} not found or is not active. Exiting.`);
      return;
    }
    
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
      let conn;
      try {
        conn = await getMikrotikApiClient(user.mikrotikRouter);
        if (!conn) {
          console.error(`    - Could not connect to router ${user.mikrotikRouter.name}.`);
          continue;
        }
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

      } catch (error) {
        console.error(`    - Error processing user ${user.hotspotName}:`, error.message);
      } finally {
        if (conn) {
          conn.close();
        }
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
      // TODO: Add a router reference to the HotspotSession model
      const router = await MikrotikRouter.findOne({ tenant: tenant._id });
      if (!router) {
        console.log(`  - Skipping session for ${session.macAddress} because no router was found for the tenant.`);
        continue;
      }

      let conn;
      try {
        conn = await getMikrotikApiClient(router);
        if (!conn) {
          console.error(`    - Could not connect to router ${router.name}.`);
          continue;
        }
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
        
        // After disconnecting, we should delete the expired session from our database
        await HotspotSession.findByIdAndDelete(session._id);
        console.log(`    - Deleted expired session from database.`);

      } catch (error) {
        console.error(`    - Error processing session for ${session.macAddress}:`, error.message);
      } finally {
        if (conn) {
          conn.close();
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
