const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

const fixAdminRoles = async () => {
  console.log('Connecting to database to fix admin roles...');
  await connectDB();
  console.log('Database connected.');

  try {
    const tenants = await Tenant.find({});
    console.log(`Found ${tenants.length} tenants to check.`);

    let updatedCount = 0;

    for (const tenant of tenants) {
      // Find the user who was likely the original admin for this tenant.
      // Our seeder and migration logic used the user's fullName as the tenant name.
      const adminUser = await User.findOne({
        tenant: tenant._id,
        fullName: tenant.name, 
      });

      if (adminUser) {
        // Check if the user has the 'ADMIN' role. If not, add it.
        if (!adminUser.roles.includes('ADMIN')) {
          console.log(`Fixing user: ${adminUser.fullName} (${adminUser.email}). Current roles: [${adminUser.roles.join(', ')}].`);
          adminUser.roles = ['ADMIN']; // Set role to ADMIN
          await adminUser.save();
          console.log(` -> Successfully updated roles to [ADMIN]`);
          updatedCount++;
        } else {
          console.log(`User ${adminUser.fullName} already has ADMIN role. Skipping.`);
        }
      } else {
        console.warn(` -> Could not find a matching admin user for tenant: ${tenant.name}`);
      }
    }

    console.log(`Role fix complete. Updated ${updatedCount} user(s).`);

  } catch (error) {
    console.error('An error occurred while trying to fix roles:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

fixAdminRoles();
