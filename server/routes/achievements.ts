import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { asyncHandler } from '../error-handler';
import { 
  insertAchievementSchema, 
  insertUserAchievementSchema,
  Achievement,
  UserAchievement
} from '../../shared/schema';

const router = express.Router();

// GET all achievements
router.get('/', asyncHandler(async (req, res) => {
  const achievements = await storage.getAllAchievements();
  res.json(achievements);
}));

// GET achievement by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const achievement = await storage.getAchievement(id);
  
  if (!achievement) {
    return res.status(404).json({ error: 'Achievement not found' });
  }
  
  res.json(achievement);
}));

// GET achievements by category
router.get('/category/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const achievements = await storage.getAchievementsByCategory(category);
  res.json(achievements);
}));

// GET achievements by type
router.get('/type/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const achievements = await storage.getAchievementsByType(type);
  res.json(achievements);
}));

// POST create a new achievement (admin only)
router.post('/', asyncHandler(async (req, res) => {
  const achievementData = insertAchievementSchema.parse(req.body);
  const newAchievement = await storage.createAchievement(achievementData);
  res.status(201).json(newAchievement);
}));

// PUT update an achievement (admin only)
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const achievementData = insertAchievementSchema.partial().parse(req.body);
  
  try {
    const updatedAchievement = await storage.updateAchievement(id, achievementData);
    res.json(updatedAchievement);
  } catch (error) {
    res.status(404).json({ error: 'Achievement not found' });
  }
}));

// DELETE an achievement (admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    await storage.deleteAchievement(id);
    res.status(204).end();
  } catch (error) {
    res.status(404).json({ error: 'Achievement not found' });
  }
}));

// GET all user achievements for a specific user
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const userAchievements = await storage.getUserAchievementsByUser(userId);
  
  // Fetch the full achievement data for each user achievement
  const achievementsWithDetails = await Promise.all(
    userAchievements.map(async (ua) => {
      const achievement = await storage.getAchievement(ua.achievementId);
      return {
        ...ua,
        achievement
      };
    })
  );
  
  res.json(achievementsWithDetails);
}));

// GET user's total achievement points
router.get('/user/:userId/points', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const points = await storage.getUserPoints(userId);
  res.json({ userId, points });
}));

// POST award an achievement to a user
router.post('/award', asyncHandler(async (req, res) => {
  const awardSchema = z.object({
    userId: z.number(),
    achievementId: z.number(),
    progress: z.number().min(0).max(100).default(100),
    metadata: z.any().optional()
  });
  
  const { userId, achievementId, progress, metadata } = awardSchema.parse(req.body);
  
  // Check if user already has this achievement
  const existingAward = await storage.getUserAchievementByUserAndAchievement(
    userId, 
    achievementId
  );
  
  if (existingAward) {
    // Update progress if the new progress is higher
    if (progress > existingAward.progress) {
      const updatedAward = await storage.updateUserAchievementProgress(
        existingAward.id,
        progress,
        metadata
      );
      return res.json(updatedAward);
    }
    
    // Return the existing award if no update needed
    return res.json(existingAward);
  }
  
  // Create a new user achievement
  const newAward = await storage.createUserAchievement({
    userId,
    achievementId,
    progress,
    metadata
  });
  
  res.status(201).json(newAward);
}));

// PUT update user achievement progress
router.put('/user-achievement/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const updateSchema = z.object({
    progress: z.number().min(0).max(100),
    metadata: z.any().optional()
  });
  
  const { progress, metadata } = updateSchema.parse(req.body);
  
  try {
    const updatedAward = await storage.updateUserAchievementProgress(id, progress, metadata);
    res.json(updatedAward);
  } catch (error) {
    res.status(404).json({ error: 'User achievement not found' });
  }
}));

// DELETE a user achievement (admin only)
router.delete('/user-achievement/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    await storage.deleteUserAchievement(id);
    res.status(204).end();
  } catch (error) {
    res.status(404).json({ error: 'User achievement not found' });
  }
}));

export default router;