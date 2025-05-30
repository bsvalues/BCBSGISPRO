import { Router } from 'express';
import { mapElementsAdvisorService } from '../services/map-elements-advisor';

const router = Router();

/**
 * GET /api/map-elements/standard
 * Get standard map elements
 */
router.get('/standard', (req, res) => {
  try {
    const elements = mapElementsAdvisorService.getStandardMapElements();
    res.json(elements);
  } catch (error) {
    console.error('Error fetching standard map elements:', error);
    res.status(500).json({ error: 'Failed to fetch standard map elements' });
  }
});

/**
 * POST /api/map-elements/evaluate
 * Evaluate a map description and provide AI-powered suggestions
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { mapDescription, mapPurpose, mapContext } = req.body;
    
    if (!mapDescription || !mapPurpose) {
      return res.status(400).json({ error: 'Map description and purpose are required' });
    }
    
    const result = await mapElementsAdvisorService.evaluateMapElements(
      mapDescription,
      mapPurpose,
      mapContext
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error evaluating map elements:', error);
    res.status(500).json({ error: 'Failed to evaluate map elements' });
  }
});

/**
 * POST /api/map-elements/suggestions/:elementId
 * Get detailed AI suggestions for a specific map element
 */
router.post('/suggestions/:elementId', async (req, res) => {
  try {
    const { elementId } = req.params;
    const { mapDescription } = req.body;
    
    if (!elementId || !mapDescription) {
      return res.status(400).json({ 
        error: 'Element ID and map description are required' 
      });
    }
    
    const result = await mapElementsAdvisorService.getElementSuggestions(
      elementId,
      mapDescription
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error getting element suggestions:', error);
    res.status(500).json({ error: 'Failed to get element suggestions' });
  }
});

export default router;