const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { Client } = require('ssh2');
const terminalService = require('../../services/terminalService');
const User = require('../../models/User');
const MikrotikRouter = require('../../models/MikrotikRouter');
const { decrypt } = require('../../utils/crypto');

jest.mock('ws');
jest.mock('jsonwebtoken');
jest.mock('ssh2');
jest.mock('../../models/User');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../utils/crypto');

describe('terminalService', () => {
  let server;
  let wss;

  beforeEach(() => {
    server = new http.Server();
    wss = {
      handleUpgrade: jest.fn((request, socket, head, callback) => {
        const ws = new WebSocket();
        callback(ws);
      }),
      emit: jest.fn(),
      on: jest.fn(), // Add the on method to the mock
    };
    WebSocket.Server.mockReturnValue(wss);
  });

  afterEach(() => {
    server.close();
  });

  it('should initialize and handle a successful WebSocket upgrade', async () => {
    terminalService.init(server);

    const token = 'valid-token';
    const decoded = { id: 'user-id' };
    jwt.verify.mockReturnValue(decoded);
    User.findById.mockResolvedValue({ _id: 'user-id' });
    MikrotikRouter.findById.mockResolvedValue({
      _id: 'router-id',
      apiPassword: 'encrypted-password',
    });
    decrypt.mockReturnValue('decrypted-password');

    const mockShellStream = {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
    const mockSshClient = {
      on: jest.fn((event, cb) => {
        if (event === 'ready') cb();
        return mockSshClient;
      }),
      shell: jest.fn(cb => cb(null, mockShellStream)),
      connect: jest.fn(),
    };
    Client.mockReturnValue(mockSshClient);

    server.emit('upgrade', { url: `/api/terminal?token=${token}&routerId=router-id` }, { destroy: jest.fn() }, 'head');

    // Allow promises to resolve
    await new Promise(process.nextTick);

    expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    expect(User.findById).toHaveBeenCalledWith('user-id');
    expect(MikrotikRouter.findById).toHaveBeenCalledWith('router-id');
    expect(mockSshClient.connect).toHaveBeenCalled();
    expect(wss.handleUpgrade).toHaveBeenCalled();
  });

  it('should destroy socket for invalid path', () => {
    terminalService.init(server);
    const socket = { destroy: jest.fn() };
    server.emit('upgrade', { url: '/invalid-path' }, socket, 'head');
    expect(socket.destroy).toHaveBeenCalled();
  });

  it('should destroy socket for missing token', () => {
    terminalService.init(server);
    const socket = { destroy: jest.fn() };
    server.emit('upgrade', { url: '/api/terminal' }, socket, 'head');
    expect(socket.destroy).toHaveBeenCalled();
  });
});