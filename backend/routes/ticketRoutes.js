const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addNoteToTicket,
  getTicketStats, // Import new function
  getMonthlyTicketTotals, // Import new function
} = require('../controllers/ticketController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

// Routes for /api/tickets
router.route('/')
  .post(protect, isAdminTenant, createTicket)
  .get(protect, isAdminTenant, getTickets);

// Routes for /api/tickets/stats
router.route('/stats')
  .get(protect, isAdminTenant, getTicketStats);

// Routes for /api/tickets/monthly-totals
router.route('/monthly-totals')
  .get(protect, isAdminTenant, getMonthlyTicketTotals);

// Routes for /api/tickets/:id
router.route('/:id')
  .get(protect, isAdminTenant, getTicketById)
  .put(protect, isAdminTenant, updateTicket);

// Route for /api/tickets/:id/notes
router.route('/:id/notes')
  .post(protect, isAdminTenant, addNoteToTicket);

module.exports = router;