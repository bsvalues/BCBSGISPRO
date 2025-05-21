/**
 * Logger Utility
 * 
 * This module provides a centralized logging system for the application, with support for 
 * different log levels, tags, and formatters. It can be configured to output logs to 
 * various destinations including console, file, and remote services.
 */

// Log level enum
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  tags: string[];
  data?: any;
  error?: Error;
}

// Log formatter type
export type LogFormatter = (entry: LogEntry) => string;

// Log destination interface
export interface LogDestination {
  write: (entry: LogEntry) => void;
  level: LogLevel;
}

// Console log destination
export class ConsoleLogDestination implements LogDestination {
  level: LogLevel;
  formatter: LogFormatter;
  
  constructor(level: LogLevel = LogLevel.INFO, formatter?: LogFormatter) {
    this.level = level;
    this.formatter = formatter || this.defaultFormatter;
  }
  
  write(entry: LogEntry): void {
    if (this.shouldLog(entry.level)) {
      const formattedMessage = this.formatter(entry);
      
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formattedMessage);
          break;
      }
      
      // If there's an error object, log it too
      if (entry.error) {
        console.error(entry.error);
      }
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const thisLevelIndex = levels.indexOf(this.level);
    const entryLevelIndex = levels.indexOf(level);
    
    return entryLevelIndex >= thisLevelIndex;
  }
  
  private defaultFormatter(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const tags = entry.tags.length > 0 ? `[${entry.tags.join(', ')}]` : '';
    
    let message = `[${timestamp}] [${level}] ${tags} ${entry.message}`;
    
    if (entry.data) {
      try {
        const dataStr = JSON.stringify(entry.data);
        message += ` - ${dataStr}`;
      } catch (e) {
        message += ' - [Data cannot be stringified]';
      }
    }
    
    return message;
  }
}

// File log destination (would be implemented in a real application)
export class FileLogDestination implements LogDestination {
  level: LogLevel;
  formatter: LogFormatter;
  filePath: string;
  
  constructor(filePath: string, level: LogLevel = LogLevel.INFO, formatter?: LogFormatter) {
    this.filePath = filePath;
    this.level = level;
    this.formatter = formatter || this.defaultFormatter;
  }
  
  write(entry: LogEntry): void {
    // In a real implementation, this would write to a file
    // For now, we'll just simulate it
    console.log(`[FILE] Would write to ${this.filePath}: ${this.formatter(entry)}`);
  }
  
  private defaultFormatter(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const tags = entry.tags.length > 0 ? `[${entry.tags.join(', ')}]` : '';
    
    let message = `[${timestamp}] [${level}] ${tags} ${entry.message}`;
    
    if (entry.data) {
      try {
        const dataStr = JSON.stringify(entry.data);
        message += ` - ${dataStr}`;
      } catch (e) {
        message += ' - [Data cannot be stringified]';
      }
    }
    
    if (entry.error) {
      message += ` - Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\n${entry.error.stack}`;
      }
    }
    
    return message;
  }
}

// Logger class
export class Logger {
  private static instance: Logger;
  private destinations: LogDestination[] = [];
  private defaultTags: string[] = [];
  
  private constructor() {
    // Add console destination by default
    this.addDestination(new ConsoleLogDestination());
  }
  
  /**
   * Get the singleton logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    
    return Logger.instance;
  }
  
  /**
   * Add a log destination
   */
  public addDestination(destination: LogDestination): void {
    this.destinations.push(destination);
  }
  
  /**
   * Remove a log destination
   */
  public removeDestination(destination: LogDestination): void {
    const index = this.destinations.indexOf(destination);
    if (index !== -1) {
      this.destinations.splice(index, 1);
    }
  }
  
  /**
   * Clear all destinations
   */
  public clearDestinations(): void {
    this.destinations = [];
  }
  
  /**
   * Set default tags for all log messages
   */
  public setDefaultTags(tags: string[]): void {
    this.defaultTags = tags;
  }
  
  /**
   * Create a new logger with additional tags
   */
  public withTags(tags: string[]): Logger {
    const newLogger = new Logger();
    newLogger.destinations = this.destinations;
    newLogger.defaultTags = [...this.defaultTags, ...tags];
    return newLogger;
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  /**
   * Log an info message
   */
  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  /**
   * Log a warning message
   */
  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  /**
   * Log an error message
   */
  public error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, undefined, error instanceof Error ? error : new Error(String(error)));
  }
  
  /**
   * Log a fatal error message
   */
  public fatal(message: string, error?: any): void {
    this.log(LogLevel.FATAL, message, undefined, error instanceof Error ? error : new Error(String(error)));
  }
  
  /**
   * Log a message with a specific level
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      tags: this.defaultTags,
      data,
      error
    };
    
    for (const destination of this.destinations) {
      destination.write(entry);
    }
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();