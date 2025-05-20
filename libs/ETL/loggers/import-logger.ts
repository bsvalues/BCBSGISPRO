/**
 * Import Logger for TerraFusion ETL Module
 * 
 * This module provides logging functionality for data import operations,
 * recording information about imported files, record counts, and validation results.
 */

import fs from 'fs';
import path from 'path';

interface ImportLogOptions {
  logDir: string;
  countyName: string;
  dataType: string;
}

interface ImportEntry {
  fileName: string;
  recordCount: number;
  validationResults?: {
    errors: any[];
    warnings: any[];
  };
  timestamp: string;
}

/**
 * Class for logging import operations
 */
export class ImportLogger {
  private logDir: string;
  private countyName: string;
  private dataType: string;
  private logFilePath: string;

  /**
   * Create a new import logger
   * 
   * @param options - Configuration options for the logger
   */
  constructor(options: ImportLogOptions) {
    this.logDir = options.logDir;
    this.countyName = options.countyName;
    this.dataType = options.dataType;
    
    // Create log directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Set up log file path
    this.logFilePath = path.join(
      this.logDir, 
      `${this.countyName}-${this.dataType}-import.json`
    );
    
    // Initialize log file if it doesn't exist
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, JSON.stringify({
        county: this.countyName,
        dataType: this.dataType,
        entries: []
      }, null, 2));
    }
  }

  /**
   * Log an import operation
   * 
   * @param entry - Information about the import operation
   */
  async logImport(entry: Omit<ImportEntry, 'timestamp'>): Promise<void> {
    try {
      // Read existing log
      const logData = JSON.parse(fs.readFileSync(this.logFilePath, 'utf8'));
      
      // Add new entry
      logData.entries.push({
        ...entry,
        timestamp: new Date().toISOString()
      });
      
      // Write updated log
      fs.writeFileSync(this.logFilePath, JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error(`Error logging import: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all import logs for the county and data type
   * 
   * @returns Array of import log entries
   */
  async getImportLogs(): Promise<ImportEntry[]> {
    try {
      // Read log file
      const logData = JSON.parse(fs.readFileSync(this.logFilePath, 'utf8'));
      
      // Return entries
      return logData.entries || [];
    } catch (error) {
      console.error(`Error getting import logs: ${error.message}`);
      return [];
    }
  }

  /**
   * Clear all import logs for the county and data type
   */
  async clearImportLogs(): Promise<void> {
    try {
      // Write empty log file
      fs.writeFileSync(this.logFilePath, JSON.stringify({
        county: this.countyName,
        dataType: this.dataType,
        entries: []
      }, null, 2));
    } catch (error) {
      console.error(`Error clearing import logs: ${error.message}`);
      throw error;
    }
  }
}