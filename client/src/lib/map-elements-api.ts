/**
 * API client for map elements advisor service
 */

import { apiRequest } from './queryClient';

/**
 * Map element model
 */
export interface MapElement {
  id: string;
  name: string;
  description: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  implementationStatus?: 'implemented' | 'partial' | 'missing';
  aiTips?: string;
}

/**
 * Map element category constants
 */
export const mapElementCategories = {
  layout: 'layout',
  navigation: 'navigation',
  identification: 'identification',
  data: 'data',
  visual: 'visual',
  technical: 'technical',
};

/**
 * Map element evaluation request model
 */
export interface MapEvaluationRequest {
  mapDescription: string;
  mapPurpose: string;
  mapContext?: string;
}

/**
 * Map element evaluation response model
 */
export interface MapEvaluationResult {
  overallScore: number;
  suggestions: MapElement[];
  implementedElements: MapElement[];
  partialElements: MapElement[];
  missingElements: MapElement[];
  improvementAreas: string[];
}

/**
 * Map element suggestion response model
 */
export interface MapElementSuggestionResult {
  elementId: string;
  suggestions: string;
}

/**
 * Get a list of standard map elements
 * @returns Promise with map elements
 */
export async function fetchStandardMapElements(): Promise<MapElement[]> {
  return apiRequest('/api/map-elements/standard');
}

/**
 * Evaluate a map description and get AI-powered suggestions
 * @param request Evaluation request
 * @returns Promise with evaluation result
 */
export async function evaluateMapElements(request: MapEvaluationRequest): Promise<MapEvaluationResult> {
  return apiRequest('/api/map-elements/evaluate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get detailed suggestions for a specific map element
 * @param elementId Element ID
 * @param mapDescription Map description for context
 * @returns Promise with element suggestions
 */
export async function fetchElementSuggestions(
  elementId: string,
  mapDescription: string
): Promise<MapElementSuggestionResult> {
  return apiRequest(`/api/map-elements/suggestions/${elementId}`, {
    method: 'POST',
    body: JSON.stringify({ mapDescription }),
  });
}