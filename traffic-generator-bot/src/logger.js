const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config.json');

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: logFormat,
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // File logging with rotation
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxFiles: config.logging.maxFiles || 5,
      maxsize: config.logging.maxSize || 10485760 // 10MB
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxFiles: config.logging.maxFiles || 5,
      maxsize: config.logging.maxSize || 10485760 // 10MB
    })
  ]
});

// Add activity logging specific for traffic and ad interactions
const activityLogger = {
  logSearch: (keyword, engine) => {
    logger.info(`SEARCH: Keyword "${keyword}" on ${engine}`);
  },
  logVisit: (url) => {
    logger.info(`VISIT: Navigated to ${url}`);
  },
  logClick: (element, url) => {
    logger.info(`CLICK: ${element} on ${url}`);
  },
  logAdView: (adType, duration, url) => {
    logger.info(`AD_VIEW: ${adType} ad viewed for ${duration}s on ${url}`);
  },
  logAdClick: (adType, url) => {
    logger.info(`AD_CLICK: ${adType} ad clicked on ${url}`);
  },
  logSchedule: (taskType, time) => {
    logger.info(`SCHEDULE: ${taskType} scheduled for ${time}`);
  },
  logSession: (sessionId, type, start = true) => {
    const action = start ? 'Started' : 'Ended';
    logger.info(`SESSION: ${action} ${type} session (ID: ${sessionId})`);
  },
  logError: (error, context = '') => {
    logger.error(`ERROR: ${error.message} ${context ? `| Context: ${context}` : ''}`);
  }
};

module.exports = { logger, activityLogger };
