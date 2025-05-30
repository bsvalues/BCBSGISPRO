/**
 * Services for fetching real Benton County GIS data from ArcGIS services
 * 
 * This module connects directly to Benton County's official ArcGIS services
 * and never returns or falls back to synthetic/mock data.
 */

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
): Promise<any> {
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
    return geojson;
  } catch (error) {
    console.error('Error fetching from ArcGIS:', error);
    throw error;
  }
}

/**
 * Fetch Benton County parcels from their real ArcGIS service
 * Never returns fake or sample data
 */
export async function fetchBentonCountyParcels(
  extent?: [number, number, number, number],
  limit: number = 1000
): Promise<any> {
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
 * Fetch long plats from Benton County's real ArcGIS service
 */
export async function fetchLongPlats(
  limit: number = 1000
): Promise<any> {
  try {
    const params: Record<string, string> = { 
      resultRecordCount: limit.toString() 
    };
    return await fetchArcGISAsGeoJSON(LONG_PLATS_SERVICE, params);
  } catch (error) {
    console.error('Error fetching long plats:', error);
    // Return empty feature collection - NEVER fallback to fake data
    return {
      type: "FeatureCollection",
      features: []
    };
  }
}

/**
 * Get a list of all available Benton County GIS services
 */
export async function getBentonCountyServices(): Promise<string[]> {
  try {
    const response = await fetch(`${ARCGIS_REST_SERVICES_URL}?f=json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch services: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    
    // Return list of service names
    if (data && data.services && Array.isArray(data.services)) {
      return data.services.map((service: any) => service.name);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Benton County services:', error);
    return [];
  }
}