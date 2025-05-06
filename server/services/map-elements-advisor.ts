import { openAIService } from './openai-service';

/**
 * Service for map elements advisor functionality
 * 
 * This service provides recommendations for map elements based on cartographic best practices
 */
export class MapElementsAdvisorService {
  private standardElements: any[] | null = null;
  
  /**
   * Get the standard map elements
   * 
   * @returns Array of standard map elements
   */
  async getStandardElements() {
    // Cache the standard elements to avoid repeated API calls
    if (!this.standardElements) {
      try {
        this.standardElements = await openAIService.getStandardMapElements();
      } catch (error) {
        console.error('Error fetching standard map elements:', error);
        throw new Error('Failed to fetch standard map elements');
      }
    }
    
    return this.standardElements;
  }
  
  /**
   * Evaluate a map description against standard cartographic practices
   * 
   * @param mapDescription Description of the map
   * @param mapPurpose Purpose of the map
   * @param mapContext Additional context about the map
   * @returns Evaluation results with suggestions
   */
  async evaluateMapDescription(
    mapDescription: string,
    mapPurpose: string,
    mapContext?: string
  ) {
    try {
      const analysis = await openAIService.analyzeMapElements(
        mapDescription,
        mapPurpose,
        mapContext
      );
      
      return analysis;
    } catch (error) {
      console.error('Error evaluating map description:', error);
      throw new Error('Failed to evaluate map description');
    }
  }
  
  /**
   * Get detailed suggestions for implementing a specific map element
   * 
   * @param elementId ID of the element to get suggestions for
   * @param mapDescription Description of the map for context
   * @returns Detailed suggestions for implementation
   */
  async getElementSuggestions(elementId: string, mapDescription: string) {
    try {
      // First get the standard elements to find the specific element
      const elements = await this.getStandardElements();
      const element = elements.find(el => el.id === elementId);
      
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }
      
      const suggestions = await openAIService.getElementSuggestions(
        elementId,
        element.name,
        mapDescription
      );
      
      return {
        element,
        suggestions
      };
    } catch (error) {
      console.error('Error getting element suggestions:', error);
      throw new Error('Failed to get element suggestions');
    }
  }
}

// Export a singleton instance
export const mapElementsAdvisorService = new MapElementsAdvisorService();