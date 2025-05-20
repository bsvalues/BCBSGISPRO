/**
 * CSV Importer for TerraFusion ETL Module
 * 
 * This module handles importing CSV files, with support for field mapping
 * and data validation.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { logger } from '../utils/logger';
import { ImportLogger } from '../loggers/import-logger';

interface CSVImportOptions {
  /** Directory to store logs */
  logDir?: string;
  /** County name for logging */
  countyName: string;
  /** Data type (e.g., 'parcels', 'sales', etc.) */
  dataType: string;
  /** Field mapping configuration */
  fieldMapping?: Record<string, string>;
  /** Validation rules */
  validationRules?: any[];
  /** Whether to skip the header row */
  skipHeader?: boolean;
  /** Whether to trim whitespace from values */
  trimValues?: boolean;
  /** Callback for each processed record */
  onRecord?: (record: Record<string, any>) => void;
  /** Callback for completed import */
  onComplete?: (summary: { 
    recordCount: number; 
    mappedCount: number; 
    validationErrors: number;
  }) => void;
}

/**
 * Default options for CSV import
 */
const defaultOptions: Partial<CSVImportOptions> = {
  logDir: './logs',
  fieldMapping: {},
  validationRules: [],
  skipHeader: true,
  trimValues: true
};

/**
 * Class for importing and processing CSV files
 */
export class CSVImporter {
  private options: CSVImportOptions;
  private logger: ImportLogger;
  private moduleLogger = logger.withTags(['ETL', 'CSV']);

  /**
   * Create a new CSV importer
   * 
   * @param options - Configuration options
   */
  constructor(options: CSVImportOptions) {
    this.options = { ...defaultOptions, ...options };
    
    // Set up logger
    this.logger = new ImportLogger({
      logDir: this.options.logDir || './logs',
      countyName: this.options.countyName,
      dataType: this.options.dataType
    });
    
    this.moduleLogger.info(`CSV Importer created for ${this.options.countyName} ${this.options.dataType}`);
  }

  /**
   * Import a CSV file
   * 
   * @param filePath - Path to the CSV file
   * @returns Promise that resolves when import is complete
   */
  async import(filePath: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.moduleLogger.info(`Starting import of ${filePath}`);
      
      // Read and parse the CSV file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const records = parse(fileContent, {
        columns: this.options.skipHeader,
        skip_empty_lines: true,
        trim: this.options.trimValues
      });
      
      this.moduleLogger.info(`Parsed ${records.length} records from ${filePath}`);
      
      // Process records
      let mappedCount = 0;
      let validationErrorCount = 0;
      
      for (const record of records) {
        // Apply field mapping
        const mappedRecord = this.mapFields(record);
        
        if (mappedRecord) {
          mappedCount++;
          
          // Apply validation if rules exist
          let validationResults = null;
          if (this.options.validationRules && this.options.validationRules.length > 0) {
            validationResults = this.validateRecord(mappedRecord);
            
            if (validationResults.errors.length > 0) {
              validationErrorCount += validationResults.errors.length;
            }
          }
          
          // Call record callback if provided
          if (this.options.onRecord) {
            this.options.onRecord(mappedRecord);
          }
        }
      }
      
      // Log import
      await this.logger.logImport({
        fileName: path.basename(filePath),
        recordCount: records.length,
        validationResults: {
          errors: [validationErrorCount],
          warnings: []
        }
      });
      
      // Call completion callback if provided
      if (this.options.onComplete) {
        this.options.onComplete({
          recordCount: records.length,
          mappedCount,
          validationErrors: validationErrorCount
        });
      }
      
      const duration = Date.now() - startTime;
      this.moduleLogger.info(
        `Import complete: ${records.length} records, ${mappedCount} mapped, ${validationErrorCount} validation errors`,
        { metadata: { duration: `${duration}ms` } }
      );
    } catch (error) {
      this.moduleLogger.error(`Error importing ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Get import history
   * 
   * @returns Promise that resolves with import history
   */
  async getImportHistory() {
    return this.logger.getImportLogs();
  }

  /**
   * Clear import history
   * 
   * @returns Promise that resolves when history is cleared
   */
  async clearImportHistory() {
    return this.logger.clearImportLogs();
  }

  /**
   * Map fields according to the field mapping configuration
   * 
   * @param record - Original record
   * @returns Mapped record
   */
  private mapFields(record: Record<string, any>): Record<string, any> | null {
    // If no mapping is defined, return the record as-is
    if (!this.options.fieldMapping || Object.keys(this.options.fieldMapping).length === 0) {
      return record;
    }
    
    const mappedRecord: Record<string, any> = {};
    
    // Apply mapping
    for (const [targetField, sourceField] of Object.entries(this.options.fieldMapping)) {
      if (record[sourceField] !== undefined) {
        mappedRecord[targetField] = record[sourceField];
      }
    }
    
    return Object.keys(mappedRecord).length > 0 ? mappedRecord : null;
  }

  /**
   * Validate a record according to validation rules
   * 
   * @param record - Record to validate
   * @returns Validation results
   */
  private validateRecord(record: Record<string, any>): { errors: any[]; warnings: any[] } {
    // This is a placeholder for actual validation logic
    // In a real implementation, this would apply validation rules and return errors/warnings
    return {
      errors: [],
      warnings: []
    };
  }
}