import React from 'react';
import { 
  Award, 
  Trophy, 
  Medal,
  Crown,
  Star,
  Clock,
  CheckCircle2,
  Shield,
  Timer,
  ClipboardCheck,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Achievement } from '../../services/achievements-service';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  earned?: boolean;
  progress?: number;
}

export function AchievementBadge({ 
  achievement, 
  size = 'md', 
  showTooltip = true,
  earned = false,
  progress = 0
}: AchievementBadgeProps) {
  // Map of icon names to Lucide components
  const getIcon = (iconName: string, size: 'sm' | 'md' | 'lg') => {
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 24 : 32;
    const iconProps = { className: `h-${iconSize === 16 ? '4' : iconSize === 24 ? '6' : '8'} w-${iconSize === 16 ? '4' : iconSize === 24 ? '6' : '8'}` };
    
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

  const containerSizeClass = size === 'sm' 
    ? 'h-8 w-8' 
    : size === 'md' 
      ? 'h-12 w-12' 
      : 'h-16 w-16';

  const BadgeContent = (
    <div 
      className={`${containerSizeClass} rounded-full flex items-center justify-center relative`}
      style={{ 
        backgroundColor: earned ? `${achievement.color}30` : '#e5e5e5',
        color: earned ? achievement.color : '#a1a1a1',
        opacity: earned ? 1 : 0.7
      }}
    >
      {getIcon(achievement.icon, size)}
      
      {/* Progress ring (only for partial progress and when earned is false) */}
      {!earned && progress > 0 && (
        <svg 
          className="absolute inset-0" 
          viewBox="0 0 100 100"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={achievement.color}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45 * progress / 100} ${2 * Math.PI * 45 * (1 - progress / 100)}`}
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );

  if (!showTooltip) {
    return BadgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {BadgeContent}
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-center">
            <div className="font-medium">{achievement.name}</div>
            <div className="text-xs">{achievement.description}</div>
            {!earned && progress > 0 && (
              <div className="text-xs mt-1">Progress: {progress}%</div>
            )}
            <div className="text-xs mt-1 font-medium">{achievement.points} points</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}