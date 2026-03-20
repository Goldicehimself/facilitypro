const billingService = require('../services/billingService');
const response = require('../utils/response');

const verifyPayment = async (req, res, next) => {
  try {
    const result = await billingService.verifyAndActivate(req.body || {});
    response.success(res, 'Payment verified', result);
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    await billingService.handleWebhook({
      rawBody: req.body,
      signature: req.headers['x-paystack-signature'],
    });
    res.status(200).json({ received: true });
  } catch (error) {
    if (error?.message === 'Invalid Paystack signature') {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
    next(error);
  }
};

module.exports = {
  verifyPayment,
  handleWebhook,
};
