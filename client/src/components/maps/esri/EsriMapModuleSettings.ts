/**
 * EsriMapModuleSettings interface for configuring the EsriMap component
 */
export interface EsriMapModuleSettings {
  // Base map configuration
  baseMap: {
    type: string;  // topo-vector, satellite, streets-vector, hybrid, etc.
    enableSelection?: boolean;
    visible?: boolean;
    order?: number;
  };
  
  // Map center and zoom
  center?: number[];
  zoom?: number;
  
  // Map padding (for UI elements)
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Benton County specific layers
  bentonCountyBasemap?: {
    visible: boolean;
    opacity?: number;
  };
  
  bentonCountyParcels?: {
    visible: boolean;
    opacity?: number;
  };
  
  bentonCountyRoads?: {
    visible: boolean;
    opacity?: number;
  };
  
  bentonCountyBuildings?: {
    visible: boolean;
    opacity?: number;
  };
}

/**
 * Default map settings
 */
const defaultMapSettings: EsriMapModuleSettings = {
  baseMap: {
    type: 'topo-vector',
    enableSelection: true,
    visible: true,
    order: 0
  },
  center: [-123.2615, 44.5646], // Default to Benton County, Oregon
  zoom: 12,
  padding: { top: 50, right: 0, bottom: 0, left: 0 },
  bentonCountyBasemap: {
    visible: true,
    opacity: 0.8
  },
  bentonCountyParcels: {
    visible: true,
    opacity: 1.0
  },
  bentonCountyRoads: {
    visible: true,
    opacity: 1.0
  },
  bentonCountyBuildings: {
    visible: false,
    opacity: 1.0
  }
};

/**
 * Helper function to get map settings with defaults applied
 * @param customSettings - Custom map settings to override defaults
 * @returns Map settings with defaults applied
 */
export function getMapSettings(customSettings: Partial<EsriMapModuleSettings> = {}): EsriMapModuleSettings {
  return {
    ...defaultMapSettings,
    ...customSettings,
    // Merge nested objects properly
    baseMap: {
      ...defaultMapSettings.baseMap,
      ...(customSettings.baseMap || {})
    },
    padding: {
      ...defaultMapSettings.padding,
      ...(customSettings.padding || {})
    },
    bentonCountyBasemap: {
      ...defaultMapSettings.bentonCountyBasemap,
      ...(customSettings.bentonCountyBasemap || {})
    },
    bentonCountyParcels: {
      ...defaultMapSettings.bentonCountyParcels,
      ...(customSettings.bentonCountyParcels || {})
    },
    bentonCountyRoads: {
      ...defaultMapSettings.bentonCountyRoads,
      ...(customSettings.bentonCountyRoads || {})
    },
    bentonCountyBuildings: {
      ...defaultMapSettings.bentonCountyBuildings,
      ...(customSettings.bentonCountyBuildings || {})
    }
  };
}