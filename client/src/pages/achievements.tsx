import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ModernLayout } from '../components/layout/modern-layout';
import { AchievementBadge } from '../components/achievements/achievement-badge';
import { Achievement, UserAchievement, getAllAchievements, getUserAchievements, getUserAchievementStats } from '../services/achievements-service';
import { useAuth } from '../context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Award, Trophy, Medal } from 'lucide-react';
import { useTitle } from '../hooks/use-title';

export default function AchievementsPage() {
  useTitle('Achievements - BentonGeoPro');
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const userId = user?.id || 1; // Default to 1 for demo if no user found

  // Fetch all achievements
  const { data: achievements = [], isLoading: isLoadingAchievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => getAllAchievements(),
  });

  // Fetch user achievements
  const { data: userAchievements = [], isLoading: isLoadingUserAchievements } = useQuery({
    queryKey: ['userAchievements', userId],
    queryFn: () => getUserAchievements(userId),
    enabled: !!userId,
  });

  // Fetch user achievement stats
  const { data: achievementStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['achievementStats', userId],
    queryFn: () => getUserAchievementStats(userId),
    enabled: !!userId,
  });

  // Extract unique categories from achievements
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    achievements.forEach(achievement => {
      if (achievement.category) {
        uniqueCategories.add(achievement.category);
      }
    });
    return ['all', ...Array.from(uniqueCategories)];
  }, [achievements]);

  // Filter achievements by category
  const filteredAchievements = React.useMemo(() => {
    if (activeCategory === 'all') {
      return achievements;
    }
    return achievements.filter(achievement => achievement.category === activeCategory);
  }, [achievements, activeCategory]);

  // Create a map of earned achievements for quick lookup
  const earnedAchievementsMap = React.useMemo(() => {
    const map = new Map<number, UserAchievement>();
    userAchievements.forEach(ua => {
      map.set(ua.achievementId, ua);
    });
    return map;
  }, [userAchievements]);

  if (isLoadingAchievements || isLoadingUserAchievements || isLoadingStats) {
    return (
      <ModernLayout>
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Achievements</h1>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-pulse text-primary">
              <Award className="h-16 w-16" />
            </div>
          </div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Achievements</h1>
        
        {achievementStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard 
              title="Total Points" 
              value={achievementStats.totalPoints.toString()} 
              description="Achievement points earned"
              icon={<Trophy className="h-8 w-8 text-yellow-400" />}
            />
            <StatsCard 
              title="Progress" 
              value={`${Math.round((achievementStats.achievementsEarned / achievementStats.totalAchievements) * 100)}%`} 
              description={`${achievementStats.achievementsEarned} of ${achievementStats.totalAchievements} achievements`}
              progressValue={(achievementStats.achievementsEarned / achievementStats.totalAchievements) * 100}
              icon={<Medal className="h-8 w-8 text-blue-500" />}
            />
            <StatsCard 
              title="Top Category" 
              value={achievementStats.topCategory || "None"} 
              description="Your strongest area"
              icon={<Award className="h-8 w-8 text-purple-500" />}
            />
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Filter by Category</h2>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {categories.map(category => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  onClick={() => setActiveCategory(category)}
                  className="capitalize"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeCategory} className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredAchievements.map(achievement => {
                const userAchievement = earnedAchievementsMap.get(achievement.id);
                const earned = !!userAchievement;
                
                return (
                  <AchievementBadge 
                    key={achievement.id}
                    achievement={achievement}
                    earned={earned}
                    userAchievement={userAchievement}
                    showDetails={true}
                    size="lg"
                  />
                );
              })}
            </div>
            
            {filteredAchievements.length === 0 && (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                <p className="mt-4 text-muted-foreground">No achievements found in this category</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <Separator className="my-10" />
        
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Recently Earned</h2>
          
          {userAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userAchievements
                .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
                .slice(0, 4)
                .map(ua => {
                  const achievement = achievements.find(a => a.id === ua.achievementId);
                  if (!achievement) return null;
                  
                  return (
                    <Card key={ua.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div className="bg-primary/10 p-1.5 rounded-full">
                            <Award className="h-4 w-4 text-primary" />
                          </div>
                          {achievement.name}
                        </CardTitle>
                        <CardDescription>
                          Earned on {new Date(ua.earnedAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-between items-center">
                        <p className="text-sm">{achievement.description}</p>
                        <div className="bg-primary/10 text-primary font-medium px-2 py-1 rounded-full text-xs">
                          +{achievement.points}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <Award className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <p className="mt-4 text-muted-foreground">You haven't earned any achievements yet</p>
              <p className="text-sm text-muted-foreground">Complete tasks in the system to unlock achievements</p>
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  progressValue?: number;
  icon: React.ReactNode;
}

function StatsCard({ title, value, description, progressValue, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {progressValue !== undefined && (
          <Progress value={progressValue} className="h-2 mt-2" />
        )}
      </CardContent>
    </Card>
  );
}