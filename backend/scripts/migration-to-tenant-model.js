const mongoose = require('mongoose');
require('../config/env'); // Load environment variables
const connectDB = require('../config/db');

// Import all models that need to be migrated
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const ApplicationSettings = require('../models/ApplicationSettings');
const Bill = require('../models/Bill');
const DailyTransaction = require('../models/DailyTransaction');
const Device = require('../models/Device');
const DiagnosticLog = require('../models/DiagnosticLog');
const DowntimeLog = require('../models/DowntimeLog');
const Expense = require('../models/Expense');
const ExpenseType = require('../models/ExpenseType');
const HotspotPlan = require('../models/HotspotPlan');
const HotspotUser = require('../models/HotspotUser');
const Lead = require('../models/Lead');
const MikrotikRouter = require('../models/MikrotikRouter');
const MikrotikUser = require('../models/MikrotikUser');
const MpesaAlert = require('../models/MpesaAlert');
const Notification = require('../models/Notification');
const NotificationLog = require('../models/NotificationLog');
const Package = require('../models/Package');
const ScheduledTask = require('../models/ScheduledTask');
const SmsAcknowledgement = require('../models/SmsAcknowledgement');
const SmsExpirySchedule = require('../models/SmsExpirySchedule');
const SmsLog = require('../models/SmsLog');
const SmsProvider = require('../models/SmsProvider');
const SmsTemplate = require('../models/SmsTemplate');
const StkRequest = require('../models/StkRequest');
const Subscription = require('../models/Subscription');
const TechnicianActivity = require('../models/TechnicianActivity');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const UserDowntimeLog = require('../models/UserDowntimeLog');
const Voucher = require('../models/Voucher');
const WalletTransaction = require('../models/WalletTransaction');
const WhatsAppLog = require('../models/WhatsAppLog');
const WhatsAppProvider = require('../models/WhatsAppProvider');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');

// List of all models that have the 'tenantOwner' field
const modelsToMigrate = [
  ApplicationSettings, Bill, DailyTransaction, Device, DiagnosticLog, DowntimeLog,
  Expense, ExpenseType, HotspotPlan, HotspotUser, Lead, MikrotikRouter,
  MikrotikUser, MpesaAlert, Notification, NotificationLog, Package, ScheduledTask,
  SmsAcknowledgement, SmsExpirySchedule, SmsLog, SmsProvider, SmsTemplate,
  StkRequest, Subscription, TechnicianActivity, Ticket, Transaction, UserDowntimeLog,
  Voucher, WalletTransaction, WhatsAppLog, WhatsAppProvider, WhatsAppTemplate,
];

const migrateData = async () => {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected.');

  console.log('Starting data migration to new tenant model...');

  try {
    // Step 1: Create Tenant documents from existing ADMIN_TENANT users
    console.log('Step 1: Finding ADMIN_TENANT users to create new Tenant documents...');
    const adminTenants = await User.find({ roles: 'ADMIN_TENANT' });
    const oldToNewTenantMap = new Map();

    for (const user of adminTenants) {
      console.log(`Processing admin tenant: ${user.fullName} (${user._id})`);
      let tenant = await Tenant.findOne({ name: user.fullName });
      if (!tenant) {
        console.log(` -> Creating new Tenant for ${user.fullName}`);
        [tenant] = await Tenant.create([{ name: user.fullName, status: 'active' }]);
      } else {
        console.log(` -> Tenant named ${user.fullName} already exists. Reusing.`);
      }
      oldToNewTenantMap.set(user._id.toString(), tenant._id);
    }
    console.log(`Created/found ${oldToNewTenantMap.size} new Tenant documents from ${adminTenants.length} admin users.`);

    if (oldToNewTenantMap.size === 0) {
        console.log('No ADMIN_TENANT users found to migrate. The migration might already be complete for tenants.');
    }
    
    // Step 2: Update all User documents
    console.log('Step 2: Updating all User documents...');
    const allUsers = await User.find({});
    for (const user of allUsers) {
      if (user.roles.includes('SUPER_ADMIN')) {
        console.log(` -> Skipping SUPER_ADMIN: ${user.fullName}`);
        continue;
      }

      // Determine the old tenant owner ID. For admins, it's their own ID. For others, it's the tenantOwner field.
      const oldTenantOwnerId = user.tenantOwner ? user.tenantOwner.toString() : (user.roles.includes('ADMIN_TENANT') ? user._id.toString() : null);

      if (!oldTenantOwnerId) {
        console.warn(` -> Could not determine original tenant for user: ${user.fullName}. Skipping.`);
        continue;
      }

      const newTenantId = oldToNewTenantMap.get(oldTenantOwnerId);

      if (newTenantId) {
        // Correctly update roles: replace 'ADMIN_TENANT' with 'ADMIN', keep others.
        const newRoles = user.roles.map(role => role === 'ADMIN_TENANT' ? 'ADMIN' : role);

        await User.updateOne(
          { _id: user._id },
          { 
            $set: { 
              tenant: newTenantId,
              roles: newRoles 
            },
            $unset: { tenantOwner: "" } 
          }
        );
        console.log(` -> Migrated user ${user.fullName}. Set tenant to ${newTenantId} and updated roles to [${newRoles.join(', ')}]`);
      } else {
        console.warn(` -> Could not find new tenant mapping for user: ${user.fullName} (Old tenantOwner: ${oldTenantOwnerId})`);
      }
    }
    console.log('User documents updated.');

    // Step 3: Update all other data models
    console.log('Step 3: Updating all other data models...');
    for (const model of modelsToMigrate) {
      console.log(` -> Migrating collection: ${model.collection.name}`);
      const documents = await model.find({ tenantOwner: { $exists: true } });
      let updateCount = 0;
      for (const doc of documents) {
        if (doc.tenantOwner) {
          const newTenantId = oldToNewTenantMap.get(doc.tenantOwner.toString());
          if (newTenantId) {
            await model.updateOne(
              { _id: doc._id },
              { 
                $set: { tenant: newTenantId },
                $unset: { tenantOwner: "" }
              }
            );
            updateCount++;
          }
        } else {
          console.warn(`Document ${doc._id} in ${model.collection.name} has a null or missing tenantOwner. Skipping.`);
        }
      }
      console.log(`    -> Migrated ${updateCount} documents in ${model.collection.name}.`);
    }
    console.log('All other data models updated.');

    console.log('--- MIGRATION COMPLETE ---');

  } catch (error) {
    console.error('An error occurred during migration:', error);
    console.error('The migration may be in a partially completed state. Please inspect the database.');
    process.exit(1);
  }

  console.log('Migration script finished.');
  process.exit(0);
};

// Execute the script directly
migrateData();

