/**
 * EsriMapModuleSettings
 * Configuration for the Esri Map Module based on the documentation
 */

export interface BaseLayerModel {
  name: string;
  enableSelection: boolean;
  order: number;
  visible: boolean;
  url: string;
  type: 'ESRITiledLayer' | 'ESRIDynamicLayer';
  spatialReferenceID: number;
}

export interface ViewableLayerModel {
  name: string;
  enableSelection: boolean;
  selectionLayerID: number;
  order: number;
  visible: boolean;
  url: string;
  type: 'ESRIDynamicLayer' | 'ESRIFeatureLayer';
}

export interface EsriMapModuleSettingsModel {
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
 * Default configuration based on the provided documentation
 */
export const DEFAULT_ESRI_MAP_SETTINGS: EsriMapModuleSettingsModel = {
  baseMap: {
    enableSelection: false,
    order: 0,
    visible: false,
    type: 'ESRIDynamicLayer'
  },
  baseLayers: [
    {
      name: 'Imagery',
      enableSelection: false,
      order: 0,
      visible: true,
      url: 'https://services.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/World_Imagery/MapServer',
      type: 'ESRITiledLayer',
      spatialReferenceID: 3857
    },
    {
      name: 'Street Map',
      enableSelection: false,
      order: 1,
      visible: true,
      url: 'https://services.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/World_Street_Map/MapServer',
      type: 'ESRITiledLayer',
      spatialReferenceID: 3857
    }
  ],
  viewableLayers: [
    {
      name: 'Parcels',
      enableSelection: true,
      selectionLayerID: 0,
      order: 5,
      visible: true,
      url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer',
      type: 'ESRIDynamicLayer'
    }
  ],
  mapTitle: 'Benton County Assessor Office',
  autoSelectMaxRecords: 2000
};

/**
 * Convert ESRI layer type to ArcGIS API type
 */
export function getArcGISLayerType(esriType: string): string {
  switch (esriType) {
    case 'ESRITiledLayer':
      return 'TileLayer';
    case 'ESRIDynamicLayer':
      return 'MapImageLayer';
    case 'ESRIFeatureLayer':
      return 'FeatureLayer';
    default:
      return 'TileLayer';
  }
}

/**
 * Get URL for ArcGIS service based on type
 */
export function getServiceUrl(url: string, type: string): string {
  // For feature layers, we need to add /0 to the URL to get the first layer
  if (type === 'ESRIFeatureLayer') {
    return `${url}/0`;
  }
  return url;
}

export default DEFAULT_ESRI_MAP_SETTINGS;