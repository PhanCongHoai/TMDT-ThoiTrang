const { NODE_ENV } = require('../config/env');

const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

function formatMessage(level, message, meta = null) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

const logger = {
  info(message, meta = null) {
    console.log(formatMessage(LogLevel.INFO, message, meta));
  },

  warn(message, meta = null) {
    console.warn(formatMessage(LogLevel.WARN, message, meta));
  },

  error(message, error = null) {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: NODE_ENV === 'development' ? error.stack : undefined }
      : error;
    console.error(formatMessage(LogLevel.ERROR, message, errorDetails));
  },

  debug(message, meta = null) {
    if (NODE_ENV === 'development') {
      console.debug(formatMessage(LogLevel.DEBUG, message, meta));
    }
  }
};

module.exports = logger;

