const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const ScheduledTask = require('../models/ScheduledTask');
const { spawn } = require('child_process');
const path = require('path');
const eventEmitter = require('../events');

// Helper to execute a script
const executeScript = (scriptPath, tenantId) => { // Pass tenantId to the script
  return new Promise((resolve, reject) => {
    const absoluteScriptPath = path.resolve(__dirname, '..', scriptPath);
    const child = spawn('node', [absoluteScriptPath, tenantId]); // Pass tenantId as an argument
    
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => stdout += data.toString());
    child.stderr.on('data', (data) => stderr += data.toString());

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout || 'Script executed successfully.');
      } else {
        reject(new Error(stderr || `Script exited with code ${code}`));
      }
    });
    child.on('error', (err) => reject(err));
  });
};

// @desc    Get all scheduled tasks
// @route   GET /api/scheduled-tasks
// @access  Private/Admin
const getScheduledTasks = asyncHandler(async (req, res) => {
  const filter = { tenant: req.user.tenant };
  const tasks = await ScheduledTask.find(filter).sort({ createdAt: 'desc' });
  res.status(200).json(tasks);
});

// @desc    Create a new scheduled task
// @route   POST /api/scheduled-tasks
// @access  Private/Admin
const createScheduledTask = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, scriptPath, schedule, isEnabled } = req.body;

  const task = await ScheduledTask.create({
    name,
    description,
    scriptPath,
    schedule,
    isEnabled,
    tenant: req.user.tenant, // Associate with the logged-in user's tenant
  });
  
  if (task.isEnabled) {
    eventEmitter.emit('task:created', task);
  }

  res.status(201).json(task);
});

// @desc    Update a scheduled task
// @route   PUT /api/scheduled-tasks/:id
// @access  Private/Admin
const updateScheduledTask = asyncHandler(async (req, res) => {
  const { name, description, scriptPath, schedule, isEnabled } = req.body;
  const task = await ScheduledTask.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Tenant admins can update their own tasks
  task.name = name || task.name;
  task.description = description || task.description;
  task.scriptPath = scriptPath || task.scriptPath;
  task.schedule = schedule || task.schedule;

  if (isEnabled !== undefined) {
    task.isEnabled = isEnabled;
  }

  const updatedTask = await task.save();
  
  eventEmitter.emit('task:updated', updatedTask);

  res.status(200).json(updatedTask);
});

// @desc    Delete a scheduled task
// @route   DELETE /api/scheduled-tasks/:id
// @access  Private/Admin
const deleteScheduledTask = asyncHandler(async (req, res) => {
  const task = await ScheduledTask.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  await task.deleteOne();
  
  eventEmitter.emit('task:deleted', req.params.id);

  res.status(200).json({ message: 'Task removed' });
});

// @desc    Manually run a scheduled task
// @route   POST /api/scheduled-tasks/:id/run
// @access  Private/Admin
const runScheduledTask = asyncHandler(async (req, res) => {
  const task = await ScheduledTask.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  console.log(`Manually running task: ${task.name} for tenant ${task.tenant}`);
  
  try {
    const output = await executeScript(task.scriptPath, task.tenant.toString());
    task.lastRun = new Date();
    task.lastStatus = 'Success';
    task.logOutput = output;
    await task.save();
    res.status(200).json({ message: `Task '${task.name}' executed successfully.`, output });
  } catch (error) {
    task.lastRun = new Date();
    task.lastStatus = 'Failed';
    task.logOutput = error.message;
    await task.save();
    res.status(500).json({ message: `Task '${task.name}' failed to execute.`, error: error.message });
  }
});

module.exports = {
  getScheduledTasks,
  createScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  runScheduledTask,
};
