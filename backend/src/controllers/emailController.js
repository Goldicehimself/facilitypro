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

    response.success(res, sent?.ok ? 'Test email sent' : 'Email not sent (SMTP not configured)', { sent });
  } catch (error) {
    next(error);
  }
};

const sendContactSales = async (req, res, next) => {
  try {
    const {
      name,
      email,
      companyName,
      companySize,
      message,
      currentPlan,
    } = req.body || {};

    if (!name || !email || !companyName || !companySize) {
      throw new ValidationError('Name, email, company name, and company size are required');
    }

    const to =
      process.env.SUPPORT_EMAIL
      || process.env.SALES_CONTACT_EMAIL
      || process.env.EMAIL_FROM;

    if (!to) {
      throw new ValidationError('Contact email is not configured');
    }

    const subject = 'FacilityPro contact sales request';
    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${companyName}`,
      `Company size: ${companySize}`,
      `Current plan: ${currentPlan || 'Pro'}`,
      `Message: ${message || 'N/A'}`,
    ].join('\n');

    const sent = await sendEmail({ to, subject, text, replyTo: email });

    response.success(res, sent?.ok ? 'Message sent' : 'Message not sent (SMTP not configured)', { sent });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendTestEmail,
  sendContactSales,
};
