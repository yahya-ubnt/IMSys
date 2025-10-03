require('./config/env'); // Load environment variables
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path'); // Import path module

// Import routes
const leadRoutes = require('./routes/leadRoutes');
const buildingRoutes = require('./routes/buildingRoutes');
const unitRoutes = require('./routes/unitRoutes');
const unitDirectRoutes = require('./routes/unitDirectRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // Import upload routes

const dailyTransactionRoutes = require('./routes/dailyTransactionRoutes'); // Import daily transaction routes
const { errorHandler } = require('./middlewares/errorHandler'); // Import error handler
const cron = require('node-cron'); // Import node-cron
const Bill = require('./models/Bill'); // Import Bill model
const SmsExpirySchedule = require('./models/SmsExpirySchedule'); // Import SmsExpirySchedule model
const User = require('./models/User'); // Import User model
const SmsLog = require('./models/SmsLog'); // Import SmsLog model
const { sendSMS } = require('./services/smsService'); // Import SMS service
const { sendWhatsAppMessage } = require('./services/whatsappService'); // Import WhatsApp service


const billRoutes = require('./routes/billRoutes'); // Import bill routes
const technicianActivityRoutes = require('./routes/technicianActivityRoutes'); // Import technician activity routes
const settingsRoutes = require('./routes/settingsRoutes'); // ADDED
const smsProviderRoutes = require('./routes/smsProviderRoutes'); // Import SMS provider routes
const whatsAppProviderRoutes = require('./routes/whatsAppProviderRoutes'); // Import WhatsApp provider routes
const whatsAppTemplateRoutes = require('./routes/whatsAppTemplateRoutes'); // Import WhatsApp template routes
const whatsappRoutes = require('./routes/whatsappRoutes'); // Import WhatsApp routes
const smsTemplateRoutes = require('./routes/smsTemplateRoutes');
const smsExpiryScheduleRoutes = require('./routes/smsExpiryScheduleRoutes');
const smsAcknowledgementRoutes = require('./routes/smsAcknowledgementRoutes');
const smsRoutes = require('./routes/smsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const expenseTypeRoutes = require('./routes/expenseTypeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const ticketRoutes = require('./routes/ticketRoutes'); // Import ticket routes
// const issueTypeRoutes = require('./routes/issueTypeRoutes'); // Import issue type routes



// Mount unit routes under building routes
buildingRoutes.use('/:buildingId/units', unitRoutes);


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(express.json()); // For parsing application/json
app.use(cors()); // Enable CORS

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
const deviceRoutes = require('./routes/deviceRoutes'); // CPE & AP Devices
const dashboardRoutes = require('./routes/dashboardRoutes');
const bulkDiagnosticRoutes = require('./routes/bulkDiagnosticRoutes');
const searchRoutes = require('./routes/searchRoutes');
const scheduledTaskRoutes = require('./routes/scheduledTaskRoutes');

// Mount routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/mikrotik/routers', mikrotikRouterRoutes);
app.use('/api/mikrotik/packages', packageRoutes);
app.use('/api/mikrotik/users', mikrotikUserRoutes);
app.use('/api/routers/:routerId/dashboard', mikrotikDashboardRoutes);
app.use('/api/devices', deviceRoutes); // CPE & AP Devices
app.use('/api/bulk-diagnostics', bulkDiagnosticRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/scheduled-tasks', scheduledTaskRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/units', unitDirectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);


// app.use('/api/providers', require('./routes/providerRoutes')); // Add provider routes

app.use('/api/daily-transactions', dailyTransactionRoutes); // Add daily transaction routes
app.use('/api/bills', billRoutes); // Add bill routes
app.use('/api/technician-activities', technicianActivityRoutes);
app.use('/api/settings', settingsRoutes); // ADDED // Add technician activity routes
app.use('/api/settings/sms-providers', smsProviderRoutes); // Mount SMS provider routes
app.use('/api/settings/whatsapp-providers', whatsAppProviderRoutes); // Mount WhatsApp provider routes
app.use('/api/whatsapp-templates', whatsAppTemplateRoutes); // Mount WhatsApp template routes
app.use('/api/whatsapp', whatsappRoutes); // Mount WhatsApp routes
app.use('/api/smstemplates', smsTemplateRoutes);
app.use('/api/smsexpiryschedules', smsExpiryScheduleRoutes);
app.use('/api/smsacknowledgements', smsAcknowledgementRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expensetypes', expenseTypeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/tickets', ticketRoutes); // Add ticket routes
// app.use('/api/issue-types', issueTypeRoutes); // Add issue type routes




// Simple GET routes for testing wiring
app.get('/api/test/buildings', (req, res) => res.json({ message: 'GET /api/buildings endpoint is wired.' }));
app.get('/api/test/units', (req, res) => res.json({ message: 'GET /api/units endpoint is wired.' }));

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize WebSocket terminal service
const terminalService = require('./services/terminalService');
const monitoringService = require('./services/monitoringService'); // Import monitoring service
const { startRouterMonitoring } = require('./services/routerMonitoringService'); // Import router monitoring service
const { startUserMonitoring } = require('./services/userMonitoringService');
terminalService.init(server);
monitoringService.startMonitoring(); // Start the device monitoring service
startRouterMonitoring(5000); // Start router monitoring every 5 seconds
startUserMonitoring(60000); // Start user monitoring every 60 seconds

module.exports = app; // For testing purposes

app.use(errorHandler);

// Monthly Bill Reset Cron Job
cron.schedule('0 0 1 * *', async () => { // Runs at 00:00 on the 1st of every month
  console.log('Running monthly bill reset job...');
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-indexed
  const currentYear = today.getFullYear();

  // Calculate previous month and year
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  try {
    // Find unique recurring bill definitions from the previous month's bills
    const recurringBills = await Bill.aggregate([
      {
        $match: {
          month: prevMonth,
          year: prevYear,
          // Optionally, filter by status if only 'active' recurring bills should carry over
          // status: { $ne: 'Deleted' } // Assuming a 'Deleted' status if implemented
        }
      },
      {
        $group: {
          _id: {
            user: '$user',
            name: '$name',
            amount: '$amount',
            dueDate: '$dueDate',
            category: '$category',
          },
          // You can add other fields here if needed for the new bill instance
          description: { $first: '$description' } // Take description from one of the previous month's bills
        }
      }
    ]);

    for (const recurringBill of recurringBills) {
      const { user, name, amount, dueDate, category } = recurringBill._id;
      const description = recurringBill.description;

      // Check if a bill for this definition already exists for the current month
      const existingBill = await Bill.findOne({
        user,
        name,
        category,
        month: currentMonth,
        year: currentYear,
      });

      if (!existingBill) {
        // Create a new bill instance for the current month
        await Bill.create({
          user,
          name,
          amount,
          dueDate,
          category,
          description,
          month: currentMonth,
          year: currentYear,
          status: 'Not Paid',
        });
        console.log(`Created new bill for ${name} (${category}) for ${currentMonth}/${currentYear} for user ${user}`);
      }
    }
    console.log('Monthly bill reset job completed successfully.');
  } catch (error) {
    console.error('Error running monthly bill reset job:', error);
  }
});

// SMS Expiry Notification Cron Job
cron.schedule('0 0 * * *', async () => { // Runs daily at 00:00
  console.log('Running Expiry Notification Job...');
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  try {
    const activeSchedules = await SmsExpirySchedule.find({ status: 'Active' })
      .populate('smsTemplate')
      .populate('whatsAppTemplate');

    for (const schedule of activeSchedules) {
      const { days, timing, smsTemplate, whatsAppTemplate } = schedule;

      if (!smsTemplate) {
        console.warn(`Skipping schedule "${schedule.name}" because its SMS template is missing.`);
        continue;
      }

      const targetDate = new Date(today);
      if (timing === 'Before') {
        targetDate.setDate(today.getDate() + days);
      } else if (timing === 'After') {
        targetDate.setDate(today.getDate() - days);
      } else {
        continue;
      }

      const usersToNotify = await User.find({
        expiryDate: {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      for (const user of usersToNotify) {
        const useWhatsApp = user.whatsappOptIn && whatsAppTemplate;
        
        let personalizedMessage;
        const templateData = {
            customer_name: user.name || 'Customer',
            reference_number: user.referenceNumber || '',
            customer_phone: user.phoneNumber || '',
            transaction_amount: user.transactionAmount || '',
            expiry_date: user.expiryDate ? user.expiryDate.toLocaleDateString() : '',
        };

        if (useWhatsApp) {
          // For WhatsApp, the 'body' is just for reference; the service uses the providerTemplateId.
          // The templateParameters need to match what the provider expects (e.g., { '1': 'value', '2': 'value' })
          // This is a simplification; a more robust solution would map names to numbers.
          const templateParameters = {
            '1': templateData.customer_name,
            '2': templateData.transaction_amount,
            '3': templateData.expiry_date,
          };

          const whatsappResult = await sendWhatsAppMessage(user.phoneNumber, whatsAppTemplate.providerTemplateId, templateParameters);
          
          // Log WhatsApp message (a new model `WhatsAppLog` will be needed)
          // await WhatsAppLog.create({ ... });

        } else {
          // Fallback to SMS
          personalizedMessage = smsTemplate.messageBody;
          for (const key in templateData) {
              const placeholder = new RegExp(`{{${key}}}`, 'g');
              personalizedMessage = personalizedMessage.replace(placeholder, templateData[key]);
          }

          const smsResult = await sendSMS(user.phoneNumber, personalizedMessage);

          await SmsLog.create({
            mobileNumber: user.phoneNumber,
            message: personalizedMessage,
            messageType: 'Expiry Alert',
            smsStatus: smsResult.success ? 'Success' : 'Failed',
            providerResponse: smsResult.message,
            user: user._id,
          });
        }
      }
    }
    console.log('Expiry Notification Job completed successfully.');
  } catch (error) {
    console.error('Error running Expiry Notification Job:', error);
  }
});