import { Router, Request, Response } from 'express';
import { mapElementsAdvisor } from '../services/map-elements-advisor';
import { logger } from '../logger';
import { z } from 'zod';

const router = Router();

// Schema for map evaluation request
const EvaluateMapSchema = z.object({
  mapDescription: z.string().min(1, "Map description is required"),
  mapPurpose: z.string().min(1, "Map purpose is required"),
  mapContext: z.string().optional()
});

// Schema for element suggestions request
const ElementSuggestionsSchema = z.object({
  elementId: z.string().min(1, "Element ID is required"),
  mapDescription: z.string().min(1, "Map description is required")
});

/**
 * Evaluate a map against best practices
 * POST /api/map-elements/evaluate
 */
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = EvaluateMapSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validationResult.error.format() 
      });
    }
    
    const { mapDescription, mapPurpose, mapContext } = validationResult.data;
    
    // Process the evaluation
    const result = await mapElementsAdvisor.evaluateMap(
      mapDescription,
      mapPurpose,
      mapContext
    );
    
    return res.json(result);
  } catch (error) {
    logger.error(`Error in /map-elements/evaluate: ${error.message}`);
    return res.status(500).json({ 
      error: "Failed to evaluate map",
      message: error.message 
    });
  }
});

/**
 * Get suggestions for a specific map element
 * POST /api/map-elements/suggestions
 */
router.post('/suggestions', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = ElementSuggestionsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validationResult.error.format() 
      });
    }
    
    const { elementId, mapDescription } = validationResult.data;
    
    // Get suggestions for the specified element
    const suggestions = await mapElementsAdvisor.getElementSuggestions(
      elementId,
      mapDescription
    );
    
    return res.json({ suggestions });
  } catch (error) {
    logger.error(`Error in /map-elements/suggestions: ${error.message}`);
    return res.status(500).json({ 
      error: "Failed to get suggestions",
      message: error.message 
    });
  }
});

/**
 * Get all standard map elements
 * GET /api/map-elements/standards
 */
router.get('/standards', async (req: Request, res: Response) => {
  try {
    const elements = mapElementsAdvisor.getStandardElements();
    return res.json({ elements });
  } catch (error) {
    logger.error(`Error in /map-elements/standards: ${error.message}`);
    return res.status(500).json({ 
      error: "Failed to get standard elements",
      message: error.message 
    });
  }
});

export default router;