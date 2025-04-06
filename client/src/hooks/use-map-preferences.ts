import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export type Theme = 'light' | 'dark' | 'system';
export type MapBaseLayer = 'satellite' | 'streets' | 'terrain' | 'light' | 'dark' | 'custom';
export type MeasurementUnit = 'imperial' | 'metric';

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  type: string;
}

export interface MapPreferences {
  id: number;
  userId: number | null;
  updatedAt: Date | null;
  defaultCenter: {
    lat: number;
    lng: number;
  };
  defaultZoom: number;
  baseLayer: MapBaseLayer;
  theme: Theme;
  measurement: {
    enabled: boolean;
    unit: MeasurementUnit;
  };
  grid: boolean;
  scalebar: boolean;
  animation: boolean;
  terrain: boolean;
  buildings3D: boolean;
  traffic: boolean;
  labels: boolean;
  layers: MapLayer[];
}

// Default preferences to use when none are set
const defaultPreferences: MapPreferences = {
  id: 0,
  userId: null,
  updatedAt: null,
  defaultCenter: {
    lat: 44.5646,  // Benton County, Oregon center
    lng: -123.2620,
  },
  defaultZoom: 11,
  baseLayer: 'streets',
  theme: 'system',
  measurement: {
    enabled: true,
    unit: 'imperial',
  },
  grid: false,
  scalebar: true,
  animation: true,
  terrain: false,
  buildings3D: false,
  traffic: false,
  labels: true,
  layers: [],
};

/**
 * Hook for managing map preferences
 */
export function useMapPreferences() {
  const queryClient = useQueryClient();
  
  // Fetch user preferences
  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['/api/map-preferences'],
    placeholderData: defaultPreferences,
  });

  // Update preferences
  const updatePreferences = useMutation({
    mutationFn: (updatedPrefs: Partial<MapPreferences>) => 
      apiRequest('/api/map-preferences', {
        method: 'PATCH',
        body: JSON.stringify(updatedPrefs),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-preferences'] });
    },
  });

  // Reset preferences to default
  const resetPreferences = useMutation({
    mutationFn: () => 
      apiRequest('/api/map-preferences/reset', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-preferences'] });
    },
  });

  // Apply theme based on preferences
  const applyTheme = () => {
    if (!preferences) return;
    
    const { theme } = preferences;
    
    if (theme === 'system') {
      // Use system preference
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDarkMode);
    } else {
      // Use explicit setting
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  // Get map center and zoom from preferences
  const getDefaultMapPosition = () => {
    if (!preferences) return { center: [44.5646, -123.2620], zoom: 11 };
    
    const { defaultCenter, defaultZoom } = preferences;
    return {
      center: [defaultCenter.lat, defaultCenter.lng] as [number, number],
      zoom: defaultZoom,
    };
  };

  // Set current position as default
  const setCurrentPositionAsDefault = (lat: number, lng: number, zoom: number) => {
    updatePreferences.mutate({
      defaultCenter: { lat, lng },
      defaultZoom: zoom,
    });
  };

  // Toggle a preference by key
  const togglePreference = (key: keyof typeof preferences, value?: boolean) => {
    if (!preferences) return;
    
    const newValue = value !== undefined ? value : !preferences[key];
    updatePreferences.mutate({ [key]: newValue });
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    resetPreferences,
    applyTheme,
    getDefaultMapPosition,
    setCurrentPositionAsDefault,
    togglePreference,
  };
}