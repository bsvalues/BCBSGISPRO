import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPreference } from '../../shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

export type BaseLayerType = 'satellite' | 'streets' | 'terrain' | 'light' | 'dark' | 'custom';
export type ThemeType = 'light' | 'dark' | 'system';
export type MeasurementUnit = 'imperial' | 'metric';
export type LayerVisibility = 'visible' | 'hidden' | 'custom';

export interface MapCenter {
  lat: number;
  lng: number;
}

export interface MeasurementSettings {
  enabled: boolean;
  unit: MeasurementUnit;
}

export interface UpdatePreferenceInput {
  defaultCenter?: MapCenter;
  defaultZoom?: number;
  baseLayer?: BaseLayerType;
  customBaseLayer?: string;
  layerVisibility?: LayerVisibility;
  layerSettings?: Record<string, any>;
  uiSettings?: Record<string, any>;
  theme?: ThemeType;
  measurement?: MeasurementSettings;
  snapToFeature?: boolean;
  showLabels?: boolean;
  animation?: boolean;
}

export function useMapPreferences() {
  const queryClient = useQueryClient();

  // Fetch user preferences
  const preferencesQuery = useQuery({
    queryKey: ['/api/map-preferences'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/map-preferences');
        
        if (!response.ok) {
          // Return default preferences if not logged in or no preferences saved
          if (response.status === 401 || response.status === 404) {
            return getDefaultPreferences();
          }
          throw new Error('Failed to fetch map preferences');
        }
        
        return await response.json() as MapPreference;
      } catch (error) {
        console.error('Error fetching preferences:', error);
        // Return default preferences on error
        return getDefaultPreferences();
      }
    }
  });

  // Create or update preferences
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: UpdatePreferenceInput) => {
      return apiRequest('/api/map-preferences', {
        method: 'POST',
        body: JSON.stringify(preferences),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-preferences'] });
      toast({
        title: 'Preferences saved',
        description: 'Your map preferences have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error saving preferences',
        description: error instanceof Error ? error.message : 'Failed to save preferences',
        variant: 'destructive',
      });
    }
  });

  // Reset preferences to defaults
  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      const defaults = getDefaultPreferences();
      return apiRequest('/api/map-preferences', {
        method: 'POST',
        body: JSON.stringify(defaults),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-preferences'] });
      toast({
        title: 'Preferences reset',
        description: 'Your map preferences have been reset to defaults.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error resetting preferences',
        description: error instanceof Error ? error.message : 'Failed to reset preferences',
        variant: 'destructive',
      });
    }
  });

  // Set theme
  const setTheme = (theme: ThemeType) => {
    if (!preferencesQuery.data) return;
    
    savePreferencesMutation.mutate({
      ...preferencesQuery.data,
      theme
    });
  };

  // Set base layer
  const setBaseLayer = (baseLayer: BaseLayerType, customUrl?: string) => {
    if (!preferencesQuery.data) return;
    
    const update: UpdatePreferenceInput = {
      baseLayer
    };
    
    if (baseLayer === 'custom' && customUrl) {
      update.customBaseLayer = customUrl;
    }
    
    savePreferencesMutation.mutate(update);
  };

  // Set default map position
  const setDefaultMapPosition = (center: MapCenter, zoom: number) => {
    if (!preferencesQuery.data) return;
    
    savePreferencesMutation.mutate({
      defaultCenter: center,
      defaultZoom: zoom
    });
  };

  // Toggle a boolean setting
  const toggleSetting = (setting: 'snapToFeature' | 'showLabels' | 'animation') => {
    if (!preferencesQuery.data) return;
    
    const currentValue = preferencesQuery.data[setting];
    
    savePreferencesMutation.mutate({
      [setting]: !currentValue
    });
  };

  // Update measurement settings
  const updateMeasurementSettings = (settings: Partial<MeasurementSettings>) => {
    if (!preferencesQuery.data) return;
    
    const currentMeasurement = preferencesQuery.data.measurement || 
      { enabled: false, unit: 'imperial' as MeasurementUnit };
    
    savePreferencesMutation.mutate({
      measurement: {
        ...currentMeasurement,
        ...settings
      }
    });
  };

  // Update UI settings
  const updateUISettings = (settings: Record<string, any>) => {
    if (!preferencesQuery.data) return;
    
    const currentUISettings = preferencesQuery.data.uiSettings || {};
    
    savePreferencesMutation.mutate({
      uiSettings: {
        ...currentUISettings,
        ...settings
      }
    });
  };

  // Default preferences
  const getDefaultPreferences = (): MapPreference => ({
    id: 0,
    userId: 0,
    defaultCenter: { lat: 44.5949, lng: -123.2063 }, // Default to Benton County, Oregon
    defaultZoom: 12,
    baseLayer: 'streets',
    layerVisibility: 'visible',
    theme: 'light',
    measurement: { enabled: false, unit: 'imperial' },
    snapToFeature: true,
    showLabels: true,
    animation: true,
    updatedAt: null,
    layerSettings: {},
    uiSettings: {
      controlPosition: 'top-right',
      autoHideControls: false,
      showScale: true,
      showCompass: true,
      showLegend: true
    },
    customBaseLayer: null
  });

  return {
    // Query and mutations
    preferencesQuery,
    savePreferencesMutation,
    resetPreferencesMutation,
    
    // Helper functions
    setTheme,
    setBaseLayer,
    setDefaultMapPosition,
    toggleSetting,
    updateMeasurementSettings,
    updateUISettings,
    getDefaultPreferences,
    
    // Combined data
    preferences: preferencesQuery.data || getDefaultPreferences(),
    isLoading: preferencesQuery.isLoading,
    error: preferencesQuery.error
  };
}

export default useMapPreferences;