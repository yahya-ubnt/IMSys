const { exec } = require('child_process');

/**
 * Pings a device to check if it is reachable.
 * @param {string} ipAddress The IP address of the device to ping.
 * @returns {Promise<{status: 'UP' | 'DOWN', message: string}>} A promise that resolves to the status of the device.
 */
function pingDevice(ipAddress) {
  return new Promise((resolve) => {
    // -c 1: Send only one packet
    // -W 1: Wait 1 second for a response
    exec(`ping -c 1 -W 1 ${ipAddress}`, (error, stdout, stderr) => {
      if (error || stderr) {
        resolve({
          status: 'DOWN',
          message: `Device is unreachable (ping failed). Error: ${error ? error.message : stderr}`.trim(),
        });
      } else {
        resolve({
          status: 'UP',
          message: 'Device is reachable.',
        });
      }
    });
  });
}

module.exports = { pingDevice };
