// Email Utility
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let resendClient = null;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

const getTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const resend = getResendClient();
  if (resend) {
    const from = process.env.EMAIL_FROM || process.env.SMTP_FROM ||  "FacilityPro <no-reply@resend.test>";
    const toList = Array.isArray(to) ? to : [to];
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: toList,
        subject,
        text,
        html
      });
      if (error) {
        console.error('[email] failed to send (resend):', error.message || error);
        return false;
      }
      return Boolean(data?.id);
    } catch (error) {
      console.error('[email] failed to send (resend):', error.message);
      return false;
    }
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log('[email] SMTP not configured; skipping send.');
    return false;
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM ||  "FacilityPro <no-reply@resend.test>";
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
