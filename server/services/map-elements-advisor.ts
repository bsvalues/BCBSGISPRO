import { openAIService } from './openai-service';
import { MapElementSuggestion, MapEvaluationResult } from '../../client/src/lib/map-elements-api';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for providing AI-powered map element suggestions and evaluations
 */
export class MapElementsAdvisorService {
  // Standard map elements based on cartographic best practices
  private standardElements: MapElementSuggestion[] = [
    {
      id: "title",
      name: "Title",
      description: "Clear, concise title describing the map's content",
      importance: "critical",
      category: "information",
      bestPractices: [
        "Place at the top of the map in a prominent position",
        "Use a font size larger than other text elements",
        "Keep it concise but descriptive"
      ]
    },
    {
      id: "legend",
      name: "Legend",
      description: "Guide explaining all symbols, colors, and patterns used on the map",
      importance: "critical",
      category: "information",
      bestPractices: [
        "Include all map symbols with clear labels",
        "Use a logical organization (grouping similar elements)",
        "Position in a non-intrusive location, typically bottom-right"
      ]
    },
    {
      id: "scale",
      name: "Scale Bar",
      description: "Visual or numeric indication of the map's scale",
      importance: "critical",
      category: "technical",
      bestPractices: [
        "Use round numbers that are easy to interpret",
        "Include both metric and imperial units when appropriate",
        "Place in a consistent location, typically bottom-left"
      ]
    },
    {
      id: "north-arrow",
      name: "North Arrow",
      description: "Indicator showing the map's orientation to North",
      importance: "recommended",
      category: "technical",
      bestPractices: [
        "Use a simple, clear design",
        "Only necessary when north is not at the top of the map",
        "Place in a non-intrusive corner location"
      ]
    },
    {
      id: "source",
      name: "Data Source",
      description: "Attribution of data sources and creation information",
      importance: "critical",
      category: "legal",
      bestPractices: [
        "Include organization names and dates of data collection",
        "Add creation date and map author when appropriate",
        "Use small text that doesn't distract from the main content"
      ]
    },
    {
      id: "inset-map",
      name: "Inset Map",
      description: "Smaller secondary map showing context or detail",
      importance: "recommended",
      category: "structure",
      bestPractices: [
        "Use for location context or to show detail that doesn't fit in the main map",
        "Clearly indicate the relationship between inset and main map",
        "Keep styling consistent with the main map"
      ]
    },
    {
      id: "grid",
      name: "Coordinate Grid",
      description: "Reference system of lines showing coordinates",
      importance: "optional",
      category: "technical",
      bestPractices: [
        "Include when precise location reference is needed",
        "Label grid lines clearly but unobtrusively",
        "Use appropriate coordinate system for the map's purpose"
      ]
    },
    {
      id: "labels",
      name: "Feature Labels",
      description: "Text identifying key features on the map",
      importance: "critical",
      category: "information",
      bestPractices: [
        "Use consistent font styling for similar features",
        "Place text to avoid crossing lines or obscuring features",
        "Consider text halos or masks to improve readability over complex backgrounds"
      ]
    },
    {
      id: "projection",
      name: "Projection Information",
      description: "Details about the map's spatial reference system",
      importance: "optional",
      category: "technical",
      bestPractices: [
        "Include for scientific or technical maps",
        "State projection name and parameters",
        "Place in an unobtrusive location with other technical details"
      ]
    },
    {
      id: "base-map",
      name: "Base Map",
      description: "Background reference layer providing context",
      importance: "recommended",
      category: "structure",
      bestPractices: [
        "Use a subtle design that doesn't compete with thematic data",
        "Include only features relevant to the map's purpose",
        "Ensure adequate contrast with foreground data"
      ]
    },
    {
      id: "color-scheme",
      name: "Color Scheme",
      description: "Consistent and appropriate use of colors",
      importance: "critical",
      category: "design",
      bestPractices: [
        "Use color schemes appropriate for the data type (sequential, diverging, qualitative)",
        "Consider color-blind friendly palettes",
        "Ensure sufficient contrast between colors"
      ]
    },
    {
      id: "typography",
      name: "Typography",
      description: "Consistent and legible fonts throughout the map",
      importance: "recommended",
      category: "design",
      bestPractices: [
        "Limit to 2-3 font families",
        "Use serif fonts for titles and sans-serif for detail",
        "Ensure text size is appropriate for both digital and print use"
      ]
    },
    {
      id: "hierarchy",
      name: "Visual Hierarchy",
      description: "Organization of elements by importance using size, color, etc.",
      importance: "recommended",
      category: "design",
      bestPractices: [
        "Make important information visually prominent",
        "Use consistent visual cues for similar importance levels",
        "Guide the viewer's eye through the map logically"
      ]
    },
    {
      id: "margin",
      name: "Margins",
      description: "Adequate space around the edge of the map",
      importance: "recommended",
      category: "design",
      bestPractices: [
        "Ensure consistent margin width",
        "Allow enough space for all elements without crowding",
        "Consider intended output medium (print requires larger margins)"
      ]
    },
    {
      id: "date",
      name: "Date",
      description: "When the map was created or data was collected",
      importance: "recommended",
      category: "information",
      bestPractices: [
        "Include creation date for all maps",
        "Add data collection dates when relevant",
        "Place with other metadata in an unobtrusive location"
      ]
    },
    {
      id: "author",
      name: "Author/Organization",
      description: "Who created the map",
      importance: "recommended",
      category: "information",
      bestPractices: [
        "Include creator name or organization",
        "Add logo when appropriate",
        "Place with other metadata in an unobtrusive location"
      ]
    },
    {
      id: "borders",
      name: "Borders and Neatlines",
      description: "Frame around the map and its elements",
      importance: "optional",
      category: "design",
      bestPractices: [
        "Use subtle borders that don't distract from map content",
        "Consider different border styles for the map vs. legend/other elements",
        "Ensure consistent styling throughout"
      ]
    },
    {
      id: "graticules",
      name: "Graticules",
      description: "Network of longitude and latitude lines",
      importance: "optional",
      category: "technical",
      bestPractices: [
        "Use when geographic coordinates are important to the map purpose",
        "Style subtly to avoid visual distraction",
        "Label clearly at margins"
      ]
    },
    {
      id: "layout",
      name: "Balanced Layout",
      description: "Thoughtful arrangement of all map elements",
      importance: "critical",
      category: "design",
      bestPractices: [
        "Balance visual weight across the composition",
        "Group related elements together",
        "Use white space effectively to create visual separation"
      ]
    },
    {
      id: "extent",
      name: "Appropriate Extent",
      description: "Map area covers all relevant features with minimal empty space",
      importance: "critical",
      category: "structure",
      bestPractices: [
        "Include all relevant features plus context area",
        "Minimize empty or irrelevant space",
        "Consider using inset maps for disconnected areas"
      ]
    },
    {
      id: "symbols",
      name: "Intuitive Symbols",
      description: "Easy-to-understand symbols that follow conventions",
      importance: "critical",
      category: "design",
      bestPractices: [
        "Use conventional symbols when possible (e.g., blue for water)",
        "Create visually distinct symbols for different feature types",
        "Consider symbol size appropriate for the map scale"
      ]
    },
    {
      id: "thematic-layer",
      name: "Thematic Layers",
      description: "Clear presentation of the main map theme or data",
      importance: "critical",
      category: "structure",
      bestPractices: [
        "Make the primary thematic information visually prominent",
        "Use appropriate visualization method for the data type",
        "Ensure clear visual separation from the base map"
      ]
    },
    {
      id: "context",
      name: "Context Features",
      description: "Reference information that helps orient the viewer",
      importance: "recommended",
      category: "information",
      bestPractices: [
        "Include recognizable features that help orient the viewer",
        "Style context features more subtly than primary features",
        "Only include context that's relevant to the map purpose"
      ]
    },
    {
      id: "labels-placement",
      name: "Label Placement",
      description: "Strategic positioning of text to maximize clarity",
      importance: "recommended",
      category: "design",
      bestPractices: [
        "Follow cartographic conventions (e.g., place city names to the right)",
        "Avoid overlapping or crossing lines",
        "Use curved text for linear features when appropriate"
      ]
    },
    {
      id: "classification",
      name: "Data Classification",
      description: "Appropriate grouping of numeric data into categories",
      importance: "recommended",
      category: "technical",
      bestPractices: [
        "Choose classification method appropriate for the data distribution",
        "Use a reasonable number of classes (typically 4-7)",
        "Consider using round numbers for class breaks"
      ]
    },
    {
      id: "resolution",
      name: "Appropriate Resolution",
      description: "Suitable level of detail for the map's purpose and scale",
      importance: "recommended",
      category: "technical",
      bestPractices: [
        "Match data resolution to map scale",
        "Generalize features appropriately for the scale",
        "Consider final output medium when determining resolution"
      ]
    },
    {
      id: "consistency",
      name: "Visual Consistency",
      description: "Uniform styling throughout the map",
      importance: "recommended",
      category: "design",
      bestPractices: [
        "Maintain consistent styling for similar elements",
        "Use a limited palette of colors, symbols, and fonts",
        "Ensure consistent scale and level of detail throughout"
      ]
    },
    {
      id: "copyright",
      name: "Copyright Information",
      description: "Legal protection notices for proprietary data",
      importance: "optional",
      category: "legal",
      bestPractices: [
        "Include when using licensed or proprietary data",
        "Follow data provider requirements for attribution",
        "Place in an unobtrusive location with other metadata"
      ]
    },
    {
      id: "metadata",
      name: "Additional Metadata",
      description: "Technical details about the map's data and creation",
      importance: "optional",
      category: "technical",
      bestPractices: [
        "Include for technical or scientific maps",
        "Consider using QR codes or links for detailed metadata",
        "Keep unobtrusive but accessible"
      ]
    },
    {
      id: "explanatory-text",
      name: "Explanatory Text",
      description: "Brief text explaining complex aspects of the map",
      importance: "optional",
      category: "information",
      bestPractices: [
        "Use for complex maps that need additional explanation",
        "Keep concise and focused on key information",
        "Position near related map features"
      ]
    },
    {
      id: "contact",
      name: "Contact Information",
      description: "How to reach the map author or organization",
      importance: "optional",
      category: "information",
      bestPractices: [
        "Include for maps intended for public distribution",
        "Provide email, website, or other relevant contact method",
        "Place with other metadata in an unobtrusive location"
      ]
    },
    {
      id: "revision",
      name: "Revision Information",
      description: "Details about map updates or versions",
      importance: "optional",
      category: "information",
      bestPractices: [
        "Include for maps that are regularly updated",
        "Indicate version number or last update date",
        "Place with other metadata in an unobtrusive location"
      ]
    },
    {
      id: "accessibility",
      name: "Accessibility Features",
      description: "Design elements that make the map usable for all people",
      importance: "recommended",
      category: "design",
      bestPractices: [
        "Use colorblind-friendly palettes",
        "Ensure sufficient text size and contrast",
        "Provide text alternatives for complex visual information"
      ]
    }
  ];

  /**
   * Get the standard map elements
   * 
   * @returns Array of standard map elements
   */
  getStandardElements(): MapElementSuggestion[] {
    return this.standardElements;
  }

  /**
   * Evaluate a map description against the 33 standard map elements
   * 
   * @param mapDescription Description of the map
   * @param mapPurpose Purpose of the map
   * @param mapContext Additional context about the map
   * @returns Evaluation results with suggestions
   */
  async evaluateMap(
    mapDescription: string,
    mapPurpose: string,
    mapContext?: string
  ): Promise<MapEvaluationResult> {
    const systemPrompt = `
      You are a cartography expert evaluating maps against best practices.
      Analyze the provided map description and determine which of the 33 essential map elements are present, missing, or partially implemented.
      Be objective and precise in your assessment.
    `;

    const prompt = `
      I need you to evaluate a map description against the 33 standard map elements in cartography.
      
      Map Description: ${mapDescription}
      Map Purpose: ${mapPurpose}
      ${mapContext ? `Additional Context: ${mapContext}` : ''}

      For each element, determine if it is:
      - "implemented" (clearly present and well-executed)
      - "partial" (present but needs improvement)
      - "missing" (not present or inadequately implemented)

      Please respond with a JSON object that contains:
      1. "overallScore": A number from 0-100 representing the overall quality
      2. "implementedElements": Array of element IDs that are implemented
      3. "missingElements": Array of element IDs that are missing
      4. "partialElements": Array of element IDs that are partially implemented
      5. "suggestions": Array of map element objects, including each element's status and custom suggestions
      6. "improvementAreas": Array of strings describing key areas for improvement

      For context, here are the IDs of the 33 standard map elements:
      ${this.standardElements.map(el => `"${el.id}"`).join(', ')}
    `;

    try {
      const result = await openAIService.generateJsonResponse<{
        overallScore: number;
        implementedElements: string[];
        missingElements: string[];
        partialElements: string[];
        suggestions: Array<{
          id: string;
          implementationStatus: 'implemented' | 'missing' | 'partial';
          aiTips?: string;
        }>;
        improvementAreas: string[];
      }>(prompt, systemPrompt, { temperature: 0.2 });

      // Enhance the response with complete element details
      const suggestions = result.suggestions.map(suggestion => {
        const standardElement = this.standardElements.find(std => std.id === suggestion.id);
        if (!standardElement) {
          throw new Error(`Unknown element ID: ${suggestion.id}`);
        }

        return {
          ...standardElement,
          implementationStatus: suggestion.implementationStatus,
          aiTips: suggestion.aiTips
        };
      });

      return {
        overallScore: result.overallScore,
        implementedElements: result.implementedElements,
        missingElements: result.missingElements,
        partialElements: result.partialElements,
        suggestions,
        improvementAreas: result.improvementAreas
      };
    } catch (error) {
      console.error('Error evaluating map:', error);
      throw new Error(`Failed to evaluate map: ${(error as Error).message}`);
    }
  }

  /**
   * Get detailed suggestions for implementing a specific map element
   * 
   * @param elementId ID of the element to get suggestions for
   * @param mapDescription Description of the map for context
   * @returns Detailed suggestions for implementation
   */
  async getElementSuggestions(
    elementId: string,
    mapDescription: string
  ): Promise<string> {
    const element = this.standardElements.find(el => el.id === elementId);
    if (!element) {
      throw new Error(`Unknown element ID: ${elementId}`);
    }

    const systemPrompt = `
      You are a cartography expert providing specific, actionable advice on how to implement map elements.
      Your suggestions should be tailored to the specific map being described and the element requested.
      Be concise but thorough, focusing on practical implementation techniques.
    `;

    const prompt = `
      I need detailed suggestions for implementing the "${element.name}" element on a map.
      
      Map Description: ${mapDescription}
      
      Element Details:
      - Name: ${element.name}
      - Description: ${element.description}
      - Importance: ${element.importance}
      - Category: ${element.category}
      - Best Practices: ${element.bestPractices.join(', ')}
      
      Please provide specific, actionable advice for implementing this element on the described map.
      Include:
      1. Placement recommendations
      2. Design suggestions
      3. Common pitfalls to avoid
      4. Tools or techniques that might help
      
      Keep your response under 350 words and focus on practical implementation.
    `;

    try {
      return await openAIService.generateResponse(prompt, systemPrompt, { temperature: 0.3 });
    } catch (error) {
      console.error('Error getting element suggestions:', error);
      throw new Error(`Failed to get suggestions: ${(error as Error).message}`);
    }
  }
}

// Create a singleton instance for use throughout the application
export const mapElementsAdvisorService = new MapElementsAdvisorService();