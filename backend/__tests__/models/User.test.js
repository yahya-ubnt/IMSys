
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Tenant.deleteMany({});
});

describe('User Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({ name: 'Test Tenant' });
    await tenant.save();
  });

  it('should create & save a user successfully', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      roles: ['ADMIN'],
      tenant: tenant._id,
    };
    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.password).not.toBe('password123');
  });

  it('should correctly match passwords', async () => {
    const user = new User({
        fullName: 'Test User',
        email: 'match@example.com',
        password: 'password123',
        phone: '0987654321',
        roles: ['ADMIN'],
        tenant: tenant._id,
    });
    await user.save();
    const isMatch = await user.matchPassword('password123');
    expect(isMatch).toBe(true);
    const isNotMatch = await user.matchPassword('wrongpassword');
    expect(isNotMatch).toBe(false);
  });

  it('should fail with duplicate email', async () => {
    await new User({
        fullName: 'User One',
        email: 'duplicate@example.com',
        password: 'p1',
        phone: '111',
        roles: ['ADMIN'],
        tenant: tenant._id,
    }).save();

    const user2 = new User({
        fullName: 'User Two',
        email: 'duplicate@example.com',
        password: 'p2',
        phone: '222',
        roles: ['ADMIN'],
        tenant: tenant._id,
    });
    
    await expect(user2.save()).rejects.toThrow();
  });

  it('should create a SUPER_ADMIN without a tenant', async () => {
    const superAdmin = new User({
        fullName: 'Super Admin',
        email: 'super@admin.com',
        password: 'superpassword',
        phone: '5555555555',
        roles: ['SUPER_ADMIN'],
    });
    const savedAdmin = await superAdmin.save();
    expect(savedAdmin._id).toBeDefined();
    expect(savedAdmin.tenant).toBeUndefined();
  });

  it('should require tenant for non-SUPER_ADMIN roles', async () => {
    const user = new User({
        fullName: 'Regular User',
        email: 'regular@user.com',
        password: 'password',
        phone: '4444444444',
        roles: ['ADMIN'],
    });
    await expect(user.save()).rejects.toThrow('User validation failed: tenant: Path `tenant` is required.');
  });
});
