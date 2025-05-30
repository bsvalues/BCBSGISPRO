import { storage } from '../storage';
import openAIService from './openai-service';
import { logger } from '../logger';

/**
 * Service for providing map element advice based on Benton County's 33 essential map elements
 */
class MapElementsAdvisorService {
  /**
   * Get all standard map elements from the database
   * @returns Array of map elements
   */
  async getStandardMapElements() {
    try {
      const elements = await storage.getAllMapElements();
      return elements;
    } catch (error) {
      logger.error('Error fetching map elements:', error);
      throw new Error('Failed to fetch map elements');
    }
  }

  /**
   * Get map elements by category
   * @param category Category to filter by
   * @returns Array of map elements in the specified category
   */
  async getMapElementsByCategory(category: string) {
    try {
      const elements = await storage.getMapElementsByCategory(category);
      return elements;
    } catch (error) {
      logger.error(`Error fetching map elements for category ${category}:`, error);
      throw new Error('Failed to fetch map elements by category');
    }
  }

  /**
   * Get map elements by importance level
   * @param importance Importance level ('high', 'medium', or 'low')
   * @returns Array of map elements with the specified importance
   */
  async getMapElementsByImportance(importance: string) {
    try {
      const elements = await storage.getMapElementsByImportance(importance);
      return elements;
    } catch (error) {
      logger.error(`Error fetching map elements with importance ${importance}:`, error);
      throw new Error('Failed to fetch map elements by importance');
    }
  }

  /**
   * Search map elements by query string
   * @param query Search query
   * @returns Array of matching map elements
   */
  async searchMapElements(query: string) {
    try {
      const elements = await storage.searchMapElements(query);
      return elements;
    } catch (error) {
      logger.error(`Error searching map elements for "${query}":`, error);
      throw new Error('Failed to search map elements');
    }
  }

  /**
   * Evaluate a map description and provide AI-powered element recommendations
   * @param mapDescription Description of the map
   * @param mapPurpose Purpose of the map
   * @param mapContext Additional context about the map (optional)
   * @returns AI evaluation and recommendations
   */
  async evaluateMapElements(mapDescription: string, mapPurpose: string, mapContext?: string) {
    try {
      // Get AI recommendations
      const aiRecommendations = await openAIService.analyzeMapElements(
        mapDescription,
        mapPurpose,
        mapContext
      );

      // Create a map evaluation record
      const evaluation = await storage.createMapEvaluation({
        mapDescription,
        mapPurpose,
        mapContext,
        overallScore: aiRecommendations.overallScore || 0,
        aiRecommendations: JSON.stringify(aiRecommendations.recommendations || '')
      });

      // Create element evaluation records for each recommendation
      if (aiRecommendations.elementRecommendations && Array.isArray(aiRecommendations.elementRecommendations)) {
        for (const rec of aiRecommendations.elementRecommendations) {
          await storage.createElementEvaluation({
            mapEvaluationId: evaluation.id,
            elementId: rec.elementId,
            implementationStatus: rec.implemented ? 'implemented' : 'missing',
            aiTips: rec.implementationTips
          });
        }
      }

      return {
        evaluationId: evaluation.id,
        overallScore: aiRecommendations.overallScore,
        recommendations: aiRecommendations.recommendations,
        elements: aiRecommendations.elementRecommendations
      };
    } catch (error) {
      logger.error('Error evaluating map elements:', error);
      throw new Error(`Failed to evaluate map elements: ${error.message}`);
    }
  }

  /**
   * Get detailed AI suggestions for a specific map element
   * @param elementId ID of the element to get suggestions for
   * @param mapDescription Description of the map
   * @param mapPurpose Purpose of the map
   * @returns Detailed suggestions for implementing the element
   */
  async getElementSuggestions(elementId: string, mapDescription: string, mapPurpose?: string) {
    try {
      // Get element details
      const element = await storage.getMapElementByElementId(elementId);
      
      if (!element) {
        throw new Error(`Element with ID ${elementId} not found`);
      }

      // Get AI improvement plan
      const improvementPlan = await openAIService.generateElementImprovement(
        elementId,
        element.name,
        element.description,
        mapDescription,
        mapPurpose || 'Not specified'
      );

      return {
        element,
        suggestions: improvementPlan
      };
    } catch (error) {
      logger.error(`Error getting suggestions for element ${elementId}:`, error);
      throw new Error(`Failed to get element suggestions: ${error.message}`);
    }
  }
}

export const mapElementsAdvisorService = new MapElementsAdvisorService();