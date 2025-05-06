import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  evaluateMap, 
  getElementSuggestions, 
  getStandardElements,
  type MapEvaluationResult,
  type MapElementSuggestion
} from '@/lib/map-elements-api';

export function useMapElementsAdvisor() {
  const { toast } = useToast();

  // Query to fetch standard map elements
  const {
    data: standardElements,
    isLoading: isLoadingStandards,
    error: standardsError
  } = useQuery({
    queryKey: ['/api/map-elements/standards'],
    queryFn: async () => {
      const response = await getStandardElements();
      return response.elements;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour since this rarely changes
  });

  // Mutation to evaluate a map
  const evaluateMapMutation = useMutation({
    mutationFn: async ({ 
      description, 
      purpose, 
      context 
    }: { 
      description: string; 
      purpose: string; 
      context?: string;
    }) => {
      return evaluateMap(description, purpose, context);
    },
    onError: (error) => {
      toast({
        title: 'Error evaluating map',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });

  // Mutation to get detailed suggestions for a specific element
  const getElementSuggestionsMutation = useMutation({
    mutationFn: async ({ 
      elementId, 
      mapDescription 
    }: { 
      elementId: string; 
      mapDescription: string; 
    }) => {
      const response = await getElementSuggestions(elementId, mapDescription);
      return response.suggestions;
    },
    onError: (error) => {
      toast({
        title: 'Error getting element suggestions',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });

  // Function to evaluate a map with proper error handling
  const evaluateMapWithFeedback = async (
    description: string,
    purpose: string,
    context?: string
  ): Promise<MapEvaluationResult | null> => {
    try {
      return await evaluateMapMutation.mutateAsync({ description, purpose, context });
    } catch (error) {
      console.error('Error evaluating map:', error);
      return null;
    }
  };

  // Get element suggestions with proper error handling
  const getElementSuggestionsWithFeedback = async (
    elementId: string,
    mapDescription: string
  ): Promise<string | null> => {
    try {
      return await getElementSuggestionsMutation.mutateAsync({ elementId, mapDescription });
    } catch (error) {
      console.error('Error getting element suggestions:', error);
      return null;
    }
  };

  // Get element by ID from standard elements
  const getElementById = (elementId: string): MapElementSuggestion | undefined => {
    return standardElements?.find(element => element.id === elementId);
  };

  return {
    standardElements,
    isLoadingStandards,
    standardsError,
    evaluateMap: evaluateMapWithFeedback,
    isEvaluating: evaluateMapMutation.isPending,
    getElementSuggestions: getElementSuggestionsWithFeedback,
    isGettingSuggestions: getElementSuggestionsMutation.isPending,
    evaluationError: evaluateMapMutation.error,
    getElementById,
  };
}