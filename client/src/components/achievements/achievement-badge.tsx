import React from 'react';
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
  ShieldCheck 
} from 'lucide-react';
import { Achievement, UserAchievement } from '../../services/achievements-service';
import { cn } from '../../lib/utils';

interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  userAchievement?: UserAchievement;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
}

export function AchievementBadge({ 
  achievement, 
  earned = false, 
  userAchievement,
  size = 'md', 
  showDetails = false,
  onClick
}: AchievementBadgeProps) {
  // Map of icon names to Lucide components
  const getIcon = (iconName: string) => {
    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    };
    
    const iconProps = { className: iconSizes[size] };
    
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

  // Get the size classes
  const getBadgeSize = () => {
    switch (size) {
      case 'sm': return 'h-10 w-10';
      case 'lg': return 'h-20 w-20';
      case 'md':
      default: return 'h-16 w-16';
    }
  };

  // Get the opacity for locked achievements
  const getOpacityClass = () => {
    return earned ? 'opacity-100' : 'opacity-40';
  };

  // Calculate progress percentage if available
  const progressPercentage = userAchievement?.progress ?? 0;

  return (
    <div 
      className={cn(
        "flex flex-col items-center",
        onClick ? "cursor-pointer" : "",
        size === 'lg' ? "gap-3" : "gap-2"
      )}
      onClick={onClick}
    >
      <div 
        className={cn(
          "relative rounded-full flex items-center justify-center",
          getBadgeSize(),
          earned ? "" : "grayscale",
          getOpacityClass()
        )}
        style={{ 
          backgroundColor: earned ? `${achievement.color}15` : '#f0f0f0',
          border: earned ? `2px solid ${achievement.color}` : '2px solid #d0d0d0'
        }}
      >
        {/* Progress indicator (circular) for badges with progress */}
        {userAchievement && userAchievement.progress !== undefined && userAchievement.progress < 100 && (
          <svg className="absolute inset-0" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#e6e6e6"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={achievement.color}
              strokeWidth="8"
              strokeDasharray={`${progressPercentage * 2.89} 289`}
              strokeLinecap="round"
              transform="rotate(-90, 50, 50)"
            />
          </svg>
        )}
        
        {/* Icon */}
        <div style={{ color: earned ? achievement.color : '#a0a0a0' }}>
          {getIcon(achievement.icon)}
        </div>
      </div>
      
      {/* Name and details */}
      {showDetails && (
        <div className="text-center">
          <h4 className={cn(
            "font-semibold",
            size === 'sm' ? "text-xs" : size === 'lg' ? "text-base" : "text-sm"
          )}>
            {achievement.name}
          </h4>
          
          {size !== 'sm' && (
            <p className="text-xs text-muted-foreground">
              {earned ? (
                <>Earned {userAchievement?.earnedAt ? new Date(userAchievement.earnedAt).toLocaleDateString() : ''}</>
              ) : (
                <>{achievement.criteria}</>
              )}
            </p>
          )}
          
          {/* Points badge */}
          {size !== 'sm' && (
            <div className="mt-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {achievement.points} points
            </div>
          )}
        </div>
      )}
    </div>
  );
}