import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * OpenAI service for generating intelligent responses
 */
export class OpenAIService {
  /**
   * Generate a response from OpenAI
   * @param prompt The prompt to send to OpenAI
   * @returns The generated text
   */
  async generateText(prompt: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Error generating text from OpenAI:", error);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  /**
   * Generate structured JSON response from OpenAI
   * @param prompt The system prompt to send
   * @param userQuery The user query or context 
   * @returns Parsed JSON response
   */
  async generateJSON<T>(systemPrompt: string, userQuery: string): Promise<T> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}") as T;
    } catch (error) {
      console.error("Error generating JSON from OpenAI:", error);
      throw new Error(`Failed to generate JSON: ${error.message}`);
    }
  }

  /**
   * Analyze an image with GPT-4o Vision
   * @param base64Image Base64 encoded image
   * @param prompt Text prompt describing what to analyze
   * @returns Analysis text
   */
  async analyzeImage(base64Image: string, prompt: string = "Analyze this map image in detail"): Promise<string> {
    try {
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        max_tokens: 500,
      });

      return visionResponse.choices[0].message.content || "";
    } catch (error) {
      console.error("Error analyzing image with OpenAI:", error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();