/**
 * EsriMapModuleSettings - Configuration for the Esri Map Module
 * 
 * This file contains the configuration settings for the Esri Map Module,
 * including base layers and viewable layers.
 */

/**
 * Base layer model for Esri Map Module
 */
export interface BaseLayerModel {
  name: string;
  enableSelection: boolean;
  order: number;
  visible: boolean;
  url: string;
  type: 'ESRITiledLayer' | 'ESRIDynamicLayer';
  spatialReferenceId: number;
}

/**
 * Viewable layer model for Esri Map Module
 */
export interface ViewableLayerModel {
  name: string;
  enableSelection: boolean;
  selectionLayerId?: number;
  order: number;
  visible: boolean;
  url: string;
  type: 'ESRIDynamicLayer' | 'ESRIFeatureLayer';
}

/**
 * Settings for Esri Map Module
 */
export interface EsriMapModuleSettings {
  baseMap: {
    enableSelection: boolean;
    order: number;
    visible: boolean;
    type: string;
  };
  baseLayers: BaseLayerModel[];
  viewableLayers: ViewableLayerModel[];
  mapTitle: string;
  autoSelectMaxRecords: number;
}

/**
 * Default settings for Esri Map Module
 */
export const defaultEsriMapModuleSettings: EsriMapModuleSettings = {
  baseMap: {
    enableSelection: true,
    order: 0,
    visible: true,
    type: 'topo-vector'
  },
  baseLayers: [
    {
      name: 'Benton County Basemap',
      enableSelection: false,
      order: 1,
      visible: true,
      url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Benton_County_Basemap/MapServer',
      type: 'ESRITiledLayer',
      spatialReferenceId: 102100
    }
  ],
  viewableLayers: [
    {
      name: 'Benton County Parcels',
      enableSelection: true,
      selectionLayerId: 0,
      order: 2,
      visible: true,
      url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Benton_County_Parcels/FeatureServer/0',
      type: 'ESRIFeatureLayer'
    },
    {
      name: 'Benton County Roads',
      enableSelection: true,
      selectionLayerId: 0,
      order: 3,
      visible: true,
      url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Benton_County_Roads/FeatureServer/0',
      type: 'ESRIFeatureLayer'
    },
    {
      name: 'Benton County Buildings',
      enableSelection: true,
      selectionLayerId: 0,
      order: 4,
      visible: false,
      url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Benton_County_Buildings/FeatureServer/0',
      type: 'ESRIFeatureLayer'
    }
  ],
  mapTitle: 'Benton County GIS',
  autoSelectMaxRecords: 1000
};

/**
 * Function to get map settings by merging default settings with provided overrides
 */
export function getMapSettings(overrides?: Partial<EsriMapModuleSettings>): EsriMapModuleSettings {
  if (!overrides) {
    return { ...defaultEsriMapModuleSettings };
  }

  return {
    ...defaultEsriMapModuleSettings,
    ...overrides,
    baseLayers: overrides.baseLayers || defaultEsriMapModuleSettings.baseLayers,
    viewableLayers: overrides.viewableLayers || defaultEsriMapModuleSettings.viewableLayers,
    baseMap: {
      ...defaultEsriMapModuleSettings.baseMap,
      ...(overrides.baseMap || {})
    }
  };
}