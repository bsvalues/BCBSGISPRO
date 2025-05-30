import express from 'express';
import { asyncHandler } from '../error-handler';

const router = express.Router();

/**
 * Map services API routes
 * 
 * These routes handle map-related services such as
 * providing API keys, tokens, and configuration for
 * various mapping providers.
 */

// Mapbox token endpoint
router.get('/mapbox-token', asyncHandler(async (req, res) => {
  // Use environment variable for Mapbox token
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  
  if (!token) {
    return res.status(404).json({ 
      success: false, 
      error: {
        code: 'TOKEN_NOT_FOUND',
        message: 'Mapbox token not configured'
      }
    });
  }
  
  res.json({ 
    success: true, 
    token 
  });
}));

// ArcGIS API key endpoint
router.get('/arcgis-api-key', asyncHandler(async (req, res) => {
  // Use environment variable for ArcGIS API key
  const apiKey = process.env.ARCGIS_API_KEY;
  
  if (!apiKey) {
    return res.status(404).json({ 
      success: false, 
      error: {
        code: 'API_KEY_NOT_FOUND',
        message: 'ArcGIS API key not configured'
      }
    });
  }
  
  res.json({ 
    success: true, 
    apiKey 
  });
}));

export default router;