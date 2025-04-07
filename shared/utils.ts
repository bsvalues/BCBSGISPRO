/**
 * Shared utility functions for date formatting, text manipulation, and other common operations
 * Used across both client and server
 */

/**
 * Date formatting utilities
 */
export const dateUtils = {
  /**
   * Format a date to a human-readable string
   * @param date Date to format
   * @param format Format to use (short, medium, long, or full)
   * @returns Formatted date string
   */
  formatDate: (date: Date | string | number | null | undefined, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'object' ? date : new Date(date);
    
    try {
      switch (format) {
        case 'short':
          return dateObj.toLocaleDateString();
        case 'medium':
          return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        case 'long':
          return dateObj.toLocaleString(undefined, {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        case 'full':
          return dateObj.toLocaleString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        default:
          return dateObj.toLocaleString();
      }
    } catch (e) {
      console.error('Error formatting date:', e);
      return String(date);
    }
  },
  
  /**
   * Format a date relative to now (e.g., "5 minutes ago", "2 days ago")
   * @param date Date to format
   * @returns Relative time string
   */
  formatRelativeTime: (date: Date | string | number | null | undefined): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'object' ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    if (diffSec < 60) {
      return diffSec <= 5 ? 'just now' : `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    } else if (diffHr < 24) {
      return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
    } else {
      return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
    }
  },
  
  /**
   * Check if a date is today
   * @param date Date to check
   * @returns Whether the date is today
   */
  isToday: (date: Date | string | number | null | undefined): boolean => {
    if (!date) return false;
    
    const dateObj = typeof date === 'object' ? date : new Date(date);
    const today = new Date();
    
    return dateObj.getDate() === today.getDate() && 
      dateObj.getMonth() === today.getMonth() && 
      dateObj.getFullYear() === today.getFullYear();
  },
  
  /**
   * Calculate the difference between two dates in days
   * @param date1 First date
   * @param date2 Second date (defaults to now)
   * @returns Number of days between the dates
   */
  daysBetween: (date1: Date | string | number, date2: Date | string | number = new Date()): number => {
    const d1 = typeof date1 === 'object' ? date1 : new Date(date1);
    const d2 = typeof date2 === 'object' ? date2 : new Date(date2);
    
    // Clear time component for accurate day calculation
    const dateOnly1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const dateOnly2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    
    const diffMs = Math.abs(dateOnly2.getTime() - dateOnly1.getTime());
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
};

/**
 * Text manipulation utilities
 */
export const textUtils = {
  /**
   * Truncate text to a maximum length
   * @param text Text to truncate
   * @param maxLength Maximum length
   * @param suffix Suffix to add when truncated (default: '...')
   * @returns Truncated text
   */
  truncate: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - suffix.length) + suffix;
  },
  
  /**
   * Convert text to title case
   * @param text Text to convert
   * @returns Text in title case
   */
  toTitleCase: (text: string): string => {
    if (!text) return '';
    
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },
  
  /**
   * Convert text to sentence case
   * @param text Text to convert
   * @returns Text in sentence case
   */
  toSentenceCase: (text: string): string => {
    if (!text) return '';
    
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },
  
  /**
   * Convert camelCase or PascalCase to space-separated words
   * @param text Text to convert
   * @returns Space-separated words
   */
  camelToWords: (text: string): string => {
    if (!text) return '';
    
    return text
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  },
  
  /**
   * Slugify text for use in URLs
   * @param text Text to slugify
   * @returns URL-friendly slug
   */
  slugify: (text: string): string => {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  },
  
  /**
   * Convert bytes to a human-readable size
   * @param bytes Number of bytes
   * @param decimals Number of decimal places (default: 2)
   * @returns Formatted size string (e.g., "1.5 MB")
   */
  formatFileSize: (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  },
  
  /**
   * Generate a random ID
   * @param length Length of the ID (default: 8)
   * @returns Random ID
   */
  generateId: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  },
  
  /**
   * Compare two strings for similarity (case-insensitive)
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score (0-1)
   */
  stringSimilarity: (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;
    
    // Use Levenshtein distance to calculate similarity
    const matrix: number[][] = [];
    
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1.charAt(i - 1) === s2.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    // Convert to similarity score (0-1)
    const maxLen = Math.max(s1.length, s2.length);
    return 1 - matrix[s1.length][s2.length] / maxLen;
  }
};

/**
 * Object manipulation utilities
 */
export const objectUtils = {
  /**
   * Remove empty or null values from an object
   * @param obj Object to clean
   * @returns Cleaned object
   */
  removeEmpty: <T extends Record<string, any>>(obj: T): Partial<T> => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v != null && v !== '')
    ) as Partial<T>;
  },
  
  /**
   * Safely get a nested property from an object
   * @param obj Object to get property from
   * @param path Path to property (e.g., 'user.address.city')
   * @param defaultValue Default value if property doesn't exist
   * @returns Property value or default value
   */
  getNestedProperty: <T>(obj: any, path: string, defaultValue?: T): T | undefined => {
    if (!obj || !path) return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result === undefined ? defaultValue : result;
  },
  
  /**
   * Deep clone an object
   * @param obj Object to clone
   * @returns Cloned object
   */
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => objectUtils.deepClone(item)) as unknown as T;
    }
    
    const clone = {} as Record<string, any>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = objectUtils.deepClone((obj as Record<string, any>)[key]);
      }
    }
    
    return clone as T;
  },
  
  /**
   * Merge two objects deeply
   * @param target Target object
   * @param source Source object
   * @returns Merged object
   */
  deepMerge: <T extends Record<string, any>, U extends Record<string, any>>(target: T, source: U): T & U => {
    const output = Object.assign({}, target) as Record<string, any>;
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = objectUtils.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output as T & U;
  }
};

/**
 * Check if a value is an object
 * @param item Value to check
 * @returns Whether the value is an object
 */
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Document utility functions
 */
export const documentUtils = {
  /**
   * Get a document type label
   * @param documentType Document type code
   * @returns Human-readable label
   */
  getDocumentTypeLabel: (documentType: string): string => {
    const typeMap: Record<string, string> = {
      'deed': 'Deed / Title Transfer',
      'survey': 'Survey Map',
      'plat': 'Plat / Subdivision',
      'legal_description': 'Legal Description',
      'tax_record': 'Tax Record',
      'permit': 'Building Permit',
      'easement': 'Easement Agreement',
      'covenant': 'Covenant / Restriction',
      'judgment': 'Court Judgment',
      'agreement': 'Property Agreement',
      'claim': 'Land Claim',
      'correspondence': 'Official Correspondence',
      'historical': 'Historical Document',
      'photo': 'Property Photo',
      'application': 'Application Form',
      'certificate': 'Certificate of Occupancy',
      'other': 'Other Document'
    };
    
    return typeMap[documentType] || textUtils.camelToWords(documentType);
  },
  
  /**
   * Get an event type label
   * @param eventType Event type code
   * @returns Human-readable label
   */
  getEventTypeLabel: (eventType: string): string => {
    const typeMap: Record<string, string> = {
      'created': 'Document Created',
      'uploaded': 'Document Uploaded',
      'classified': 'Document Classified',
      'updated': 'Document Updated',
      'processed': 'Document Processed',
      'linked': 'Document Linked',
      'viewed': 'Document Viewed',
      'downloaded': 'Document Downloaded',
      'archived': 'Document Archived',
      'unarchived': 'Document Restored',
      'deleted': 'Document Deleted',
      'versioned': 'New Version Created',
      'shared': 'Document Shared',
      'annotated': 'Document Annotated',
      'approved': 'Document Approved',
      'rejected': 'Document Rejected',
      'converted': 'Document Converted',
      'merged': 'Document Merged',
      'split': 'Document Split',
      'signed': 'Document Signed',
      'verified': 'Document Verified'
    };
    
    return typeMap[eventType] || textUtils.camelToWords(eventType);
  },
  
  /**
   * Get a relationship type label
   * @param relationshipType Relationship type code
   * @returns Human-readable label
   */
  getRelationshipTypeLabel: (relationshipType: string): string => {
    const typeMap: Record<string, string> = {
      'derived_from': 'Derived From',
      'replaces': 'Replaces',
      'supplements': 'Supplements',
      'related_to': 'Related To',
      'references': 'References',
      'amends': 'Amends',
      'supersedes': 'Supersedes',
      'contains': 'Contains',
      'extends': 'Extends',
      'clarifies': 'Clarifies',
      'supports': 'Supports',
      'contradicts': 'Contradicts',
      'invalidates': 'Invalidates',
      'validates': 'Validates',
      'version_of': 'Version Of'
    };
    
    return typeMap[relationshipType] || textUtils.camelToWords(relationshipType);
  },
  
  /**
   * Get a processing stage label
   * @param stageName Processing stage name
   * @returns Human-readable label
   */
  getProcessingStageLabel: (stageName: string): string => {
    const stageMap: Record<string, string> = {
      'initial_scan': 'Initial Scan',
      'ocr': 'Text Recognition (OCR)',
      'classification': 'Document Classification',
      'metadata_extraction': 'Metadata Extraction',
      'entity_recognition': 'Entity Recognition',
      'validation': 'Data Validation',
      'indexing': 'Document Indexing',
      'parcel_linking': 'Parcel Linking',
      'geocoding': 'Geocoding',
      'quality_check': 'Quality Check',
      'legal_review': 'Legal Review',
      'approval': 'Final Approval',
      'archiving': 'Archiving',
      'error_resolution': 'Error Resolution'
    };
    
    return stageMap[stageName] || textUtils.camelToWords(stageName);
  },
  
  /**
   * Get status label and color
   * @param status Status code
   * @returns Object with label and color class
   */
  getStatusInfo: (status: string): { label: string; color: string } => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'pending': { label: 'Pending', color: 'bg-yellow-200 text-yellow-800' },
      'in_progress': { label: 'In Progress', color: 'bg-blue-200 text-blue-800' },
      'completed': { label: 'Completed', color: 'bg-green-200 text-green-800' },
      'failed': { label: 'Failed', color: 'bg-red-200 text-red-800' },
      'active': { label: 'Active', color: 'bg-green-200 text-green-800' },
      'inactive': { label: 'Inactive', color: 'bg-gray-200 text-gray-800' },
      'archived': { label: 'Archived', color: 'bg-purple-200 text-purple-800' },
      'draft': { label: 'Draft', color: 'bg-gray-200 text-gray-800' },
      'review': { label: 'Under Review', color: 'bg-yellow-200 text-yellow-800' },
      'approved': { label: 'Approved', color: 'bg-green-200 text-green-800' },
      'rejected': { label: 'Rejected', color: 'bg-red-200 text-red-800' },
      'on_hold': { label: 'On Hold', color: 'bg-orange-200 text-orange-800' }
    };
    
    return statusMap[status] || { label: textUtils.camelToWords(status), color: 'bg-gray-200 text-gray-800' };
  }
};