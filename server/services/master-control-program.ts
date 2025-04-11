/**
 * Master Control Program (MCP)
 * 
 * The MCP is the central orchestration component for the agent-based architecture.
 * It manages agent registration, communication, and task distribution.
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { withRetry } from '../db-resilience';
import { logger } from '../logger';
import { 
  Agent, 
  AgentType, 
  AgentMessage, 
  AgentRequest, 
  AgentResponse, 
  AgentCapability, 
  AgentRegistry, 
  MasterControlProgram as IMasterControlProgram,
  MessageStatus,
  PriorityLevel,
  AgentEventType
} from '../../shared/agent-framework';
import { agentReplayBuffer, Experience } from './agent-replay-buffer';
import { agentTrainingService } from './agent-training-service';
import { 
  agents as agentsTable,
  agentCapabilities as agentCapabilitiesTable,
  agentMessages as agentMessagesTable,
  agentTasks as agentTasksTable,
  mcpLogs as mcpLogsTable,
  agentEvents as agentEventsTable,
  insertAgentSchema,
  insertAgentMessageSchema,
  insertMcpLogSchema,
  insertAgentEventSchema
} from '../../shared/agent-schema';
import { eq, and } from 'drizzle-orm';

/**
 * In-memory registry for agent instances
 */
class AgentRegistryImpl implements AgentRegistry {
  private agents: Map<string, Agent> = new Map();

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    logger.info(`Agent registered: ${agent.id} (${agent.type})`);
  }

  unregisterAgent(agentId: string): void {
    if (this.agents.has(agentId)) {
      this.agents.delete(agentId);
      logger.info(`Agent unregistered: ${agentId}`);
    }
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAgentsByType(type: AgentType): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getActiveAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.isActive);
  }
}

/**
 * Master Control Program implementation
 */
export class MasterControlProgram implements IMasterControlProgram {
  registry: AgentRegistry = new AgentRegistryImpl();
  private eventHandlers: Map<string, ((event: any) => void)[]> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize the MCP and load any persisted agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('Initializing Master Control Program (MCP)');
      
      // Load persisted agents from database
      await this.loadPersistedAgents();
      
      // Initialize agent training service
      agentTrainingService.initialize();
      
      // Log initialization
      await this.logMcpEvent('SYSTEM', 'MCP initialized successfully');
      
      this.initialized = true;
      logger.info('Master Control Program (MCP) initialized successfully');
      
      // Emit system status changed event
      this.emitEvent(AgentEventType.SYSTEM_STATUS_CHANGED, {
        status: 'ACTIVE',
        timestamp: new Date(),
        agentCount: this.registry.getAllAgents().length
      });
    } catch (error) {
      logger.error(`MCP initialization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Load any persisted agents from the database
   */
  private async loadPersistedAgents(): Promise<void> {
    try {
      // This is a simplified implementation
      // In a real implementation, we would load agents from the database and initialize them
      logger.info('Loading persisted agents from database');
      // Future implementation: Load and register agent implementations
    } catch (error) {
      logger.error(`Failed to load persisted agents: ${error}`);
      throw error;
    }
  }

  /**
   * Route a message to the appropriate agent
   */
  async routeMessage(message: AgentMessage): Promise<void> {
    try {
      // Log the message
      await this.persistMessage(message);
      
      // Get the recipient agent
      const agent = this.registry.getAgent(message.recipient);
      
      if (!agent) {
        logger.warn(`No agent found for message recipient: ${message.recipient}`);
        
        // Update message status to failed
        const updatedMessage: Partial<AgentMessage> = {
          ...message,
          status: MessageStatus.FAILED
        };
        
        await this.updateMessage(message.id, updatedMessage);
        return;
      }
      
      // Update message status to processing
      await this.updateMessage(message.id, { status: MessageStatus.PROCESSING });
      
      // Create an agent request from the message
      const request: AgentRequest = {
        type: message.messageType,
        action: message.messageType,
        priority: message.priority as PriorityLevel,
        payload: message.payload,
        metadata: {
          correlationId: message.correlationId,
          requestedBy: message.sender
        }
      };
      
      // Handle the request
      const response = await agent.handleRequest(request);
      
      // Update message status based on response
      const updatedMessage: Partial<AgentMessage> = {
        status: response.success ? MessageStatus.COMPLETED : MessageStatus.FAILED,
        payload: {
          ...message.payload,
          response: response.data
        }
      };
      
      await this.updateMessage(message.id, updatedMessage);
      
      // Emit message processed event
      this.emitEvent(AgentEventType.MESSAGE_PROCESSED, {
        messageId: message.id,
        success: response.success,
        sender: message.sender,
        recipient: message.recipient,
        correlationId: message.correlationId
      });
    } catch (error) {
      logger.error(`Error routing message: ${error}`);
      
      // Update message status to failed
      await this.updateMessage(message.id, { status: MessageStatus.FAILED });
      
      // Emit error event
      this.emitEvent(AgentEventType.ERROR_OCCURRED, {
        source: 'MCP',
        operation: 'routeMessage',
        error: error
      });
    }
  }

  /**
   * Dispatch a request to the appropriate agent
   */
  async dispatchRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      // Create a correlation ID if not provided
      const correlationId = request.metadata?.correlationId || uuidv4();
      
      // Determine the agent type based on the request
      const agentType = this.determineAgentType(request);
      
      // Find an active agent of the determined type
      const agents = this.registry.getAgentsByType(agentType);
      const activeAgents = agents.filter(agent => agent.isActive);
      
      if (activeAgents.length === 0) {
        logger.warn(`No active agents found for type: ${agentType}`);
        return {
          success: false,
          messageId: uuidv4(),
          correlationId,
          error: {
            code: 'NO_AGENT_AVAILABLE',
            message: `No active agents available for ${agentType}`
          }
        };
      }
      
      // For now, just use the first available agent
      // In a more advanced implementation, we could use load balancing
      const selectedAgent = activeAgents[0];
      
      // Create a message for tracking
      const message: AgentMessage = {
        id: uuidv4(),
        timestamp: new Date(),
        sender: 'MCP',
        recipient: selectedAgent.id,
        messageType: request.type,
        priority: request.priority,
        payload: request.payload,
        status: MessageStatus.PENDING,
        correlationId
      };
      
      // Persist the message
      await this.persistMessage(message);
      
      // Capture initial state for experience recording
      const initialState = {
        request: {
          type: request.type,
          action: request.action,
          payload: request.payload
        },
        agentId: selectedAgent.id,
        timestamp: new Date()
      };
      
      // Emit message received event
      this.emitEvent(AgentEventType.MESSAGE_RECEIVED, {
        messageId: message.id,
        sender: message.sender,
        recipient: message.recipient,
        type: message.messageType,
        correlationId
      });
      
      // Update message status to processing
      await this.updateMessage(message.id, { status: MessageStatus.PROCESSING });
      
      // Handle the request
      const response = await selectedAgent.handleRequest(request);
      
      // Capture final state for experience recording
      const nextState = {
        response: {
          success: response.success,
          data: response.data,
          error: response.error
        },
        timestamp: new Date()
      };
      
      // Record the experience
      this.recordAgentExperience({
        agentId: selectedAgent.id,
        correlationId,
        initialState,
        action: request.action || request.type,
        result: { 
          success: response.success,
          data: response.data,
          error: response.error
        },
        nextState,
        reward: response.success ? 1 : -0.5, // Simple reward function
        metadata: {
          messageId: message.id,
          requestType: request.type,
          executionTime: new Date().getTime() - message.timestamp.getTime()
        }
      });
      
      // Update message status based on response
      const updatedMessage: Partial<AgentMessage> = {
        status: response.success ? MessageStatus.COMPLETED : MessageStatus.FAILED,
        payload: {
          ...message.payload,
          response: response.data
        }
      };
      
      await this.updateMessage(message.id, updatedMessage);
      
      // Return the response with the message ID
      return {
        ...response,
        messageId: message.id,
        correlationId
      };
    } catch (error) {
      logger.error(`Error dispatching request: ${error}`);
      
      // Emit error event
      this.emitEvent(AgentEventType.ERROR_OCCURRED, {
        source: 'MCP',
        operation: 'dispatchRequest',
        error: error
      });
      
      return {
        success: false,
        messageId: uuidv4(),
        error: {
          code: 'DISPATCH_ERROR',
          message: `Error dispatching request: ${error}`,
          details: error
        }
      };
    }
  }

  /**
   * Determine the agent type for a request based on its content
   */
  private determineAgentType(request: AgentRequest): AgentType {
    // This is a simplified implementation
    // In a real implementation, we would have more sophisticated routing logic
    
    // For now, we'll use some basic rules
    const type = request.type.toLowerCase();
    
    if (type.includes('validation') || type.includes('quality')) {
      return 'DATA_VALIDATION';
    } else if (type.includes('valuation') || type.includes('appraisal')) {
      return 'VALUATION';
    } else if (type.includes('tax') || type.includes('payment')) {
      return 'TAX_INFORMATION';
    } else if (type.includes('workflow') || type.includes('process')) {
      return 'WORKFLOW';
    } else if (type.includes('compliance') || type.includes('legal')) {
      return 'LEGAL_COMPLIANCE';
    } else {
      return 'USER_INTERACTION';
    }
  }

  /**
   * Broadcast a message to all active agents
   */
  async broadcastMessage(message: Omit<AgentMessage, 'recipient'>): Promise<void> {
    const activeAgents = this.registry.getActiveAgents();
    
    for (const agent of activeAgents) {
      const agentMessage: AgentMessage = {
        ...message,
        recipient: agent.id
      };
      
      await this.routeMessage(agentMessage);
    }
  }

  /**
   * Register an event handler
   */
  registerEventHandler(eventType: string, handler: (event: any) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Emit an event to registered handlers
   */
  private emitEvent(eventType: string, event: any): void {
    if (!this.eventHandlers.has(eventType)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(eventType)!;
    
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        logger.error(`Error in event handler for ${eventType}: ${error}`);
      }
    }
  }

  /**
   * Get the status of a specific agent
   */
  async getAgentStatus(agentId: string): Promise<Record<string, any>> {
    const agent = this.registry.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    return agent.getStatus();
  }

  /**
   * Get the overall system status
   */
  async getSystemStatus(): Promise<Record<string, any>> {
    const agents = this.registry.getAllAgents();
    const activeAgents = this.registry.getActiveAgents();
    
    return {
      status: this.initialized ? 'ACTIVE' : 'INITIALIZING',
      agentCount: agents.length,
      activeAgentCount: activeAgents.length,
      agentTypes: Array.from(new Set(agents.map(agent => agent.type))),
      timestamp: new Date()
    };
  }

  /**
   * Shut down the MCP
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Master Control Program');
    
    // Stop training service
    agentTrainingService.stopPeriodicTraining();
    
    // Shut down all agents
    const agents = this.registry.getAllAgents();
    
    for (const agent of agents) {
      try {
        await agent.shutdown();
      } catch (error) {
        logger.error(`Error shutting down agent ${agent.id}: ${error}`);
      }
    }
    
    // Log shutdown
    await this.logMcpEvent('SYSTEM', 'MCP shut down');
    
    this.initialized = false;
    logger.info('Master Control Program shut down successfully');
  }

  /**
   * Persist an agent message to the database
   */
  private async persistMessage(message: AgentMessage): Promise<void> {
    await withRetry(async () => {
      await db.insert(agentMessagesTable).values({
        messageId: message.id,
        timestamp: message.timestamp,
        sender: message.sender,
        recipient: message.recipient,
        messageType: message.messageType,
        priority: message.priority as PriorityLevel,
        payload: message.payload,
        status: message.status,
        correlationId: message.correlationId,
        expiresAt: message.expiresAt,
        createdAt: new Date()
      });
    });
  }

  /**
   * Update a message in the database
   */
  private async updateMessage(messageId: string, update: Partial<AgentMessage>): Promise<void> {
    await withRetry(async () => {
      await db.update(agentMessagesTable)
        .set({
          status: update.status,
          payload: update.payload,
          processedAt: update.status === MessageStatus.COMPLETED || update.status === MessageStatus.FAILED ? new Date() : undefined
        })
        .where(eq(agentMessagesTable.messageId, messageId));
    });
  }

  /**
   * Log an MCP event to the database
   */
  private async logMcpEvent(component: string, message: string, details?: Record<string, any>, level: string = 'INFO', correlationId?: string): Promise<void> {
    await withRetry(async () => {
      await db.insert(mcpLogsTable).values({
        level,
        component,
        message,
        details: details || {},
        correlationId,
        timestamp: new Date()
      });
    });
  }
  
  /**
   * Record an agent experience for learning
   * 
   * @param experience The experience to record
   */
  private async recordAgentExperience(experience: Experience): Promise<void> {
    try {
      // Determine the priority based on success/failure and other factors
      let priority = 1;
      
      if (!experience.result.success) {
        // Failed experiences are more valuable for learning
        priority = 2;
      }
      
      // Record the experience in the replay buffer
      const experienceId = await agentReplayBuffer.recordExperience(experience, priority);
      
      // Emit an event about the recorded experience
      this.emitEvent(AgentEventType.EXPERIENCE_RECORDED, {
        experienceId,
        agentId: experience.agentId,
        action: experience.action,
        success: experience.result.success,
        timestamp: new Date()
      });
      
      logger.debug(`Recorded agent experience: ${experienceId} for agent ${experience.agentId}`);
    } catch (error) {
      logger.error(`Error recording agent experience: ${error}`);
    }
  }
}

// Export singleton instance
export const masterControlProgram = new MasterControlProgram();