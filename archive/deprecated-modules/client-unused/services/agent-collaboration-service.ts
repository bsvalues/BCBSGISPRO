/**
 * Agent Collaboration Service
 * 
 * This service facilitates collaboration between specialized AI agents through
 * the Master Control Program (MCP) which acts as the coordinator.
 */

import Anthropic from '@anthropic-ai/sdk';
import { WebSocketMessage } from '../context/websocket-context';

// Agent configuration for specialized capabilities
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  contextPrompt: string;
  model: string; // Model to use for this agent
}

// Agent request interface
export interface AgentRequest {
  requestId: string;
  query: string;
  context?: string;
  userId: number;
  agentId: string;
  timestamp?: string;
  tools?: string[];
}

// Agent response interface
export interface AgentResponse {
  requestId: string;
  agentId: string;
  response: string;
  userId: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

// MCP recommendation for agent routing
export interface MCPRecommendation {
  primaryAgent: string;
  secondaryAgents: string[];
  explanation: string;
  suggestedPrompt?: string;
}

// Available specialized agents and their capabilities
export const AGENTS: Record<string, AgentConfig> = {
  master_control: {
    id: 'master_control',
    name: 'Master Control Program',
    description: 'Coordinates specialized agents and determines optimal routing for requests',
    capabilities: [
      'Request triage',
      'Multi-agent orchestration',
      'Task decomposition',
      'Response synthesis',
      'Uncertainty management'
    ],
    contextPrompt: `You are the Master Control Program (MCP), a specialized AI coordinator for the Benton County GIS Assessment System.
Your primary role is to analyze user requests and determine which specialized agent(s) should handle them.
Consider the specific capabilities of each agent and the nature of the request to make optimal routing decisions.
Provide clear reasoning for your choices.`,
    model: 'claude-3-7-sonnet-20250219'
  },
  data_validation: {
    id: 'data_validation',
    name: 'Data Validation Agent',
    description: 'Validates data entries against compliance standards and business rules',
    capabilities: [
      'Data quality assessment',
      'Validation rule enforcement',
      'Format verification',
      'Duplicate detection',
      'Anomaly identification',
      'Compliance checking'
    ],
    contextPrompt: `You are a Data Validation Agent specialized in ensuring data quality and compliance for Benton County's assessment data.
Your expertise is in validating data formats, finding anomalies, detecting duplication, and ensuring compliance with regulations.
Focus on specific validation issues, data quality concerns, and provide clear, actionable feedback.`,
    model: 'claude-3-7-sonnet-20250219'
  },
  legal_compliance: {
    id: 'legal_compliance',
    name: 'Legal Compliance Agent',
    description: 'Analyzes documents for legal compliance and regulatory adherence',
    capabilities: [
      'Legal terminology extraction',
      'Document classification',
      'Requirement tracking',
      'Regulation matching',
      'Risk assessment',
      'Citation verification'
    ],
    contextPrompt: `You are a Legal Compliance Agent specialized in understanding legal descriptions, regulations, and compliance requirements for Benton County.
Your expertise is in analyzing legal documents, identifying requirements, assessing risk factors, and ensuring compliance with state and local regulations.
Focus on specific legal aspects, compliance issues, and provide clear, actionable guidance.`,
    model: 'claude-3-7-sonnet-20250219'
  },
  map_intelligence: {
    id: 'map_intelligence',
    name: 'Map Intelligence Agent',
    description: 'Provides geospatial analysis and map recommendations',
    capabilities: [
      'Layer recommendation',
      'Spatial analysis',
      'Map element optimization',
      'Feature identification',
      'Cartographic best practices',
      'Visual hierarchy improvement'
    ],
    contextPrompt: `You are a Map Intelligence Agent specialized in geospatial analysis and cartographic principles for Benton County's GIS system.
Your expertise is in recommending appropriate map layers, analyzing spatial relationships, identifying relevant features, and improving map design.
Focus on specific map elements, visualization issues, and provide clear, actionable recommendations.`,
    model: 'claude-3-7-sonnet-20250219'
  }
};

/**
 * The Master Control Program - Coordinates agent collaboration
 */
export class MasterControlProgram {
  private anthropic: Anthropic | null = null;
  
  constructor() {
    // Initialize Anthropic client if API key is available
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY
      });
    }
  }
  
  /**
   * Check if the MCP is available (has a valid API key)
   */
  isAvailable(): boolean {
    return this.anthropic !== null;
  }
  
  /**
   * Route a request to appropriate agent(s) based on the query
   */
  async routeRequest(request: AgentRequest): Promise<MCPRecommendation> {
    // If no Anthropic client available, default to using the requested agent
    if (!this.anthropic) {
      return {
        primaryAgent: request.agentId,
        secondaryAgents: [],
        explanation: "No AI routing available. Using specified agent directly."
      };
    }
    
    // Prepare prompt for routing decision
    const prompt = `User Query: "${request.query}"

Based on this query, determine the most appropriate specialized agent to handle it as the primary agent. 
Also identify any secondary agents that should provide additional input.

Available Agents:
${Object.values(AGENTS).filter(a => a.id !== 'master_control').map(agent => 
  `- ${agent.name}: ${agent.description}\n  Capabilities: ${agent.capabilities.join(', ')}`
).join('\n')}

Provide your recommendation in this format:
Primary Agent: [agent_id]
Secondary Agents: [agent_id1, agent_id2] (if needed)
Explanation: [brief explanation of your reasoning]
Suggested Prompt: [an improved version of the query that would help the primary agent provide the best response]`;

    try {
      // Query the MCP for routing decision
      const message = await this.anthropic.messages.create({
        model: AGENTS.master_control.model,
        max_tokens: 1000,
        system: AGENTS.master_control.contextPrompt,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const response = message.content[0].text;
      
      // Parse the response to extract routing information
      const primaryMatch = response.match(/Primary Agent: (\w+)/i);
      const secondaryMatch = response.match(/Secondary Agents: \[(.*?)\]/i);
      const explanationMatch = response.match(/Explanation: (.*?)(?:\n|$)/i);
      const suggestedPromptMatch = response.match(/Suggested Prompt: (.*?)(?:\n|$)/i);
      
      // Extract primary agent
      const primaryAgent = primaryMatch ? primaryMatch[1].trim() : request.agentId;
      
      // Extract secondary agents
      let secondaryAgents: string[] = [];
      if (secondaryMatch && secondaryMatch[1]) {
        secondaryAgents = secondaryMatch[1].split(',')
          .map(a => a.trim())
          .filter(a => a && a !== primaryAgent && a !== 'master_control');
      }
      
      // Extract explanation and suggested prompt
      const explanation = explanationMatch ? explanationMatch[1].trim() : 
        "Routing based on agent capabilities and query requirements.";
      
      const suggestedPrompt = suggestedPromptMatch ? suggestedPromptMatch[1].trim() : undefined;
      
      return {
        primaryAgent,
        secondaryAgents,
        explanation,
        suggestedPrompt
      };
    } catch (error) {
      console.error('Error routing request:', error);
      // Default to requested agent if routing fails
      return {
        primaryAgent: request.agentId,
        secondaryAgents: [],
        explanation: "Routing failed. Using specified agent directly."
      };
    }
  }
  
  /**
   * Process a request with the primary agent
   */
  async processRequest(request: AgentRequest, routing?: MCPRecommendation): Promise<AgentResponse> {
    // If no Anthropic client, return mock response
    if (!this.anthropic) {
      return {
        requestId: request.requestId,
        agentId: request.agentId,
        response: "Agent service is currently unavailable. Please check your API configuration.",
        userId: request.userId,
        timestamp: new Date().toISOString()
      };
    }
    
    // Use the primary agent from routing recommendation or the requested agent
    const agentId = routing?.primaryAgent || request.agentId;
    const agent = AGENTS[agentId] || AGENTS.master_control;
    
    // Use the suggested prompt if available, otherwise use the original query
    const query = routing?.suggestedPrompt || request.query;
    
    // Prepare system prompt with agent context and any additional user context
    const systemPrompt = `${agent.contextPrompt}
${request.context ? `\nAdditional Context: ${request.context}` : ''}`;

    try {
      // Query the appropriate agent
      const message = await this.anthropic.messages.create({
        model: agent.model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }]
      });
      
      const response = message.content[0].text;
      
      return {
        requestId: request.requestId,
        agentId: agent.id,
        response,
        userId: request.userId,
        timestamp: new Date().toISOString(),
        metadata: {
          model: agent.model,
          routing: routing ? {
            explanation: routing.explanation,
            secondaryAgents: routing.secondaryAgents
          } : undefined
        }
      };
    } catch (error) {
      console.error(`Error processing request with agent ${agent.id}:`, error);
      return {
        requestId: request.requestId,
        agentId: agent.id,
        response: `Error processing your request with the ${agent.name}. Please try again or select a different agent.`,
        userId: request.userId,
        timestamp: new Date().toISOString(),
        metadata: {
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Get secondary contributions from other agents
   */
  async getSecondaryContributions(
    request: AgentRequest, 
    primaryResponse: AgentResponse, 
    secondaryAgentIds: string[]
  ): Promise<AgentResponse[]> {
    if (!this.anthropic || secondaryAgentIds.length === 0) {
      return [];
    }
    
    const contributions: AgentResponse[] = [];
    
    // Prepare context with primary response
    const enhancedContext = `
Original Query: "${request.query}"

Primary Response from ${AGENTS[primaryResponse.agentId].name}:
${primaryResponse.response}

Based on the original query and primary response above, provide your specialized perspective.
Focus only on adding insights from your specific domain expertise that weren't covered in the primary response.
`;

    // Get contributions from each secondary agent
    for (const agentId of secondaryAgentIds) {
      if (!AGENTS[agentId]) continue;
      
      const agent = AGENTS[agentId];
      
      try {
        const message = await this.anthropic.messages.create({
          model: agent.model,
          max_tokens: 750,
          system: agent.contextPrompt,
          messages: [{ role: 'user', content: enhancedContext }]
        });
        
        contributions.push({
          requestId: request.requestId,
          agentId: agent.id,
          response: message.content[0].text,
          userId: request.userId,
          timestamp: new Date().toISOString(),
          metadata: {
            model: agent.model,
            isSecondaryContribution: true
          }
        });
      } catch (error) {
        console.error(`Error getting contribution from agent ${agent.id}:`, error);
        // Skip failed contributions
      }
    }
    
    return contributions;
  }
  
  /**
   * Synthesize a final response combining primary and secondary contributions
   */
  async synthesizeFinalResponse(
    request: AgentRequest,
    primaryResponse: AgentResponse,
    secondaryResponses: AgentResponse[]
  ): Promise<AgentResponse> {
    // If no secondary responses or no Anthropic client, just return primary response
    if (!this.anthropic || secondaryResponses.length === 0) {
      return primaryResponse;
    }
    
    const synthesisPrompt = `
Original User Query: "${request.query}"

Primary Response from ${AGENTS[primaryResponse.agentId].name}:
${primaryResponse.response}

${secondaryResponses.map(resp => `
Additional Input from ${AGENTS[resp.agentId].name}:
${resp.response}
`).join('\n')}

Synthesize a comprehensive final response that integrates the primary response with the valuable insights from the additional inputs.
Ensure the response is cohesive, non-repetitive, and addresses all aspects of the original query.
Do not mention that this is a synthesis or refer to "primary" and "secondary" responses - present as a unified expert answer.
`;

    try {
      const message = await this.anthropic.messages.create({
        model: AGENTS.master_control.model,
        max_tokens: 2000,
        system: AGENTS.master_control.contextPrompt,
        messages: [{ role: 'user', content: synthesisPrompt }]
      });
      
      return {
        requestId: request.requestId,
        agentId: 'master_control',
        response: message.content[0].text,
        userId: request.userId,
        timestamp: new Date().toISOString(),
        metadata: {
          model: AGENTS.master_control.model,
          isSynthesis: true,
          contributingAgents: [primaryResponse.agentId, ...secondaryResponses.map(r => r.agentId)]
        }
      };
    } catch (error) {
      console.error('Error synthesizing final response:', error);
      // Fall back to primary response if synthesis fails
      return primaryResponse;
    }
  }
  
  /**
   * Execute the full collaborative agent workflow
   */
  async executeCollaborativeWorkflow(request: WebSocketMessage): Promise<WebSocketMessage[]> {
    if (!this.isAvailable() || !request.content) {
      return [{
        type: 'agent_response',
        userId: request.userId,
        agentId: request.agentId,
        content: {
          requestId: request.content?.requestId || 'unknown',
          agentId: request.agentId || 'master_control',
          response: "Agent service is currently unavailable. Please check your API configuration.",
          userId: request.userId || 0,
          timestamp: new Date().toISOString()
        }
      }];
    }
    
    const agentRequest = request.content as AgentRequest;
    const messages: WebSocketMessage[] = [];
    
    try {
      // Status update - routing
      messages.push({
        type: 'agent_status',
        userId: request.userId,
        content: {
          requestId: agentRequest.requestId,
          step: 'routing',
          message: 'Determining optimal agent routing...'
        }
      });
      
      // 1. Route the request to appropriate agent(s)
      const routing = await this.routeRequest(agentRequest);
      
      // Status update - processing
      messages.push({
        type: 'agent_status',
        userId: request.userId,
        content: {
          requestId: agentRequest.requestId,
          step: 'processing',
          message: `Processing with ${AGENTS[routing.primaryAgent]?.name || routing.primaryAgent}...`,
          routing
        }
      });
      
      // 2. Process with primary agent
      const primaryResponse = await this.processRequest(agentRequest, routing);
      
      // If there are secondary agents, get their contributions
      if (routing.secondaryAgents && routing.secondaryAgents.length > 0) {
        // Status update - getting secondary contributions
        messages.push({
          type: 'agent_status',
          userId: request.userId,
          content: {
            requestId: agentRequest.requestId,
            step: 'secondary_processing',
            message: `Getting additional perspectives from ${routing.secondaryAgents.length} agent(s)...`
          }
        });
        
        // 3. Get secondary contributions
        const secondaryResponses = await this.getSecondaryContributions(
          agentRequest, 
          primaryResponse, 
          routing.secondaryAgents
        );
        
        if (secondaryResponses.length > 0) {
          // Status update - synthesizing
          messages.push({
            type: 'agent_status',
            userId: request.userId,
            content: {
              requestId: agentRequest.requestId,
              step: 'synthesis',
              message: 'Synthesizing comprehensive response...'
            }
          });
          
          // 4. Synthesize final response
          const finalResponse = await this.synthesizeFinalResponse(
            agentRequest,
            primaryResponse,
            secondaryResponses
          );
          
          // Add final synthesized response
          messages.push({
            type: 'agent_response',
            userId: request.userId,
            agentId: 'master_control',
            content: finalResponse
          });
          
          // Also send individual agent responses for reference
          messages.push({
            type: 'agent_detail_responses',
            userId: request.userId,
            content: {
              primaryResponse,
              secondaryResponses
            }
          });
        } else {
          // Just return primary response if no secondary contributions were obtained
          messages.push({
            type: 'agent_response',
            userId: request.userId,
            agentId: primaryResponse.agentId,
            content: primaryResponse
          });
        }
      } else {
        // Just return primary response if no secondary agents
        messages.push({
          type: 'agent_response',
          userId: request.userId,
          agentId: primaryResponse.agentId,
          content: primaryResponse
        });
      }
    } catch (error) {
      console.error('Error in collaborative workflow:', error);
      
      // Send error message
      messages.push({
        type: 'agent_status',
        userId: request.userId,
        content: {
          requestId: agentRequest.requestId,
          step: 'error',
          message: 'An error occurred during processing'
        }
      });
    }
    
    return messages;
  }
}

// Singleton instance
export const mcp = new MasterControlProgram();