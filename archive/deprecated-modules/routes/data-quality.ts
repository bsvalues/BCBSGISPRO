import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { ApiError, asyncHandler } from '../error-handler';
import { DataQualityService } from '../services/data-quality-service';
import { storage } from '../storage';
import { dataQualityDimensionEnum, dataQualityImportanceEnum } from '../../shared/schema';

// Initialize the service
const dataQualityService = new DataQualityService(storage);

// Create router
const router = Router();

/**
 * GET /api/data-quality/rules
 * Get all data quality rules with optional filters
 */
router.get('/rules', asyncHandler(async (req, res) => {
  const dimension = req.query.dimension as typeof dataQualityDimensionEnum.enumValues[number] | undefined;
  const entityType = req.query.entityType as string | undefined;
  const importance = req.query.importance as typeof dataQualityImportanceEnum.enumValues[number] | undefined;
  
  const rules = await dataQualityService.getRules(dimension, entityType, importance);
  res.json(rules);
}));

/**
 * GET /api/data-quality/rules/:id
 * Get a specific data quality rule by ID
 */
router.get('/rules/:id', asyncHandler(async (req, res) => {
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
 * POST /api/data-quality/rules
 * Create a new data quality rule
 */
router.post('/rules', asyncHandler(async (req, res) => {
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
 * PUT /api/data-quality/rules/:id
 * Update an existing data quality rule
 */
router.put('/rules/:id', asyncHandler(async (req, res) => {
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

/**
 * POST /api/data-quality/evaluate-rule
 * Evaluate a single data quality rule for an entity
 */
router.post('/evaluate-rule', asyncHandler(async (req, res) => {
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
 * POST /api/data-quality/evaluate-entity
 * Evaluate all data quality rules for an entity
 */
router.post('/evaluate-entity', asyncHandler(async (req, res) => {
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
 * GET /api/data-quality/evaluations
 * Get recent evaluations for an entity
 */
router.get('/evaluations', asyncHandler(async (req, res) => {
  const entityType = req.query.entityType as string;
  const entityId = parseInt(req.query.entityId as string);
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  
  if (!entityType || isNaN(entityId)) {
    throw new ApiError('Entity type and ID are required', 400);
  }
  
  const evaluations = await dataQualityService.getEntityEvaluations(entityType, entityId, limit);
  res.json(evaluations);
}));

/**
 * GET /api/data-quality/score
 * Get data quality score for an entity
 */
router.get('/score', asyncHandler(async (req, res) => {
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
 * GET /api/data-quality/metrics
 * Get data quality metrics for an entity type
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const entityType = req.query.entityType as string;
  
  if (!entityType) {
    throw new ApiError('Entity type is required', 400);
  }
  
  const metrics = await dataQualityService.getDataQualityMetrics(entityType);
  res.json(metrics);
}));

export default router;