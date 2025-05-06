import OpenAI from "openai";

// Initialize OpenAI client with the API key from environment
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Service for OpenAI API operations
 */
export class OpenAIService {
  /**
   * Generate map element suggestions using OpenAI
   * 
   * @param mapDescription Description of the map
   * @param mapPurpose Purpose of the map
   * @param mapContext Additional context about the map
   * @returns Generated evaluation and suggestions
   */
  async generateMapElementsSuggestions(
    mapDescription: string,
    mapPurpose: string,
    mapContext?: string
  ) {
    try {
      // Create a comprehensive prompt for map element evaluation
      const prompt = `
You are an expert cartographer with deep knowledge of the 33 essential elements that should be included in professional maps.

CONTEXT:
A map designer has provided the following details about their map:
- Description: ${mapDescription}
- Purpose: ${mapPurpose}
${mapContext ? `- Additional Context: ${mapContext}` : ''}

TASK:
Analyze the map description and provide a comprehensive evaluation using the 33 essential map elements as a framework.
Follow these steps:

1. Based on the description, determine which elements appear to be implemented, partially implemented, or missing.
2. Assign an implementation status to each element: "implemented", "partial", or "missing".
3. For each element, provide brief AI tips on how to implement or improve it.
4. Calculate an overall map quality score (0-100%).
5. Identify key areas for improvement.

RESPONSE FORMAT:
Provide your analysis in JSON format with the following structure:
{
  "overallScore": number, // 0-100
  "suggestions": [
    {
      "id": "string", // Unique ID for the element
      "name": "string", // Name of the map element
      "description": "string", // Brief description of what this element is
      "category": "string", // One of: layout, navigation, identification, data, visual, technical
      "importance": "string", // One of: high, medium, low
      "implementationStatus": "string", // One of: implemented, partial, missing
      "aiTips": "string" // Brief tips on how to implement or improve this element
    },
    // ... repeat for all applicable elements
  ],
  "improvementAreas": ["string"] // 3-5 key areas where the map could be improved
}

Only return the JSON object, no additional text.
`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      // Parse and return the generated JSON
      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Make sure to process the result to match our expected format
      return {
        overallScore: result.overallScore || 0,
        suggestions: result.suggestions || [],
        implementedElements: result.suggestions?.filter((s: any) => s.implementationStatus === "implemented") || [],
        partialElements: result.suggestions?.filter((s: any) => s.implementationStatus === "partial") || [],
        missingElements: result.suggestions?.filter((s: any) => s.implementationStatus === "missing") || [],
        improvementAreas: result.improvementAreas || [],
      };
    } catch (error) {
      console.error('Error generating map element suggestions:', error);
      throw new Error('Failed to generate map element suggestions');
    }
  }

  /**
   * Generate detailed suggestions for a specific map element
   * 
   * @param elementId ID of the element to generate suggestions for
   * @param elementName Name of the element
   * @param mapDescription Description of the map for context
   * @returns Detailed suggestions for the element
   */
  async generateElementSuggestions(
    elementId: string,
    elementName: string,
    mapDescription: string
  ) {
    try {
      const prompt = `
You are an expert cartographer with deep knowledge of the 33 essential elements that should be included in professional maps.

CONTEXT:
- Map Element: ${elementName}
- Map Description: ${mapDescription}

TASK:
Provide detailed, step-by-step suggestions for implementing the "${elementName}" element in this map.
Your suggestions should be practical, specific, and tailored to the context of the map description.
Include best practices, common pitfalls to avoid, and innovative approaches.

RESPONSE FORMAT:
Provide your suggestions as a detailed text with 3-5 actionable recommendations.
`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      return {
        elementId,
        suggestions: response.choices[0].message.content || "",
      };
    } catch (error) {
      console.error('Error generating element suggestions:', error);
      throw new Error('Failed to generate element suggestions');
    }
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();