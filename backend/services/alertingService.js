const Notification = require('../models/Notification');
const io = require('../socket').getIO(); // Import the initialized socket.io instance

const sendConsolidatedAlert = async (entities, status, user = null, entityType = 'Device') => {
  let message;
  if (!Array.isArray(entities) || entities.length === 0) {
    console.warn('sendConsolidatedAlert called with empty or invalid entities array.');
    return;
  }

  if (entities.length === 1) {
    const entity = entities[0];
    let entityIdentifier = '';
    let specificEntityType = entityType;

    if (entityType === 'Device') {
      entityIdentifier = entity.deviceName || entity.macAddress;
      if (entity.deviceType) {
        specificEntityType = entity.deviceType; // Use 'Access' or 'Station'
      }
    } else if (entityType === 'User') {
      entityIdentifier = entity.username;
    }
    message = `ALERT: ${specificEntityType} ${entityIdentifier} (${entity.ipAddress || 'N/A'}) is now ${status}.`;
  } else {
    const identifiers = entities.map(entity => {
      if (entityType === 'Device') {
        return entity.deviceName || entity.macAddress;
      } else if (entityType === 'User') {
        return entity.username;
      }
      return 'Unknown';
    }).join(', ');

    let specificEntityType = entityType;
    // If all devices in the batch are of the same type, use that type
    if (entityType === 'Device' && entities.every(e => e.deviceType === entities[0].deviceType)) {
      specificEntityType = entities[0].deviceType; // e.g., 'Access' or 'Station'
    } else if (entityType === 'Device') {
      specificEntityType = 'Devices'; // Fallback to plural 'Devices' if mixed types
    }

    message = `ALERT: Multiple ${specificEntityType} (${identifiers}) are now ${status}.`;
  }

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

module.exports = { sendConsolidatedAlert };
