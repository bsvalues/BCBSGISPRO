import OpenAI from "openai";

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OpenAI service for handling AI-powered features
 */
export class OpenAIService {
  /**
   * Generate AI-powered response using OpenAI's chat completions API
   * 
   * @param prompt The prompt to send to OpenAI
   * @param systemPrompt Optional system prompt to guide the AI's behavior
   * @param options Additional options for the OpenAI API
   * @returns The generated text response
   */
  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      formatAsJson?: boolean;
    }
  ): Promise<string> {
    try {
      const messages = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ];

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: options?.model || "gpt-4o",
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        ...(options?.formatAsJson ? { response_format: { type: "json_object" } } : {}),
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw new Error(`Failed to generate AI response: ${(error as Error).message}`);
    }
  }

  /**
   * Generate JSON response using OpenAI's chat completions API
   * 
   * @param prompt The prompt to send to OpenAI
   * @param systemPrompt Optional system prompt to guide the AI's behavior
   * @param options Additional options for the OpenAI API
   * @returns The generated JSON response
   */
  async generateJsonResponse<T>(
    prompt: string,
    systemPrompt?: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<T> {
    try {
      const jsonResponse = await this.generateResponse(prompt, systemPrompt, {
        ...options,
        formatAsJson: true,
      });

      return JSON.parse(jsonResponse) as T;
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      throw new Error(`Failed to parse JSON response: ${(error as Error).message}`);
    }
  }
}

// Create a singleton instance for use throughout the application
export const openAIService = new OpenAIService();