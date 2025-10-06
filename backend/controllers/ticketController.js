const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');
const User = require('../models/User'); // Assuming User model is needed for createdBy/updatedBy
const { sendSms } = require('../services/smsService'); // Assuming this is the correct path and function

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
    createdBy: req.user.id, // Assuming req.user.id is set by protect middleware
    statusHistory: [{ status: 'New', updatedBy: req.user.id }],
  });

  if (ticket) {
    // Send SMS notification to client
    const smsMessage = `Dear ${clientName}, your ticket regarding '${issueType}' has been logged with reference number ${ticketRef}. A technician will be dispatched if needed.`;
    try {
      await sendSms(clientPhone, smsMessage);
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
  // Build query based on filters (status, issueType, assignedTo, etc.)
  const query = {};
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.issueType) {
    query.issueType = req.query.issueType;
  }
  if (req.query.assignedTo) {
    query.assignedTo = req.query.assignedTo;
  }

  // If user is not an admin, only show their tickets
  if (!req.user.isAdmin) {
    query.createdBy = req.user._id;
  }

  const tickets = await Ticket.find(query)
    .populate('createdBy', 'fullName email') // Populate creator info
    .populate('assignedTo', 'fullName email') // Populate assigned technician info
    .sort({ createdAt: -1 }); // Sort by newest first

  res.status(200).json(tickets);
});

// @desc    Get single ticket by ID
// @route   GET /api/tickets/:id
// @access  Admin
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('createdBy', 'fullName email')
    .populate('assignedTo', 'fullName email')
    .populate('statusHistory.updatedBy', 'fullName email')
    .populate('notes.addedBy', 'fullName email');

  if (ticket) {
    // Check for ownership if user is not an admin
    if (!req.user.isAdmin && ticket.createdBy._id.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to view this ticket');
    }
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
  // Ensure only admins can update tickets
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized to update tickets');
  }

  const { status, assignedTo, notes, ...otherUpdates } = req.body;

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Update status and add to history
  if (status && status !== ticket.status) {
    ticket.statusHistory.push({ status, updatedBy: req.user.id });
    ticket.status = status;

    // Send SMS notification if status is "Fixed"
    if (status === 'Fixed') {
      const smsMessage = `Dear ${ticket.clientName}, your ticket ${ticket.ticketRef} has been marked as FIXED. Thank you for your patience.`;
      try {
        await sendSms(ticket.clientPhone, smsMessage);
        console.log(`SMS sent to ${ticket.clientPhone} for ticket ${ticket.ticketRef} status Fixed`);
      } catch (smsError) {
        console.error(`Failed to send SMS for ticket ${ticket.ticketRef} status Fixed: ${smsError.message}`);
      }
    }
  }

  // Update assignedTo
  if (assignedTo) {
    ticket.assignedTo = assignedTo;
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

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check for ownership if user is not an admin
  if (!req.user.isAdmin && ticket.createdBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to add a note to this ticket');
  }

  ticket.notes.push({ content, addedBy: req.user.id });

  const updatedTicket = await ticket.save();

  res.status(201).json(updatedTicket.notes[updatedTicket.notes.length - 1]); // Return the newly added note
});

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats
// @access  Admin
const getTicketStats = asyncHandler(async (req, res) => {
  // Ensure only admins can access stats
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized to access ticket statistics');
  }

  const stats = await Ticket.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Format stats into a more usable object
  const formattedStats = {};
  stats.forEach(s => {
    formattedStats[s._id.toLowerCase().replace(/\s/g, '')] = s.count;
  });

  // Add total count
  formattedStats.total = stats.reduce((acc, s) => acc + s.count, 0);

  res.status(200).json(formattedStats);
});

// @desc    Get monthly ticket totals
// @route   GET /api/tickets/monthly-totals
// @access  Admin
const getMonthlyTicketTotals = asyncHandler(async (req, res) => {
  // Ensure only admins can access stats
  if (!req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized to access ticket statistics');
  }

  const year = parseInt(req.query.year);

  if (isNaN(year)) {
    res.status(400);
    throw new Error('Year is required and must be a number');
  }

  const monthlyTotals = await Ticket.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      },
    },
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

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addNoteToTicket,
  getTicketStats,
  getMonthlyTicketTotals,
};
