/**
 * Logger utility for the DevOps module
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogOptions {
  timestamp?: boolean;
  includeTrace?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

const defaultOptions: LogOptions = {
  timestamp: true,
  includeTrace: false,
  tags: [],
  metadata: {}
};

/**
 * Format a log message
 * 
 * @param level The log level
 * @param message The message to log
 * @param options Logging options
 * @returns Formatted log string
 */
function formatLog(level: LogLevel, message: string, options: LogOptions): string {
  const parts: string[] = [];
  
  // Add timestamp
  if (options.timestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  // Add log level
  parts.push(`[${level.toUpperCase()}]`);
  
  // Add tags
  if (options.tags && options.tags.length > 0) {
    parts.push(`[${options.tags.join(',')}]`);
  }
  
  // Add message
  parts.push(message);
  
  // Add metadata if present
  if (options.metadata && Object.keys(options.metadata).length > 0) {
    parts.push(JSON.stringify(options.metadata));
  }
  
  return parts.join(' ');
}

/**
 * Get stack trace info
 * 
 * @returns Stack trace string
 */
function getStackTrace(): string {
  const stackLines = new Error().stack?.split('\n').slice(3) || [];
  return stackLines.join('\n');
}

/**
 * Logger utility with multiple log levels and formatting options
 */
export const logger = {
  /**
   * Log a debug message
   * 
   * @param message The message to log
   * @param options Logging options
   */
  debug(message: string, options: LogOptions = {}) {
    const mergedOptions = { ...defaultOptions, ...options };
    console.debug(formatLog('debug', message, mergedOptions));
    
    if (mergedOptions.includeTrace) {
      console.debug(getStackTrace());
    }
  },
  
  /**
   * Log an info message
   * 
   * @param message The message to log
   * @param options Logging options
   */
  info(message: string, options: LogOptions = {}) {
    const mergedOptions = { ...defaultOptions, ...options };
    console.info(formatLog('info', message, mergedOptions));
    
    if (mergedOptions.includeTrace) {
      console.info(getStackTrace());
    }
  },
  
  /**
   * Log a warning message
   * 
   * @param message The message to log
   * @param options Logging options
   */
  warn(message: string, options: LogOptions = {}) {
    const mergedOptions = { ...defaultOptions, ...options };
    console.warn(formatLog('warn', message, mergedOptions));
    
    if (mergedOptions.includeTrace) {
      console.warn(getStackTrace());
    }
  },
  
  /**
   * Log an error message
   * 
   * @param message The message to log
   * @param error Optional error object
   * @param options Logging options
   */
  error(message: string, error?: Error, options: LogOptions = {}) {
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Add error details to metadata if present
    if (error) {
      mergedOptions.metadata = {
        ...mergedOptions.metadata,
        errorName: error.name,
        errorMessage: error.message
      };
    }
    
    console.error(formatLog('error', message, mergedOptions));
    
    if (error && error.stack) {
      console.error(error.stack);
    } else if (mergedOptions.includeTrace) {
      console.error(getStackTrace());
    }
  },
  
  /**
   * Log a fatal message - this is for critical errors that may require system shutdown
   * 
   * @param message The message to log
   * @param error Optional error object
   * @param options Logging options
   */
  fatal(message: string, error?: Error, options: LogOptions = {}) {
    const mergedOptions = { ...defaultOptions, ...options, tags: [...(options.tags || []), 'FATAL'] };
    
    // Add error details to metadata if present
    if (error) {
      mergedOptions.metadata = {
        ...mergedOptions.metadata,
        errorName: error.name,
        errorMessage: error.message
      };
    }
    
    console.error(formatLog('fatal', message, mergedOptions));
    
    if (error && error.stack) {
      console.error(error.stack);
    } else {
      console.error(getStackTrace());
    }
  },
  
  /**
   * Create a logger with predefined tags
   * 
   * @param tags Tags to include with every log message
   * @returns Logger with predefined tags
   */
  withTags(tags: string[]) {
    return {
      debug: (message: string, options: LogOptions = {}) => 
        this.debug(message, { ...options, tags: [...tags, ...(options.tags || [])] }),
      
      info: (message: string, options: LogOptions = {}) => 
        this.info(message, { ...options, tags: [...tags, ...(options.tags || [])] }),
      
      warn: (message: string, options: LogOptions = {}) => 
        this.warn(message, { ...options, tags: [...tags, ...(options.tags || [])] }),
      
      error: (message: string, error?: Error, options: LogOptions = {}) => 
        this.error(message, error, { ...options, tags: [...tags, ...(options.tags || [])] }),
      
      fatal: (message: string, error?: Error, options: LogOptions = {}) => 
        this.fatal(message, error, { ...options, tags: [...tags, ...(options.tags || [])] })
    };
  },
  
  /**
   * Create a logger with predefined metadata
   * 
   * @param metadata Metadata to include with every log message
   * @returns Logger with predefined metadata
   */
  withMetadata(metadata: Record<string, any>) {
    return {
      debug: (message: string, options: LogOptions = {}) => 
        this.debug(message, { ...options, metadata: { ...metadata, ...(options.metadata || {}) } }),
      
      info: (message: string, options: LogOptions = {}) => 
        this.info(message, { ...options, metadata: { ...metadata, ...(options.metadata || {}) } }),
      
      warn: (message: string, options: LogOptions = {}) => 
        this.warn(message, { ...options, metadata: { ...metadata, ...(options.metadata || {}) } }),
      
      error: (message: string, error?: Error, options: LogOptions = {}) => 
        this.error(message, error, { ...options, metadata: { ...metadata, ...(options.metadata || {}) } }),
      
      fatal: (message: string, error?: Error, options: LogOptions = {}) => 
        this.fatal(message, error, { ...options, metadata: { ...metadata, ...(options.metadata || {}) } })
    };
  }
};