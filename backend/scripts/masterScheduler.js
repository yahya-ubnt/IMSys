const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ScheduledTask = require('../models/ScheduledTask');
const User = require('../models/User');
const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');
const { performRouterStatusCheck } = require('../services/routerMonitoringService');
const { performUserStatusCheck } = require('../services/userMonitoringService');
const { checkAllDevices } = require('../services/monitoringService');
const eventEmitter = require('../events');

const scheduledJobs = {};

const executeScript = (scriptPath, tenantId) => {
  return new Promise((resolve, reject) => {
    const absoluteScriptPath = path.resolve(__dirname, scriptPath);
    const child = spawn('node', [absoluteScriptPath, tenantId]);
    
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout || 'Script executed successfully.');
      } else {
        reject(new Error(stderr || `Script exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
};

const executeTask = async (task) => {
    const taskDoc = await ScheduledTask.findById(task._id);
    if (!taskDoc) return;

    taskDoc.lastRun = new Date();
    taskDoc.lastStatus = 'Running';
    await taskDoc.save();

    try {
        const output = await executeScript(path.join(__dirname, '..', task.scriptPath), task.tenantOwner);
        taskDoc.lastStatus = 'Success';
        taskDoc.logOutput = output;
        await taskDoc.save();
        console.log(`[${new Date().toISOString()}] Task '${task.name}' for tenant ${task.tenantOwner} finished successfully.`);
    } catch (error) {
        taskDoc.lastStatus = 'Failed';
        taskDoc.logOutput = error.message;
        await taskDoc.save();
        console.error(`[${new Date().toISOString()}] Task '${task.name}' for tenant ${task.tenantOwner} failed: ${error.message}`);
    }
};

const scheduleTask = (task) => {
  if (cron.validate(task.schedule)) {
    const job = cron.schedule(task.schedule, () => {
      console.log(`Executing task: ${task.name}`);
      executeTask(task);
    });
    scheduledJobs[task._id] = job;
  }
};

const unscheduleTask = (taskId) => {
  if (scheduledJobs[taskId]) {
    scheduledJobs[taskId].stop();
    delete scheduledJobs[taskId];
  }
};

const masterScheduler = async () => {
  console.log(`[${new Date().toISOString()}] --- Master Scheduler Service Started ---`);
  
  // Schedule all existing tasks on startup
  const tasks = await ScheduledTask.find({ isEnabled: true });
  tasks.forEach(scheduleTask);

  // Listen for task changes
  eventEmitter.on('task:created', scheduleTask);
  eventEmitter.on('task:updated', (task) => {
    console.log(`[${new Date().toISOString()}] Updating schedule for task '${task.name}' to '${task.schedule}'`);
    unscheduleTask(task._id);
    if (task.isEnabled) {
      scheduleTask(task);
    }
  });
  eventEmitter.on('task:deleted', unscheduleTask);

  // Schedule monitoring jobs to run every minute
  cron.schedule('* * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Scheduler running monitoring jobs...`);
    
    try {
      const tenants = await User.find({ roles: 'ADMIN_TENANT' });
      for (const tenant of tenants) {
        performRouterStatusCheck(tenant._id);
        performUserStatusCheck(tenant._id);
        checkAllDevices(tenant._id);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in monitoring jobs main loop:`, error);
    }
  });
};

// Connect to DB and start the scheduler
const startService = async () => {
    await connectDB();
    masterScheduler();
};

startService();
