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
const { protect } = require('../middlewares/authMiddleware');

// Routes for /api/tickets
router.route('/')
  .post(protect, createTicket)
  .get(protect, getTickets);

// Routes for /api/tickets/stats
router.route('/stats')
  .get(protect, getTicketStats);

// Routes for /api/tickets/monthly-totals
router.route('/monthly-totals')
  .get(protect, getMonthlyTicketTotals);

// Routes for /api/tickets/:id
router.route('/:id')
  .get(protect, getTicketById)
  .put(protect, updateTicket);

// Route for /api/tickets/:id/notes
router.route('/:id/notes')
  .post(protect, addNoteToTicket);

module.exports = router;