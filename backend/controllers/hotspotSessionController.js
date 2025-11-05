const asyncHandler = require('express-async-handler');
const HotspotSession = require('../models/HotspotSession');

const getSessionStatus = asyncHandler(async (req, res) => {
  const { macAddress } = req.params;

  const session = await HotspotSession.findOne({ macAddress });

  if (session) {
    res.json(session);
  } else {
    res.status(404).json({ message: 'Session not found' });
  }
});

module.exports = {
  getSessionStatus,
};
