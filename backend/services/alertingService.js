const Notification = require('../models/Notification');

const sendAlert = async (device, status, user = null) => {
  const message = `ALERT: Device ${device.deviceName || device.macAddress} (${device.ipAddress}) is now ${status}.`;
  console.log(message); // Keep console log for debugging

  try {
    const notification = new Notification({
      message,
      type: 'device_status',
      user: user ? user._id : null,
    });
    await notification.save();
    // In the future, we will emit a websocket event here
  } catch (error) {
    console.error('Error saving notification:', error);
  }
};

module.exports = { sendAlert };
