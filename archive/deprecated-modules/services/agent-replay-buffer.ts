/**
 * Agent Replay Buffer Service
 * 
 * This service manages the experience replay buffer for agent learning and improvement.
 * It records agent interactions, maintains a priority queue of experiences,
 * and facilitates collaborative learning between agents.
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { withRetry } from '../db-resilience';
import { logger } from '../logger';
import { 
  agentExperiences,
  InsertAgentExperience
} from '../../shared/agent-schema';
import { eq, desc, and, sql, asc } from 'drizzle-orm';

/**
 * Experience interface for the replay buffer
 */
export interface Experience {
  agentId: string;
  correlationId?: string;
  initialState: Record<string, any>;
  action: string;
  result: Record<string, any>;
  nextState: Record<string, any>;
  reward: number;
  metadata?: Record<string, any>;
}

/**
 * Agent Replay Buffer Service
 * 
 * Maintains a buffer of agent experiences for training and improvement
 */
export class AgentReplayBuffer {
  private maxExperiences: number;
  private priorityThreshold: number;
  
  constructor(options?: { maxExperiences?: number, priorityThreshold?: number }) {
    this.maxExperiences = options?.maxExperiences || 10000;
    this.priorityThreshold = options?.priorityThreshold || 5;
  }
  
  /**
   * Record an agent experience
   * 
   * @param experience The experience to record
   * @param priority Priority level (higher number = higher priority)
   * @returns Promise resolving to the recorded experience ID
   */
  async recordExperience(experience: Experience, priority: number = 1): Promise<number> {
    try {
      // Calculate actual priority (influenced by reward)
      const actualPriority = priority + (experience.reward > 0 ? 2 : 0);
      
      const insertData: InsertAgentExperience = {
        agentId: experience.agentId,
        correlationId: experience.correlationId,
        initialState: experience.initialState,
        action: experience.action,
        result: experience.result,
        nextState: experience.nextState,
        reward: experience.reward,
        priority: actualPriority,
        metadata: experience.metadata || {},
        timestamp: new Date()
      };
      
      const result = await withRetry(() => 
        db.insert(agentExperiences).values(insertData).returning({ id: agentExperiences.id })
      );
      
      logger.info(`Recorded agent experience: Agent=${experience.agentId}, Action=${experience.action}, Priority=${actualPriority}`);
      
      // Prune old experiences if we've exceeded the max
      this.pruneOldExperiences();
      
      return result[0].id;
    } catch (error) {
      logger.error(`Error recording agent experience: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get high-priority experiences for training
   * 
   * @param count Maximum number of experiences to retrieve
   * @returns Promise resolving to array of experiences
   */
  async getHighPriorityExperiences(count: number = 100): Promise<Experience[]> {
    try {
      const experiences = await withRetry(() => 
        db.select()
          .from(agentExperiences)
          .where(sql`${agentExperiences.priority} >= ${this.priorityThreshold}`)
          .orderBy(desc(agentExperiences.priority), desc(agentExperiences.timestamp))
          .limit(count)
      );
      
      return experiences.map(exp => ({
        agentId: exp.agentId || '',
        correlationId: exp.correlationId,
        initialState: exp.initialState,
        action: exp.action,
        result: exp.result,
        nextState: exp.nextState,
        reward: exp.reward,
        metadata: exp.metadata
      }));
    } catch (error) {
      logger.error(`Error retrieving high-priority experiences: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Sample random experiences from the buffer
   * 
   * @param count Maximum number of experiences to retrieve
   * @returns Promise resolving to array of experiences
   */
  async sampleExperiences(count: number = 100): Promise<Experience[]> {
    try {
      // For PostgreSQL, we use random() to get random samples
      const experiences = await withRetry(() => 
        db.select()
          .from(agentExperiences)
          .orderBy(sql`RANDOM()`)
          .limit(count)
      );
      
      return experiences.map(exp => ({
        agentId: exp.agentId || '',
        correlationId: exp.correlationId,
        initialState: exp.initialState,
        action: exp.action,
        result: exp.result,
        nextState: exp.nextState,
        reward: exp.reward,
        metadata: exp.metadata
      }));
    } catch (error) {
      logger.error(`Error sampling experiences: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Get agent-specific experiences
   * 
   * @param agentId The ID of the agent
   * @param count Maximum number of experiences to retrieve
   * @returns Promise resolving to array of experiences
   */
  async getAgentExperiences(agentId: string, count: number = 100): Promise<Experience[]> {
    try {
      const experiences = await withRetry(() => 
        db.select()
          .from(agentExperiences)
          .where(eq(agentExperiences.agentId, agentId))
          .orderBy(desc(agentExperiences.timestamp))
          .limit(count)
      );
      
      return experiences.map(exp => ({
        agentId: exp.agentId || '',
        correlationId: exp.correlationId,
        initialState: exp.initialState,
        action: exp.action,
        result: exp.result,
        nextState: exp.nextState,
        reward: exp.reward,
        metadata: exp.metadata
      }));
    } catch (error) {
      logger.error(`Error retrieving agent experiences: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Get similar experiences to a given state
   * 
   * @param state The state to find similar experiences for
   * @param count Maximum number of experiences to retrieve
   * @returns Promise resolving to array of experiences
   */
  async getSimilarExperiences(state: Record<string, any>, count: number = 10): Promise<Experience[]> {
    // This is a simplified implementation that could be enhanced with vector similarity search
    // For now, we just sample random experiences as a fallback
    return this.sampleExperiences(count);
  }
  
  /**
   * Update experience priorities based on outcomes
   * 
   * @param experiences Array of experience IDs
   * @param newPriorities Array of new priority values
   * @returns Promise resolving to the number of updated experiences
   */
  async updatePriorities(experienceIds: number[], newPriorities: number[]): Promise<number> {
    if (experienceIds.length !== newPriorities.length) {
      throw new Error('Experience IDs and priorities arrays must have the same length');
    }
    
    let updatedCount = 0;
    
    for (let i = 0; i < experienceIds.length; i++) {
      try {
        const result = await withRetry(() => 
          db.update(agentExperiences)
            .set({ priority: newPriorities[i] })
            .where(eq(agentExperiences.id, experienceIds[i]))
        );
        
        updatedCount++;
      } catch (error) {
        logger.error(`Error updating experience priority: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return updatedCount;
  }
  
  /**
   * Prune old experiences to maintain buffer size
   * 
   * @returns Promise resolving to the number of deleted experiences
   */
  private async pruneOldExperiences(): Promise<number> {
    try {
      // Count total experiences
      const countResult = await withRetry(() => 
        db.select({ count: sql`COUNT(*)` }).from(agentExperiences)
      );
      
      const count = parseInt(countResult[0].count as any);
      
      // If we're over the limit, delete oldest, lowest-priority experiences
      if (count > this.maxExperiences) {
        const toDelete = count - this.maxExperiences;
        
        const result = await withRetry(() => 
          db.delete(agentExperiences)
            .where(
              sql`id IN (
                SELECT id FROM ${agentExperiences}
                ORDER BY priority ASC, timestamp ASC
                LIMIT ${toDelete}
              )`
            )
        );
        
        logger.info(`Pruned ${toDelete} old experiences from replay buffer`);
        return toDelete;
      }
      
      return 0;
    } catch (error) {
      logger.error(`Error pruning old experiences: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }
  
  /**
   * Get buffer statistics
   * 
   * @returns Promise resolving to buffer statistics
   */
  async getBufferStats(): Promise<{
    totalExperiences: number;
    highPriorityCount: number;
    agentDistribution: Record<string, number>;
    averageReward: number;
  }> {
    try {
      // Get total count
      const countResult = await withRetry(() => 
        db.select({ count: sql`COUNT(*)` }).from(agentExperiences)
      );
      
      const totalExperiences = parseInt(countResult[0].count as any);
      
      // Get high priority count
      const highPriorityResult = await withRetry(() => 
        db.select({ count: sql`COUNT(*)` })
          .from(agentExperiences)
          .where(sql`${agentExperiences.priority} >= ${this.priorityThreshold}`)
      );
      
      const highPriorityCount = parseInt(highPriorityResult[0].count as any);
      
      // Get agent distribution
      const agentCounts = await withRetry(() => 
        db.select({ 
          agentId: agentExperiences.agentId,
          count: sql`COUNT(*)`
        })
        .from(agentExperiences)
        .groupBy(agentExperiences.agentId)
      );
      
      const agentDistribution: Record<string, number> = {};
      agentCounts.forEach(item => {
        if (item.agentId) {
          agentDistribution[item.agentId] = parseInt(item.count as any);
        }
      });
      
      // Get average reward
      const rewardResult = await withRetry(() => 
        db.select({ 
          average: sql`AVG(${agentExperiences.reward})`
        })
        .from(agentExperiences)
      );
      
      const averageReward = parseFloat(rewardResult[0].average as any) || 0;
      
      return {
        totalExperiences,
        highPriorityCount,
        agentDistribution,
        averageReward
      };
    } catch (error) {
      logger.error(`Error getting buffer statistics: ${error instanceof Error ? error.message : String(error)}`);
      return {
        totalExperiences: 0,
        highPriorityCount: 0,
        agentDistribution: {},
        averageReward: 0
      };
    }
  }
}

// Export singleton instance
export const agentReplayBuffer = new AgentReplayBuffer();