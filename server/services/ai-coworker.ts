/**
 * AI Co-worker Service
 * 
 * This module provides AI co-worker capabilities using Anthropic Claude
 * to create a fluid, collaborative experience between AI and human users.
 */

import Anthropic from '@anthropic-ai/sdk';
import { 
  coworkerProfiles,
  CoworkerProfile, 
  coworkerSessions, 
  CoworkerSession,
  coworkerMessages,
  UserCoworkerPreference,
  coworkerInteractionTypeEnum,
  coworkerModeEnum
} from '../../shared/schema';
import { db } from '../db';
import { eq, desc, and } from 'drizzle-orm';
import { logger } from '../logger';

// Initialize Anthropic client
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Default system prompts for different co-worker modes
const DEFAULT_SYSTEM_PROMPTS: Record<string, string> = {
  'ASSISTANT': 
    "You are a helpful Geographic Information System (GIS) assistant focused on property assessment and management. " +
    "Your goal is to help the user understand property data, legal descriptions, and assessment processes. " +
    "Be clear, factual, and focus on providing accurate information about parcels, documents, and GIS data. " +
    "If you don't know something, admit it rather than speculating.",
    
  'COLLABORATOR':
    "You are a collaborative Geographic Information System (GIS) specialist working alongside the user on property assessment tasks. " +
    "Your role is to actively contribute ideas, offer alternatives, and work jointly with the human user to solve problems. " +
    "Maintain a balanced relationship where you both contribute equally to solutions. " +
    "Ask clarifying questions when needed, and be transparent about your reasoning process.",
    
  'PARTNER':
    "You are a senior GIS and property assessment expert partnering with the user. " +
    "Your relationship is one of equals, with shared responsibility for outcomes. " +
    "Proactively identify issues, suggest improvements, and challenge assumptions when appropriate. " +
    "Use your expertise to guide the collaborative work while respecting the user's domain knowledge. " +
    "Focus on strategic thinking and optimization of workflows.",
    
  'SUPERVISOR':
    "You are a supervisory expert in GIS and property assessment overseeing the user's work. " +
    "Your role is to review their decisions, ensure compliance with regulations, and maintain quality standards. " +
    "Provide constructive feedback, identify potential issues before they become problems, " +
    "and ensure all work meets Benton County's requirements and professional standards. " +
    "Be firm but supportive, with a focus on education and improvement."
};

// Interface for context data
export interface CoworkerContextData {
  currentTask?: {
    id: string;
    type: string;
    description: string;
    status: string;
  };
  activeParcel?: {
    id: number;
    parcelNumber: string;
    owner?: string;
    address?: string;
  };
  activeDocuments?: {
    id: number;
    name: string;
    type: string;
  }[];
  mapContext?: {
    center: [number, number];
    zoom: number;
    visibleLayers: string[];
  };
  userRole?: string;
  workflowStage?: string;
  recentActivities?: {
    type: string;
    description: string;
    timestamp: string;
  }[];
  systemFlags?: {
    [key: string]: boolean;
  };
}

// Interface for co-worker message
export interface CoworkerMessageInput {
  content: string;
  type?: string;
  metadata?: any;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

/**
 * AI Co-worker Service
 */
export class AICoworkerService {
  /**
   * Initialize a new co-worker profile
   * @param profile Co-worker profile data
   * @returns Created co-worker profile
   */
  async createCoworkerProfile(profile: Omit<CoworkerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<CoworkerProfile> {
    const [newProfile] = await db.insert(coworkerProfiles)
      .values(profile)
      .returning();
      
    logger.info(`Created new co-worker profile: ${newProfile.name}`);
    return newProfile;
  }
  
  /**
   * Get a co-worker profile by ID
   * @param id Co-worker profile ID
   * @returns Co-worker profile
   */
  async getCoworkerProfile(id: number): Promise<CoworkerProfile | undefined> {
    const [profile] = await db.select()
      .from(coworkerProfiles)
      .where(eq(coworkerProfiles.id, id));
      
    return profile;
  }
  
  /**
   * Get all active co-worker profiles
   * @returns List of active co-worker profiles
   */
  async getAllCoworkerProfiles(includeInactive = false): Promise<CoworkerProfile[]> {
    let query = db.select().from(coworkerProfiles);
    
    if (!includeInactive) {
      query = query.where(eq(coworkerProfiles.isActive, true));
    }
    
    return await query;
  }
  
  /**
   * Start a new conversation session with a co-worker
   * @param userId User ID
   * @param coworkerId Co-worker ID
   * @param initialContext Initial context data
   * @param mode Interaction mode
   * @returns Created session
   */
  async startSession(
    userId: number, 
    coworkerId: number, 
    initialContext?: CoworkerContextData,
    mode: string = 'ASSISTANT'
  ): Promise<CoworkerSession> {
    // Get the co-worker profile
    const profile = await this.getCoworkerProfile(coworkerId);
    if (!profile) {
      throw new Error(`Co-worker profile not found: ${coworkerId}`);
    }
    
    // Create a new session
    const [session] = await db.insert(coworkerSessions)
      .values({
        userId,
        coworkerId,
        title: `Session with ${profile.name}`,
        contextData: initialContext || {},
        mode: mode as any,
        status: 'ACTIVE'
      })
      .returning();
      
    logger.info(`Started new co-worker session: ${session.id}`);
    return session;
  }
  
  /**
   * Get a specific session by ID
   * @param sessionId Session ID
   * @returns Session data
   */
  async getSession(sessionId: number): Promise<CoworkerSession | undefined> {
    const [session] = await db.select()
      .from(coworkerSessions)
      .where(eq(coworkerSessions.id, sessionId));
      
    return session;
  }
  
  /**
   * Get all sessions for a user
   * @param userId User ID
   * @param limit Maximum number of sessions to return
   * @returns List of sessions
   */
  async getUserSessions(userId: number, limit: number = 10): Promise<CoworkerSession[]> {
    return await db.select()
      .from(coworkerSessions)
      .where(eq(coworkerSessions.userId, userId))
      .orderBy(desc(coworkerSessions.updatedAt))
      .limit(limit);
  }
  
  /**
   * Update session context data
   * @param sessionId Session ID
   * @param contextData New context data
   * @returns Updated session
   */
  async updateSessionContext(
    sessionId: number, 
    contextData: CoworkerContextData
  ): Promise<CoworkerSession | undefined> {
    const [session] = await db.update(coworkerSessions)
      .set({ 
        contextData,
        updatedAt: new Date()
      })
      .where(eq(coworkerSessions.id, sessionId))
      .returning();
      
    return session;
  }
  
  /**
   * End a session
   * @param sessionId Session ID
   * @returns Updated session
   */
  async endSession(sessionId: number): Promise<CoworkerSession | undefined> {
    const [session] = await db.update(coworkerSessions)
      .set({ 
        status: 'ENDED',
        endedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(coworkerSessions.id, sessionId))
      .returning();
      
    logger.info(`Ended co-worker session: ${sessionId}`);
    return session;
  }
  
  /**
   * Send a message in a session
   * @param sessionId Session ID
   * @param senderId User ID (null for AI messages)
   * @param message Message data
   * @returns Saved message
   */
  async sendMessage(
    sessionId: number, 
    senderId: number | null, 
    message: CoworkerMessageInput
  ) {
    // Get the session to access co-worker ID and context
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Save the message
    const [savedMessage] = await db.insert(coworkerMessages)
      .values({
        sessionId,
        senderId,
        coworkerId: senderId ? null : session.coworkerId,
        content: message.content,
        type: (message.type || 'CHAT') as any,
        contextSnapshot: session.contextData,
        metadata: message.metadata || {},
        relatedEntityType: message.relatedEntityType,
        relatedEntityId: message.relatedEntityId
      })
      .returning();
      
    // Update session's updatedAt timestamp
    await db.update(coworkerSessions)
      .set({ updatedAt: new Date() })
      .where(eq(coworkerSessions.id, sessionId));
      
    return savedMessage;
  }
  
  /**
   * Get messages for a session
   * @param sessionId Session ID
   * @param limit Maximum number of messages to return
   * @returns List of messages
   */
  async getSessionMessages(sessionId: number, limit: number = 50) {
    return await db.select()
      .from(coworkerMessages)
      .where(eq(coworkerMessages.sessionId, sessionId))
      .orderBy(desc(coworkerMessages.sentAt))
      .limit(limit);
  }
  
  /**
   * Process a user message and generate an AI response
   * @param sessionId Session ID
   * @param userId User ID
   * @param userMessage User's message
   * @returns AI's response message
   */
  async processUserMessage(
    sessionId: number,
    userId: number,
    userMessage: CoworkerMessageInput
  ) {
    // Get the session
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Get the co-worker profile
    const coworker = await this.getCoworkerProfile(session.coworkerId);
    if (!coworker) {
      throw new Error(`Co-worker profile not found: ${session.coworkerId}`);
    }
    
    // Save the user message
    const savedUserMessage = await this.sendMessage(sessionId, userId, userMessage);
    
    // Get previous messages to build conversation history
    const previousMessages = await this.getSessionMessages(sessionId, 20);
    
    // Build the conversation history in Anthropic's format
    const messages = previousMessages
      .reverse()  // Get messages in chronological order
      .map(msg => ({
        role: msg.senderId ? 'user' : 'assistant',
        content: msg.content
      }));
    
    // Determine the system prompt based on mode
    const systemPrompt = coworker.systemPrompt || DEFAULT_SYSTEM_PROMPTS[session.mode] || DEFAULT_SYSTEM_PROMPTS.ASSISTANT;
    
    try {
      // Generate a response from Claude
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages.slice(-10), // Use the last 10 messages
        temperature: 0.7,
      });
      
      // Save the AI response
      // Handle response content which might be text or other content types
      const aiContent = typeof response.content[0] === 'object' && 'type' in response.content[0] && 
        response.content[0].type === 'text' ? 
        response.content[0].text as string : 
        JSON.stringify(response.content);
        
      const aiResponse = await this.sendMessage(sessionId, null, {
        content: aiContent,
        type: 'ANSWER',
        metadata: {
          model: 'claude-3-7-sonnet-20250219',
          responseId: response.id,
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens
        }
      });
      
      return aiResponse;
    } catch (error) {
      logger.error(`Error generating AI response: ${error.message}`);
      
      // Save a fallback message if AI generation fails
      return await this.sendMessage(sessionId, null, {
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        type: 'ERROR',
        metadata: {
          error: error.message
        }
      });
    }
  }
  
  /**
   * Generate a proactive suggestion based on the user's context
   * @param sessionId Session ID
   * @param context Current context data
   * @returns AI suggestion message
   */
  async generateProactiveSuggestion(
    sessionId: number,
    context: CoworkerContextData
  ) {
    // Get the session
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Only generate proactive messages in PARTNER or SUPERVISOR modes
    if (!['PARTNER', 'SUPERVISOR'].includes(session.mode as string)) {
      return null;
    }
    
    // Get the co-worker profile
    const coworker = await this.getCoworkerProfile(session.coworkerId);
    if (!coworker) {
      throw new Error(`Co-worker profile not found: ${session.coworkerId}`);
    }
    
    // Update session with the latest context
    await this.updateSessionContext(sessionId, context);
    
    // Build prompt for generating a proactive suggestion
    const systemPrompt = 
      `${coworker.systemPrompt || DEFAULT_SYSTEM_PROMPTS[session.mode]}
      
      The user hasn't explicitly asked a question, but based on their current context, 
      you should proactively suggest helpful advice, identify potential issues, or
      offer guidance that would be valuable. Focus on being concise and actionable.
      
      Keep your response brief (2-3 sentences) and clearly focused on the most important
      observation or suggestion based on the user's current task and context.`;
      
    // Convert context to a descriptive prompt
    let contextDescription = "Based on your current activity:\n";
    
    if (context.currentTask) {
      contextDescription += `- You're working on: ${context.currentTask.description} (${context.currentTask.status})\n`;
    }
    
    if (context.activeParcel) {
      contextDescription += `- Current parcel: ${context.activeParcel.parcelNumber}`;
      if (context.activeParcel.address) contextDescription += ` at ${context.activeParcel.address}`;
      contextDescription += '\n';
    }
    
    if (context.activeDocuments?.length) {
      contextDescription += `- Working with documents: ${context.activeDocuments.map(d => d.name).join(', ')}\n`;
    }
    
    if (context.workflowStage) {
      contextDescription += `- Current workflow stage: ${context.workflowStage}\n`;
    }
    
    if (context.recentActivities?.length) {
      contextDescription += `- Recent activity: ${context.recentActivities[0].description}\n`;
    }
    
    try {
      // Generate a proactive suggestion from Claude
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: contextDescription
        }],
        temperature: 0.7,
      });
      
      // Save the AI suggestion
      // Handle response content which might be text or other content types
      const aiContent = typeof response.content[0] === 'object' && 'type' in response.content[0] && 
        response.content[0].type === 'text' ? 
        response.content[0].text as string : 
        JSON.stringify(response.content);
        
      const aiSuggestion = await this.sendMessage(sessionId, null, {
        content: aiContent,
        type: 'SUGGESTION',
        metadata: {
          model: 'claude-3-7-sonnet-20250219',
          responseId: response.id,
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          proactive: true
        }
      });
      
      return aiSuggestion;
    } catch (error) {
      logger.error(`Error generating proactive suggestion: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Review user's work and provide feedback
   * @param sessionId Session ID
   * @param workDescription Description of the work to review
   * @param workContent Content to review (JSON or string)
   * @returns Review feedback
   */
  async reviewWork(
    sessionId: number,
    workDescription: string,
    workContent: any
  ) {
    // Get the session
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Only available in SUPERVISOR mode
    if (session.mode !== 'SUPERVISOR') {
      throw new Error('Work review is only available in SUPERVISOR mode');
    }
    
    // Get the co-worker profile
    const coworker = await this.getCoworkerProfile(session.coworkerId);
    if (!coworker) {
      throw new Error(`Co-worker profile not found: ${session.coworkerId}`);
    }
    
    // Build the review prompt
    const systemPrompt = 
      `${coworker.systemPrompt || DEFAULT_SYSTEM_PROMPTS.SUPERVISOR}
      
      You are reviewing the user's work to provide constructive feedback.
      Your feedback should be structured as follows:
      
      1. Overall Assessment: A brief summary of the quality (1-2 sentences)
      2. Strengths: 2-3 specific things done well
      3. Areas for Improvement: 2-3 specific suggestions
      4. Compliance Check: Any regulatory or policy concerns
      5. Next Steps: Recommended actions
      
      Be specific, constructive, and actionable in your feedback.`;
      
    // Format the work content as string if it's an object
    const workContentStr = typeof workContent === 'object' 
      ? JSON.stringify(workContent, null, 2)
      : workContent;
      
    const prompt = 
      `Please review the following work: ${workDescription}
      
      Work content:
      ${workContentStr}
      
      Provide structured feedback on this work following the format in your instructions.`;
      
    try {
      // Generate review feedback from Claude
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3, // Lower temperature for more consistent reviews
      });
      
      // Save the review feedback
      // Handle response content which might be text or other content types
      const aiContent = typeof response.content[0] === 'object' && 'type' in response.content[0] && 
        response.content[0].type === 'text' ? 
        response.content[0].text as string : 
        JSON.stringify(response.content);
        
      const reviewMessage = await this.sendMessage(sessionId, null, {
        content: aiContent,
        type: 'REVIEW',
        metadata: {
          model: 'claude-3-7-sonnet-20250219',
          responseId: response.id,
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          workDescription
        }
      });
      
      return reviewMessage;
    } catch (error) {
      logger.error(`Error generating work review: ${error.message}`);
      
      // Save a fallback message if review generation fails
      return await this.sendMessage(sessionId, null, {
        content: "I'm unable to complete the review at this time. Please try again later.",
        type: 'ERROR',
        metadata: {
          error: error.message
        }
      });
    }
  }
}

// Export singleton instance
export const aiCoworkerService = new AICoworkerService();