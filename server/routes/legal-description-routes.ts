/**
 * Legal Description Routes
 * Endpoints for analyzing and visualizing legal descriptions
 */

import express from 'express';
import asyncHandler from 'express-async-handler';
import { logger } from '../logger';
import { ApiError } from '../error-handler';
import { 
  parseLegalDescription, 
  visualizeLegalDescription, 
  validateLegalDescription,
  getFairgroundParcels,
  getFairgroundParcel
} from '../services/legal-description-analyzer';

/**
 * Register legal description routes
 */
export function registerLegalDescriptionRoutes(app: express.Express) {
  // Get all predefined Fairground parcels
  app.get('/api/legal-description/fairground-parcels', asyncHandler(async (req, res) => {
    logger.info('Fetching all Fairground parcels');
    const parcels = getFairgroundParcels();
    
    return res.json({
      success: true,
      data: parcels
    });
  }));

  // Get a single Fairground parcel by ID
  app.get('/api/legal-description/fairground-parcels/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.info(`Fetching Fairground parcel by ID: ${id}`);
    
    const parcel = getFairgroundParcel(id);
    if (!parcel) {
      throw ApiError.notFound(`Parcel with ID ${id} not found`);
    }
    
    return res.json({
      success: true,
      data: parcel
    });
  }));

  // Parse a legal description
  app.post('/api/legal-description/parse', asyncHandler(async (req, res) => {
    const { description } = req.body;
    
    if (!description) {
      throw ApiError.badRequest('No legal description provided');
    }
    
    logger.info(`Processing parse request for legal description`);
    
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        logger.warn('OpenAI API key not configured, using basic parsing');
      }
      
      // Process the legal description
      const result = await parseLegalDescription(description);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Legal description parsing failed:', error);
      throw ApiError.internal(
        'Failed to parse legal description', 
        'LEGAL_DESCRIPTION_PARSE_ERROR',
        error instanceof Error ? { message: error.message } : {}
      );
    }
  }));

  // Visualize a legal description
  app.post('/api/legal-description/visualize', asyncHandler(async (req, res) => {
    const { description } = req.body;
    
    if (!description) {
      throw ApiError.badRequest('No legal description provided');
    }
    
    logger.info(`Processing visualization request for legal description`);
    
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        logger.warn('OpenAI API key not configured, using basic visualization');
      }
      
      // Process the legal description
      const result = await visualizeLegalDescription(description);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Legal description visualization failed:', error);
      throw ApiError.internal(
        'Failed to visualize legal description', 
        'LEGAL_DESCRIPTION_VISUALIZE_ERROR',
        error instanceof Error ? { message: error.message } : {}
      );
    }
  }));

  // Validate a legal description
  app.post('/api/legal-description/validate', asyncHandler(async (req, res) => {
    const { description } = req.body;
    
    if (!description) {
      throw ApiError.badRequest('No legal description provided');
    }
    
    logger.info(`Processing validation request for legal description`);
    
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        logger.warn('OpenAI API key not configured, using basic validation');
      }
      
      // Process the legal description
      const result = await validateLegalDescription(description);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Legal description validation failed:', error);
      throw ApiError.internal(
        'Failed to validate legal description', 
        'LEGAL_DESCRIPTION_VALIDATE_ERROR',
        error instanceof Error ? { message: error.message } : {}
      );
    }
  }));

  logger.info('Legal description routes registered');
}