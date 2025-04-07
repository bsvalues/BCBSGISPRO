import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPreference } from '../../shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

export interface MapPreferenceInput {
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  baseLayer?: 'satellite' | 'streets' | 'terrain' | 'light' | 'dark' | 'custom';
  layerVisibility?: 'visible' | 'hidden' | 'custom';
  customBaseLayer?: string;
  layerSettings?: Record<string, { visible: boolean; opacity: number }>;
  uiSettings?: {
    controlPositions?: Record<string, string>;
    autoHideControls?: boolean;
    minimalUI?: boolean;
    infoBarPosition?: 'top' | 'bottom' | 'hidden';
  };
  theme?: 'light' | 'dark' | 'system';
  measurement?: {
    enabled: boolean;
    unit: 'imperial' | 'metric';
  };
  snapToFeature?: boolean;
  showLabels?: boolean;
  animation?: boolean;
}

export interface UpdateMapPreferenceInput extends MapPreferenceInput {}

export default function useMapPreferences() {
  // Get user's map preferences
  const { 
    data: preferences,
    isLoading, 
    isError,
    error,
    refetch 
  } = useQuery<MapPreference>({
    queryKey: ['/api/map-preferences'],
  });

  // Update map preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: UpdateMapPreferenceInput) => {
      return apiRequest('/api/map-preferences', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-preferences'] });
      toast({
        title: 'Preferences Updated',
        description: 'Your map preferences have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating preferences:', error);
    }
  });

  // Reset map preferences to defaults
  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/map-preferences/reset', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-preferences'] });
      toast({
        title: 'Preferences Reset',
        description: 'Your map preferences have been reset to default values.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to reset preferences. Please try again.',
        variant: 'destructive',
      });
      console.error('Error resetting preferences:', error);
    }
  });

  // Default preferences to use if none are saved
  const defaultPreferences: MapPreferenceInput = {
    defaultCenter: { lat: 44.5439, lng: -123.2618 },  // Benton County, Oregon
    defaultZoom: 12,
    baseLayer: 'streets',
    layerVisibility: 'visible',
    customBaseLayer: '',
    layerSettings: {},
    uiSettings: {
      controlPositions: {
        zoom: 'top-right',
        fullscreen: 'top-right',
        layers: 'top-right',
        search: 'top-left',
        geolocate: 'top-right'
      },
      autoHideControls: true,
      minimalUI: false,
      infoBarPosition: 'bottom'
    },
    theme: 'light',
    measurement: {
      enabled: true,
      unit: 'imperial'
    },
    snapToFeature: true,
    showLabels: true,
    animation: true
  };

  return {
    preferences,
    defaultPreferences,
    isLoading,
    isError,
    error,
    updatePreferencesMutation,
    resetPreferencesMutation
  };
}