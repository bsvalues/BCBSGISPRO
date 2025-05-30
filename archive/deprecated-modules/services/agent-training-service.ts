/**
 * Agent Training Service
 * 
 * This service manages collaborative learning between agents by:
 * 1. Analyzing experiences from the replay buffer
 * 2. Generating training data and policy updates
 * 3. Distributing learning to agents
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { withRetry } from '../db-resilience';
import { logger } from '../logger';
import { 
  Agent,
  AgentRequest,
  AgentResponse,
  PriorityLevel
} from '../../shared/agent-framework';
import { agentReplayBuffer, Experience } from './agent-replay-buffer';

/**
 * Interface for agent policy updates
 */
export interface PolicyUpdate {
  timestamp: Date;
  updateId: string;
  recommendations: Record<string, any>;
  agentIds: string[];
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Training configuration interface
 */
export interface TrainingConfig {
  samplingStrategy: 'random' | 'priority' | 'balanced';
  sampleSize: number;
  learningRate: number;
  includeAgentIds?: string[];
  excludeAgentIds?: string[];
  priorityThreshold?: number;
  trainingFrequency?: number; // minutes
}

/**
 * Agent Training Service
 */
export class AgentTrainingService {
  private config: TrainingConfig;
  private trainingInterval?: NodeJS.Timeout;
  
  constructor(config?: Partial<TrainingConfig>) {
    this.config = {
      samplingStrategy: config?.samplingStrategy || 'balanced',
      sampleSize: config?.sampleSize || 100,
      learningRate: config?.learningRate || 0.1,
      includeAgentIds: config?.includeAgentIds,
      excludeAgentIds: config?.excludeAgentIds,
      priorityThreshold: config?.priorityThreshold || 5,
      trainingFrequency: config?.trainingFrequency || 15
    };
  }
  
  /**
   * Initialize the training service
   */
  initialize(): void {
    if (this.config.trainingFrequency && this.config.trainingFrequency > 0) {
      this.startPeriodicTraining();
    }
  }
  
  /**
   * Start periodic training
   */
  startPeriodicTraining(): void {
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
    }
    
    const intervalMs = this.config.trainingFrequency! * 60 * 1000;
    
    this.trainingInterval = setInterval(async () => {
      try {
        logger.info('Starting periodic agent training...');
        const policyUpdate = await this.trainAgents();
        logger.info(`Periodic training complete, policy update: ${policyUpdate.updateId}`);
      } catch (error) {
        logger.error(`Error during periodic training: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, intervalMs);
    
    logger.info(`Started periodic agent training (every ${this.config.trainingFrequency} minutes)`);
  }
  
  /**
   * Stop periodic training
   */
  stopPeriodicTraining(): void {
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
      this.trainingInterval = undefined;
      logger.info('Stopped periodic agent training');
    }
  }
  
  /**
   * Train agents based on experiences
   * 
   * @returns Promise resolving to a policy update
   */
  async trainAgents(): Promise<PolicyUpdate> {
    // Get experiences based on sampling strategy
    const experiences = await this.getTrainingExperiences();
    
    if (experiences.length === 0) {
      logger.info('No experiences available for training');
      return {
        timestamp: new Date(),
        updateId: uuidv4(),
        recommendations: {},
        agentIds: [],
        metadata: {
          status: 'NO_EXPERIENCES'
        }
      };
    }
    
    // Group experiences by agent
    const agentExperiences = this.groupExperiencesByAgent(experiences);
    
    // Generate policy recommendations
    const policyUpdate = await this.generatePolicyUpdate(agentExperiences);
    
    // Store policy update (future enhancement)
    
    return policyUpdate;
  }
  
  /**
   * Apply policy update to specified agents
   * 
   * @param policyUpdate The policy update to apply
   * @param agents Array of agents to apply the update to
   * @returns Promise resolving to the number of successful updates
   */
  async applyPolicyUpdate(policyUpdate: PolicyUpdate, agents: Agent[]): Promise<number> {
    let successCount = 0;
    
    for (const agent of agents) {
      // Check if this agent has recommendations
      const agentRecommendations = policyUpdate.recommendations[agent.id];
      if (!agentRecommendations) continue;
      
      try {
        // Create request to update agent behavior
        const request: AgentRequest = {
          type: agent.type,
          action: 'UPDATE_BEHAVIOR',
          priority: PriorityLevel.HIGH,
          payload: {
            updateId: policyUpdate.updateId,
            recommendations: agentRecommendations
          },
          metadata: {
            source: 'TRAINING_SERVICE',
            correlationId: policyUpdate.updateId
          }
        };
        
        // Send update to agent
        const response = await agent.handleRequest(request);
        
        if (response.success) {
          successCount++;
          logger.info(`Successfully updated agent behavior: ${agent.id}`);
        } else {
          logger.warn(`Failed to update agent behavior: ${agent.id} - ${response.error?.message}`);
        }
      } catch (error) {
        logger.error(`Error applying policy update to agent ${agent.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return successCount;
  }
  
  /**
   * Get training experiences based on configured sampling strategy
   * 
   * @returns Promise resolving to array of experiences
   */
  private async getTrainingExperiences(): Promise<Experience[]> {
    switch (this.config.samplingStrategy) {
      case 'random':
        return await agentReplayBuffer.sampleExperiences(this.config.sampleSize);
        
      case 'priority':
        return await agentReplayBuffer.getHighPriorityExperiences(this.config.sampleSize);
        
      case 'balanced':
      default:
        // Get half from high priority, half random
        const highPriorityCount = Math.floor(this.config.sampleSize / 2);
        const randomCount = this.config.sampleSize - highPriorityCount;
        
        const highPriorityExperiences = await agentReplayBuffer.getHighPriorityExperiences(highPriorityCount);
        const randomExperiences = await agentReplayBuffer.sampleExperiences(randomCount);
        
        // Combine and remove duplicates
        const combinedExperiences = [...highPriorityExperiences, ...randomExperiences];
        return combinedExperiences;
    }
  }
  
  /**
   * Group experiences by agent ID
   * 
   * @param experiences Array of experiences
   * @returns Record of agent IDs to arrays of experiences
   */
  private groupExperiencesByAgent(experiences: Experience[]): Record<string, Experience[]> {
    const groupedExperiences: Record<string, Experience[]> = {};
    
    for (const experience of experiences) {
      if (!experience.agentId) continue;
      
      if (!groupedExperiences[experience.agentId]) {
        groupedExperiences[experience.agentId] = [];
      }
      
      groupedExperiences[experience.agentId].push(experience);
    }
    
    return groupedExperiences;
  }
  
  /**
   * Generate policy update from grouped experiences
   * 
   * @param groupedExperiences Record of agent IDs to arrays of experiences
   * @returns Promise resolving to a policy update
   */
  private async generatePolicyUpdate(groupedExperiences: Record<string, Experience[]>): Promise<PolicyUpdate> {
    const agentIds = Object.keys(groupedExperiences);
    const updateId = uuidv4();
    const timestamp = new Date();
    
    // This is a simplified implementation - in a real system, this would use more
    // sophisticated algorithms for learning from experiences
    
    const recommendations: Record<string, any> = {};
    
    for (const agentId of agentIds) {
      const experiences = groupedExperiences[agentId];
      
      // Skip agents with too few experiences
      if (experiences.length < 5) continue;
      
      // Analyze successful vs unsuccessful experiences
      const successfulExperiences = experiences.filter(exp => exp.reward > 0);
      const unsuccessfulExperiences = experiences.filter(exp => exp.reward <= 0);
      
      // Generate recommendations
      const agentRecommendations: Record<string, any> = {};
      
      // Identify successful actions
      const actionCounts: Record<string, { count: number, totalReward: number }> = {};
      
      for (const exp of experiences) {
        if (!actionCounts[exp.action]) {
          actionCounts[exp.action] = { count: 0, totalReward: 0 };
        }
        
        actionCounts[exp.action].count++;
        actionCounts[exp.action].totalReward += exp.reward;
      }
      
      // Calculate average reward per action
      const actionPerformance: Record<string, number> = {};
      
      for (const [action, data] of Object.entries(actionCounts)) {
        actionPerformance[action] = data.totalReward / data.count;
      }
      
      // Find best performing actions
      const sortedActions = Object.entries(actionPerformance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      // Add recommendations
      agentRecommendations.preferredActions = sortedActions.map(([action]) => action);
      agentRecommendations.actionPerformance = actionPerformance;
      
      // Add pattern recommendations based on state analysis
      // This is a simplified placeholder - real implementation would be more complex
      agentRecommendations.patterns = {
        identifiedPatterns: []
      };
      
      // Add to overall recommendations
      recommendations[agentId] = agentRecommendations;
    }
    
    return {
      timestamp,
      updateId,
      recommendations,
      agentIds,
      metadata: {
        experienceCounts: Object.fromEntries(
          Object.entries(groupedExperiences).map(([agentId, exps]) => [agentId, exps.length])
        ),
        generationMethod: this.config.samplingStrategy
      }
    };
  }
  
  /**
   * Get training service configuration
   * 
   * @returns Current configuration
   */
  getConfig(): TrainingConfig {
    return { ...this.config };
  }
  
  /**
   * Update training service configuration
   * 
   * @param config New configuration values
   * @returns Updated configuration
   */
  updateConfig(config: Partial<TrainingConfig>): TrainingConfig {
    this.config = {
      ...this.config,
      ...config
    };
    
    // Restart periodic training if frequency changed
    if (config.trainingFrequency !== undefined) {
      this.stopPeriodicTraining();
      if (this.config.trainingFrequency > 0) {
        this.startPeriodicTraining();
      }
    }
    
    return this.config;
  }
}

// Export singleton instance
export const agentTrainingService = new AgentTrainingService();