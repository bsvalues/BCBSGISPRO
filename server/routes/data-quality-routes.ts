import { Router } from 'express';
import { DataQualityService } from '../services/data-quality-service';
import { storage } from '../storage';
import { ApiError, asyncHandler } from '../error-handler';
import passport from 'passport';
import { logger } from '../logger';

export const dataQualityRouter = Router();
const dataQualityService = new DataQualityService(storage);

// Middleware to ensure user is authenticated
dataQualityRouter.use(passport.authenticate('session'));

/**
 * @route GET /api/data-quality/workflow/:id/compliance
 * @description Get compliance report for a workflow
 * @access Requires authentication
 */
dataQualityRouter.get('/workflow/:id/compliance', async (req, res, next) => {
  try {
    const workflowId = parseInt(req.params.id, 10);
    if (isNaN(workflowId)) {
      throw new ApiError('Invalid workflow ID', 400);
    }
    
    // Get workflow to verify access permissions
    const workflow = await storage.getWorkflow(workflowId);
    if (!workflow) {
      throw new ApiError('Workflow not found', 404);
    }
    
    // Generate compliance report
    const report = await dataQualityService.evaluateWorkflowCompliance(workflowId);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/data-quality/workflow/:id/score
 * @description Calculate data quality score for a workflow
 * @access Requires authentication
 */
dataQualityRouter.get('/workflow/:id/score', async (req, res, next) => {
  try {
    const workflowId = parseInt(req.params.id, 10);
    if (isNaN(workflowId)) {
      throw new ApiError('Invalid workflow ID', 400);
    }
    
    // Get workflow to verify it exists
    const workflow = await storage.getWorkflow(workflowId);
    if (!workflow) {
      throw new ApiError('Workflow not found', 404);
    }
    
    // Calculate quality score
    const qualityData = await dataQualityService.calculateWorkflowDataQuality(workflowId);
    
    res.status(200).json({
      success: true,
      data: qualityData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/data-quality/workflow/:id/validate
 * @description Validate workflow data against requirements
 * @access Requires authentication
 */
dataQualityRouter.post('/workflow/:id/validate', async (req, res, next) => {
  try {
    const workflowId = parseInt(req.params.id, 10);
    if (isNaN(workflowId)) {
      throw new ApiError('Invalid workflow ID', 400);
    }
    
    // Get workflow to verify it exists and get its type
    const workflow = await storage.getWorkflow(workflowId);
    if (!workflow) {
      throw new ApiError('Workflow not found', 404);
    }
    
    // Get workflow state and other related data
    const state = await storage.getWorkflowState(workflowId);
    const workflowData = {
      ...workflow,
      formData: state?.formData || {},
      ...req.body // Include any additional data sent in the request
    };
    
    // Validate the workflow data
    const validationResult = dataQualityService.validateWorkflowData(workflowData, workflow.type);
    
    res.status(200).json({
      success: true,
      data: validationResult
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/data-quality/system-report
 * @description Generate system-wide data quality report
 * @access Requires authentication
 */
dataQualityRouter.get('/system-report', async (req, res, next) => {
  try {
    // This could be a heavy operation, so we log it
    logger.info('Generating system-wide data quality report', {
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    // Generate system-wide report
    const report = await dataQualityService.monitorSystemDataQuality();
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/data-quality/document-retention/:type
 * @description Get document retention requirements by document type
 * @access Requires authentication
 */
dataQualityRouter.get('/document-retention/:type', async (req, res, next) => {
  try {
    const documentType = req.params.type.toUpperCase();
    
    // Use the validation utility to get retention requirements
    const { validateDocumentRetention } = require('../../shared/validation');
    const retentionRequirements = validateDocumentRetention(documentType);
    
    res.status(200).json({
      success: true,
      data: retentionRequirements
    });
  } catch (error) {
    next(error);
  }
});