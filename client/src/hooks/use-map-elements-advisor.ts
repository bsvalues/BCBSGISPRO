/**
 * React hooks for the Map Elements Advisor feature
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { 
  fetchStandardMapElements, 
  evaluateMapElements, 
  fetchElementSuggestions,
  MapEvaluationRequest,
} from '../lib/map-elements-api';

/**
 * Hook to fetch standard map elements
 */
export function useStandardMapElements() {
  return useQuery({
    queryKey: ['/api/map-elements/standard'],
    queryFn: () => fetchStandardMapElements(),
  });
}

/**
 * Hook to evaluate map elements based on a description
 */
export function useMapEvaluation() {
  return useMutation({
    mutationFn: (request: MapEvaluationRequest) => evaluateMapElements(request),
    onSuccess: () => {
      // Since other queries depend on this, we don't need to invalidate
      // queryClient.invalidateQueries({ queryKey: ['/api/map-elements/evaluate'] });
    },
  });
}

/**
 * Hook to fetch detailed suggestions for a specific map element
 */
export function useElementSuggestions(elementId: string | null, mapDescription: string) {
  return useQuery({
    queryKey: ['/api/map-elements/suggestions', elementId],
    queryFn: () => {
      if (!elementId || !mapDescription) {
        throw new Error('Element ID and map description are required');
      }
      return fetchElementSuggestions(elementId, mapDescription);
    },
    enabled: !!elementId && !!mapDescription,
  });
}