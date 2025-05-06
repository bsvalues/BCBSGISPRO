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
    queryFn: async () => {
      try {
        // Try to call the real API
        return await fetchStandardMapElements();
      } catch (error) {
        console.error('Error fetching standard map elements:', error);
        
        // In development, provide fallback data if the API call fails
        if (process.env.NODE_ENV !== 'production') {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Return mock data for development
          return [
            {
              id: 'title',
              name: 'Map Title',
              description: 'Clear, concise title that describes the map content',
              category: 'identification',
              importance: 'high',
            },
            {
              id: 'legend',
              name: 'Legend',
              description: 'Explanation of symbols, colors, and patterns used in the map',
              category: 'identification',
              importance: 'high',
            },
            {
              id: 'scale',
              name: 'Scale Bar',
              description: 'Visual or numerical representation of map distance to real-world distance',
              category: 'technical',
              importance: 'high',
            },
            {
              id: 'north-arrow',
              name: 'North Arrow',
              description: 'Indicator showing the direction of geographic north',
              category: 'navigation',
              importance: 'high',
            },
            {
              id: 'data-source',
              name: 'Data Source',
              description: 'Attribution of where the map data came from',
              category: 'technical',
              importance: 'medium',
            }
          ];
        }
        
        // In production, rethrow the error
        throw error;
      }
    },
  });
}

/**
 * Hook to evaluate map elements based on a description
 */
export function useMapEvaluation() {
  return useMutation({
    mutationFn: async (request: MapEvaluationRequest) => {
      try {
        // Try to call the real API
        return await evaluateMapElements(request);
      } catch (error) {
        console.error('Error evaluating map elements:', error);
        
        // In development, provide fallback data if the API call fails
        if (process.env.NODE_ENV !== 'production') {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Return mock data for development
          return {
            overallScore: 65,
            suggestions: [
              {
                id: 'title',
                name: 'Map Title',
                description: 'Clear, concise title that describes the map content',
                category: 'identification',
                importance: 'high',
                implementationStatus: 'implemented',
                aiTips: 'Your map title is clear and descriptive. Good job!'
              },
              {
                id: 'legend',
                name: 'Legend',
                description: 'Explanation of symbols, colors, and patterns used in the map',
                category: 'identification',
                importance: 'high',
                implementationStatus: 'partial',
                aiTips: 'Consider adding more detail to your legend to explain all symbols.'
              },
              {
                id: 'north-arrow',
                name: 'North Arrow',
                description: 'Indicator showing the direction of geographic north',
                category: 'navigation',
                importance: 'high',
                implementationStatus: 'missing',
                aiTips: 'Add a north arrow to help users orient themselves on the map.'
              }
            ],
            implementedElements: [
              {
                id: 'title',
                name: 'Map Title',
                description: 'Clear, concise title that describes the map content',
                category: 'identification',
                importance: 'high'
              }
            ],
            partialElements: [
              {
                id: 'legend',
                name: 'Legend',
                description: 'Explanation of symbols, colors, and patterns used in the map',
                category: 'identification',
                importance: 'high'
              }
            ],
            missingElements: [
              {
                id: 'north-arrow',
                name: 'North Arrow',
                description: 'Indicator showing the direction of geographic north',
                category: 'navigation',
                importance: 'high'
              }
            ],
            improvementAreas: [
              'Add a north arrow for better orientation',
              'Include a scale bar to show distances',
              'Complete the legend with all map symbols'
            ]
          };
        }
        
        // In production, rethrow the error
        throw error;
      }
    },
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
    queryFn: async () => {
      if (!elementId || !mapDescription) {
        throw new Error('Element ID and map description are required');
      }
      
      try {
        // Try to call the real API
        return await fetchElementSuggestions(elementId, mapDescription);
      } catch (error) {
        console.error('Error fetching element suggestions:', error);
        
        // In development, provide fallback data if the API call fails
        if (process.env.NODE_ENV !== 'production') {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Return mock data based on element ID
          let suggestion = '';
          
          switch (elementId) {
            case 'title':
              suggestion = '1. Use a hierarchical approach with primary title and optional subtitle\n2. Keep it concise but descriptive of the geographic area and thematic focus\n3. Consider using a title that communicates the map\'s purpose and audience';
              break;
            case 'legend':
              suggestion = '1. Organize symbols by category for easier reading\n2. Include all symbols, patterns and colors used in the map\n3. Use a logical order (most to least important)\n4. Consider using a legend title to further clarify the mapped theme';
              break;
            case 'north-arrow':
              suggestion = "1. Place in a corner of the map that does not obscure important data\n2. Size appropriately - visible but not distracting\n3. Consider using a style that matches the overall map design";
              break;
            default:
              suggestion = '1. Add this element to improve map usability\n2. Follow cartographic best practices for placement and design\n3. Consider how this element relates to your map\'s purpose';
          }
          
          return {
            elementId,
            suggestions: suggestion
          };
        }
        
        // In production, rethrow the error
        throw error;
      }
    },
    enabled: !!elementId && !!mapDescription,
  });
}