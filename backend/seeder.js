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
    console.log('Wiping existing data...');
    await User.deleteMany();
    await MikrotikRouter.deleteMany();
    await Package.deleteMany();
    await MikrotikUser.deleteMany();
    console.log('Data wiped.');

    console.log('Creating SUPER_ADMIN user...');
    await User.create({
      fullName: 'Super Admin',
      email: 'superadmin@example.com',
      phone: '+254700000001',
      password: 'superadminpassword',
      roles: ['SUPER_ADMIN'],
    });
    console.log('SUPER_ADMIN user created.');

    console.log('Creating ADMIN_TENANT user...');
    const adminTenant = await User.create({
      fullName: 'Admin Tenant',
      email: 'admin@example.com',
      phone: '+254700000000',
      password: 'Abuhureira12',
      roles: ['ADMIN_TENANT'],
    });
    adminTenant.tenantOwner = adminTenant._id;
    await adminTenant.save();
    console.log('ADMIN_TENANT user created.');

    console.log('Creating Test Admin user...');
    const testAdmin = await User.create({
      fullName: 'Test Admin',
      email: 'testadmin@example.com',
      phone: '+254712345678',
      password: 'testpassword',
      roles: ['ADMIN_TENANT'],
    });
    testAdmin.tenantOwner = testAdmin._id;
    await testAdmin.save();
    console.log('Test Admin user created.');

    console.log('Creating Another Admin user...');
    const anotherAdmin = await User.create({
      fullName: 'Another Admin',
      email: 'anotheradmin@example.com',
      phone: '+254787654321',
      password: 'anotherpassword',
      roles: ['ADMIN_TENANT'],
    });
    anotherAdmin.tenantOwner = anotherAdmin._id;
    await anotherAdmin.save();
    console.log('Another Admin user created.');

    // console.log('Creating production router...');
    // const router = await MikrotikRouter.create({
    //   user: adminTenant._id, // Associated with the ADMIN_TENANT
    //   tenantOwner: adminTenant._id,
    //   name: 'AMANI ESTATE MIK',
    //   ipAddress: '10.10.10.1',
    //   apiUsername: 'admin',
    //   apiPassword: encrypt('0741554490#'),
    //   apiPort: 8728,
    // });
    // console.log('Production router created:', router.name);

    // console.log('Creating test package...');
    // const testPackage = await Package.create({
    //   user: adminTenant._id, // Associated with the ADMIN_TENANT
    //   tenantOwner: adminTenant._id,
    //   mikrotikRouter: router._id,
    //   serviceType: 'pppoe',
    //   name: 'Test Package',
    //   price: 1000,
    //   profile: 'Test Package',
    // });
    // console.log('Test package created:', testPackage.name);

    // console.log('Creating test Mikrotik user...');
    // const mikrotikUser = await MikrotikUser.create({
    //     user: adminTenant._id, // Associated with the ADMIN_TENANT
    //     tenantOwner: adminTenant._id,
    //     mikrotikRouter: router._id,
    //     serviceType: 'pppoe',
    //     package: testPackage._id,
    //     username: 'testuser',
    //     pppoePassword: 'password',
    //     officialName: 'Test User',
    //     mPesaRefNo: 'TESTUSER',
    //     billingCycle: 'Monthly',
    //     mobileNumber: '254708374149',
    //     expiryDate: new Date(),
    // });
    // console.log('Test Mikrotik user created:', mikrotikUser.username);

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
