const mongoose = require('mongoose');
require('../config/env'); // Load environment variables
const connectDB = require('../config/db');

// Import all models
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

// List of all models to wipe completely
const modelsToWipe = [
  Tenant, ApplicationSettings, Bill, DailyTransaction, Device, DiagnosticLog, DowntimeLog,
  Expense, ExpenseType, HotspotPlan, HotspotUser, Lead, MikrotikRouter,
  MikrotikUser, MpesaAlert, Notification, NotificationLog, Package, ScheduledTask,
  SmsAcknowledgement, SmsExpirySchedule, SmsLog, SmsProvider, SmsTemplate,
  StkRequest, Subscription, TechnicianActivity, Ticket, Transaction, UserDowntimeLog,
  Voucher, WalletTransaction, WhatsAppLog, WhatsAppProvider, WhatsAppTemplate,
];

const wipeData = async () => {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected.');

  console.log('--- STARTING DATABASE WIPE ---');
  console.log('This operation is DESTRUCTIVE and will delete all tenant data.');

  try {
    // 1. Find the Super Admin user
    console.log('Step 1: Finding the SUPER_ADMIN user...');
    const superAdmin = await User.findOne({ roles: 'SUPER_ADMIN' });

    if (!superAdmin) {
      console.error('CRITICAL: No SUPER_ADMIN user found. Aborting wipe to prevent data loss.');
      process.exit(1);
    }
    console.log(`Found SUPER_ADMIN: ${superAdmin.email}. This user will be preserved.`);

    // 2. Delete all other users
    console.log('Step 2: Deleting all other User documents...');
    const userDeleteResult = await User.deleteMany({ _id: { $ne: superAdmin._id } });
    console.log(` -> Deleted ${userDeleteResult.deletedCount} other users.`);

    // 3. Wipe all other collections
    console.log('Step 3: Wiping all other collections...');
    for (const model of modelsToWipe) {
      const modelName = model.modelName;
      console.log(` -> Wiping ${modelName}...`);
      const deleteResult = await model.deleteMany({});
      console.log(`    -> Deleted ${deleteResult.deletedCount} documents from ${modelName}.`);
    }

    console.log('--- DATABASE WIPE COMPLETE ---');
    console.log('Only the SUPER_ADMIN user account remains.');

  } catch (error) {
    console.error('An error occurred during the wipe operation:', error);
    console.error('The database may be in a partially wiped state. Please inspect it.');
    process.exit(1);
  }

  console.log('Script finished.');
  process.exit(0);
};

// Add a confirmation delay to prevent accidental execution
setTimeout(() => {
    console.log('Executing wipe in 5 seconds... Press CTRL+C to cancel.');
    setTimeout(wipeData, 5000);
}, 1000);
