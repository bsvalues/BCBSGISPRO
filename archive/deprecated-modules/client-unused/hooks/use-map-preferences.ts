import { useLocalStorage } from './use-local-storage';

export interface MapPreferences {
  visibleLayers: string[];
  showLabels: boolean;
  baseMap: string;
  layerOpacity: Record<string, number>;
  darkMode: boolean;
  showScale: boolean;
  showCompass: boolean;
  showGrid: boolean;
  showBoundaries: boolean;
  show3DBuildings: boolean;
  mapRotation: number;
  measurementUnits: 'imperial' | 'metric';
}

const defaultPreferences: MapPreferences = {
  visibleLayers: ['parcels', 'streets'],
  showLabels: true,
  baseMap: 'streets',
  layerOpacity: { parcels: 1, streets: 1, boundaries: 0.8, zoning: 0.6 },
  darkMode: false,
  showScale: true,
  showCompass: true,
  showGrid: false,
  showBoundaries: true,
  show3DBuildings: false,
  mapRotation: 0,
  measurementUnits: 'imperial',
};

export function useMapPreferences() {
  const [preferences, setPreferences] = useLocalStorage<MapPreferences>(
    'map-preferences',
    defaultPreferences
  );

  const updatePreferences = (newPrefs: Partial<MapPreferences>) => {
    setPreferences(currentPrefs => ({
      ...currentPrefs,
      ...newPrefs
    }));
  };

  const toggleLayer = (layerId: string) => {
    setPreferences(currentPrefs => {
      const layerIndex = currentPrefs.visibleLayers.indexOf(layerId);
      let newLayers: string[];

      if (layerIndex === -1) {
        // Add layer if not present
        newLayers = [...currentPrefs.visibleLayers, layerId];
      } else {
        // Remove layer if present
        newLayers = currentPrefs.visibleLayers.filter(id => id !== layerId);
      }

      return {
        ...currentPrefs,
        visibleLayers: newLayers
      };
    });
  };

  const isLayerVisible = (layerId: string) => {
    return preferences.visibleLayers.includes(layerId);
  };

  const setLayerOpacity = (layerId: string, opacity: number) => {
    setPreferences(currentPrefs => ({
      ...currentPrefs,
      layerOpacity: {
        ...currentPrefs.layerOpacity,
        [layerId]: opacity
      }
    }));
  };

  const getLayerOpacity = (layerId: string) => {
    return preferences.layerOpacity[layerId] ?? 1;
  };

  const toggleDarkMode = () => {
    setPreferences(currentPrefs => ({
      ...currentPrefs,
      darkMode: !currentPrefs.darkMode
    }));
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
  };

  return {
    preferences,
    updatePreferences,
    toggleLayer,
    isLayerVisible,
    setLayerOpacity,
    getLayerOpacity,
    toggleDarkMode,
    resetToDefaults
  };
}

// Export as both default and named export to prevent import issues
export default useMapPreferences;