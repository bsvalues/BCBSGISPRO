import React from 'react';
import { ModernLayout } from '../components/layout/modern-layout';
import SyncDashboard from '../components/sync/sync-dashboard';
import { useTitle } from '../hooks/use-title';
import { AchievementNotificationListener } from '../components/achievements/achievement-notification';
import { Link } from 'wouter';
import { Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SyncDashboardPage: React.FC = () => {
  useTitle('ICSF Sync - BentonGeoPro');
  
  return (
    <ModernLayout>
      <AchievementNotificationListener />
      
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ICSF Synchronization Dashboard
          </h1>
          <Link href="/achievements">
            <Button variant="outline" className="flex gap-2 items-center">
              <Award className="h-4 w-4" />
              <span>Achievements</span>
            </Button>
          </Link>
        </div>
        
        <p className="text-gray-600 mb-8 max-w-3xl">
          This dashboard provides tools for importing, reviewing, and managing property 
          data synchronization between the Integrated County Systems Framework (ICSF) 
          and the Benton County Assessor's Office database systems.
        </p>
        
        <SyncDashboard />
      </div>
    </ModernLayout>
  );
};

export default SyncDashboardPage;