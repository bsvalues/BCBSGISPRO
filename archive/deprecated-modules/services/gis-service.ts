import fetch from 'node-fetch';
import { Feature, FeatureCollection } from 'geojson';

// Authentic Benton County ArcGIS REST endpoints
const ARCGIS_REST_SERVICES_URL = 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services';
const PARCEL_FEATURE_SERVICE = `${ARCGIS_REST_SERVICES_URL}/Parcels_and_Assess/FeatureServer/0`;
const SHORT_PLATS_SERVICE = `${ARCGIS_REST_SERVICES_URL}/Short_Plats/FeatureServer/0`;
const LONG_PLATS_SERVICE = `${ARCGIS_REST_SERVICES_URL}/Long_Plats/FeatureServer/0`;
const FLOOD_ZONES_SERVICE = `${ARCGIS_REST_SERVICES_URL}/Flood_Zones/FeatureServer/0`;

/**
 * Fetch data from ArcGIS service and convert to GeoJSON
 * @param serviceUrl The ArcGIS REST service URL
 * @param params Optional query parameters
 * @returns GeoJSON FeatureCollection
 */
async function fetchArcGISAsGeoJSON(
  serviceUrl: string,
  params: Record<string, string> = {}
): Promise<FeatureCollection> {
  // Set up query parameters for the ArcGIS REST API
  const queryParams = new URLSearchParams({
    f: 'geojson',  // Request GeoJSON format
    outFields: '*', // Return all attributes
    where: '1=1',   // Return all features
    ...params
  });

  try {
    // Make request to ArcGIS service
    const response = await fetch(`${serviceUrl}/query?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`ArcGIS service error: ${response.status} ${response.statusText}`);
    }
    
    const geojson = await response.json();
    return geojson as FeatureCollection;
  } catch (error) {
    console.error('Error fetching from ArcGIS:', error);
    throw error;
  }
}

/**
 * Fetch Benton County parcels - always from the real ArcGIS service
 * Never returns fake or sample data
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
    // Return empty feature collection - NEVER fallback to fake data
    return {
      type: "FeatureCollection",
      features: []
    };
  }
}

/**
 * Get real event data from Benton County
 * Currently returns empty array if data can't be accessed
 */
export async function fetchBentonCountyEvents(): Promise<any[]> {
  try {
    // This would connect to a real database or service with Benton County events
    // For now, return an empty array
    return [];
  } catch (error) {
    console.error('Error fetching Benton County events:', error);
    return [];
  }
}

/**
 * Get real metrics data from Benton County
 * Returns null if data can't be accessed
 */
export async function fetchBentonCountyMetrics(): Promise<any | null> {
  try {
    // This would connect to a real database or service with Benton County metrics
    // For now, return null
    return null;
  } catch (error) {
    console.error('Error fetching Benton County metrics:', error);
    return null;
  }
}