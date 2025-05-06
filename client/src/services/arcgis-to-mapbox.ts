/**
 * ArcGIS to MapBox Integration Service
 * 
 * This service handles fetching and transforming ArcGIS data from Benton County's
 * services for use in MapBox GL JS.
 */

import { Feature, FeatureCollection, Geometry } from 'geojson';

// Benton County Parcel API endpoints
const ARCGIS_REST_SERVICES_URL = 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services';
const PARCEL_FEATURE_SERVICE = `${ARCGIS_REST_SERVICES_URL}/Parcels_and_Assess/FeatureServer/0`;

// Other useful services
const SHORT_PLATS_SERVICE = `${ARCGIS_REST_SERVICES_URL}/Short_Plats/FeatureServer/0`;
const LONG_PLATS_SERVICE = `${ARCGIS_REST_SERVICES_URL}/Long_Plats/FeatureServer/0`;
const FLOOD_ZONES_SERVICE = `${ARCGIS_REST_SERVICES_URL}/Flood_Zones/FeatureServer/0`;
const ZONING_SERVICE = `${ARCGIS_REST_SERVICES_URL}/Zoning/FeatureServer/0`;

/**
 * Fetch ArcGIS Feature Service as GeoJSON
 * 
 * @param url The ArcGIS Feature Service URL
 * @param params Optional query parameters
 * @returns GeoJSON FeatureCollection
 */
export async function fetchArcGISAsGeoJSON(
  url: string, 
  params: Record<string, string> = {}
): Promise<FeatureCollection> {
  try {
    // Build query parameters
    const defaultParams = {
      f: 'geojson',
      outFields: '*',
      where: '1=1',
      outSR: '4326', // WGS84
      ...params
    };
    
    const queryParams = new URLSearchParams(defaultParams).toString();
    const requestUrl = `${url}/query?${queryParams}`;
    
    console.log(`Fetching ArcGIS data from: ${requestUrl}`);
    
    const response = await fetch(requestUrl);
    
    if (!response.ok) {
      throw new Error(`Error fetching GeoJSON: ${response.statusText}`);
    }
    
    const geojson = await response.json();
    return geojson;
  } catch (error) {
    console.error('Error fetching ArcGIS data:', error);
    throw error;
  }
}

/**
 * Fetch Benton County parcels
 * 
 * @param extent Optional bounding box [xmin, ymin, xmax, ymax]
 * @param limit Maximum number of features to return
 * @returns GeoJSON FeatureCollection of parcels
 */
export async function fetchBentonCountyParcels(
  extent?: [number, number, number, number], 
  limit: number = 1000
): Promise<FeatureCollection> {
  try {
    const params: Record<string, string> = { 
      resultRecordCount: limit.toString() 
    };
    
    // Add spatial filter if extent is provided
    if (extent) {
      params.geometry = extent.join(',');
      params.geometryType = 'esriGeometryEnvelope';
      params.spatialRel = 'esriSpatialRelIntersects';
    }
    
    return await fetchArcGISAsGeoJSON(PARCEL_FEATURE_SERVICE, params);
  } catch (error) {
    console.error('Error fetching Benton County parcels:', error);
    throw error;
  }
}

/**
 * Fetch a specific parcel by APN (Assessor's Parcel Number)
 * 
 * @param apn The Assessor's Parcel Number
 * @returns GeoJSON Feature for the parcel
 */
export async function fetchParcelByAPN(apn: string): Promise<Feature | null> {
  try {
    const params = {
      where: `APN='${apn}'`,
      outFields: '*'
    };
    
    const result = await fetchArcGISAsGeoJSON(PARCEL_FEATURE_SERVICE, params);
    
    if (result.features.length === 0) {
      console.warn(`No parcel found with APN: ${apn}`);
      return null;
    }
    
    return result.features[0];
  } catch (error) {
    console.error(`Error fetching parcel by APN ${apn}:`, error);
    throw error;
  }
}

/**
 * Fetch parcels by owner name
 * 
 * @param ownerName The owner name to search for
 * @param limit Maximum number of results to return
 * @returns GeoJSON FeatureCollection of matching parcels
 */
export async function fetchParcelsByOwner(
  ownerName: string, 
  limit: number = 100
): Promise<FeatureCollection> {
  try {
    // Note: This assumes there's an OWNER field in the data
    // Adjust the field name if needed based on the actual schema
    const params = {
      where: `OWNER LIKE '%${ownerName.toUpperCase()}%'`,
      outFields: '*',
      resultRecordCount: limit.toString()
    };
    
    return await fetchArcGISAsGeoJSON(PARCEL_FEATURE_SERVICE, params);
  } catch (error) {
    console.error(`Error fetching parcels by owner ${ownerName}:`, error);
    throw error;
  }
}

/**
 * Fetch Short Plats
 * 
 * @param extent Optional bounding box [xmin, ymin, xmax, ymax]
 * @param limit Maximum number of features to return
 * @returns GeoJSON FeatureCollection of short plats
 */
export async function fetchShortPlats(
  extent?: [number, number, number, number],
  limit: number = 100
): Promise<FeatureCollection> {
  try {
    const params: Record<string, string> = { 
      resultRecordCount: limit.toString() 
    };
    
    // Add spatial filter if extent is provided
    if (extent) {
      params.geometry = extent.join(',');
      params.geometryType = 'esriGeometryEnvelope';
      params.spatialRel = 'esriSpatialRelIntersects';
    }
    
    return await fetchArcGISAsGeoJSON(SHORT_PLATS_SERVICE, params);
  } catch (error) {
    console.error('Error fetching Short Plats:', error);
    throw error;
  }
}

/**
 * Fetch Long Plats
 * 
 * @param extent Optional bounding box [xmin, ymin, xmax, ymax]
 * @param limit Maximum number of features to return
 * @returns GeoJSON FeatureCollection of long plats
 */
export async function fetchLongPlats(
  extent?: [number, number, number, number],
  limit: number = 100
): Promise<FeatureCollection> {
  try {
    const params: Record<string, string> = { 
      resultRecordCount: limit.toString() 
    };
    
    // Add spatial filter if extent is provided
    if (extent) {
      params.geometry = extent.join(',');
      params.geometryType = 'esriGeometryEnvelope';
      params.spatialRel = 'esriSpatialRelIntersects';
    }
    
    return await fetchArcGISAsGeoJSON(LONG_PLATS_SERVICE, params);
  } catch (error) {
    console.error('Error fetching Long Plats:', error);
    throw error;
  }
}

/**
 * Get all available ArcGIS services for Benton County
 * 
 * @returns List of available services
 */
export async function getBentonCountyServices(): Promise<string[]> {
  try {
    const response = await fetch(`${ARCGIS_REST_SERVICES_URL}?f=json`);
    
    if (!response.ok) {
      throw new Error(`Error fetching service list: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.services.map((service: any) => service.name);
  } catch (error) {
    console.error('Error fetching Benton County services:', error);
    throw error;
  }
}

// Export constants for use elsewhere
export {
  ARCGIS_REST_SERVICES_URL,
  PARCEL_FEATURE_SERVICE,
  SHORT_PLATS_SERVICE,
  LONG_PLATS_SERVICE,
  FLOOD_ZONES_SERVICE,
  ZONING_SERVICE
};