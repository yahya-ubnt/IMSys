const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Tenant = require('../models/Tenant');
const MikrotikUser = require('../models/MikrotikUser');
const SmsExpirySchedule = require('../models/SmsExpirySchedule');
const NotificationLog = require('../models/NotificationLog');
const SmsLog = require('../models/SmsLog');
const WhatsAppLog = require('../models/WhatsAppLog');
const { sendSMS } = require('../services/smsService');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const sendExpiryNotifications = async () => {
  console.log('Running Robust Expiry Notification Job...');
  
  try {
    await connectDB();
    const tenants = await Tenant.find({ status: 'active' });

    for (const tenant of tenants) {
      const activeSchedules = await SmsExpirySchedule.find({ status: 'Active', tenant: tenant._id })
        .populate('smsTemplate')
        .populate('whatsAppTemplate');

      for (const schedule of activeSchedules) {
        const { days, timing, smsTemplate, whatsAppTemplate } = schedule;

        if (!smsTemplate) {
          console.warn(`Skipping schedule "${schedule.name}" because its SMS template is missing.`);
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
            const daysRemaining = Math.round((user.expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            const useWhatsApp = user.whatsappOptIn && whatsAppTemplate;
            
            const templateData = {
                customer_name: user.officialName || 'Customer',
                reference_number: user.mPesaRefNo || '',
                customer_phone: user.mobileNumber || '',
                transaction_amount: user.package ? user.package.price : '',
                expiry_date: user.expiryDate ? user.expiryDate.toLocaleDateString() : '',
                days_remaining: daysRemaining,
            };

            if (useWhatsApp) {
              const templateParameters = {
                '1': templateData.customer_name,
                '2': templateData.transaction_amount,
                '3': templateData.expiry_date,
                '4': templateData.days_remaining.toString(),
              };
              const whatsappResult = await sendWhatsAppMessage(user.tenant, user.mobileNumber, whatsAppTemplate.providerTemplateId, templateParameters);
              await WhatsAppLog.create({
                mobileNumber: user.mobileNumber,
                message: `WhatsApp template sent: ${whatsAppTemplate.name}`,
                status: whatsappResult.success ? 'Success' : 'Failed',
                providerResponse: whatsappResult.message,
                tenant: user.tenant,
              });
            } else {
              let personalizedMessage = smsTemplate.messageBody;
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
              });
            }

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
    console.log('Robust Expiry Notification Job completed successfully.');
  } catch (error) {
    console.error('Error running Robust Expiry Notification Job:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

sendExpiryNotifications();
