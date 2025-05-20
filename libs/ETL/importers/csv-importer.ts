/**
 * CSV Importer
 * 
 * This module provides functionality for importing CSV data into the TerraFusion platform.
 * It includes features for validation, transformation, and field mapping.
 */

import { parse } from 'csv-parse/sync';
import { logger } from '../../DevOps/utils/logger';

// Create module-specific logger
const csvLogger = logger.withTags(['ETL', 'CSVImporter']);

/**
 * CSV import options
 */
export interface CSVImportOptions {
  // File or data options
  delimiter?: string;
  headers?: boolean | string[];
  skipEmptyLines?: boolean;
  skipComments?: boolean;
  commentChar?: string;
  quoteChar?: string;
  escapeChar?: string;
  encoding?: string;
  
  // Processing options
  trimFields?: boolean;
  ltrim?: boolean; 
  rtrim?: boolean;
  castValues?: boolean;
  
  // Validation options
  validateFields?: boolean;
  validationRules?: ValidationRule[];
  
  // Transformation options
  transformFields?: boolean;
  transformationRules?: TransformationRule[];
  
  // Filtering options
  filterRows?: boolean;
  filterRules?: FilterRule[];
  
  // Batch processing
  batchSize?: number;
  
  // Error handling
  continueOnError?: boolean;
  maxErrors?: number;
}

/**
 * CSV import result
 */
export interface CSVImportResult<T = any> {
  // Total records processed
  totalRecords: number;
  
  // Successfully processed records
  successRecords: number;
  
  // Failed records
  failedRecords: number;
  
  // Skipped records
  skippedRecords: number;
  
  // Imported data
  data: T[];
  
  // Error records with their reasons
  errors: {
    record: Record<string, any>;
    row: number;
    reason: string;
  }[];
  
  // Import timing information
  timing: {
    parseTime: number;
    validationTime: number;
    transformationTime: number;
    filteringTime: number;
    totalTime: number;
  };
  
  // Field statistics
  fieldStats: Record<string, {
    nullCount: number;
    emptyCount: number;
    uniqueValues: number;
    minValue?: any;
    maxValue?: any;
    avgLength?: number;
  }>;
}

/**
 * Field validation rule types
 */
export enum ValidationRuleType {
  REQUIRED = 'required',
  PATTERN = 'pattern',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  MIN_VALUE = 'minValue',
  MAX_VALUE = 'maxValue',
  UNIQUE = 'unique',
  ENUM = 'enum',
  CUSTOM = 'custom'
}

/**
 * Field validation rule
 */
export interface ValidationRule {
  // Field to validate
  field: string;
  
  // Rule type
  type: ValidationRuleType;
  
  // Rule parameters
  params?: any;
  
  // Error message
  message?: string;
  
  // Custom validation function
  validate?: (value: any, record: Record<string, any>, index: number) => boolean | string;
}

/**
 * Field transformation rule types
 */
export enum TransformationRuleType {
  TRIM = 'trim',
  UPPERCASE = 'uppercase',
  LOWERCASE = 'lowercase',
  REPLACE = 'replace',
  CAST = 'cast',
  FORMAT = 'format',
  CUSTOM = 'custom'
}

/**
 * Field transformation rule
 */
export interface TransformationRule {
  // Field to transform
  field: string;
  
  // Rule type
  type: TransformationRuleType;
  
  // Rule parameters
  params?: any;
  
  // Custom transformation function
  transform?: (value: any, record: Record<string, any>, index: number) => any;
}

/**
 * Filter rule types
 */
export enum FilterRuleType {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  REGEX = 'regex',
  CUSTOM = 'custom'
}

/**
 * Filter rule
 */
export interface FilterRule {
  // Field to filter
  field: string;
  
  // Rule type
  type: FilterRuleType;
  
  // Rule parameters
  params?: any;
  
  // Custom filter function
  filter?: (value: any, record: Record<string, any>, index: number) => boolean;
}

/**
 * CSV Importer class
 */
export class CSVImporter {
  // Default import options
  private defaultOptions: CSVImportOptions = {
    delimiter: ',',
    headers: true,
    skipEmptyLines: true,
    skipComments: true,
    commentChar: '#',
    quoteChar: '"',
    escapeChar: '"',
    trimFields: true,
    ltrim: false,
    rtrim: false,
    castValues: true,
    validateFields: true,
    transformFields: true,
    filterRows: true,
    continueOnError: true,
    maxErrors: 100,
    batchSize: 1000
  };
  
  // Set of processed unique values for validation
  private uniqueValues: Record<string, Set<any>> = {};
  
  /**
   * Import CSV data
   */
  async importCSV<T = any>(
    input: string | Buffer,
    options: CSVImportOptions = {}
  ): Promise<CSVImportResult<T>> {
    // Start timing
    const startTime = Date.now();
    
    // Merge options with defaults
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Initialize result object
    const result: CSVImportResult<T> = {
      totalRecords: 0,
      successRecords: 0,
      failedRecords: 0,
      skippedRecords: 0,
      data: [],
      errors: [],
      timing: {
        parseTime: 0,
        validationTime: 0,
        transformationTime: 0,
        filteringTime: 0,
        totalTime: 0
      },
      fieldStats: {}
    };
    
    try {
      // Parse the CSV data
      csvLogger.info('Starting CSV import');
      const parseStart = Date.now();
      
      // Parse options
      const parseOptions = {
        delimiter: mergedOptions.delimiter,
        columns: mergedOptions.headers,
        skip_empty_lines: mergedOptions.skipEmptyLines,
        skip_records_with_empty_values: false,
        comment: mergedOptions.skipComments ? mergedOptions.commentChar : undefined,
        quote: mergedOptions.quoteChar,
        escape: mergedOptions.escapeChar,
        trim: mergedOptions.trimFields,
        ltrim: mergedOptions.ltrim,
        rtrim: mergedOptions.rtrim,
        cast: mergedOptions.castValues
      };
      
      const records = parse(input, parseOptions) as Record<string, any>[];
      const parseEnd = Date.now();
      result.timing.parseTime = parseEnd - parseStart;
      result.totalRecords = records.length;
      
      csvLogger.info(`Parsed ${records.length} records from CSV`, { parseTime: result.timing.parseTime });
      
      // Process records in batches if necessary
      const batchSize = mergedOptions.batchSize || records.length;
      
      // Prepare for batch processing
      let batch = [];
      let processedRecords = 0;
      
      // Initialize field statistics
      if (records.length > 0 && Object.keys(records[0]).length > 0) {
        Object.keys(records[0]).forEach(field => {
          result.fieldStats[field] = {
            nullCount: 0,
            emptyCount: 0,
            uniqueValues: 0,
            minValue: undefined,
            maxValue: undefined,
            avgLength: 0
          };
          
          // Initialize unique value sets for validation
          this.uniqueValues[field] = new Set();
        });
      }
      
      // Process all records
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        batch.push(record);
        
        // Process batch if it reaches the batch size or is the last record
        if (batch.length >= batchSize || i === records.length - 1) {
          // Process the current batch
          const batchResult = await this.processBatch(
            batch,
            processedRecords,
            mergedOptions.validationRules || [],
            mergedOptions.transformationRules || [],
            mergedOptions.filterRules || [],
            mergedOptions.validateFields || false,
            mergedOptions.transformFields || false,
            mergedOptions.filterRows || false,
            mergedOptions.continueOnError || false,
            mergedOptions.maxErrors || 100
          );
          
          // Update result with batch result
          result.successRecords += batchResult.successRecords;
          result.failedRecords += batchResult.failedRecords;
          result.skippedRecords += batchResult.skippedRecords;
          result.data = [...result.data, ...batchResult.data];
          result.errors = [...result.errors, ...batchResult.errors];
          result.timing.validationTime += batchResult.timing.validationTime;
          result.timing.transformationTime += batchResult.timing.transformationTime;
          result.timing.filteringTime += batchResult.timing.filteringTime;
          
          // Update field statistics
          this.updateFieldStats(batch, result.fieldStats);
          
          // Reset batch and update processed records count
          processedRecords += batch.length;
          batch = [];
          
          csvLogger.debug(`Processed batch of ${batchSize} records (${processedRecords}/${records.length})`);
        }
      }
      
      // Calculate total time
      const endTime = Date.now();
      result.timing.totalTime = endTime - startTime;
      
      // Update unique values counts in field stats
      Object.keys(this.uniqueValues).forEach(field => {
        result.fieldStats[field].uniqueValues = this.uniqueValues[field].size;
      });
      
      // Log completion
      csvLogger.info(`CSV import completed: ${result.successRecords} succeeded, ${result.failedRecords} failed, ${result.skippedRecords} skipped`, {
        totalTime: result.timing.totalTime
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      csvLogger.error(`CSV import failed: ${errorMessage}`, error);
      
      // Calculate total time
      const endTime = Date.now();
      result.timing.totalTime = endTime - startTime;
      
      throw new Error(`CSV import failed: ${errorMessage}`);
    } finally {
      // Clear unique values
      this.uniqueValues = {};
    }
  }
  
  /**
   * Process a batch of records
   */
  private async processBatch<T = any>(
    batch: Record<string, any>[],
    startIndex: number,
    validationRules: ValidationRule[],
    transformationRules: TransformationRule[],
    filterRules: FilterRule[],
    validateFields: boolean,
    transformFields: boolean,
    filterRows: boolean,
    continueOnError: boolean,
    maxErrors: number
  ): Promise<{
    successRecords: number;
    failedRecords: number;
    skippedRecords: number;
    data: T[];
    errors: { record: Record<string, any>; row: number; reason: string }[];
    timing: {
      validationTime: number;
      transformationTime: number;
      filteringTime: number;
    };
  }> {
    // Initialize result
    const result = {
      successRecords: 0,
      failedRecords: 0,
      skippedRecords: 0,
      data: [] as T[],
      errors: [] as { record: Record<string, any>; row: number; reason: string }[],
      timing: {
        validationTime: 0,
        transformationTime: 0,
        filteringTime: 0
      }
    };
    
    // Validate records
    let validatedRecords = batch;
    if (validateFields) {
      const validationStart = Date.now();
      const validationResult = this.validateRecords(batch, startIndex, validationRules, continueOnError, maxErrors);
      result.timing.validationTime = Date.now() - validationStart;
      
      validatedRecords = validationResult.validRecords;
      result.errors = [...result.errors, ...validationResult.errors];
      result.failedRecords += validationResult.errors.length;
    }
    
    // Transform records
    let transformedRecords = validatedRecords;
    if (transformFields) {
      const transformationStart = Date.now();
      transformedRecords = this.transformRecords(validatedRecords, transformationRules);
      result.timing.transformationTime = Date.now() - transformationStart;
    }
    
    // Filter records
    let filteredRecords = transformedRecords;
    if (filterRows) {
      const filteringStart = Date.now();
      const filteringResult = this.filterRecords(transformedRecords, startIndex, filterRules);
      result.timing.filteringTime = Date.now() - filteringStart;
      
      filteredRecords = filteringResult.filteredRecords;
      result.skippedRecords += filteringResult.skippedCount;
    }
    
    // Update success records count
    result.successRecords = filteredRecords.length;
    
    // Add filtered records to result data
    result.data = filteredRecords as T[];
    
    return result;
  }
  
  /**
   * Validate records against validation rules
   */
  private validateRecords(
    records: Record<string, any>[],
    startIndex: number,
    validationRules: ValidationRule[],
    continueOnError: boolean,
    maxErrors: number
  ): {
    validRecords: Record<string, any>[];
    errors: { record: Record<string, any>; row: number; reason: string }[];
  } {
    // Initialize result
    const result = {
      validRecords: [] as Record<string, any>[],
      errors: [] as { record: Record<string, any>; row: number; reason: string }[]
    };
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordIndex = startIndex + i;
      let isValid = true;
      let errorReasons: string[] = [];
      
      // Check each validation rule
      for (const rule of validationRules) {
        const field = rule.field;
        const value = record[field];
        
        // Skip validation if field is not in record
        if (!(field in record)) {
          continue;
        }
        
        // Validate based on rule type
        switch (rule.type) {
          case ValidationRuleType.REQUIRED:
            if (value === null || value === undefined || value === '') {
              isValid = false;
              errorReasons.push(rule.message || `Field '${field}' is required`);
            }
            break;
            
          case ValidationRuleType.PATTERN:
            if (value !== null && value !== undefined && value !== '') {
              const pattern = rule.params as RegExp | string;
              const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
              
              if (!regex.test(String(value))) {
                isValid = false;
                errorReasons.push(rule.message || `Field '${field}' does not match pattern ${regex}`);
              }
            }
            break;
            
          case ValidationRuleType.MIN_LENGTH:
            if (value !== null && value !== undefined && value !== '') {
              const minLength = rule.params as number;
              
              if (String(value).length < minLength) {
                isValid = false;
                errorReasons.push(rule.message || `Field '${field}' must be at least ${minLength} characters`);
              }
            }
            break;
            
          case ValidationRuleType.MAX_LENGTH:
            if (value !== null && value !== undefined && value !== '') {
              const maxLength = rule.params as number;
              
              if (String(value).length > maxLength) {
                isValid = false;
                errorReasons.push(rule.message || `Field '${field}' must be at most ${maxLength} characters`);
              }
            }
            break;
            
          case ValidationRuleType.MIN_VALUE:
            if (value !== null && value !== undefined && value !== '') {
              const minValue = rule.params as number;
              
              if (Number(value) < minValue) {
                isValid = false;
                errorReasons.push(rule.message || `Field '${field}' must be at least ${minValue}`);
              }
            }
            break;
            
          case ValidationRuleType.MAX_VALUE:
            if (value !== null && value !== undefined && value !== '') {
              const maxValue = rule.params as number;
              
              if (Number(value) > maxValue) {
                isValid = false;
                errorReasons.push(rule.message || `Field '${field}' must be at most ${maxValue}`);
              }
            }
            break;
            
          case ValidationRuleType.UNIQUE:
            if (value !== null && value !== undefined && value !== '') {
              if (this.uniqueValues[field].has(value)) {
                isValid = false;
                errorReasons.push(rule.message || `Field '${field}' must be unique`);
              } else {
                this.uniqueValues[field].add(value);
              }
            }
            break;
            
          case ValidationRuleType.ENUM:
            if (value !== null && value !== undefined && value !== '') {
              const allowedValues = rule.params as any[];
              
              if (!allowedValues.includes(value)) {
                isValid = false;
                errorReasons.push(rule.message || `Field '${field}' must be one of: ${allowedValues.join(', ')}`);
              }
            }
            break;
            
          case ValidationRuleType.CUSTOM:
            if (rule.validate) {
              const customResult = rule.validate(value, record, recordIndex);
              
              if (customResult !== true) {
                isValid = false;
                errorReasons.push(rule.message || (typeof customResult === 'string' ? customResult : `Field '${field}' failed custom validation`));
              }
            }
            break;
        }
        
        // Stop checking other rules for this field if validation failed and not continuing on error
        if (!isValid && !continueOnError) {
          break;
        }
      }
      
      // Add record to result
      if (isValid) {
        result.validRecords.push(record);
      } else {
        result.errors.push({
          record,
          row: recordIndex + 1, // +1 for header row
          reason: errorReasons.join('; ')
        });
        
        // Stop processing if max errors reached
        if (result.errors.length >= maxErrors) {
          break;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Transform records using transformation rules
   */
  private transformRecords(
    records: Record<string, any>[],
    transformationRules: TransformationRule[]
  ): Record<string, any>[] {
    // Process each record
    return records.map(record => {
      const transformedRecord = { ...record };
      
      // Apply each transformation rule
      for (const rule of transformationRules) {
        const field = rule.field;
        
        // Skip transformation if field is not in record
        if (!(field in transformedRecord)) {
          continue;
        }
        
        let value = transformedRecord[field];
        
        // Skip null or undefined values
        if (value === null || value === undefined) {
          continue;
        }
        
        // Transform based on rule type
        switch (rule.type) {
          case TransformationRuleType.TRIM:
            if (typeof value === 'string') {
              value = value.trim();
            }
            break;
            
          case TransformationRuleType.UPPERCASE:
            if (typeof value === 'string') {
              value = value.toUpperCase();
            }
            break;
            
          case TransformationRuleType.LOWERCASE:
            if (typeof value === 'string') {
              value = value.toLowerCase();
            }
            break;
            
          case TransformationRuleType.REPLACE:
            if (typeof value === 'string') {
              const { search, replacement } = rule.params as { search: string | RegExp; replacement: string };
              value = value.replace(search, replacement);
            }
            break;
            
          case TransformationRuleType.CAST:
            const targetType = rule.params as string;
            
            switch (targetType) {
              case 'string':
                value = String(value);
                break;
              case 'number':
                value = Number(value);
                break;
              case 'boolean':
                value = Boolean(value);
                break;
              case 'date':
                value = new Date(value);
                break;
            }
            break;
            
          case TransformationRuleType.FORMAT:
            const format = rule.params as string;
            
            // Basic formatting, in a real implementation this would use a library
            if (format === 'date' && value instanceof Date) {
              value = value.toISOString();
            } else if (format === 'number' && typeof value === 'number') {
              value = value.toFixed(2);
            }
            break;
            
          case TransformationRuleType.CUSTOM:
            if (rule.transform) {
              value = rule.transform(value, record, 0); // Index is not used here
            }
            break;
        }
        
        // Update transformed record
        transformedRecord[field] = value;
      }
      
      return transformedRecord;
    });
  }
  
  /**
   * Filter records using filter rules
   */
  private filterRecords(
    records: Record<string, any>[],
    startIndex: number,
    filterRules: FilterRule[]
  ): {
    filteredRecords: Record<string, any>[];
    skippedCount: number;
  } {
    // Initialize result
    const result = {
      filteredRecords: [] as Record<string, any>[],
      skippedCount: 0
    };
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordIndex = startIndex + i;
      let includeRecord = true;
      
      // Check each filter rule
      for (const rule of filterRules) {
        const field = rule.field;
        const value = record[field];
        
        // Skip filter if field is not in record
        if (!(field in record)) {
          continue;
        }
        
        // Filter based on rule type
        switch (rule.type) {
          case FilterRuleType.EQUALS:
            includeRecord = value === rule.params;
            break;
            
          case FilterRuleType.NOT_EQUALS:
            includeRecord = value !== rule.params;
            break;
            
          case FilterRuleType.CONTAINS:
            if (typeof value === 'string') {
              includeRecord = value.includes(rule.params as string);
            } else {
              includeRecord = false;
            }
            break;
            
          case FilterRuleType.NOT_CONTAINS:
            if (typeof value === 'string') {
              includeRecord = !value.includes(rule.params as string);
            } else {
              includeRecord = true;
            }
            break;
            
          case FilterRuleType.STARTS_WITH:
            if (typeof value === 'string') {
              includeRecord = value.startsWith(rule.params as string);
            } else {
              includeRecord = false;
            }
            break;
            
          case FilterRuleType.ENDS_WITH:
            if (typeof value === 'string') {
              includeRecord = value.endsWith(rule.params as string);
            } else {
              includeRecord = false;
            }
            break;
            
          case FilterRuleType.GREATER_THAN:
            includeRecord = Number(value) > (rule.params as number);
            break;
            
          case FilterRuleType.LESS_THAN:
            includeRecord = Number(value) < (rule.params as number);
            break;
            
          case FilterRuleType.REGEX:
            if (typeof value === 'string') {
              const pattern = rule.params as RegExp | string;
              const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
              
              includeRecord = regex.test(value);
            } else {
              includeRecord = false;
            }
            break;
            
          case FilterRuleType.CUSTOM:
            if (rule.filter) {
              includeRecord = rule.filter(value, record, recordIndex);
            }
            break;
        }
        
        // Stop checking other rules if this one excludes the record
        if (!includeRecord) {
          break;
        }
      }
      
      // Add record to result if it passed all filters
      if (includeRecord) {
        result.filteredRecords.push(record);
      } else {
        result.skippedCount++;
      }
    }
    
    return result;
  }
  
  /**
   * Update field statistics with batch data
   */
  private updateFieldStats(
    batch: Record<string, any>[],
    fieldStats: Record<string, {
      nullCount: number;
      emptyCount: number;
      uniqueValues: number;
      minValue?: any;
      maxValue?: any;
      avgLength?: number;
    }>
  ): void {
    if (batch.length === 0) {
      return;
    }
    
    // Get all fields from the first record
    const fields = Object.keys(batch[0]);
    
    // Calculate statistics for each field
    fields.forEach(field => {
      // Initialize stats if not exists
      if (!fieldStats[field]) {
        fieldStats[field] = {
          nullCount: 0,
          emptyCount: 0,
          uniqueValues: 0,
          minValue: undefined,
          maxValue: undefined,
          avgLength: 0
        };
      }
      
      // Initialize values for this batch
      let nullCount = 0;
      let emptyCount = 0;
      let totalLength = 0;
      let minValue: any = undefined;
      let maxValue: any = undefined;
      
      // Process each record
      batch.forEach(record => {
        const value = record[field];
        
        // Count null/undefined values
        if (value === null || value === undefined) {
          nullCount++;
          return;
        }
        
        // Count empty string values
        if (value === '') {
          emptyCount++;
          return;
        }
        
        // Add to unique values set
        if (!this.uniqueValues[field]) {
          this.uniqueValues[field] = new Set();
        }
        this.uniqueValues[field].add(value);
        
        // Update min/max values for numbers
        if (typeof value === 'number') {
          if (minValue === undefined || value < minValue) {
            minValue = value;
          }
          
          if (maxValue === undefined || value > maxValue) {
            maxValue = value;
          }
        }
        
        // Update length for strings
        if (typeof value === 'string') {
          totalLength += value.length;
        }
      });
      
      // Update field statistics
      fieldStats[field].nullCount += nullCount;
      fieldStats[field].emptyCount += emptyCount;
      
      // Update min/max values if defined
      if (minValue !== undefined) {
        if (fieldStats[field].minValue === undefined || minValue < fieldStats[field].minValue) {
          fieldStats[field].minValue = minValue;
        }
      }
      
      if (maxValue !== undefined) {
        if (fieldStats[field].maxValue === undefined || maxValue > fieldStats[field].maxValue) {
          fieldStats[field].maxValue = maxValue;
        }
      }
      
      // Update average length
      const stringValueCount = batch.length - nullCount - emptyCount;
      if (stringValueCount > 0) {
        fieldStats[field].avgLength = totalLength / stringValueCount;
      }
    });
  }
}