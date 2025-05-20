/**
 * CSV Importer
 * 
 * This module provides functionality for importing and parsing CSV files,
 * with support for data validation, transformation, and error handling.
 */

import { parse } from 'csv-parse/sync';
import { logger } from '../../DevOps/utils/logger';

// Create module-specific logger
const importLogger = logger.withTags(['ETL', 'CSVImporter']);

/**
 * CSV parsing options
 */
export interface CSVParseOptions {
  delimiter?: string;
  columns?: boolean | string[] | ((header: string[]) => string[]);
  skip_empty_lines?: boolean;
  trim?: boolean;
  skip_lines_with_error?: boolean;
  skip_records_with_error?: boolean;
  encoding?: string;
  fromLine?: number;
  toLine?: number;
  comment?: string;
  relax_quotes?: boolean;
}

/**
 * Default parsing options
 */
export const DEFAULT_PARSE_OPTIONS: CSVParseOptions = {
  delimiter: ',',
  columns: true,
  skip_empty_lines: true,
  trim: true,
  skip_records_with_error: false
};

/**
 * Field validation rule
 */
export interface ValidationRule {
  field: string;
  rule: 'required' | 'number' | 'integer' | 'positive' | 'date' | 'email' | 'regex' | 'custom';
  pattern?: string; // For regex validation
  message?: string; // Custom error message
  validate?: (value: any) => boolean; // For custom validation
}

/**
 * Field transformation rule
 */
export interface TransformationRule {
  field: string;
  transform: 'trim' | 'lowercase' | 'uppercase' | 'capitalize' | 'number' | 'boolean' | 'date' | 'custom';
  options?: any; // Additional options for transformation
  custom?: (value: any) => any; // For custom transformation
}

/**
 * Record filter rule
 */
export interface FilterRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'custom';
  value?: any;
  custom?: (record: Record<string, any>) => boolean; // For custom filtering
}

/**
 * CSV import options
 */
export interface CSVImportOptions {
  parseOptions?: CSVParseOptions;
  validationRules?: ValidationRule[];
  transformationRules?: TransformationRule[];
  filterRules?: FilterRule[];
  onProgress?: (progress: { total: number; processed: number; percentage: number }) => void;
  batchSize?: number;
}

/**
 * Validation error
 */
export interface ValidationError {
  row: number;
  field: string;
  value: any;
  rule: string;
  message: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  row: number;
  field: string;
  value: any;
  rule: string;
  message: string;
}

/**
 * Import result
 */
export interface ImportResult<T = Record<string, any>> {
  data: T[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  processedRows: number;
  totalRows: number;
  skippedRows: number;
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * CSV Importer class
 */
export class CSVImporter {
  private parseOptions: CSVParseOptions;
  private validationRules: ValidationRule[];
  private transformationRules: TransformationRule[];
  private filterRules: FilterRule[];
  private onProgress?: (progress: { total: number; processed: number; percentage: number }) => void;
  private batchSize: number;
  
  /**
   * Create a new CSV importer
   */
  constructor(options: CSVImportOptions = {}) {
    this.parseOptions = { ...DEFAULT_PARSE_OPTIONS, ...options.parseOptions };
    this.validationRules = options.validationRules || [];
    this.transformationRules = options.transformationRules || [];
    this.filterRules = options.filterRules || [];
    this.onProgress = options.onProgress;
    this.batchSize = options.batchSize || 1000;
  }
  
  /**
   * Import and parse a CSV file
   */
  async importCSV<T = Record<string, any>>(
    input: string | Buffer,
    options: Partial<CSVImportOptions> = {}
  ): Promise<ImportResult<T>> {
    const startTime = new Date();
    importLogger.info('Starting CSV import', {
      metadata: {
        parseOptions: this.parseOptions,
        validationRules: this.validationRules.length,
        transformationRules: this.transformationRules.length,
        filterRules: this.filterRules.length
      }
    });
    
    try {
      // Merge options
      const mergedOptions: CSVImportOptions = {
        parseOptions: { ...this.parseOptions, ...options.parseOptions },
        validationRules: options.validationRules || this.validationRules,
        transformationRules: options.transformationRules || this.transformationRules,
        filterRules: options.filterRules || this.filterRules,
        onProgress: options.onProgress || this.onProgress,
        batchSize: options.batchSize || this.batchSize
      };
      
      // Parse CSV
      const records = parse(input, mergedOptions.parseOptions);
      
      // Initialize result
      const result: ImportResult<T> = {
        data: [],
        errors: [],
        warnings: [],
        processedRows: 0,
        totalRows: records.length,
        skippedRows: 0,
        startTime,
        endTime: new Date(),
        duration: 0
      };
      
      // Process records in batches
      let batchCount = 0;
      const batchSize = mergedOptions.batchSize;
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        // Process batch
        for (const record of batch) {
          result.processedRows++;
          
          // Apply transformations
          const transformedRecord = this.applyTransformations(record, mergedOptions.transformationRules);
          
          // Apply filters
          if (!this.applyFilters(transformedRecord, mergedOptions.filterRules)) {
            result.skippedRows++;
            continue;
          }
          
          // Validate record
          const validationResults = this.validateRecord(transformedRecord, result.processedRows, mergedOptions.validationRules);
          
          if (validationResults) {
            if (validationResults.errors.length > 0) {
              result.errors.push(...validationResults.errors);
              
              // Skip records with errors
              result.skippedRows++;
              continue;
            }
            
            if (validationResults.warnings.length > 0) {
              result.warnings.push(...validationResults.warnings);
            }
          }
          
          // Add record to result
          result.data.push(transformedRecord as T);
        }
        
        // Report progress
        batchCount++;
        if (mergedOptions.onProgress) {
          mergedOptions.onProgress({
            total: records.length,
            processed: result.processedRows,
            percentage: (result.processedRows / records.length) * 100
          });
        }
      }
      
      // Update result timing
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      
      importLogger.info('CSV import completed', {
        metadata: {
          totalRows: result.totalRows,
          processedRows: result.processedRows,
          skippedRows: result.skippedRows,
          errors: result.errors.length,
          warnings: result.warnings.length,
          duration: `${result.duration}ms`
        }
      });
      
      return result;
    } catch (error) {
      importLogger.error('CSV import failed', error);
      throw error;
    }
  }
  
  /**
   * Apply transformations to a record
   */
  private applyTransformations(
    record: Record<string, any>,
    rules: TransformationRule[]
  ): Record<string, any> {
    const result = { ...record };
    
    for (const rule of rules) {
      const value = result[rule.field];
      
      // Skip undefined values
      if (value === undefined) {
        continue;
      }
      
      try {
        switch (rule.transform) {
          case 'trim':
            if (typeof value === 'string') {
              result[rule.field] = value.trim();
            }
            break;
            
          case 'lowercase':
            if (typeof value === 'string') {
              result[rule.field] = value.toLowerCase();
            }
            break;
            
          case 'uppercase':
            if (typeof value === 'string') {
              result[rule.field] = value.toUpperCase();
            }
            break;
            
          case 'capitalize':
            if (typeof value === 'string') {
              result[rule.field] = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            }
            break;
            
          case 'number':
            if (value !== null && value !== '') {
              result[rule.field] = Number(value);
            }
            break;
            
          case 'boolean':
            if (typeof value === 'string') {
              result[rule.field] = ['true', 'yes', '1', 'y'].includes(value.toLowerCase());
            }
            break;
            
          case 'date':
            if (value !== null && value !== '') {
              result[rule.field] = new Date(value);
            }
            break;
            
          case 'custom':
            if (rule.custom) {
              result[rule.field] = rule.custom(value);
            }
            break;
        }
      } catch (error) {
        importLogger.warn(`Transformation failed for field ${rule.field}`, error);
      }
    }
    
    return result;
  }
  
  /**
   * Apply filters to a record
   */
  private applyFilters(
    record: Record<string, any>,
    rules: FilterRule[]
  ): boolean {
    // If no filter rules, include all records
    if (rules.length === 0) {
      return true;
    }
    
    // Check if record matches all filter rules
    for (const rule of rules) {
      const value = record[rule.field];
      
      // Skip undefined values
      if (value === undefined) {
        return false;
      }
      
      try {
        switch (rule.operator) {
          case 'equals':
            if (value !== rule.value) {
              return false;
            }
            break;
            
          case 'notEquals':
            if (value === rule.value) {
              return false;
            }
            break;
            
          case 'contains':
            if (typeof value === 'string' && !value.includes(rule.value)) {
              return false;
            }
            break;
            
          case 'startsWith':
            if (typeof value === 'string' && !value.startsWith(rule.value)) {
              return false;
            }
            break;
            
          case 'endsWith':
            if (typeof value === 'string' && !value.endsWith(rule.value)) {
              return false;
            }
            break;
            
          case 'greaterThan':
            if (typeof value === 'number' && value <= rule.value) {
              return false;
            }
            break;
            
          case 'lessThan':
            if (typeof value === 'number' && value >= rule.value) {
              return false;
            }
            break;
            
          case 'custom':
            if (rule.custom && !rule.custom(record)) {
              return false;
            }
            break;
        }
      } catch (error) {
        importLogger.warn(`Filter failed for field ${rule.field}`, error);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate a record
   */
  private validateRecord(
    record: Record<string, any>,
    rowIndex: number,
    rules: ValidationRule[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    for (const rule of rules) {
      const value = record[rule.field];
      
      try {
        switch (rule.rule) {
          case 'required':
            if (value === undefined || value === null || value === '') {
              errors.push({
                row: rowIndex,
                field: rule.field,
                value,
                rule: 'required',
                message: rule.message || `Field "${rule.field}" is required`
              });
            }
            break;
            
          case 'number':
            if (value !== undefined && value !== null && value !== '' && isNaN(Number(value))) {
              errors.push({
                row: rowIndex,
                field: rule.field,
                value,
                rule: 'number',
                message: rule.message || `Field "${rule.field}" must be a number`
              });
            }
            break;
            
          case 'integer':
            if (value !== undefined && value !== null && value !== '' && (!Number.isInteger(Number(value)) || isNaN(Number(value)))) {
              errors.push({
                row: rowIndex,
                field: rule.field,
                value,
                rule: 'integer',
                message: rule.message || `Field "${rule.field}" must be an integer`
              });
            }
            break;
            
          case 'positive':
            if (value !== undefined && value !== null && value !== '' && (Number(value) <= 0 || isNaN(Number(value)))) {
              errors.push({
                row: rowIndex,
                field: rule.field,
                value,
                rule: 'positive',
                message: rule.message || `Field "${rule.field}" must be a positive number`
              });
            }
            break;
            
          case 'date':
            if (value !== undefined && value !== null && value !== '' && isNaN(Date.parse(value))) {
              errors.push({
                row: rowIndex,
                field: rule.field,
                value,
                rule: 'date',
                message: rule.message || `Field "${rule.field}" must be a valid date`
              });
            }
            break;
            
          case 'email':
            if (value !== undefined && value !== null && value !== '' && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
              errors.push({
                row: rowIndex,
                field: rule.field,
                value,
                rule: 'email',
                message: rule.message || `Field "${rule.field}" must be a valid email address`
              });
            }
            break;
            
          case 'regex':
            if (value !== undefined && value !== null && value !== '' && rule.pattern && !new RegExp(rule.pattern).test(value)) {
              errors.push({
                row: rowIndex,
                field: rule.field,
                value,
                rule: 'regex',
                message: rule.message || `Field "${rule.field}" does not match the required pattern`
              });
            }
            break;
            
          case 'custom':
            if (rule.validate && !rule.validate(value)) {
              errors.push({
                row: rowIndex,
                field: rule.field,
                value,
                rule: 'custom',
                message: rule.message || `Field "${rule.field}" failed custom validation`
              });
            }
            break;
        }
      } catch (error) {
        importLogger.warn(`Validation failed for field ${rule.field}`, error);
        
        errors.push({
          row: rowIndex,
          field: rule.field,
          value,
          rule: rule.rule,
          message: `Validation error: ${error.message}`
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Generate a column mapping template based on sample data
   */
  generateColumnMapping(
    input: string | Buffer,
    targetFields: string[],
    options: CSVParseOptions = {}
  ): Record<string, string> {
    try {
      // Parse the first row to get headers
      const parseOptions = {
        ...this.parseOptions,
        ...options,
        columns: true,
        fromLine: 1,
        toLine: 1
      };
      
      const records = parse(input, parseOptions);
      
      if (records.length === 0) {
        return {};
      }
      
      const sourceFields = Object.keys(records[0]);
      const mapping: Record<string, string> = {};
      
      // Simple mapping based on exact matches or similarities
      for (const targetField of targetFields) {
        // Check for exact match
        if (sourceFields.includes(targetField)) {
          mapping[targetField] = targetField;
          continue;
        }
        
        // Check for case-insensitive match
        const lowerCaseTarget = targetField.toLowerCase();
        const matchingField = sourceFields.find(sourceField => sourceField.toLowerCase() === lowerCaseTarget);
        
        if (matchingField) {
          mapping[targetField] = matchingField;
          continue;
        }
        
        // Check for field containing the target name
        const containsTarget = sourceFields.find(sourceField => 
          sourceField.toLowerCase().includes(lowerCaseTarget) || 
          lowerCaseTarget.includes(sourceField.toLowerCase())
        );
        
        if (containsTarget) {
          mapping[targetField] = containsTarget;
          continue;
        }
        
        // No match found
        mapping[targetField] = '';
      }
      
      return mapping;
    } catch (error) {
      importLogger.error('Failed to generate column mapping', error);
      throw error;
    }
  }
  
  /**
   * Export a CSV file from data
   */
  exportCSV(
    data: Record<string, any>[],
    options: {
      columns?: string[];
      header?: boolean;
      delimiter?: string;
    } = {}
  ): string {
    if (data.length === 0) {
      return '';
    }
    
    // Get columns
    const columns = options.columns || Object.keys(data[0]);
    const delimiter = options.delimiter || ',';
    const includeHeader = options.header !== false;
    
    // Create header row
    let csv = '';
    
    if (includeHeader) {
      csv = columns.map(this.escapeCSV).join(delimiter) + '\n';
    }
    
    // Create data rows
    for (const record of data) {
      const row = columns.map(column => {
        const value = record[column];
        
        if (value === undefined || value === null) {
          return '';
        } else if (typeof value === 'object') {
          return this.escapeCSV(JSON.stringify(value));
        } else {
          return this.escapeCSV(String(value));
        }
      });
      
      csv += row.join(delimiter) + '\n';
    }
    
    return csv;
  }
  
  /**
   * Escape a CSV field
   */
  private escapeCSV(field: string): string {
    if (field === null || field === undefined) {
      return '';
    }
    
    field = String(field);
    
    // If the field contains a comma, quote, or newline, enclose it in quotes
    if (/[",\r\n]/.test(field)) {
      // Replace any quotes with double quotes
      return `"${field.replace(/"/g, '""')}"`;
    }
    
    return field;
  }
}

// Export default instance
export const csvImporter = new CSVImporter();