// Email Utility
const nodemailer = require('nodemailer');
const getTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    BREVO_SMTP_HOST,
    BREVO_SMTP_PORT,
    BREVO_SMTP_USER,
    BREVO_SMTP_PASS,
    BREVO_SMTP_SECURE
  } = process.env;

  const host = SMTP_HOST || BREVO_SMTP_HOST;
  const port = SMTP_PORT || BREVO_SMTP_PORT;
  const user = SMTP_USER || BREVO_SMTP_USER;
  const pass = SMTP_PASS || BREVO_SMTP_PASS;
  const secure = (SMTP_SECURE || BREVO_SMTP_SECURE) === 'true';

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user,
      pass
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[email] SMTP not configured; skipping send.');
    return false;
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM ||  "FacilityPro <no-reply@example.com>";
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error('[email] failed to send:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail
};
