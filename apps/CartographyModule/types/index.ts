/**
 * Type definitions for the CartographyModule
 */

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties?: {
    id?: string;
    name?: string;
    description?: string;
    [key: string]: any;
  };
}

export enum MapTool {
  PAN = 'pan',
  DRAW = 'draw',
  EDIT = 'edit',
  DELETE = 'delete',
  MEASURE = 'measure',
  SELECT = 'select'
}

export interface MapLayerStyle {
  color?: string;
  weight?: number;
  opacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  dashArray?: string;
  lineCap?: string;
  lineJoin?: string;
}

export enum MeasurementType {
  DISTANCE = 'distance',
  AREA = 'area'
}

export enum MeasurementUnit {
  METRIC = 'metric',
  IMPERIAL = 'imperial'
}

export type MapProvider = 'mapbox' | 'arcgis' | 'leaflet';