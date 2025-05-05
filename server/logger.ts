/**
 * Enhanced logger utility for consistent log formatting and error tracking
 */

const ENABLE_DEBUG = process.env.NODE_ENV === 'development';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Active log level based on environment
const ACTIVE_LOG_LEVEL = ENABLE_DEBUG ? LogLevel.DEBUG : LogLevel.INFO;

/**
 * Format a log message with timestamp and level
 */
function formatLogMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

/**
 * Enhanced logger with different log levels and support for metadata
 */
export const logger = {
  debug(message: string, metadata?: any): void {
    if (ACTIVE_LOG_LEVEL <= LogLevel.DEBUG) {
      if (metadata) {
        console.debug(formatLogMessage('DEBUG', message), metadata);
      } else {
        console.debug(formatLogMessage('DEBUG', message));
      }
    }
  },
  
  info(message: string, metadata?: any): void {
    if (ACTIVE_LOG_LEVEL <= LogLevel.INFO) {
      if (metadata) {
        console.info(formatLogMessage('INFO', message), metadata);
      } else {
        console.info(formatLogMessage('INFO', message));
      }
    }
  },
  
  warn(message: string, metadata?: any): void {
    if (ACTIVE_LOG_LEVEL <= LogLevel.WARN) {
      if (metadata) {
        console.warn(formatLogMessage('WARN', message), metadata);
      } else {
        console.warn(formatLogMessage('WARN', message));
      }
    }
  },
  
  error(message: string, metadata?: any): void {
    if (ACTIVE_LOG_LEVEL <= LogLevel.ERROR) {
      if (metadata) {
        console.error(formatLogMessage('ERROR', message), metadata);
      } else {
        console.error(formatLogMessage('ERROR', message));
      }
    }
  }
};

export default logger;