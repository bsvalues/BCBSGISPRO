// Achievement service for interacting with the achievement API

// Achievement type definition
export interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  points: number;
  icon: string;
  color: string;
  criteria: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// User achievement type definition
export interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  earnedAt: Date;
  progress?: number;
  achievement?: Achievement;
}

// Get all achievements
export async function getAllAchievements(): Promise<Achievement[]> {
  const response = await fetch('/api/achievements');
  if (!response.ok) {
    throw new Error('Failed to fetch achievements');
  }
  return response.json();
}

// Get a specific achievement by ID
export async function getAchievement(id: number): Promise<Achievement> {
  const response = await fetch(`/api/achievements/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch achievement with ID ${id}`);
  }
  return response.json();
}

// Get all achievements for a user
export async function getUserAchievements(userId: number): Promise<UserAchievement[]> {
  const response = await fetch(`/api/users/${userId}/achievements`);
  if (!response.ok) {
    throw new Error(`Failed to fetch achievements for user ${userId}`);
  }
  return response.json();
}

// Award an achievement to a user
export async function awardAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
  const response = await fetch(`/api/users/${userId}/achievements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ achievementId })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to award achievement ${achievementId} to user ${userId}`);
  }
  
  return response.json();
}

// Update achievement progress for a user
export async function updateAchievementProgress(
  userId: number, 
  achievementId: number, 
  progress: number
): Promise<UserAchievement> {
  const response = await fetch(`/api/users/${userId}/achievements/${achievementId}/progress`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ progress })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update progress for achievement ${achievementId}`);
  }
  
  return response.json();
}

// Get achievements by category
export async function getAchievementsByCategory(category: string): Promise<Achievement[]> {
  const response = await fetch(`/api/achievements/category/${category}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch achievements for category ${category}`);
  }
  return response.json();
}

// Get all categories
export async function getAchievementCategories(): Promise<string[]> {
  const response = await fetch('/api/achievements/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch achievement categories');
  }
  return response.json();
}

// Get user achievement stats (total points, achievements earned, etc.)
export async function getUserAchievementStats(userId: number): Promise<{
  totalPoints: number;
  achievementsEarned: number;
  totalAchievements: number;
  topCategory: string;
}> {
  const response = await fetch(`/api/users/${userId}/achievements/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch achievement stats for user ${userId}`);
  }
  return response.json();
}