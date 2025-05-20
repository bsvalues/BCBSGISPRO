/**
 * Logger utility for ETL operations
 */

import { logger as baseLogger } from '../../DevOps/utils/logger';

/**
 * ETL module logger with predefined tags
 */
export const logger = baseLogger.withTags(['ETL']);

/**
 * Create a logger for a specific ETL operation
 * 
 * @param operation - The ETL operation type
 * @returns Logger with operation-specific tags
 */
export function createOperationLogger(operation: string) {
  return baseLogger.withTags(['ETL', operation]);
}

/**
 * Create a logger for county-specific ETL operations
 * 
 * @param countyName - The name of the county
 * @param operation - Optional operation type
 * @returns Logger with county-specific tags
 */
export function createCountyLogger(countyName: string, operation?: string) {
  const tags = ['ETL', 'County', countyName];
  
  if (operation) {
    tags.push(operation);
  }
  
  return baseLogger.withTags(tags);
}

/**
 * Log ETL performance metrics
 * 
 * @param operation - The operation being performed
 * @param startTime - Start time in milliseconds
 * @param metadata - Additional metadata to log
 */
export function logPerformance(
  operation: string,
  startTime: number,
  metadata: Record<string, any> = {}
) {
  const duration = Date.now() - startTime;
  const performanceLogger = baseLogger.withTags(['ETL', 'Performance']);
  
  performanceLogger.info(
    `Completed ${operation} in ${duration}ms`,
    { metadata: { duration, operation, ...metadata } }
  );
}

/**
 * Log data quality issues
 * 
 * @param source - Data source identifier
 * @param issues - Array of data quality issues
 */
export function logDataQualityIssues(
  source: string,
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    field?: string;
    recordId?: string;
  }>
) {
  const qualityLogger = baseLogger.withTags(['ETL', 'DataQuality']);
  
  // Group issues by severity
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;
  
  qualityLogger.info(
    `Data quality report for ${source}: ${errorCount} errors, ${warningCount} warnings, ${infoCount} info items`,
    { metadata: { source, errorCount, warningCount, infoCount } }
  );
  
  // Log individual issues based on severity
  issues.forEach(issue => {
    const metadata = {
      source,
      field: issue.field,
      recordId: issue.recordId
    };
    
    if (issue.severity === 'error') {
      qualityLogger.error(issue.message, undefined, { metadata });
    } else if (issue.severity === 'warning') {
      qualityLogger.warn(issue.message, { metadata });
    } else {
      qualityLogger.info(issue.message, { metadata });
    }
  });
}