require('./config/env'); // Load environment variables

// Fail-safe check for JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path'); // Import path module

// Import routes
const leadRoutes = require('./routes/leadRoutes');
const { publicRouter: publicUserRoutes, privateRouter: privateUserRoutes } = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // Import upload routes

const dailyTransactionRoutes = require('./routes/dailyTransactionRoutes'); // Import daily transaction routes
const { errorHandler } = require('./middlewares/errorHandler'); // Import error handler
const cron = require('node-cron'); // Import node-cron
const Bill = require('./models/Bill'); // Import Bill model
const SmsExpirySchedule = require('./models/SmsExpirySchedule'); // Import SmsExpirySchedule model
const User = require('./models/User'); // Import User model
const SmsLog = require('./models/SmsLog'); // Import SmsLog model
const { sendSMS } = require('./services/smsService'); // Import SMS service



const billRoutes = require('./routes/billRoutes'); // Import bill routes
const technicianActivityRoutes = require('./routes/technicianActivityRoutes'); // Import technician activity routes
const settingsRoutes = require('./routes/settingsRoutes'); // ADDED
const smsProviderRoutes = require('./routes/smsProviderRoutes'); // Import SMS provider routes



const smsTemplateRoutes = require('./routes/smsTemplateRoutes');
const smsExpiryScheduleRoutes = require('./routes/smsExpiryScheduleRoutes');
const smsAcknowledgementRoutes = require('./routes/smsAcknowledgementRoutes');
const smsRoutes = require('./routes/smsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const publicPaymentRoutes = require('./routes/publicPaymentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const expenseTypeRoutes = require('./routes/expenseTypeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const ticketRoutes = require('./routes/ticketRoutes'); // Import ticket routes
const notificationRoutes = require('./routes/notificationRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes'); // Import invoice routes
// const issueTypeRoutes = require('./routes/issueTypeRoutes'); // Import issue type routes



const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(express.json()); // For parsing application/json
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON:', err);
    return res.status(400).send({ status: 400, message: err.message }); // Bad request
  }
  next();
});
app.use(cookieParser());
app.use(cors({ origin: ['http://localhost:3000', 'http://10.10.10.5:3000'], credentials: true })); // Enable CORS

// DIAGNOSTIC: Log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Basic route
app.get('/', (req, res) => {
  res.send('Referral and Commission System Backend API');
});

const mikrotikRouterRoutes = require('./routes/mikrotikRouterRoutes');
const packageRoutes = require('./routes/packageRoutes');
const mikrotikUserRoutes = require('./routes/mikrotikUserRoutes');
const mikrotikDashboardRoutes = require('./routes/mikrotikDashboardRoutes');
const hotspotPlanRoutes = require('./routes/hotspotPlanRoutes');
const hotspotUserRoutes = require('./routes/hotspotUserRoutes');
const hotspotStkRoutes = require('./routes/hotspotStkRoutes');
const hotspotSessionRoutes = require('./routes/hotspotSessionRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const deviceRoutes = require('./routes/deviceRoutes'); // CPE & AP Devices
const dashboardRoutes = require('./routes/dashboardRoutes');
const searchRoutes = require('./routes/searchRoutes');
const scheduledTaskRoutes = require('./routes/scheduledTaskRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const tenantRoutes = require('./routes/tenantRoutes');

// --- Public Routes ---
// Routes that do not require authentication go here.
app.use('/api/users', publicUserRoutes);
app.use('/api/payments', publicPaymentRoutes);
app.use('/api/upload', uploadRoutes); // Assuming upload might have public access points, adjust if not

// --- Private Routes ---
// Mount protected routes
app.use('/api/users', privateUserRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/mikrotik/routers', mikrotikRouterRoutes);
app.use('/api/mikrotik/packages', packageRoutes);
app.use('/api/mikrotik/users', mikrotikUserRoutes);
app.use('/api/hotspot/plans', hotspotPlanRoutes);
app.use('/api/hotspot/users', hotspotUserRoutes);
app.use('/api/hotspot/vouchers', voucherRoutes);
app.use('/api/hotspot', hotspotStkRoutes);
app.use('/api/hotspot', hotspotSessionRoutes);
app.use('/api/routers/:routerId/dashboard', mikrotikDashboardRoutes);
app.use('/api/devices', deviceRoutes); // CPE & AP Devices
app.use('/api/search', searchRoutes);
app.use('/api/scheduled-tasks', scheduledTaskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/daily-transactions', dailyTransactionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/technician-activities', technicianActivityRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/settings/sms-providers', smsProviderRoutes);
app.use('/api/smstemplates', smsTemplateRoutes);
app.use('/api/smsexpiryschedules', smsExpiryScheduleRoutes);
app.use('/api/smsacknowledgements', smsAcknowledgementRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expensetypes', expenseTypeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/tickets', ticketRoutes);

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const http = require('http'); // Import http module
const socketio = require('./socket'); // Import socket.js
const jwt = require('jsonwebtoken'); // Import jwt
const server = http.createServer(app); // Create HTTP server

const io = socketio.init(server, { cors: { origin: ['http://localhost:3000', 'http://10.10.10.5:3000'], credentials: true } }); // Initialize socket.io

// Middleware to authenticate socket connections
io.use(async (socket, next) => {
  const token = socket.handshake.headers.cookie?.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = await User.findById(decoded.id).select('-password');
    if (!socket.user) {
      return next(new Error('Authentication error: User not found'));
    }
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  // Join a room based on the user's tenant ID for targeted notifications
  const room = socket.user.tenantOwner ? socket.user.tenantOwner.toString() : socket.user.id.toString();
  socket.join(room);
  console.log(`Client ${socket.id} joined room ${room}`);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Initialize WebSocket terminal service
const terminalService = require('./services/terminalService');
terminalService.init(server);
require('./scripts/masterScheduler');

module.exports = app; // For testing purposes

app.use(errorHandler);

// Monthly Bill Reset Cron Job (DEPRECATED - Replaced by subscription-based billing)
// cron.schedule('0 0 1 * *', async () => { // Runs at 00:00 on the 1st of every month
//   console.log('Running monthly bill reset job...');
//   const today = new Date();
//   const currentMonth = today.getMonth() + 1; // 1-indexed
//   const currentYear = today.getFullYear();
//
//   // Calculate previous month and year
//   let prevMonth = currentMonth - 1;
//   let prevYear = currentYear;
//   if (prevMonth === 0) {
//     prevMonth = 12;
//     prevYear -= 1;
//   }
//
//   try {
//     const tenants = await User.find({ roles: 'ADMIN_TENANT' });
//     for (const tenant of tenants) {
//       // Find unique recurring bill definitions from the previous month's bills for this tenant
//       const recurringBills = await Bill.aggregate([
//         {
//           $match: {
//             tenantOwner: tenant._id,
//             month: prevMonth,
//             year: prevYear,
//           }
//         },
//         {
//           $group: {
//             _id: {
//               name: '$name',
//               amount: '$amount',
//               dueDate: '$dueDate',
//               category: '$category',
//             },
//             description: { $first: '$description' } 
//           }
//         }
//       ]);
//
//       for (const recurringBill of recurringBills) {
//         const { name, amount, dueDate, category } = recurringBill._id;
//         const description = recurringBill.description;
//
//         // Check if a bill for this definition already exists for the current month
//         const existingBill = await Bill.findOne({
//           tenantOwner: tenant._id,
//           name,
//           category,
//           month: currentMonth,
//           year: currentYear,
//         });
//
//         if (!existingBill) {
//           // Create a new bill instance for the current month
//           await Bill.create({
//             tenantOwner: tenant._id,
//             name,
//             amount,
//             dueDate,
//             category,
//             description,
//             month: currentMonth,
//             year: currentYear,
//             status: 'Not Paid',
//           });
//           console.log(`Created new bill for ${name} (${category}) for ${currentMonth}/${currentYear} for tenant ${tenant._id}`);
//         }
//       }
//     }
//     console.log('Monthly bill reset job completed successfully.');
//   } catch (error) {
//     console.error('Error running monthly bill reset job:', error);
//   }
// });

// SMS Expiry Notification Cron Job (DEPRECATED - Replaced by master scheduler task)
// cron.schedule('0 0 * * *', async () => { // Runs daily at 00:00
//   console.log('Running Expiry Notification Job...');
//   const today = new Date();
//   today.setHours(0, 0, 0, 0); // Normalize to start of day
//
//   try {
//     const tenants = await User.find({ roles: 'ADMIN_TENANT' });
//     for (const tenant of tenants) {
//       const activeSchedules = await SmsExpirySchedule.find({ status: 'Active', tenantOwner: tenant._id })
//         .populate('smsTemplate')
// 
//
//       for (const schedule of activeSchedules) {
//         const { days, timing, smsTemplate, whatsAppTemplate } = schedule;
//
//         if (!smsTemplate) {
//           console.warn(`Skipping schedule "${schedule.name}" because its SMS template is missing.`);
//           continue;
//         }
//
//         const targetDate = new Date(today);
//         if (timing === 'Before') {
//           targetDate.setDate(today.getDate() + days);
//         } else if (timing === 'After') {
//           targetDate.setDate(today.getDate() - days);
//         } else {
//           continue;
//         }
//
//         const usersToNotify = await MikrotikUser.find({
//           tenantOwner: tenant._id,
//           expiryDate: {
//             $gte: targetDate,
//             $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
//           }
//         });
//
//         for (const user of usersToNotify) {
//           const useWhatsApp = user.whatsappOptIn && whatsAppTemplate;
//           
//           let personalizedMessage;
//           const templateData = {
//               customer_name: user.officialName || 'Customer',
//               reference_number: user.mPesaRefNo || '',
//               customer_phone: user.mobileNumber || '',
//               transaction_amount: user.package.price || '',
//               expiry_date: user.expiryDate ? user.expiryDate.toLocaleDateString() : '',
//           };
//
//           if (useWhatsApp) {
//             const templateParameters = {
//               '1': templateData.customer_name,
//               '2': templateData.transaction_amount,
//               '3': templateData.expiry_date,
//             };
//
//             const whatsappResult = await sendWhatsAppMessage(user.tenantOwner, user.mobileNumber, whatsAppTemplate.providerTemplateId, templateParameters);
//             
//             await WhatsAppLog.create({
//               mobileNumber: user.mobileNumber,
//               templateUsed: whatsAppTemplate._id,
//               status: whatsappResult.success ? 'Queued' : 'Failed',
//               providerResponse: whatsappResult.message,
//               tenantOwner: user.tenantOwner,
//               variablesUsed: templateParameters,
//             });
//
//           } else {
//             personalizedMessage = smsTemplate.messageBody;
//             for (const key in templateData) {
//                 const placeholder = new RegExp(`{{${key}}}`, 'g');
//                 personalizedMessage = personalizedMessage.replace(placeholder, templateData[key]);
//             }
//
//             const smsResult = await sendSMS(user.tenantOwner, user.mobileNumber, personalizedMessage);
//
//             await SmsLog.create({
//               mobileNumber: user.mobileNumber,
//               message: personalizedMessage,
//               messageType: 'Expiry Alert',
//               smsStatus: smsResult.success ? 'Success' : 'Failed',
//               providerResponse: smsResult.message,
//               tenantOwner: user.tenantOwner,
//             });
//           }
//         }
//       }
//     }
//     console.log('Expiry Notification Job completed successfully.');
//   } catch (error) {
//     console.error('Error running Expiry Notification Job:', error);
//   }
// });