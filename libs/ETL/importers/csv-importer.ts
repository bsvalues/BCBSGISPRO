/**
 * CSV Importer
 * 
 * This module provides functionality for importing, validating, and transforming
 * CSV data for use in the TerraFusion platform. It supports various validation rules,
 * data transformations, and error handling capabilities.
 */

import { parse } from 'csv-parse/sync';
import { logger } from '../../../libs/DevOps/utils/logger';

// Create module-specific logger
const csvLogger = logger.withTags(['ETL', 'CSVImporter']);

/**
 * CSV parsing options
 */
export interface CSVParseOptions {
  delimiter?: string;
  columns?: boolean | string[] | ((record: string[], options?: any) => string[]);
  skip_empty_lines?: boolean;
  skip_lines_with_error?: boolean;
  from_line?: number;
  to_line?: number;
  ltrim?: boolean;
  rtrim?: boolean;
  trim?: boolean;
  cast?: boolean;
  cast_date?: boolean;
  comment?: string;
  relax_quotes?: boolean;
  bom?: boolean;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  field: string | number | ((record: Record<string, any>) => any);
  name: string;
  validate: (value: any, record: Record<string, any>) => boolean;
  message?: string | ((value: any, record: Record<string, any>) => string);
  level?: 'error' | 'warning';
}

/**
 * Transformation rule
 */
export interface TransformationRule {
  field: string | number | ((record: Record<string, any>) => any);
  name: string;
  transform: (value: any, record: Record<string, any>) => any;
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
  level: 'error' | 'warning';
}

/**
 * CSV import result
 */
export interface CSVImportResult<T> {
  // Parsed data
  data: T[];
  
  // Original raw data
  rawData: string[][];
  
  // Import metadata
  metadata: {
    rowCount: number;
    columnCount: number;
    headers: string[];
    startTime: Date;
    endTime: Date;
    duration: number;
  };
  
  // Validation results
  validationResults: {
    valid: boolean;
    errors: ValidationError[];
    warningCount: number;
    errorCount: number;
  };
}

/**
 * Filter criteria
 */
export interface FilterCriteria {
  field: string | number | ((record: Record<string, any>) => any);
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'matches' | 'is_empty' | 'is_not_empty' | 'custom';
  value?: any;
  custom?: (value: any, record: Record<string, any>) => boolean;
}

/**
 * CSV Importer class
 */
export class CSVImporter<T = Record<string, any>> {
  private validationRules: ValidationRule[] = [];
  private transformationRules: TransformationRule[] = [];
  private filterCriteria: FilterCriteria[] = [];
  private parseOptions: CSVParseOptions = {
    delimiter: ',',
    columns: true,
    skip_empty_lines: true,
    trim: true
  };
  
  /**
   * Constructor
   * @param options - CSV parsing options
   */
  constructor(options?: CSVParseOptions) {
    if (options) {
      this.parseOptions = { ...this.parseOptions, ...options };
    }
  }
  
  /**
   * Add a validation rule
   * @param rule - Validation rule
   */
  public addValidationRule(rule: ValidationRule): this {
    this.validationRules.push({
      level: 'error',
      ...rule
    });
    return this;
  }
  
  /**
   * Add multiple validation rules
   * @param rules - Array of validation rules
   */
  public addValidationRules(rules: ValidationRule[]): this {
    for (const rule of rules) {
      this.addValidationRule(rule);
    }
    return this;
  }
  
  /**
   * Add a transformation rule
   * @param rule - Transformation rule
   */
  public addTransformationRule(rule: TransformationRule): this {
    this.transformationRules.push(rule);
    return this;
  }
  
  /**
   * Add multiple transformation rules
   * @param rules - Array of transformation rules
   */
  public addTransformationRules(rules: TransformationRule[]): this {
    for (const rule of rules) {
      this.addTransformationRule(rule);
    }
    return this;
  }
  
  /**
   * Add a filter criterion
   * @param criterion - Filter criterion
   */
  public addFilterCriterion(criterion: FilterCriteria): this {
    this.filterCriteria.push(criterion);
    return this;
  }
  
  /**
   * Add multiple filter criteria
   * @param criteria - Array of filter criteria
   */
  public addFilterCriteria(criteria: FilterCriteria[]): this {
    for (const criterion of criteria) {
      this.addFilterCriterion(criterion);
    }
    return this;
  }
  
  /**
   * Import CSV data
   * @param csvContent - CSV content as string
   * @param options - Additional options
   */
  public import(
    csvContent: string,
    options?: {
      validateOnly?: boolean;
      stopOnFirstError?: boolean;
      ignoreEmptyRows?: boolean;
    }
  ): CSVImportResult<T> {
    const startTime = new Date();
    csvLogger.info('Starting CSV import', { contentLength: csvContent.length, rules: this.validationRules.length });
    
    try {
      // Parse the CSV
      const rawData = parse(csvContent, { ...this.parseOptions, columns: false });
      
      // Extract headers (first row unless columns option specifies otherwise)
      let headers: string[] = [];
      if (Array.isArray(rawData) && rawData.length > 0) {
        headers = rawData[0].map(String);
      }
      
      // Parse data with column headers
      const parseOptionsWithColumns = { 
        ...this.parseOptions, 
        columns: headers 
      };
      const parsedData = parse(csvContent, parseOptionsWithColumns) as Record<string, any>[];
      
      // Initialize result
      const result: CSVImportResult<T> = {
        data: [],
        rawData,
        metadata: {
          rowCount: parsedData.length,
          columnCount: headers.length,
          headers,
          startTime,
          endTime: new Date(),
          duration: 0
        },
        validationResults: {
          valid: true,
          errors: [],
          warningCount: 0,
          errorCount: 0
        }
      };
      
      // Validate and transform the data
      const transformedData = this.processData(parsedData, result, options);
      
      // Set the processed data
      result.data = transformedData as T[];
      
      // Update the result metadata
      const endTime = new Date();
      result.metadata.endTime = endTime;
      result.metadata.duration = endTime.getTime() - startTime.getTime();
      
      // Determine overall validity
      result.validationResults.valid = result.validationResults.errorCount === 0;
      
      csvLogger.info('CSV import completed', { 
        rowCount: result.metadata.rowCount,
        duration: result.metadata.duration,
        valid: result.validationResults.valid,
        errorCount: result.validationResults.errorCount,
        warningCount: result.validationResults.warningCount
      });
      
      return result;
    } catch (error) {
      csvLogger.error('CSV import failed', error);
      
      // Create an error result
      const endTime = new Date();
      const result: CSVImportResult<T> = {
        data: [],
        rawData: [],
        metadata: {
          rowCount: 0,
          columnCount: 0,
          headers: [],
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime()
        },
        validationResults: {
          valid: false,
          errors: [{
            row: 0,
            field: 'csv',
            value: null,
            rule: 'parse',
            message: `CSV parsing failed: ${error instanceof Error ? error.message : String(error)}`,
            level: 'error'
          }],
          warningCount: 0,
          errorCount: 1
        }
      };
      
      return result;
    }
  }
  
  /**
   * Process the data (validate, filter, transform)
   * @param data - Parsed data
   * @param result - Import result to update
   * @param options - Processing options
   */
  private processData(
    data: Record<string, any>[],
    result: CSVImportResult<T>,
    options?: {
      validateOnly?: boolean;
      stopOnFirstError?: boolean;
      ignoreEmptyRows?: boolean;
    }
  ): Record<string, any>[] {
    const processedData: Record<string, any>[] = [];
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const rowIndex = i + 1; // +1 to account for header row in the raw data
      
      // Skip empty rows if specified
      if (options?.ignoreEmptyRows && this.isEmptyRow(record)) {
        continue;
      }
      
      // Validate the record
      const validationErrors = this.validateRecord(record, rowIndex);
      
      // Add errors to the result
      if (validationErrors.length > 0) {
        result.validationResults.errors.push(...validationErrors);
        
        // Update error/warning counts
        for (const error of validationErrors) {
          if (error.level === 'error') {
            result.validationResults.errorCount++;
          } else {
            result.validationResults.warningCount++;
          }
        }
        
        // Stop processing if requested and we have errors (not warnings)
        if (options?.stopOnFirstError && validationErrors.some(e => e.level === 'error')) {
          break;
        }
      }
      
      // Skip transformation if validation only
      if (options?.validateOnly) {
        processedData.push(record);
        continue;
      }
      
      // Skip transformation if the record has errors
      if (validationErrors.some(e => e.level === 'error')) {
        continue;
      }
      
      // Filter the record
      if (!this.filterRecord(record)) {
        continue;
      }
      
      // Transform the record
      const transformedRecord = this.transformRecord(record);
      
      // Add to processed data
      processedData.push(transformedRecord);
    }
    
    return processedData;
  }
  
  /**
   * Validate a record against all rules
   * @param record - Record to validate
   * @param rowIndex - Row index in the original data
   */
  private validateRecord(record: Record<string, any>, rowIndex: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Apply each validation rule
    for (const rule of this.validationRules) {
      // Get the field value
      const fieldValue = this.getFieldValue(record, rule.field);
      
      // Validate the field
      const isValid = rule.validate(fieldValue, record);
      
      // Add error if validation failed
      if (!isValid) {
        const message = typeof rule.message === 'function'
          ? rule.message(fieldValue, record)
          : rule.message || `Field '${rule.field}' failed validation rule '${rule.name}'`;
        
        const field = typeof rule.field === 'function'
          ? 'computed_field'
          : String(rule.field);
        
        errors.push({
          row: rowIndex,
          field,
          value: fieldValue,
          rule: rule.name,
          message,
          level: rule.level || 'error'
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Transform a record using all transformation rules
   * @param record - Record to transform
   */
  private transformRecord(record: Record<string, any>): Record<string, any> {
    let transformed = { ...record };
    
    // Apply each transformation rule
    for (const rule of this.transformationRules) {
      // Get the field value
      const fieldValue = this.getFieldValue(transformed, rule.field);
      
      // Transform the field
      const transformedValue = rule.transform(fieldValue, transformed);
      
      // Update the field in the record
      if (typeof rule.field === 'string' || typeof rule.field === 'number') {
        transformed[rule.field] = transformedValue;
      } else {
        // For function fields, we can't update directly, so log a warning
        csvLogger.warn('Cannot update computed field directly', { ruleName: rule.name });
      }
    }
    
    return transformed;
  }
  
  /**
   * Filter a record using all filter criteria
   * @param record - Record to filter
   * @returns True if the record should be included, false if it should be filtered out
   */
  private filterRecord(record: Record<string, any>): boolean {
    // If no filters, include all records
    if (this.filterCriteria.length === 0) {
      return true;
    }
    
    // By default, we use AND logic for filters (all must pass)
    for (const criterion of this.filterCriteria) {
      const fieldValue = this.getFieldValue(record, criterion.field);
      
      if (!this.evaluateFilter(fieldValue, criterion, record)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Evaluate a single filter criterion
   * @param value - Field value
   * @param criterion - Filter criterion
   * @param record - The complete record
   * @returns True if the criterion is satisfied, false otherwise
   */
  private evaluateFilter(value: any, criterion: FilterCriteria, record: Record<string, any>): boolean {
    switch (criterion.operator) {
      case 'equals':
        return value === criterion.value;
      
      case 'not_equals':
        return value !== criterion.value;
      
      case 'contains':
        return String(value).includes(String(criterion.value));
      
      case 'not_contains':
        return !String(value).includes(String(criterion.value));
      
      case 'greater_than':
        return value > criterion.value;
      
      case 'less_than':
        return value < criterion.value;
      
      case 'in':
        return Array.isArray(criterion.value) && criterion.value.includes(value);
      
      case 'not_in':
        return Array.isArray(criterion.value) && !criterion.value.includes(value);
      
      case 'matches':
        return criterion.value instanceof RegExp && criterion.value.test(String(value));
      
      case 'is_empty':
        return value === null || value === undefined || value === '';
      
      case 'is_not_empty':
        return value !== null && value !== undefined && value !== '';
      
      case 'custom':
        return criterion.custom ? criterion.custom(value, record) : true;
      
      default:
        return true;
    }
  }
  
  /**
   * Get the value of a field from a record
   * @param record - Record to get field from
   * @param field - Field name, index, or function to get value
   */
  private getFieldValue(record: Record<string, any>, field: string | number | ((record: Record<string, any>) => any)): any {
    if (typeof field === 'function') {
      return field(record);
    }
    
    return record[field];
  }
  
  /**
   * Check if a row is empty (all values are empty)
   * @param record - Record to check
   */
  private isEmptyRow(record: Record<string, any>): boolean {
    for (const key in record) {
      const value = record[key];
      if (value !== null && value !== undefined && value !== '') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Create common validation rules for address data
   */
  public static createAddressValidationRules(): ValidationRule[] {
    return [
      {
        field: 'street',
        name: 'required_street',
        validate: value => !!value,
        message: 'Street address is required',
        level: 'error'
      },
      {
        field: 'city',
        name: 'required_city',
        validate: value => !!value,
        message: 'City is required',
        level: 'error'
      },
      {
        field: 'state',
        name: 'valid_state',
        validate: value => {
          if (!value) return false;
          const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
          return states.includes(String(value).toUpperCase());
        },
        message: 'State must be a valid US state code',
        level: 'error'
      },
      {
        field: 'zip',
        name: 'valid_zip',
        validate: value => {
          if (!value) return false;
          return /^\d{5}(-\d{4})?$/.test(String(value));
        },
        message: 'ZIP code must be in the format 12345 or 12345-6789',
        level: 'error'
      }
    ];
  }
  
  /**
   * Create common validation rules for parcel data
   */
  public static createParcelValidationRules(): ValidationRule[] {
    return [
      {
        field: 'parcel_id',
        name: 'required_parcel_id',
        validate: value => !!value,
        message: 'Parcel ID is required',
        level: 'error'
      },
      {
        field: 'acreage',
        name: 'valid_acreage',
        validate: value => {
          if (value === null || value === undefined || value === '') return true;
          const num = parseFloat(String(value));
          return !isNaN(num) && num >= 0;
        },
        message: 'Acreage must be a positive number',
        level: 'warning'
      },
      {
        field: 'zoning',
        name: 'valid_zoning',
        validate: value => {
          if (!value) return true;
          return typeof value === 'string' && value.length <= 20;
        },
        message: 'Zoning code should be 20 characters or less',
        level: 'warning'
      }
    ];
  }
  
  /**
   * Create common transformation rules for address data
   */
  public static createAddressTransformationRules(): TransformationRule[] {
    return [
      {
        field: 'street',
        name: 'normalize_street',
        transform: value => {
          if (!value) return value;
          return String(value).trim()
            .replace(/\s+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        }
      },
      {
        field: 'city',
        name: 'normalize_city',
        transform: value => {
          if (!value) return value;
          return String(value).trim()
            .replace(/\s+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        }
      },
      {
        field: 'state',
        name: 'normalize_state',
        transform: value => {
          if (!value) return value;
          return String(value).trim().toUpperCase();
        }
      },
      {
        field: 'zip',
        name: 'normalize_zip',
        transform: value => {
          if (!value) return value;
          const zip = String(value).replace(/[^\d-]/g, '');
          if (/^\d{5}$/.test(zip)) return zip;
          if (/^\d{5}-\d{4}$/.test(zip)) return zip;
          if (/^\d{9}$/.test(zip)) return `${zip.substring(0, 5)}-${zip.substring(5)}`;
          return zip;
        }
      }
    ];
  }
  
  /**
   * Create common transformation rules for parcel data
   */
  public static createParcelTransformationRules(): TransformationRule[] {
    return [
      {
        field: 'parcel_id',
        name: 'normalize_parcel_id',
        transform: value => {
          if (!value) return value;
          return String(value).trim().toUpperCase();
        }
      },
      {
        field: 'acreage',
        name: 'normalize_acreage',
        transform: value => {
          if (value === null || value === undefined || value === '') return null;
          const num = parseFloat(String(value));
          return isNaN(num) ? null : num;
        }
      },
      {
        field: 'zoning',
        name: 'normalize_zoning',
        transform: value => {
          if (!value) return null;
          return String(value).trim().toUpperCase();
        }
      },
      {
        field: 'owner_name',
        name: 'normalize_owner_name',
        transform: value => {
          if (!value) return null;
          return String(value).trim()
            .replace(/\s+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        }
      }
    ];
  }
}