jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Invoice = require('../../models/Invoice');
const Tenant = require('../../models/Tenant');
const MikrotikUser = require('../../models/MikrotikUser');
const Package = require('../../models/Package');
const MikrotikRouter = require('../../models/MikrotikRouter');

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
  await Invoice.deleteMany({});
  await Tenant.deleteMany({});
  await MikrotikUser.deleteMany({});
  await Package.deleteMany({});
  await MikrotikRouter.deleteMany({});
});

describe('Invoice Model Test', () => {
  let tenant;
  let mikrotikUser;
  let pkg;
  let router;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();

    router = new MikrotikRouter({
        tenant: tenant._id,
        name: 'Test Router',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'password'
    });
    await router.save();

    pkg = new Package({
        tenant: tenant._id,
        mikrotikRouter: router._id,
        serviceType: 'pppoe',
        name: 'Basic',
        price: 1000,
    });
    await pkg.save();

    mikrotikUser = new MikrotikUser({
        tenant: tenant._id,
        mikrotikRouter: router._id,
        serviceType: 'pppoe',
        package: pkg._id,
        username: 'testuser',
        officialName: 'Test User',
        mPesaRefNo: 'MPESA123',
        billingCycle: 'Monthly',
        mobileNumber: '1234567890',
        expiryDate: new Date(),
    });
    await mikrotikUser.save();
  });

  it('should create & save an invoice successfully', async () => {
    const invoiceData = {
      invoiceNumber: 'INV-202602-0001',
      mikrotikUser: mikrotikUser._id,
      tenant: tenant._id,
      amount: 1200,
      dueDate: new Date(),
      items: [{ description: 'Monthly Subscription', amount: 1200 }],
    };
    const invoice = new Invoice(invoiceData);
    const savedInvoice = await invoice.save();

    expect(savedInvoice._id).toBeDefined();
    expect(savedInvoice.invoiceNumber).toBe(invoiceData.invoiceNumber);
    expect(savedInvoice.mikrotikUser).toEqual(mikrotikUser._id);
    expect(savedInvoice.tenant).toEqual(tenant._id);
    expect(savedInvoice.amount).toBe(invoiceData.amount);
    expect(savedInvoice.status).toBe('Unpaid');
    expect(savedInvoice.items.length).toBe(1);
    expect(savedInvoice.items[0].description).toBe('Monthly Subscription');
  });

  it('should fail to create an invoice without an invoiceNumber', async () => {
    const invoice = new Invoice({
        mikrotikUser: mikrotikUser._id,
        tenant: tenant._id,
        amount: 1200,
        dueDate: new Date(),
        items: [{ description: 'Monthly Subscription', amount: 1200 }],
    });
    let err;
    try {
      await invoice.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.invoiceNumber).toBeDefined();
  });

  it('should fail with a duplicate invoiceNumber', async () => {
    const invoiceData1 = {
        invoiceNumber: 'INV-DUPLICATE',
        mikrotikUser: mikrotikUser._id,
        tenant: tenant._id,
        amount: 1200,
        dueDate: new Date(),
        items: [{ description: 'Monthly Subscription', amount: 1200 }],
    };
    const invoice1 = new Invoice(invoiceData1);
    await invoice1.save();

    const invoiceData2 = {
        invoiceNumber: 'INV-DUPLICATE',
        mikrotikUser: mikrotikUser._id,
        tenant: tenant._id,
        amount: 1500,
        dueDate: new Date(),
        items: [{ description: 'Another Subscription', amount: 1500 }],
    };
    const invoice2 = new Invoice(invoiceData2);
    let err;
    try {
        await invoice2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});