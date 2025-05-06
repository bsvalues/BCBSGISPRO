import { apiRequest } from '@/lib/queryClient';

/**
 * Map Element Suggestion
 * 
 * Represents a suggestion for a map element based on cartographic best practices
 */
export interface MapElementSuggestion {
  id: string;
  name: string;
  description: string;
  importance: 'critical' | 'recommended' | 'optional';
  implementationStatus?: 'implemented' | 'missing' | 'partial';
  category: 'structure' | 'information' | 'design' | 'technical' | 'legal';
  bestPractices: string[];
  aiTips?: string;
}

/**
 * Map Evaluation Result
 * 
 * Results of evaluating a map against cartographic best practices
 */
export interface MapEvaluationResult {
  overallScore: number; // 0-100
  implementedElements: string[];
  missingElements: string[];
  partialElements: string[];
  suggestions: MapElementSuggestion[];
  improvementAreas: string[];
}

/**
 * Map Elements API client
 * 
 * Provides functions to interact with the map elements advisor service
 */

/**
 * Evaluate a map description against best practices
 * 
 * @param mapDescription Description of the current map
 * @param mapPurpose The purpose of the map
 * @param mapContext Additional context about the map's usage
 * @returns Evaluation results with suggestions
 */
export const evaluateMap = async (
  mapDescription: string, 
  mapPurpose: string, 
  mapContext?: string
): Promise<MapEvaluationResult> => {
  return apiRequest('/api/map-elements/evaluate', {
    method: 'POST',
    data: {
      mapDescription,
      mapPurpose,
      mapContext
    }
  });
};

/**
 * Get detailed suggestions for a specific map element
 * 
 * @param elementId ID of the element to get suggestions for
 * @param mapDescription Description of the current map
 * @returns Detailed suggestions for implementation
 */
export const getElementSuggestions = async (
  elementId: string,
  mapDescription: string
): Promise<{suggestions: string}> => {
  return apiRequest('/api/map-elements/suggestions', {
    method: 'POST',
    data: {
      elementId,
      mapDescription
    }
  });
};

/**
 * Get the standard map elements
 * 
 * @returns Array of standard map elements
 */
export const getStandardElements = async (): Promise<{elements: MapElementSuggestion[]}> => {
  return apiRequest('/api/map-elements/standards', {
    method: 'GET'
  });
};