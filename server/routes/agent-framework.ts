/**
 * Agent Framework API Routes
 * 
 * This module handles API endpoints for the agent framework.
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../api-utils';
import { ApiError } from '../api-error';
import { masterControlProgram } from '../services/master-control-program';
import { registerAgents } from '../services/agents';
import { AgentRequestSchema } from '../../shared/agent-framework';

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
    throw new ApiError(`Agent not found: ${agentId}`, 404);
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
    throw new ApiError(`Agent not found: ${agentId}`, 404);
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

export default router;