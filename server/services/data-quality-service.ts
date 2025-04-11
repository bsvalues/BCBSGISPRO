import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  dataQualityRules, 
  dataQualityEvaluations, 
  dataQualityScores,
  dataQualityDimensionEnum,
  dataQualityImportanceEnum,
  type DataQualityRule,
  type InsertDataQualityRule,
  type DataQualityEvaluation,
  type InsertDataQualityEvaluation,
  type DataQualityScore,
  type InsertDataQualityScore
} from '../../shared/schema';

/**
 * Service for managing data quality framework
 * 
 * This service handles:
 * 1. Data quality rules definition and management
 * 2. Data quality evaluations for entities
 * 3. Data quality scoring and metrics
 * 4. Data quality reporting
 */
class DataQualityService {
  /**
   * Get all data quality rules
   * @param dimension Optional dimension filter
   * @param entityType Optional entity type filter (PARCEL, ASSESSMENT, etc.)
   * @param importance Optional importance filter
   * @returns Array of data quality rules
   */
  async getRules(
    dimension?: typeof dataQualityDimensionEnum.enumValues[number],
    entityType?: string,
    importance?: typeof dataQualityImportanceEnum.enumValues[number]
  ): Promise<DataQualityRule[]> {
    let query = db.select().from(dataQualityRules);
    
    if (dimension) {
      query = query.where(eq(dataQualityRules.dimension, dimension));
    }
    
    if (entityType) {
      query = query.where(eq(dataQualityRules.entityType, entityType));
    }
    
    if (importance) {
      query = query.where(eq(dataQualityRules.importance, importance));
    }
    
    // Only return active rules by default
    query = query.where(eq(dataQualityRules.isActive, true));
    
    return query.orderBy(dataQualityRules.name);
  }
  
  /**
   * Get a specific data quality rule by ID
   * @param id Rule ID
   * @returns Data quality rule or undefined if not found
   */
  async getRuleById(id: number): Promise<DataQualityRule | undefined> {
    const [rule] = await db
      .select()
      .from(dataQualityRules)
      .where(eq(dataQualityRules.id, id));
    
    return rule;
  }
  
  /**
   * Create a new data quality rule
   * @param rule Rule data
   * @returns Created data quality rule
   */
  async createRule(rule: InsertDataQualityRule): Promise<DataQualityRule> {
    const [newRule] = await db
      .insert(dataQualityRules)
      .values(rule)
      .returning();
    
    return newRule;
  }
  
  /**
   * Update an existing data quality rule
   * @param id Rule ID
   * @param updates Partial rule updates
   * @returns Updated data quality rule
   */
  async updateRule(id: number, updates: Partial<InsertDataQualityRule>): Promise<DataQualityRule> {
    const [updatedRule] = await db
      .update(dataQualityRules)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(dataQualityRules.id, id))
      .returning();
    
    if (!updatedRule) {
      throw new Error(`Rule with ID ${id} not found`);
    }
    
    return updatedRule;
  }
  
  /**
   * Evaluate a single data quality rule against an entity
   * @param ruleId Rule ID
   * @param entityType Entity type (PARCEL, ASSESSMENT, etc.)
   * @param entityId Entity ID
   * @param userId User ID performing the evaluation
   * @returns Evaluation result
   */
  async evaluateRule(
    ruleId: number,
    entityType: string,
    entityId: number,
    userId?: number
  ): Promise<DataQualityEvaluation> {
    // Get the rule
    const rule = await this.getRuleById(ruleId);
    if (!rule) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }
    
    // In a real implementation, we would execute the validation logic from the rule
    // against the entity data. For now, we'll simulate the results.
    
    // Simulated validation result - in a real app this would run actual validation logic
    const passed = Math.random() > 0.3; // 70% chance of passing
    const score = passed ? 1.0 : Math.random() * 0.7; // If failed, score between 0-0.7
    
    // Create the evaluation record
    const [evaluation] = await db
      .insert(dataQualityEvaluations)
      .values({
        ruleId,
        entityType,
        entityId,
        passed,
        score,
        details: { 
          evaluationMethod: 'automated',
          passThreshold: 0.8
        },
        evaluatedAt: new Date(),
        evaluatedBy: userId
      })
      .returning();
    
    return evaluation;
  }
  
  /**
   * Evaluate all applicable rules for an entity
   * @param entityType Entity type (PARCEL, ASSESSMENT, etc.)
   * @param entityId Entity ID
   * @param userId User ID performing the evaluation
   * @returns Array of evaluation results
   */
  async evaluateEntity(
    entityType: string,
    entityId: number,
    userId?: number
  ): Promise<{
    evaluations: DataQualityEvaluation[];
    overallScore: number;
    dimensionScores: Record<string, number>;
    passRate: number;
  }> {
    // Get all active rules for this entity type
    const rules = await this.getRules(undefined, entityType);
    
    // Evaluate each rule
    const evaluations: DataQualityEvaluation[] = [];
    for (const rule of rules) {
      const evaluation = await this.evaluateRule(rule.id, entityType, entityId, userId);
      evaluations.push(evaluation);
    }
    
    // Calculate scores by dimension
    const dimensionScores: Record<string, { total: number, sum: number }> = {};
    
    for (const evaluation of evaluations) {
      const rule = rules.find(r => r.id === evaluation.ruleId);
      if (!rule) continue;
      
      // Initialize dimension if not already present
      if (!dimensionScores[rule.dimension]) {
        dimensionScores[rule.dimension] = { total: 0, sum: 0 };
      }
      
      // Weight by importance
      let weight = 1;
      if (rule.importance === 'HIGH') weight = 3;
      else if (rule.importance === 'MEDIUM') weight = 2;
      
      dimensionScores[rule.dimension].total += weight;
      dimensionScores[rule.dimension].sum += evaluation.score * weight;
    }
    
    // Calculate normalized dimension scores
    const normalizedDimensionScores: Record<string, number> = {};
    let overallSum = 0;
    let overallTotal = 0;
    
    for (const dimension in dimensionScores) {
      const { total, sum } = dimensionScores[dimension];
      normalizedDimensionScores[dimension] = total > 0 ? sum / total : 1.0;
      
      overallSum += sum;
      overallTotal += total;
    }
    
    // Calculate overall score
    const overallScore = overallTotal > 0 ? overallSum / overallTotal : 1.0;
    
    // Calculate pass rate
    const passedRules = evaluations.filter(e => e.passed).length;
    const passRate = rules.length > 0 ? passedRules / rules.length : 1.0;
    
    // Store the overall quality score
    await this.upsertDataQualityScore({
      entityType,
      entityId,
      overallScore,
      dimensionScores: normalizedDimensionScores,
      passedRules: passedRules,
      totalRules: rules.length,
      lastEvaluatedAt: new Date()
    });
    
    return {
      evaluations,
      overallScore,
      dimensionScores: normalizedDimensionScores,
      passRate
    };
  }
  
  /**
   * Get recent evaluations for an entity
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param limit Maximum number of evaluations to return
   * @returns Array of evaluations
   */
  async getEntityEvaluations(
    entityType: string,
    entityId: number,
    limit: number = 10
  ): Promise<DataQualityEvaluation[]> {
    return db
      .select()
      .from(dataQualityEvaluations)
      .where(
        and(
          eq(dataQualityEvaluations.entityType, entityType),
          eq(dataQualityEvaluations.entityId, entityId)
        )
      )
      .orderBy(desc(dataQualityEvaluations.evaluatedAt))
      .limit(limit);
  }
  
  /**
   * Get current data quality score for an entity
   * @param entityType Entity type
   * @param entityId Entity ID
   * @returns Data quality score or undefined if not found
   */
  async getDataQualityScore(
    entityType: string,
    entityId: number
  ): Promise<DataQualityScore | undefined> {
    const [score] = await db
      .select()
      .from(dataQualityScores)
      .where(
        and(
          eq(dataQualityScores.entityType, entityType),
          eq(dataQualityScores.entityId, entityId)
        )
      );
    
    return score;
  }
  
  /**
   * Create or update data quality score for an entity
   * @param score Data quality score
   * @returns Updated data quality score
   */
  private async upsertDataQualityScore(
    score: InsertDataQualityScore
  ): Promise<DataQualityScore> {
    // Check if score exists for this entity
    const existingScore = await this.getDataQualityScore(
      score.entityType,
      score.entityId
    );
    
    if (existingScore) {
      // Update existing score
      const [updatedScore] = await db
        .update(dataQualityScores)
        .set(score)
        .where(eq(dataQualityScores.id, existingScore.id))
        .returning();
      
      return updatedScore;
    } else {
      // Create new score
      const [newScore] = await db
        .insert(dataQualityScores)
        .values(score)
        .returning();
      
      return newScore;
    }
  }
  
  /**
   * Get data quality metrics for an entity type
   * @param entityType Entity type to analyze
   * @returns Data quality metrics
   */
  async getDataQualityMetrics(entityType: string): Promise<{
    averageScore: number;
    dimensionAverages: Record<string, number>;
    passRate: number;
    entityCount: number;
    lowQualityEntities: number;
    highQualityEntities: number;
  }> {
    // Get all scores for this entity type
    const scores = await db
      .select()
      .from(dataQualityScores)
      .where(eq(dataQualityScores.entityType, entityType));
    
    if (scores.length === 0) {
      return {
        averageScore: 0,
        dimensionAverages: {},
        passRate: 0,
        entityCount: 0,
        lowQualityEntities: 0,
        highQualityEntities: 0
      };
    }
    
    // Calculate average score
    const totalScore = scores.reduce((sum, score) => sum + score.overallScore, 0);
    const averageScore = totalScore / scores.length;
    
    // Calculate dimension averages
    const dimensionSums: Record<string, { sum: number, count: number }> = {};
    
    for (const score of scores) {
      const dimensions = score.dimensionScores as Record<string, number>;
      
      for (const dimension in dimensions) {
        if (!dimensionSums[dimension]) {
          dimensionSums[dimension] = { sum: 0, count: 0 };
        }
        
        dimensionSums[dimension].sum += dimensions[dimension];
        dimensionSums[dimension].count++;
      }
    }
    
    const dimensionAverages: Record<string, number> = {};
    for (const dimension in dimensionSums) {
      const { sum, count } = dimensionSums[dimension];
      dimensionAverages[dimension] = sum / count;
    }
    
    // Calculate overall pass rate
    const totalPassed = scores.reduce((sum, score) => sum + score.passedRules, 0);
    const totalRules = scores.reduce((sum, score) => sum + score.totalRules, 0);
    const passRate = totalRules > 0 ? totalPassed / totalRules : 0;
    
    // Count entities by quality level
    const lowQualityEntities = scores.filter(score => score.overallScore < 0.7).length;
    const highQualityEntities = scores.filter(score => score.overallScore > 0.9).length;
    
    return {
      averageScore,
      dimensionAverages,
      passRate,
      entityCount: scores.length,
      lowQualityEntities,
      highQualityEntities
    };
  }
}

// Export singleton instance
export const dataQualityService = new DataQualityService();