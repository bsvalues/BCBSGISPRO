import React from 'react';
import { ModernLayout } from '../components/layout/modern-layout';
import SyncDashboard from '../components/sync/sync-dashboard';
import { useTitle } from '../hooks/use-title';

const SyncDashboardPage: React.FC = () => {
  useTitle('ICSF Sync - BentonGeoPro');
  
  return (
    <ModernLayout>
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          ICSF Synchronization Dashboard
        </h1>
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