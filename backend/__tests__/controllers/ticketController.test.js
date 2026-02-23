const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createTicket,
  getTickets,
} = require('../../controllers/ticketController');
const Ticket = require('../../models/Ticket');
const Tenant = require('../../models/Tenant');

// Mock smsService
jest.mock('../../services/smsService', () => ({
    sendSms: jest.fn().mockResolvedValue(true)
}));

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

describe('Ticket Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await Ticket.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Ticket Tenant' });

    req = {
      params: {},
      user: { tenant: tenant._id },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create ticket successfully', async () => {
      req.body = {
        clientName: 'John',
        clientPhone: '123',
        issueType: 'Technical',
        description: 'No internet'
      };

      await createTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const ticket = await Ticket.findOne({ clientName: 'John' });
      expect(ticket).toBeDefined();
    });
  });

  describe('getTickets', () => {
      it('should return tickets for tenant', async () => {
          await Ticket.create({
              ticketRef: 'REF1',
              clientName: 'Jane',
              clientPhone: '456',
              issueType: 'Billing',
              description: 'Wrong charge',
              tenant: tenant._id,
              statusHistory: [{ status: 'New' }]
          });

          await getTickets(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
              count: 1,
              tickets: expect.arrayContaining([
                  expect.objectContaining({ clientName: 'Jane' })
              ])
          }));
      });
  });
});
