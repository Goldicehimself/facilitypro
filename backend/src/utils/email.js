// Email Utility
const nodemailer = require('nodemailer');
const logger = require('./logger');

const DEFAULT_TIMEOUT_MS = 10000;
const SMTP_TIMEOUT_MS = Number(process.env.SMTP_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

let transporterCache = null;
let transporterVerified = false;

const getEnvConfig = () => {
  const {
    BREVO_SMTP_HOST,
    BREVO_SMTP_PORT,
    BREVO_SMTP_USER,
    BREVO_SMTP_PASS,
    BREVO_SMTP_SECURE
  } = process.env;

  const host = BREVO_SMTP_HOST;
  const port = BREVO_SMTP_PORT;
  const user = BREVO_SMTP_USER;
  const pass = BREVO_SMTP_PASS;
  const secureRaw = BREVO_SMTP_SECURE;
  const secure = typeof secureRaw === 'string' ? secureRaw.toLowerCase() === 'true' : false;
  const from = process.env.EMAIL_FROM || 'FacilityPro <no-reply@example.com>';

  return { host, port, user, pass, secure, from };
};

const isConfigured = (config) =>
  Boolean(config.host && config.port && config.user && config.pass);

const getTransporter = () => {
  if (transporterCache) {
    return transporterCache;
  }

  const config = getEnvConfig();
  if (!isConfigured(config)) {
    return null;
  }

  transporterCache = nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: config.secure,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  return transporterCache;
};

const verifyTransporter = async () => {
  const transporter = getTransporter();
  if (!transporter) {
    return false;
  }

  if (transporterVerified) {
    return true;
  }

  try {
    await transporter.verify();
    transporterVerified = true;
    return true;
  } catch (error) {
    logger.error('[email] transporter verification failed:', error.message);
    return false;
  }
};

const normalizeRecipients = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return value.trim();
  return null;
};

const sendEmail = async ({ to, subject, text, html, replyTo, attachments } = {}) => {
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn('[email] SMTP not configured; skipping send.');
    return { ok: false, skipped: true };
  }

  if (!subject || typeof subject !== 'string') {
    logger.warn('[email] missing subject; skipping send.');
    return { ok: false, skipped: true };
  }

  if (!text && !html) {
    logger.warn('[email] missing body; skipping send.');
    return { ok: false, skipped: true };
  }

  const recipients = normalizeRecipients(to);
  if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
    logger.warn('[email] missing recipients; skipping send.');
    return { ok: false, skipped: true };
  }

  const config = getEnvConfig();
  const verified = await verifyTransporter();
  if (!verified) {
    return { ok: false, skipped: true };
  }

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to: recipients,
      subject: subject.trim(),
      text,
      html,
      replyTo,
      attachments
    });
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    logger.error('[email] failed to send:', error.message);
    return { ok: false, error: error.message };
  }
};

const resetTransporter = () => {
  transporterCache = null;
  transporterVerified = false;
};

module.exports = {
  sendEmail,
  resetTransporter
};
