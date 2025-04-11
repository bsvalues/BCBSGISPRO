/**
 * Agent Framework API Routes
 * 
 * This module handles API endpoints for the agent framework.
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../error-handler';
import { masterControlProgram } from '../services/master-control-program';
import { registerAgents } from '../services/agents';
import { AgentRequestSchema, PriorityLevel } from '../../shared/agent-framework';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { agentEvents, masterPrompts, masterPromptAcknowledgments } from '../../shared/agent-schema';
import { desc, eq, and, like, inArray } from 'drizzle-orm';

const router = Router();

// Initialize the MCP and register agents
let mcpInitialized = false;

const initializeMCP = async () => {
  if (!mcpInitialized) {
    await masterControlProgram.initialize();
    registerAgents(masterControlProgram);
    mcpInitialized = true;
  }
};

/**
 * GET /api/agent-framework/status
 * Get system status for the agent framework
 */
router.get('/status', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const status = await masterControlProgram.getSystemStatus();
  res.json(status);
}));

/**
 * GET /api/agent-framework/agents
 * Get all registered agents
 */
router.get('/agents', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const agents = masterControlProgram.registry.getAllAgents().map(agent => ({
    id: agent.id,
    type: agent.type,
    name: agent.name,
    description: agent.description,
    version: agent.version,
    isActive: agent.isActive,
    capabilities: agent.capabilities.length
  }));
  
  res.json(agents);
}));

/**
 * GET /api/agent-framework/agents/:agentId/status
 * Get status of a specific agent
 */
router.get('/agents/:agentId/status', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const agentId = req.params.agentId;
  const agent = masterControlProgram.registry.getAgent(agentId);
  
  if (!agent) {
    throw new ApiError('AGENT_NOT_FOUND', `Agent not found: ${agentId}`, 404);
  }
  
  const status = await agent.getStatus();
  res.json(status);
}));

/**
 * GET /api/agent-framework/agents/:agentId/capabilities
 * Get capabilities of a specific agent
 */
router.get('/agents/:agentId/capabilities', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const agentId = req.params.agentId;
  const agent = masterControlProgram.registry.getAgent(agentId);
  
  if (!agent) {
    throw new ApiError('AGENT_NOT_FOUND', `Agent not found: ${agentId}`, 404);
  }
  
  const capabilities = agent.getCapabilities();
  res.json(capabilities);
}));

/**
 * POST /api/agent-framework/dispatch
 * Dispatch a request to an agent
 */
router.post('/dispatch', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  // Validate request body
  const requestSchema = AgentRequestSchema;
  const request = requestSchema.parse(req.body);
  
  // Get user ID from session if available
  const userId = req.user?.id;
  
  // Add user ID to metadata if available
  if (userId) {
    request.metadata = {
      ...request.metadata,
      requestedBy: userId.toString()
    };
  }
  
  // Dispatch the request
  const response = await masterControlProgram.dispatchRequest(request);
  
  res.json(response);
}));

// Master Prompt Routes

/**
 * GET /api/agent-framework/master-prompts
 * Get all master prompts
 */
router.get('/master-prompts', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const activeOnly = req.query.active === 'true';
  
  let query = db.select().from(masterPrompts).orderBy(desc(masterPrompts.timestamp));
  
  if (activeOnly) {
    query = query.where(eq(masterPrompts.isActive, true));
  }
  
  const prompts = await query;
  
  res.json(prompts);
}));

/**
 * GET /api/agent-framework/master-prompts/:id
 * Get a specific master prompt
 */
router.get('/master-prompts/:id', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const promptId = req.params.id;
  const prompt = await masterControlProgram.getMasterPrompt(promptId);
  
  if (!prompt) {
    throw new ApiError('PROMPT_NOT_FOUND', `Master prompt not found: ${promptId}`, 404);
  }
  
  res.json(prompt);
}));

/**
 * POST /api/agent-framework/master-prompts
 * Create a new master prompt
 */
router.post('/master-prompts', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  // Validate request body
  const createPromptSchema = z.object({
    name: z.string().min(3).max(100),
    content: z.string().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    parameters: z.record(z.any()).optional().default({}),
    scope: z.union([z.array(z.string()), z.literal('ALL')]).default('ALL')
  });
  
  const promptData = createPromptSchema.parse(req.body);
  
  // Get user ID from session if available
  const userId = req.user?.id;
  
  // Create a new prompt
  const newPrompt = await masterControlProgram.createMasterPrompt({
    ...promptData,
    promptId: uuidv4(),
    version: '1.0.0',
    priority: promptData.priority as PriorityLevel,
    createdBy: userId?.toString() || 'system',
    expiresAt: undefined  // No expiration by default
  });
  
  res.status(201).json(newPrompt);
}));

/**
 * PUT /api/agent-framework/master-prompts/:id
 * Update a master prompt
 */
router.put('/master-prompts/:id', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const promptId = req.params.id;
  
  // Validate request body
  const updatePromptSchema = z.object({
    name: z.string().min(3).max(100).optional(),
    content: z.string().min(1).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    parameters: z.record(z.any()).optional(),
    scope: z.union([z.array(z.string()), z.literal('ALL')]).optional(),
    isActive: z.boolean().optional()
  });
  
  const updates = updatePromptSchema.parse(req.body);
  
  // Make TypeScript happy with the priority enum
  let typedUpdates: any = updates;
  if (updates.priority) {
    typedUpdates.priority = updates.priority as PriorityLevel;
  }
  
  // Update the prompt
  const updatedPrompt = await masterControlProgram.updateMasterPrompt(promptId, typedUpdates);
  
  if (!updatedPrompt) {
    throw new ApiError('PROMPT_NOT_FOUND', `Master prompt not found: ${promptId}`, 404);
  }
  
  res.json(updatedPrompt);
}));

/**
 * POST /api/agent-framework/master-prompts/:id/broadcast
 * Broadcast a master prompt to agents
 */
router.post('/master-prompts/:id/broadcast', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const promptId = req.params.id;
  
  // Validate request body
  const broadcastSchema = z.object({
    agentIds: z.array(z.string()).optional()
  });
  
  const { agentIds } = broadcastSchema.parse(req.body);
  
  // Broadcast the prompt
  const count = await masterControlProgram.broadcastMasterPrompt(promptId, agentIds);
  
  res.json({
    success: true,
    broadcastedTo: count,
    promptId
  });
}));

/**
 * DELETE /api/agent-framework/master-prompts/:id
 * Revoke a master prompt (mark as inactive)
 */
router.delete('/master-prompts/:id', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const promptId = req.params.id;
  
  // Revoke the prompt
  const success = await masterControlProgram.revokeMasterPrompt(promptId);
  
  if (!success) {
    throw new ApiError('PROMPT_NOT_FOUND', `Master prompt not found: ${promptId}`, 404);
  }
  
  res.json({
    success: true,
    message: `Master prompt ${promptId} has been revoked`
  });
}));

/**
 * GET /api/agent-framework/master-prompts/acknowledgments
 * Get acknowledgments for master prompts
 */
router.get('/master-prompts/acknowledgments', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const promptId = req.query.promptId as string | undefined;
  const agentId = req.query.agentId as string | undefined;
  
  let query = db.select().from(masterPromptAcknowledgments);
  
  // Apply filters if provided
  if (promptId) {
    query = query.where(eq(masterPromptAcknowledgments.promptId, promptId));
  }
  
  if (agentId) {
    query = query.where(eq(masterPromptAcknowledgments.agentId, agentId));
  }
  
  // Order by most recent first
  query = query.orderBy(desc(masterPromptAcknowledgments.acknowledgedAt));
  
  const acknowledgments = await query;
  
  res.json(acknowledgments);
}));

/**
 * GET /api/agent-framework/agents/events
 * Get events from agents
 */
router.get('/agents/events', asyncHandler(async (req, res) => {
  await initializeMCP();
  
  const agentId = req.query.agentId as string | undefined;
  const eventType = req.query.eventType as string | undefined;
  const eventTypes = req.query.eventTypes as string | undefined;
  const limit = parseInt(req.query.limit as string || '50', 10);
  
  let query = db.select().from(agentEvents);
  
  // Apply filters if provided
  if (agentId) {
    query = query.where(eq(agentEvents.agentId, agentId));
  }
  
  if (eventType) {
    query = query.where(eq(agentEvents.eventType, eventType));
  }
  
  if (eventTypes) {
    const types = eventTypes.split(',');
    query = query.where(inArray(agentEvents.eventType, types));
  }
  
  // Order by most recent first and limit results
  query = query.orderBy(desc(agentEvents.timestamp)).limit(limit);
  
  const events = await query;
  
  res.json(events);
}));

export default router;