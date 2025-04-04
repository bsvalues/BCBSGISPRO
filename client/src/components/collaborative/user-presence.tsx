import React, { useState, useEffect } from 'react';
import { useEnhancedWebSocket } from '@/hooks/use-enhanced-websocket';
import { ConnectionStatusEnum } from '@/lib/websocket';
import { CollaborativeUser } from '@/lib/websocket-session-manager';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Users, Circle, Clock } from 'lucide-react';

/**
 * Props for the UserPresence component
 */
interface UserPresenceProps {
  roomId: string;
  userId?: string;
  username?: string;
  compact?: boolean;
  onUserSelected?: (user: CollaborativeUser) => void;
  onUserActivity?: (userId: string, lastActivity: number) => void;
  className?: string;
}

/**
 * Activity status thresholds in milliseconds
 */
const ACTIVITY_THRESHOLDS = {
  ACTIVE: 60000, // 1 minute
  IDLE: 300000,  // 5 minutes
  AWAY: 900000   // 15 minutes
};

/**
 * Get the activity status text based on last activity timestamp
 */
function getActivityStatus(lastActivity: number): 'active' | 'idle' | 'away' | 'offline' {
  const now = Date.now();
  const diff = now - lastActivity;
  
  if (diff < ACTIVITY_THRESHOLDS.ACTIVE) {
    return 'active';
  } else if (diff < ACTIVITY_THRESHOLDS.IDLE) {
    return 'idle';
  } else if (diff < ACTIVITY_THRESHOLDS.AWAY) {
    return 'away';
  } else {
    return 'offline';
  }
}

/**
 * Format time ago from a timestamp
 */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) {
    return 'just now';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
}

/**
 * Component for displaying user presence in a collaborative room
 */
export function UserPresence({
  roomId,
  userId,
  username,
  compact = false,
  onUserSelected,
  onUserActivity,
  className
}: UserPresenceProps) {
  // Use enhanced WebSocket hook
  const { roomUsers, status } = useEnhancedWebSocket({
    roomId,
    userId,
    username
  });
  
  // Track selected user
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Handle user activity updates
  useEffect(() => {
    if (!onUserActivity) return;
    
    const timer = setInterval(() => {
      roomUsers.forEach(user => {
        onUserActivity(user.id, user.lastActivity);
      });
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(timer);
  }, [roomUsers, onUserActivity]);
  
  // Handle user selection
  const handleUserClick = (user: CollaborativeUser) => {
    setSelectedUserId(user.id === selectedUserId ? null : user.id);
    if (onUserSelected) onUserSelected(user);
  };
  
  // Render activity status indicator
  const renderActivityIndicator = (lastActivity: number) => {
    const status = getActivityStatus(lastActivity);
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative h-2.5 w-2.5">
              <Circle 
                className={cn(
                  "h-2.5 w-2.5 absolute",
                  status === 'active' && "text-green-500 fill-green-500",
                  status === 'idle' && "text-yellow-500 fill-yellow-500",
                  status === 'away' && "text-orange-500 fill-orange-500",
                  status === 'offline' && "text-gray-500 fill-gray-500"
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col">
              <span>
                <span className="font-semibold">{status}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatTimeAgo(lastActivity)}
                </span>
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  // Render a compact view
  if (compact) {
    return (
      <div className={cn("flex flex-row items-center gap-1", className)}>
        {status === ConnectionStatusEnum.CONNECTED ? (
          <Badge className="rounded-full px-2 py-1 text-xs" variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {roomUsers.length}
          </Badge>
        ) : (
          <Badge className="rounded-full px-2 py-1 text-xs" variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Connecting...
          </Badge>
        )}
        <div className="flex -space-x-3">
          {roomUsers.slice(0, 5).map(user => (
            <TooltipProvider key={user.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {getActivityStatus(user.lastActivity)}
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {roomUsers.length > 5 && (
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-xs">
                +{roomUsers.length - 5}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    );
  }
  
  // Render full view
  return (
    <Card className={cn("border", className)}>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Online Users
          </span>
          <Badge variant="secondary" className="rounded-full">
            {roomUsers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        {roomUsers.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {status === ConnectionStatusEnum.CONNECTED
              ? "No users currently in this room"
              : "Connecting to room..."}
          </div>
        ) : (
          <ul className="space-y-2">
            {roomUsers.map(user => (
              <li 
                key={user.id} 
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                  selectedUserId === user.id ? "bg-muted" : "hover:bg-muted/50"
                )}
                onClick={() => handleUserClick(user)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {user.username}
                    </span>
                    {user.id === userId && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last activity: {formatTimeAgo(user.lastActivity)}
                  </div>
                </div>
                {renderActivityIndicator(user.lastActivity)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}