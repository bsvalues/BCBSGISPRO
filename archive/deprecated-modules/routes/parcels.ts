import express from "express";
import fetch from "node-fetch";

// Authentic Benton County ArcGIS REST endpoints
const ARCGIS_REST_SERVICES_URL = 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services';
const PARCEL_FEATURE_SERVICE = `${ARCGIS_REST_SERVICES_URL}/Parcels_and_Assess/FeatureServer/0`;

const router = express.Router();

/**
 * Fetch data from ArcGIS service and convert to GeoJSON - REAL DATA ONLY
 */
async function fetchBentonCountyParcels(limit: number = 1000): Promise<any> {
  // Set up query parameters for the ArcGIS REST API
  const queryParams = new URLSearchParams({
    f: 'geojson',  // Request GeoJSON format
    outFields: '*', // Return all attributes
    where: '1=1',   // Return all features
    resultRecordCount: limit.toString()
  });

  try {
    // Make request to ArcGIS service
    const response = await fetch(`${PARCEL_FEATURE_SERVICE}/query?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`ArcGIS service error: ${response.status} ${response.statusText}`);
    }
    
    const geojson = await response.json();
    return geojson;
  } catch (error) {
    console.error('Error fetching from ArcGIS:', error);
    // Return empty feature collection - NEVER fallback to fake data
    return {
      type: "FeatureCollection",
      features: []
    };
  }
}

// GET /api/parcels
// Returns ONLY real parcel data from Benton County GIS service
router.get("/", async (req, res) => {
  try {
    // Get limit parameter from query string, default to 1000
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;
    
    // Fetch real Benton County parcel data
    const parcels = await fetchBentonCountyParcels(limit);
    res.json(parcels);
  } catch (error) {
    console.error("Error fetching parcels:", error);
    res.status(500).json({ error: "Failed to fetch parcel data" });
  }
});

export default router;