import { Router } from 'express';
import { asyncHandler } from '../error-handler';

const router = Router();

// Return the Mapbox access token stored in environment variables
router.get('/mapbox-token', asyncHandler(async (req, res) => {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  
  // Log all related environment variables for debugging
  console.log('MAPBOX TOKEN CHECK:');
  console.log(`  MAPBOX_ACCESS_TOKEN present: ${!!process.env.MAPBOX_ACCESS_TOKEN}`);
  console.log(`  VITE_MAPBOX_ACCESS_TOKEN present: ${!!process.env.VITE_MAPBOX_ACCESS_TOKEN}`);
  
  // Try to get token from different sources
  let token = mapboxToken;
  if (!token) {
    token = process.env.VITE_MAPBOX_ACCESS_TOKEN;
    console.log('Using VITE_MAPBOX_ACCESS_TOKEN as fallback');
  }
  
  if (!token) {
    console.error('No Mapbox token found in any environment variable');
    return res.status(500).json({
      error: 'Mapbox token not configured on server',
      message: 'The Mapbox access token is not set in the server environment'
    });
  }
  
  console.log('Successfully sending Mapbox token to client');
  res.json({ token });
}));

// Return mock ArcGIS services for demonstration
router.get('/arcgis-services', asyncHandler(async (req, res) => {
  try {
    // In a real application, this would fetch from Benton County's ArcGIS REST services
    // For demonstration purposes, we're returning mock data
    const mockServices = {
      currentVersion: 11.2,
      services: [
        {
          name: "Parcels_and_Assess",
          type: "MapServer",
          url: "https://services.arcgis.com/benton-county/arcgis/rest/services/Parcels_and_Assess/MapServer"
        },
        {
          name: "Streets",
          type: "MapServer",
          url: "https://services.arcgis.com/benton-county/arcgis/rest/services/Streets/MapServer"
        },
        {
          name: "Boundaries",
          type: "MapServer",
          url: "https://services.arcgis.com/benton-county/arcgis/rest/services/Boundaries/MapServer"
        },
        {
          name: "Zoning",
          type: "MapServer",
          url: "https://services.arcgis.com/benton-county/arcgis/rest/services/Zoning/MapServer"
        },
        {
          name: "Aerial2023",
          type: "MapServer", 
          url: "https://services.arcgis.com/benton-county/arcgis/rest/services/Aerial2023/MapServer"
        }
      ]
    };
    
    res.json(mockServices);
  } catch (error) {
    console.error('Error fetching ArcGIS services:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ArcGIS services',
      message: 'There was an error retrieving the ArcGIS service list'
    });
  }
}));

export default router;