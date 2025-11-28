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
const { encrypt } = require('./utils/crypto');

// Configure dotenv to use the root .env file
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

connectDB();

const importData = async () => {
  try {
    console.log('Wiping existing data...');
    await Tenant.deleteMany();
    await User.deleteMany();
    await MikrotikRouter.deleteMany();
    await Package.deleteMany();
    await MikrotikUser.deleteMany();
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

    // --- Create Tenant 1 and its Admin User ---
    console.log('Creating Tenant 1 (Admin Tenant)...');
    const tenant1 = await Tenant.create({ name: 'Admin Tenant' });
    const adminUser1 = await User.create({
      fullName: 'Admin Tenant',
      email: 'admin@example.com',
      phone: '+254700000000',
      password: 'Abuhureira12',
      roles: ['ADMIN'],
      tenant: tenant1._id,
    });
    console.log('Tenant 1 and its admin user created.');

    // --- Create Tenant 2 and its Admin User ---
    console.log('Creating Tenant 2 (Test Admin)...');
    const tenant2 = await Tenant.create({ name: 'Test Admin' });
    await User.create({
      fullName: 'Test Admin',
      email: 'testadmin@example.com',
      phone: '+254712345678',
      password: 'testpassword',
      roles: ['ADMIN'],
      tenant: tenant2._id,
    });
    console.log('Tenant 2 and its admin user created.');
    
    // --- Create Tenant 3 and its Admin User ---
    console.log('Creating Tenant 3 (Another Admin)...');
    const tenant3 = await Tenant.create({ name: 'Another Admin' });
    await User.create({
      fullName: 'Another Admin',
      email: 'anotheradmin@example.com',
      phone: '+254787654321',
      password: 'anotherpassword',
      roles: ['ADMIN'],
      tenant: tenant3._id,
    });
    console.log('Tenant 3 and its admin user created.');

    // --- Create data for Tenant 1 ---
    console.log('Creating production router for Tenant 1...');
    const router = await MikrotikRouter.create({
      tenant: tenant1._id,
      name: 'AMANI ESTATE MIK',
      ipAddress: '10.10.10.1',
      apiUsername: 'admin',
      apiPassword: encrypt('0741554490#'),
      apiPort: 8728,
    });
    console.log('Production router created:', router.name);

    console.log('Creating test package for Tenant 1...');
    const testPackage = await Package.create({
      tenant: tenant1._id,
      mikrotikRouter: router._id,
      serviceType: 'pppoe',
      name: 'Test Package',
      price: 1000,
      profile: 'Test Package',
    });
    console.log('Test package created:', testPackage.name);

    console.log('Creating test Mikrotik user for Tenant 1...');
    const mikrotikUser = await MikrotikUser.create({
        tenant: tenant1._id,
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
