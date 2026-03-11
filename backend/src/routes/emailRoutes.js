// Email Routes
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect, authorize } = require('../middleware/auth');

router.post('/test', protect, authorize('admin'), emailController.sendTestEmail);

module.exports = router;
