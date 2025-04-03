/**
 * Map tool types
 */
export enum MapTool {
  PAN = 'pan',
  SELECT = 'select',
  MEASURE = 'measure',
  DRAW = 'draw',
}

/**
 * Measurement types
 */
export enum MeasurementType {
  DISTANCE = 'distance',
  AREA = 'area',
}

/**
 * Measurement units
 */
export enum MeasurementUnit {
  FEET = 'feet',
  METERS = 'meters',
  MILES = 'miles',
}

/**
 * Map layer style interface
 */
export interface MapLayerStyle {
  color: string;
  weight: number;
  fillOpacity: number;
  fillColor?: string;
}

/**
 * Map layer interface
 */
export interface MapLayer {
  id?: number;
  name: string;
  visible: boolean;
  style: MapLayerStyle;
  source?: string;
}

/**
 * GeoJSON Feature interface
 */
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
  properties?: Record<string, any>;
  id?: string | number;
}

/**
 * Converts measurement from one unit to another
 * @param value - The measurement value
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @param isArea - Whether the measurement is an area (square units)
 * @returns The converted measurement value
 */
export function convertMeasurement(
  value: number,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit,
  isArea: boolean = false
): number {
  // Define conversion factors to meters
  const toMeters = {
    [MeasurementUnit.FEET]: 0.3048,
    [MeasurementUnit.METERS]: 1,
    [MeasurementUnit.MILES]: 1609.34,
  };

  // Convert to meters first
  let meters = value * toMeters[fromUnit];
  
  // If it's an area, square the conversion factor
  if (isArea) {
    meters = value * (toMeters[fromUnit] ** 2);
  }
  
  // Convert from meters to target unit
  let result: number;
  if (isArea) {
    result = meters / (toMeters[toUnit] ** 2);
  } else {
    result = meters / toMeters[toUnit];
  }
  
  return result;
}

/**
 * Formats a measurement value with appropriate units and precision
 * @param value - The measurement value
 * @param unit - The measurement unit
 * @param isArea - Whether the measurement is an area (square units)
 * @returns Formatted measurement string
 */
export function formatMeasurement(
  value: number,
  unit: MeasurementUnit,
  isArea: boolean = false
): string {
  const precision = value < 10 ? 2 : value < 100 ? 1 : 0;
  const formatted = value.toFixed(precision);
  
  let unitStr: string;
  switch (unit) {
    case MeasurementUnit.FEET:
      unitStr = isArea ? 'sq ft' : 'ft';
      break;
    case MeasurementUnit.METERS:
      unitStr = isArea ? 'sq m' : 'm';
      break;
    case MeasurementUnit.MILES:
      unitStr = isArea ? 'sq mi' : 'mi';
      break;
    default:
      unitStr = '';
  }
  
  return `${formatted} ${unitStr}`;
}

/**
 * Formats a distance measurement with appropriate units and precision
 * @param value - The distance value in the provided unit
 * @param unit - The measurement unit
 * @returns Formatted distance string
 */
export function formatDistance(value: number, unit: MeasurementUnit): string {
  return formatMeasurement(value, unit, false);
}

/**
 * Formats an area measurement with appropriate units and precision
 * @param value - The area value in the provided unit
 * @param unit - The measurement unit
 * @returns Formatted area string
 */
export function formatArea(value: number, unit: MeasurementUnit): string {
  return formatMeasurement(value, unit, true);
}

/**
 * Get appropriate color for map features based on feature type
 * @param featureType - The type of the feature
 * @returns Color string (hex code)
 */
export function getFeatureColor(featureType: string): string {
  const colorMap: Record<string, string> = {
    parcel: '#3388ff',
    road: '#666666',
    building: '#cc4444',
    water: '#3399cc',
    boundary: '#884422',
    zone: '#44bb33',
    highlight: '#ffaa00',
    selection: '#ff3300',
    default: '#999999'
  };
  
  return colorMap[featureType] || colorMap.default;
}

/**
 * Calculates appropriate zoom level to fit a bounding box on the map
 * @param bounds - The bounding box [minLat, minLng, maxLat, maxLng]
 * @param mapWidth - Width of the map container in pixels
 * @param mapHeight - Height of the map container in pixels
 * @param paddingRatio - Padding ratio to apply (0 to 1)
 * @returns Appropriate zoom level
 */
export function calculateZoomLevel(
  bounds: [number, number, number, number],
  mapWidth: number, 
  mapHeight: number,
  paddingRatio: number = 0.1
): number {
  const [minLat, minLng, maxLat, maxLng] = bounds;
  const latDiff = Math.abs(maxLat - minLat);
  const lngDiff = Math.abs(maxLng - minLng);
  
  // Apply padding
  const effectiveWidth = mapWidth * (1 - paddingRatio * 2);
  const effectiveHeight = mapHeight * (1 - paddingRatio * 2);
  
  // Calculate zoom level for width and height
  const latZoom = Math.log2(360 / latDiff / (effectiveHeight / 256));
  const lngZoom = Math.log2(360 / lngDiff / (effectiveWidth / 256));
  
  // Take the smaller zoom level to ensure the entire bounds fits
  return Math.floor(Math.min(latZoom, lngZoom));
}

/**
 * Converts square meters to acres
 * @param squareMeters - Area in square meters
 * @returns Area in acres
 */
export function squareMetersToAcres(squareMeters: number): number {
  // 1 acre = 4046.86 square meters
  return squareMeters / 4046.86;
}

/**
 * Converts acres to square meters
 * @param acres - Area in acres
 * @returns Area in square meters
 */
export function acresToSquareMeters(acres: number): number {
  // 1 acre = 4046.86 square meters
  return acres * 4046.86;
}

/**
 * Converts square meters to square feet
 * @param squareMeters - Area in square meters
 * @returns Area in square feet
 */
export function squareMetersToSquareFeet(squareMeters: number): number {
  // 1 square meter = 10.7639 square feet
  return squareMeters * 10.7639;
}

/**
 * Converts square feet to square meters
 * @param squareFeet - Area in square feet
 * @returns Area in square meters
 */
export function squareFeetToSquareMeters(squareFeet: number): number {
  // 1 square foot = 0.092903 square meters
  return squareFeet * 0.092903;
}

/**
 * Default map layers provided for basic map functionality
 */
export const DEFAULT_MAP_LAYERS: MapLayer[] = [
  {
    id: 1,
    name: "Parcels",
    visible: true,
    style: {
      color: "#3B82F6",
      weight: 2,
      fillOpacity: 0.2,
      fillColor: "#93C5FD"
    },
    source: "county_gis"
  },
  {
    id: 2,
    name: "Roads",
    visible: true,
    style: {
      color: "#6B7280",
      weight: 1.5,
      fillOpacity: 0
    },
    source: "county_gis"
  },
  {
    id: 3,
    name: "Buildings",
    visible: true,
    style: {
      color: "#4B5563",
      weight: 1,
      fillOpacity: 0.4,
      fillColor: "#9CA3AF"
    },
    source: "county_gis"
  },
  {
    id: 4,
    name: "Aerial Imagery",
    visible: false,
    style: {
      color: "transparent",
      weight: 0,
      fillOpacity: 0
    },
    source: "satellite_imagery"
  },
  {
    id: 5,
    name: "Zoning",
    visible: false,
    style: {
      color: "#10B981",
      weight: 1,
      fillOpacity: 0.3,
      fillColor: "#6EE7B7"
    },
    source: "county_gis"
  },
  {
    id: 6,
    name: "Floodplains",
    visible: false,
    style: {
      color: "#60A5FA",
      weight: 1,
      fillOpacity: 0.2,
      fillColor: "#93C5FD"
    },
    source: "arcgis"
  }
];

/**
 * Validates if a string is a valid parcel number format
 * @param parcelNumber - The parcel number to validate
 * @returns Whether the parcel number is valid
 */
export function isValidParcelNumber(parcelNumber: string): boolean {
  // Example validation for a parcel number format like "123-45-678"
  const parcelRegex = /^\d{1,3}-\d{1,2}-\d{1,3}$/;
  return parcelRegex.test(parcelNumber);
}