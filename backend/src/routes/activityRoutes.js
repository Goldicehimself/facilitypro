// Activity Routes (SSE)
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const constants = require('../constants/constants');
const activityService = require('../services/activityService');

router.get(
  '/stream',
  protect,
  authorize(constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER),
  (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    res.flushHeaders();

    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
    activityService.addClient(res);

    const keepAlive = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
      activityService.removeClient(res);
    });
  }
);

module.exports = router;
