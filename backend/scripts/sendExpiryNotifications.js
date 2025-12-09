const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Tenant = require('../models/Tenant');
const MikrotikUser = require('../models/MikrotikUser');
const SmsExpirySchedule = require('../models/SmsExpirySchedule');
const NotificationLog = require('../models/NotificationLog');
const SmsLog = require('../models/SmsLog');
const Package = require('../models/Package'); // Import the Package model
const { sendSMS } = require('../services/smsService');

const sendExpiryNotifications = async () => {
  console.log('Running Expiry Notification Job...');
  
  try {
    await connectDB();
    const tenants = await Tenant.find({ status: 'active' });

    for (const tenant of tenants) {
      const activeSchedules = await SmsExpirySchedule.find({ status: 'Active', tenant: tenant._id });

      for (const schedule of activeSchedules) {
        const { days, timing, messageBody } = schedule;

        if (!messageBody) {
          console.warn(`Skipping schedule "${schedule.name}" because its message body is empty.`);
          continue;
        }

        // 1. Widen the query window (e.g., 10 days for 'Before' schedules)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const searchWindow = new Date();
        if (timing === 'Before') {
          searchWindow.setDate(today.getDate() + 10);
        } else {
          searchWindow.setDate(today.getDate() - 10);
        }

        const query = {
          tenant: tenant._id,
          expiryDate: timing === 'Before' ? { $gte: today, $lte: searchWindow } : { $gte: searchWindow, $lte: today },
        };

        console.log(`Processing users for schedule "${schedule.name}"...`);
        const userCursor = MikrotikUser.find(query).populate('package').cursor();

        await userCursor.eachAsync(async (user) => {
          try {
            // 2. Check if user has already been notified for this specific schedule
            const alreadyNotified = await NotificationLog.findOne({
              mikrotikUser: user._id,
              smsExpirySchedule: schedule._id,
            });

            // 3. If not already notified, proceed
            if (alreadyNotified) {
              return; // Skip to next user
            }

            console.log(`Preparing to notify user ${user.username} for schedule "${schedule.name}".`);

            // 4. Dynamic message logic
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Normalize today to the beginning of the day
            const expiry = new Date(user.expiryDate);
            expiry.setHours(0, 0, 0, 0); // Normalize expiry date as well

            const diffTime = expiry.getTime() - now.getTime();
            
            let daysRemaining = 0;
            if (diffTime >= 0) { // Only calculate if not expired
              daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
            }
            
            const templateData = {
                officialName: user.officialName || 'Customer',
                mPesaRefNo: user.mPesaRefNo || '',
                mobileNumber: user.mobileNumber || '',
                walletBalance: user.walletBalance ? user.walletBalance.toFixed(2) : '0.00',
                transaction_amount: user.package ? user.package.price : '',
                expiryDate: user.expiryDate ? user.expiryDate.toLocaleDateString() : '',
                daysRemaining: daysRemaining,
            };

            let personalizedMessage = messageBody;
            for (const key in templateData) {
                const placeholder = new RegExp(`{{${key}}}`, 'g');
                personalizedMessage = personalizedMessage.replace(placeholder, templateData[key]);
            }
            const smsResult = await sendSMS(user.tenant, user.mobileNumber, personalizedMessage);
            await SmsLog.create({
              mobileNumber: user.mobileNumber,
              message: personalizedMessage,
              messageType: 'Expiry Alert',
              smsStatus: smsResult.success ? 'Success' : 'Failed',
              providerResponse: smsResult.message,
              tenant: user.tenant,
              mikrotikUser: user._id, // Associate with the user
            });

            // 5. Log that the notification was sent to prevent duplicates
            await NotificationLog.create({
              tenant: user.tenant,
              mikrotikUser: user._id,
              smsExpirySchedule: schedule._id,
            });

            console.log(`Notification sent to ${user.username} for schedule "${schedule.name}".`);

          } catch (userError) {
            console.error(`Failed to process notification for user ${user.username} on schedule "${schedule.name}". Error:`, userError);
            // This error is logged, and the loop will continue with the next user.
          }
        });
      }
    }
    console.log('Expiry Notification Job completed successfully.');
  } catch (error) {
    console.error('Error running Expiry Notification Job:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

sendExpiryNotifications();
