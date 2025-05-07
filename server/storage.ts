import { eq, and, desc, asc, sql, like } from 'drizzle-orm';
import { db } from './db';
import { 
  users,
  mapElements,
  mapEvaluations,
  elementEvaluations,
  bentonCountyMaps,
  achievements,
  userAchievements,
  type User,
  type InsertUser,
  type MapElement,
  type InsertMapElement,
  type MapEvaluation,
  type InsertMapEvaluation,
  type ElementEvaluation,
  type InsertElementEvaluation,
  type BentonCountyMap,
  type InsertBentonCountyMap,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement
} from '../shared/schema';

// Define the interface that all storage implementations must implement
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Map Elements operations (33 best practices)
  getMapElement(id: number): Promise<MapElement | undefined>;
  getMapElementByElementId(elementId: string): Promise<MapElement | undefined>;
  getAllMapElements(): Promise<MapElement[]>;
  getMapElementsByCategory(category: string): Promise<MapElement[]>;
  getMapElementsByImportance(importance: string): Promise<MapElement[]>;
  createMapElement(element: InsertMapElement): Promise<MapElement>;
  updateMapElement(id: number, updates: Partial<InsertMapElement>): Promise<MapElement>;
  searchMapElements(query: string): Promise<MapElement[]>;
  
  // Map Evaluations operations
  getMapEvaluation(id: number): Promise<MapEvaluation | undefined>;
  getMapEvaluationsByUser(userId: number): Promise<MapEvaluation[]>;
  createMapEvaluation(evaluation: InsertMapEvaluation & { overallScore: number, aiRecommendations: string }): Promise<MapEvaluation>;
  getElementEvaluationsForMap(mapEvaluationId: number): Promise<ElementEvaluation[]>;
  createElementEvaluation(evaluation: InsertElementEvaluation): Promise<ElementEvaluation>;
  
  // Benton County Maps operations
  getBentonCountyMap(id: number): Promise<BentonCountyMap | undefined>;
  getBentonCountyMapsByUser(userId: number): Promise<BentonCountyMap[]>;
  getPublicBentonCountyMaps(): Promise<BentonCountyMap[]>;
  createBentonCountyMap(map: InsertBentonCountyMap): Promise<BentonCountyMap>;
  updateBentonCountyMap(id: number, updates: Partial<InsertBentonCountyMap>): Promise<BentonCountyMap>;
  deleteBentonCountyMap(id: number): Promise<boolean>;
  
  // Achievement operations for gamification
  getAchievement(id: number): Promise<Achievement | undefined>;
  getAchievementByName(name: string): Promise<Achievement | undefined>;
  getAllAchievements(): Promise<Achievement[]>;
  getAchievementsByCategory(category: string): Promise<Achievement[]>;
  getAchievementsByType(type: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: number, updates: Partial<InsertAchievement>): Promise<Achievement>;
  deleteAchievement(id: number): Promise<boolean>;
  
  // User Achievement operations
  getUserAchievement(id: number): Promise<UserAchievement | undefined>;
  getUserAchievementsByUser(userId: number): Promise<UserAchievement[]>;
  getUserAchievementsByAchievement(achievementId: number): Promise<UserAchievement[]>;
  getUserAchievementByUserAndAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined>;
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievementProgress(id: number, progress: number, metadata?: any): Promise<UserAchievement>;
  deleteUserAchievement(id: number): Promise<boolean>;
  getUserPoints(userId: number): Promise<number>; // Total points from all achievements
}

// Implementation of storage interface using the database
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Map Elements operations (33 best practices)
  async getMapElement(id: number): Promise<MapElement | undefined> {
    const [element] = await db.select().from(mapElements).where(eq(mapElements.id, id));
    return element;
  }

  async getMapElementByElementId(elementId: string): Promise<MapElement | undefined> {
    const [element] = await db.select().from(mapElements).where(eq(mapElements.elementId, elementId));
    return element;
  }

  async getAllMapElements(): Promise<MapElement[]> {
    return db.select().from(mapElements).orderBy(asc(mapElements.sortOrder));
  }

  async getMapElementsByCategory(category: string): Promise<MapElement[]> {
    return db.select()
      .from(mapElements)
      .where(eq(mapElements.category, category))
      .orderBy(asc(mapElements.sortOrder));
  }

  async getMapElementsByImportance(importance: string): Promise<MapElement[]> {
    return db.select()
      .from(mapElements)
      .where(eq(mapElements.importance, importance))
      .orderBy(asc(mapElements.sortOrder));
  }

  async createMapElement(element: InsertMapElement): Promise<MapElement> {
    const [newElement] = await db.insert(mapElements).values(element).returning();
    return newElement;
  }

  async updateMapElement(id: number, updates: Partial<InsertMapElement>): Promise<MapElement> {
    const [updatedElement] = await db.update(mapElements)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(mapElements.id, id))
      .returning();
      
    if (!updatedElement) {
      throw new Error(`Map element with ID ${id} not found`);
    }
    
    return updatedElement;
  }

  async searchMapElements(query: string): Promise<MapElement[]> {
    const searchPattern = `%${query}%`;
    
    return db.select()
      .from(mapElements)
      .where(
        sql`${mapElements.name} ILIKE ${searchPattern} OR 
            ${mapElements.description} ILIKE ${searchPattern} OR 
            ${mapElements.bentonCountyUsage} ILIKE ${searchPattern}`
      )
      .orderBy(asc(mapElements.sortOrder));
  }

  // Map Evaluations operations
  async getMapEvaluation(id: number): Promise<MapEvaluation | undefined> {
    const [evaluation] = await db.select().from(mapEvaluations).where(eq(mapEvaluations.id, id));
    return evaluation;
  }

  async getMapEvaluationsByUser(userId: number): Promise<MapEvaluation[]> {
    return db.select()
      .from(mapEvaluations)
      .where(eq(mapEvaluations.userId, userId))
      .orderBy(desc(mapEvaluations.createdAt));
  }

  async createMapEvaluation(evaluation: InsertMapEvaluation & { overallScore: number, aiRecommendations: string }): Promise<MapEvaluation> {
    const [newEvaluation] = await db.insert(mapEvaluations).values(evaluation).returning();
    return newEvaluation;
  }

  async getElementEvaluationsForMap(mapEvaluationId: number): Promise<ElementEvaluation[]> {
    return db.select()
      .from(elementEvaluations)
      .where(eq(elementEvaluations.mapEvaluationId, mapEvaluationId));
  }

  async createElementEvaluation(evaluation: InsertElementEvaluation): Promise<ElementEvaluation> {
    const [newEval] = await db.insert(elementEvaluations).values(evaluation).returning();
    return newEval;
  }

  // Benton County Maps operations
  async getBentonCountyMap(id: number): Promise<BentonCountyMap | undefined> {
    const [map] = await db.select().from(bentonCountyMaps).where(eq(bentonCountyMaps.id, id));
    return map;
  }

  async getBentonCountyMapsByUser(userId: number): Promise<BentonCountyMap[]> {
    return db.select()
      .from(bentonCountyMaps)
      .where(eq(bentonCountyMaps.userId, userId))
      .orderBy(desc(bentonCountyMaps.updatedAt));
  }

  async getPublicBentonCountyMaps(): Promise<BentonCountyMap[]> {
    return db.select()
      .from(bentonCountyMaps)
      .where(eq(bentonCountyMaps.isPublic, true))
      .orderBy(desc(bentonCountyMaps.updatedAt));
  }

  async createBentonCountyMap(map: InsertBentonCountyMap): Promise<BentonCountyMap> {
    const [newMap] = await db.insert(bentonCountyMaps).values(map).returning();
    return newMap;
  }

  async updateBentonCountyMap(id: number, updates: Partial<InsertBentonCountyMap>): Promise<BentonCountyMap> {
    const [updatedMap] = await db.update(bentonCountyMaps)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(bentonCountyMaps.id, id))
      .returning();
      
    if (!updatedMap) {
      throw new Error(`Benton County map with ID ${id} not found`);
    }
    
    return updatedMap;
  }

  async deleteBentonCountyMap(id: number): Promise<boolean> {
    const result = await db.delete(bentonCountyMaps)
      .where(eq(bentonCountyMaps.id, id));
    
    return true;
  }

  // Achievement operations for gamification
  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement;
  }

  async getAchievementByName(name: string): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.name, name));
    return achievement;
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements).orderBy(asc(achievements.sortOrder));
  }

  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    return db.select()
      .from(achievements)
      .where(eq(achievements.category, category))
      .orderBy(asc(achievements.sortOrder));
  }

  async getAchievementsByType(type: string): Promise<Achievement[]> {
    return db.select()
      .from(achievements)
      .where(eq(achievements.type, type))
      .orderBy(asc(achievements.sortOrder));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async updateAchievement(id: number, updates: Partial<InsertAchievement>): Promise<Achievement> {
    const [updatedAchievement] = await db.update(achievements)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(achievements.id, id))
      .returning();
      
    if (!updatedAchievement) {
      throw new Error(`Achievement with ID ${id} not found`);
    }
    
    return updatedAchievement;
  }

  async deleteAchievement(id: number): Promise<boolean> {
    const result = await db.delete(achievements)
      .where(eq(achievements.id, id));
    
    return true;
  }

  // User Achievement operations
  async getUserAchievement(id: number): Promise<UserAchievement | undefined> {
    const [userAchievement] = await db.select().from(userAchievements).where(eq(userAchievements.id, id));
    return userAchievement;
  }

  async getUserAchievementsByUser(userId: number): Promise<UserAchievement[]> {
    return db.select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
  }

  async getUserAchievementsByAchievement(achievementId: number): Promise<UserAchievement[]> {
    return db.select()
      .from(userAchievements)
      .where(eq(userAchievements.achievementId, achievementId))
      .orderBy(desc(userAchievements.earnedAt));
  }

  async getUserAchievementByUserAndAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined> {
    const [userAchievement] = await db.select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
    return userAchievement;
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [newUserAchievement] = await db.insert(userAchievements).values(userAchievement).returning();
    return newUserAchievement;
  }

  async updateUserAchievementProgress(id: number, progress: number, metadata?: any): Promise<UserAchievement> {
    const updates: any = { progress };
    
    if (metadata) {
      updates.metadata = metadata;
    }
    
    const [updatedUserAchievement] = await db.update(userAchievements)
      .set(updates)
      .where(eq(userAchievements.id, id))
      .returning();
      
    if (!updatedUserAchievement) {
      throw new Error(`User Achievement with ID ${id} not found`);
    }
    
    return updatedUserAchievement;
  }

  async deleteUserAchievement(id: number): Promise<boolean> {
    const result = await db.delete(userAchievements)
      .where(eq(userAchievements.id, id));
    
    return true;
  }

  async getUserPoints(userId: number): Promise<number> {
    // Join user achievements with achievements to get points
    const userAchievementsWithPoints = await db.select({
      points: achievements.points,
      progress: userAchievements.progress
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userId));
    
    // Calculate total points (adjusting for partial progress)
    return userAchievementsWithPoints.reduce((total, item) => {
      // Calculate points based on progress percentage (progress is 0-100)
      const earnedPoints = Math.floor(item.points * (item.progress / 100));
      return total + earnedPoints;
    }, 0);
  }
}

// Create and export a single instance of the storage for use throughout the app
export const storage = new DatabaseStorage();