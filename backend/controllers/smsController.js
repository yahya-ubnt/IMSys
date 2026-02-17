const asyncHandler = require('express-async-handler');
const { sendSMS, sendBulkSms, getSmsLogs, getSmsLogsForUser } = require('../services/smsService');
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
      sendToType,
      userIds,
      mikrotikRouterIds,
      apartmentHouseNumbers,
      unregisteredMobileNumber,
    } = req.body;
  
    const recipientIds = userIds || mikrotikRouterIds || apartmentHouseNumbers;
    const logs = await sendBulkSms(message, sendToType, recipientIds, req.user.tenant, unregisteredMobileNumber);
  
    res.status(200).json({ message: 'SMS sending process completed.', logs });
  });

// @desc    Get sent SMS log with filtering and pagination
// @route   GET /api/sms/log
// @access  Private
const getSentSmsLog = asyncHandler(async (req, res) => {
  const data = await getSmsLogs(req.user.tenant, req.query);
  res.json(data);
});

// @desc    Export SMS logs to CSV
// @route   GET /api/sms/log/export
// @access  Private
const exportSmsLogs = asyncHandler(async (req, res) => {
  const { logs } = await getSmsLogs(req.user.tenant, { ...req.query, limit: 0 }); // Get all logs for export

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
const getSmsLogsForUserController = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const data = await getSmsLogsForUser(userId, req.user.tenant);
    res.status(200).json(data);
  });

module.exports = {
  getSmsTriggers,
  composeAndSendSms,
  getSentSmsLog,
  exportSmsLogs,
  getSmsLogsForUserController,
};