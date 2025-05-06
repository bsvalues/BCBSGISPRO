import { Router } from 'express';
import { legalDescriptionService } from '../services/anthropic-service';
import { logger } from '../logger';

const router = Router();

/**
 * Parse a legal description into structured components
 * POST /api/legal-description/parse
 */
router.post('/parse', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ 
        error: 'Missing required field: description' 
      });
    }
    
    const parsedDescription = await legalDescriptionService.parseLegalDescription(description);
    
    return res.json({
      success: true,
      data: parsedDescription
    });
  } catch (error) {
    logger.error('Error parsing legal description:', error);
    return res.status(500).json({ 
      error: 'Failed to parse legal description',
      message: error.message
    });
  }
});

/**
 * Analyze a legal description for quality, issues and recommendations
 * POST /api/legal-description/analyze
 */
router.post('/analyze', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ 
        error: 'Missing required field: description' 
      });
    }
    
    const analysis = await legalDescriptionService.analyzeLegalDescription(description);
    
    return res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Error analyzing legal description:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze legal description',
      message: error.message
    });
  }
});

/**
 * Generate visualization data from a legal description
 * POST /api/legal-description/visualize
 */
router.post('/visualize', async (req, res) => {
  try {
    const { description, baseCoordinate } = req.body;
    
    if (!description) {
      return res.status(400).json({ 
        error: 'Missing required field: description' 
      });
    }
    
    const visualizationData = await legalDescriptionService.generateVisualizationData(description, baseCoordinate);
    
    return res.json({
      success: true,
      data: visualizationData
    });
  } catch (error) {
    logger.error('Error generating visualization data for legal description:', error);
    return res.status(500).json({ 
      error: 'Failed to generate visualization data',
      message: error.message
    });
  }
});

/**
 * Comprehensive analysis and visualization of a legal description
 * POST /api/legal-description/comprehensive
 */
router.post('/comprehensive', async (req, res) => {
  try {
    const { description, baseCoordinate } = req.body;
    
    if (!description) {
      return res.status(400).json({ 
        error: 'Missing required field: description' 
      });
    }

    // Run all services in parallel
    const [parsedDescription, analysis, visualizationData] = await Promise.all([
      legalDescriptionService.parseLegalDescription(description),
      legalDescriptionService.analyzeLegalDescription(description),
      legalDescriptionService.generateVisualizationData(description, baseCoordinate)
    ]);
    
    return res.json({
      success: true,
      data: {
        parsed: parsedDescription,
        analysis,
        visualization: visualizationData
      }
    });
  } catch (error) {
    logger.error('Error performing comprehensive legal description analysis:', error);
    return res.status(500).json({ 
      error: 'Failed to perform comprehensive analysis',
      message: error.message
    });
  }
});

export default router;