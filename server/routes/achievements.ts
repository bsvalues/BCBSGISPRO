import { Router } from 'express';
import { storage } from '../storage';
import { insertAchievementSchema, insertUserAchievementSchema } from '../../shared/schema';
import { z } from 'zod';

// Create a router for achievement endpoints
const achievementsRouter = Router();

// Get all achievements
achievementsRouter.get('/', async (req, res) => {
  try {
    const achievements = await storage.getAllAchievements();
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Get achievement categories
achievementsRouter.get('/categories', async (req, res) => {
  try {
    const achievements = await storage.getAllAchievements();
    const categories = [...new Set(achievements.map(a => a.category))];
    res.json(categories);
  } catch (error) {
    console.error('Error fetching achievement categories:', error);
    res.status(500).json({ error: 'Failed to fetch achievement categories' });
  }
});

// Get achievements by category
achievementsRouter.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const achievements = await storage.getAchievementsByCategory(category);
    res.json(achievements);
  } catch (error) {
    console.error(`Error fetching achievements for category ${req.params.category}:`, error);
    res.status(500).json({ error: 'Failed to fetch achievements by category' });
  }
});

// Get achievements by type
achievementsRouter.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const achievements = await storage.getAchievementsByType(type);
    res.json(achievements);
  } catch (error) {
    console.error(`Error fetching achievements for type ${req.params.type}:`, error);
    res.status(500).json({ error: 'Failed to fetch achievements by type' });
  }
});

// Get a specific achievement by ID
achievementsRouter.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid achievement ID' });
    }

    const achievement = await storage.getAchievement(id);
    
    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    res.json(achievement);
  } catch (error) {
    console.error(`Error fetching achievement with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch achievement' });
  }
});

// Create a new achievement
achievementsRouter.post('/', async (req, res) => {
  try {
    const achievementData = insertAchievementSchema.parse(req.body);
    const newAchievement = await storage.createAchievement(achievementData);
    res.status(201).json(newAchievement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid achievement data', details: error.errors });
    }
    console.error('Error creating achievement:', error);
    res.status(500).json({ error: 'Failed to create achievement' });
  }
});

// Update an achievement
achievementsRouter.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid achievement ID' });
    }

    const achievement = await storage.getAchievement(id);
    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    const updateData = insertAchievementSchema.partial().parse(req.body);
    const updatedAchievement = await storage.updateAchievement(id, updateData);
    
    res.json(updatedAchievement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid achievement data', details: error.errors });
    }
    console.error(`Error updating achievement with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update achievement' });
  }
});

// Delete an achievement
achievementsRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid achievement ID' });
    }

    const achievement = await storage.getAchievement(id);
    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    await storage.deleteAchievement(id);
    res.json({ success: true, message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error(`Error deleting achievement with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete achievement' });
  }
});

// USER ACHIEVEMENTS ROUTES

// Get user achievements by user ID
achievementsRouter.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user achievements with joined achievement details
    const userAchievements = await storage.getUserAchievementsByUser(userId);
    
    // Fetch full achievement details for each user achievement
    const enrichedUserAchievements = await Promise.all(
      userAchievements.map(async (ua) => {
        const achievement = await storage.getAchievement(ua.achievementId);
        return {
          ...ua,
          achievement
        };
      })
    );
    
    res.json(enrichedUserAchievements);
  } catch (error) {
    console.error(`Error fetching achievements for user ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

// Award an achievement to a user
achievementsRouter.post('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate the request body
    const { achievementId, progress = 100 } = req.body;
    
    if (!achievementId) {
      return res.status(400).json({ error: 'Achievement ID is required' });
    }

    const achievementIdNum = parseInt(achievementId);
    if (isNaN(achievementIdNum)) {
      return res.status(400).json({ error: 'Invalid achievement ID' });
    }

    const achievement = await storage.getAchievement(achievementIdNum);
    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    // Check if the user already has this achievement
    const existingUserAchievement = await storage.getUserAchievementByUserAndAchievement(userId, achievementIdNum);
    
    if (existingUserAchievement) {
      // Update progress if it's higher than the current progress
      if (progress > existingUserAchievement.progress) {
        const updatedUserAchievement = await storage.updateUserAchievementProgress(
          existingUserAchievement.id, 
          progress
        );
        
        const fullAchievement = await storage.getAchievement(updatedUserAchievement.achievementId);
        
        return res.json({
          ...updatedUserAchievement,
          achievement: fullAchievement
        });
      }
      
      // Return the existing achievement without changes
      return res.json({
        ...existingUserAchievement,
        achievement
      });
    }

    // Create a new user achievement
    const newUserAchievement = await storage.createUserAchievement({
      userId,
      achievementId: achievementIdNum,
      progress
    });

    // Prepare response data
    const responseData = {
      ...newUserAchievement,
      achievement
    };

    // Broadcast achievement notification via WebSocket
    try {
      const { broadcastAchievement } = await import('../websocket');
      broadcastAchievement(userId, achievement, newUserAchievement);
    } catch (error) {
      console.error('Failed to broadcast achievement notification:', error);
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error(`Error awarding achievement to user ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to award achievement' });
  }
});

// Update achievement progress for a user
achievementsRouter.put('/user/:userId/achievement/:achievementId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const achievementId = parseInt(req.params.achievementId);
    
    if (isNaN(userId) || isNaN(achievementId)) {
      return res.status(400).json({ error: 'Invalid user ID or achievement ID' });
    }

    const { progress, metadata } = req.body;
    
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be a number between 0 and 100' });
    }

    // Check if the user achievement exists
    const userAchievement = await storage.getUserAchievementByUserAndAchievement(userId, achievementId);
    
    if (!userAchievement) {
      return res.status(404).json({ error: 'User achievement not found' });
    }

    // Update the progress
    const updatedUserAchievement = await storage.updateUserAchievementProgress(
      userAchievement.id,
      progress,
      metadata
    );

    // Get the full achievement details
    const achievement = await storage.getAchievement(achievementId);
    
    const responseData = {
      ...updatedUserAchievement,
      achievement
    };

    // If progress reached 100%, broadcast achievement notification via WebSocket
    if (progress === 100 && userAchievement.progress < 100) {
      try {
        const { broadcastAchievement } = await import('../websocket');
        broadcastAchievement(userId, achievement, updatedUserAchievement);
      } catch (error) {
        console.error('Failed to broadcast achievement notification:', error);
      }
    }
    
    res.json(responseData);
  } catch (error) {
    console.error(`Error updating achievement progress for user ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to update achievement progress' });
  }
});

// Get achievement statistics for a user
achievementsRouter.get('/user/:userId/stats', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user achievements
    const userAchievements = await storage.getUserAchievementsByUser(userId);
    
    // Get all achievements for total count
    const allAchievements = await storage.getAllAchievements();
    
    // Calculate total points earned
    const totalPoints = await storage.getUserPoints(userId);
    
    // Count achievements earned (with 100% progress)
    const achievementsEarned = userAchievements.filter(ua => ua.progress === 100).length;
    
    // Get achievement categories and count achievements per category
    const categories = [...new Set(allAchievements.map(a => a.category))];
    const categoryAchievementCounts: Record<string, number> = {};
    
    // Count earned achievements by category
    for (const ua of userAchievements) {
      if (ua.progress === 100) {
        const achievement = await storage.getAchievement(ua.achievementId);
        if (achievement) {
          categoryAchievementCounts[achievement.category] = 
            (categoryAchievementCounts[achievement.category] || 0) + 1;
        }
      }
    }
    
    // Find the top category (with most achievements earned)
    let topCategory = '';
    let maxCount = 0;
    
    for (const [category, count] of Object.entries(categoryAchievementCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    }
    
    res.json({
      totalPoints,
      achievementsEarned,
      totalAchievements: allAchievements.length,
      topCategory,
      categories: Object.keys(categoryAchievementCounts).map(category => ({
        name: category,
        count: categoryAchievementCounts[category]
      }))
    });
  } catch (error) {
    console.error(`Error fetching achievement stats for user ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to fetch achievement statistics' });
  }
});

export default achievementsRouter;