import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * OpenAI service for generating AI-powered map elements suggestions
 */
export class OpenAIService {
  /**
   * Analyze a map description to identify missing or improperly implemented elements
   * 
   * @param mapDescription Description of the map
   * @param mapPurpose Purpose of the map
   * @param mapContext Additional context about the map
   * @returns Analysis results with element recommendations
   */
  async analyzeMapElements(
    mapDescription: string,
    mapPurpose: string,
    mapContext?: string
  ): Promise<any> {
    const prompt = `
    As a GIS and cartography expert, analyze this map description and provide recommendations
    based on best practices for effective map design.
    
    MAP DESCRIPTION:
    ${mapDescription}
    
    MAP PURPOSE:
    ${mapPurpose}
    
    ${mapContext ? `ADDITIONAL CONTEXT:\n${mapContext}\n` : ''}
    
    Analyze this map against the standard 33 essential map elements. Classify each element as:
    - implemented (clearly present in the description)
    - missing (not mentioned at all)
    - partial (mentioned but incomplete or needs improvement)
    
    Return a JSON object with the following structure:
    {
      "overallScore": number (0-100 indicating overall map quality),
      "implementedElements": string[] (list of element IDs that are implemented),
      "missingElements": string[] (list of element IDs that are missing),
      "partialElements": string[] (list of element IDs that are partially implemented),
      "suggestions": [
        {
          "id": string (unique identifier for this element),
          "name": string (name of the map element),
          "description": string (description of what this element is),
          "importance": "critical" | "recommended" | "optional",
          "category": "information" | "technical" | "legal" | "design" | "structure",
          "bestPractices": string[] (list of best practices for this element),
          "implementationStatus": "implemented" | "missing" | "partial",
          "aiTips": string (specific suggestions for this map)
        }
      ],
      "improvementAreas": string[] (key areas that would most improve the map)
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.5, // Balancing creativity with consistency
      });

      // Parse the response content as JSON
      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content || "{}");
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing map elements:', error);
      throw new Error('Failed to analyze map elements with AI');
    }
  }

  /**
   * Get detailed suggestions for implementing a specific map element
   * 
   * @param elementId ID of the element
   * @param elementName Name of the element
   * @param mapDescription Context about the map
   * @returns Detailed suggestions
   */
  async getElementSuggestions(
    elementId: string,
    elementName: string,
    mapDescription: string
  ): Promise<string> {
    const prompt = `
    As a GIS and cartography expert, provide detailed implementation guidance for the following map element:
    
    ELEMENT ID: ${elementId}
    ELEMENT NAME: ${elementName}
    
    MAP CONTEXT:
    ${mapDescription}
    
    Provide specific, actionable recommendations for implementing this element effectively in the map.
    Include:
    1. Best practices for this specific element
    2. Common pitfalls to avoid
    3. Visual design considerations
    4. Technical implementation tips
    5. Examples of excellent implementations
    
    Format your response as a detailed guide with clear sections and bullet points when appropriate.
    Keep your response concise but comprehensive.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7, // Slightly more creative for suggestions
      });

      return response.choices[0].message.content || 
        "Unable to generate suggestions for this element.";
    } catch (error) {
      console.error('Error getting element suggestions:', error);
      throw new Error('Failed to generate element suggestions with AI');
    }
  }

  /**
   * Get standard map elements with descriptions and best practices
   * 
   * @returns Array of standard map elements
   */
  async getStandardMapElements(): Promise<any[]> {
    const prompt = `
    As a GIS and cartography expert, provide a comprehensive list of the 33 essential map elements
    that should be considered for any professional map.
    
    Return a JSON array with objects having this structure:
    {
      "id": string (unique identifier for this element, e.g., "title", "legend", "scale"),
      "name": string (name of the map element),
      "description": string (description of what this element is),
      "importance": "critical" | "recommended" | "optional",
      "category": "information" | "technical" | "legal" | "design" | "structure",
      "bestPractices": string[] (list of best practices for this element)
    }
    
    Ensure you include elements from all categories:
    - Information elements (title, legend, etc.)
    - Technical elements (scale, coordinates, etc.)
    - Legal elements (copyright, disclaimers, etc.)
    - Design elements (color scheme, typography, etc.)
    - Structure elements (layout, margins, etc.)
    `;

    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3, // More deterministic for standard elements
      });

      // Parse the response content as JSON
      const content = response.choices[0].message.content;
      let elementsData;
      
      try {
        elementsData = JSON.parse(content || "{}");
        // Handle both array and {elements: array} formats
        const elements = Array.isArray(elementsData) ? 
          elementsData : (elementsData.elements || []);
        
        return elements;
      } catch (e) {
        console.error('Error parsing standard map elements:', e);
        return [];
      }
    } catch (error) {
      console.error('Error getting standard map elements:', error);
      throw new Error('Failed to get standard map elements with AI');
    }
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();