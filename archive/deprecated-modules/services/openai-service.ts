import OpenAI from "openai";
import { config } from "dotenv";

// Load environment variables
config();

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

/**
 * Analyze map description and provide recommendations based on Benton County's 33 map elements
 * @param mapDescription Description of the map being created
 * @param mapPurpose Purpose of the map (what it will be used for)
 * @param mapContext Optional context for the map
 * @param existingElements Array of element IDs that are already implemented in the map
 * @returns Object with AI recommendations and element-specific evaluations
 */
export async function analyzeMapElements(
  mapDescription: string, 
  mapPurpose: string, 
  mapContext: string | undefined = undefined,
  existingElements: string[] = []
) {
  try {
    // Build the prompt with Benton County specific context
    const contextLine = mapContext ? `Additional Context: ${mapContext}` : '';
    
    const prompt = `
    As a GIS expert for Benton County, Washington, analyze this map project and provide recommendations based on the 33 essential map elements.

    Map Description: ${mapDescription}
    Map Purpose: ${mapPurpose}
    ${contextLine}
    
    Elements already implemented: ${existingElements.join(', ')}

    Evaluate which of the 33 map elements would be most important for this specific Benton County map project. 
    For each recommended element, provide:
    1. Why it's important specifically for this Benton County map
    2. How it should be implemented (with specific Benton County considerations)
    3. Best practices for this element in Benton County's context
    
    Return the response as a JSON object with the following structure:
    {
      "overallScore": number (1-100 indicating how well the map follows best practices),
      "recommendations": "General advice about improving the map for Benton County users",
      "elementRecommendations": [
        {
          "elementId": "element_id",
          "name": "Element Name",
          "importance": "high/medium/low",
          "implemented": boolean,
          "implementationTips": "Specific advice for this map",
          "bentonCountyConsiderations": "Special considerations for Benton County"
        }
      ]
    }
    
    Focus on providing practical, specific advice tailored to Benton County's geography, demographics, and needs.
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert GIS consultant specializing in creating maps for Benton County, Washington. You have extensive knowledge of cartographic best practices and local Benton County geography, landmarks, and data sources."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse and return the JSON response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    const aiResponse = JSON.parse(content);
    return aiResponse;
  } catch (error) {
    console.error("Error analyzing map elements:", error);
    throw new Error(`Failed to analyze map elements: ${error.message}`);
  }
}

/**
 * Generate an improvement plan for a specific map element in Benton County context
 * @param elementId ID of the map element to focus on
 * @param elementName Name of the map element
 * @param elementDescription Description of the element
 * @param mapDescription Description of the map being created
 * @param mapPurpose Purpose of the map
 * @returns Detailed improvement plan for the specific element
 */
export async function generateElementImprovement(
  elementId: string,
  elementName: string,
  elementDescription: string,
  mapDescription: string,
  mapPurpose: string
) {
  try {
    const prompt = `
    As a GIS expert for Benton County, Washington, provide detailed guidance on implementing the "${elementName}" map element (${elementId}) for this specific map project.

    Element Description: ${elementDescription}
    Map Description: ${mapDescription}
    Map Purpose: ${mapPurpose}

    Provide a comprehensive improvement plan including:
    1. Specific implementation steps for Benton County
    2. Local examples from Benton County
    3. Common mistakes to avoid
    4. Tools or techniques specific to this element
    5. How this element enhances maps in Benton County's context

    Return your response as a JSON object with the following structure:
    {
      "elementId": "${elementId}",
      "name": "${elementName}",
      "implementationSteps": ["Step 1...", "Step 2..."],
      "bentonCountyExamples": ["Example 1...", "Example 2..."],
      "commonMistakes": ["Mistake 1...", "Mistake 2..."],
      "toolsAndTechniques": ["Tool 1...", "Technique 2..."],
      "enhancementValue": "Description of how this improves maps for Benton County"
    }
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert GIS consultant specializing in creating maps for Benton County, Washington. You have extensive knowledge of cartographic best practices and local Benton County geography, landmarks, and data sources."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse and return the JSON response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    const aiResponse = JSON.parse(content);
    return aiResponse;
  } catch (error) {
    console.error(`Error generating improvement plan for ${elementId}:`, error);
    throw new Error(`Failed to generate improvement plan: ${error.message}`);
  }
}

export default {
  analyzeMapElements,
  generateElementImprovement
};