
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Ticket = require('../../models/Ticket');
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
  await Ticket.deleteMany({});
  await Tenant.deleteMany({});
});

describe('Ticket Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save a ticket successfully', async () => {
    const ticketData = {
      tenant: tenant._id,
      ticketRef: 'TKT-001',
      clientName: 'Test Client',
      clientPhone: '1234567890',
      issueType: 'Connectivity',
      description: 'Internet is slow.',
    };
    const ticket = new Ticket(ticketData);
    const savedTicket = await ticket.save();

    expect(savedTicket._id).toBeDefined();
    expect(savedTicket.ticketRef).toBe(ticketData.ticketRef);
    expect(savedTicket.tenant).toEqual(tenant._id);
    expect(savedTicket.status).toBe('New');
    expect(savedTicket.priority).toBe('Medium');
  });

  it('should fail to create a ticket without required fields', async () => {
    const ticket = new Ticket({ tenant: tenant._id });
    let err;
    try {
      await ticket.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.ticketRef).toBeDefined();
    expect(err.errors.clientName).toBeDefined();
    expect(err.errors.clientPhone).toBeDefined();
    expect(err.errors.issueType).toBeDefined();
    expect(err.errors.description).toBeDefined();
  });

  it('should fail with a duplicate ticketRef', async () => {
    const ticketData = {
        tenant: tenant._id,
        ticketRef: 'TKT-DUPLICATE',
        clientName: 'Client A',
        clientPhone: '111',
        issueType: 'Billing',
        description: 'Question about invoice',
    };
    const ticket1 = new Ticket(ticketData);
    await ticket1.save();

    const ticket2 = new Ticket({ ...ticketData, clientName: 'Client B', clientPhone: '222' });
    let err;
    try {
        await ticket2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  it('should fail with an invalid status', async () => {
    const ticketData = {
        tenant: tenant._id,
        ticketRef: 'TKT-INVALID-STATUS',
        clientName: 'Test Client',
        clientPhone: '1234567890',
        issueType: 'Connectivity',
        description: 'Internet is slow.',
        status: 'Invalid'
    };
    const ticket = new Ticket(ticketData);
    let err;
    try {
        await ticket.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });

  it('should fail with an invalid priority', async () => {
    const ticketData = {
        tenant: tenant._id,
        ticketRef: 'TKT-INVALID-PRIORITY',
        clientName: 'Test Client',
        clientPhone: '1234567890',
        issueType: 'Connectivity',
        description: 'Internet is slow.',
        priority: 'Invalid'
    };
    const ticket = new Ticket(ticketData);
    let err;
    try {
        await ticket.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.priority).toBeDefined();
  });
});
