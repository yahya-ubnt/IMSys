const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const MikrotikRouter = require('./models/MikrotikRouter');
const Package = require('./models/Package');
const MikrotikUser = require('./models/MikrotikUser');
const ApplicationSettings = require('./models/ApplicationSettings');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const { encrypt } = require('./utils/crypto');

// Configure dotenv to use the root .env file
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

connectDB();

const importData = async () => {
  try {
    console.log('Wiping existing user and router data...');
    await User.deleteMany();
    await MikrotikRouter.deleteMany();
    await Package.deleteMany();
    await MikrotikUser.deleteMany();
    console.log('Data wiped.');

    console.log('Creating admin user...');
    const users = [
      {
        fullName: 'Admin User',
        email: 'admin@example.com',
        phone: '+254700000000',
        password: 'Abuhureira12',
        isAdmin: true,
      },
    ];
    const createdUsers = await User.create(users);
    console.log('Admin user created.');

    const adminUser = createdUsers[0];

    console.log('Creating production router...');
    const router = await MikrotikRouter.create({
      user: adminUser._id,
      name: 'AMANI ESTATE MIK',
      ipAddress: '10.10.10.1',
      apiUsername: 'admin',
      apiPassword: encrypt('0741554490#'),
      apiPort: 8728,
    });
    console.log('Production router created:', router.name);

    console.log('Creating test package...');
    const testPackage = await Package.create({
      user: adminUser._id,
      mikrotikRouter: router._id,
      serviceType: 'pppoe',
      name: 'Test Package',
      price: 1000,
      profile: 'Test Package',
    });
    console.log('Test package created:', testPackage.name);

    console.log('Creating test Mikrotik user...');
    const mikrotikUser = await MikrotikUser.create({
        user: adminUser._id,
        mikrotikRouter: router._id,
        serviceType: 'pppoe',
        package: testPackage._id,
        username: 'testuser',
        pppoePassword: 'password',
        officialName: 'Test User',
        mPesaRefNo: 'TESTUSER',
        billingCycle: 'Monthly',
        mobileNumber: '254708374149',
        expiryDate: new Date(),
    });
    console.log('Test Mikrotik user created:', mikrotikUser.username);

    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error('Error during data import:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
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
