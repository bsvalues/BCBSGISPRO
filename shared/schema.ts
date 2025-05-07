import { pgTable, serial, text, varchar, timestamp, integer, boolean, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Map Elements table - based on the 33 essential map elements for Benton County
export const mapElements = pgTable('map_elements', {
  id: serial('id').primaryKey(),
  elementId: varchar('element_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  importance: varchar('importance', { length: 20 }).notNull(), // 'high', 'medium', 'low'
  bentonCountyUsage: text('benton_county_usage').notNull(), // Specific usage in Benton County
  bentonCountyExample: text('benton_county_example'), // Real examples from Benton County
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Map Evaluation table - Stores user map evaluations with AI recommendations
export const mapEvaluations = pgTable('map_evaluations', {
  id: serial('id').primaryKey(),
  mapDescription: text('map_description').notNull(),
  mapPurpose: text('map_purpose').notNull(),
  mapContext: text('map_context'),
  overallScore: integer('overall_score').notNull(),
  aiRecommendations: text('ai_recommendations').notNull(),
  userId: integer('user_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Element Evaluations - Individual element evaluations within a map evaluation
export const elementEvaluations = pgTable('element_evaluations', {
  id: serial('id').primaryKey(),
  mapEvaluationId: integer('map_evaluation_id').notNull(),
  elementId: varchar('element_id', { length: 50 }).notNull(),
  implementationStatus: varchar('implementation_status', { length: 20 }).notNull(), // 'implemented', 'partial', 'missing'
  aiTips: text('ai_tips'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User tables for authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Benton County Maps table - for saving real maps created for Benton County
export const bentonCountyMaps = pgTable('benton_county_maps', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  purpose: text('purpose').notNull(),
  creator: varchar('creator', { length: 100 }),
  department: varchar('department', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: integer('user_id'),
  isPublic: boolean('is_public').default(false),
  mapUrl: text('map_url'), // URL to the actual map file
  evaluationId: integer('evaluation_id'), // Reference to AI evaluation if available
});

// Achievements table - for the gamified achievement system
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // e.g., 'sync', 'map', 'legal', 'document'
  type: varchar('type', { length: 50 }).notNull(), // e.g., 'milestone', 'streak', 'skill'
  points: integer('points').notNull().default(10),
  icon: varchar('icon', { length: 100 }).notNull(), // Icon name from lucide-react
  color: varchar('color', { length: 20 }).notNull(), // CSS color for the badge
  criteria: text('criteria').notNull(), // Description of how to earn the achievement
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User Achievements table - tracks which users have earned which achievements
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  achievementId: integer('achievement_id').notNull(),
  earnedAt: timestamp('earned_at').defaultNow(),
  progress: integer('progress').notNull().default(100), // Can be < 100 for partial completion
  metadata: json('metadata'), // Additional data about how achievement was earned
});

// Zod schemas for validation
export const insertMapElementSchema = createInsertSchema(mapElements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMapEvaluationSchema = createInsertSchema(mapEvaluations).omit({ id: true, createdAt: true, overallScore: true, aiRecommendations: true });
export const insertElementEvaluationSchema = createInsertSchema(elementEvaluations).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, lastLogin: true });
export const insertBentonCountyMapSchema = createInsertSchema(bentonCountyMaps).omit({ id: true, createdAt: true, updatedAt: true, evaluationId: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, earnedAt: true });

// Types using Zod inference
export type InsertMapElement = z.infer<typeof insertMapElementSchema>;
export type InsertMapEvaluation = z.infer<typeof insertMapEvaluationSchema>;
export type InsertElementEvaluation = z.infer<typeof insertElementEvaluationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBentonCountyMap = z.infer<typeof insertBentonCountyMapSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Select types using Drizzle inference
export type MapElement = typeof mapElements.$inferSelect;
export type MapEvaluation = typeof mapEvaluations.$inferSelect;
export type ElementEvaluation = typeof elementEvaluations.$inferSelect;
export type User = typeof users.$inferSelect;
export type BentonCountyMap = typeof bentonCountyMaps.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;

// Legal Description Types
export interface ParsedLegalDescription {
  section?: string;
  township?: string;
  range?: string;
  plat?: string;
  lot?: string;
  block?: string;
  subdivision?: string;
  boundaryPoints?: string[];
  acreage?: string;
  quarterSections?: string[];
  rawDescription: string;
}

export interface LegalDescriptionResult {
  validationScore: number;
  issues: string[];
  recommendations: string[];
  interpretation: string;
  boundaryDescription: string;
  drawingInstructions: string[];
  validationMethod?: string;
}

export interface LegalDescriptionVisualization {
  coordinates: [number, number][];
  cardinalPoints: string[];
  shapeType: string;
  estimatedArea: number;
  geometry?: any; // GeoJSON geometry
}