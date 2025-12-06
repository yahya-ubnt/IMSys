const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');
const User = require('../models/User'); // Assuming User model is needed for createdBy/updatedBy
const { sendSms } = require('../services/smsService'); // Assuming this is the correct path and function
const mongoose = require('mongoose');

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Admin
const createTicket = asyncHandler(async (req, res) => {
  const { clientName, clientPhone, clientEmail, clientAccountId, issueType, description, priority } = req.body;

  if (!clientName || !clientPhone || !issueType || !description) {
    res.status(400);
    throw new Error('Please fill all required fields: Client Name, Client Phone, Issue Type, Description');
  }

  // Generate a unique ticket reference (e.g., BILL-YYYYMMDD-HHMMSS-RANDOM)
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random alphanumeric chars

  const ticketRef = `BILL-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;

  const ticket = await Ticket.create({
    ticketRef,
    clientName,
    clientPhone,
    clientEmail,
    clientAccountId,
    issueType,
    description,
    priority: priority || 'Medium', // Default to Medium if not provided
    tenant: req.user.tenant,
    statusHistory: [{ status: 'New' }],
  });

  if (ticket) {
    // Send SMS notification to client
    const smsMessage = `Dear ${clientName}, your ticket regarding '${issueType}' has been logged with reference number ${ticketRef}. A technician will be dispatched if needed.`;
    try {
      await sendSms(ticket.clientPhone, smsMessage);
      console.log(`SMS sent to ${clientPhone} for ticket ${ticketRef}`);
    } catch (smsError) {
      console.error(`Failed to send SMS for ticket ${ticketRef}: ${smsError.message}`);
      // Optionally, log this error to a separate system or store it in the ticket itself
    }

    res.status(201).json(ticket);
  } else {
    res.status(400);
    throw new Error('Invalid ticket data');
  }
});

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Admin
const getTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, issueType } = req.query;
  const query = { tenant: req.user.tenant };

  if (status) {
    query.status = status;
  }
  if (issueType) {
    query.issueType = issueType;
  }

  const tickets = await Ticket.find(query)
    .sort({ createdAt: -1 }) // Sort by newest first
    .limit(parseInt(limit))
    .skip((page - 1) * parseInt(limit));

  const count = await Ticket.countDocuments(query);

  res.status(200).json({ tickets, pages: Math.ceil(count / limit), count });
});

// @desc    Get single ticket by ID
// @route   GET /api/tickets/:id
// @access  Admin
const getTicketById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };

  const ticket = await Ticket.findOne(query);

  if (ticket) {
    res.status(200).json(ticket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Update ticket status/details/assign technician
// @route   PUT /api/tickets/:id
// @access  Admin
const updateTicket = asyncHandler(async (req, res) => {
  const { status, notes, ...otherUpdates } = req.body;

  const ticket = await Ticket.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Update status and add to history
  if (status && status !== ticket.status) {
    ticket.statusHistory.push({ status });
    ticket.status = status;

    // Send SMS notification if status is "Resolved"
    if (status === 'Resolved') {
      const smsMessage = `Dear ${ticket.clientName}, your ticket ${ticket.ticketRef} has been marked as RESOLVED. Thank you for your patience.`;
      try {
        await sendSms(ticket.clientPhone, smsMessage);
        console.log(`SMS sent to ${ticket.clientPhone} for ticket ${ticket.ticketRef} status Resolved`);
      } catch (smsError) {
        console.error(`Failed to send SMS for ticket ${ticket.ticketRef} status Resolved: ${smsError.message}`);
      }
    }
  }

  // Apply other updates (e.g., client info, issue details)
  Object.keys(otherUpdates).forEach(key => {
    ticket[key] = otherUpdates[key];
  });

  const updatedTicket = await ticket.save();

  res.status(200).json(updatedTicket);
});

// @desc    Add a note to a ticket
// @route   POST /api/tickets/:id/notes
// @access  Admin
const addNoteToTicket = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    res.status(400);
    throw new Error('Note content is required');
  }

  const ticket = await Ticket.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  ticket.notes.push({ content });

  const updatedTicket = await ticket.save();

  res.status(201).json(updatedTicket.notes[updatedTicket.notes.length - 1]); // Return the newly added note
});

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats
// @access  Admin
const getTicketStats = asyncHandler(async (req, res) => {
  const matchQuery = { tenant: req.user.tenant };

  const stats = await Ticket.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Format stats into a more usable object
  const formattedStats = {
    total: 0,
    new: 0,
    inprogress: 0,
    resolved: 0,
    open: 0,
    dispatched: 0,
    closed: 0,
  };
  stats.forEach(s => {
    const status = s._id.toLowerCase().replace(/\s/g, '');
    if (formattedStats.hasOwnProperty(status)) {
      formattedStats[status] = s.count;
    }
  });

  // Add total count
  formattedStats.total = stats.reduce((acc, s) => acc + s.count, 0);

  res.status(200).json(formattedStats);
});

// @desc    Get monthly ticket totals
// @route   GET /api/tickets/monthly-totals
// @access  Admin
const getMonthlyTicketTotals = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year);

  if (isNaN(year)) {
    res.status(400);
    throw new Error('Year is required and must be a number');
  }

  const matchQuery = { tenant: req.user.tenant };

  matchQuery.createdAt = {
    $gte: new Date(year, 0, 1),
    $lt: new Date(year + 1, 0, 1),
  };

  const monthlyTotals = await Ticket.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        total: { $sum: 1 }, // Count of tickets
      },
    },
    {
      $sort: { '_id.month': 1 },
    },
    {
      $project: {
        _id: 0,
        month: '_id.month',
        total: 1,
      },
    },
  ]);

  // Fill in missing months with 0
  const fullMonthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const monthData = monthlyTotals.find(item => item.month === i + 1);
    return { month: i + 1, total: monthData ? monthData.total : 0 };
  });

  res.status(200).json(fullMonthlyTotals);
});

// @desc    Get monthly ticket stats (created vs resolved)
// @route   GET /api/tickets/monthly-stats
// @access  Admin
const getMonthlyTicketStats = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year);

  if (isNaN(year)) {
    res.status(400);
    throw new Error('Year is required and must be a number');
  }

  const tenantId = req.user.tenant;

  // 1. Get created tickets per month
  const createdTickets = await Ticket.aggregate([
    {
      $match: {
        tenant: tenantId,
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  // 2. Get resolved tickets per month
  const resolvedTickets = await Ticket.aggregate([
    {
      $match: {
        tenant: tenantId,
        'statusHistory.status': 'Resolved',
        'statusHistory.timestamp': {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      },
    },
    { $unwind: '$statusHistory' },
    {
      $match: {
        'statusHistory.status': 'Resolved',
        'statusHistory.timestamp': {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$statusHistory.timestamp' } },
        count: { $sum: 1 },
      },
    },
  ]);

  // 3. Combine results
  const combinedStats = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const createdData = createdTickets.find(item => item._id.month === month);
    const resolvedData = resolvedTickets.find(item => item._id.month === month);
    return {
      month,
      created: createdData ? createdData.count : 0,
      resolved: resolvedData ? resolvedData.count : 0,
    };
  });

  res.status(200).json(combinedStats);
});


// @desc    Delete a ticket
// @route   DELETE /api/tickets/:id
// @access  Admin
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  await ticket.deleteOne();

  res.status(200).json({ message: 'Ticket removed' });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addNoteToTicket,
  getTicketStats,
  getMonthlyTicketTotals,
  getMonthlyTicketStats,
  deleteTicket,
};
