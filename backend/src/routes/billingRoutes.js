const express = require('express');
const billingController = require('../controllers/billingController');

const router = express.Router();

router.post('/verify', billingController.verifyPayment);
router.post('/webhook', billingController.handleWebhook);

module.exports = router;
