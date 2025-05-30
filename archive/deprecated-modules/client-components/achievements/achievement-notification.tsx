import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Achievement, UserAchievement } from '../../services/achievements-service';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { cn } from '../../lib/utils';

// Custom hook for WebSocket connection
export const useAchievementWebSocket = (userId: number | string | null) => {
  const [lastAchievement, setLastAchievement] = useState<{
    achievement: Achievement;
    userAchievement: UserAchievement;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      // Subscribe to achievements for this user
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: `user-achievements-${userId}`
      }));
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'achievement-earned') {
          setLastAchievement({
            achievement: data.achievement,
            userAchievement: data.userAchievement
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    // Handle errors
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, [userId]);

  return lastAchievement;
};

export const AchievementNotificationListener: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id || null;
  const lastAchievement = useAchievementWebSocket(userId);

  useEffect(() => {
    if (lastAchievement) {
      const { achievement, userAchievement } = lastAchievement;
      
      // Get the icon component
      const IconComponent = (LucideIcons as any)[achievement.icon] || Award;
      
      // Show the toast
      toast({
        title: 'Achievement Unlocked!',
        description: (
          <div className="flex items-start gap-3">
            <div 
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: `${achievement.color}25` }}
            >
              <IconComponent className="w-6 h-6" style={{ color: achievement.color }} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-base">{achievement.name}</div>
              <div className="text-sm text-muted-foreground">{achievement.description}</div>
              <div className="mt-1">
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                  "bg-primary/10 text-primary"
                )}>
                  +{achievement.points} points
                </span>
              </div>
            </div>
          </div>
        ),
        action: (
          <span className="text-xs text-muted-foreground inline-block mt-1">
            View all achievements in your profile
          </span>
        ),
        duration: 8000, // Show for 8 seconds
        variant: "success"
      });
    }
  }, [lastAchievement, toast]);

  return null; // This component doesn't render anything
};

// Standalone component to show an achievement notification programmatically
export interface AchievementNotificationProps {
  achievement: Achievement;
  userAchievement: UserAchievement;
}

export const showAchievementNotification = (
  props: AchievementNotificationProps, 
  toastFunction: any
) => {
  const { achievement, userAchievement } = props;
  
  // Get the icon component
  const IconComponent = (LucideIcons as any)[achievement.icon] || Award;
  
  // Show the toast
  toastFunction({
    title: 'Achievement Unlocked!',
    description: (
      <div className="flex items-start gap-3">
        <div 
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" 
          style={{ backgroundColor: `${achievement.color}25` }}
        >
          <IconComponent className="w-6 h-6" style={{ color: achievement.color }} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-base">{achievement.name}</div>
          <div className="text-sm text-muted-foreground">{achievement.description}</div>
          <div className="mt-1">
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
              "bg-primary/10 text-primary"
            )}>
              +{achievement.points} points
            </span>
          </div>
        </div>
      </div>
    ),
    action: (
      <span className="text-xs text-muted-foreground inline-block mt-1">
        View all achievements in your profile
      </span>
    ),
    duration: 8000, // Show for 8 seconds
    variant: "success"
  });
};