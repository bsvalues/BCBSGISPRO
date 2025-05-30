import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Award, 
  ChevronUp,
  ChevronDown,
  Filter,
  Star,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  getAllAchievements, 
  getUserAchievements,
  getUserPoints,
  type Achievement
} from '../../services/achievements-service';
import { UserAchievements } from './user-achievements';
import { AchievementBadge } from './achievement-badge';

interface AchievementsDashboardProps {
  userId: number;
}

export function AchievementsDashboard({ userId }: AchievementsDashboardProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  const { data: allAchievements, isLoading: loadingAchievements } = useQuery({
    queryKey: ['/api/achievements'],
    queryFn: () => getAllAchievements()
  });

  const { data: userAchievements, isLoading: loadingUserAchievements } = useQuery({
    queryKey: ['/api/achievements/user', userId],
    queryFn: () => getUserAchievements(userId)
  });

  const { data: pointsData, isLoading: loadingPoints } = useQuery({
    queryKey: ['/api/achievements/user/points', userId],
    queryFn: () => getUserPoints(userId)
  });

  const isLoading = loadingAchievements || loadingUserAchievements || loadingPoints;

  // Calculate available categories
  const categories = allAchievements 
    ? [...new Set(allAchievements.map(a => a.category))]
    : [];

  // Filter achievements by category
  const filteredAchievements = allAchievements 
    ? allAchievements.filter(a => categoryFilter === 'all' || a.category === categoryFilter)
    : [];
    
  // Get the achievements to display based on the showAll toggle
  const displayedAchievements = showAll 
    ? filteredAchievements
    : filteredAchievements.slice(0, 9);

  // Create a map of user achievements for quick lookup
  const userAchievementMap = new Map();
  if (userAchievements) {
    userAchievements.forEach(ua => {
      userAchievementMap.set(ua.achievementId, {
        earned: ua.progress === 100,
        progress: ua.progress
      });
    });
  }

  // Calculate stats
  const totalAchievements = allAchievements?.length || 0;
  const earnedAchievements = userAchievements?.filter(ua => ua.progress === 100).length || 0;
  const inProgressAchievements = userAchievements?.filter(ua => ua.progress < 100 && ua.progress > 0).length || 0;
  const completionPercentage = totalAchievements > 0 ? (earnedAchievements / totalAchievements) * 100 : 0;

  if (isLoading) {
    return <AchievementsDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        {/* Stats Cards */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <div className="text-3xl font-bold">{pointsData?.points || 0}</div>
              <Badge variant="outline" className="ml-2">
                Rank: {getPointsRank(pointsData?.points || 0)}
              </Badge>
            </div>
            <PointsProgressBar points={pointsData?.points || 0} />
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{earnedAchievements} / {totalAchievements}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {inProgressAchievements} in progress
                </div>
              </div>
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-lg font-bold">{Math.round(completionPercentage)}%</div>
                </div>
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e5e5"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40 * completionPercentage / 100} ${2 * Math.PI * 40 * (1 - completionPercentage / 100)}`}
                    className="text-primary"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Unlocks</CardTitle>
          </CardHeader>
          <CardContent>
            {userAchievements && userAchievements.length > 0 ? (
              <div className="flex space-x-2">
                {userAchievements
                  .filter(ua => ua.progress === 100)
                  .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
                  .slice(0, 3)
                  .map(ua => {
                    const achievement = allAchievements?.find(a => a.id === ua.achievementId);
                    return achievement ? (
                      <AchievementBadge 
                        key={ua.id}
                        achievement={achievement}
                        earned={true}
                        size="sm"
                      />
                    ) : null;
                  })}
                {earnedAchievements > 3 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <span className="text-xs font-medium">+{earnedAchievements - 3}</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-8 text-sm text-muted-foreground">
                No achievements unlocked yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Achievements Panel */}
        <div className="md:col-span-1">
          <UserAchievements userId={userId} />
        </div>

        {/* All Achievements Panel */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Achievement Collection</CardTitle>
                <CardDescription>
                  Complete tasks to unlock new achievements
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayedAchievements.map(achievement => {
                const userAchievement = userAchievementMap.get(achievement.id);
                return (
                  <div key={achievement.id} className="flex flex-col items-center">
                    <AchievementBadge 
                      achievement={achievement}
                      earned={userAchievement?.earned || false}
                      progress={userAchievement?.progress || 0}
                      size="md"
                    />
                    <div className="mt-2 text-center">
                      <div className="text-xs font-medium truncate w-full" title={achievement.name}>
                        {achievement.name}
                      </div>
                      <div className="text-xxs text-muted-foreground">
                        {achievement.points} pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredAchievements.length > 9 && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      Show Less <ChevronUp className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show All {filteredAchievements.length} Achievements <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PointsProgressBar({ points }: { points: number }) {
  // Define tier thresholds
  const tiers = [
    { name: 'Bronze', threshold: 0, color: '#CD7F32' },
    { name: 'Silver', threshold: 100, color: '#C0C0C0' },
    { name: 'Gold', threshold: 300, color: '#FFD700' },
    { name: 'Platinum', threshold: 600, color: '#E5E4E2' },
    { name: 'Diamond', threshold: 1000, color: '#B9F2FF' },
  ];
  
  // Determine current tier
  let currentTier = tiers[0];
  let nextTier = tiers[1];
  
  for (let i = 1; i < tiers.length; i++) {
    if (points >= tiers[i].threshold) {
      currentTier = tiers[i];
      nextTier = tiers[i + 1] || null;
    } else {
      break;
    }
  }
  
  // Calculate progress to next tier
  const progress = nextTier 
    ? ((points - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100
    : 100;
  
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span>{currentTier.name}</span>
        {nextTier && <span>{nextTier.name}: {nextTier.threshold - points} more</span>}
      </div>
      <Progress 
        value={progress} 
        className="h-2"
        style={{ backgroundColor: `${currentTier.color}30`, '--progress-fill': currentTier.color } as any}
      />
    </div>
  );
}

function getPointsRank(points: number): string {
  if (points >= 1000) return 'Diamond';
  if (points >= 600) return 'Platinum';
  if (points >= 300) return 'Gold';
  if (points >= 100) return 'Silver';
  return 'Bronze';
}

function AchievementsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="flex-1">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-9 w-28" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array(15).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-3 w-16 mt-2" />
                  <Skeleton className="h-2 w-10 mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}