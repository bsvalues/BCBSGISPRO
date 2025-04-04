/**
 * Simple logger utility for consistent log formatting
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
 * Logger with different log levels
 */
export const logger = {
  debug(message: string): void {
    if (ACTIVE_LOG_LEVEL <= LogLevel.DEBUG) {
      console.debug(formatLogMessage('DEBUG', message));
    }
  },
  
  info(message: string): void {
    if (ACTIVE_LOG_LEVEL <= LogLevel.INFO) {
      console.info(formatLogMessage('INFO', message));
    }
  },
  
  warn(message: string): void {
    if (ACTIVE_LOG_LEVEL <= LogLevel.WARN) {
      console.warn(formatLogMessage('WARN', message));
    }
  },
  
  error(message: string): void {
    if (ACTIVE_LOG_LEVEL <= LogLevel.ERROR) {
      console.error(formatLogMessage('ERROR', message));
    }
  }
};

export default logger;