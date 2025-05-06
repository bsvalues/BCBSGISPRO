import { openAIService } from './openai-service';

// Define the standard 33 map elements
const standardMapElements = [
  {
    id: 'title',
    name: 'Map Title',
    description: 'Clear, concise title that describes the map content',
    category: 'identification',
    importance: 'high',
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Explanation of symbols, colors, and patterns used in the map',
    category: 'identification',
    importance: 'high',
  },
  {
    id: 'scale',
    name: 'Scale Bar',
    description: 'Visual or numerical representation of map distance to real-world distance',
    category: 'technical',
    importance: 'high',
  },
  {
    id: 'north-arrow',
    name: 'North Arrow',
    description: 'Indicator showing the direction of geographic north',
    category: 'navigation',
    importance: 'high',
  },
  {
    id: 'data-source',
    name: 'Data Source',
    description: 'Attribution of where the map data came from',
    category: 'technical',
    importance: 'medium',
  },
  {
    id: 'projection',
    name: 'Projection Information',
    description: 'Details about the map projection method used',
    category: 'technical',
    importance: 'medium',
  },
  {
    id: 'date',
    name: 'Date',
    description: 'When the map was created or the data was collected',
    category: 'technical',
    importance: 'medium',
  },
  {
    id: 'author',
    name: 'Author/Publisher',
    description: 'Who created or published the map',
    category: 'identification',
    importance: 'medium',
  },
  {
    id: 'grid',
    name: 'Grid/Graticule',
    description: 'Coordinate system grid lines for precise location reference',
    category: 'navigation',
    importance: 'medium',
  },
  {
    id: 'inset-map',
    name: 'Inset/Locator Map',
    description: 'Smaller map showing where the main map is located in a broader context',
    category: 'navigation',
    importance: 'medium',
  }
  // Note: We're only listing 10 elements here for brevity, the AI will generate the full 33
];

/**
 * Service for map elements advisor functionality
 */
export class MapElementsAdvisorService {
  /**
   * Get the standard map elements
   * @returns List of standard map elements
   */
  getStandardMapElements() {
    return standardMapElements;
  }

  /**
   * Evaluate a map description and provide AI-powered suggestions
   * 
   * @param mapDescription Description of the map
   * @param mapPurpose Purpose of the map
   * @param mapContext Additional context about the map
   * @returns Evaluation result with suggestions
   */
  async evaluateMapElements(
    mapDescription: string,
    mapPurpose: string,
    mapContext?: string
  ) {
    try {
      // Get AI-powered suggestions
      const result = await openAIService.generateMapElementsSuggestions(
        mapDescription,
        mapPurpose,
        mapContext
      );
      
      return result;
    } catch (error) {
      console.error('Error evaluating map elements:', error);
      throw new Error('Failed to evaluate map elements');
    }
  }

  /**
   * Get detailed AI suggestions for a specific map element
   * 
   * @param elementId ID of the element
   * @param mapDescription Description of the map for context
   * @returns Detailed suggestions for the element
   */
  async getElementSuggestions(elementId: string, mapDescription: string) {
    try {
      // Find the element details from our standard elements
      const element = standardMapElements.find(e => e.id === elementId);
      
      if (!element) {
        // Try to find in AI results or use a generic name
        const elementName = elementId;
        return openAIService.generateElementSuggestions(elementId, elementName, mapDescription);
      }
      
      return openAIService.generateElementSuggestions(elementId, element.name, mapDescription);
    } catch (error) {
      console.error('Error getting element suggestions:', error);
      throw new Error('Failed to get element suggestions');
    }
  }
}

// Export a singleton instance
export const mapElementsAdvisorService = new MapElementsAdvisorService();