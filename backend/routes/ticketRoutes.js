const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addNoteToTicket,
  getTicketStats,
  getMonthlyTicketTotals,
  getMonthlyTicketStats, // Import new function
  deleteTicket,
} = require('../controllers/ticketController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router
  .route('/')
  .post(isSuperAdminOrAdmin, createTicket)
  .get(isSuperAdminOrAdmin, getTickets);

router
    .route('/stats')
    .get(isSuperAdminOrAdmin, getTicketStats);

router
    .route('/monthly-totals')
    .get(isSuperAdminOrAdmin, getMonthlyTicketTotals);

router
    .route('/monthly-stats')
    .get(isSuperAdminOrAdmin, getMonthlyTicketStats);

router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getTicketById)
  .put(isSuperAdminOrAdmin, updateTicket)
  .delete(isSuperAdminOrAdmin, deleteTicket);

router
    .route('/:id/notes')
    .post(isSuperAdminOrAdmin, addNoteToTicket);

module.exports = router;
