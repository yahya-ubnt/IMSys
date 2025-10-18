const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ScheduledTask = require('../models/ScheduledTask');
const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');

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

const masterScheduler = async () => {
  console.log(`[${new Date().toISOString()}] --- Master Scheduler Service Started ---`);
  
  cron.schedule('* * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Scheduler checking for due tasks...`);
    
    try {
      const tasks = await ScheduledTask.find({ isEnabled: true });
      
      for (const task of tasks) {
        if (cron.validate(task.schedule) && cron.match(task.schedule, new Date())) {
          console.log(`[${new Date().toISOString()}] Task '${task.name}' for tenant ${task.tenantOwner} is due. Executing...`);
          
          executeTask(task);
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in scheduler main loop:`, error);
    }
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

// Connect to DB and start the scheduler
const startService = async () => {
    await connectDB();
    masterScheduler();
};

startService();
