/**
 * Achievement Service
 * 
 * This service manages the achievement system, including tracking achievement progress
 * and awarding achievements based on user actions.
 */

import { storage } from '../storage';
import { logger } from '../logger';
import { 
  Achievement, 
  UserAchievement,
  InsertUserAchievement
} from '../../shared/schema';

export class AchievementService {
  /**
   * Awards an achievement to a user if they don't already have it
   */
  async awardAchievement(
    userId: number, 
    achievementName: string, 
    progress: number = 100,
    metadata?: any
  ): Promise<UserAchievement | null> {
    try {
      // Get the achievement by name
      const achievement = await storage.getAchievementByName(achievementName);
      
      if (!achievement) {
        logger.warn(`Achievement not found: ${achievementName}`);
        return null;
      }
      
      // Check if user already has this achievement
      const existingAward = await storage.getUserAchievementByUserAndAchievement(
        userId, 
        achievement.id
      );
      
      if (existingAward) {
        // If the new progress is higher, update it
        if (progress > existingAward.progress) {
          const updatedAward = await storage.updateUserAchievementProgress(
            existingAward.id,
            progress,
            metadata
          );
          
          logger.info(`Updated achievement progress for user ${userId}: ${achievementName} (${progress}%)`);
          
          return updatedAward;
        }
        
        // Otherwise, return the existing award
        return existingAward;
      }
      
      // Create a new user achievement
      const newAward = await storage.createUserAchievement({
        userId,
        achievementId: achievement.id,
        progress,
        metadata
      });
      
      logger.info(`Awarded achievement to user ${userId}: ${achievementName}`);
      
      return newAward;
    } catch (error) {
      logger.error(`Error awarding achievement: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Tracks progress for a particular achievement
   */
  async trackProgress(
    userId: number, 
    achievementName: string, 
    progressIncrement: number,
    metadata?: any
  ): Promise<UserAchievement | null> {
    try {
      // Get the achievement by name
      const achievement = await storage.getAchievementByName(achievementName);
      
      if (!achievement) {
        logger.warn(`Achievement not found: ${achievementName}`);
        return null;
      }
      
      // Check if user already has this achievement
      const existingAward = await storage.getUserAchievementByUserAndAchievement(
        userId, 
        achievement.id
      );
      
      if (existingAward) {
        // Calculate new progress, making sure it doesn't exceed 100%
        const newProgress = Math.min(100, existingAward.progress + progressIncrement);
        
        // If progress has changed, update it
        if (newProgress > existingAward.progress) {
          const updatedAward = await storage.updateUserAchievementProgress(
            existingAward.id,
            newProgress,
            metadata
          );
          
          logger.info(`Updated achievement progress for user ${userId}: ${achievementName} (${newProgress}%)`);
          
          return updatedAward;
        }
        
        // Otherwise, return the existing award
        return existingAward;
      }
      
      // Create a new user achievement with initial progress
      const initialProgress = Math.min(100, progressIncrement);
      const newAward = await storage.createUserAchievement({
        userId,
        achievementId: achievement.id,
        progress: initialProgress,
        metadata
      });
      
      logger.info(`Started tracking achievement for user ${userId}: ${achievementName} (${initialProgress}%)`);
      
      return newAward;
    } catch (error) {
      logger.error(`Error tracking achievement progress: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Checks if a user has completed an achievement
   */
  async hasAchievement(userId: number, achievementName: string): Promise<boolean> {
    try {
      // Get the achievement by name
      const achievement = await storage.getAchievementByName(achievementName);
      
      if (!achievement) {
        return false;
      }
      
      // Check if user has this achievement
      const userAchievement = await storage.getUserAchievementByUserAndAchievement(
        userId, 
        achievement.id
      );
      
      // User has completed the achievement if progress is 100%
      return userAchievement?.progress === 100;
    } catch (error) {
      logger.error(`Error checking achievement: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Handles a sync workflow milestone event
   */
  async handleSyncMilestone(userId: number, milestoneType: string, workflowData: any): Promise<void> {
    switch (milestoneType) {
      case 'upload_first_file':
        await this.awardAchievement(userId, 'First Upload', 100, { timestamp: new Date() });
        break;
        
      case 'approve_first_file':
        await this.awardAchievement(userId, 'First Approval', 100, { 
          filename: workflowData.filename,
          timestamp: new Date() 
        });
        break;
        
      case 'processing_streak':
        // For a streak achievement, track incremental progress
        if (workflowData.streak >= 5) {
          await this.awardAchievement(userId, 'Processing Streak', 100, { 
            streak: workflowData.streak,
            timestamp: new Date() 
          });
        } else {
          // Calculate progress percentage (e.g., 3 out of 5 = 60%)
          const progress = Math.min(100, (workflowData.streak / 5) * 100);
          await this.trackProgress(userId, 'Processing Streak', progress, {
            streak: workflowData.streak,
            timestamp: new Date()
          });
        }
        break;
        
      case 'validation_master':
        await this.awardAchievement(userId, 'Validation Master', 100, {
          validations: workflowData.validations,
          timestamp: new Date()
        });
        break;
        
      case 'data_champion':
        await this.awardAchievement(userId, 'Data Champion', 100, {
          processedFiles: workflowData.processedFiles,
          timestamp: new Date()
        });
        break;
        
      case 'lightning_fast':
        await this.awardAchievement(userId, 'Lightning Fast', 100, {
          processingTime: workflowData.processingTime,
          timestamp: new Date()
        });
        break;
    }
  }
  
  /**
   * Seeds initial achievements into the database
   */
  async seedAchievements(): Promise<void> {
    try {
      const existingAchievements = await storage.getAllAchievements();
      
      if (existingAchievements.length > 0) {
        logger.info(`${existingAchievements.length} achievements already exist, skipping seed`);
        return;
      }
      
      // Define initial achievements
      const initialAchievements = [
        {
          name: 'First Upload',
          description: 'Successfully uploaded your first property data file',
          category: 'sync',
          type: 'milestone',
          points: 10,
          icon: 'Upload',
          color: '#4CAF50',
          criteria: 'Upload a property data file to the system',
          sortOrder: 10
        },
        {
          name: 'First Approval',
          description: 'Approved your first property data file for sync',
          category: 'sync',
          type: 'milestone',
          points: 20,
          icon: 'CheckCircle',
          color: '#2196F3',
          criteria: 'Approve a property data file for synchronization',
          sortOrder: 20
        },
        {
          name: 'Processing Streak',
          description: 'Processed 5 files in a single day',
          category: 'sync',
          type: 'streak',
          points: 50,
          icon: 'Zap',
          color: '#FFC107',
          criteria: 'Process 5 property data files in a 24-hour period',
          sortOrder: 30
        },
        {
          name: 'Validation Master',
          description: 'Successfully resolved 10 validation issues',
          category: 'sync',
          type: 'skill',
          points: 75,
          icon: 'ShieldCheck',
          color: '#9C27B0',
          criteria: 'Resolve 10 or more validation issues in property data files',
          sortOrder: 40
        },
        {
          name: 'Data Champion',
          description: 'Processed over 1,000 property records',
          category: 'sync',
          type: 'milestone',
          points: 100,
          icon: 'Trophy',
          color: '#F44336',
          criteria: 'Process property data files containing at least 1,000 records',
          sortOrder: 50
        },
        {
          name: 'Lightning Fast',
          description: 'Processed a file in under 30 seconds',
          category: 'sync',
          type: 'skill',
          points: 25,
          icon: 'Timer',
          color: '#FF9800',
          criteria: 'Upload, validate, and approve a file within 30 seconds',
          sortOrder: 60
        },
        {
          name: 'Perfect Compliance',
          description: 'Maintained 100% ICSF compliance for 30 days',
          category: 'compliance',
          type: 'streak',
          points: 150,
          icon: 'Shield',
          color: '#3F51B5',
          criteria: 'Maintain perfect ICSF compliance scores for 30 consecutive days',
          sortOrder: 70
        },
        {
          name: 'Audit Ready',
          description: 'Prepared all required documentation for an audit period',
          category: 'compliance',
          type: 'milestone',
          points: 200,
          icon: 'ClipboardCheck',
          color: '#607D8B',
          criteria: 'Complete all required documentation for a monthly audit period',
          sortOrder: 80
        }
      ];
      
      // Create each achievement
      for (const achievement of initialAchievements) {
        await storage.createAchievement(achievement);
      }
      
      logger.info(`Seeded ${initialAchievements.length} achievements`);
    } catch (error) {
      logger.error(`Error seeding achievements: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Create and export a singleton instance
export const achievementService = new AchievementService();