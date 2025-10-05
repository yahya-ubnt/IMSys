const asyncHandler = require('express-async-handler');

// @desc    Get router system resource information
// @route   GET /api/routers/:routerId/dashboard/status
// @access  Private/Admin
const getRouterStatus = asyncHandler(async (req, res) => {
  try {
    const [resources] = await req.mikrotikClient.write('/system/resource/print');
    const files = await req.mikrotikClient.write('/file/print'); // For HDD Free
    const ipAddresses = await req.mikrotikClient.write('/ip/address/print'); // For IP Address

    let hddFree = 'N/A';
    // Find the 'disk' entry or sum up free space from relevant disk entries
    const diskEntry = files.find(f => f.name === 'disk');
    if (diskEntry && diskEntry['free-space']) {
      hddFree = diskEntry['free-space'];
    } else {
      const totalFree = files.reduce((sum, file) => {
        // Assuming 'disk' type or similar for storage entries
        if (file['free-space'] && (file.type === 'disk' || file.name.includes('disk'))) {
          return sum + parseInt(file['free-space'], 10);
        }
        return sum;
      }, 0);
      if (totalFree > 0) {
        hddFree = totalFree.toString();
      }
    }

    let primaryIp = 'N/A';
    if (ipAddresses && ipAddresses.length > 0) {
      // Prioritize non-loopback, non-internal IPs, or just take the first one
      const publicIp = ipAddresses.find(ip => !ip.dynamic && !ip.invalid && !ip.address.startsWith('127.') && !ip.address.startsWith('169.254.'));
      if (publicIp) {
        primaryIp = publicIp.address.split('/')[0];
      } else {
        primaryIp = ipAddresses[0].address.split('/')[0];
      }
    }

    let totalHddSpace = 'N/A';
    // Check if total-hdd-space is available in resources (from /system/resource/print)
    if (resources['total-hdd-space']) {
      totalHddSpace = resources['total-hdd-space'];
    } else {
      // Fallback: try to sum up total space from relevant file entries if 'total-hdd-space' is not directly available
      const totalDisk = files.reduce((sum, file) => {
        if (file.type === 'disk' && file.size) { // Assuming 'size' is total space for a disk entry
          return sum + parseInt(file.size, 10);
        }
        return sum;
      }, 0);
      if (totalDisk > 0) {
        totalHddSpace = totalDisk.toString();
      }
    }

    res.json({
      ...resources,
      'hdd-free': hddFree,
      'total-hdd-space': totalHddSpace, // Added total HDD space
      'ip-address': primaryIp,
    });
  } catch (error) {
    console.error('Error fetching router status:', error);
    res.status(500).json({ message: 'Failed to fetch router status', error: error.message });
  }
});

// @desc    Get all router interfaces and their traffic stats
// @route   GET /api/routers/:routerId/dashboard/interfaces
// @access  Private/Admin
const getRouterInterfaces = asyncHandler(async (req, res) => {
  try {
    const interfaces = await req.mikrotikClient.write('/interface/print');
    const traffic = await req.mikrotikClient.write('/interface/monitor-traffic', [
      '=interface=' + interfaces.map((i) => i.name).join(','),
      '=once=',
    ]);

    const combined = interfaces.map((iface) => {
      const trafficStats = traffic.find((t) => t.name === iface.name) || {};
      return {
        ...iface,
        'rx-byte': trafficStats['rx-bits-per-second'],
        'tx-byte': trafficStats['tx-bits-per-second'],
      };
    });

    res.json(combined);
  } catch (error) {
    console.error('Error fetching router interfaces:', error);
    res.status(500).json({ message: 'Failed to fetch router interfaces', error: error.message });
  }
});

// @desc    Monitor traffic on a specific interface
// @route   GET /api/routers/:routerId/dashboard/traffic/:interfaceName
// @access  Private/Admin
const getInterfaceTraffic = asyncHandler(async (req, res) => {
  const { interfaceName } = req.params;
  if (!interfaceName) {
    console.error('Error: Interface name is required for getInterfaceTraffic');
    res.status(400).json({ message: 'Interface name is required' });
    return; // Added return
  }
  try {
    // This command monitors traffic for a short period and returns the current stats
    const [traffic] = await req.mikrotikClient.write('/interface/monitor-traffic', [
      '=interface=' + interfaceName,
      '=once=',
    ]);

    // Mikrotik returns bits/sec, convert to Mbps
    const rxMbps = traffic ? (parseInt(traffic['rx-bits-per-second'], 10) / 1000000).toFixed(2) : '0.00';
    const txMbps = traffic ? (parseInt(traffic['tx-bits-per-second'], 10) / 1000000).toFixed(2) : '0.00';

    const responseData = {
      interface: interfaceName,
      rxMbps: parseFloat(rxMbps),
      txMbps: parseFloat(txMbps),
      timestamp: new Date().toISOString(),
    };
    console.log(`Successfully fetched traffic for ${interfaceName}:`, responseData); // Added log
    res.json(responseData);
  } catch (error) {
    console.error(`Error fetching traffic for ${interfaceName}:`, error);
    res.status(500).json({ message: `Failed to fetch traffic for ${interfaceName}`, error: error.message });
  }
});

// @desc    Get all active PPPoE sessions
// @route   GET /api/routers/:routerId/dashboard/pppoe/active
// @access  Private/Admin
const getActivePppoeSessions = asyncHandler(async (req, res) => {
  try {
    const activeSessions = await req.mikrotikClient.write('/ppp/active/print');
    res.json(activeSessions);
  } catch (error) {
    console.error('Error fetching active PPPoE sessions:', error);
    res.status(500).json({ message: 'Failed to fetch active PPPoE sessions', error: error.message });
  }
});

// @desc    Disconnect a specific PPPoE user
// @route   POST /api/routers/:routerId/dashboard/pppoe/active/disconnect
// @access  Private/Admin
const disconnectPppoeUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400);
    throw new Error('PPPoE user ID is required');
  }
  try {
    await req.mikrotikClient.write('/ppp/active/remove', ['=.id=' + id]);
    res.json({ message: 'PPPoE user disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting PPPoE user:', error);
    res.status(500).json({ message: 'Failed to disconnect PPPoE user', error: error.message });
  }
});

// @desc    Get all configured PPPoE secrets
// @route   GET /api/routers/:routerId/dashboard/pppoe/secrets
// @access  Private/Admin
const getPppoeSecrets = asyncHandler(async (req, res) => {
  try {
    const secrets = await req.mikrotikClient.write('/ppp/secret/print');
    res.json(secrets);
  } catch (error) {
    console.error('Error fetching PPPoE secrets:', error);
    res.status(500).json({ message: 'Failed to fetch PPPoE secrets', error: error.message });
  }
});

// @desc    Add a new PPPoE secret
// @route   POST /api/routers/:routerId/dashboard/pppoe/secrets
// @access  Private/Admin
const addPppoeSecret = asyncHandler(async (req, res) => {
  const { name, password, service, profile, disabled } = req.body;
  if (!name || !password) {
    res.status(400);
    throw new Error('Username and password are required');
  }

  try {
    const params = [
      '=name=' + name,
      '=password=' + password,
      '=service=' + (service || 'pppoe'),
      ...(profile ? ['=profile=' + profile] : []),
    ];
    if (disabled !== undefined) {
      params.push('=disabled=' + (disabled ? 'yes' : 'no'));
    }
    const secret = await req.mikrotikClient.write('/ppp/secret/add', params);

    res.status(201).json(secret);
  } catch (error) {
    console.error('Error adding PPPoE secret:', error);
    res.status(500).json({ message: 'Failed to add PPPoE secret', error: error.message });
  }
});

// @desc    Update an existing PPPoE secret
// @route   PUT /api/routers/:routerId/dashboard/pppoe/secrets/:secretId
// @access  Private/Admin
const updatePppoeSecret = asyncHandler(async (req, res) => {
  const { secretId } = req.params;
  const { name, password, service, profile, disabled } = req.body;

  const params = ['=.id=' + secretId];
  if (name) params.push('=name=' + name);
  if (password) params.push('=password=' + password);
  if (service) params.push('=service=' + service);
  if (profile) params.push('=profile=' + profile);
  if (disabled !== undefined) {
    params.push('=disabled=' + (disabled ? 'yes' : 'no'));
  }

  try {
    const updatedSecret = await req.mikrotikClient.write('/ppp/secret/set', params);
    res.json(updatedSecret);
  } catch (error) {
    console.error('Error updating PPPoE secret:', error);
    res.status(500).json({ message: 'Failed to update PPPoE secret', error: error.message });
  }
});

// @desc    Delete a PPPoE secret
// @route   DELETE /api/routers/:routerId/dashboard/pppoe/secrets/:secretId
// @access  Private/Admin
const deletePppoeSecret = asyncHandler(async (req, res) => {
  const { secretId } = req.params;
  try {
    await req.mikrotikClient.write('/ppp/secret/remove', ['=.id=' + secretId]);
    res.json({ message: 'PPPoE secret removed successfully' });
  } catch (error) {
    console.error('Error deleting PPPoE secret:', error);
    res.status(500).json({ message: 'Failed to delete PPPoE secret', error: error.message });
  }
});

// @desc    Get all simple queues
// @route   GET /api/routers/:routerId/dashboard/queues
// @access  Private/Admin
const getQueues = asyncHandler(async (req, res) => {
  try {
    const queues = await req.mikrotikClient.write('/queue/simple/print');
    res.json(queues);
  } catch (error) {
    console.error('Error fetching queues:', error);
    res.status(500).json({ message: 'Failed to fetch queues', error: error.message });
  }
});

// @desc    Add a new simple queue
// @route   POST /api/routers/:routerId/dashboard/queues
// @access  Private/Admin
const addQueue = asyncHandler(async (req, res) => {
  const { name, target, 'max-limit': maxLimit, 'burst-limit': burstLimit, 'burst-threshold': burstThreshold, 'burst-time': burstTime, priority, parent, comment, disabled } = req.body;

  if (!name || !target || !maxLimit) {
    res.status(400);
    throw new Error('Name, target, and max-limit are required for a new queue');
  }

  try {
    const params = [
      '=name=' + name,
      '=target=' + target,
      '=max-limit=' + maxLimit,
      ...(burstLimit ? ['=burst-limit=' + burstLimit] : []),
      ...(burstThreshold ? ['=burst-threshold=' + burstThreshold] : []),
      ...(burstTime ? ['=burst-time=' + burstTime] : []),
      ...(priority ? ['=priority=' + priority] : []),
      ...(parent ? ['=parent=' + parent] : []),
      ...(comment ? ['=comment=' + comment] : []),
      ...(disabled ? ['=disabled=' + disabled] : []),
    ];
    const newQueue = await req.mikrotikClient.write('/queue/simple/add', params);

    res.status(201).json(newQueue);
  } catch (error) {
    console.error('Error adding simple queue:', error);
    res.status(500).json({ message: 'Failed to add simple queue', error: error.message });
  }
});

// @desc    Update an existing simple queue
// @route   PUT /api/routers/:routerId/dashboard/queues/:queueId
// @access  Private/Admin
const updateQueue = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  const { name, target, 'max-limit': maxLimit, 'burst-limit': burstLimit, 'burst-threshold': burstThreshold, 'burst-time': burstTime, priority, parent, comment, disabled } = req.body;

  const params = ['=.id=' + queueId];
  if (name) params.push('=name=' + name);
  if (target) params.push('=target=' + target);
  if (maxLimit) params.push('=max-limit=' + maxLimit);
  if (burstLimit) params.push('=burst-limit=' + burstLimit);
  if (burstThreshold) params.push('=burst-threshold=' + burstThreshold);
  if (burstTime) params.push('=burst-time=' + burstTime);
  if (priority) params.push('=priority=' + priority);
  if (parent) params.push('=parent=' + parent);
  if (comment) params.push('=comment=' + comment);
  if (disabled) params.push('=disabled=' + disabled);

  if (params.length === 1) { // Only queueId is present, no update data
    res.status(400);
    throw new Error('No update data provided for the queue');
  }

  try {
    const updatedQueue = await req.mikrotikClient.write('/queue/simple/set', params);
    res.json(updatedQueue);
  } catch (error) {
    console.error('Error updating simple queue:', error);
    res.status(500).json({ message: 'Failed to update simple queue', error: error.message });
  }
});

// @desc    Delete a simple queue
// @route   DELETE /api/routers/:routerId/dashboard/queues/:queueId
// @access  Private/Admin
const deleteQueue = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  try {
    await req.mikrotikClient.write('/queue/simple/remove', ['=.id=' + queueId]);
    res.json({ message: 'Simple queue removed successfully' });
  } catch (error) {
    console.error('Error deleting simple queue:', error);
    res.status(500).json({ message: 'Failed to delete simple queue', error: error.message });
  }
});

// @desc    Get all firewall filter rules
// @route   GET /api/routers/:routerId/dashboard/firewall/filter
// @access  Private/Admin
const getFirewallFilters = asyncHandler(async (req, res) => {
  try {
    const filters = await req.mikrotikClient.write('/ip/firewall/filter/print');
    res.json(filters);
  } catch (error) {
    console.error('Error fetching firewall filters:', error);
    res.status(500).json({ message: 'Failed to fetch firewall filters', error: error.message });
  }
});

// @desc    Get all active DHCP server leases
// @route   GET /api/routers/:routerId/dashboard/dhcp-leases
// @access  Private/Admin
const getDhcpLeases = asyncHandler(async (req, res) => {
  try {
    const leases = await req.mikrotikClient.write('/ip/dhcp-server/lease/print');
    res.json(leases);
  } catch (error) {
    console.error('Error fetching DHCP leases:', error);
    res.status(500).json({ message: 'Failed to fetch DHCP leases', error: error.message });
  }
});

// @desc    Get latest system log entries
// @route   GET /api/routers/:routerId/dashboard/logs
// @access  Private/Admin
const getLogs = asyncHandler(async (req, res) => {
  try {
    const logs = await req.mikrotikClient.write('/log/print');
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Failed to fetch logs', error: error.message });
  }
});

// @desc    Get static user counts (active and inactive)
// @route   GET /api/routers/:routerId/dashboard/static/counts
// @access  Private/Admin
const getStaticUserCounts = asyncHandler(async (req, res) => {
  try {
    const leases = await req.mikrotikClient.write('/ip/dhcp-server/lease/print');

    let activeStatic = 0;
    let inactiveStatic = 0;

    leases.forEach(lease => {
      // Assuming 'dynamic=no' indicates a static lease
      if (lease.dynamic === 'false') {
        if (lease.status === 'bound') {
          activeStatic++;
        } else {
          inactiveStatic++;
        }
      }
    });

    res.json({
      activeStatic: activeStatic,
      inactiveStatic: inactiveStatic,
    });
  } catch (error) {
    console.error('Error fetching static user counts:', error);
    res.status(500).json({ message: 'Failed to fetch static user counts', error: error.message });
  }
});

// @desc    Get PPPoE user counts (active and inactive)
// @route   GET /api/routers/:routerId/dashboard/pppoe/counts
// @access  Private/Admin
const getPppoeUserCounts = asyncHandler(async (req, res) => {
  try {
    const activeSessions = await req.mikrotikClient.write('/ppp/active/print');
    const secrets = await req.mikrotikClient.write('/ppp/secret/print');

    const activeCount = activeSessions.length;
    const inactiveCount = secrets.length - activeCount; // Assuming all secrets are potential users

    res.json({
      activePppoe: activeCount,
      inactivePppoe: inactiveCount,
    });
  } catch (error) {
    console.error('Error fetching PPPoE user counts:', error);
    res.status(500).json({ message: 'Failed to fetch PPPoE user counts', error: error.message });
  }
});

module.exports = {
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
  getPppoeUserCounts, // Export the new function
  getStaticUserCounts, // Export the new function
};
