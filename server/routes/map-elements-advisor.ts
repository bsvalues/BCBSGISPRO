import { Router, Request, Response } from 'express';
import { mapElementsAdvisorService } from '../services/map-elements-advisor';
import asyncHandler from 'express-async-handler';

/**
 * Map Elements Advisor routes
 */
const router = Router();

/**
 * Get standard map elements
 * 
 * @route GET /standards
 * @returns {Object} Standard map elements
 */
router.get('/standards', asyncHandler(async (req: Request, res: Response) => {
  try {
    const elements = await mapElementsAdvisorService.getStandardElements();
    res.json({ elements });
  } catch (error) {
    console.error('Error fetching standard map elements:', error);
    res.status(500).json({ error: 'Failed to fetch standard map elements' });
  }
}));

/**
 * Evaluate a map description
 * 
 * @route POST /evaluate
 * @param {Object} req.body.mapDescription - Description of the map
 * @param {Object} req.body.mapPurpose - Purpose of the map
 * @param {Object} req.body.mapContext - Additional context (optional)
 * @returns {Object} Evaluation results
 */
router.post('/evaluate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { mapDescription, mapPurpose, mapContext } = req.body;
    
    if (!mapDescription) {
      return res.status(400).json({ error: 'Map description is required' });
    }
    
    if (!mapPurpose) {
      return res.status(400).json({ error: 'Map purpose is required' });
    }
    
    const evaluation = await mapElementsAdvisorService.evaluateMapDescription(
      mapDescription,
      mapPurpose,
      mapContext
    );
    
    res.json(evaluation);
  } catch (error) {
    console.error('Error evaluating map:', error);
    res.status(500).json({ error: 'Failed to evaluate map' });
  }
}));

/**
 * Get detailed suggestions for implementing a specific map element
 * 
 * @route POST /suggestions
 * @param {Object} req.body.elementId - ID of the element
 * @param {Object} req.body.mapDescription - Description of the map for context
 * @returns {Object} Detailed suggestions
 */
router.post('/suggestions', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { elementId, mapDescription } = req.body;
    
    if (!elementId) {
      return res.status(400).json({ error: 'Element ID is required' });
    }
    
    if (!mapDescription) {
      return res.status(400).json({ error: 'Map description is required for context' });
    }
    
    const result = await mapElementsAdvisorService.getElementSuggestions(
      elementId,
      mapDescription
    );
    
    res.json({ 
      elementId,
      elementName: result.element.name,
      suggestions: result.suggestions
    });
  } catch (error) {
    console.error('Error getting element suggestions:', error);
    res.status(500).json({ error: 'Failed to get element suggestions' });
  }
}));

export default router;