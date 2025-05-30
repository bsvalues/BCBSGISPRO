/**
 * PrintExportPanel Props Interface
 * 
 * This file defines the prop interface for the PrintExportPanel component,
 * using the standardized types from the shared types library.
 */

import { PrintExportOptions } from '../../../../libs/types';

/**
 * Props for the PrintExportPanel component
 */
export interface PrintExportPanelProps {
  // Available export formats
  availableFormats?: Array<'png' | 'jpg' | 'pdf' | 'svg'>;
  
  // Default export format
  defaultFormat?: 'png' | 'jpg' | 'pdf' | 'svg';
  
  // Default export width (in pixels)
  defaultWidth?: number;
  
  // Default export height (in pixels)
  defaultHeight?: number;
  
  // Default export DPI
  defaultDpi?: number;
  
  // Whether to include attribution by default
  includeAttributionDefault?: boolean;
  
  // Whether to include scale by default
  includeScaleDefault?: boolean;
  
  // Whether to include north arrow by default
  includeNorthDefault?: boolean;
  
  // Whether to include title by default
  includeTitleDefault?: boolean;
  
  // Default export title
  defaultTitle?: string;
  
  // Whether to show print button
  showPrintButton?: boolean;
  
  // Whether to show export button
  showExportButton?: boolean;
  
  // Whether to show advanced options
  showAdvancedOptions?: boolean;
  
  // Event handlers
  onExport: (options: PrintExportOptions) => Promise<string>;
  onPrint?: (options: PrintExportOptions) => Promise<void>;
  onCancel?: () => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}