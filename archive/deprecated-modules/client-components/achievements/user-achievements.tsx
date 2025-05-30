import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AchievementProgress, getUserAchievementProgress } from '../../services/achievements-service';

interface UserAchievementsProps {
  userId: number;
}

export function UserAchievements({ userId }: UserAchievementsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/achievements/progress', userId],
    queryFn: () => getUserAchievementProgress(userId)
  });

  // Map of icon names to Lucide components
  const iconMap: Record<string, React.ReactNode> = {
    'Award': <Award className="h-6 w-6" />,
    'Trophy': <Trophy className="h-6 w-6" />,
    'Medal': <Medal className="h-6 w-6" />,
    'Crown': <Crown className="h-6 w-6" />,
    'Star': <Star className="h-6 w-6" />,
    'CheckCircle': <CheckCircle2 className="h-6 w-6" />,
    'Timer': <Timer className="h-6 w-6" />,
    'Shield': <Shield className="h-6 w-6" />,
    'ClipboardCheck': <ClipboardCheck className="h-6 w-6" />,
    'Zap': <Zap className="h-6 w-6" />,
    'ShieldCheck': <ShieldCheck className="h-6 w-6" />,
    'Upload': <Award className="h-6 w-6" />,
  };

  if (isLoading) {
    return <AchievementsLoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There was an error loading your achievements. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Achievements Yet</CardTitle>
          <CardDescription>
            Complete workflow milestones to earn achievements and points!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-6">
            <Award className="h-16 w-16 text-gray-300" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Achievements</CardTitle>
            <CardDescription>Track your progress and accomplishments</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{data.points}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent">
          <TabsList className="mb-4">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="all">All Achievements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent">
            <ScrollArea className="h-[300px]">
              {data.recentAchievements.length > 0 ? (
                <div className="space-y-4">
                  {data.recentAchievements.map((ua) => (
                    <AchievementCard 
                      key={ua.id} 
                      achievement={ua.achievement!} 
                      progress={ua.progress} 
                      earnedAt={new Date(ua.earnedAt)} 
                      iconMap={iconMap}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <Clock className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No recent achievements. Complete workflow tasks to earn new achievements!
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="all">
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {data.achievements.map((ua) => (
                  <AchievementCard 
                    key={ua.id} 
                    achievement={ua.achievement!} 
                    progress={ua.progress} 
                    earnedAt={new Date(ua.earnedAt)} 
                    iconMap={iconMap}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface AchievementCardProps {
  achievement: {
    name: string;
    description: string;
    category: string;
    type: string;
    points: number;
    icon: string;
    color: string;
  };
  progress: number;
  earnedAt: Date;
  iconMap: Record<string, React.ReactNode>;
}

function AchievementCard({ achievement, progress, earnedAt, iconMap }: AchievementCardProps) {
  const isCompleted = progress === 100;
  const formattedDate = isCompleted
    ? new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(earnedAt)
    : null;
  
  return (
    <div className="flex items-start space-x-4 p-4 rounded-lg border border-border bg-card-bg-alt hover:bg-accent/10 transition-colors">
      <div 
        className="p-2 rounded-full" 
        style={{ backgroundColor: `${achievement.color}30` }}
      >
        <div
          className="flex items-center justify-center h-8 w-8 rounded-full"
          style={{ color: achievement.color }}
        >
          {iconMap[achievement.icon] || <Award className="h-6 w-6" />}
        </div>
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{achievement.name}</h4>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
          </div>
          <Badge variant="outline">{achievement.points} pts</Badge>
        </div>
        
        {!isCompleted && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        
        <div className="mt-2 flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {achievement.category}
          </Badge>
          {isCompleted && formattedDate && (
            <span className="text-xs text-muted-foreground">
              Earned {formattedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AchievementsLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-[240px] mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}