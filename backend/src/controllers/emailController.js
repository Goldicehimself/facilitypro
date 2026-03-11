// Email Controller
const response = require('../utils/response');
const { ValidationError } = require('../utils/errorHandler');
const { sendEmail } = require('../utils/email');

const sendTestEmail = async (req, res, next) => {
  try {
    const { to } = req.body || {};
    if (!to) {
      throw new ValidationError('Recipient email is required');
    }

    const sent = await sendEmail({
      to,
      subject: 'FacilityPro test email',
      text: 'This is a test email from FacilityPro.'
    });

    response.success(res, sent ? 'Test email sent' : 'Email not sent (SMTP not configured)', { sent });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendTestEmail
};
