const Notification = require('../models/Notification');
const io = require('../socket').getIO(); // Import the initialized socket.io instance

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

    // Emit a websocket event to the specific user's room
    if (user) {
      io.to(user._id.toString()).emit('new_notification', notification);
    }
  } catch (error) {
    console.error('Error saving notification:', error);
  }
};

module.exports = { sendAlert };
