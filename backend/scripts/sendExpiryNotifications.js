const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
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
    const tenants = await User.find({ roles: 'ADMIN_TENANT' });

    for (const tenant of tenants) {
      const activeSchedules = await SmsExpirySchedule.find({ status: 'Active', tenantOwner: tenant._id })
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
          tenantOwner: tenant._id,
          expiryDate: timing === 'Before' ? { $gte: today, $lte: searchWindow } : { $gte: searchWindow, $lte: today },
        };

        const usersToConsider = await MikrotikUser.find(query).populate('package');
        if (usersToConsider.length === 0) {
          continue;
        }

        // 2. Find users who have already been notified for this specific schedule
        const notifiedUserIds = (await NotificationLog.find({
          mikrotikUser: { $in: usersToConsider.map(u => u._id) },
          smsExpirySchedule: schedule._id,
        })).map(log => log.mikrotikUser.toString());

        // 3. Filter out the notified users
        const usersToNotify = usersToConsider.filter(user => !notifiedUserIds.includes(user._id.toString()));

        console.log(`Found ${usersToNotify.length} users to notify for schedule "${schedule.name}".`);

        for (const user of usersToNotify) {
          // 4. Dynamic message logic
          const daysRemaining = Math.round((user.expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

          const useWhatsApp = user.whatsappOptIn && whatsAppTemplate;
          
          let personalizedMessage;
          const templateData = {
              customer_name: user.officialName || 'Customer',
              reference_number: user.mPesaRefNo || '',
              customer_phone: user.mobileNumber || '',
              transaction_amount: user.package ? user.package.price : '',
              expiry_date: user.expiryDate ? user.expiryDate.toLocaleDateString() : '',
              days_remaining: daysRemaining, // The new dynamic placeholder
          };

          if (useWhatsApp) {
            // Assuming WhatsApp templates are configured with a numeric parameter for days_remaining
            const templateParameters = {
              '1': templateData.customer_name,
              '2': templateData.transaction_amount,
              '3': templateData.expiry_date,
              '4': templateData.days_remaining.toString(),
            };

            const whatsappResult = await sendWhatsAppMessage(user.tenantOwner, user.mobileNumber, whatsAppTemplate.providerTemplateId, templateParameters);
            
            await WhatsAppLog.create({ /* ... logging ... */ });

          } else {
            personalizedMessage = smsTemplate.messageBody;
            for (const key in templateData) {
                const placeholder = new RegExp(`{{${key}}}`, 'g');
                personalizedMessage = personalizedMessage.replace(placeholder, templateData[key]);
            }

            const smsResult = await sendSMS(user.tenantOwner, user.mobileNumber, personalizedMessage);

            await SmsLog.create({ /* ... logging ... */ });
          }

          // 5. Log that the notification was sent to prevent duplicates
          await NotificationLog.create({
            tenantOwner: user.tenantOwner,
            mikrotikUser: user._id,
            smsExpirySchedule: schedule._id,
          });

           console.log(`Notification sent to ${user.username} for schedule "${schedule.name}".`);
        }
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
