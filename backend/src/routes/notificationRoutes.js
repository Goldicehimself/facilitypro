// Notification Routes
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, notificationController.getNotifications);
router.patch('/:id/read', protect, notificationController.markNotificationRead);
router.patch('/read-all', protect, notificationController.markAllNotificationsRead);
router.post('/message-admins', protect, notificationController.sendTechnicianMessage);
router.post('/reply-user', protect, notificationController.sendReplyToUser);
router.get('/debug', protect, notificationController.debugNotifications);

module.exports = router;
