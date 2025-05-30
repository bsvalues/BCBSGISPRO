/**
 * Agent Tools Schema
 * 
 * This module defines the types and interfaces for the agent tools integration.
 * It provides a consistent interface for interacting with the agent framework.
 */

import { z } from 'zod';

/**
 * Agent types supported by the system
 */
export const AgentType = {
  DATA_VALIDATION: 'DATA_VALIDATION',
  LEGAL_COMPLIANCE: 'LEGAL_COMPLIANCE',
  MAP_INTELLIGENCE: 'MAP_INTELLIGENCE',
  WORKFLOW: 'WORKFLOW',
  TAX_INFORMATION: 'TAX_INFORMATION',
  USER_INTERACTION: 'USER_INTERACTION',
  VALUATION: 'VALUATION'
} as const;

export type AgentTypeKey = keyof typeof AgentType;

/**
 * Agent capability categories
 */
export const CapabilityType = {
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

export type CapabilityTypeKey = keyof typeof CapabilityType;

/**
 * Priority levels for agent messages
 */
export enum PriorityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Agent interface representing a specialized AI agent
 */
export interface Agent {
  id: string;
  type: AgentTypeKey;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  capabilities: AgentCapability[];
}

/**
 * Agent capability representing a specific function an agent can perform
 */
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  type: CapabilityTypeKey;
  parameters: Record<string, any>;
  requiresAuth: boolean;
}

/**
 * Agent request schema for sending requests to agents
 */
export const AgentRequestSchema = z.object({
  type: z.string(),
  action: z.string(),
  payload: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

/**
 * Agent response schema for responses from agents
 */
export interface AgentResponse {
  success: boolean;
  messageId?: string;
  correlationId?: string;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * System status interface for the agent framework
 */
export interface SystemStatus {
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  agentCount: number;
  activeAgentCount: number;
  pendingMessages: number;
  uptime: number; // in seconds
  version: string;
  lastUpdated: Date;
}