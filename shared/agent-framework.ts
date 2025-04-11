/**
 * Agent Framework Types
 * 
 * This module defines the core interfaces and types for the agent-based architecture.
 * It establishes a standardized communication protocol between the Master Control Program (MCP)
 * and the specialized agents.
 */

import { z } from 'zod';

/**
 * Agent types supported by the system
 */
export const AgentTypeEnum = {
  DATA_VALIDATION: 'DATA_VALIDATION',
  VALUATION: 'VALUATION',
  TAX_INFORMATION: 'TAX_INFORMATION',
  WORKFLOW: 'WORKFLOW',
  LEGAL_COMPLIANCE: 'LEGAL_COMPLIANCE',
  USER_INTERACTION: 'USER_INTERACTION',
  MAP_INTELLIGENCE: 'MAP_INTELLIGENCE'
} as const;

export type AgentType = keyof typeof AgentTypeEnum;

/**
 * Agent capability categories
 */
export const CapabilityEnum = {
  VALIDATION: 'VALIDATION',
  CALCULATION: 'CALCULATION',
  NOTIFICATION: 'NOTIFICATION',
  ANALYSIS: 'ANALYSIS',
  RECOMMENDATION: 'RECOMMENDATION',
  AUTOMATION: 'AUTOMATION',
  COMPLIANCE: 'COMPLIANCE',
  LAYER_RECOMMENDATION: 'LAYER_RECOMMENDATION',
  CONTEXT_AWARENESS: 'CONTEXT_AWARENESS',
  DATA_QUALITY_VISUALIZATION: 'DATA_QUALITY_VISUALIZATION'
} as const;

export type Capability = keyof typeof CapabilityEnum;

/**
 * Message priority levels
 */
export enum PriorityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Agent message status values
 */
export enum MessageStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED'
}

/**
 * Agent credential interface
 */
export interface AgentCredential {
  agentId: string;
  apiKey: string;
  permissions: string[];
}

/**
 * Core interface for agent messages
 */
export interface AgentMessage {
  id: string;
  timestamp: Date;
  sender: string;
  recipient: string;
  messageType: string;
  priority: PriorityLevel;
  payload: Record<string, any>;
  status: MessageStatus;
  correlationId?: string;
  expiresAt?: Date;
}

/**
 * Agent request schema
 */
export const AgentRequestSchema = z.object({
  type: z.string(),
  action: z.string(),
  priority: z.enum([PriorityLevel.HIGH, PriorityLevel.MEDIUM, PriorityLevel.LOW]).default(PriorityLevel.MEDIUM),
  payload: z.record(z.any()),
  metadata: z.object({
    correlationId: z.string().optional(),
    requestedBy: z.string().optional(),
    idempotencyKey: z.string().optional()
  }).optional()
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

/**
 * Agent response schema
 */
export const AgentResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  correlationId: z.string().optional(),
  data: z.record(z.any()).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

/**
 * Agent capability interface
 */
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  type: Capability;
  parameters: z.ZodSchema<any>;
  requiresAuth: boolean;
  rateLimit?: number; // requests per minute
}

/**
 * Master Prompt interface
 * 
 * Represents a system-wide directive or instruction set that defines
 * common goals, communication protocols, and operational guidelines
 * for all agents in the ecosystem.
 */
export interface MasterPrompt {
  id: string;
  version: string;
  name: string;
  description: string;
  content: string;
  parameters?: Record<string, any>;
  timestamp: Date;
  expiresAt?: Date;
  priority: PriorityLevel;
  scope: AgentType[] | 'ALL'; // Target agent types or ALL for system-wide
}

/**
 * Base agent interface that all specialized agents must implement
 */
export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  isActive: boolean;
  
  initialize(): Promise<boolean>;
  getCapabilities(): AgentCapability[];
  handleRequest(request: AgentRequest): Promise<AgentResponse>;
  validateRequest(request: AgentRequest): boolean;
  getStatus(): Promise<Record<string, any>>;
  shutdown(): Promise<void>;
  
  // New methods for collaborative learning
  updateBehavior?(updateData: Record<string, any>): Promise<boolean>;
  recordExperience?(experience: Record<string, any>): Promise<void>;
  requestAssistance?(issue: string, context: Record<string, any>): Promise<AgentResponse>;
  provideAssistance?(request: Record<string, any>): Promise<AgentResponse>;
  
  // Master Prompt methods
  receiveMasterPrompt?(prompt: MasterPrompt): Promise<boolean>;
  confirmPromptAcknowledgment?(promptId: string): Promise<boolean>;
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  settings: Record<string, any>;
  capabilities: string[]; // IDs of capabilities
  rateLimits: Record<string, number>;
  authRequirements: string[];
}

/**
 * Agent registry interface
 */
export interface AgentRegistry {
  registerAgent(agent: Agent): void;
  unregisterAgent(agentId: string): void;
  getAgent(agentId: string): Agent | undefined;
  getAgentsByType(type: AgentType): Agent[];
  getAllAgents(): Agent[];
  getActiveAgents(): Agent[];
}

/**
 * Master Control Program (MCP) interface
 */
export interface MasterControlProgram {
  registry: AgentRegistry;
  
  initialize(): Promise<void>;
  routeMessage(message: AgentMessage): Promise<void>;
  dispatchRequest(request: AgentRequest): Promise<AgentResponse>;
  broadcastMessage(message: Omit<AgentMessage, 'recipient'>): Promise<void>;
  registerEventHandler(eventType: string, handler: (event: any) => void): void;
  getAgentStatus(agentId: string): Promise<Record<string, any>>;
  getSystemStatus(): Promise<Record<string, any>>;
  shutdown(): Promise<void>;
  
  // Master Prompt methods
  createMasterPrompt(prompt: Omit<MasterPrompt, 'id' | 'timestamp'>): Promise<MasterPrompt>;
  updateMasterPrompt(id: string, updates: Partial<MasterPrompt>): Promise<MasterPrompt>;
  getMasterPrompt(id: string): Promise<MasterPrompt | null>;
  getActiveMasterPrompts(): Promise<MasterPrompt[]>;
  broadcastMasterPrompt(promptId: string, targetAgents?: string[]): Promise<number>;
  revokeMasterPrompt(id: string): Promise<boolean>;
}

/**
 * Agent event types
 */
export enum AgentEventType {
  AGENT_REGISTERED = 'AGENT_REGISTERED',
  AGENT_UNREGISTERED = 'AGENT_UNREGISTERED',
  AGENT_STATUS_CHANGED = 'AGENT_STATUS_CHANGED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  MESSAGE_PROCESSED = 'MESSAGE_PROCESSED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  SYSTEM_STATUS_CHANGED = 'SYSTEM_STATUS_CHANGED',
  
  // New events for collaborative learning
  EXPERIENCE_RECORDED = 'EXPERIENCE_RECORDED',
  TRAINING_STARTED = 'TRAINING_STARTED',
  TRAINING_COMPLETED = 'TRAINING_COMPLETED',
  POLICY_UPDATED = 'POLICY_UPDATED',
  ASSISTANCE_REQUESTED = 'ASSISTANCE_REQUESTED',
  ASSISTANCE_PROVIDED = 'ASSISTANCE_PROVIDED',
  LEARNING_SHARED = 'LEARNING_SHARED',
  
  // Master Prompt events
  MASTER_PROMPT_CREATED = 'MASTER_PROMPT_CREATED',
  MASTER_PROMPT_UPDATED = 'MASTER_PROMPT_UPDATED',
  MASTER_PROMPT_RECEIVED = 'MASTER_PROMPT_RECEIVED',
  MASTER_PROMPT_ACKNOWLEDGED = 'MASTER_PROMPT_ACKNOWLEDGED',
  DIRECTIVE_BROADCAST = 'DIRECTIVE_BROADCAST'
}