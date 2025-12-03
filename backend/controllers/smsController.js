const asyncHandler = require('express-async-handler');
const SmsLog = require('../models/SmsLog');
const User = require('../models/User'); // Assuming User model has phoneNumber
const MikrotikUser = require('../models/MikrotikUser'); // Assuming MikrotikUser model
const { sendSMS } = require('../services/smsService');
const smsTriggers = require('../constants/smsTriggers');
const xlsx = require('xlsx');
const { json2csv } = require('json-2-csv');
const PDFDocument = require('pdfkit');

// @desc    Get available SMS trigger types
// @route   GET /api/sms/triggers
// @access  Private
const getSmsTriggers = asyncHandler(async (req, res) => {
  const triggerArray = Object.entries(smsTriggers).map(([key, value]) => {
    const name = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return { id: value, name: name };
  });
  res.json(triggerArray);
});

// @desc    Compose and send a new SMS
// @route   POST /api/sms/compose
// @access  Private
const composeAndSendSms = asyncHandler(async (req, res) => {
    const {
      message,
      sendToType, // 'users', 'mikrotik', 'location', 'unregistered'
      userIds,
      mikrotikRouterIds,
      apartmentHouseNumbers,
      unregisteredMobileNumber,
    } = req.body;
  
    if (!message) {
      res.status(400);
      throw new Error('Message body is required');
    }
  
    let usersToSend = [];
  
    switch (sendToType) {
      case 'users':
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          res.status(400);
          throw new Error('User IDs are required for sending to users');
        }
        usersToSend = await MikrotikUser.find({ _id: { $in: userIds }, tenant: req.user.tenant });
        break;
  
      case 'mikrotik':
        if (!mikrotikRouterIds || !Array.isArray(mikrotikRouterIds) || mikrotikRouterIds.length === 0) {
          res.status(400);
          throw new Error('Mikrotik Router IDs are required for sending to Mikrotik group');
        }
        usersToSend = await MikrotikUser.find({ mikrotikRouter: { $in: mikrotikRouterIds }, tenant: req.user.tenant });
        break;
  
      case 'location':
        if (!apartmentHouseNumbers || !Array.isArray(apartmentHouseNumbers) || apartmentHouseNumbers.length === 0) {
          res.status(400);
          throw new Error('Apartment/House Numbers are required for sending to location');
        }
        usersToSend = await MikrotikUser.find({ apartment_house_number: { $in: apartmentHouseNumbers }, tenant: req.user.tenant });
        break;
  
      case 'unregistered':
        if (!unregisteredMobileNumber) {
          res.status(400);
          throw new Error('Mobile number is required for sending to unregistered users');
        }
        // For unregistered, we don't have a user object
        usersToSend.push({ mobileNumber: unregisteredMobileNumber, _id: null });
        break;
  
      default:
        res.status(400);
        throw new Error('Invalid sendToType specified');
    }
  
    if (usersToSend.length === 0) {
      res.status(400);
      throw new Error('No valid recipients found for the selected criteria.');
    }
  
    const sentLogs = [];
    for (const user of usersToSend) {
      if (!user.mobileNumber) continue; // Skip if no mobile number
  
      const log = await SmsLog.create({
        mobileNumber: user.mobileNumber,
        message: message,
        messageType: 'Compose New Message',
        smsStatus: 'Pending',
        tenant: req.user.tenant,
        mikrotikUser: user._id, // This will be null for unregistered, which is correct
      });
  
      try {
        const gatewayResponse = await sendSMS(req.user.tenant, user.mobileNumber, message);
        log.smsStatus = gatewayResponse.success ? 'Success' : 'Failed';
        log.providerResponse = gatewayResponse.message;
        await log.save();
        sentLogs.push(log);
      } catch (error) {
        log.smsStatus = 'Failed';
        log.providerResponse = { error: error.message };
        await log.save();
        sentLogs.push(log);
        console.error(`Failed to send SMS to ${user.mobileNumber}: ${error.message}`);
      }
    }
  
    res.status(200).json({ message: 'SMS sending process completed.', logs: sentLogs });
  });

// @desc    Get sent SMS log with filtering and pagination
// @route   GET /api/sms/log
// @access  Private
const getSentSmsLog = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 25;
  const page = Number(req.query.page) || 1;

  const query = { tenant: req.user.tenant };

  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    query.$or = [
      { mobileNumber: searchRegex },
      { message: searchRegex },
    ];
  }

  if (req.query.messageType) {
    query.messageType = req.query.messageType;
  }

  if (req.query.status) {
    query.smsStatus = req.query.status;
  }

  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const count = await SmsLog.countDocuments(query);
  const logs = await SmsLog.find(query)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  const statsAggregation = await SmsLog.aggregate([
    { $match: query },
    { $group: { _id: '$smsStatus', count: { $sum: 1 } } }
  ]);

  const stats = {
    total: count,
    success: 0,
    failed: 0,
  };

  statsAggregation.forEach(status => {
    if (status._id === 'Success') stats.success = status.count;
    if (status._id === 'Failed') stats.failed = status.count;
  });

  res.json({
    logs,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    stats,
  });
});

// @desc    Export SMS logs to CSV
// @route   GET /api/sms/log/export
// @access  Private
const exportSmsLogs = asyncHandler(async (req, res) => {
  const query = { tenant: req.user.tenant };

  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    query.$or = [
      { mobileNumber: searchRegex },
      { message: searchRegex },
    ];
  }

  if (req.query.messageType) {
    query.messageType = req.query.messageType;
  }

  if (req.query.status) {
    query.smsStatus = req.query.status;
  }

  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const logs = await SmsLog.find(query).sort({ createdAt: -1 }).lean();

  const data = logs.map(log => ({
    'Mobile Number': log.mobileNumber,
    'Message': log.message,
    'Message Type': log.messageType,
    'SMS Status': log.smsStatus,
    'Date & Time': log.createdAt.toLocaleString(),
  }));

  if (req.query.format === 'xlsx') {
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "SMS Logs");
    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment('sms_logs.xlsx');
    res.send(buffer);
  } else if (req.query.format === 'pdf') {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.header('Content-Type', 'application/pdf');
    res.attachment('sms_logs.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('SMS Logs', { align: 'center' });
    doc.moveDown();

    const tableTop = doc.y;
    const headers = ['Date & Time', 'Mobile Number', 'Message', 'Status'];
    const columnWidths = [120, 100, 360, 80];
    const rowHeight = 30;

    const drawHeaders = (y) => {
      let currentX = doc.page.margins.left;
      headers.forEach((header, i) => {
        doc.fontSize(10).text(header, currentX, y, { width: columnWidths[i], bold: true });
        currentX += columnWidths[i];
      });
    };

    drawHeaders(tableTop);
    let currentY = tableTop + 20;

    for (const row of data) {
      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
        drawHeaders(currentY);
        currentY += 20;
      }

      let currentX = doc.page.margins.left;
      const rowData = [
        row['Date & Time'],
        row['Mobile Number'],
        row['Message'],
        row['SMS Status'],
      ];

      rowData.forEach((cell, i) => {
        doc.fontSize(8).text(String(cell || ''), currentX, currentY, { width: columnWidths[i], align: 'left' });
        currentX += columnWidths[i];
      });
      
      currentY += rowHeight;
    }

    doc.end();
  } else {
    const csv = await json2csv(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('sms_logs.csv');
    res.send(csv);
  }
});

// @desc    Get SMS logs for a single Mikrotik User
// @route   GET /api/sms/logs/user/:userId
// @access  Private
const getSmsLogsForUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
  
    // Verify the user exists and belongs to the tenant
    const user = await MikrotikUser.findOne({ _id: userId, tenant: req.user.tenant });
    if (!user) {
      res.status(404);
      throw new Error('Mikrotik user not found');
    }
  
    const logs = await SmsLog.find({ mikrotikUser: userId }).sort({ createdAt: -1 });
  
    // Calculate stats
    const stats = {
      total: logs.length,
      acknowledgement: logs.filter(log => log.messageType === 'Acknowledgement').length,
      expiry: logs.filter(log => log.messageType === 'Expiry Alert').length,
      composed: logs.filter(log => log.messageType === 'Compose New Message').length,
      system: logs.filter(log => log.messageType === 'System').length,
    };
  
    res.status(200).json({ logs, stats });
  });

module.exports = {
  getSmsTriggers,
  composeAndSendSms,
  getSentSmsLog,
  exportSmsLogs,
  getSmsLogsForUser,
};