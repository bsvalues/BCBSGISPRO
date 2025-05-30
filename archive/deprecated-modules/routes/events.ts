import express from "express";
import fetch from 'node-fetch';

const router = express.Router();

// Benton County REST API endpoint - would come from config in production
const BENTON_COUNTY_API = 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services';
const PLAT_ACTIVITY_SERVICE = `${BENTON_COUNTY_API}/PlatActivity/FeatureServer/0`;

/**
 * Fetch real Benton County events
 * Returns empty array if real data can't be accessed - NO FAKE DATA!
 */
async function fetchBentonCountyEvents(limit = 50): Promise<any[]> {
  try {
    // Set up query parameters for the ArcGIS REST API
    const queryParams = new URLSearchParams({
      f: 'json',  // Request json format
      outFields: '*', // Return all attributes
      where: '1=1',   // Return all features
      resultRecordCount: limit.toString(),
      orderByFields: 'OBJECTID DESC' // Most recent first
    });

    // Make request to real ArcGIS service
    const response = await fetch(`${PLAT_ACTIVITY_SERVICE}/query?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`ArcGIS service error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform the ArcGIS features into a more usable event format
    if (data && data.features && Array.isArray(data.features)) {
      return data.features.map((feature: any) => {
        const attributes = feature.attributes || {};
        return {
          id: attributes.OBJECTID || '',
          type: attributes.ActivityType || 'Unknown',
          description: attributes.Description || '',
          status: attributes.Status || 'Unknown',
          timestamp: attributes.CreatedDate ? new Date(attributes.CreatedDate).toISOString() : null,
          objectId: attributes.OBJECTID || null
        };
      });
    }
    
    // If no features, return empty array - NO FAKE DATA!
    return [];
  } catch (error) {
    console.error('Error fetching real Benton County events:', error);
    // Return empty array on error - NO FAKE DATA!
    return [];
  }
}

// GET /api/events
// Returns ONLY real Benton County event data
router.get("/", async (req, res) => {
  try {
    // Get limit parameter from query string, default to 50
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const events = await fetchBentonCountyEvents(limit);
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    // Return empty array on error - NEVER fallback to fake data!
    res.json([]);
  }
});

export default router;