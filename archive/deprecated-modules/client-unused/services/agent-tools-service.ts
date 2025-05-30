/**
 * Agent Tools Service
 * 
 * This service provides client-side integration with the Agent Framework.
 * It offers methods to interact with different types of agents and their capabilities.
 */

import { 
  Agent, 
  AgentTypeKey, 
  AgentRequest, 
  AgentResponse,
  SystemStatus
} from '../../../shared/agent-tools';

/**
 * Fetch all available agents
 */
export async function getAgents(): Promise<Agent[]> {
  try {
    const response = await fetch('/api/agent-tools/agents');
    if (!response.ok) {
      throw new Error(`Error fetching agents: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return [];
  }
}

/**
 * Fetch a specific agent by ID
 */
export async function getAgentById(agentId: string): Promise<Agent | null> {
  try {
    const response = await fetch(`/api/agent-tools/agents/${agentId}`);
    if (!response.ok) {
      throw new Error(`Error fetching agent: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch agent ${agentId}:`, error);
    return null;
  }
}

/**
 * Fetch agents by type
 */
export async function getAgentsByType(type: AgentTypeKey): Promise<Agent[]> {
  try {
    const response = await fetch(`/api/agent-tools/agents/type/${type}`);
    if (!response.ok) {
      throw new Error(`Error fetching agents by type: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch agents of type ${type}:`, error);
    return [];
  }
}

/**
 * Fetch agent capabilities
 */
export async function getAgentCapabilities(agentId: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/agent-tools/agents/${agentId}/capabilities`);
    if (!response.ok) {
      throw new Error(`Error fetching agent capabilities: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch capabilities for agent ${agentId}:`, error);
    return [];
  }
}

/**
 * Get system status
 */
export async function getSystemStatus(): Promise<SystemStatus | null> {
  try {
    const response = await fetch('/api/agent-tools/status');
    if (!response.ok) {
      throw new Error(`Error fetching system status: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch system status:', error);
    return null;
  }
}

/**
 * Send a request to an agent
 */
export async function sendAgentRequest(request: AgentRequest): Promise<AgentResponse> {
  try {
    const response = await fetch('/api/agent-tools/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Error sending agent request: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to send agent request:', error);
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to send agent request',
      },
    };
  }
}

/**
 * Map Intelligence Agent Helpers
 */

/**
 * Get layer recommendations based on context
 */
export async function getLayerRecommendations(params: {
  task: string;
  location?: { lat: number; lng: number };
  userRole?: string;
  dataQualityFocus?: string[];
}): Promise<AgentResponse> {
  return sendAgentRequest({
    type: 'MAP_INTELLIGENCE',
    action: 'GET_LAYER_RECOMMENDATIONS',
    payload: params,
  });
}

/**
 * Customize map layers for a specific task
 */
export async function customizeLayersForTask(params: {
  taskId?: string;
  taskType: string;
  location?: { lat: number; lng: number };
  dataQualityFocus?: string[];
}): Promise<AgentResponse> {
  return sendAgentRequest({
    type: 'MAP_INTELLIGENCE',
    action: 'CUSTOMIZE_LAYERS_FOR_TASK',
    payload: params,
  });
}

/**
 * Highlight data quality issues on the map
 */
export async function highlightDataQualityIssues(params: {
  location: { lat: number; lng: number };
  radius: number;
  issueTypes?: string[];
}): Promise<AgentResponse> {
  return sendAgentRequest({
    type: 'MAP_INTELLIGENCE',
    action: 'HIGHLIGHT_DATA_QUALITY_ISSUES',
    payload: params,
  });
}

/**
 * Data Validation Agent Helpers
 */

/**
 * Evaluate entity data quality
 */
export async function evaluateEntityQuality(params: {
  entityType: string;
  entityId: number;
}): Promise<AgentResponse> {
  return sendAgentRequest({
    type: 'DATA_VALIDATION',
    action: 'EVALUATE_ENTITY',
    payload: params,
  });
}

/**
 * Get data quality score for an entity
 */
export async function getQualityScore(params: {
  entityType: string;
  entityId: number;
}): Promise<AgentResponse> {
  return sendAgentRequest({
    type: 'DATA_VALIDATION',
    action: 'GET_QUALITY_SCORE',
    payload: params,
  });
}

/**
 * Legal Compliance Agent Helpers
 */

/**
 * Check document compliance with regulations
 */
export async function checkDocumentCompliance(params: {
  documentId: number;
  documentType: string;
}): Promise<AgentResponse> {
  return sendAgentRequest({
    type: 'LEGAL_COMPLIANCE',
    action: 'CHECK_DOCUMENT_COMPLIANCE',
    payload: params,
  });
}

/**
 * Check entity compliance with regulations
 */
export async function checkEntityCompliance(params: {
  entityId: number;
  entityType: string;
  regulationType?: string;
}): Promise<AgentResponse> {
  return sendAgentRequest({
    type: 'LEGAL_COMPLIANCE',
    action: 'CHECK_ENTITY_COMPLIANCE',
    payload: params,
  });
}