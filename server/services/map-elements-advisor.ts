import { openAIService } from './openai-service';
import { logger } from '../logger';

// Define types for map element suggestions
export interface MapElementSuggestion {
  id: string;
  name: string;
  description: string;
  importance: 'critical' | 'recommended' | 'optional';
  implementationStatus?: 'implemented' | 'missing' | 'partial';
  category: 'structure' | 'information' | 'design' | 'technical' | 'legal';
  bestPractices: string[];
  aiTips?: string;
}

export interface MapEvaluationResult {
  overallScore: number; // 0-100
  implementedElements: string[];
  missingElements: string[];
  partialElements: string[];
  suggestions: MapElementSuggestion[];
  improvementAreas: string[];
}

/**
 * Map Elements Advisor Service
 * 
 * Uses OpenAI to provide intelligent suggestions for map elements based on
 * cartographic best practices and the 33 essential map elements.
 */
export class MapElementsAdvisorService {
  // Standard map elements based on the 33 essentials
  private readonly standardMapElements: MapElementSuggestion[] = [
    {
      id: 'clear-purpose',
      name: 'Clear Purpose',
      description: 'Map has a clear purpose and intention that guides its design',
      importance: 'critical',
      category: 'structure',
      bestPractices: [
        'Define a single primary purpose for the map',
        'Ensure all elements support the stated purpose',
        'Make the purpose evident in the title and design'
      ]
    },
    {
      id: 'descriptive-title',
      name: 'Descriptive Title',
      description: 'Title reflects the author\'s intention and map purpose',
      importance: 'critical',
      category: 'information',
      bestPractices: [
        'Include geographic location in the title',
        'Use a concise but descriptive title',
        'Position the title prominently'
      ]
    },
    {
      id: 'appropriate-template',
      name: 'Appropriate Template',
      description: 'Map uses a suitable template and orientation for its content',
      importance: 'recommended',
      category: 'design',
      bestPractices: [
        'Use landscape for east-west features (highways, pipelines)',
        'Use portrait for north-south features',
        'Consider the output medium when selecting a template'
      ]
    },
    {
      id: 'branding',
      name: 'Branding Elements',
      description: 'Map includes organization and client logo when appropriate',
      importance: 'recommended',
      category: 'information',
      bestPractices: [
        'Verify permission to use logos',
        'Use the most recent logo versions',
        'Position logos consistently across map products'
      ]
    },
    {
      id: 'correct-extent',
      name: 'Appropriate Map Extent',
      description: 'Map shows an appropriate level of detail and coverage',
      importance: 'critical',
      category: 'technical',
      bestPractices: [
        'Center the main feature',
        'Include reference features for context',
        'Use an appropriate scale for the intended purpose'
      ]
    },
    {
      id: 'defined-projection',
      name: 'Defined Projection',
      description: 'Map uses an appropriate projection for its purpose',
      importance: 'critical',
      category: 'technical',
      bestPractices: [
        'Document the projection in metadata',
        'Select projections that preserve the relevant property (area, direction, or scale)',
        'Use standard projections for your region when possible'
      ]
    },
    {
      id: 'correct-content',
      name: 'Correct Content',
      description: 'Map displays accurate and properly validated data',
      importance: 'critical',
      category: 'information',
      bestPractices: [
        'Verify data sources before mapping',
        'Link to the correct and most current data files',
        'Validate data accuracy'
      ]
    },
    {
      id: 'inset-map',
      name: 'Inset Map',
      description: 'Map includes a smaller map providing geographic context',
      importance: 'recommended',
      category: 'information',
      bestPractices: [
        'Use inset maps to show the location in a broader context',
        'Use insets to focus on areas of special interest',
        'Keep inset maps simple and uncluttered'
      ]
    },
    {
      id: 'key-map',
      name: 'Key Map',
      description: 'Shows relationships between multiple map views if needed',
      importance: 'optional',
      category: 'information',
      bestPractices: [
        'Use for complex, multi-view map products',
        'Clearly indicate the relationship between views',
        'Keep key maps simple'
      ]
    },
    {
      id: 'clear-labeling',
      name: 'Clear Labeling',
      description: 'Map has purposeful, well-placed labels',
      importance: 'critical',
      category: 'information',
      bestPractices: [
        'Place labels left-to-right and south-to-north when possible',
        'Size labels based on feature importance',
        'Avoid label overlapping with features',
        'Offset labels from lines with appropriate placement'
      ]
    },
    {
      id: 'neat-lines',
      name: 'Neat Lines',
      description: 'Map has clean border lines containing the content',
      importance: 'recommended',
      category: 'design',
      bestPractices: [
        'Use consistent line weight for neat lines',
        'Include neat lines to frame the map composition',
        'Ensure neat lines don\'t interfere with map elements'
      ]
    },
    {
      id: 'layer-ordering',
      name: 'Logical Layer Order',
      description: 'Layers are arranged to ensure visibility of all important elements',
      importance: 'critical',
      category: 'technical',
      bestPractices: [
        'Place point features above line and polygon features',
        'Use transparency for overlapping features',
        'Order layers by importance and type'
      ]
    },
    {
      id: 'clear-legend',
      name: 'Clear Legend',
      description: 'Legend explains all symbols used on the map',
      importance: 'critical',
      category: 'information',
      bestPractices: [
        'Include all map symbols in the legend',
        'Order items logically (points, lines, polygons)',
        'Align legend items consistently',
        'Exclude obvious or basemap features if space is limited'
      ]
    },
    {
      id: 'scale-bar',
      name: 'Scale Bar',
      description: 'Graphical representation of map scale',
      importance: 'critical',
      category: 'technical',
      bestPractices: [
        'Use appropriate units for the map audience',
        'Place scale bar in a consistent location',
        'Ensure scale bar is accurate for the projection'
      ]
    },
    {
      id: 'production-date',
      name: 'Production Date',
      description: 'Date when the map was created or last updated',
      importance: 'recommended',
      category: 'information',
      bestPractices: [
        'Include both creation and revision dates if applicable',
        'Use a consistent date format',
        'Update dates when map content changes'
      ]
    },
    {
      id: 'metadata',
      name: 'Metadata',
      description: 'Information about the map data and creation',
      importance: 'recommended',
      category: 'information',
      bestPractices: [
        'Include data sources',
        'Document data processing steps',
        'Include contact information for questions'
      ]
    },
    {
      id: 'north-arrow',
      name: 'North Arrow',
      description: 'Indicates the direction of geographic north',
      importance: 'critical',
      category: 'technical',
      bestPractices: [
        'Use a simple, clear north arrow design',
        'Place consistently on all maps',
        'Consider if the map projection affects the north direction'
      ]
    },
    {
      id: 'filled-voids',
      name: 'Filled Voids',
      description: 'No empty or white spaces in the mapped area',
      importance: 'recommended',
      category: 'design',
      bestPractices: [
        'Use basemaps to fill voids',
        'Include appropriate attribution for basemaps',
        'Ensure basemap doesn\'t distract from primary content'
      ]
    },
    {
      id: 'disclaimer',
      name: 'Appropriate Disclaimer',
      description: 'Legal disclaimers about map use and accuracy',
      importance: 'recommended',
      category: 'legal',
      bestPractices: [
        'Have legal review disclaimers',
        'Keep disclaimers concise',
        'Include liability limitations'
      ]
    },
    {
      id: 'data-sources',
      name: 'Data Sources',
      description: 'List of data origins and references',
      importance: 'recommended',
      category: 'information',
      bestPractices: [
        'Include source names and dates',
        'Provide links or references to data origins',
        'Credit all data contributors'
      ]
    },
    {
      id: 'graticules',
      name: 'Graticules',
      description: 'Grid lines showing coordinates',
      importance: 'optional',
      category: 'technical',
      bestPractices: [
        'Use appropriate spacing for the map scale',
        'Label graticules clearly',
        'Use subtle styling that doesn\'t overwhelm the map'
      ]
    },
    {
      id: 'standard-symbology',
      name: 'Standard Symbology',
      description: 'Consistent symbols that follow cartographic conventions',
      importance: 'critical',
      category: 'design',
      bestPractices: [
        'Use intuitive symbols',
        'Be consistent across all map products',
        'Follow industry standards when they exist'
      ]
    },
    {
      id: 'scale-appropriate-symbols',
      name: 'Scale Appropriate Symbols',
      description: 'Symbols sized and designed for the map scale',
      importance: 'recommended',
      category: 'design',
      bestPractices: [
        'Adjust symbol complexity based on scale',
        'Use points for features at small scales, polygons at large scales',
        'Ensure symbols remain legible at the output size'
      ]
    },
    {
      id: 'thematic-colors',
      name: 'Thematic Colors',
      description: 'Color scheme that reflects map theme and purpose',
      importance: 'critical',
      category: 'design',
      bestPractices: [
        'Use color conventions (blue for water, etc.)',
        'Consider color-blindness in your palette',
        'Use ColorBrewer or similar tools for thematic colors',
        'Limit the number of colors to avoid confusion'
      ]
    },
    {
      id: 'appropriate-map-type',
      name: 'Appropriate Map Type',
      description: 'Map type matches the data and purpose',
      importance: 'critical',
      category: 'structure',
      bestPractices: [
        'Use choropleth maps for normalized data by area',
        'Use proportional symbols for totals',
        'Select the simplest map type that communicates the message'
      ]
    },
    {
      id: 'appropriate-typeface',
      name: 'Appropriate Typeface',
      description: 'Font selection enhances readability and map style',
      importance: 'recommended',
      category: 'design',
      bestPractices: [
        'Use serif fonts (e.g., Times) for base features',
        'Use sans-serif fonts (e.g., Arial) for thematic features',
        'Limit font variety to 2-3 fonts per map'
      ]
    },
    {
      id: 'limited-features',
      name: 'Limited Feature Count',
      description: 'Appropriate number of features for clarity',
      importance: 'recommended',
      category: 'design',
      bestPractices: [
        'Include only features relevant to the map purpose',
        'Split complex maps into multiple, simpler maps',
        'Use insets for areas requiring more detail'
      ]
    },
    {
      id: 'water-feature-styling',
      name: 'Water Feature Styling',
      description: 'Appropriate styling for water features',
      importance: 'recommended',
      category: 'design',
      bestPractices: [
        'Use blue colors for water',
        'Use italic fonts for water labels',
        'Scale text size based on feature importance'
      ]
    },
    {
      id: 'non-overlapping-text',
      name: 'Non-overlapping Text',
      description: 'Text placement that ensures readability',
      importance: 'critical',
      category: 'design',
      bestPractices: [
        'Manually adjust label positions to avoid conflicts',
        'Use halos or masks to improve text visibility',
        'Use call-outs for crowded areas'
      ]
    },
    {
      id: 'author-information',
      name: 'Author Information',
      description: 'Credits for map creation and review',
      importance: 'optional',
      category: 'information',
      bestPractices: [
        'Include creator and reviewer names',
        'Add contact information if appropriate',
        'Acknowledge contributors'
      ]
    },
    {
      id: 'correct-spelling',
      name: 'Correct Spelling',
      description: 'No spelling errors in map text',
      importance: 'critical',
      category: 'information',
      bestPractices: [
        'Proofread all text elements',
        'Check place names against authoritative sources',
        'Verify abbreviations are correct and consistent'
      ]
    },
    {
      id: 'complete-legend',
      name: 'Complete Legend',
      description: 'Legend includes all map features and uses singular forms',
      importance: 'critical',
      category: 'information',
      bestPractices: [
        'Use singular forms for legend items (e.g., "City" not "Cities")',
        'Verify all map symbols appear in the legend',
        'Ensure legend items match exactly what appears on the map'
      ]
    },
    {
      id: 'balanced-layout',
      name: 'Balanced Layout',
      description: 'Overall map composition has visual harmony',
      importance: 'recommended',
      category: 'design',
      bestPractices: [
        'Distribute elements evenly in the layout',
        'Use white space effectively',
        'Align elements to create structure',
        'Create a clear visual hierarchy'
      ]
    }
  ];

  /**
   * Evaluates a map description against best practices
   * 
   * @param mapDescription Description of the current map state
   * @param mapPurpose The intended purpose of the map
   * @param mapContext Additional context about the map use case
   * @returns Evaluation results with suggestions
   */
  async evaluateMap(
    mapDescription: string,
    mapPurpose: string,
    mapContext?: string
  ): Promise<MapEvaluationResult> {
    try {
      logger.info(`Evaluating map with purpose: ${mapPurpose}`);

      // Construct the system prompt
      const systemPrompt = `
You are a professional cartographer and GIS expert analyzing a map's elements.
Based on the map description, purpose, and context provided, evaluate which of the 33 essential map elements are implemented, missing, or partially implemented.
Then provide specific suggestions for improvement.

Respond with a JSON object with the following properties:
- overallScore: number from 0-100 representing the overall quality of the map
- implementedElements: array of element IDs that are fully implemented
- missingElements: array of element IDs that are completely missing
- partialElements: array of element IDs that are partially implemented
- suggestions: array of detailed suggestions, with each suggestion containing:
  - elementId: string matching one of the standard map elements
  - importance: string rating of 'critical', 'recommended', or 'optional'
  - issue: string describing what's missing or could be improved
  - recommendation: string with specific actionable advice
- improvementAreas: array of 3-5 high-level areas to focus on for improvement

Use the following element IDs for your analysis: ${this.standardMapElements.map(e => e.id).join(', ')}
      `;

      // Construct the user query combining the description, purpose, and context
      const userQuery = `
Map Description: ${mapDescription}

Map Purpose: ${mapPurpose}

${mapContext ? `Additional Context: ${mapContext}` : ''}

Based on this information, please evaluate which map elements are implemented, missing, or need improvement.
      `;

      // Get response from OpenAI
      interface OpenAIMapEvaluation {
        overallScore: number;
        implementedElements: string[];
        missingElements: string[];
        partialElements: string[];
        suggestions: {
          elementId: string;
          importance: 'critical' | 'recommended' | 'optional';
          issue: string;
          recommendation: string;
        }[];
        improvementAreas: string[];
      }

      const evaluation = await openAIService.generateJSON<OpenAIMapEvaluation>(
        systemPrompt,
        userQuery
      );

      // Transform the response to our internal format
      const result: MapEvaluationResult = {
        overallScore: evaluation.overallScore,
        implementedElements: evaluation.implementedElements,
        missingElements: evaluation.missingElements,
        partialElements: evaluation.partialElements,
        improvementAreas: evaluation.improvementAreas,
        suggestions: evaluation.suggestions.map(suggestion => {
          // Find the standard element that matches this suggestion
          const standardElement = this.standardMapElements.find(e => e.id === suggestion.elementId);
          
          if (!standardElement) {
            // Fallback if element not found
            return {
              id: suggestion.elementId,
              name: suggestion.elementId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              description: suggestion.issue,
              importance: suggestion.importance,
              implementationStatus: 'missing',
              category: 'information', // Default category
              bestPractices: [suggestion.recommendation],
              aiTips: suggestion.recommendation
            };
          }
          
          // Merge the standard element with the AI suggestions
          return {
            ...standardElement,
            implementationStatus: evaluation.implementedElements.includes(suggestion.elementId)
              ? 'implemented'
              : evaluation.partialElements.includes(suggestion.elementId)
                ? 'partial'
                : 'missing',
            aiTips: suggestion.recommendation
          };
        })
      };

      return result;
    } catch (error) {
      logger.error(`Error evaluating map: ${error.message}`);
      throw new Error(`Failed to evaluate map: ${error.message}`);
    }
  }

  /**
   * Get suggestions for a specific map element
   * 
   * @param elementId ID of the map element to get suggestions for
   * @param mapDescription Current map description
   * @returns Detailed suggestions for implementation
   */
  async getElementSuggestions(
    elementId: string,
    mapDescription: string
  ): Promise<string> {
    try {
      const element = this.standardMapElements.find(e => e.id === elementId);
      
      if (!element) {
        throw new Error(`Map element with ID ${elementId} not found`);
      }
      
      const prompt = `
You are a professional cartographer providing specific advice on implementing the "${element.name}" element in a map.

Map element details:
- Name: ${element.name}
- Description: ${element.description}
- Category: ${element.category}
- Importance: ${element.importance}
- Best practices: ${element.bestPractices.join(', ')}

Current map description: ${mapDescription}

Please provide detailed, practical advice for implementing or improving this map element in the described map.
Focus on how to apply cartographic best practices for this specific element.
Your response should be helpful, educational, and actionable.
      `;
      
      return await openAIService.generateText(prompt);
    } catch (error) {
      logger.error(`Error getting element suggestions: ${error.message}`);
      throw new Error(`Failed to get element suggestions: ${error.message}`);
    }
  }

  /**
   * Get the list of all standard map elements
   * 
   * @returns Array of standard map elements
   */
  getStandardElements(): MapElementSuggestion[] {
    return this.standardMapElements;
  }
}

// Export singleton instance
export const mapElementsAdvisor = new MapElementsAdvisorService();