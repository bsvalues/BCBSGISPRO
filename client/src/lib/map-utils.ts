// Map utility functions for GIS integration

export type MapLayer = {
  id: number;
  name: string;
  visible: boolean;
  source: string;
  type: string;
};

export type MapViewport = {
  center: [number, number];
  zoom: number;
};

export type FeatureProperties = {
  [key: string]: any;
};

export type GeoJSONFeature = {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any[];
  };
  properties: FeatureProperties;
};

export type GeoJSONCollection = {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
};

// Convert a standard parcel ID to a GeoJSON feature
export function parcelToGeoJSON(
  parcelId: string, 
  coordinates: number[][][],
  properties: FeatureProperties = {}
): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: coordinates
    },
    properties: {
      parcelId,
      ...properties
    }
  };
}

// Create a new map view that includes all given parcel features
export function createViewportForParcels(features: GeoJSONFeature[]): MapViewport {
  // This is a simplified version; a real implementation would calculate bounds
  return {
    center: [-119.1689, 46.2086], // Approximate center of Benton County
    zoom: 12
  };
}

// Dummy data for map preview when actual GIS data is not available
export function getDummyParcelData(parcelId: string): GeoJSONFeature {
  // Generate a simple polygon around a center point with some randomization
  const centerLat = 46.2086 + (Math.random() - 0.5) * 0.05;
  const centerLng = -119.1689 + (Math.random() - 0.5) * 0.05;
  
  const coordinates = [
    [
      [centerLng - 0.01, centerLat - 0.01],
      [centerLng + 0.01, centerLat - 0.01],
      [centerLng + 0.01, centerLat + 0.01],
      [centerLng - 0.01, centerLat + 0.01],
      [centerLng - 0.01, centerLat - 0.01] // Close the polygon
    ]
  ];
  
  return parcelToGeoJSON(parcelId, coordinates, { 
    name: `Parcel ${parcelId}`,
    acreage: (Math.random() * 20 + 1).toFixed(2),
    type: 'residential'
  });
}

// Default map layers
export const DEFAULT_MAP_LAYERS: MapLayer[] = [
  { id: 1, name: 'Parcels', visible: true, source: 'county_gis', type: 'vector' },
  { id: 2, name: 'Roads', visible: true, source: 'county_gis', type: 'vector' },
  { id: 3, name: 'Plat Boundaries', visible: true, source: 'arcgis', type: 'vector' },
  { id: 4, name: 'Aerial Imagery', visible: false, source: 'usgs', type: 'raster' }
];

// Validate parcel number formatting (Benton County uses 15-digit parcel numbers)
export function isValidParcelNumber(parcelId: string): boolean {
  const regex = /^\d{15}$/;
  return regex.test(parcelId);
}
