// Simple Logger Utility
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const enableConsole = process.env.ENABLE_CONSOLE_LOGS === 'true' || !isProduction;
const enableFile = process.env.LOG_TO_FILE === 'true';
const logDir = path.join(__dirname, '../../logs');

if (enableFile && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();

const log = (level, message, data = '') => {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message} ${data}`;
  
  if (enableConsole) {
    const method = console[level] || console.log;
    method(logMessage);
  }

  if (enableFile) {
    const logFile = path.join(logDir, `${level}.log`);
    fs.appendFileSync(logFile, logMessage + '\n');
  }
};

module.exports = {
  info: (message, data) => log('info', message, data),
  error: (message, data) => log('error', message, data),
  warn: (message, data) => log('warn', message, data),
  debug: (message, data) => log('debug', message, data)
};
