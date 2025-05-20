/**
 * TerraFusion Logger Utility
 * 
 * This module provides centralized logging capabilities for the TerraFusion platform,
 * supporting various log levels, structured logging, and the ability to add context tags.
 */

// Log levels
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

// Log level names
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
};

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  tags: string[];
  metadata?: Record<string, any>;
  error?: any;
  context?: Record<string, any>;
}

// Log transport interface
export interface LogTransport {
  log(entry: LogEntry): void;
}

// Console transport
class ConsoleTransport implements LogTransport {
  log(entry: LogEntry): void {
    const logMethod = this.getConsoleMethod(entry.level);
    const formattedEntry = this.formatEntry(entry);
    
    if (entry.error) {
      logMethod(formattedEntry, entry.error);
    } else if (entry.metadata) {
      logMethod(formattedEntry, entry.metadata);
    } else {
      logMethod(formattedEntry);
    }
  }
  
  private getConsoleMethod(level: LogLevel): Function {
    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }
  
  private formatEntry(entry: LogEntry): string {
    let tagsStr = '';
    if (entry.tags.length > 0) {
      tagsStr = `[${entry.tags.join(', ')}]`;
    }
    
    return `${entry.timestamp} [${entry.levelName}]${tagsStr ? ' ' + tagsStr : ''} ${entry.message}`;
  }
}

// File transport (for server-side only)
class FileTransport implements LogTransport {
  private filePath: string;
  
  constructor(filePath: string) {
    this.filePath = filePath;
  }
  
  log(entry: LogEntry): void {
    // In a browser environment, this would be a no-op
    if (typeof window !== 'undefined') return;
    
    // In a Node.js environment, this would write to a file
    // This is a simple implementation; in production, we would use a proper file logging library
    try {
      const fs = require('fs');
      const logLine = JSON.stringify({
        ...entry,
        // Convert Error objects to strings for JSON serialization
        error: entry.error ? this.serializeError(entry.error) : undefined
      }) + '\n';
      
      fs.appendFileSync(this.filePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  private serializeError(error: any): Record<string, any> {
    if (!(error instanceof Error)) {
      return { message: String(error) };
    }
    
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...error
    };
  }
}

// Memory transport (useful for testing and debugging)
class MemoryTransport implements LogTransport {
  private entries: LogEntry[] = [];
  private maxEntries: number;
  
  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }
  
  log(entry: LogEntry): void {
    this.entries.push(entry);
    
    // Keep the size of the entries array in check
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }
  
  getEntries(): LogEntry[] {
    return [...this.entries];
  }
  
  clear(): void {
    this.entries = [];
  }
  
  findEntries(filter: (entry: LogEntry) => boolean): LogEntry[] {
    return this.entries.filter(filter);
  }
}

// Remote transport (for sending logs to a remote service or API)
class RemoteTransport implements LogTransport {
  private url: string;
  private apiKey?: string;
  private batchSize: number;
  private flushInterval: number;
  private queue: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  
  constructor(url: string, options: { 
    apiKey?: string; 
    batchSize?: number; 
    flushInterval?: number; 
  } = {}) {
    this.url = url;
    this.apiKey = options.apiKey;
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 5000; // 5 seconds
    
    // Set up periodic flushing
    if (typeof window !== 'undefined') {
      // Browser environment
      this.timer = setInterval(() => this.flush(), this.flushInterval) as unknown as NodeJS.Timeout;
    } else {
      // Node.js environment
      this.timer = setInterval(() => this.flush(), this.flushInterval);
    }
  }
  
  log(entry: LogEntry): void {
    this.queue.push(entry);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }
  
  flush(): void {
    if (this.queue.length === 0) return;
    
    const entriesToSend = [...this.queue];
    this.queue = [];
    
    // Send the logs to the remote endpoint
    this.sendLogs(entriesToSend).catch(error => {
      console.error('Failed to send logs to remote endpoint:', error);
      
      // Add the entries back to the queue
      this.queue = [...entriesToSend, ...this.queue];
      
      // If the queue is too large, we'll have to discard some entries
      if (this.queue.length > 1000) {
        console.error(`Log queue is too large, discarding ${this.queue.length - 1000} entries`);
        this.queue = this.queue.slice(-1000);
      }
    });
  }
  
  private async sendLogs(entries: LogEntry[]): Promise<void> {
    // In a browser environment, use fetch
    if (typeof window !== 'undefined') {
      await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify({ entries })
      });
    } else {
      // In a Node.js environment, use node-fetch or another HTTP client
      try {
        const fetch = require('node-fetch');
        await fetch(this.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
          },
          body: JSON.stringify({ entries })
        });
      } catch (error) {
        console.error('Failed to send logs (Node.js):', error);
        throw error;
      }
    }
  }
  
  // Clean up when we're done
  dispose(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Final flush
    this.flush();
  }
}

// Logger configuration
export interface LoggerConfig {
  minLevel: LogLevel;
  transports: LogTransport[];
  defaultTags?: string[];
  defaultContext?: Record<string, any>;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: LogLevel.INFO,
  transports: [new ConsoleTransport()],
  defaultTags: ['TerraFusion'],
  defaultContext: {}
};

/**
 * Logger class
 */
export class Logger {
  private config: LoggerConfig;
  private tags: string[];
  private context: Record<string, any>;
  
  /**
   * Create a new logger
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      defaultTags: [...(DEFAULT_CONFIG.defaultTags || []), ...(config.defaultTags || [])],
      defaultContext: { ...DEFAULT_CONFIG.defaultContext, ...(config.defaultContext || {}) }
    };
    
    this.tags = [...(this.config.defaultTags || [])];
    this.context = { ...this.config.defaultContext };
  }
  
  /**
   * Create a new logger with additional tags
   */
  withTags(tags: string[]): Logger {
    const logger = new Logger(this.config);
    logger.tags = [...this.tags, ...tags];
    logger.context = { ...this.context };
    return logger;
  }
  
  /**
   * Create a new logger with additional context
   */
  withContext(context: Record<string, any>): Logger {
    const logger = new Logger(this.config);
    logger.tags = [...this.tags];
    logger.context = { ...this.context, ...context };
    return logger;
  }
  
  /**
   * Log a trace message
   */
  trace(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, metadata);
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
  
  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }
  
  /**
   * Log an error message
   */
  error(message: string, error?: any, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }
  
  /**
   * Log a fatal message
   */
  fatal(message: string, error?: any, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, metadata, error);
  }
  
  /**
   * Log a message at the specified level
   */
  log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: any): void {
    // Skip if below minimum level
    if (level < this.config.minLevel) {
      return;
    }
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LOG_LEVEL_NAMES[level],
      message,
      tags: [...this.tags],
      metadata,
      error,
      context: { ...this.context }
    };
    
    // Log to all transports
    for (const transport of this.config.transports) {
      try {
        transport.log(entry);
      } catch (transportError) {
        console.error('Error in log transport:', transportError);
      }
    }
  }
  
  /**
   * Set the minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }
  
  /**
   * Add a transport
   */
  addTransport(transport: LogTransport): void {
    this.config.transports.push(transport);
  }
  
  /**
   * Remove a transport
   */
  removeTransport(transport: LogTransport): void {
    const index = this.config.transports.indexOf(transport);
    if (index !== -1) {
      this.config.transports.splice(index, 1);
    }
  }
  
  /**
   * Clear all transports
   */
  clearTransports(): void {
    this.config.transports = [];
  }
}

// Create default logger instance
export const logger = new Logger();

// Create memory transport for debugging
export const memoryTransport = new MemoryTransport();

// Add memory transport to the default logger
logger.addTransport(memoryTransport);

// Export transports
export const transports = {
  ConsoleTransport,
  FileTransport,
  MemoryTransport,
  RemoteTransport
};