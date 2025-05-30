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
  AgentEventType,
  MasterPrompt
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
  masterPrompts,
  masterPromptAcknowledgments,
  insertAgentSchema,
  insertAgentMessageSchema,
  insertMcpLogSchema,
  insertAgentEventSchema,
  InsertMasterPrompt
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
      
      // Register training event handlers
      this.registerTrainingEventHandlers();
      
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
   * Register event handlers for training-related events
   */
  private registerTrainingEventHandlers(): void {
    // Handle policy update events from training service
    this.registerEventHandler(AgentEventType.POLICY_UPDATED, async (event) => {
      try {
        logger.info(`Received policy update: ${event.updateId}`);
        
        // Get the agents that should receive this update
        const targetAgents = this.registry.getActiveAgents().filter(agent => {
          // If specific agents are targeted, check if this agent is in the list
          if (event.agentIds && event.agentIds.length > 0) {
            return event.agentIds.includes(agent.id);
          }
          // Otherwise, apply to all active agents
          return true;
        });
        
        if (targetAgents.length === 0) {
          logger.warn('No active agents found to apply policy update');
          return;
        }
        
        // Apply the policy update to all targeted agents
        let successCount = 0;
        
        for (const agent of targetAgents) {
          if (agent.updateBehavior) {
            try {
              const success = await agent.updateBehavior(event.recommendations);
              if (success) {
                successCount++;
                
                // Log successful update
                await this.logMcpEvent(
                  'TRAINING', 
                  `Policy update ${event.updateId} applied to agent ${agent.id}`,
                  { updateId: event.updateId, agentId: agent.id },
                  'INFO',
                  event.correlationId
                );
              }
            } catch (error) {
              logger.error(`Error applying policy update to agent ${agent.id}: ${error}`);
              
              // Log failed update
              await this.logMcpEvent(
                'TRAINING', 
                `Failed to apply policy update ${event.updateId} to agent ${agent.id}`,
                { 
                  updateId: event.updateId, 
                  agentId: agent.id,
                  error: error.toString()
                },
                'ERROR',
                event.correlationId
              );
            }
          }
        }
        
        logger.info(`Policy update applied to ${successCount}/${targetAgents.length} agents`);
      } catch (error) {
        logger.error(`Error processing policy update event: ${error}`);
      }
    });
    
    // Handle training completion events
    this.registerEventHandler(AgentEventType.TRAINING_COMPLETED, async (event) => {
      await this.logMcpEvent(
        'TRAINING', 
        'Training cycle completed',
        { 
          trainingId: event.trainingId,
          duration: event.duration,
          samplesProcessed: event.samplesProcessed
        },
        'INFO',
        event.correlationId
      );
      
      logger.info(`Training cycle completed: ${event.trainingId}`);
    });
    
    // Handle assistance request events
    this.registerEventHandler(AgentEventType.ASSISTANCE_REQUESTED, async (event) => {
      const requestingAgent = this.registry.getAgent(event.agentId);
      
      if (!requestingAgent) {
        logger.warn(`Assistance requested by unknown agent: ${event.agentId}`);
        return;
      }
      
      // Find agents that can provide assistance (must implement provideAssistance)
      const assistantAgents = this.registry.getActiveAgents().filter(agent => 
        agent.id !== event.agentId && typeof agent.provideAssistance === 'function'
      );
      
      if (assistantAgents.length === 0) {
        logger.warn(`No agents available to assist ${event.agentId} with issue: ${event.issue}`);
        return;
      }
      
      // For now, just use the first capable agent
      // In a more sophisticated system, we could match based on capabilities
      const assistantAgent = assistantAgents[0];
      
      try {
        // Ask the assistant agent for help
        if (assistantAgent.provideAssistance) {
          const assistanceResponse = await assistantAgent.provideAssistance({
            requestingAgentId: event.agentId,
            issue: event.issue,
            context: event.context
          });
          
          // If the requesting agent can process the assistance, forward it
          if (requestingAgent.updateBehavior) {
            await requestingAgent.updateBehavior(assistanceResponse.data);
            
            await this.logMcpEvent(
              'ASSISTANCE', 
              `Agent ${assistantAgent.id} provided assistance to ${event.agentId}`,
              { 
                assistantAgentId: assistantAgent.id,
                requestingAgentId: event.agentId,
                issue: event.issue,
                response: assistanceResponse.data
              },
              'INFO',
              event.correlationId
            );
          }
        }
      } catch (error) {
        logger.error(`Error processing assistance request: ${error}`);
        
        await this.logMcpEvent(
          'ASSISTANCE', 
          `Failed to process assistance request from ${event.agentId}`,
          { 
            requestingAgentId: event.agentId,
            issue: event.issue,
            error: error.toString()
          },
          'ERROR',
          event.correlationId
        );
      }
    });
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
    // Check if this is a special master prompt broadcast message
    if (message.messageType === 'MASTER_PROMPT' && message.payload && message.payload.masterPromptId) {
      try {
        // Use the Master Prompt broadcasting mechanism
        const masterPromptId = message.payload.masterPromptId as string;
        const targetAgentIds = message.payload.targetAgentIds as string[] | undefined;
        
        await this.broadcastMasterPrompt(masterPromptId, targetAgentIds);
        
        // Log the broadcast via message system
        logger.info(`Broadcast master prompt ${masterPromptId} via message system`);
        
        return;
      } catch (error) {
        logger.error(`Error broadcasting master prompt: ${error}`);
        // Fall back to normal broadcasting
      }
    }
    
    // Standard broadcast to all active agents
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

  /**
   * Master Prompt Methods
   */

  /**
   * Create a new master prompt
   * 
   * @param prompt The master prompt to create (without id and timestamp)
   * @returns The created master prompt with id and timestamp
   */
  async createMasterPrompt(prompt: Omit<MasterPrompt, 'id' | 'timestamp'>): Promise<MasterPrompt> {
    try {
      logger.info(`Creating new master prompt: ${prompt.name}`);
      
      // Generate a unique ID for the prompt
      const promptId = uuidv4();
      
      // Prepare prompt for insertion
      const newPrompt: InsertMasterPrompt = {
        promptId,
        version: prompt.version,
        name: prompt.name,
        description: prompt.description,
        content: prompt.content,
        parameters: prompt.parameters,
        expiresAt: prompt.expiresAt,
        priority: prompt.priority,
        scope: prompt.scope,
        isActive: true,
        createdBy: null, // Could set based on user context in a real implementation
        timestamp: new Date(),
        updatedAt: new Date()
      };
      
      // Persist to database
      await withRetry(() => db.insert(masterPrompts).values(newPrompt));
      
      // Log the creation
      await this.logMcpEvent(
        'MASTER_PROMPT', 
        `Created master prompt "${prompt.name}" (ID: ${promptId})`,
        { promptId, promptName: prompt.name }
      );
      
      // Retrieve the full prompt
      const result = await withRetry(() => 
        db.select().from(masterPrompts).where(eq(masterPrompts.promptId, promptId))
      );
      
      if (result.length === 0) {
        throw new Error(`Failed to retrieve newly created master prompt: ${promptId}`);
      }
      
      // Emit master prompt updated event
      this.emitEvent(AgentEventType.MASTER_PROMPT_UPDATED, {
        promptId,
        name: prompt.name,
        version: prompt.version,
        timestamp: new Date()
      });
      
      return result[0] as MasterPrompt;
    } catch (error) {
      logger.error(`Error creating master prompt: ${error}`);
      throw error;
    }
  }
  
  /**
   * Update an existing master prompt
   * 
   * @param id The ID of the prompt to update
   * @param updates The fields to update
   * @returns The updated master prompt
   */
  async updateMasterPrompt(id: string, updates: Partial<MasterPrompt>): Promise<MasterPrompt> {
    try {
      logger.info(`Updating master prompt: ${id}`);
      
      // Prepare updates object
      const promptUpdates: Partial<InsertMasterPrompt> = {
        ...updates,
        updatedAt: new Date()
      };
      
      // Update in database
      await withRetry(() => 
        db.update(masterPrompts)
          .set(promptUpdates)
          .where(eq(masterPrompts.promptId, id))
      );
      
      // Log the update
      await this.logMcpEvent(
        'MASTER_PROMPT', 
        `Updated master prompt (ID: ${id})`,
        { promptId: id, updates }
      );
      
      // Retrieve the updated prompt
      const result = await withRetry(() => 
        db.select().from(masterPrompts).where(eq(masterPrompts.promptId, id))
      );
      
      if (result.length === 0) {
        throw new Error(`Master prompt not found: ${id}`);
      }
      
      // Emit master prompt updated event
      this.emitEvent(AgentEventType.MASTER_PROMPT_UPDATED, {
        promptId: id,
        name: result[0].name,
        version: result[0].version,
        timestamp: new Date()
      });
      
      return result[0] as MasterPrompt;
    } catch (error) {
      logger.error(`Error updating master prompt: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get a master prompt by ID
   * 
   * @param id The ID of the prompt to retrieve
   * @returns The master prompt or null if not found
   */
  async getMasterPrompt(id: string): Promise<MasterPrompt | null> {
    try {
      const result = await withRetry(() => 
        db.select().from(masterPrompts).where(eq(masterPrompts.promptId, id))
      );
      
      if (result.length === 0) {
        return null;
      }
      
      return result[0] as MasterPrompt;
    } catch (error) {
      logger.error(`Error retrieving master prompt: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get all active master prompts
   * 
   * @returns Array of active master prompts
   */
  async getActiveMasterPrompts(): Promise<MasterPrompt[]> {
    try {
      const result = await withRetry(() => 
        db.select()
          .from(masterPrompts)
          .where(eq(masterPrompts.isActive, true))
          .orderBy(masterPrompts.timestamp)
      );
      
      return result as MasterPrompt[];
    } catch (error) {
      logger.error(`Error retrieving active master prompts: ${error}`);
      throw error;
    }
  }
  
  /**
   * Broadcast a master prompt to target agents
   * 
   * @param promptId The ID of the prompt to broadcast
   * @param targetAgents Optional list of specific agent IDs to target, otherwise uses the prompt's scope
   * @returns Number of agents the prompt was sent to
   */
  async broadcastMasterPrompt(promptId: string, targetAgents?: string[]): Promise<number> {
    try {
      // Get the prompt
      const prompt = await this.getMasterPrompt(promptId);
      
      if (!prompt) {
        throw new Error(`Master prompt not found: ${promptId}`);
      }
      
      logger.info(`Broadcasting master prompt "${prompt.name}" to agents`);
      
      // Determine target agents
      let agents: Agent[] = [];
      
      if (targetAgents && targetAgents.length > 0) {
        // If specific agents are provided, get those
        agents = targetAgents
          .map(id => this.registry.getAgent(id))
          .filter((agent): agent is Agent => !!agent);
      } else if (prompt.scope === 'ALL') {
        // If scope is ALL, broadcast to all active agents
        agents = this.registry.getActiveAgents();
      } else if (Array.isArray(prompt.scope)) {
        // If scope is an array of agent types, get active agents of those types
        const agentTypes = prompt.scope as AgentType[];
        agents = agentTypes.flatMap(type => this.registry.getAgentsByType(type))
          .filter(agent => agent.isActive);
      }
      
      if (agents.length === 0) {
        logger.warn(`No target agents found for master prompt: ${promptId}`);
        return 0;
      }
      
      // Broadcast the prompt to each agent
      let successCount = 0;
      
      for (const agent of agents) {
        try {
          // Check if agent implements receiveMasterPrompt
          if (agent.receiveMasterPrompt) {
            const success = await agent.receiveMasterPrompt(prompt);
            
            if (success) {
              successCount++;
              
              // Record acknowledgment in database
              await withRetry(() => 
                db.insert(masterPromptAcknowledgments).values({
                  promptId: prompt.promptId,
                  agentId: agent.id,
                  acknowledgedAt: new Date(),
                  status: 'ACKNOWLEDGED',
                  metadata: {
                    agentType: agent.type,
                    agentVersion: agent.version
                  }
                })
              );
              
              logger.debug(`Agent ${agent.id} (${agent.type}) acknowledged master prompt: ${promptId}`);
            }
          }
        } catch (error) {
          logger.error(`Error sending master prompt to agent ${agent.id}: ${error}`);
        }
      }
      
      // Emit directive broadcast event
      this.emitEvent(AgentEventType.DIRECTIVE_BROADCAST, {
        promptId: prompt.promptId,
        promptName: prompt.name,
        targetCount: agents.length,
        successCount,
        timestamp: new Date()
      });
      
      // Log the broadcast
      await this.logMcpEvent(
        'MASTER_PROMPT', 
        `Broadcast master prompt "${prompt.name}" to ${successCount}/${agents.length} agents`,
        { 
          promptId: prompt.promptId,
          targetCount: agents.length,
          successCount
        }
      );
      
      return successCount;
    } catch (error) {
      logger.error(`Error broadcasting master prompt: ${error}`);
      throw error;
    }
  }
  
  /**
   * Revoke an active master prompt
   * 
   * @param id The ID of the prompt to revoke
   * @returns True if successful, false otherwise
   */
  async revokeMasterPrompt(id: string): Promise<boolean> {
    try {
      // Set prompt as inactive
      await withRetry(() => 
        db.update(masterPrompts)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(masterPrompts.promptId, id))
      );
      
      // Log the revocation
      await this.logMcpEvent(
        'MASTER_PROMPT', 
        `Revoked master prompt (ID: ${id})`,
        { promptId: id }
      );
      
      logger.info(`Revoked master prompt: ${id}`);
      
      return true;
    } catch (error) {
      logger.error(`Error revoking master prompt: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const masterControlProgram = new MasterControlProgram();