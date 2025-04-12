import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { ApiError, asyncHandler } from '../error-handler';
import { DataQualityService } from '../services/data-quality-service';
import { storage } from '../storage';
import { logger } from '../logger';
import { dataQualityDimensionEnum, dataQualityImportanceEnum } from '../../shared/schema';
import { validateDocumentRetention } from '../../shared/validation';
import passport from 'passport';

// Create the router and initialize the service
export const dataQualityRouter = Router();
const dataQualityService = new DataQualityService(storage);

// Middleware to ensure user is authenticated
dataQualityRouter.use(passport.authenticate('session'));

//---------------------------------------
// WORKFLOW QUALITY ENDPOINTS
//---------------------------------------

/**
 * @route GET /api/data-quality/workflow/:id/compliance
 * @description Get compliance report for a workflow
 * @access Requires authentication
 */
dataQualityRouter.get('/workflow/:id/compliance', asyncHandler(async (req, res) => {
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
}));

/**
 * @route GET /api/data-quality/workflow/:id/score
 * @description Calculate data quality score for a workflow
 * @access Requires authentication
 */
dataQualityRouter.get('/workflow/:id/score', asyncHandler(async (req, res) => {
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
}));

/**
 * @route POST /api/data-quality/workflow/:id/validate
 * @description Validate workflow data against requirements
 * @access Requires authentication
 */
dataQualityRouter.post('/workflow/:id/validate', asyncHandler(async (req, res) => {
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
}));

/**
 * @route GET /api/data-quality/system-report
 * @description Generate system-wide data quality report
 * @access Requires authentication
 */
dataQualityRouter.get('/system-report', asyncHandler(async (req, res) => {
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
}));

//---------------------------------------
// DATA QUALITY RULES ENDPOINTS
//---------------------------------------

/**
 * @route GET /api/data-quality/rules
 * @description Get all data quality rules with optional filters
 * @access Requires authentication
 */
dataQualityRouter.get('/rules', asyncHandler(async (req, res) => {
  const dimension = req.query.dimension as typeof dataQualityDimensionEnum.enumValues[number] | undefined;
  const entityType = req.query.entityType as string | undefined;
  const importance = req.query.importance as typeof dataQualityImportanceEnum.enumValues[number] | undefined;
  
  const rules = await dataQualityService.getRules(dimension, entityType, importance);
  res.json(rules);
}));

/**
 * @route GET /api/data-quality/rules/:id
 * @description Get a specific data quality rule by ID
 * @access Requires authentication
 */
dataQualityRouter.get('/rules/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ApiError('Invalid rule ID', 400);
  }
  
  const rule = await dataQualityService.getRuleById(id);
  if (!rule) {
    throw new ApiError('Rule not found', 404);
  }
  
  res.json(rule);
}));

/**
 * @route POST /api/data-quality/rules
 * @description Create a new data quality rule
 * @access Requires authentication
 */
dataQualityRouter.post('/rules', asyncHandler(async (req, res) => {
  // Validate request body
  const RuleSchema = z.object({
    name: z.string(),
    description: z.string(),
    dimension: z.enum(dataQualityDimensionEnum.enumValues),
    entityType: z.string(),
    validationLogic: z.string().optional(),
    importance: z.enum(dataQualityImportanceEnum.enumValues).default('MEDIUM'),
    isActive: z.boolean().default(true),
    parameters: z.any().optional(),
    createdBy: z.number().optional()
  });
  
  const data = RuleSchema.parse(req.body);
  const rule = await dataQualityService.createRule(data);
  
  res.status(201).json(rule);
}));

/**
 * @route PUT /api/data-quality/rules/:id
 * @description Update an existing data quality rule
 * @access Requires authentication
 */
dataQualityRouter.put('/rules/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ApiError('Invalid rule ID', 400);
  }
  
  // Validate request body
  const RuleUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    dimension: z.enum(dataQualityDimensionEnum.enumValues).optional(),
    entityType: z.string().optional(),
    validationLogic: z.string().optional(),
    importance: z.enum(dataQualityImportanceEnum.enumValues).optional(),
    isActive: z.boolean().optional(),
    parameters: z.any().optional()
  });
  
  const data = RuleUpdateSchema.parse(req.body);
  const rule = await dataQualityService.updateRule(id, data);
  
  res.json(rule);
}));

//---------------------------------------
// DATA QUALITY EVALUATION ENDPOINTS
//---------------------------------------

/**
 * @route POST /api/data-quality/evaluate-rule
 * @description Evaluate a single data quality rule for an entity
 * @access Requires authentication
 */
dataQualityRouter.post('/evaluate-rule', asyncHandler(async (req, res) => {
  // Validate request body
  const EvaluateSchema = z.object({
    ruleId: z.number(),
    entityType: z.string(),
    entityId: z.number()
  });
  
  const data = EvaluateSchema.parse(req.body);
  
  // Get user ID from session if available
  const userId = req.user?.id;
  
  const evaluation = await dataQualityService.evaluateRule(
    data.ruleId,
    data.entityType,
    data.entityId,
    userId
  );
  
  res.json(evaluation);
}));

/**
 * @route POST /api/data-quality/evaluate-entity
 * @description Evaluate all data quality rules for an entity
 * @access Requires authentication
 */
dataQualityRouter.post('/evaluate-entity', asyncHandler(async (req, res) => {
  // Validate request body
  const EvaluateEntitySchema = z.object({
    entityType: z.string(),
    entityId: z.number()
  });
  
  const data = EvaluateEntitySchema.parse(req.body);
  
  // Get user ID from session if available
  const userId = req.user?.id;
  
  const result = await dataQualityService.evaluateEntity(
    data.entityType,
    data.entityId,
    userId
  );
  
  res.json(result);
}));

/**
 * @route GET /api/data-quality/evaluations
 * @description Get recent evaluations for an entity
 * @access Requires authentication
 */
dataQualityRouter.get('/evaluations', asyncHandler(async (req, res) => {
  const entityType = req.query.entityType as string;
  const entityId = parseInt(req.query.entityId as string);
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  
  if (!entityType || isNaN(entityId)) {
    throw new ApiError('Entity type and ID are required', 400);
  }
  
  const evaluations = await dataQualityService.getEntityEvaluations(entityType, entityId, limit);
  res.json(evaluations);
}));

//---------------------------------------
// DATA QUALITY SCORE ENDPOINTS
//---------------------------------------

/**
 * @route GET /api/data-quality/score
 * @description Get data quality score for an entity
 * @access Requires authentication
 */
dataQualityRouter.get('/score', asyncHandler(async (req, res) => {
  const entityType = req.query.entityType as string;
  const entityId = parseInt(req.query.entityId as string);
  
  if (!entityType || isNaN(entityId)) {
    throw new ApiError('Entity type and ID are required', 400);
  }
  
  const score = await dataQualityService.getDataQualityScore(entityType, entityId);
  if (!score) {
    res.json({
      entityType,
      entityId,
      overallScore: 0,
      dimensionScores: {},
      passedRules: 0,
      totalRules: 0,
      lastEvaluatedAt: null
    });
  } else {
    res.json(score);
  }
}));

/**
 * @route GET /api/data-quality/metrics
 * @description Get data quality metrics for an entity type
 * @access Requires authentication
 */
dataQualityRouter.get('/metrics', asyncHandler(async (req, res) => {
  const entityType = req.query.entityType as string;
  
  if (!entityType) {
    throw new ApiError('Entity type is required', 400);
  }
  
  const metrics = await dataQualityService.getDataQualityMetrics(entityType);
  res.json(metrics);
}));

//---------------------------------------
// DOCUMENT RETENTION ENDPOINTS
//---------------------------------------

/**
 * @route GET /api/data-quality/document-retention/:type
 * @description Get document retention requirements by document type
 * @access Requires authentication
 */
dataQualityRouter.get('/document-retention/:type', asyncHandler(async (req, res) => {
  const documentType = req.params.type.toUpperCase();
  
  // Use the validation utility to get retention requirements
  const retentionRequirements = validateDocumentRetention(documentType);
  
  res.status(200).json({
    success: true,
    data: retentionRequirements
  });
}));