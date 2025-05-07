/**
 * Achievements Service
 * 
 * Provides client-side functions for interacting with the achievements API
 */

import { apiRequest } from '../lib/queryClient';

const BASE_URL = '/api/achievements';

export interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  type: string;
  points: number;
  icon: string;
  color: string;
  criteria: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  earnedAt: string;
  progress: number;
  metadata: any;
  achievement?: Achievement;
}

export interface AchievementProgress {
  userId: number;
  points: number;
  achievements: UserAchievement[];
  recentAchievements: UserAchievement[];
}

/**
 * Fetches all achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  return apiRequest<Achievement[]>(BASE_URL);
}

/**
 * Fetches achievements by category
 */
export async function getAchievementsByCategory(category: string): Promise<Achievement[]> {
  return apiRequest<Achievement[]>(`${BASE_URL}/category/${category}`);
}

/**
 * Fetches achievements by type
 */
export async function getAchievementsByType(type: string): Promise<Achievement[]> {
  return apiRequest<Achievement[]>(`${BASE_URL}/type/${type}`);
}

/**
 * Fetches a specific achievement by ID
 */
export async function getAchievement(id: number): Promise<Achievement> {
  return apiRequest<Achievement>(`${BASE_URL}/${id}`);
}

/**
 * Fetches achievements earned by a specific user
 */
export async function getUserAchievements(userId: number): Promise<UserAchievement[]> {
  return apiRequest<UserAchievement[]>(`${BASE_URL}/user/${userId}`);
}

/**
 * Gets a user's total achievement points
 */
export async function getUserPoints(userId: number): Promise<{ userId: number; points: number }> {
  return apiRequest<{ userId: number; points: number }>(`${BASE_URL}/user/${userId}/points`);
}

/**
 * Awards an achievement to a user
 */
export async function awardAchievement(
  userId: number, 
  achievementId: number, 
  progress: number = 100,
  metadata?: any
): Promise<UserAchievement> {
  return apiRequest<UserAchievement>(`${BASE_URL}/award`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      achievementId,
      progress,
      metadata
    })
  });
}

/**
 * Updates a user's achievement progress
 */
export async function updateAchievementProgress(
  userAchievementId: number,
  progress: number,
  metadata?: any
): Promise<UserAchievement> {
  return apiRequest<UserAchievement>(`${BASE_URL}/user-achievement/${userAchievementId}`, {
    method: 'PUT',
    body: JSON.stringify({
      progress,
      metadata
    })
  });
}

/**
 * Checks if a user has a specific achievement and its progress
 */
export async function checkUserAchievement(userId: number, achievementName: string): Promise<{
  earned: boolean;
  progress: number;
  achievement?: Achievement;
  userAchievement?: UserAchievement;
}> {
  // First, get all achievements to find the one with the specified name
  const allAchievements = await getAllAchievements();
  const achievement = allAchievements.find(a => a.name === achievementName);
  
  if (!achievement) {
    return { earned: false, progress: 0 };
  }
  
  // Then, get the user's achievements
  const userAchievements = await getUserAchievements(userId);
  const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
  
  if (!userAchievement) {
    return { earned: false, progress: 0, achievement };
  }
  
  return {
    earned: userAchievement.progress === 100,
    progress: userAchievement.progress,
    achievement,
    userAchievement
  };
}

/**
 * Gets a comprehensive summary of a user's achievement progress
 */
export async function getUserAchievementProgress(userId: number): Promise<AchievementProgress> {
  // Get user's points
  const { points } = await getUserPoints(userId);
  
  // Get user's achievements with details
  const achievements = await getUserAchievements(userId);
  
  // Sort recent achievements (in the last 7 days) by newest first
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentAchievements = achievements
    .filter(a => new Date(a.earnedAt) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
  
  return {
    userId,
    points,
    achievements,
    recentAchievements
  };
}