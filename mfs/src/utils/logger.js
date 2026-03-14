const isProd = import.meta.env.PROD;
const enableConsole = import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true' || !isProd;

const log = (level, ...args) => {
  if (!enableConsole) return;
  const method = console[level] || console.log;
  method(...args);
};

const logger = {
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
  debug: (...args) => log('debug', ...args),
  log: (...args) => log('log', ...args)
};

export default logger;
