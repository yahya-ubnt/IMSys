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



const { setupReconciliationScheduler, processReconciliationScheduler } = require('./jobs/reconciliationJob');
const { setupSmsReconciliationScheduler } = require('./jobs/smsReconciliationJob');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Setup BullMQ repeatable jobs
setupReconciliationScheduler();
setupSmsReconciliationScheduler();

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
const buildingRoutes = require('./routes/buildingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const searchRoutes = require('./routes/searchRoutes');
const scheduledTaskRoutes = require('./routes/scheduledTaskRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// --- Public Routes ---
// Routes that do not require authentication go here.
app.use('/api/users', publicUserRoutes);
app.use('/api/payments', publicPaymentRoutes);
app.use('/api/upload', uploadRoutes); // Assuming upload might have public access points, adjust if not
app.use('/api/webhooks', webhookRoutes);

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
app.use('/api/buildings', buildingRoutes);
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
require('./workers/smsWorker');
require('./workers/scheduledTaskWorker');

module.exports = app; // For testing purposes

app.use(errorHandler);