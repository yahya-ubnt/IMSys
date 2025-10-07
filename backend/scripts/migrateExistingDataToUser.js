const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MikrotikRouter = require('../models/MikrotikRouter');
const MikrotikUser = require('../models/MikrotikUser');
const Device = require('../models/Device');
const ApplicationSettings = require('../models/ApplicationSettings');
const DailyTransaction = require('../models/DailyTransaction');
const DiagnosticLog = require('../models/DiagnosticLog');
const DowntimeLog = require('../models/DowntimeLog');
const UserDowntimeLog = require('../models/UserDowntimeLog');
const Expense = require('../models/Expense');
const ExpenseType = require('../models/ExpenseType');
const WalletTransaction = require('../models/WalletTransaction');
const WhatsAppLog = require('../models/WhatsAppLog');
const WhatsAppProvider = require('../models/WhatsAppProvider');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const SmsAcknowledgement = require('../models/SmsAcknowledgement');
const SmsExpirySchedule = require('../models/SmsExpirySchedule');
const SmsTemplate = require('../models/SmsTemplate');
const Lead = require('../models/Lead');
const Package = require('../models/Package');
const Transaction = require('../models/Transaction');
const User = require('../models/User'); // Assuming this is your main User model

dotenv.config({ path: './.env' });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const migrateDataToUser = async (adminUserId) => {
  if (!adminUserId) {
    console.error('Admin User ID is required to perform migration.');
    return;
  }

  const modelsToMigrate = [
    MikrotikRouter,
    MikrotikUser,
    Device,
    ApplicationSettings,
    DailyTransaction,
    DiagnosticLog,
    DowntimeLog,
    UserDowntimeLog,
    Expense,
    ExpenseType,
    WalletTransaction,
    WhatsAppLog,
    WhatsAppProvider,
    WhatsAppTemplate,
    SmsAcknowledgement,
    SmsExpirySchedule,
    SmsTemplate,
    Lead,
    Package,
    Transaction,
  ];

  for (const Model of modelsToMigrate) {
    try {
      // Find documents that do not have a 'user' field
      const query = { user: { $exists: false } };
      
      // For DiagnosticLog and UserDowntimeLog, also check mikrotikUser field
      if (Model.modelName === 'DiagnosticLog') {
        query.mikrotikUser = { $exists: false };
      } else if (Model.modelName === 'UserDowntimeLog') {
        query.mikrotikUser = { $exists: false };
      } else if (Model.modelName === 'WalletTransaction') {
        query.mikrotikUser = { $exists: false };
      }

      const result = await Model.updateMany(query, { $set: { user: adminUserId } });
      console.log(`Migrated ${result.modifiedCount} documents in ${Model.modelName}.`);

      // Special handling for DiagnosticLog and UserDowntimeLog to set mikrotikUser if missing
      if (Model.modelName === 'DiagnosticLog') {
        const logsWithoutMikrotikUser = await Model.find({ mikrotikUser: { $exists: false }, user: adminUserId });
        for (const log of logsWithoutMikrotikUser) {
          const mikrotikUser = await MikrotikUser.findOne({ user: adminUserId }); // Find any MikrotikUser for the admin
          if (mikrotikUser) {
            log.mikrotikUser = mikrotikUser._id;
            await log.save();
          }
        }
        console.log(`Updated mikrotikUser for ${logsWithoutMikrotikUser.length} DiagnosticLog documents.`);
      } else if (Model.modelName === 'UserDowntimeLog') {
        const logsWithoutMikrotikUser = await Model.find({ mikrotikUser: { $exists: false }, user: adminUserId });
        for (const log of logsWithoutMikrotikUser) {
          const mikrotikUser = await MikrotikUser.findOne({ user: adminUserId }); // Find any MikrotikUser for the admin
          if (mikrotikUser) {
            log.mikrotikUser = mikrotikUser._id;
            await log.save();
          }
        }
        console.log(`Updated mikrotikUser for ${logsWithoutMikrotikUser.length} UserDowntimeLog documents.`);
      } else if (Model.modelName === 'WalletTransaction') {
        const transactionsWithoutMikrotikUser = await Model.find({ mikrotikUser: { $exists: false }, user: adminUserId });
        for (const transaction of transactionsWithoutMikrotikUser) {
          const mikrotikUser = await MikrotikUser.findOne({ user: adminUserId }); // Find any MikrotikUser for the admin
          if (mikrotikUser) {
            transaction.mikrotikUser = mikrotikUser._id;
            await transaction.save();
          }
        }
        console.log(`Updated mikrotikUser for ${transactionsWithoutMikrotikUser.length} WalletTransaction documents.`);
      }

    } catch (error) {
      console.error(`Error migrating ${Model.modelName}:`, error.message);
    }
  }
  console.log('Data migration complete.');
};

const runMigration = async () => {
  await connectDB();

  // IMPORTANT: Replace with the actual _id of the admin user who owns the existing data
  // You can find this ID in your database or by logging in and inspecting req.user._id
  const adminUserId = process.env.ADMIN_USER_ID; 

  if (!adminUserId) {
    console.error('Please set ADMIN_USER_ID in your .env file or directly in the script.');
    process.exit(1);
  }

  await migrateDataToUser(adminUserId);
  mongoose.disconnect();
};

runMigration();
