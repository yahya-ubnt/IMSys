const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const MikrotikRouter = require('./models/MikrotikRouter');
const Package = require('./models/Package');
const MikrotikUser = require('./models/MikrotikUser');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

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
    const users = await Promise.all([
      {
        fullName: 'Admin User',
        email: 'admin@example.com',
        phone: '+254700000000',
        password: await bcrypt.hash('Abuhureira12', 10),
        isAdmin: true,
      },
    ]);
    await User.insertMany(users);
    console.log('Admin user created.');

    console.log('Creating production router...');
    const router = await MikrotikRouter.create({
      name: 'AMANI ESTATE MIK',
      ipAddress: '10.10.10.1',
      apiUsername: 'mtek api',
      apiPassword: 'test123',
      apiPort: 8728,
    });
    console.log('Production router created:', router.name);

    console.log('Creating test package...');
    const testPackage = await Package.create({
      name: 'Test Package',
      speed: '10/10',
      price: 1000,
    });
    console.log('Test package created:', testPackage.name);

    console.log('Creating test Mikrotik user...');
    const mikrotikUser = await MikrotikUser.create({
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
