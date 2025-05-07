import { useEffect, useState } from 'react';
import { Award, Trophy, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AchievementsDashboard } from '../components/achievements/achievements-dashboard';

export default function AchievementsPage() {
  // In a real application, this would come from auth context
  // For demo purposes, we're using a hardcoded user ID
  const userId = 1;
  const [showInfo, setShowInfo] = useState(true);

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">
            Earn achievements by completing workflow milestones
          </p>
        </div>
        <div className="hidden md:flex">
          <Button variant="secondary" size="sm">
            <Trophy className="mr-2 h-4 w-4" />
            View Leaderboard
          </Button>
        </div>
      </div>

      {showInfo && (
        <Alert className="mb-6" variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>What are Achievements?</AlertTitle>
          <AlertDescription className="mt-1">
            <p>
              Achievements are earned by completing various tasks in the TerraFusion Sync system. They track your
              progress and reward you for your contributions to property data synchronization.
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto mt-2 text-xs" 
              onClick={() => setShowInfo(false)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <AchievementsDashboard userId={userId} />

      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Achievement Categories</CardTitle>
          <CardDescription>
            Achievements are organized into different categories based on workflow activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CategoryCard 
              title="Sync Achievements" 
              description="Earned by importing, validating, and approving property data files"
              count={6}
              icon={<Award className="h-5 w-5" />}
            />
            <CategoryCard 
              title="Compliance Achievements" 
              description="Earned by maintaining ICSF compliance standards"
              count={2}
              icon={<Award className="h-5 w-5" />}
            />
            <CategoryCard 
              title="Future Categories" 
              description="More achievement categories coming soon!"
              count={0}
              icon={<Award className="h-5 w-5" />}
              locked
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CategoryCardProps {
  title: string;
  description: string;
  count: number;
  icon: React.ReactNode;
  locked?: boolean;
}

function CategoryCard({ title, description, count, icon, locked = false }: CategoryCardProps) {
  return (
    <Card className={locked ? 'opacity-60 grayscale' : ''}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className={`p-2 rounded-full ${locked ? 'bg-gray-200' : 'bg-primary/10'}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm">{count} Achievements</span>
          {locked ? (
            <Button variant="secondary" size="sm" disabled>Locked</Button>
          ) : (
            <Button variant="secondary" size="sm">View</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}