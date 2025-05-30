import { apiRequest } from '../lib/queryClient';

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
  metadata?: any;
  achievement?: Achievement;
}

export interface AchievementCategory {
  name: string;
  count: number;
}

export interface AchievementStats {
  totalPoints: number;
  achievementsEarned: number;
  totalAchievements: number;
  topCategory: string;
  categories: AchievementCategory[];
}

// Get all achievements
export const getAllAchievements = async (): Promise<Achievement[]> => {
  return apiRequest('/api/achievements');
};

// Get achievement categories
export const getAchievementCategories = async (): Promise<string[]> => {
  return apiRequest('/api/achievements/categories');
};

// Get achievements by category
export const getAchievementsByCategory = async (category: string): Promise<Achievement[]> => {
  return apiRequest(`/api/achievements/category/${category}`);
};

// Get achievements by type
export const getAchievementsByType = async (type: string): Promise<Achievement[]> => {
  return apiRequest(`/api/achievements/type/${type}`);
};

// Get a specific achievement by ID
export const getAchievement = async (id: number): Promise<Achievement> => {
  return apiRequest(`/api/achievements/${id}`);
};

// Get user achievements
export const getUserAchievements = async (userId: number): Promise<UserAchievement[]> => {
  return apiRequest(`/api/achievements/user/${userId}`);
};

// Award an achievement to a user
export const awardAchievement = async (
  userId: number, 
  achievementId: number, 
  progress: number = 100
): Promise<UserAchievement> => {
  return apiRequest(`/api/achievements/user/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ achievementId, progress }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Update achievement progress for a user
export const updateAchievementProgress = async (
  userId: number,
  achievementId: number,
  progress: number,
  metadata?: any
): Promise<UserAchievement> => {
  return apiRequest(`/api/achievements/user/${userId}/achievement/${achievementId}`, {
    method: 'PUT',
    body: JSON.stringify({ progress, metadata }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Get achievement statistics for a user
export const getUserAchievementStats = async (userId: number): Promise<AchievementStats> => {
  return apiRequest(`/api/achievements/user/${userId}/stats`);
};

// Check if a user has a specific achievement
export const checkUserHasAchievement = async (
  userId: number,
  achievementId: number
): Promise<boolean> => {
  try {
    const userAchievements = await getUserAchievements(userId);
    return userAchievements.some(ua => 
      ua.achievementId === achievementId && ua.progress === 100
    );
  } catch (error) {
    console.error('Error checking user achievement:', error);
    return false;
  }
};

// Check if a user has a specific achievement with any progress
export const checkUserHasAchievementInProgress = async (
  userId: number,
  achievementId: number
): Promise<UserAchievement | null> => {
  try {
    const userAchievements = await getUserAchievements(userId);
    const achievement = userAchievements.find(ua => ua.achievementId === achievementId);
    return achievement || null;
  } catch (error) {
    console.error('Error checking user achievement progress:', error);
    return null;
  }
};