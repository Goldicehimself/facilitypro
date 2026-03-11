const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const response = require('../utils/response');
const { AuthorizationError } = require('../utils/errorHandler');
const AuditLog = require('../models/AuditLog');

router.get('/login-history', protect, async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (userId && String(userId) !== String(req.user.id)) {
      const allowed = ['admin', 'facility_manager'].includes(req.user?.role);
      if (!allowed) throw new AuthorizationError('Access denied');
    }

    const filter = {
      organization: req.user.organization,
      action: 'login',
    };
    if (userId) filter.actor = userId;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    response.success(res, 'Login history loaded', logs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
