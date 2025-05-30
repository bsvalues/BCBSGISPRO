/**
 * Sync Helper Functions for Property Data Synchronization
 */

import * as crypto from 'crypto';

/**
 * Calculate SHA-256 hash for a Buffer
 * @param data Buffer data to hash
 * @returns SHA-256 hash as hex string
 */
export function calculateSHA256(data: Buffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Validate XML structure
 * @param content XML content as string
 * @returns Object with validation result and any errors
 */
export function validateXML(content: string): { valid: boolean; errors: string[] } {
  // In a real implementation, this would perform actual XML validation
  // For demo purposes, we'll do a very simple check
  
  const errors: string[] = [];
  
  if (!content.includes('<?xml')) {
    errors.push('Missing XML declaration');
  }
  
  if (!content.includes('<PropertyData>')) {
    errors.push('Missing PropertyData root element');
  }
  
  if (!content.includes('<PropertyID>')) {
    errors.push('Missing PropertyID element');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check content for risk flags
 * @param content XML content as string
 * @returns Risk assessment with flag level and reasons
 */
export function assessRisks(content: string): { level: 'none' | 'low' | 'medium' | 'high'; reasons: string[] } {
  // In a real implementation, this would have complex risk assessment logic
  // For demo purposes, we'll perform a simple check
  
  const reasons: string[] = [];
  let level: 'none' | 'low' | 'medium' | 'high' = 'none';
  
  // Check for large value changes
  if (content.includes('LandValue') && parseInt(content.match(/<LandValue>(\d+)<\/LandValue>/)?.[1] || '0') > 1000000) {
    reasons.push('Unusually high land value');
    level = 'medium';
  }
  
  // Check for potentially suspicious attribute combinations
  if (content.includes('TaxExempt>true') && content.includes('AssessedValue')) {
    reasons.push('Tax exempt property with assessed value changes');
    level = 'low';
  }
  
  // Check for potential manipulation
  if (content.includes('<!--') && content.includes('MODIFIED')) {
    reasons.push('XML contains modification comments');
    level = 'high';
  }
  
  return {
    level,
    reasons
  };
}

/**
 * Format date for logging
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}