/**
 * A simplified ArcGIS REST service client that can fetch data from ArcGIS REST endpoints
 * without requiring the full ArcGIS JavaScript SDK.
 */

// Base ArcGIS REST endpoint
const BASE_URL = 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services';

// Supported request formats
type RequestFormat = 'json' | 'geojson' | 'html' | 'pbf';

// Feature service query parameters
interface QueryParams {
  where?: string;
  objectIds?: string;
  geometry?: string;
  geometryType?: 'esriGeometryPoint' | 'esriGeometryPolyline' | 'esriGeometryPolygon' | 'esriGeometryEnvelope';
  spatialRel?: 'esriSpatialRelIntersects' | 'esriSpatialRelContains' | 'esriSpatialRelCrosses' | 'esriSpatialRelEnvelopeIntersects' | 'esriSpatialRelIndexIntersects' | 'esriSpatialRelOverlaps' | 'esriSpatialRelTouches' | 'esriSpatialRelWithin';
  outFields?: string | string[];
  returnGeometry?: boolean;
  maxAllowableOffset?: number;
  geometryPrecision?: number;
  outSR?: number;
  returnIdsOnly?: boolean;
  returnCountOnly?: boolean;
  orderByFields?: string | string[];
  groupByFieldsForStatistics?: string | string[];
  outStatistics?: any;
  returnZ?: boolean;
  returnM?: boolean;
  multipatchOption?: 'xyFootprint';
  resultOffset?: number;
  resultRecordCount?: number;
  returnExtentOnly?: boolean;
  datumTransformation?: number;
  quantizationParameters?: any;
  featureEncoding?: 'esriDefault' | 'esriGeometryProperties';
  [key: string]: any;
}

/**
 * Convert an object into a URL query string
 */
function toQueryString(params: Record<string, any>): string {
  const parts: string[] = [];
  
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    
    if (Array.isArray(value)) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.join(','))}`);
    } else if (typeof value === 'object') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`);
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  
  return parts.join('&');
}

/**
 * Fetch a list of services available at the specified endpoint
 */
export async function fetchServiceList(): Promise<any> {
  const url = `${BASE_URL}?f=json`;
  
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error fetching ArcGIS services:', error);
    throw error;
  }
}

/**
 * Fetch information about a specific service
 */
export async function fetchServiceInfo(serviceName: string, serviceType: 'FeatureServer' | 'MapServer' = 'FeatureServer'): Promise<any> {
  const url = `${BASE_URL}/${serviceName}/${serviceType}?f=json`;
  
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching service info for ${serviceName}:`, error);
    throw error;
  }
}

/**
 * Fetch layer information from a service
 */
export async function fetchLayerInfo(serviceName: string, layerId: number, serviceType: 'FeatureServer' | 'MapServer' = 'FeatureServer'): Promise<any> {
  const url = `${BASE_URL}/${serviceName}/${serviceType}/${layerId}?f=json`;
  
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching layer info for ${serviceName}/${layerId}:`, error);
    throw error;
  }
}

/**
 * Query features from a specific layer
 */
export async function queryFeatures(
  serviceName: string, 
  layerId: number, 
  queryParams: QueryParams = {}, 
  serviceType: 'FeatureServer' | 'MapServer' = 'FeatureServer',
  format: RequestFormat = 'json'
): Promise<any> {
  // Ensure required parameters are set
  const params = {
    f: format,
    where: queryParams.where || '1=1',
    outFields: queryParams.outFields || '*',
    returnGeometry: queryParams.returnGeometry !== undefined ? queryParams.returnGeometry : true,
    ...queryParams
  };
  
  if (Array.isArray(params.outFields)) {
    params.outFields = params.outFields.join(',');
  }
  
  if (Array.isArray(params.orderByFields)) {
    params.orderByFields = params.orderByFields.join(',');
  }
  
  const queryString = toQueryString(params);
  const url = `${BASE_URL}/${serviceName}/${serviceType}/${layerId}/query?${queryString}`;
  
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(`Error querying features from ${serviceName}/${layerId}:`, error);
    throw error;
  }
}

// MapImageParams interface with correct types
interface MapImageParams {
  layers?: string;
  layerDefs?: Record<string, string>;
  bbox?: [number, number, number, number];
  size?: [number, number];
  dpi?: number;
  imageSR?: number;
  bboxSR?: number;
  format?: 'png' | 'png8' | 'png24' | 'jpg' | 'pdf' | 'bmp' | 'gif' | 'svg' | 'png32';
  transparent?: boolean;
  time?: string;
  layerTimeOptions?: any;
  dynamicLayers?: any;
  [key: string]: any;
}

// Extended params with processed string versions for URL
interface ProcessedParams {
  f: string;
  format: string;
  transparent: boolean;
  layers?: string;
  layerDefs?: string;
  bbox?: string;
  size?: string;
  dpi?: number;
  imageSR?: number;
  bboxSR?: number;
  time?: string;
  [key: string]: any;
}

/**
 * Get map image from a MapServer
 */
export function getMapImageUrl(
  serviceName: string,
  params: MapImageParams = {}
): string {
  // Create a copy of params to avoid modifying the input
  const processedParams: ProcessedParams = {
    f: 'image',
    format: params.format || 'png',
    transparent: params.transparent !== undefined ? params.transparent : true
  };
  
  // Copy remaining params
  Object.keys(params).forEach(key => {
    if (key !== 'layerDefs' && key !== 'bbox' && key !== 'size') {
      processedParams[key] = params[key as keyof MapImageParams];
    }
  });
  
  // Convert layerDefs to the expected format
  if (params.layerDefs) {
    processedParams.layerDefs = JSON.stringify(params.layerDefs);
  }
  
  // Convert bbox to the expected format
  if (params.bbox) {
    processedParams.bbox = params.bbox.join(',');
  }
  
  // Convert size to the expected format
  if (params.size) {
    processedParams.size = params.size.join(',');
  }
  
  const queryString = toQueryString(processedParams);
  return `${BASE_URL}/${serviceName}/MapServer/export?${queryString}`;
}

/**
 * Export a simple helper to format feature service URLs
 */
export function getFeatureServiceUrl(serviceName: string, layerId?: number): string {
  if (layerId !== undefined) {
    return `${BASE_URL}/${serviceName}/FeatureServer/${layerId}`;
  }
  return `${BASE_URL}/${serviceName}/FeatureServer`;
}

/**
 * Helper to get ArcGIS REST API formatted bounding box from two coordinates
 */
export function getBoundingBox(
  sw: [number, number], 
  ne: [number, number]
): [number, number, number, number] {
  return [sw[0], sw[1], ne[0], ne[1]];
}

// Basic GeoJSON type definitions
type Position = number[];
type Point = { type: 'Point'; coordinates: Position };
type LineString = { type: 'LineString'; coordinates: Position[] };
type MultiLineString = { type: 'MultiLineString'; coordinates: Position[][] };
type Polygon = { type: 'Polygon'; coordinates: Position[][] };
type MultiPolygon = { type: 'MultiPolygon'; coordinates: Position[][][] };
type Geometry = Point | LineString | MultiLineString | Polygon | MultiPolygon | null;
type GeoJSONFeature = { type: 'Feature'; id?: string | number; properties: Record<string, any>; geometry: Geometry };

/**
 * Process GeoJSON from ArcGIS feature service response
 */
export function processFeatureServiceToGeoJSON(featureResponse: any): { 
  type: 'FeatureCollection'; 
  features: GeoJSONFeature[] 
} {
  // If the response is already in GeoJSON format, return it
  if (featureResponse.type === 'FeatureCollection') {
    return featureResponse;
  }

  // Convert Esri JSON to GeoJSON format
  const features = featureResponse.features || [];
  
  return {
    type: 'FeatureCollection',
    features: features.map((feature: any) => {
      // Convert ESRI geometry to GeoJSON geometry
      let geometry: Geometry = null;
      
      if (feature.geometry) {
        if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
          // Point
          const pointCoords: Position = [feature.geometry.x, feature.geometry.y];
          
          // Add Z coordinate if present
          if (feature.geometry.z !== undefined) {
            pointCoords.push(feature.geometry.z);
          }
          
          geometry = {
            type: 'Point',
            coordinates: pointCoords
          };
        } else if (feature.geometry.paths) {
          // Polyline
          if (feature.geometry.paths.length === 1) {
            geometry = {
              type: 'LineString',
              coordinates: feature.geometry.paths[0]
            };
          } else {
            geometry = {
              type: 'MultiLineString',
              coordinates: feature.geometry.paths
            };
          }
        } else if (feature.geometry.rings) {
          // Polygon
          if (feature.geometry.rings.length === 1) {
            geometry = {
              type: 'Polygon',
              coordinates: feature.geometry.rings
            };
          } else {
            geometry = {
              type: 'MultiPolygon',
              coordinates: feature.geometry.rings
            };
          }
        }
      }
      
      const geoJsonFeature: GeoJSONFeature = {
        type: 'Feature',
        id: feature.id || feature.attributes?.OBJECTID || feature.attributes?.FID,
        properties: feature.attributes || {},
        geometry
      };
      
      return geoJsonFeature;
    })
  };
}

/**
 * Client class for working with ArcGIS REST services
 */
export class ArcGISRestClient {
  private baseUrl: string;
  
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }
  
  async getServices(): Promise<any> {
    return fetchServiceList();
  }
  
  async getServiceInfo(serviceName: string, serviceType: 'FeatureServer' | 'MapServer' = 'FeatureServer'): Promise<any> {
    return fetchServiceInfo(serviceName, serviceType);
  }
  
  async getLayerInfo(serviceName: string, layerId: number, serviceType: 'FeatureServer' | 'MapServer' = 'FeatureServer'): Promise<any> {
    return fetchLayerInfo(serviceName, layerId, serviceType);
  }
  
  async queryFeatures(
    serviceName: string, 
    layerId: number, 
    queryParams: QueryParams = {}, 
    serviceType: 'FeatureServer' | 'MapServer' = 'FeatureServer'
  ): Promise<any> {
    return queryFeatures(serviceName, layerId, queryParams, serviceType);
  }
  
  getMapImageUrl(serviceName: string, params: MapImageParams = {}): string {
    return getMapImageUrl(serviceName, params);
  }
}

// Export a default client instance
export default new ArcGISRestClient();