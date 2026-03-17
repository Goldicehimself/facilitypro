// Activity Routes (SSE)
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const constants = require('../constants/constants');
const activityService = require('../services/activityService');
const Activity = require('../models/Activity');

router.get(
  '/stream',
  (req, res, next) => {
    if (!req.headers.authorization && req.query?.token) {
      req.headers.authorization = `Bearer ${req.query.token}`;
    }
    next();
  },
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

router.get(
  '/recent',
  protect,
  authorize(constants.ROLES.ADMIN, constants.ROLES.FACILITY_MANAGER),
  async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const activities = await Activity.find({ organization: req.user.organization })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      res.json({
        success: true,
        message: 'Recent activity loaded',
        data: activities
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/recent',
  protect,
  authorize(constants.ROLES.ADMIN),
  async (req, res, next) => {
    try {
      await Activity.deleteMany({ organization: req.user.organization });
      res.json({
        success: true,
        message: 'Activity history cleared',
        data: { cleared: true }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
