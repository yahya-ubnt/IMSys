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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router
  .route('/')
  .post(protect, isSuperAdminOrAdmin, createTicket)
  .get(protect, isSuperAdminOrAdmin, getTickets);

router
    .route('/stats')
    .get(protect, isSuperAdminOrAdmin, getTicketStats);

router
    .route('/monthly-totals')
    .get(protect, isSuperAdminOrAdmin, getMonthlyTicketTotals);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getTicketById)
  .put(protect, isSuperAdminOrAdmin, updateTicket)
  .delete(protect, isSuperAdminOrAdmin, deleteTicket);

router
    .route('/:id/notes')
    .post(protect, isSuperAdminOrAdmin, addNoteToTicket);

module.exports = router;