
const { Queue } = require('bullmq');
const mikrotikSyncQueue = require('../../queues/mikrotikSyncQueue');

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    // Mock any methods used on the queue instance if necessary
  })),
}));

describe('MikroTik-Sync Queue', () => {
  it('should instantiate the MikroTik-Sync queue with correct name, Redis connection, and default job options', () => {
    expect(Queue).toHaveBeenCalledWith('MikroTik-Sync', {
      connection: {
        host: 'redis',
        port: 6379,
      },
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    });
    expect(mikrotikSyncQueue).toBeDefined();
  });
});
