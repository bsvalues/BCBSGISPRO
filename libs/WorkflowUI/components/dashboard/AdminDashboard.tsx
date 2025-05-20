/**
 * AdminDashboard Component
 * 
 * This component provides the main administrative dashboard interface
 * for the TerraFusion platform.
 */

import React, { useState, useEffect } from 'react';
import { CountySelector } from '../selectors/CountySelector';
import { StatisticsPanel } from './StatisticsPanel';
import { UserManagementPanel } from '../users/UserManagementPanel';
import { WorkflowStatusPanel } from '../workflow/WorkflowStatusPanel';
import { SystemHealthPanel } from './SystemHealthPanel';
import { ImportActivityPanel } from './ImportActivityPanel';
import { ValuationSummaryPanel } from './ValuationSummaryPanel';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useSystemHealth } from '../../hooks/useSystemHealth';

export interface AdminDashboardProps {
  selectedCounty?: string;
  onCountyChange?: (county: string) => void;
}

/**
 * AdminDashboard is the main administrative interface for the platform
 */
const AdminDashboard: React.FC<AdminDashboardProps> = ({
  selectedCounty,
  onCountyChange
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workflows' | 'system'>('overview');
  const { hasPermission } = useUserPermissions();
  const { data: dashboardData, isLoading: dataLoading } = useDashboardData(selectedCounty);
  const { data: healthData, isLoading: healthLoading } = useSystemHealth();

  // Check if the user has admin permissions
  const isAdmin = hasPermission('admin');
  const canManageUsers = hasPermission('manage_users');
  const canViewSystem = hasPermission('view_system');

  // If the user doesn't have admin permissions, show a message
  if (!isAdmin) {
    return (
      <div className="admin-dashboard-container">
        <div className="permission-error">
          <h2>Access Denied</h2>
          <p>You do not have permission to access the admin dashboard.</p>
          <p>Please contact your administrator for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h1>TerraFusion Admin Dashboard</h1>
        <div className="county-selector-container">
          <CountySelector
            selectedCounty={selectedCounty}
            onChange={onCountyChange}
          />
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        {canManageUsers && (
          <button
            className={`dashboard-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
        )}
        <button
          className={`dashboard-tab ${activeTab === 'workflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflows')}
        >
          Workflows
        </button>
        {canViewSystem && (
          <button
            className={`dashboard-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System Health
          </button>
        )}
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            <div className="dashboard-grid">
              <StatisticsPanel
                loading={dataLoading}
                statistics={dashboardData?.statistics}
              />
              <ImportActivityPanel
                loading={dataLoading}
                activity={dashboardData?.importActivity}
              />
              <ValuationSummaryPanel
                loading={dataLoading}
                summary={dashboardData?.valuationSummary}
              />
              <SystemHealthPanel
                loading={healthLoading}
                health={healthData}
              />
            </div>
          </div>
        )}

        {activeTab === 'users' && canManageUsers && (
          <UserManagementPanel />
        )}

        {activeTab === 'workflows' && (
          <WorkflowStatusPanel
            selectedCounty={selectedCounty}
          />
        )}

        {activeTab === 'system' && canViewSystem && (
          <div className="system-health-container">
            <h2>System Health and Monitoring</h2>
            <SystemHealthPanel
              loading={healthLoading}
              health={healthData}
              detailed
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;