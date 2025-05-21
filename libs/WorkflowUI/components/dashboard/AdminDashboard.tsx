/**
 * Admin Dashboard Component
 * 
 * This component provides a comprehensive administrative dashboard for the TerraFusion
 * platform, including system health monitoring, user management, county management,
 * and configuration settings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Map,
  Settings,
  BarChart,
  FileText,
  Database,
  Shield,
  Bell,
  Calendar,
  Home,
  Layers,
  Package,
  Server,
  HelpCircle,
  LogOut,
  Menu,
  ChevronRight,
  Search,
  User,
  Grid,
  Activity
} from 'lucide-react';

import { SystemHealthPanel, SystemComponent, SystemAlert, ComponentStatus } from './SystemHealthPanel';
import { logger } from '../../../DevOps/utils/logger';

// Create module-specific logger
const adminLogger = logger.withTags(['WorkflowUI', 'AdminDashboard']);

/**
 * County information
 */
export interface County {
  id: string;
  name: string;
  state: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  createdAt: Date;
  lastUpdated: Date;
  properties: {
    population?: number;
    area?: number;
    parcelCount?: number;
    gisReady?: boolean;
    valuationSystemIntegrated?: boolean;
    taxSystemIntegrated?: boolean;
  };
  contacts?: Array<{
    name: string;
    role: string;
    email: string;
    phone?: string;
  }>;
}

/**
 * User information
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  countyIds: string[];
  permissions: string[];
}

/**
 * Admin event
 */
export interface AdminEvent {
  id: string;
  type: 'user' | 'system' | 'county' | 'data' | 'security';
  action: string;
  timestamp: Date;
  userId?: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Dashboard summary
 */
export interface DashboardSummary {
  userCount: number;
  countyCount: number;
  activeCountyCount: number;
  totalParcelCount: number;
  systemHealthScore: number;
  pendingTasks: number;
  recentEvents: AdminEvent[];
}

/**
 * Admin dashboard props
 */
export interface AdminDashboardProps {
  // Current user
  currentUser: User;
  
  // Counties
  counties: County[];
  
  // Users
  users: User[];
  
  // System components and alerts
  systemComponents: SystemComponent[];
  systemAlerts: SystemAlert[];
  
  // Recent events
  recentEvents: AdminEvent[];
  
  // Dashboard summary
  dashboardSummary: DashboardSummary;
  
  // Event handlers
  onCountyStatusChange?: (countyId: string, status: County['status']) => void;
  onUserStatusChange?: (userId: string, status: User['status']) => void;
  onSystemAlertAcknowledge?: (alertId: string) => void;
  onLogout?: () => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Admin Dashboard Component
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  counties,
  users,
  systemComponents,
  systemAlerts,
  recentEvents,
  dashboardSummary,
  onCountyStatusChange,
  onUserStatusChange,
  onSystemAlertAcknowledge,
  onLogout,
  className = '',
  style = {}
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'counties' | 'users' | 'system' | 'settings'
  >('overview');
  
  // State for mobile nav visibility
  const [mobileNavVisible, setMobileNavVisible] = useState<boolean>(false);
  
  // State for filtered/searched data
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredCounties, setFilteredCounties] = useState<County[]>(counties);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  
  // State for county/user details view
  const [selectedCountyId, setSelectedCountyId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Effect to filter counties based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCounties(counties);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCounties(
        counties.filter(county => 
          county.name.toLowerCase().includes(term) || 
          county.state.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, counties]);
  
  // Effect to filter users based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(user => 
          user.name.toLowerCase().includes(term) || 
          user.email.toLowerCase().includes(term) || 
          user.role.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, users]);
  
  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setSelectedCountyId(null);
    setSelectedUserId(null);
    
    // Close mobile nav when changing tabs
    setMobileNavVisible(false);
  }, []);
  
  /**
   * Handle county status change
   */
  const handleCountyStatusChange = useCallback((countyId: string, status: County['status']) => {
    if (onCountyStatusChange) {
      onCountyStatusChange(countyId, status);
    }
    
    adminLogger.info(`County status changed: ${countyId} to ${status}`);
  }, [onCountyStatusChange]);
  
  /**
   * Handle user status change
   */
  const handleUserStatusChange = useCallback((userId: string, status: User['status']) => {
    if (onUserStatusChange) {
      onUserStatusChange(userId, status);
    }
    
    adminLogger.info(`User status changed: ${userId} to ${status}`);
  }, [onUserStatusChange]);
  
  /**
   * Handle county selection
   */
  const handleCountySelect = useCallback((countyId: string) => {
    setSelectedCountyId(prev => prev === countyId ? null : countyId);
  }, []);
  
  /**
   * Handle user selection
   */
  const handleUserSelect = useCallback((userId: string) => {
    setSelectedUserId(prev => prev === userId ? null : userId);
  }, []);
  
  /**
   * Handle logout
   */
  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);
  
  /**
   * Format date
   */
  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'Never';
    
    return date.toLocaleString();
  };
  
  /**
   * Get status color
   */
  const getStatusColor = (status: 'active' | 'inactive' | 'pending' | 'archived'): string => {
    switch (status) {
      case 'active':
        return '#22c55e'; // Green
      case 'pending':
        return '#f59e0b'; // Amber
      case 'inactive':
        return '#94a3b8'; // Gray
      case 'archived':
        return '#64748b'; // Slate
      default:
        return '#64748b'; // Slate
    }
  };
  
  /**
   * Render the overview tab
   */
  const renderOverviewTab = () => (
    <div className="dashboard-overview">
      {/* Summary cards */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Counties card */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '12px' 
          }}>
            <div style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <Map size={20} color="#0ea5e9" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Total Counties</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{dashboardSummary.countyCount}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Active: </span>
              <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{dashboardSummary.activeCountyCount}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Parcels: </span>
              <span style={{ fontWeight: 'bold' }}>{dashboardSummary.totalParcelCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* Users card */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '12px' 
          }}>
            <div style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <Users size={20} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Total Users</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{dashboardSummary.userCount}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Admins: </span>
              <span style={{ fontWeight: 'bold' }}>{users.filter(u => u.role === 'admin').length}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Active: </span>
              <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{users.filter(u => u.status === 'active').length}</span>
            </div>
          </div>
        </div>
        
        {/* System health card */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '12px' 
          }}>
            <div style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <Activity size={20} color="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>System Health</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{dashboardSummary.systemHealthScore}%</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Alerts: </span>
              <span style={{ 
                fontWeight: 'bold', 
                color: systemAlerts.length > 0 ? '#ef4444' : '#22c55e' 
              }}>
                {systemAlerts.filter(a => !a.acknowledged).length}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Components: </span>
              <span style={{ fontWeight: 'bold' }}>{systemComponents.length}</span>
            </div>
          </div>
        </div>
        
        {/* Tasks card */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '12px' 
          }}>
            <div style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <Calendar size={20} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Pending Tasks</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{dashboardSummary.pendingTasks}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Recent Events: </span>
              <span style={{ fontWeight: 'bold' }}>{recentEvents.length}</span>
            </div>
            <button 
              style={{
                padding: '4px 8px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={() => handleTabChange('settings')}
            >
              View All
            </button>
          </div>
        </div>
      </div>
      
      {/* System health panel */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          System Health
        </h2>
        
        <SystemHealthPanel
          components={systemComponents}
          alerts={systemAlerts}
          onAlertAcknowledge={onSystemAlertAcknowledge}
        />
      </div>
      
      {/* Recent events */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          Recent Activity
        </h2>
        
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Event
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Type
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  User
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.slice(0, 5).map(event => {
                // Find user
                const eventUser = event.userId ? users.find(u => u.id === event.userId) : null;
                
                // Get type color and icon
                let typeColor = '#64748b';
                let TypeIcon = FileText;
                
                switch (event.type) {
                  case 'user':
                    typeColor = '#0ea5e9';
                    TypeIcon = User;
                    break;
                  case 'system':
                    typeColor = '#22c55e';
                    TypeIcon = Server;
                    break;
                  case 'county':
                    typeColor = '#f59e0b';
                    TypeIcon = Map;
                    break;
                  case 'data':
                    typeColor = '#8b5cf6';
                    TypeIcon = Database;
                    break;
                  case 'security':
                    typeColor = '#ef4444';
                    TypeIcon = Shield;
                    break;
                }
                
                return (
                  <tr key={event.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      {event.action}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px'
                      }}>
                        <div style={{ 
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: `${typeColor}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <TypeIcon size={14} color={typeColor} />
                        </div>
                        <span style={{ 
                          textTransform: 'capitalize'
                        }}>
                          {event.type}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {eventUser ? eventUser.name : 'System'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>
                      {formatDate(event.timestamp)}
                    </td>
                  </tr>
                );
              })}
              
              {recentEvents.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                    No recent events
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  
  /**
   * Render the counties tab
   */
  const renderCountiesTab = () => {
    // If a county is selected, render its details
    if (selectedCountyId) {
      const county = counties.find(c => c.id === selectedCountyId);
      
      if (!county) {
        return (
          <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
            County not found
          </div>
        );
      }
      
      return (
        <div className="county-details">
          <div style={{ 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <button 
              onClick={() => setSelectedCountyId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
            
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              {county.name}, {county.state}
            </h2>
            
            <div style={{ 
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '9999px',
              backgroundColor: `${getStatusColor(county.status)}15`,
              color: getStatusColor(county.status),
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {county.status}
            </div>
          </div>
          
          {/* County details section */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Basic info */}
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                Basic Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '12px' }}>
                <div style={{ color: '#64748b' }}>County ID:</div>
                <div style={{ fontWeight: 'bold' }}>{county.id}</div>
                
                <div style={{ color: '#64748b' }}>Created:</div>
                <div>{formatDate(county.createdAt)}</div>
                
                <div style={{ color: '#64748b' }}>Last Updated:</div>
                <div>{formatDate(county.lastUpdated)}</div>
                
                <div style={{ color: '#64748b' }}>Status:</div>
                <div>
                  <select
                    value={county.status}
                    onChange={(e) => handleCountyStatusChange(county.id, e.target.value as County['status'])}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Property info */}
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                Property Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '12px' }}>
                <div style={{ color: '#64748b' }}>Population:</div>
                <div>{county.properties.population?.toLocaleString() || 'Unknown'}</div>
                
                <div style={{ color: '#64748b' }}>Area:</div>
                <div>{county.properties.area ? `${county.properties.area.toLocaleString()} sq mi` : 'Unknown'}</div>
                
                <div style={{ color: '#64748b' }}>Parcel Count:</div>
                <div>{county.properties.parcelCount?.toLocaleString() || 'Unknown'}</div>
                
                <div style={{ color: '#64748b' }}>GIS Ready:</div>
                <div>{county.properties.gisReady ? 'Yes' : 'No'}</div>
                
                <div style={{ color: '#64748b' }}>Valuation:</div>
                <div>{county.properties.valuationSystemIntegrated ? 'Integrated' : 'Not Integrated'}</div>
                
                <div style={{ color: '#64748b' }}>Tax System:</div>
                <div>{county.properties.taxSystemIntegrated ? 'Integrated' : 'Not Integrated'}</div>
              </div>
            </div>
          </div>
          
          {/* Contacts */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              Contacts
            </h3>
            
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      Name
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      Role
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      Email
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {county.contacts?.map((contact, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>{contact.name}</td>
                      <td style={{ padding: '12px 16px' }}>{contact.role}</td>
                      <td style={{ padding: '12px 16px' }}>{contact.email}</td>
                      <td style={{ padding: '12px 16px' }}>{contact.phone || 'N/A'}</td>
                    </tr>
                  ))}
                  
                  {!county.contacts || county.contacts.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                        No contacts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Associated users */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              Associated Users
            </h3>
            
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      Name
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      Email
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      Role
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(user => user.countyIds.includes(county.id))
                    .map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>{user.name}</td>
                        <td style={{ padding: '12px 16px' }}>{user.email}</td>
                        <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{user.role}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ 
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '9999px',
                            backgroundColor: getStatusColor(user.status) + '15',
                            color: getStatusColor(user.status),
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {user.status}
                          </div>
                        </td>
                      </tr>
                    ))}
                  
                  {users.filter(user => user.countyIds.includes(county.id)).length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                        No users associated with this county
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
    
    // Otherwise, render the county list
    return (
      <div className="counties-list">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            Counties
          </h2>
          
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search counties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                width: '240px'
              }}
            />
            <Search style={{ 
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              width: '16px',
              height: '16px'
            }} />
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  County
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  State
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Parcels
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCounties.map(county => (
                <tr 
                  key={county.id} 
                  style={{ 
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCountySelect(county.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{county.name}</td>
                  <td style={{ padding: '12px 16px' }}>{county.state}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '9999px',
                      backgroundColor: getStatusColor(county.status) + '15',
                      color: getStatusColor(county.status),
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {county.status}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {county.properties.parcelCount?.toLocaleString() || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>
                    {formatDate(county.lastUpdated)}
                  </td>
                </tr>
              ))}
              
              {filteredCounties.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                    {searchTerm ? `No counties matching "${searchTerm}"` : 'No counties found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  /**
   * Render the users tab
   */
  const renderUsersTab = () => {
    // If a user is selected, render their details
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      
      if (!user) {
        return (
          <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
            User not found
          </div>
        );
      }
      
      // Get user's counties
      const userCounties = counties.filter(county => user.countyIds.includes(county.id));
      
      return (
        <div className="user-details">
          <div style={{ 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <button 
              onClick={() => setSelectedUserId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
            
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              {user.name}
            </h2>
            
            <div style={{ 
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '9999px',
              backgroundColor: `${getStatusColor(user.status)}15`,
              color: getStatusColor(user.status),
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {user.status}
            </div>
          </div>
          
          {/* User details section */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Basic info */}
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                Basic Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '12px' }}>
                <div style={{ color: '#64748b' }}>User ID:</div>
                <div style={{ fontWeight: 'bold' }}>{user.id}</div>
                
                <div style={{ color: '#64748b' }}>Email:</div>
                <div>{user.email}</div>
                
                <div style={{ color: '#64748b' }}>Last Login:</div>
                <div>{formatDate(user.lastLogin)}</div>
                
                <div style={{ color: '#64748b' }}>Role:</div>
                <div style={{ textTransform: 'capitalize' }}>{user.role}</div>
                
                <div style={{ color: '#64748b' }}>Status:</div>
                <div>
                  <select
                    value={user.status}
                    onChange={(e) => handleUserStatusChange(user.id, e.target.value as User['status'])}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Permissions */}
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                Permissions
              </h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {user.permissions.length > 0 ? (
                  user.permissions.map((permission, index) => (
                    <div 
                      key={index}
                      style={{ 
                        padding: '4px 12px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '9999px',
                        fontSize: '14px'
                      }}
                    >
                      {permission}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', width: '100%' }}>
                    No permissions assigned
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Associated counties */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              Associated Counties
            </h3>
            
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      County
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      State
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {userCounties.map(county => (
                    <tr key={county.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{county.name}</td>
                      <td style={{ padding: '12px 16px' }}>{county.state}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ 
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '9999px',
                          backgroundColor: getStatusColor(county.status) + '15',
                          color: getStatusColor(county.status),
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {county.status}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>
                        {formatDate(county.lastUpdated)}
                      </td>
                    </tr>
                  ))}
                  
                  {userCounties.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                        No counties associated with this user
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
    
    // Otherwise, render the user list
    return (
      <div className="users-list">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            Users
          </h2>
          
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                width: '240px'
              }}
            />
            <Search style={{ 
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              width: '16px',
              height: '16px'
            }} />
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Name
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Email
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Role
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Counties
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>
                  Last Login
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr 
                  key={user.id} 
                  style={{ 
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleUserSelect(user.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{user.name}</td>
                  <td style={{ padding: '12px 16px' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{user.role}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '9999px',
                      backgroundColor: getStatusColor(user.status) + '15',
                      color: getStatusColor(user.status),
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {user.status}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {user.countyIds.length}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>
                    {formatDate(user.lastLogin)}
                  </td>
                </tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                    {searchTerm ? `No users matching "${searchTerm}"` : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  /**
   * Render the system tab
   */
  const renderSystemTab = () => (
    <div className="system-tab">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
        System Health & Monitoring
      </h2>
      
      <SystemHealthPanel
        components={systemComponents}
        alerts={systemAlerts}
        onAlertAcknowledge={onSystemAlertAcknowledge}
      />
    </div>
  );
  
  /**
   * Render the settings tab
   */
  const renderSettingsTab = () => (
    <div className="settings-tab">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
        Settings
      </h2>
      
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
          Account Settings
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: '16px', alignItems: 'center' }}>
          <div style={{ color: '#64748b' }}>Name:</div>
          <div style={{ fontWeight: 'bold' }}>{currentUser.name}</div>
          
          <div style={{ color: '#64748b' }}>Email:</div>
          <div>{currentUser.email}</div>
          
          <div style={{ color: '#64748b' }}>Role:</div>
          <div style={{ textTransform: 'capitalize' }}>{currentUser.role}</div>
          
          <div style={{ color: '#64748b' }}>Status:</div>
          <div>
            <div style={{ 
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '9999px',
              backgroundColor: getStatusColor(currentUser.status) + '15',
              color: getStatusColor(currentUser.status),
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {currentUser.status}
            </div>
          </div>
          
          <div style={{ color: '#64748b' }}>Last Login:</div>
          <div>{formatDate(currentUser.lastLogin)}</div>
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '24px'
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
          System Settings
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {/* These would be actual settings in a real implementation */}
          <div style={{ 
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              Notifications
            </h4>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              Configure email and in-app notification settings
            </p>
            <button
              style={{
                padding: '4px 12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Configure
            </button>
          </div>
          
          <div style={{ 
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              API Access
            </h4>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              Manage API keys and access tokens
            </p>
            <button
              style={{
                padding: '4px 12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Manage
            </button>
          </div>
          
          <div style={{ 
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              Data Backup
            </h4>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              Configure automatic backup settings
            </p>
            <button
              style={{
                padding: '4px 12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Configure
            </button>
          </div>
          
          <div style={{ 
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              System Logs
            </h4>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              View and download system logs
            </p>
            <button
              style={{
                padding: '4px 12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              View Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div 
      className={`admin-dashboard ${className}`}
      style={{
        display: 'flex',
        height: '100%',
        ...style
      }}
    >
      {/* Sidebar */}
      <div style={{
        width: '240px',
        backgroundColor: 'white',
        borderRight: '1px solid #e2e8f0',
        display: mobileNavVisible ? 'block' : 'none',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        '@media (min-width: 1024px)': {
          display: 'block',
          position: 'relative',
          boxShadow: 'none'
        }
      }}>
        {/* Logo and title */}
        <div style={{
          padding: '24px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ 
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#0ea5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            TF
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>TerraFusion</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Admin Dashboard</div>
          </div>
        </div>
        
        {/* Nav items */}
        <nav style={{ padding: '16px 0' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <button 
                onClick={() => handleTabChange('overview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: activeTab === 'overview' ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === 'overview' ? '3px solid #0ea5e9' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Home size={20} color={activeTab === 'overview' ? '#0ea5e9' : '#64748b'} />
                <span style={{ 
                  color: activeTab === 'overview' ? '#0f172a' : '#64748b',
                  fontWeight: activeTab === 'overview' ? 'bold' : 'normal'
                }}>
                  Overview
                </span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleTabChange('counties')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: activeTab === 'counties' ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === 'counties' ? '3px solid #0ea5e9' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Map size={20} color={activeTab === 'counties' ? '#0ea5e9' : '#64748b'} />
                <span style={{ 
                  color: activeTab === 'counties' ? '#0f172a' : '#64748b',
                  fontWeight: activeTab === 'counties' ? 'bold' : 'normal'
                }}>
                  Counties
                </span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleTabChange('users')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: activeTab === 'users' ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === 'users' ? '3px solid #0ea5e9' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Users size={20} color={activeTab === 'users' ? '#0ea5e9' : '#64748b'} />
                <span style={{ 
                  color: activeTab === 'users' ? '#0f172a' : '#64748b',
                  fontWeight: activeTab === 'users' ? 'bold' : 'normal'
                }}>
                  Users
                </span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleTabChange('system')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: activeTab === 'system' ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === 'system' ? '3px solid #0ea5e9' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Server size={20} color={activeTab === 'system' ? '#0ea5e9' : '#64748b'} />
                <span style={{ 
                  color: activeTab === 'system' ? '#0f172a' : '#64748b',
                  fontWeight: activeTab === 'system' ? 'bold' : 'normal'
                }}>
                  System
                </span>
                
                {/* Alert badge */}
                {systemAlerts.filter(a => !a.acknowledged).length > 0 && (
                  <div style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '2px 6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginLeft: 'auto'
                  }}>
                    {systemAlerts.filter(a => !a.acknowledged).length}
                  </div>
                )}
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleTabChange('settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: activeTab === 'settings' ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === 'settings' ? '3px solid #0ea5e9' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Settings size={20} color={activeTab === 'settings' ? '#0ea5e9' : '#64748b'} />
                <span style={{ 
                  color: activeTab === 'settings' ? '#0f172a' : '#64748b',
                  fontWeight: activeTab === 'settings' ? 'bold' : 'normal'
                }}>
                  Settings
                </span>
              </button>
            </li>
          </ul>
        </nav>
        
        {/* User info */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e2e8f0',
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: 'white'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '9999px',
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0ea5e9',
              fontWeight: 'bold'
            }}>
              {currentUser.name.charAt(0)}
            </div>
            
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ 
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {currentUser.name}
              </div>
              <div style={{ 
                fontSize: '12px',
                color: '#64748b',
                textTransform: 'capitalize'
              }}>
                {currentUser.role}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                backgroundColor: '#f1f5f9',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} color="#64748b" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileNavVisible(!mobileNavVisible)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          '@media (min-width: 1024px)': {
            display: 'none'
          }
        }}
      >
        <Menu size={20} color="#64748b" />
      </button>
      
      {/* Main content */}
      <div style={{
        flex: 1,
        padding: '24px',
        backgroundColor: '#f8fafc',
        overflowY: 'auto',
        marginLeft: '0px',
        '@media (min-width: 1024px)': {
          marginLeft: '240px'
        }
      }}>
        {/* Render active tab content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'counties' && renderCountiesTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'system' && renderSystemTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
      
      {/* Mobile nav overlay backdrop */}
      {mobileNavVisible && (
        <div 
          onClick={() => setMobileNavVisible(false)}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40
          }}
        />
      )}
    </div>
  );
};