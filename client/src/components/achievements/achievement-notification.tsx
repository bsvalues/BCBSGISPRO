import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Trophy, 
  Medal,
  Crown,
  Star,
  CheckCircle2,
  Shield,
  Timer,
  ClipboardCheck,
  Zap,
  ShieldCheck,
  X
} from 'lucide-react';
import { Toaster } from '../../components/ui/toaster';
import { useToast } from '../../hooks/use-toast';
import { Achievement } from '../../services/achievements-service';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose?: () => void;
}

export function AchievementToast({ achievement, onClose }: AchievementNotificationProps) {
  // Map of icon names to Lucide components
  const getIcon = (iconName: string) => {
    const iconProps = { className: 'h-6 w-6' };
    
    switch (iconName) {
      case 'Trophy': return <Trophy {...iconProps} />;
      case 'Medal': return <Medal {...iconProps} />;
      case 'Crown': return <Crown {...iconProps} />;
      case 'Star': return <Star {...iconProps} />;
      case 'CheckCircle': return <CheckCircle2 {...iconProps} />;
      case 'Timer': return <Timer {...iconProps} />;
      case 'Shield': return <Shield {...iconProps} />;
      case 'ClipboardCheck': return <ClipboardCheck {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      case 'ShieldCheck': return <ShieldCheck {...iconProps} />;
      case 'Upload': return <Award {...iconProps} />;
      default: return <Award {...iconProps} />;
    }
  };

  return (
    <div className="flex w-full flex-col items-center space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4 bg-card p-4 rounded-lg border shadow-md">
      <div 
        className="p-2 rounded-full" 
        style={{ backgroundColor: `${achievement.color}30` }}
      >
        <div
          className="flex items-center justify-center h-10 w-10 rounded-full"
          style={{ color: achievement.color }}
        >
          {getIcon(achievement.icon)}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold text-foreground">Achievement Unlocked!</h4>
            <h5 className="font-medium">{achievement.name}</h5>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
          </div>
          <div className="flex items-start ml-2">
            <div className="bg-primary/10 text-primary font-medium px-2 py-1 rounded-full text-xs">
              +{achievement.points} pts
            </div>
            {onClose && (
              <button 
                onClick={onClose} 
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom hook to show achievement notifications
export function useAchievementNotification() {
  const { toast } = useToast();

  const showAchievementNotification = (achievement: Achievement) => {
    toast({
      title: "Achievement Unlocked!",
      description: (
        <AchievementToast achievement={achievement} />
      ),
      duration: 5000,
    });
  };

  return { showAchievementNotification };
}

// Achievement notification listener component
// This can be used in layout components to listen for achievement events
export function AchievementNotificationListener() {
  const { showAchievementNotification } = useAchievementNotification();
  
  useEffect(() => {
    // Setup event listener for achievement unlocked events
    const handleAchievementUnlocked = (event: CustomEvent<Achievement>) => {
      showAchievementNotification(event.detail);
    };

    // Add event listener (using any because custom events have tricky typing)
    window.addEventListener('achievement-unlocked' as any, handleAchievementUnlocked as any);
    
    // Clean up
    return () => {
      window.removeEventListener('achievement-unlocked' as any, handleAchievementUnlocked as any);
    };
  }, [showAchievementNotification]);

  return <Toaster />;
}

// Helper function to dispatch achievement unlocked events
export function dispatchAchievementUnlocked(achievement: Achievement) {
  const event = new CustomEvent('achievement-unlocked', { 
    detail: achievement 
  });
  window.dispatchEvent(event);
}