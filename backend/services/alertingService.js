const sendAlert = (device, status) => {
  const message = `ALERT: Device ${device.deviceName || device.macAddress} (${device.ipAddress}) is now ${status}.`;
  console.log(message);
  // In the future, this service can be expanded to send SMS, Email, or WhatsApp messages.
};

module.exports = { sendAlert };
