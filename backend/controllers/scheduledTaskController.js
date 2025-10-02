const asyncHandler = require('express-async-handler');
const ScheduledTask = require('../models/ScheduledTask');
const { spawn } = require('child_process');
const path = require('path');

// Helper to execute a script
const executeScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    const absoluteScriptPath = path.resolve(__dirname, '..', scriptPath);
    const child = spawn('node', [absoluteScriptPath]);
    
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
  const tasks = await ScheduledTask.find({}).sort({ createdAt: 'desc' });
  res.status(200).json(tasks);
});

// @desc    Create a new scheduled task
// @route   POST /api/scheduled-tasks
// @access  Private/Admin
const createScheduledTask = asyncHandler(async (req, res) => {
  const { name, description, scriptPath, schedule, isEnabled } = req.body;

  if (!name || !scriptPath || !schedule) {
    res.status(400);
    throw new Error('Name, scriptPath, and schedule are required');
  }

  const task = await ScheduledTask.create({
    name,
    description,
    scriptPath,
    schedule,
    isEnabled,
  });
  
  res.status(201).json(task);
});

// @desc    Update a scheduled task
// @route   PUT /api/scheduled-tasks/:id
// @access  Private/Admin
const updateScheduledTask = asyncHandler(async (req, res) => {
  const { name, description, scriptPath, schedule, isEnabled } = req.body;
  const task = await ScheduledTask.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.name = name || task.name;
  task.description = description || task.description;
  task.scriptPath = scriptPath || task.scriptPath;
  task.schedule = schedule || task.schedule;
  if (isEnabled !== undefined) {
    task.isEnabled = isEnabled;
  }

  const updatedTask = await task.save();
  
  res.status(200).json(updatedTask);
});

// @desc    Delete a scheduled task
// @route   DELETE /api/scheduled-tasks/:id
// @access  Private/Admin
const deleteScheduledTask = asyncHandler(async (req, res) => {
  const task = await ScheduledTask.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  await task.deleteOne();
  
  res.status(200).json({ message: 'Task removed' });
});

// @desc    Manually run a scheduled task
// @route   POST /api/scheduled-tasks/:id/run
// @access  Private/Admin
const runScheduledTask = asyncHandler(async (req, res) => {
  const task = await ScheduledTask.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  console.log(`Manually running task: ${task.name}`);
  
  try {
    const output = await executeScript(task.scriptPath);
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
