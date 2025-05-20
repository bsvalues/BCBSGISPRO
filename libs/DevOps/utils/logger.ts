/**
 * Advanced Logging System
 * 
 * This module provides a robust logging system for the TerraFusion platform
 * with support for multiple transports, log levels, and structured data.
 */

// Log levels in order of severity
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

// Transport interface for log destinations
export interface LogTransport {
  // Destination name
  name: string;
  
  // Minimum log level to capture
  minLevel: LogLevel;
  
  // Log output function
  log(entry: LogEntry): void;
}

// Log entry interface
export interface LogEntry {
  // Timestamp of the log entry
  timestamp: Date;
  
  // Log level
  level: LogLevel;
  
  // Log message
  message: string;
  
  // Error object, if applicable
  error?: Error;
  
  // Tags for categorization
  tags?: string[];
  
  // Additional metadata
  metadata?: Record<string, any>;
  
  // Source information
  source?: {
    file?: string;
    function?: string;
    line?: number;
  };
}

// Console transport for logging to the console
export class ConsoleTransport implements LogTransport {
  name: string = 'console';
  minLevel: LogLevel;
  
  // ANSI color codes for different log levels
  private readonly levelColors = {
    [LogLevel.TRACE]: '\x1b[90m', // Gray
    [LogLevel.DEBUG]: '\x1b[36m', // Cyan
    [LogLevel.INFO]: '\x1b[32m',  // Green
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
    [LogLevel.FATAL]: '\x1b[35m'  // Magenta
  };
  
  // Reset ANSI color
  private readonly resetColor = '\x1b[0m';
  
  // Level names for display
  private readonly levelNames = {
    [LogLevel.TRACE]: 'TRACE',
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO ',
    [LogLevel.WARN]: 'WARN ',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.FATAL]: 'FATAL'
  };
  
  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }
  
  log(entry: LogEntry): void {
    // Skip if below minimum level
    if (entry.level < this.minLevel) {
      return;
    }
    
    // Format timestamp
    const timestamp = entry.timestamp.toISOString();
    
    // Format tags
    const tags = entry.tags && entry.tags.length > 0
      ? `[${entry.tags.join(', ')}] `
      : '';
    
    // Format level with color
    const levelColor = this.levelColors[entry.level] || '';
    const levelName = this.levelNames[entry.level] || 'UNKNOWN';
    const level = `${levelColor}${levelName}${this.resetColor}`;
    
    // Format message
    const message = entry.message;
    
    // Build log line
    const logLine = `${timestamp} ${level} ${tags}${message}`;
    
    // Output to console based on level
    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(logLine);
        break;
      case LogLevel.INFO:
        console.info(logLine);
        break;
      case LogLevel.WARN:
        console.warn(logLine);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logLine);
        break;
      default:
        console.log(logLine);
    }
    
    // Output metadata if present
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.dir(entry.metadata, { depth: 4, colors: true });
    }
    
    // Output error stack trace if present
    if (entry.error && entry.error.stack) {
      console.error(entry.error.stack);
    }
  }
}

// File transport for logging to files
export class FileTransport implements LogTransport {
  name: string = 'file';
  minLevel: LogLevel;
  filePath: string;
  
  constructor(filePath: string, minLevel: LogLevel = LogLevel.INFO) {
    this.filePath = filePath;
    this.minLevel = minLevel;
  }
  
  log(entry: LogEntry): void {
    // Skip if below minimum level
    if (entry.level < this.minLevel) {
      return;
    }
    
    // In a real implementation, this would write to a file
    // For now, we'll just simulate it
    console.log(`[FileTransport] Would write to ${this.filePath}:`, JSON.stringify(entry));
  }
}

// Memory transport for in-memory logging
export class MemoryTransport implements LogTransport {
  name: string = 'memory';
  minLevel: LogLevel;
  maxEntries: number;
  entries: LogEntry[] = [];
  
  constructor(maxEntries: number = 1000, minLevel: LogLevel = LogLevel.INFO) {
    this.maxEntries = maxEntries;
    this.minLevel = minLevel;
  }
  
  log(entry: LogEntry): void {
    // Skip if below minimum level
    if (entry.level < this.minLevel) {
      return;
    }
    
    // Add entry to memory buffer
    this.entries.push(entry);
    
    // Trim buffer if exceeding max entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }
  
  // Get all entries
  getEntries(): LogEntry[] {
    return [...this.entries];
  }
  
  // Clear entries
  clearEntries(): void {
    this.entries = [];
  }
  
  // Search entries by criteria
  searchEntries(criteria: {
    level?: LogLevel,
    minLevel?: LogLevel,
    maxLevel?: LogLevel,
    tags?: string[],
    text?: string,
    from?: Date,
    to?: Date
  }): LogEntry[] {
    return this.entries.filter(entry => {
      // Filter by exact level
      if (criteria.level !== undefined && entry.level !== criteria.level) {
        return false;
      }
      
      // Filter by min level
      if (criteria.minLevel !== undefined && entry.level < criteria.minLevel) {
        return false;
      }
      
      // Filter by max level
      if (criteria.maxLevel !== undefined && entry.level > criteria.maxLevel) {
        return false;
      }
      
      // Filter by tags (any match)
      if (criteria.tags && criteria.tags.length > 0 && (!entry.tags || !criteria.tags.some(tag => entry.tags!.includes(tag)))) {
        return false;
      }
      
      // Filter by text in message
      if (criteria.text && !entry.message.includes(criteria.text)) {
        return false;
      }
      
      // Filter by date range
      if (criteria.from && entry.timestamp < criteria.from) {
        return false;
      }
      
      if (criteria.to && entry.timestamp > criteria.to) {
        return false;
      }
      
      return true;
    });
  }
}

// Logger class
export class Logger {
  private transports: LogTransport[] = [];
  private defaultTags: string[] = [];
  private defaultMetadata: Record<string, any> = {};
  
  constructor() {
    // Add console transport by default
    this.addTransport(new ConsoleTransport());
  }
  
  // Add a transport
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }
  
  // Remove a transport by name
  removeTransport(name: string): void {
    this.transports = this.transports.filter(t => t.name !== name);
  }
  
  // Set default tags
  setDefaultTags(tags: string[]): void {
    this.defaultTags = tags;
  }
  
  // Add default tags
  addDefaultTags(...tags: string[]): void {
    this.defaultTags = [...new Set([...this.defaultTags, ...tags])];
  }
  
  // Set default metadata
  setDefaultMetadata(metadata: Record<string, any>): void {
    this.defaultMetadata = metadata;
  }
  
  // Add default metadata
  addDefaultMetadata(metadata: Record<string, any>): void {
    this.defaultMetadata = { ...this.defaultMetadata, ...metadata };
  }
  
  // Create a log entry
  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    tags?: string[],
    metadata?: Record<string, any>
  ): LogEntry {
    // Combine default and provided tags
    const combinedTags = [...this.defaultTags];
    if (tags && tags.length > 0) {
      tags.forEach(tag => {
        if (!combinedTags.includes(tag)) {
          combinedTags.push(tag);
        }
      });
    }
    
    // Combine default and provided metadata
    const combinedMetadata = { ...this.defaultMetadata, ...metadata };
    
    // Create entry
    return {
      timestamp: new Date(),
      level,
      message,
      error,
      tags: combinedTags.length > 0 ? combinedTags : undefined,
      metadata: Object.keys(combinedMetadata).length > 0 ? combinedMetadata : undefined
    };
  }
  
  // Log a message at a specific level
  log(
    level: LogLevel,
    message: string,
    errorOrMetadata?: Error | Record<string, any>,
    metadata?: Record<string, any>
  ): void {
    let error: Error | undefined;
    let logMetadata: Record<string, any> | undefined;
    
    // Handle optional error and metadata arguments
    if (errorOrMetadata instanceof Error) {
      error = errorOrMetadata;
      logMetadata = metadata;
    } else if (errorOrMetadata && typeof errorOrMetadata === 'object') {
      logMetadata = errorOrMetadata as Record<string, any>;
    }
    
    // Create log entry
    const entry = this.createLogEntry(level, message, error, undefined, logMetadata);
    
    // Send to all transports
    this.transports.forEach(transport => {
      try {
        transport.log(entry);
      } catch (err) {
        // If a transport fails, log to console as a fallback
        console.error(`Logger transport '${transport.name}' failed:`, err);
      }
    });
  }
  
  // Create a child logger with additional tags
  withTags(tags: string[]): Logger {
    const childLogger = new Logger();
    
    // Copy transports
    this.transports.forEach(transport => {
      childLogger.addTransport(transport);
    });
    
    // Combine tags
    childLogger.setDefaultTags([...this.defaultTags, ...tags]);
    
    // Copy metadata
    childLogger.setDefaultMetadata(this.defaultMetadata);
    
    return childLogger;
  }
  
  // Create a child logger with additional metadata
  withMetadata(metadata: Record<string, any>): Logger {
    const childLogger = new Logger();
    
    // Copy transports
    this.transports.forEach(transport => {
      childLogger.addTransport(transport);
    });
    
    // Copy tags
    childLogger.setDefaultTags(this.defaultTags);
    
    // Combine metadata
    childLogger.setDefaultMetadata({ ...this.defaultMetadata, ...metadata });
    
    return childLogger;
  }
  
  // Log at TRACE level
  trace(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, metadata);
  }
  
  // Log at DEBUG level
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
  
  // Log at INFO level
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }
  
  // Log at WARN level
  warn(message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, errorOrMetadata, metadata);
  }
  
  // Log at ERROR level
  error(message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, errorOrMetadata, metadata);
  }
  
  // Log at FATAL level
  fatal(message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, errorOrMetadata, metadata);
  }
  
  // Start timing an operation
  startTimer(operationName: string): () => void {
    const start = Date.now();
    
    // Return function to end timer and log result
    return () => {
      const duration = Date.now() - start;
      this.info(`Operation '${operationName}' completed in ${duration}ms`, { 
        operation: operationName, 
        durationMs: duration 
      });
    };
  }
  
  // Log with a specific tag temporarily
  withTag(tag: string): {
    trace: (message: string, metadata?: Record<string, any>) => void;
    debug: (message: string, metadata?: Record<string, any>) => void;
    info: (message: string, metadata?: Record<string, any>) => void;
    warn: (message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>) => void;
    error: (message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>) => void;
    fatal: (message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>) => void;
  } {
    const tempLogger = this.withTags([tag]);
    
    return {
      trace: tempLogger.trace.bind(tempLogger),
      debug: tempLogger.debug.bind(tempLogger),
      info: tempLogger.info.bind(tempLogger),
      warn: tempLogger.warn.bind(tempLogger),
      error: tempLogger.error.bind(tempLogger),
      fatal: tempLogger.fatal.bind(tempLogger)
    };
  }
}

// Create default logger instance
export const logger = new Logger();

// Add memory transport for in-memory logs
export const memoryTransport = new MemoryTransport();
logger.addTransport(memoryTransport);

// Add metadata about environment
logger.addDefaultMetadata({
  environment: process.env.NODE_ENV || 'development',
  appVersion: process.env.npm_package_version || 'unknown'
});