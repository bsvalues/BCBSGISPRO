import express from 'express';
import { mapElementsAdvisorService } from '../services/map-elements-advisor';
import asyncHandler from 'express-async-handler';

const router = express.Router();

/**
 * GET /api/map-elements/standards
 * 
 * Get the standard map elements based on cartographic best practices
 */
router.get('/standards', asyncHandler(async (req, res) => {
  const elements = mapElementsAdvisorService.getStandardElements();
  res.json({ elements });
}));

/**
 * POST /api/map-elements/evaluate
 * 
 * Evaluate a map description against the standard map elements
 * 
 * Request body:
 * - mapDescription: Description of the map to evaluate
 * - mapPurpose: Purpose of the map
 * - mapContext: (Optional) Additional context about the map's usage
 */
router.post('/evaluate', asyncHandler(async (req, res) => {
  const { mapDescription, mapPurpose, mapContext } = req.body;
  
  if (!mapDescription) {
    res.status(400).json({ error: 'Map description is required' });
    return;
  }
  
  if (!mapPurpose) {
    res.status(400).json({ error: 'Map purpose is required' });
    return;
  }
  
  const evaluation = await mapElementsAdvisorService.evaluateMap(
    mapDescription,
    mapPurpose,
    mapContext
  );
  
  res.json(evaluation);
}));

/**
 * POST /api/map-elements/suggestions
 * 
 * Get detailed suggestions for implementing a specific map element
 * 
 * Request body:
 * - elementId: ID of the element to get suggestions for
 * - mapDescription: Description of the map for context
 */
router.post('/suggestions', asyncHandler(async (req, res) => {
  const { elementId, mapDescription } = req.body;
  
  if (!elementId) {
    res.status(400).json({ error: 'Element ID is required' });
    return;
  }
  
  if (!mapDescription) {
    res.status(400).json({ error: 'Map description is required' });
    return;
  }
  
  const suggestions = await mapElementsAdvisorService.getElementSuggestions(
    elementId,
    mapDescription
  );
  
  res.json({ suggestions });
}));

export default router;