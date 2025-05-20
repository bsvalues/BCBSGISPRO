/**
 * Admin Dashboard Component
 * 
 * This component provides the main administration interface for the
 * TerraFusion platform, including county management, user access control,
 * and system monitoring.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { SystemHealthPanel } from './SystemHealthPanel';

/**
 * County data interface
 */
interface County {
  id: string;
  name: string;
  state: string;
  fips: string;
  status: 'active' | 'pending' | 'inactive';
  lastUpdated: string;
}

/**
 * User interface
 */
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  department: string;
  lastLogin: string;
}

/**
 * Workflow status interface
 */
interface WorkflowStatus {
  id: string;
  name: string;
  type: 'import' | 'valuation' | 'export' | 'maintenance';
  status: 'running' | 'completed' | 'failed' | 'pending';
  progress: number;
  startTime: string;
  endTime?: string;
  county?: string;
  user?: string;
}

/**
 * Import activity interface
 */
interface ImportActivity {
  id: string;
  county: string;
  type: 'parcels' | 'taxCodes' | 'sales' | 'plats' | 'other';
  status: 'completed' | 'failed' | 'in-progress';
  recordCount: number;
  importedBy: string;
  timestamp: string;
}

/**
 * Valuation summary interface
 */
interface ValuationSummary {
  county: string;
  totalParcels: number;
  valuedParcels: number;
  totalValue: number;
  averageValue: number;
  changePercent: number;
  completedDate?: string;
}

/**
 * Component props
 */
interface AdminDashboardProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Admin Dashboard Component
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  className = '',
  style = {}
}) => {
  // State for selected county
  const [selectedCounty, setSelectedCounty] = useState<string>('all');
  
  // State for counties
  const [counties, setCounties] = useState<County[]>([]);
  
  // State for users
  const [users, setUsers] = useState<User[]>([]);
  
  // State for workflow statuses
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([]);
  
  // State for import activities
  const [importActivities, setImportActivities] = useState<ImportActivity[]>([]);
  
  // State for valuation summaries
  const [valuationSummaries, setValuationSummaries] = useState<ValuationSummary[]>([]);
  
  // State for loading status
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for error
  const [error, setError] = useState<string | null>(null);
  
  // State for system health
  const [systemHealthy, setSystemHealthy] = useState<boolean>(true);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // County selector component
  const CountySelector = () => (
    <div className="county-selector" style={{ marginBottom: '16px' }}>
      <label htmlFor="county-select" style={{ marginRight: '8px', fontWeight: 'bold' }}>
        County:
      </label>
      <select
        id="county-select"
        value={selectedCounty}
        onChange={(e) => setSelectedCounty(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}
      >
        <option value="all">All Counties</option>
        {counties.map(county => (
          <option key={county.id} value={county.id}>
            {county.name}, {county.state}
          </option>
        ))}
      </select>
    </div>
  );
  
  // Statistics panel component
  const StatisticsPanel = () => {
    // Filter data by selected county
    const filteredWorkflows = selectedCounty === 'all'
      ? workflows
      : workflows.filter(w => w.county === selectedCounty);
    
    const filteredImports = selectedCounty === 'all'
      ? importActivities
      : importActivities.filter(i => i.county === selectedCounty);
    
    const filteredValuations = selectedCounty === 'all'
      ? valuationSummaries
      : valuationSummaries.filter(v => v.county === selectedCounty);
    
    // Calculate statistics
    const activeWorkflows = filteredWorkflows.filter(w => w.status === 'running').length;
    const completedImports = filteredImports.filter(i => i.status === 'completed').length;
    const totalParcels = filteredValuations.reduce((sum, v) => sum + v.totalParcels, 0);
    const valuedParcels = filteredValuations.reduce((sum, v) => sum + v.valuedParcels, 0);
    const valuationProgress = totalParcels > 0 ? (valuedParcels / totalParcels) * 100 : 0;
    
    return (
      <div className="statistics-panel">
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Statistics</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Active counties */}
          <div className="stat-card" style={{ 
            padding: '16px', 
            borderRadius: '8px', 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #bae6fd' 
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {selectedCounty === 'all' ? counties.filter(c => c.status === 'active').length : 1}
            </div>
            <div style={{ color: '#0369a1' }}>Active Counties</div>
          </div>
          
          {/* Active workflows */}
          <div className="stat-card" style={{ 
            padding: '16px', 
            borderRadius: '8px', 
            backgroundColor: '#f0fdf4', 
            border: '1px solid #bbf7d0' 
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {activeWorkflows}
            </div>
            <div style={{ color: '#16a34a' }}>Active Workflows</div>
          </div>
          
          {/* Recent imports */}
          <div className="stat-card" style={{ 
            padding: '16px', 
            borderRadius: '8px', 
            backgroundColor: '#fdf4ff', 
            border: '1px solid #f5d0fe' 
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {completedImports}
            </div>
            <div style={{ color: '#a21caf' }}>Completed Imports</div>
          </div>
          
          {/* Valuation progress */}
          <div className="stat-card" style={{ 
            padding: '16px', 
            borderRadius: '8px', 
            backgroundColor: '#fff7ed', 
            border: '1px solid #fed7aa' 
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {valuationProgress.toFixed(1)}%
            </div>
            <div style={{ color: '#c2410c' }}>Valuation Progress</div>
          </div>
        </div>
      </div>
    );
  };
  
  // User management panel component
  const UserManagementPanel = () => (
    <div className="user-management-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', margin: 0 }}>User Management</h2>
        
        <button style={{
          padding: '8px 12px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: '#0284c7',
          color: 'white',
          cursor: 'pointer'
        }}>
          Add User
        </button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Department</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Last Login</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 16px' }}>{user.name}</td>
                <td style={{ padding: '12px 16px' }}>{user.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 
                      user.role === 'admin' ? '#fee2e2' :
                      user.role === 'manager' ? '#e0f2fe' :
                      user.role === 'editor' ? '#dcfce7' :
                      '#f3f4f6',
                    color: 
                      user.role === 'admin' ? '#b91c1c' :
                      user.role === 'manager' ? '#0369a1' :
                      user.role === 'editor' ? '#16a34a' :
                      '#4b5563'
                  }}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>{user.department}</td>
                <td style={{ padding: '12px 16px' }}>{new Date(user.lastLogin).toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button style={{
                    padding: '4px 8px',
                    marginRight: '8px',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}>
                    Edit
                  </button>
                  <button style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #fee2e2',
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    cursor: 'pointer'
                  }}>
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
            
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Workflow status panel component
  const WorkflowStatusPanel = () => {
    // Filter workflows by selected county
    const filteredWorkflows = selectedCounty === 'all'
      ? workflows
      : workflows.filter(w => w.county === selectedCounty);
    
    return (
      <div className="workflow-status-panel">
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Workflow Status</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Workflow</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>County</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Progress</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Started</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkflows.map(workflow => (
                <tr key={workflow.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px' }}>{workflow.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 
                        workflow.type === 'import' ? '#fef9c3' :
                        workflow.type === 'valuation' ? '#dcfce7' :
                        workflow.type === 'export' ? '#e0f2fe' :
                        '#f3f4f6',
                      color: 
                        workflow.type === 'import' ? '#854d0e' :
                        workflow.type === 'valuation' ? '#16a34a' :
                        workflow.type === 'export' ? '#0369a1' :
                        '#4b5563'
                    }}>
                      {workflow.type.charAt(0).toUpperCase() + workflow.type.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {counties.find(c => c.id === workflow.county)?.name || workflow.county}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 
                        workflow.status === 'running' ? '#dcfce7' :
                        workflow.status === 'completed' ? '#e0f2fe' :
                        workflow.status === 'failed' ? '#fee2e2' :
                        '#f3f4f6',
                      color: 
                        workflow.status === 'running' ? '#16a34a' :
                        workflow.status === 'completed' ? '#0369a1' :
                        workflow.status === 'failed' ? '#b91c1c' :
                        '#4b5563'
                    }}>
                      {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px' }}>
                      <div 
                        style={{ 
                          width: `${workflow.progress}%`, 
                          height: '100%', 
                          backgroundColor: workflow.status === 'failed' ? '#ef4444' : '#22c55e',
                          borderRadius: '3px'
                        }} 
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {workflow.progress}%
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {new Date(workflow.startTime).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{
                      padding: '4px 8px',
                      marginRight: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}>
                      View
                    </button>
                    {workflow.status === 'running' && (
                      <button style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #fee2e2',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        cursor: 'pointer'
                      }}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredWorkflows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                    No workflows found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Import activity panel component
  const ImportActivityPanel = () => {
    // Filter import activities by selected county
    const filteredImports = selectedCounty === 'all'
      ? importActivities
      : importActivities.filter(i => i.county === selectedCounty);
    
    return (
      <div className="import-activity-panel">
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Imports</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>County</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Records</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Imported By</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Timestamp</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredImports.map(activity => (
                <tr key={activity.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px' }}>
                    {counties.find(c => c.id === activity.county)?.name || activity.county}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 
                        activity.type === 'parcels' ? '#dcfce7' :
                        activity.type === 'taxCodes' ? '#e0f2fe' :
                        activity.type === 'sales' ? '#fef9c3' :
                        activity.type === 'plats' ? '#fce7f3' :
                        '#f3f4f6',
                      color: 
                        activity.type === 'parcels' ? '#16a34a' :
                        activity.type === 'taxCodes' ? '#0369a1' :
                        activity.type === 'sales' ? '#854d0e' :
                        activity.type === 'plats' ? '#a21caf' :
                        '#4b5563'
                    }}>
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 
                        activity.status === 'completed' ? '#dcfce7' :
                        activity.status === 'failed' ? '#fee2e2' :
                        activity.status === 'in-progress' ? '#fef9c3' :
                        '#f3f4f6',
                      color: 
                        activity.status === 'completed' ? '#16a34a' :
                        activity.status === 'failed' ? '#b91c1c' :
                        activity.status === 'in-progress' ? '#854d0e' :
                        '#4b5563'
                    }}>
                      {
                        activity.status === 'in-progress' 
                          ? 'In Progress' 
                          : activity.status.charAt(0).toUpperCase() + activity.status.slice(1)
                      }
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{activity.recordCount.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {users.find(u => u.id === activity.importedBy)?.name || activity.importedBy}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredImports.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                    No import activities found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Valuation summary panel component
  const ValuationSummaryPanel = () => {
    // Filter valuation summaries by selected county
    const filteredValuations = selectedCounty === 'all'
      ? valuationSummaries
      : valuationSummaries.filter(v => v.county === selectedCounty);
    
    return (
      <div className="valuation-summary-panel">
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Valuation Summary</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>County</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Total Parcels</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Valued Parcels</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Progress</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Total Value</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Average Value</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Change %</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredValuations.map((valuation, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px' }}>
                    {counties.find(c => c.id === valuation.county)?.name || valuation.county}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{valuation.totalParcels.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>{valuation.valuedParcels.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px' }}>
                      <div 
                        style={{ 
                          width: `${(valuation.valuedParcels / valuation.totalParcels) * 100}%`, 
                          height: '100%', 
                          backgroundColor: '#22c55e',
                          borderRadius: '3px'
                        }} 
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {((valuation.valuedParcels / valuation.totalParcels) * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>${valuation.totalValue.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>${valuation.averageValue.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      color: valuation.changePercent >= 0 ? '#16a34a' : '#b91c1c'
                    }}>
                      {valuation.changePercent >= 0 ? '+' : ''}{valuation.changePercent.toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}>
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredValuations.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                    No valuation summaries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, this would fetch data from the API
        // For now, we'll use mock data
        
        // Mock counties
        const mockCounties: County[] = [
          {
            id: 'benton-wa',
            name: 'Benton',
            state: 'Washington',
            fips: '53005',
            status: 'active',
            lastUpdated: '2025-05-15T12:00:00Z'
          },
          {
            id: 'franklin-wa',
            name: 'Franklin',
            state: 'Washington',
            fips: '53021',
            status: 'active',
            lastUpdated: '2025-05-14T09:30:00Z'
          },
          {
            id: 'yakima-wa',
            name: 'Yakima',
            state: 'Washington',
            fips: '53077',
            status: 'pending',
            lastUpdated: '2025-05-12T14:45:00Z'
          }
        ];
        
        // Mock users
        const mockUsers: User[] = [
          {
            id: 'user1',
            name: 'John Smith',
            email: 'john.smith@example.gov',
            role: 'admin',
            department: 'IT',
            lastLogin: '2025-05-19T08:45:00Z'
          },
          {
            id: 'user2',
            name: 'Jane Doe',
            email: 'jane.doe@example.gov',
            role: 'manager',
            department: 'Assessor',
            lastLogin: '2025-05-19T09:15:00Z'
          },
          {
            id: 'user3',
            name: 'Bob Johnson',
            email: 'bob.johnson@example.gov',
            role: 'editor',
            department: 'Assessor',
            lastLogin: '2025-05-18T14:30:00Z'
          },
          {
            id: 'user4',
            name: 'Alice Williams',
            email: 'alice.williams@example.gov',
            role: 'viewer',
            department: 'Treasurer',
            lastLogin: '2025-05-17T11:20:00Z'
          }
        ];
        
        // Mock workflows
        const mockWorkflows: WorkflowStatus[] = [
          {
            id: 'wf1',
            name: 'Parcel Import - Benton County',
            type: 'import',
            status: 'running',
            progress: 65,
            startTime: '2025-05-20T09:00:00Z',
            county: 'benton-wa',
            user: 'user2'
          },
          {
            id: 'wf2',
            name: 'Valuation Batch - Franklin County',
            type: 'valuation',
            status: 'completed',
            progress: 100,
            startTime: '2025-05-19T14:00:00Z',
            endTime: '2025-05-19T15:30:00Z',
            county: 'franklin-wa',
            user: 'user3'
          },
          {
            id: 'wf3',
            name: 'Tax Code Import - Yakima County',
            type: 'import',
            status: 'failed',
            progress: 45,
            startTime: '2025-05-18T11:00:00Z',
            endTime: '2025-05-18T11:23:00Z',
            county: 'yakima-wa',
            user: 'user2'
          }
        ];
        
        // Mock import activities
        const mockImportActivities: ImportActivity[] = [
          {
            id: 'imp1',
            county: 'benton-wa',
            type: 'parcels',
            status: 'in-progress',
            recordCount: 65247,
            importedBy: 'user2',
            timestamp: '2025-05-20T09:00:00Z'
          },
          {
            id: 'imp2',
            county: 'franklin-wa',
            type: 'parcels',
            status: 'completed',
            recordCount: 28965,
            importedBy: 'user2',
            timestamp: '2025-05-19T10:15:00Z'
          },
          {
            id: 'imp3',
            county: 'franklin-wa',
            type: 'taxCodes',
            status: 'completed',
            recordCount: 156,
            importedBy: 'user3',
            timestamp: '2025-05-19T14:00:00Z'
          },
          {
            id: 'imp4',
            county: 'yakima-wa',
            type: 'taxCodes',
            status: 'failed',
            recordCount: 203,
            importedBy: 'user2',
            timestamp: '2025-05-18T11:00:00Z'
          }
        ];
        
        // Mock valuation summaries
        const mockValuationSummaries: ValuationSummary[] = [
          {
            county: 'benton-wa',
            totalParcels: 65247,
            valuedParcels: 42510,
            totalValue: 13890450000,
            averageValue: 326758,
            changePercent: 5.2,
            completedDate: '2025-05-15T00:00:00Z'
          },
          {
            county: 'franklin-wa',
            totalParcels: 28965,
            valuedParcels: 28965,
            totalValue: 5723400000,
            averageValue: 197597,
            changePercent: 4.8,
            completedDate: '2025-05-19T15:30:00Z'
          },
          {
            county: 'yakima-wa',
            totalParcels: 82134,
            valuedParcels: 0,
            totalValue: 0,
            averageValue: 0,
            changePercent: 0,
            completedDate: undefined
          }
        ];
        
        // Update state with mock data
        setCounties(mockCounties);
        setUsers(mockUsers);
        setWorkflows(mockWorkflows);
        setImportActivities(mockImportActivities);
        setValuationSummaries(mockValuationSummaries);
        
        setLoading(false);
      } catch (err: any) {
        setError(`Failed to fetch data: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle health status change
  const handleHealthStatusChange = (isHealthy: boolean) => {
    setSystemHealthy(isHealthy);
  };
  
  return (
    <div 
      className={`admin-dashboard ${className}`}
      style={{
        ...style
      }}
    >
      {/* Header */}
      <div className="dashboard-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '16px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          Admin Dashboard
        </h1>
        
        <div className="system-status" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            backgroundColor: systemHealthy ? '#22c55e' : '#ef4444',
            marginRight: '8px'
          }}></div>
          <span style={{ color: systemHealthy ? '#16a34a' : '#b91c1c' }}>
            {systemHealthy ? 'System Healthy' : 'System Issues'}
          </span>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="loading" style={{ textAlign: 'center', padding: '48px' }}>
          Loading dashboard data...
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div 
          className="error"
          style={{ 
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            marginBottom: '24px'
          }}
        >
          {error}
        </div>
      )}
      
      {/* Dashboard content */}
      {!loading && !error && (
        <div className="dashboard-content">
          {/* Navigation tabs */}
          <div className="tabs" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              {['dashboard', 'counties', 'users', 'system'].map(tab => (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: activeTab === tab ? '#f9fafb' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid #0284c7' : 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab ? 'bold' : 'normal'
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Dashboard tab */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-tab">
              {/* County selector */}
              <CountySelector />
              
              {/* Statistics */}
              <div style={{ marginBottom: '24px' }}>
                <StatisticsPanel />
              </div>
              
              {/* Workflow status */}
              <div style={{ marginBottom: '24px' }}>
                <WorkflowStatusPanel />
              </div>
              
              {/* Import activity */}
              <div style={{ marginBottom: '24px' }}>
                <ImportActivityPanel />
              </div>
              
              {/* Valuation summary */}
              <div>
                <ValuationSummaryPanel />
              </div>
            </div>
          )}
          
          {/* Counties tab */}
          {activeTab === 'counties' && (
            <div className="counties-tab">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', margin: 0 }}>County Management</h2>
                
                <Link href="/counties/onboard">
                  <a style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}>
                    Onboard New County
                  </a>
                </Link>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>County</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>State</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>FIPS</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Last Updated</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counties.map(county => (
                      <tr key={county.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 16px' }}>{county.name}</td>
                        <td style={{ padding: '12px 16px' }}>{county.state}</td>
                        <td style={{ padding: '12px 16px' }}>{county.fips}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 
                              county.status === 'active' ? '#dcfce7' :
                              county.status === 'pending' ? '#fef9c3' :
                              '#fee2e2',
                            color: 
                              county.status === 'active' ? '#16a34a' :
                              county.status === 'pending' ? '#854d0e' :
                              '#b91c1c'
                          }}>
                            {county.status.charAt(0).toUpperCase() + county.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {new Date(county.lastUpdated).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Link href={`/counties/${county.id}`}>
                            <a style={{
                              padding: '4px 8px',
                              marginRight: '8px',
                              borderRadius: '4px',
                              border: '1px solid #e5e7eb',
                              backgroundColor: 'white',
                              textDecoration: 'none',
                              color: 'inherit',
                              display: 'inline-block'
                            }}>
                              View
                            </a>
                          </Link>
                          <Link href={`/counties/${county.id}/edit`}>
                            <a style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #e5e7eb',
                              backgroundColor: 'white',
                              textDecoration: 'none',
                              color: 'inherit',
                              display: 'inline-block'
                            }}>
                              Edit
                            </a>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Users tab */}
          {activeTab === 'users' && (
            <div className="users-tab">
              <UserManagementPanel />
            </div>
          )}
          
          {/* System tab */}
          {activeTab === 'system' && (
            <div className="system-tab">
              <SystemHealthPanel 
                title="System Health" 
                refreshInterval={60000}
                showDetails={true}
                showDependencies={true}
                onHealthStatusChange={handleHealthStatusChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};