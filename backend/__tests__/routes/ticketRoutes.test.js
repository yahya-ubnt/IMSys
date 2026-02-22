
const request = require('supertest');
const express = require('express');
const ticketRoutes = require('../../routes/ticketRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const ticketController = require('../../controllers/ticketController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/ticketController', () => ({
  createTicket: jest.fn((req, res) => res.status(201).json({ message: 'Ticket created' })),
  getTickets: jest.fn((req, res) => res.status(200).json({ message: 'Get all tickets' })),
  getTicketById: jest.fn((req, res) => res.status(200).json({ message: `Get ticket ${req.params.id}` })),
  updateTicket: jest.fn((req, res) => res.status(200).json({ message: `Update ticket ${req.params.id}` })),
  addNoteToTicket: jest.fn((req, res) => res.status(200).json({ message: `Note added to ticket ${req.params.id}` })),
  getTicketStats: jest.fn((req, res) => res.status(200).json({ message: 'Ticket stats' })),
  getMonthlyTicketTotals: jest.fn((req, res) => res.status(200).json({ message: 'Monthly ticket totals' })),
  getMonthlyTicketStats: jest.fn((req, res) => res.status(200).json({ message: 'Monthly ticket stats' })),
  deleteTicket: jest.fn((req, res) => res.status(200).json({ message: `Delete ticket ${req.params.id}` })),
}));

const app = express();
app.use(express.json());
app.use('/api/tickets', ticketRoutes);

describe('Ticket Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const ticketId = 'ticket123';

  it('POST /api/tickets should create a new ticket', async () => {
    const res = await request(app).post('/api/tickets').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Ticket created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(ticketController.createTicket).toHaveBeenCalled();
  });

  it('GET /api/tickets should get all tickets', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all tickets' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(ticketController.getTickets).toHaveBeenCalled();
  });

  it('GET /api/tickets/stats should get ticket statistics', async () => {
    const res = await request(app).get('/api/tickets/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Ticket stats' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(ticketController.getTicketStats).toHaveBeenCalled();
  });

  it('GET /api/tickets/monthly-totals should get monthly ticket totals', async () => {
    const res = await request(app).get('/api/tickets/monthly-totals');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Monthly ticket totals' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(ticketController.getMonthlyTicketTotals).toHaveBeenCalled();
  });

  it('GET /api/tickets/monthly-stats should get monthly ticket stats', async () => {
    const res = await request(app).get('/api/tickets/monthly-stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Monthly ticket stats' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(ticketController.getMonthlyTicketStats).toHaveBeenCalled();
  });

  it('GET /api/tickets/:id should get a ticket by ID', async () => {
    const res = await request(app).get(`/api/tickets/${ticketId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get ticket ${ticketId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(ticketController.getTicketById).toHaveBeenCalled();
  });

  it('PUT /api/tickets/:id should update a ticket by ID', async () => {
    const res = await request(app).put(`/api/tickets/${ticketId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update ticket ${ticketId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(ticketController.updateTicket).toHaveBeenCalled();
  });

  it('DELETE /api/tickets/:id should delete a ticket by ID', async () => {
    const res = await request(app).delete(`/api/tickets/${ticketId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete ticket ${ticketId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(ticketController.deleteTicket).toHaveBeenCalled();
  });

  it('POST /api/tickets/:id/notes should add a note to a ticket', async () => {
    const res = await request(app).post(`/api/tickets/${ticketId}/notes`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Note added to ticket ${ticketId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(ticketController.addNoteToTicket).toHaveBeenCalled();
  });
});
