const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ScheduledTask = require('../models/ScheduledTask');
const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');

const executeScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    const absoluteScriptPath = path.resolve(__dirname, scriptPath);
    const child = spawn('node', [absoluteScriptPath]);
    
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

const runScheduler = async () => {
  console.log(`[${new Date().toISOString()}] --- Master Scheduler checking for due tasks... ---`);
  
  try {
    await connectDB();

    const tasks = await ScheduledTask.find({ isEnabled: true });
    const now = new Date();

    for (const task of tasks) {
      if (cron.validate(task.schedule)) {
        // This is a simplified check. A more robust solution would parse the cron string.
        // For now, we'll rely on a library that can check if the time matches.
        // Let's create a temporary task to check.
        const cronTask = cron.schedule(task.schedule, async () => {
            console.log(`[${new Date().toISOString()}] Task '${task.name}' is due. Executing...`);
            
            task.lastRun = new Date();
            task.lastStatus = 'Running';
            await task.save();

            try {
                const output = await executeScript(task.scriptPath);
                task.lastStatus = 'Success';
                task.logOutput = output;
                console.log(`[${new Date().toISOString()}] Task '${task.name}' executed successfully.`);
            } catch (error) {
                task.lastStatus = 'Failed';
                task.logOutput = error.message;
                console.error(`[${new Date().toISOString()}] Task '${task.name}' failed:`, error.message);
            }
            await task.save();
            
            cronTask.stop(); // Stop the temporary task after execution
        }, {
            scheduled: false // Don't start it automatically
        });

        // Manually trigger the check. This is a workaround for node-cron's API.
        // A better library might be needed for direct "isDue" checks.
        // For now, we can simulate this by starting and stopping.
        // This is not ideal, let's rethink.
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] An error occurred in the master scheduler:`, error);
  } finally {
    // We don't close the connection here as the cron tasks might still be running.
    // The individual scripts are responsible for closing their own connections.
  }
};


// A better approach for the scheduler logic
const masterScheduler = async () => {
  console.log(`[${new Date().toISOString()}] --- Master Scheduler Service Started ---`);
  
  // This single cron job runs every minute and acts as our main loop.
  cron.schedule('* * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Scheduler checking for due tasks...`);
    
    try {
      const tasks = await ScheduledTask.find({ isEnabled: true });
      
      for (const task of tasks) {
        // Use the cron pattern to check if this task is due to run right now.
        if (cron.validate(task.schedule) && cron.match(task.schedule, new Date())) {
          console.log(`[${new Date().toISOString()}] Task '${task.name}' is due. Executing...`);
          
          // We don't await this, allowing multiple tasks to run in parallel if they are due at the same time.
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
    if (!taskDoc) return; // Task may have been deleted

    taskDoc.lastRun = new Date();
    taskDoc.lastStatus = 'Running';
    await taskDoc.save();

    try {
        const output = await executeScript(path.join(__dirname, '..', task.scriptPath));
        taskDoc.lastStatus = 'Success';
        taskDoc.logOutput = output;
        await taskDoc.save();
        console.log(`[${new Date().toISOString()}] Task '${task.name}' finished successfully.`);
    } catch (error) {
        taskDoc.lastStatus = 'Failed';
        taskDoc.logOutput = error.message;
        await taskDoc.save();
        console.error(`[${new Date().toISOString()}] Task '${task.name}' failed: ${error.message}`);
    }
};

// Connect to DB and start the scheduler
const startService = async () => {
    await connectDB();
    masterScheduler();
};

startService();
