// Simple Logger Utility
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();

const log = (level, message, data = '') => {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message} ${data}`;
  
  console.log(logMessage);
  
  // Optional: Write to file
  const logFile = path.join(logDir, `${level}.log`);
  // fs.appendFileSync(logFile, logMessage + '\n');
};

module.exports = {
  info: (message, data) => log('info', message, data),
  error: (message, data) => log('error', message, data),
  warn: (message, data) => log('warn', message, data),
  debug: (message, data) => log('debug', message, data)
};
