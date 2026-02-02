const asyncHandler = require('express-async-handler');
const HotspotSession = require('../models/HotspotSession');

const getSessionStatus = asyncHandler(async (req, res) => {
  const { macAddress } = req.params;

  const session = await HotspotSession.findOne({ macAddress, tenant: req.user.tenant });

  if (session) {
    if (new Date() > session.endTime) {
      await session.deleteOne();
      res.status(404).json({ message: 'Session expired' });
    } else {
      res.json(session);
    }
  } else {
    res.status(404).json({ message: 'Session not found' });
  }
});

module.exports = {
  getSessionStatus,
};
