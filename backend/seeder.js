const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tenant = require('./models/Tenant');
const User = require('./models/User');
const MikrotikRouter = require('./models/MikrotikRouter');
const Package = require('./models/Package');
const MikrotikUser = require('./models/MikrotikUser');
const ApplicationSettings = require('./models/ApplicationSettings');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const ScheduledTask = require('./models/ScheduledTask');
const { encrypt } = require('./utils/crypto');

// Configure dotenv to use the root .env file
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const start = async () => {
  await connectDB();

  if (process.argv[2] === '-d') {
    await destroyData();
  } else {
    await importData();
  }
};

start();

const importData = async () => {
  try {
    // Failsafe: Check if data already exists
    const userCount = await User.countDocuments();
    const tenantCount = await Tenant.countDocuments();
    if (userCount > 0 || tenantCount > 0) {
      console.error('ERROR: Data already exists in the database.');
      console.error('The seeder is for initial setup only and will not run on a database with existing data.');
      console.error('Aborting to prevent data loss.');
      process.exit(1);
    }

    console.log('Wiping existing data...');
    await Tenant.deleteMany();
    await User.deleteMany();
    await MikrotikRouter.deleteMany();
    await Package.deleteMany();
    await MikrotikUser.deleteMany();
    await ScheduledTask.deleteMany(); // Wipe scheduled tasks as well
    console.log('Data wiped.');

    // --- Create SUPER_ADMIN ---
    console.log('Creating SUPER_ADMIN user...');
    await User.create({
      fullName: 'Super Admin',
      email: 'superadmin@example.com',
      phone: '+254700000001',
      password: 'superadminpassword',
      roles: ['SUPER_ADMIN'],
    });
    console.log('SUPER_ADMIN user created.');

    // --- Create Automated Backup Task ---
    console.log('Creating Automated Backup Task...');
    await ScheduledTask.create({
      name: 'Automated Database Backup',
      description: 'Daily backup of the MongoDB database. This is a system-level task.',
      scriptPath: 'scripts/runBackup.js',
      schedule: '0 2 * * *', // Every day at 2:00 AM
      isEnabled: true,
    });
    console.log('Automated Backup Task created.');

    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error('Error during data import:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Tenant.deleteMany();
    await User.deleteMany();
    await MikrotikRouter.deleteMany();
    await Package.deleteMany();
    await MikrotikUser.deleteMany();
    await ApplicationSettings.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
