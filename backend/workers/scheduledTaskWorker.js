const { Worker } = require('bullmq');
const connectDB = require('../config/db');
const Tenant = require('../models/Tenant');
const MikrotikUser = require('../models/MikrotikUser');
const SmsLog = require('../models/SmsLog');
const HotspotSession = require('../models/HotspotSession');
const Bill = require('../models/Bill'); // Import Bill model
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue');
const smsQueue = require('../queues/smsQueue');

// Connect to DB once for the worker
connectDB();

const redisConnection = {
  host: 'redis',
  port: 6379,
};

/**
 * The Scheduled Task Worker - The Orchestrator
 * This worker processes high-level, scheduled jobs and delegates granular tasks
 * to the appropriate executor workers (e.g., mikrotikSyncWorker, smsWorker).
 */
const scheduledTaskWorker = new Worker('Scheduled-Tasks', async (job) => {
  const { tenantId } = job.data;
  const { name: jobType } = job;

  console.log(`[${new Date().toISOString()}] Scheduled Task Worker: Processing job '${jobType}' for Tenant: ${tenantId || 'All Tenants'}`);

  try {
    switch (jobType) {
      case 'disconnectExpiredUsers':
        console.log(`[Orchestrator] Finding expired users for tenant ${tenantId} and queueing disconnection jobs.`);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const cursor = MikrotikUser.find({
          tenant: tenantId,
          expiryDate: { $lte: currentDate },
          isSuspended: false,
        }).cursor();

        await cursor.eachAsync(async (expiredUser) => {
          console.log(`[Orchestrator] Found expired user: ${expiredUser.username} (ID: ${expiredUser._id}). Queueing for disconnection.`);

          // Update user in DB to pending suspension
          expiredUser.isSuspended = true;
          expiredUser.syncStatus = 'pending';
          await expiredUser.save();

          // Add a job to the mikrotikSyncQueue to disconnect this specific user
          await mikrotikSyncQueue.add('disconnectUser', {
            mikrotikUserId: expiredUser._id,
            tenantId: tenantId,
            reason: 'expired',
          });
        });
        console.log(`[Orchestrator] Finished queueing disconnection jobs for tenant: ${tenantId}`);
        break;

      case 'disconnectExpiredHotspotUsers':
        console.log(`[Orchestrator] Finding expired hotspot sessions and queueing disconnection jobs.`);
        
        const expiredSessions = await HotspotSession.find({
          endTime: { $lte: new Date() },
        }).populate({
          path: 'planId',
          select: 'mikrotikRouter'
        });

        for (const session of expiredSessions) {
          if (session.planId && session.planId.mikrotikRouter) {
            console.log(`[Orchestrator] Found expired hotspot session for MAC: ${session.macAddress}. Queueing for disconnection.`);

            await mikrotikSyncQueue.add('removeHotspotBinding', {
              macAddress: session.macAddress,
              routerId: session.planId.mikrotikRouter,
            });

            // After successfully queueing, remove the session
            await HotspotSession.findByIdAndDelete(session._id);
          } else {
            console.warn(`[Orchestrator] Found expired hotspot session for MAC: ${session.macAddress} but could not find router information. Deleting session to prevent requeueing.`);
            await HotspotSession.findByIdAndDelete(session._id);
          }
        }
        console.log(`[Orchestrator] Finished queueing hotspot disconnection jobs.`);
        break;

      case 'sendPaymentReminders':
        console.log(`[Orchestrator] Finding users needing payment reminders for tenant ${tenantId} and queueing SMS jobs.`);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        const activeSchedules = await SmsExpirySchedule.find({ tenant: tenantId, status: 'Active' });

        for (const schedule of activeSchedules) {
          const { days, timing, messageBody } = schedule;

          const targetDate = new Date(today);
          if (timing === 'Before') {
            targetDate.setDate(today.getDate() + days);
          } else if (timing === 'After') {
            targetDate.setDate(today.getDate() - days);
          } else {
            continue; // Skip if timing is not applicable
          }

          const usersToNotify = await MikrotikUser.find({
            tenant: tenantId,
            expiryDate: {
              $gte: targetDate,
              $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // Full 24h range of the target date
            }
          }).populate('package');

          for (const user of usersToNotify) {
            // Personalize message
            let personalizedMessage = messageBody;
            const templateData = {
                customer_name: user.officialName || 'Customer',
                reference_number: user.mPesaRefNo || '',
                customer_phone: user.mobileNumber || '',
                transaction_amount: user.package?.price || '',
                expiry_date: user.expiryDate ? user.expiryDate.toLocaleDateString() : '',
            };

            for (const key in templateData) {
                const placeholder = new RegExp(`{{${key}}}`, 'g');
                personalizedMessage = personalizedMessage.replace(placeholder, templateData[key]);
            }

            // Add a job to the smsQueue
            const jobPayload = {
              to: user.mobileNumber,
              message: personalizedMessage,
              tenantId: user.tenant,
              mikrotikUserId: user._id,
              messageType: 'Expiry Alert'
            };
            await smsQueue.add('sendSms', jobPayload);
            console.log(`[Orchestrator] Queued expiry reminder for user ${user.username}.`);
          }
        }
        console.log(`[Orchestrator] Finished queueing payment reminder jobs for tenant: ${tenantId}`);
        break;

      case 'generateMonthlyBilling':
        console.log(`[Orchestrator] Generating monthly billing for tenant ${tenantId}.`);
        const todayForBilling = new Date();
        const currentMonth = todayForBilling.getMonth() + 1; // 1-indexed
        const currentYear = todayForBilling.getFullYear();

        // Calculate previous month and year
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear -= 1;
        }

        // Find unique recurring bill definitions from the previous month
        const recurringBills = await Bill.aggregate([
          {
            $match: {
              tenant: tenantId,
              month: prevMonth,
              year: prevYear,
            }
          },
          {
            $group: {
              _id: {
                name: '$name',
                amount: '$amount',
                dueDate: '$dueDate',
                category: '$category',
              },
              description: { $first: '$description' } 
            }
          }
        ]);

        for (const recurringBill of recurringBills) {
          const { name, amount, dueDate, category } = recurringBill._id;
          const description = recurringBill.description;

          // Check if a bill for this definition already exists for the current month
          const existingBill = await Bill.findOne({
            tenant: tenantId,
            name,
            category,
            month: currentMonth,
            year: currentYear,
          });

          if (!existingBill) {
            // Create a new bill instance for the current month
            await Bill.create({
              tenant: tenantId,
              name,
              amount,
              dueDate,
              category,
              description,
              month: currentMonth,
              year: currentYear,
              status: 'Not Paid',
            });
            console.log(`[Orchestrator] Created new bill for ${name} (${category}) for tenant ${tenantId}`);
            
            // Optionally, queue a notification to the tenant admin
            const tenantAdmin = await Tenant.findById(tenantId).populate('admin');
            if (tenantAdmin && tenantAdmin.admin && tenantAdmin.admin.mobileNumber) {
              const message = `Hi ${tenantAdmin.admin.name}, a new recurring bill for '${name}' (Amount: ${amount}) has been generated for the month of ${currentMonth}/${currentYear}.`;
              const jobPayload = {
                to: tenantAdmin.admin.mobileNumber,
                message: message,
                tenantId: tenantId,
                messageType: 'System'
              };
              await smsQueue.add('sendSms', jobPayload);
              console.log(`[Orchestrator] Queued new bill notification for tenant admin ${tenantAdmin.admin.name}.`);
            }
          }
        }
        console.log(`[Orchestrator] Finished monthly billing generation for tenant: ${tenantId}`);
        break;
      
      case 'reconcileSmsStatus':
        console.log(`[Orchestrator] Starting SMS reconciliation safety net check.`);
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const staleSmsLogs = await SmsLog.find({
          smsStatus: 'Pending',
          createdAt: { $lt: thirtyMinutesAgo },
        });

        if (staleSmsLogs.length > 0) {
          console.error(`[CRITICAL] SMS Reconciliation: Found ${staleSmsLogs.length} SMS log(s) stuck in 'Pending' state.`);
          for (const log of staleSmsLogs) {
            console.warn(`  - Stale Log ID: ${log._id}, To: ${log.mobileNumber}, Tenant: ${log.tenant}, Created At: ${log.createdAt.toISOString()}`);
          }
          console.error(`[CRITICAL] This may indicate that the smsWorker is failing silently or has crashed. Please investigate.`);
        } else {
          console.log(`[Orchestrator] SMS reconciliation check complete. No stale logs found.`);
        }
        break;

      default:
        console.warn(`[${new Date().toISOString()}] Scheduled Task Worker: Unknown job type: ${jobType}`);
        break;
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Scheduled Task Worker: Error processing job '${jobType}' for Tenant: ${tenantId}:`, error);
    throw error; // Re-throw to mark job as failed in BullMQ
  }
}, {
  connection: redisConnection,
  concurrency: 5, // Can process multiple orchestration jobs at once
});

console.log(`[${new Date().toISOString()}] Scheduled Task Worker started.`);

module.exports = scheduledTaskWorker;
