/**
 * Achievement Routes
 * 
 * API endpoints for managing the gamification system achievements
 */

import express from 'express';
import asyncHandler from 'express-async-handler';
import { storage } from '../storage';
import { achievementService } from '../services/achievement-service';
import { insertUserAchievementSchema } from '../../shared/schema';

const router = express.Router();

// Get all achievements
router.get('/', asyncHandler(async (req, res) => {
  const achievements = await storage.getAllAchievements();
  res.json(achievements);
}));

// Get achievement by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const achievementId = parseInt(req.params.id);
  
  if (isNaN(achievementId)) {
    return res.status(400).json({ error: 'Invalid achievement ID' });
  }
  
  const achievement = await storage.getAchievement(achievementId);
  
  if (!achievement) {
    return res.status(404).json({ error: 'Achievement not found' });
  }
  
  res.json(achievement);
}));

// Get achievements by category
router.get('/category/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const achievements = await storage.getAchievementsByCategory(category);
  res.json(achievements);
}));

// Get achievements by type
router.get('/type/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const achievements = await storage.getAchievementsByType(type);
  res.json(achievements);
}));

// Get achievements earned by a user
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  const userAchievements = await storage.getUserAchievements(userId);
  
  // For each user achievement, fetch the achievement details
  const detailedAchievements = await Promise.all(
    userAchievements.map(async (ua) => {
      const achievement = await storage.getAchievement(ua.achievementId);
      return { ...ua, achievement };
    })
  );
  
  res.json(detailedAchievements);
}));

// Get user's achievement points
router.get('/user/:userId/points', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  // Get all user's achievements
  const userAchievements = await storage.getUserAchievements(userId);
  
  // Get all achievements to calculate points
  const achievements = await storage.getAllAchievements();
  
  // Calculate total points from completed achievements
  let totalPoints = 0;
  
  for (const ua of userAchievements) {
    if (ua.progress === 100) { // Only count completed achievements
      const achievement = achievements.find(a => a.id === ua.achievementId);
      if (achievement) {
        totalPoints += achievement.points;
      }
    }
  }
  
  res.json({ userId, points: totalPoints });
}));

// Award an achievement to a user
router.post('/award', asyncHandler(async (req, res) => {
  const result = insertUserAchievementSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid achievement data', details: result.error });
  }
  
  const { userId, achievementId, progress, metadata } = result.data;
  
  // Check if the user exists
  const user = await storage.getUser(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check if the achievement exists
  const achievement = await storage.getAchievement(achievementId);
  
  if (!achievement) {
    return res.status(404).json({ error: 'Achievement not found' });
  }
  
  // Check if user already has this achievement
  const existingAward = await storage.getUserAchievementByUserAndAchievement(
    userId,
    achievementId
  );
  
  if (existingAward) {
    // If the new progress is higher, update it
    if (progress > existingAward.progress) {
      const updatedAward = await storage.updateUserAchievementProgress(
        existingAward.id,
        progress,
        metadata
      );
      
      return res.json(updatedAward);
    }
    
    // Otherwise, return the existing award
    return res.json(existingAward);
  }
  
  // Create a new user achievement
  const userAchievement = await storage.createUserAchievement({
    userId,
    achievementId,
    progress,
    metadata
  });
  
  res.status(201).json(userAchievement);
}));

// Update a user's achievement progress
router.put('/user-achievement/:id', asyncHandler(async (req, res) => {
  const userAchievementId = parseInt(req.params.id);
  
  if (isNaN(userAchievementId)) {
    return res.status(400).json({ error: 'Invalid user achievement ID' });
  }
  
  const { progress, metadata } = req.body;
  
  if (typeof progress !== 'number' || progress < 0 || progress > 100) {
    return res.status(400).json({ error: 'Progress must be a number between 0 and 100' });
  }
  
  // Check if the user achievement exists
  const existingAward = await storage.getUserAchievement(userAchievementId);
  
  if (!existingAward) {
    return res.status(404).json({ error: 'User achievement not found' });
  }
  
  // Update the progress
  const updatedAward = await storage.updateUserAchievementProgress(
    userAchievementId,
    progress,
    metadata
  );
  
  res.json(updatedAward);
}));

// Seed achievements (admin only)
router.post('/seed', asyncHandler(async (req, res) => {
  // In a production app, check for admin role here
  if (!req.user || !(req.user as any).id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  await achievementService.seedAchievements();
  
  res.json({ status: 'success', message: 'Achievements seeded successfully' });
}));

export default router;