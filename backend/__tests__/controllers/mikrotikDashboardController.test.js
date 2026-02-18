const {
  getRouterStatus,
  getRouterInterfaces,
  getInterfaceTraffic,
  getActivePppoeSessions,
  disconnectPppoeUser,
  getPppoeSecrets,
  addPppoeSecret,
  updatePppoeSecret,
  deletePppoeSecret,
  getQueues,
  addQueue,
  updateQueue,
  deleteQueue,
  getFirewallFilters,
  getDhcpLeases,
  getLogs,
  getStaticUserCounts,
  getPppoeUserCounts,
} = require('../../controllers/mikrotikDashboardController');

describe('MikrotikDashboard Controller', () => {
  let req, res, next;
  let mockMikrotikClient;

  beforeEach(() => {
    mockMikrotikClient = {
      write: jest.fn(),
    };
    req = {
      mikrotikClient: mockMikrotikClient,
      params: {},
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRouterStatus', () => {
    it('should return router status', async () => {
      mockMikrotikClient.write
        .mockResolvedValueOnce([{ 'free-memory': '1000', 'total-memory': '2000', 'cpu-load': '50', 'total-hdd-space': '1000' }]) // system/resource/print
        .mockResolvedValueOnce([{ name: 'disk', 'free-space': '500', size: '1000' }]) // file/print
        .mockResolvedValueOnce([{ address: '192.168.1.1/24' }]); // ip/address/print

      await getRouterStatus(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/system/resource/print');
      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/file/print');
      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ip/address/print');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        'free-memory': '1000',
        'total-memory': '2000',
        'cpu-load': '50',
        'hdd-free': '500',
        'total-hdd-space': '1000',
        'ip-address': '192.168.1.1',
      }));
    });

    it('should handle errors', async () => {
      mockMikrotikClient.write.mockRejectedValue(new Error('Mikrotik error'));

      await getRouterStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch router status' }));
    });
  });

  describe('getRouterInterfaces', () => {
    it('should return router interfaces with traffic stats', async () => {
      mockMikrotikClient.write
        .mockResolvedValueOnce([{ name: 'ether1' }, { name: 'ether2' }]) // interface/print
        .mockResolvedValueOnce([
          { name: 'ether1', 'rx-bits-per-second': '1000', 'tx-bits-per-second': '500' },
          { name: 'ether2', 'rx-bits-per-second': '2000', 'tx-bits-per-second': '1000' },
        ]); // interface/monitor-traffic

      await getRouterInterfaces(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/interface/print');
      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/interface/monitor-traffic', ['=interface=ether1,ether2', '=once=']);
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'ether1', 'rx-byte': '1000', 'tx-byte': '500' }),
        expect.objectContaining({ name: 'ether2', 'rx-byte': '2000', 'tx-byte': '1000' }),
      ]);
    });

    it('should handle errors', async () => {
      mockMikrotikClient.write.mockRejectedValue(new Error('Mikrotik error'));

      await getRouterInterfaces(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch router interfaces' }));
    });
  });

  describe('getInterfaceTraffic', () => {
    it('should return traffic for a specific interface', async () => {
      req.params.interfaceName = 'ether1';
      mockMikrotikClient.write.mockResolvedValueOnce([
        { 'rx-bits-per-second': '1000000', 'tx-bits-per-second': '500000' },
      ]);

      await getInterfaceTraffic(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/interface/monitor-traffic', ['=interface=ether1', '=once=']);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        interface: 'ether1',
        rxMbps: 1.00,
        txMbps: 0.50,
      }));
    });

    it('should return 400 if interfaceName is missing', async () => {
      req.params.interfaceName = undefined;

      await getInterfaceTraffic(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Interface name is required' });
    });

    it('should handle errors', async () => {
      req.params.interfaceName = 'ether1';
      mockMikrotikClient.write.mockRejectedValue(new Error('Traffic error'));

      await getInterfaceTraffic(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch traffic for ether1' }));
    });
  });

  describe('getActivePppoeSessions', () => {
    it('should return active PPPoE sessions', async () => {
      const sessions = [{ name: 'user1' }, { name: 'user2' }];
      mockMikrotikClient.write.mockResolvedValue(sessions);

      await getActivePppoeSessions(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ppp/active/print');
      expect(res.json).toHaveBeenCalledWith(sessions);
    });

    it('should handle errors', async () => {
      mockMikrotikClient.write.mockRejectedValue(new Error('PPPoE error'));

      await getActivePppoeSessions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch active PPPoE sessions' }));
    });
  });

  describe('disconnectPppoeUser', () => {
    it('should disconnect a PPPoE user', async () => {
      req.body.id = 'session1';
      mockMikrotikClient.write.mockResolvedValue({});

      await disconnectPppoeUser(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ppp/active/remove', ['=.id=session1']);
      expect(res.json).toHaveBeenCalledWith({ message: 'PPPoE user disconnected successfully' });
    });

    it('should return 400 if ID is missing', async () => {
      req.body.id = undefined;

      await disconnectPppoeUser(req, res, next); // Pass next to the controller

      expect(res.status).toHaveBeenCalledWith(400); // Expect res.status to be called
      expect(next).toHaveBeenCalledWith(new Error('PPPoE user ID is required'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should handle errors', async () => {
      req.body.id = 'session1';
      mockMikrotikClient.write.mockRejectedValue(new Error('Disconnect error'));

      await disconnectPppoeUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to disconnect PPPoE user' }));
    });
  });

  describe('getPppoeSecrets', () => {
    it('should return PPPoE secrets', async () => {
      const secrets = [{ name: 'secret1' }, { name: 'secret2' }];
      mockMikrotikClient.write.mockResolvedValue(secrets);

      await getPppoeSecrets(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ppp/secret/print');
      expect(res.json).toHaveBeenCalledWith(secrets);
    });

    it('should handle errors', async () => {
      mockMikrotikClient.write.mockRejectedValue(new Error('Secrets error'));

      await getPppoeSecrets(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch PPPoE secrets' }));
    });
  });

  describe('addPppoeSecret', () => {
    it('should add a new PPPoE secret', async () => {
      req.body = { name: 'newuser', password: 'newpassword', service: 'pppoe', profile: 'default', disabled: false };
      mockMikrotikClient.write.mockResolvedValue({});

      await addPppoeSecret(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ppp/secret/add', [
        '=name=newuser',
        '=password=newpassword',
        '=service=pppoe',
        '=profile=default',
        '=disabled=no',
      ]);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({});
    });

    it('should return 400 if name or password missing', async () => {
      req.body = { name: 'newuser' }; // Missing password

      await addPppoeSecret(req, res, next); // Pass next to the controller

      expect(res.status).toHaveBeenCalledWith(400); // Expect res.status to be called
      expect(next).toHaveBeenCalledWith(new Error('Username and password are required'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should handle errors', async () => {
      req.body = { name: 'newuser', password: 'newpassword' };
      mockMikrotikClient.write.mockRejectedValue(new Error('Add secret error'));

      await addPppoeSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to add PPPoE secret' }));
    });
  });

  describe('updatePppoeSecret', () => {
    it('should update an existing PPPoE secret', async () => {
      req.params.secretId = 'secretId1';
      req.body = { password: 'updatedpassword', profile: 'updatedprofile' };
      mockMikrotikClient.write.mockResolvedValue({});

      await updatePppoeSecret(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ppp/secret/set', [
        '=.id=secretId1',
        '=password=updatedpassword',
        '=profile=updatedprofile',
      ]);
      expect(res.json).toHaveBeenCalledWith({});
    });

    it('should handle errors', async () => {
      req.params.secretId = 'secretId1';
      req.body = { password: 'updatedpassword' };
      mockMikrotikClient.write.mockRejectedValue(new Error('Update secret error'));

      await updatePppoeSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to update PPPoE secret' }));
    });
  });

  describe('deletePppoeSecret', () => {
    it('should delete a PPPoE secret', async () => {
      req.params.secretId = 'secretId1';
      mockMikrotikClient.write.mockResolvedValue({});

      await deletePppoeSecret(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ppp/secret/remove', ['=.id=secretId1']);
      expect(res.json).toHaveBeenCalledWith({ message: 'PPPoE secret removed successfully' });
    });

    it('should handle errors', async () => {
      req.params.secretId = 'secretId1';
      mockMikrotikClient.write.mockRejectedValue(new Error('Delete secret error'));

      await deletePppoeSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to delete PPPoE secret' }));
    });
  });

  describe('getQueues', () => {
    it('should return simple queues', async () => {
      const queues = [{ name: 'queue1' }, { name: 'queue2' }];
      mockMikrotikClient.write.mockResolvedValue(queues);

      await getQueues(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/queue/simple/print');
      expect(res.json).toHaveBeenCalledWith(queues);
    });

    it('should handle errors', async () => {
      mockMikrotikClient.write.mockRejectedValue(new Error('Queues error'));

      await getQueues(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch queues' }));
    });
  });

  describe('addQueue', () => {
    it('should add a new simple queue', async () => {
      req.body = { name: 'newqueue', target: '192.168.1.100', 'max-limit': '1M/1M' };
      mockMikrotikClient.write.mockResolvedValue({});

      await addQueue(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/queue/simple/add', [
        '=name=newqueue',
        '=target=192.168.1.100',
        '=max-limit=1M/1M',
      ]);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({});
    });

    it('should return 400 if required fields are missing', async () => {
      req.body = { name: 'newqueue' }; // Missing target, max-limit

      await addQueue(req, res, next); // Pass next to the controller

      expect(res.status).toHaveBeenCalledWith(400); // Expect res.status to be called
      expect(next).toHaveBeenCalledWith(new Error('Name, target, and max-limit are required for a new queue'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should handle errors', async () => {
      req.body = { name: 'newqueue', target: '192.168.1.100', 'max-limit': '1M/1M' };
      mockMikrotikClient.write.mockRejectedValue(new Error('Add queue error'));

      await addQueue(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to add simple queue' }));
    });
  });

  describe('updateQueue', () => {
    it('should update an existing simple queue', async () => {
      req.params.queueId = 'queueId1';
      req.body = { 'max-limit': '2M/2M', comment: 'updated' };
      mockMikrotikClient.write.mockResolvedValue({});

      await updateQueue(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/queue/simple/set', [
        '=.id=queueId1',
        '=max-limit=2M/2M',
        '=comment=updated',
      ]);
      expect(res.json).toHaveBeenCalledWith({});
    });

    it('should return 400 if no update data provided', async () => {
      req.params.queueId = 'queueId1';
      req.body = {};

      await updateQueue(req, res, next); // Pass next to the controller

      expect(res.status).toHaveBeenCalledWith(400); // Expect res.status to be called
      expect(next).toHaveBeenCalledWith(new Error('No update data provided for the queue'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should handle errors', async () => {
      req.params.queueId = 'queueId1';
      req.body = { 'max-limit': '2M/2M' };
      mockMikrotikClient.write.mockRejectedValue(new Error('Update queue error'));

      await updateQueue(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to update simple queue' }));
    });
  });

  describe('deleteQueue', () => {
    it('should delete a simple queue', async () => {
      req.params.queueId = 'queueId1';
      mockMikrotikClient.write.mockResolvedValue({});

      await deleteQueue(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/queue/simple/remove', ['=.id=queueId1']);
      expect(res.json).toHaveBeenCalledWith({ message: 'Simple queue removed successfully' });
    });

    it('should handle errors', async () => {
      req.params.queueId = 'queueId1';
      mockMikrotikClient.write.mockRejectedValue(new Error('Delete queue error'));

      await deleteQueue(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to delete simple queue' }));
    });
  });

  describe('getFirewallFilters', () => {
    it('should return firewall filters', async () => {
      const filters = [{ chain: 'input' }, { chain: 'forward' }];
      mockMikrotikClient.write.mockResolvedValue(filters);

      await getFirewallFilters(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ip/firewall/filter/print');
      expect(res.json).toHaveBeenCalledWith(filters);
    });

    it('should handle errors', async () => {
      mockMikrotikClient.write.mockRejectedValue(new Error('Firewall error'));

      await getFirewallFilters(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch firewall filters' }));
    });
  });

  describe('getDhcpLeases', () => {
    it('should return DHCP leases', async () => {
      const leases = [{ address: '192.168.88.10' }, { address: '192.168.88.11' }];
      mockMikrotikClient.write.mockResolvedValue(leases);

      await getDhcpLeases(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ip/dhcp-server/lease/print');
      expect(res.json).toHaveBeenCalledWith(leases);
    });

    it('should handle errors', async () => {
      mockMikrotikClient.write.mockRejectedValue(new Error('DHCP error'));

      await getDhcpLeases(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch DHCP leases' }));
    });
  });

  describe('getLogs', () => {
    it('should return system logs', async () => {
      const logs = [{ message: 'log1' }, { message: 'log2' }];
      mockMikrotikClient.write.mockResolvedValue(logs);

      await getLogs(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/log/print');
      expect(res.json).toHaveBeenCalledWith(logs);
    });

    it('should handle errors', async () => {
      mockMikrotikClient.write.mockRejectedValue(new Error('Logs error'));

      await getLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch logs' }));
    });
  });

  describe('getStaticUserCounts', () => {
    it('should return active and inactive static user counts', async () => {
      const leases = [
        { dynamic: 'false', status: 'bound' },
        { dynamic: 'false', status: 'waiting' },
        { dynamic: 'true', status: 'bound' },
      ];
      mockMikrotikClient.write.mockResolvedValue(leases);

      await getStaticUserCounts(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ip/dhcp-server/lease/print');
      expect(res.json).toHaveBeenCalledWith({ activeStatic: 1, inactiveStatic: 1 });
    });

    it('should handle errors', async () => {
      mockMikrotikClient.write.mockRejectedValue(new Error('Static user count error'));

      await getStaticUserCounts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch static user counts' }));
    });
  });

  describe('getPppoeUserCounts', () => {
    it('should return active and inactive PPPoE user counts', async () => {
      const activeSessions = [{ name: 'user1' }, { name: 'user2' }];
      const secrets = [{ name: 'user1' }, { name: 'user2' }, { name: 'user3' }];
      mockMikrotikClient.write
        .mockResolvedValueOnce(activeSessions)
        .mockResolvedValueOnce(secrets);

      await getPppoeUserCounts(req, res);

      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ppp/active/print');
      expect(mockMikrotikClient.write).toHaveBeenCalledWith('/ppp/secret/print');
      expect(res.json).toHaveBeenCalledWith({ activePppoe: 2, inactivePppoe: 1 });
    });

    it('should handle errors', async () => {
      mockMikrotikClient.write.mockRejectedValue(new Error('PPPoE user count error'));

      await getPppoeUserCounts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch PPPoE user counts' }));
    });
  });
});