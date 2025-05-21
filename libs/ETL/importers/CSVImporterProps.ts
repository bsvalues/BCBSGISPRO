/**
 * CSVImporter Props Interface
 * 
 * This file defines the prop interface for the CSVImporter component,
 * using the standardized types from the shared types library.
 */

import { CSVParseOptions, ValidationRule, TransformationRule, CSVImportResult, FilterCriteria } from '../../../libs/types';

/**
 * Props for the CSVImporter component
 */
export interface CSVImporterProps<T> {
  // The file to import (if already selected)
  file?: File;
  
  // CSV parsing options
  parseOptions?: CSVParseOptions;
  
  // Validation rules to apply to the imported data
  validationRules?: ValidationRule[];
  
  // Transformation rules to apply to the imported data
  transformationRules?: TransformationRule[];
  
  // Filters to apply to the imported data
  filters?: FilterCriteria[];
  
  // Maximum file size in bytes
  maxFileSize?: number;
  
  // Whether to show a preview of the data
  showPreview?: boolean;
  
  // Maximum number of rows to preview
  previewRows?: number;
  
  // Whether to allow file selection
  allowFileSelection?: boolean;
  
  // Whether to allow drag and drop
  allowDragAndDrop?: boolean;
  
  // Whether the component is in a loading state
  isLoading?: boolean;
  
  // Error message to display (if any)
  error?: string;
  
  // Event handlers
  onFileSelect?: (file: File) => void;
  onFileLoad?: (content: string) => void;
  onImportStart?: () => void;
  onImportComplete?: (result: CSVImportResult<T>) => void;
  onValidationError?: (errors: Array<{ row: number; field: string; message: string }>) => void;
  onCancel?: () => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}