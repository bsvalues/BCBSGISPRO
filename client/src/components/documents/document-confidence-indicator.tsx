import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DocumentConfidenceIndicatorProps {
  confidence?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DocumentConfidenceIndicator({
  confidence,
  showLabel = false,
  showPercentage = true,
  size = 'md',
  className
}: DocumentConfidenceIndicatorProps) {
  // If confidence is undefined, show N/A
  if (confidence === undefined) {
    return (
      <div 
        className={cn(
          'flex items-center space-x-2', 
          className
        )}
      >
        <div 
          className="bg-gray-300 dark:bg-gray-600 text-white text-xs font-medium rounded-full px-2 py-0.5 flex items-center"
          data-testid="confidence-indicator"
        >
          N/A
        </div>
        {showLabel && (
          <span className="text-xs text-gray-500">Not classified</span>
        )}
      </div>
    );
  }
  
  // Convert confidence (0-1) to percentage (0-100)
  const percentage = Math.round(confidence * 100);
  
  // Determine confidence level for styling
  const isHigh = percentage >= 80;
  const isMedium = percentage >= 60 && percentage < 80;
  const isLow = percentage < 60;
  
  // Get appropriate colors based on confidence level
  const getStatusColor = () => {
    if (isHigh) return 'bg-green-500 dark:bg-green-600';
    if (isMedium) return 'bg-yellow-500 dark:bg-yellow-600';
    return 'bg-red-500 dark:bg-red-600';
  };
  
  // Get appropriate icon based on confidence level
  const StatusIcon = () => {
    if (isHigh) return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (isMedium) return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
    return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
  };
  
  // Get appropriate label text based on confidence level
  const getStatusLabel = () => {
    if (isHigh) return 'High confidence';
    if (isMedium) return 'Medium confidence';
    return 'Low confidence';
  };

  // Determine size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5 w-16';
      case 'lg':
        return 'h-3 w-32';
      case 'md':
      default:
        return 'h-2 w-24';
    }
  };

  // Get indicator style based on confidence level
  const getIndicatorStyle = () => {
    if (isHigh) return 'bg-green-500';
    if (isMedium) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              'flex items-center space-x-2',
              className
            )}
          >
            <div 
              className={cn(
                'text-xs font-medium text-white rounded-full px-2 py-0.5 flex items-center',
                getStatusColor()
              )}
              data-testid="confidence-indicator"
            >
              {showPercentage ? `${percentage}%` : <StatusIcon />}
            </div>
            
            {showLabel && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {getStatusLabel()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 p-1">
            <div className="flex items-center space-x-2">
              <StatusIcon />
              <span>{getStatusLabel()}</span>
            </div>
            
            {/* Custom styled progress with appropriate confidence level color */}
            <div className={cn('relative overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700', getSizeClasses())}>
              <div 
                className={cn('h-full transition-all', getIndicatorStyle())}
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500">
              {isHigh && 'Classification is highly reliable'}
              {isMedium && 'Classification is probably correct but may need review'}
              {isLow && 'Classification is uncertain and needs manual verification'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}