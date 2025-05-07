import React from 'react';
import { Achievement, UserAchievement } from '../../services/achievements-service';
import { Award, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/tooltip';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

// Dynamic icon import from Lucide icons
import * as LucideIcons from 'lucide-react';

export type AchievementBadgeSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  userAchievement?: UserAchievement;
  showDetails?: boolean;
  size?: AchievementBadgeSize;
  className?: string;
  onClick?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  earned = false,
  userAchievement,
  showDetails = false,
  size = 'md',
  className,
  onClick
}) => {
  // Get the progress if available
  const progress = userAchievement?.progress || 0;
  
  // Dynamic icon component based on the achievement's icon property
  const IconComponent = (LucideIcons as any)[achievement.icon] || Award;
  
  // Size classes
  const sizeClasses = {
    sm: {
      badge: 'h-16 w-16',
      icon: 'h-8 w-8',
      text: 'text-xs',
      details: 'text-xs max-w-[150px]'
    },
    md: {
      badge: 'h-20 w-20',
      icon: 'h-10 w-10',
      text: 'text-sm',
      details: 'text-sm max-w-[200px]'
    },
    lg: {
      badge: 'h-24 w-24',
      icon: 'h-12 w-12',
      text: 'text-base',
      details: 'text-base max-w-[250px]'
    },
    xl: {
      badge: 'h-32 w-32',
      icon: 'h-16 w-16',
      text: 'text-lg',
      details: 'text-lg max-w-[300px]'
    }
  };
  
  // Create tooltip content
  const tooltipContent = (
    <div className="space-y-2 p-1">
      <div className="font-semibold">{achievement.name}</div>
      <div className="text-xs text-muted-foreground">{achievement.description}</div>
      {!earned && (
        <div className="text-xs font-semibold">
          <span className="text-muted-foreground">Criteria: </span>
          {achievement.criteria}
        </div>
      )}
      {userAchievement && progress < 100 && (
        <div className="text-xs">
          <div className="flex justify-between mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}
      {userAchievement && progress === 100 && (
        <div className="text-xs text-muted-foreground">
          Earned on {format(new Date(userAchievement.earnedAt), 'PPP')}
        </div>
      )}
      <div className="text-xs flex items-center mt-1">
        <Badge variant="outline" className="flex gap-1 items-center">
          <Award className="h-3 w-3" />
          <span>{achievement.points} points</span>
        </Badge>
      </div>
    </div>
  );

  // Render the badge
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              'relative flex flex-col items-center',
              className,
              { 'cursor-pointer': !!onClick }
            )}
            onClick={onClick}
          >
            <div 
              className={cn(
                'relative rounded-full flex items-center justify-center',
                sizeClasses[size].badge,
                earned 
                  ? 'bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/50'
                  : 'bg-muted border-2 border-muted-foreground/10'
              )}
              style={{
                boxShadow: earned ? `0 0 15px ${achievement.color}40` : 'none',
              }}
            >
              <IconComponent 
                className={cn(
                  sizeClasses[size].icon,
                  earned ? 'text-primary' : 'text-muted-foreground/50'
                )}
                style={{
                  color: earned ? achievement.color : undefined
                }}
              />
              
              {earned && (
                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}
              
              {!earned && userAchievement && progress > 0 && progress < 100 && (
                <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
              
              {!earned && !userAchievement && (
                <div className="absolute -top-1 -right-1 bg-muted-foreground/30 text-white rounded-full p-0.5">
                  <Lock className="h-4 w-4" />
                </div>
              )}
              
              {userAchievement && progress < 100 && (
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 h-4 flex items-center justify-center">
                  <div className="w-full px-1">
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </div>
              )}
            </div>
            
            {showDetails && (
              <div className={cn('mt-2 text-center', sizeClasses[size].text)}>
                <div className="font-semibold truncate max-w-full">
                  {achievement.name}
                </div>
                {earned && (
                  <div className="text-xs text-primary font-medium">
                    {achievement.points} points
                  </div>
                )}
                {!earned && (
                  <div className="text-xs text-muted-foreground">
                    {achievement.points} points
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};