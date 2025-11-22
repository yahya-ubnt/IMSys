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
  deleteTicket,
} = require('../controllers/ticketController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

// Routes for /api/tickets
router.route('/')
  .post(protect, isSuperAdminOrAdminTenant, createTicket)
  .get(protect, isSuperAdminOrAdminTenant, getTickets);

// Routes for /api/tickets/stats
router.route('/stats')
  .get(protect, isSuperAdminOrAdminTenant, getTicketStats);

// Routes for /api/tickets/monthly-totals
router.route('/monthly-totals')
  .get(protect, isSuperAdminOrAdminTenant, getMonthlyTicketTotals);

// Routes for /api/tickets/:id
router.route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getTicketById)
  .put(protect, isSuperAdminOrAdminTenant, updateTicket)
  .delete(protect, isSuperAdminOrAdminTenant, deleteTicket);

// Route for /api/tickets/:id/notes
router.route('/:id/notes')
  .post(protect, isSuperAdminOrAdminTenant, addNoteToTicket);

module.exports = router;