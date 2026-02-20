const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addNoteToTicket,
  getTicketStats,
  getMonthlyTicketTotals,
  getMonthlyTicketStats,
  deleteTicket,
} = require('../../controllers/ticketController');
const Ticket = require('../../models/Ticket');
const smsService = require('../../services/smsService');

jest.mock('../../models/Ticket');
jest.mock('../../services/smsService', () => ({
    sendSms: jest.fn(),
}));

describe('Ticket Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testId' },
      user: { tenant: 'testTenant' },
      body: {},
      query: { year: '2024' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create a new ticket', async () => {
      req.body = { clientName: 'Test', clientPhone: '123', issueType: 'Billing', description: 'Test issue' };
      const mockTicket = { _id: 't1', ...req.body };
      Ticket.create.mockResolvedValue(mockTicket);
      smsService.sendSms.mockResolvedValue({ success: true });
      await createTicket(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTicket);
    });
  });

  describe('getTickets', () => {
    it('should return a list of tickets', async () => {
      const mockTickets = [{ _id: 't1' }];
      Ticket.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockTickets),
      });
      Ticket.countDocuments.mockResolvedValue(1);
      await getTickets(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ tickets: mockTickets, pages: 1, count: 1 });
    });
  });

  describe('getTicketById', () => {
    it('should return a single ticket', async () => {
      const mockTicket = { _id: 't1' };
      Ticket.findOne.mockResolvedValue(mockTicket);
      await getTicketById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTicket);
    });
  });

  describe('updateTicket', () => {
    it('should update a ticket', async () => {
      const mockTicket = { _id: 't1', status: 'New', statusHistory: [], save: jest.fn() };
      req.body = { status: 'In Progress' };
      Ticket.findOne.mockResolvedValue(mockTicket);
      await updateTicket(req, res, next);
      expect(mockTicket.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addNoteToTicket', () => {
    it('should add a note to a ticket', async () => {
      const mockTicket = { _id: 't1', notes: [], save: jest.fn().mockResolvedValue({ notes: [{ content: 'Test note' }] }) };
      req.body = { content: 'Test note' };
      Ticket.findOne.mockResolvedValue(mockTicket);
      await addNoteToTicket(req, res, next);
      expect(mockTicket.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getTicketStats', () => {
    it('should return ticket stats', async () => {
      Ticket.aggregate.mockResolvedValue([{ _id: 'New', count: 5 }]);
      await getTicketStats(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getMonthlyTicketTotals', () => {
    it('should return monthly ticket totals', async () => {
      Ticket.aggregate.mockResolvedValue([{ month: 1, total: 10 }]);
      await getMonthlyTicketTotals(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getMonthlyTicketStats', () => {
    it('should return monthly ticket stats', async () => {
      Ticket.aggregate.mockResolvedValue([{ _id: { month: 1 }, count: 5 }]);
      await getMonthlyTicketStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('deleteTicket', () => {
    it('should delete a ticket', async () => {
      const mockTicket = { _id: 't1', deleteOne: jest.fn() };
      Ticket.findOne.mockResolvedValue(mockTicket);
      await deleteTicket(req, res, next);
      expect(mockTicket.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Ticket removed' });
    });
  });
});
