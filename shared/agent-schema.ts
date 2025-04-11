/**
 * Agent Framework Database Schema
 * 
 * This module defines the database schema for the agent-based architecture.
 */

import { pgTable, serial, text, varchar, timestamp, boolean, integer, json, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './schema';
import { PriorityLevel, MessageStatus, AgentTypeEnum, CapabilityEnum } from './agent-framework';

// Agent framework enums
export const agentTypeEnum = pgEnum('agent_type', [
  'DATA_VALIDATION', 'VALUATION', 'TAX_INFORMATION', 'WORKFLOW', 'LEGAL_COMPLIANCE', 'USER_INTERACTION'
]);
export const agentCapabilityEnum = pgEnum('agent_capability', [
  'VALIDATION', 'CALCULATION', 'NOTIFICATION', 'ANALYSIS', 'RECOMMENDATION', 'AUTOMATION', 'COMPLIANCE'
]);
export const messagePriorityEnum = pgEnum('message_priority', ['HIGH', 'MEDIUM', 'LOW']);
export const messageStatusEnum = pgEnum('message_status', [
  'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED'
]);

// Agent registration table
export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  agentId: varchar('agent_id', { length: 50 }).notNull().unique(),
  type: agentTypeEnum('type').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  version: varchar('version', { length: 20 }).notNull(),
  isActive: boolean('is_active').default(true),
  settings: json('settings').$type<Record<string, any>>(),
  lastHeartbeat: timestamp('last_heartbeat'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;
export const insertAgentSchema = createInsertSchema(agents);

// Agent capabilities
export const agentCapabilities = pgTable('agent_capabilities', {
  id: serial('id').primaryKey(),
  agentId: varchar('agent_id', { length: 50 }).notNull().references(() => agents.agentId),
  capabilityId: varchar('capability_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: agentCapabilityEnum('type').notNull(),
  parameters: json('parameters').$type<z.ZodSchema<any>>(),
  requiresAuth: boolean('requires_auth').default(false),
  rateLimit: integer('rate_limit'), // requests per minute
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type AgentCapability = typeof agentCapabilities.$inferSelect;
export type InsertAgentCapability = typeof agentCapabilities.$inferInsert;
export const insertAgentCapabilitySchema = createInsertSchema(agentCapabilities);

// Agent messages
export const agentMessages = pgTable('agent_messages', {
  id: serial('id').primaryKey(),
  messageId: varchar('message_id', { length: 50 }).notNull().unique(),
  timestamp: timestamp('timestamp').defaultNow(),
  sender: varchar('sender', { length: 50 }).notNull(),
  recipient: varchar('recipient', { length: 50 }).notNull(),
  messageType: varchar('message_type', { length: 50 }).notNull(),
  priority: messagePriorityEnum('priority').notNull().default('MEDIUM'),
  payload: json('payload').$type<Record<string, any>>(),
  status: messageStatusEnum('status').notNull().default('PENDING'),
  correlationId: varchar('correlation_id', { length: 50 }),
  expiresAt: timestamp('expires_at'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow()
});

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = typeof agentMessages.$inferInsert;
export const insertAgentMessageSchema = createInsertSchema(agentMessages);

// Agent tasks
export const agentTasks = pgTable('agent_tasks', {
  id: serial('id').primaryKey(),
  taskId: varchar('task_id', { length: 50 }).notNull().unique(),
  agentId: varchar('agent_id', { length: 50 }).notNull().references(() => agents.agentId),
  taskType: varchar('task_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  priority: messagePriorityEnum('priority').notNull().default('MEDIUM'),
  parameters: json('parameters').$type<Record<string, any>>(),
  result: json('result').$type<Record<string, any>>(),
  error: json('error').$type<{ code: string, message: string, details?: any }>(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  assignedBy: integer('assigned_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = typeof agentTasks.$inferInsert;
export const insertAgentTaskSchema = createInsertSchema(agentTasks);

// Master Control Program logs
export const mcpLogs = pgTable('mcp_logs', {
  id: serial('id').primaryKey(),
  level: varchar('level', { length: 10 }).notNull().default('INFO'),
  component: varchar('component', { length: 50 }).notNull(),
  message: text('message').notNull(),
  details: json('details').$type<Record<string, any>>(),
  correlationId: varchar('correlation_id', { length: 50 }),
  timestamp: timestamp('timestamp').defaultNow()
});

export type McpLog = typeof mcpLogs.$inferSelect;
export type InsertMcpLog = typeof mcpLogs.$inferInsert;
export const insertMcpLogSchema = createInsertSchema(mcpLogs);

// Agent events for monitoring
export const agentEvents = pgTable('agent_events', {
  id: serial('id').primaryKey(),
  agentId: varchar('agent_id', { length: 50 }).references(() => agents.agentId),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 10 }).notNull().default('INFO'),
  details: json('details').$type<Record<string, any>>(),
  correlationId: varchar('correlation_id', { length: 50 }),
  timestamp: timestamp('timestamp').defaultNow()
});

export type AgentEvent = typeof agentEvents.$inferSelect;
export type InsertAgentEvent = typeof agentEvents.$inferInsert;
export const insertAgentEventSchema = createInsertSchema(agentEvents);

// Master prompt priority enum using existing messagePriorityEnum
// Update: Using existing messagePriorityEnum which has LOW, MEDIUM, HIGH values

// Agent experiences for replay buffer
export const agentExperiences = pgTable('agent_experiences', {
  id: serial('id').primaryKey(),
  agentId: varchar('agent_id', { length: 50 }).references(() => agents.agentId),
  correlationId: varchar('correlation_id', { length: 50 }),
  initialState: json('initial_state').$type<Record<string, any>>(),
  action: varchar('action', { length: 100 }).notNull(),
  result: json('result').$type<Record<string, any>>(),
  nextState: json('next_state').$type<Record<string, any>>(),
  reward: integer('reward').notNull().default(0),
  priority: integer('priority').notNull().default(1),
  metadata: json('metadata').$type<Record<string, any>>(),
  timestamp: timestamp('timestamp').defaultNow()
});

export type AgentExperience = typeof agentExperiences.$inferSelect;
export type InsertAgentExperience = typeof agentExperiences.$inferInsert;
export const insertAgentExperienceSchema = createInsertSchema(agentExperiences);

// Master prompts for system-wide directives
export const masterPrompts = pgTable('master_prompts', {
  id: serial('id').primaryKey(),
  promptId: varchar('prompt_id', { length: 50 }).notNull().unique(),
  version: varchar('version', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  content: text('content').notNull(),
  parameters: json('parameters').$type<Record<string, any>>(),
  timestamp: timestamp('timestamp').defaultNow(),
  expiresAt: timestamp('expires_at'),
  priority: messagePriorityEnum('priority').notNull().default('MEDIUM'),
  scope: json('scope').$type<Array<keyof typeof AgentTypeEnum> | 'ALL'>(),
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type MasterPrompt = typeof masterPrompts.$inferSelect;
export type InsertMasterPrompt = typeof masterPrompts.$inferInsert;
export const insertMasterPromptSchema = createInsertSchema(masterPrompts);

// Master prompt acknowledgments
export const masterPromptAcknowledgments = pgTable('master_prompt_acknowledgments', {
  id: serial('id').primaryKey(),
  promptId: varchar('prompt_id', { length: 50 }).notNull().references(() => masterPrompts.promptId),
  agentId: varchar('agent_id', { length: 50 }).notNull().references(() => agents.agentId),
  acknowledgedAt: timestamp('acknowledged_at').defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('ACKNOWLEDGED'),
  metadata: json('metadata').$type<Record<string, any>>()
});

export type MasterPromptAcknowledgment = typeof masterPromptAcknowledgments.$inferSelect;
export type InsertMasterPromptAcknowledgment = typeof masterPromptAcknowledgments.$inferInsert;
export const insertMasterPromptAcknowledgmentSchema = createInsertSchema(masterPromptAcknowledgments);