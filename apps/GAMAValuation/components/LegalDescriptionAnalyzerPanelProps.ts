/**
 * LegalDescriptionAnalyzerPanel Props Interface
 * 
 * This file defines the prop interface for the LegalDescriptionAnalyzerPanel component,
 * using the standardized types from the shared types library.
 */

import { LegalDescriptionParseResult } from '../../../libs/types';

/**
 * Props for the LegalDescriptionAnalyzerPanel component
 */
export interface LegalDescriptionAnalyzerPanelProps {
  // Initial legal description text (if any)
  initialDescription?: string;
  
  // Whether the component is in a loading state
  isLoading?: boolean;
  
  // Error message to display (if any)
  error?: string;
  
  // Result of the parsing operation (if available)
  result?: LegalDescriptionParseResult;
  
  // Whether to use AI-assisted parsing
  useAI?: boolean;
  
  // Whether to allow editing of the legal description
  allowEdit?: boolean;
  
  // Whether to show confidence score
  showConfidence?: boolean;
  
  // Whether to show property boundaries on a map
  showBoundaries?: boolean;
  
  // Whether to show suggestions for improving the description
  showSuggestions?: boolean;
  
  // Event handlers
  onAnalyzeRequest?: (description: string) => void;
  onExportResult?: (format: 'pdf' | 'json' | 'geojson') => void;
  onSaveResult?: (result: LegalDescriptionParseResult) => void;
  onReset?: () => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}