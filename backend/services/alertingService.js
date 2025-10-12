const Notification = require('../models/Notification');
const io = require('../socket').getIO(); // Import the initialized socket.io instance

const sendAlert = async (entity, status, user = null, entityType = 'Device') => {
  let entityIdentifier = '';
  if (entityType === 'Device') {
    entityIdentifier = entity.deviceName || entity.macAddress;
  } else if (entityType === 'User') {
    entityIdentifier = entity.username;
  }
  const message = `ALERT: ${entityType} ${entityIdentifier} (${entity.ipAddress || 'N/A'}) is now ${status}.`;
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
