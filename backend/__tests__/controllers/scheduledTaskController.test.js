const {
  getScheduledTasks,
  createScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  runScheduledTask,
} = require('../../controllers/scheduledTaskController');
const ScheduledTask = require('../../models/ScheduledTask');
const eventEmitter = require('../../events');
const { validationResult } = require('express-validator');
const { spawn } = require('child_process');

jest.mock('../../models/ScheduledTask');
jest.mock('../../events');
jest.mock('express-validator');
jest.mock('child_process');

describe('Scheduled Task Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testId' },
      user: { tenant: 'testTenant' },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getScheduledTasks', () => {
    it('should return scheduled tasks with next run time', async () => {
      const mockTasks = [{ name: 'Test Task', schedule: '* * * * *' }];
      ScheduledTask.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTasks),
      });

      await getScheduledTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
      expect(res.json.mock.calls[0][0][0]).toHaveProperty('nextRun');
    });
  });

  describe('createScheduledTask', () => {
    it('should create a scheduled task', async () => {
      const taskData = { name: 'New Task', scriptPath: '/path/to/script', schedule: '* * * * *', isEnabled: true };
      req.body = taskData;
      ScheduledTask.create.mockResolvedValue(taskData);

      await createScheduledTask(req, res);

      expect(ScheduledTask.create).toHaveBeenCalledWith({ ...taskData, tenant: 'testTenant' });
      expect(eventEmitter.emit).toHaveBeenCalledWith('task:created', taskData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(taskData);
    });
  });

  describe('updateScheduledTask', () => {
    it('should update a scheduled task', async () => {
      const taskData = { name: 'Updated Task' };
      const mockTask = { _id: 'testId', name: 'Old Task', save: jest.fn().mockResolvedValue(taskData) };
      req.body = taskData;
      ScheduledTask.findOne.mockResolvedValue(mockTask);

      await updateScheduledTask(req, res);

      expect(ScheduledTask.findOne).toHaveBeenCalledWith({ _id: 'testId', tenant: 'testTenant' });
      expect(mockTask.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('task:updated', taskData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(taskData);
    });
  });

  describe('deleteScheduledTask', () => {
    it('should delete a scheduled task', async () => {
      const mockTask = { _id: 'testId', deleteOne: jest.fn() };
      ScheduledTask.findOne.mockResolvedValue(mockTask);

      await deleteScheduledTask(req, res);

      expect(ScheduledTask.findOne).toHaveBeenCalledWith({ _id: 'testId', tenant: 'testTenant' });
      expect(mockTask.deleteOne).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('task:deleted', 'testId');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task removed' });
    });
  });

  describe('runScheduledTask', () => {
    it('should run a scheduled task successfully', async () => {
        const mockTask = { 
            _id: 'testId', 
            name: 'Test Task', 
            scriptPath: '/path/to/script', 
            tenant: 'testTenant',
            save: jest.fn() 
        };
        ScheduledTask.findOne.mockResolvedValue(mockTask);
    
        const mockSpawn = {
            stdout: { on: jest.fn((event, cb) => cb('output')) },
            stderr: { on: jest.fn() },
            on: jest.fn((event, cb) => { if(event === 'close') cb(0) }),
        };
        spawn.mockReturnValue(mockSpawn);
    
        await runScheduledTask(req, res);
    
        expect(ScheduledTask.findOne).toHaveBeenCalledWith({ _id: 'testId', tenant: 'testTenant' });
        expect(spawn).toHaveBeenCalled();
        expect(mockTask.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Task 'Test Task' executed successfully." }));
    });
  });
});
