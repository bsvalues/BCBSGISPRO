/**
 * System Health Panel
 * 
 * This component provides a comprehensive dashboard for monitoring system health,
 * displaying metrics, logs, and alerts for TerraFusion platform components.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  Server,
  Activity,
  BarChart2,
  RefreshCw,
  AlertTriangle,
  Zap,
  Layers,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';

import { logger } from '../../../DevOps/utils/logger';

// Create module-specific logger
const healthLogger = logger.withTags(['WorkflowUI', 'SystemHealthPanel']);

/**
 * System component status
 */
export enum ComponentStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  ERROR = 'error',
  OFFLINE = 'offline',
  UNKNOWN = 'unknown'
}

/**
 * System component information
 */
export interface SystemComponent {
  id: string;
  name: string;
  description: string;
  status: ComponentStatus;
  lastUpdated: Date;
  metrics: SystemMetric[];
  dependencies: string[];
  details?: Record<string, any>;
}

/**
 * System metric
 */
export interface SystemMetric {
  name: string;
  value: number | string;
  unit?: string;
  timestamp: Date;
  status?: ComponentStatus;
  thresholds?: {
    warning?: number;
    error?: number;
  };
  history?: Array<{
    value: number | string;
    timestamp: Date;
  }>;
}

/**
 * System alert
 */
export interface SystemAlert {
  id: string;
  componentId: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  details?: Record<string, any>;
}

/**
 * System health panel props
 */
export interface SystemHealthPanelProps {
  // Components to monitor
  components: SystemComponent[];
  
  // Alerts
  alerts: SystemAlert[];
  
  // Refresh interval in milliseconds
  refreshInterval?: number;
  
  // Event handlers
  onRefresh?: () => void;
  onAlertAcknowledge?: (alertId: string) => void;
  onComponentClick?: (componentId: string) => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}

/**
 * System Health Panel Component
 */
export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  components,
  alerts,
  refreshInterval = 30000,
  onRefresh,
  onAlertAcknowledge,
  onComponentClick,
  className = '',
  style = {}
}) => {
  // State for panel visibility
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    alerts: true,
    components: true,
    metrics: false
  });
  
  // State for component details
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  
  // State for refresh timer
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // State for metrics visibility
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({});
  
  // Effect for auto-refresh
  useEffect(() => {
    // Set up auto-refresh timer
    const timer = setInterval(() => {
      handleRefresh();
    }, refreshInterval);
    
    // Clean up on unmount
    return () => {
      clearInterval(timer);
    };
  }, [refreshInterval, onRefresh]);
  
  // Initialize visible metrics state
  useEffect(() => {
    // Default to showing all metrics
    const initialVisibility: Record<string, boolean> = {};
    
    components.forEach(component => {
      component.metrics.forEach(metric => {
        const key = `${component.id}-${metric.name}`;
        initialVisibility[key] = true;
      });
    });
    
    setVisibleMetrics(initialVisibility);
  }, [components]);
  
  /**
   * Handle refresh button click
   */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    
    // Call parent refresh handler if provided
    if (onRefresh) {
      onRefresh();
    }
    
    // Update last refreshed time
    setLastRefreshed(new Date());
    
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
    
    healthLogger.info('System health data refreshed');
  }, [onRefresh]);
  
  /**
   * Toggle section expansion
   */
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  /**
   * Handle component click
   */
  const handleComponentClick = useCallback((componentId: string) => {
    setSelectedComponent(prev => prev === componentId ? null : componentId);
    
    if (onComponentClick) {
      onComponentClick(componentId);
    }
  }, [onComponentClick]);
  
  /**
   * Handle alert acknowledge
   */
  const handleAlertAcknowledge = useCallback((alertId: string) => {
    if (onAlertAcknowledge) {
      onAlertAcknowledge(alertId);
    }
  }, [onAlertAcknowledge]);
  
  /**
   * Toggle metric visibility
   */
  const toggleMetricVisibility = useCallback((componentId: string, metricName: string) => {
    const key = `${componentId}-${metricName}`;
    
    setVisibleMetrics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);
  
  /**
   * Get status count
   */
  const getStatusCount = useCallback((status: ComponentStatus): number => {
    return components.filter(component => component.status === status).length;
  }, [components]);
  
  /**
   * Get status color
   */
  const getStatusColor = (status: ComponentStatus): string => {
    switch (status) {
      case ComponentStatus.HEALTHY:
        return '#22c55e'; // Green
      case ComponentStatus.WARNING:
        return '#f59e0b'; // Amber
      case ComponentStatus.ERROR:
        return '#ef4444'; // Red
      case ComponentStatus.OFFLINE:
        return '#94a3b8'; // Gray
      default:
        return '#64748b'; // Slate
    }
  };
  
  /**
   * Get status icon
   */
  const getStatusIcon = (status: ComponentStatus): React.ReactNode => {
    const color = getStatusColor(status);
    
    switch (status) {
      case ComponentStatus.HEALTHY:
        return <CheckCircle size={16} color={color} />;
      case ComponentStatus.WARNING:
        return <AlertTriangle size={16} color={color} />;
      case ComponentStatus.ERROR:
        return <AlertCircle size={16} color={color} />;
      case ComponentStatus.OFFLINE:
        return <Server size={16} color={color} />;
      default:
        return <HardDrive size={16} color={color} />;
    }
  };
  
  /**
   * Get component icon
   */
  const getComponentIcon = (component: SystemComponent): React.ReactNode => {
    // Determine icon based on component id or name
    if (component.id.includes('database') || component.name.toLowerCase().includes('database')) {
      return <Database size={20} />;
    } else if (component.id.includes('server') || component.name.toLowerCase().includes('server')) {
      return <Server size={20} />;
    } else if (component.id.includes('api') || component.name.toLowerCase().includes('api')) {
      return <Zap size={20} />;
    } else if (component.id.includes('storage') || component.name.toLowerCase().includes('storage')) {
      return <HardDrive size={20} />;
    } else if (component.id.includes('map') || component.name.toLowerCase().includes('map')) {
      return <Layers size={20} />;
    } else if (component.id.includes('user') || component.name.toLowerCase().includes('user')) {
      return <Users size={20} />;
    }
    
    // Default icon
    return <Activity size={20} />;
  };
  
  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };
  
  /**
   * Format metric value
   */
  const formatMetricValue = (metric: SystemMetric): string => {
    if (typeof metric.value === 'number') {
      return `${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`;
    }
    
    return String(metric.value);
  };
  
  /**
   * Calculate overall system status
   */
  const calculateOverallStatus = (): ComponentStatus => {
    if (components.some(c => c.status === ComponentStatus.ERROR)) {
      return ComponentStatus.ERROR;
    }
    
    if (components.some(c => c.status === ComponentStatus.WARNING)) {
      return ComponentStatus.WARNING;
    }
    
    if (components.some(c => c.status === ComponentStatus.OFFLINE)) {
      return ComponentStatus.WARNING;
    }
    
    if (components.every(c => c.status === ComponentStatus.HEALTHY)) {
      return ComponentStatus.HEALTHY;
    }
    
    return ComponentStatus.UNKNOWN;
  };
  
  // Calculate overall status
  const overallStatus = calculateOverallStatus();
  
  // Calculate critical alerts count
  const criticalAlertsCount = alerts.filter(a => a.level === 'critical' && !a.acknowledged).length;
  
  return (
    <div 
      className={`system-health-panel ${className}`}
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: 'white',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            System Health Monitor
          </h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={16} />
            Last updated: {formatDate(lastRefreshed)}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              border: 'none',
              cursor: isRefreshing ? 'default' : 'pointer'
            }}
          >
            <RefreshCw 
              size={18} 
              className={isRefreshing ? 'animate-spin' : ''} 
            />
          </button>
        </div>
      </div>
      
      {/* Summary section */}
      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: '#f1f5f9'
          }}
          onClick={() => toggleSection('summary')}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} />
            System Status Summary
          </h3>
          
          {expandedSections.summary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {expandedSections.summary && (
          <div style={{ padding: '16px' }}>
            <div style={{ 
              display: 'flex',
              marginBottom: '16px',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                flex: 1,
                padding: '16px',
                backgroundColor: getStatusColor(overallStatus),
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>Overall Status</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {overallStatus}
                </div>
              </div>
              
              <div style={{ 
                flex: 1,
                padding: '16px',
                backgroundColor: criticalAlertsCount > 0 ? '#ef4444' : '#22c55e',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>Critical Alerts</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {criticalAlertsCount}
                </div>
              </div>
              
              <div style={{ 
                flex: 1,
                padding: '16px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>Components</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {components.length}
                </div>
              </div>
            </div>
            
            {/* Status counts */}
            <div style={{ 
              display: 'flex',
              gap: '8px'
            }}>
              <div style={{ 
                flex: 1,
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ 
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(ComponentStatus.HEALTHY),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <CheckCircle size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {getStatusCount(ComponentStatus.HEALTHY)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Healthy
                  </div>
                </div>
              </div>
              
              <div style={{ 
                flex: 1,
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ 
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(ComponentStatus.WARNING),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {getStatusCount(ComponentStatus.WARNING)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Warning
                  </div>
                </div>
              </div>
              
              <div style={{ 
                flex: 1,
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ 
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(ComponentStatus.ERROR),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <AlertCircle size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {getStatusCount(ComponentStatus.ERROR)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Error
                  </div>
                </div>
              </div>
              
              <div style={{ 
                flex: 1,
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ 
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(ComponentStatus.OFFLINE),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <Server size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {getStatusCount(ComponentStatus.OFFLINE)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Offline
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Alerts section */}
      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: '#f1f5f9',
            position: 'relative'
          }}
          onClick={() => toggleSection('alerts')}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            Active Alerts
          </h3>
          
          {criticalAlertsCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '140px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {criticalAlertsCount}
            </div>
          )}
          
          {expandedSections.alerts ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {expandedSections.alerts && (
          <div style={{ 
            padding: alerts.length > 0 ? '0' : '16px', 
            maxHeight: '300px', 
            overflowY: 'auto'
          }}>
            {alerts.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>
                      Level
                    </th>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>
                      Component
                    </th>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>
                      Message
                    </th>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>
                      Time
                    </th>
                    <th style={{ padding: '8px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alerts
                    .filter(alert => !alert.acknowledged)
                    .sort((a, b) => {
                      // Sort by level (critical first) then by timestamp (newest first)
                      const levelOrder = { critical: 0, error: 1, warning: 2, info: 3 };
                      const levelDiff = levelOrder[a.level] - levelOrder[b.level];
                      if (levelDiff !== 0) return levelDiff;
                      return b.timestamp.getTime() - a.timestamp.getTime();
                    })
                    .map(alert => {
                      // Find component by ID
                      const component = components.find(c => c.id === alert.componentId);
                      
                      // Determine level color
                      let levelColor = '#64748b';
                      switch (alert.level) {
                        case 'critical':
                          levelColor = '#ef4444';
                          break;
                        case 'error':
                          levelColor = '#f97316';
                          break;
                        case 'warning':
                          levelColor = '#f59e0b';
                          break;
                        case 'info':
                          levelColor = '#0ea5e9';
                          break;
                      }
                      
                      return (
                        <tr key={alert.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ 
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: levelColor,
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {alert.level}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {component?.name || alert.componentId}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {alert.message}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>
                            {formatDate(alert.timestamp)}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleAlertAcknowledge(alert.id)}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: 'pointer'
                              }}
                            >
                              Acknowledge
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '16px' }}>
                No active alerts
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Components section */}
      <div style={{ borderBottom: expandedSections.components ? '1px solid #e2e8f0' : 'none' }}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: '#f1f5f9'
          }}
          onClick={() => toggleSection('components')}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} />
            System Components
          </h3>
          
          {expandedSections.components ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {expandedSections.components && (
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto'
          }}>
            {components.map(component => (
              <div 
                key={component.id}
                style={{ 
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: selectedComponent === component.id ? '#f1f5f9' : 'transparent'
                }}
              >
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleComponentClick(component.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{ 
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0f172a'
                    }}>
                      {getComponentIcon(component)}
                    </div>
                    
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {component.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>
                        {component.description}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getStatusIcon(component.status)}
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        color: getStatusColor(component.status),
                        textTransform: 'capitalize'
                      }}>
                        {component.status}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      {formatDate(component.lastUpdated)}
                    </div>
                    
                    {selectedComponent === component.id ? 
                      <ChevronUp size={16} /> : 
                      <ChevronDown size={16} />
                    }
                  </div>
                </div>
                
                {/* Component details */}
                {selectedComponent === component.id && (
                  <div style={{ padding: '0 16px 16px 68px' }}>
                    {/* Metrics */}
                    {component.metrics.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                          Metrics
                        </h4>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: '8px'
                        }}>
                          {component.metrics.map(metric => {
                            const metricKey = `${component.id}-${metric.name}`;
                            const isVisible = visibleMetrics[metricKey] !== false;
                            
                            return (
                              <div 
                                key={metric.name}
                                style={{ 
                                  padding: '8px 12px',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: '4px',
                                  border: '1px solid #e2e8f0'
                                }}
                              >
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  marginBottom: '4px'
                                }}>
                                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                    {metric.name}
                                  </div>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMetricVisibility(component.id, metric.name);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '4px'
                                    }}
                                  >
                                    {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                  </button>
                                </div>
                                
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center' 
                                }}>
                                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                    {formatMetricValue(metric)}
                                  </div>
                                  
                                  {metric.status && (
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      {getStatusIcon(metric.status)}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Metric history chart would go here */}
                                {isVisible && metric.history && metric.history.length > 0 && (
                                  <div style={{ 
                                    height: '40px',
                                    marginTop: '8px',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '4px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}>
                                    {/* Simple mock chart visualization */}
                                    <div style={{ 
                                      position: 'absolute',
                                      bottom: '0',
                                      left: '0',
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'flex-end'
                                    }}>
                                      {metric.history.map((point, index) => {
                                        // Convert value to number for visualization
                                        let value = typeof point.value === 'number' ? 
                                          point.value : 
                                          parseFloat(String(point.value)) || 0;
                                        
                                        // Normalize to 0-1 range
                                        const maxValue = Math.max(...metric.history!
                                          .map(p => typeof p.value === 'number' ? 
                                            p.value : 
                                            parseFloat(String(p.value)) || 0
                                          )
                                        );
                                        
                                        const normalizedValue = maxValue === 0 ? 0 : value / maxValue;
                                        
                                        return (
                                          <div 
                                            key={index}
                                            style={{
                                              flex: 1,
                                              height: `${normalizedValue * 100}%`,
                                              backgroundColor: '#0ea5e9',
                                              margin: '0 1px'
                                            }}
                                          />
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Dependencies */}
                    {component.dependencies.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                          Dependencies
                        </h4>
                        
                        <div style={{ 
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          {component.dependencies.map(dependencyId => {
                            const dependency = components.find(c => c.id === dependencyId);
                            
                            return (
                              <div 
                                key={dependencyId}
                                style={{ 
                                  padding: '4px 12px',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: '9999px',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '14px'
                                }}
                              >
                                {dependency && getStatusIcon(dependency.status)}
                                <span>{dependency?.name || dependencyId}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Additional details */}
                    {component.details && Object.keys(component.details).length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                          Additional Details
                        </h4>
                        
                        <div style={{ 
                          backgroundColor: '#f8fafc',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                          padding: '12px',
                          fontSize: '14px'
                        }}>
                          {Object.entries(component.details).map(([key, value]) => (
                            <div 
                              key={key}
                              style={{ 
                                display: 'flex', 
                                marginBottom: '4px',
                                borderBottom: '1px solid #f1f5f9',
                                paddingBottom: '4px'
                              }}
                            >
                              <div style={{ 
                                width: '160px',
                                fontWeight: 'bold',
                                color: '#64748b'
                              }}>
                                {key}
                              </div>
                              <div>
                                {typeof value === 'object' ? 
                                  JSON.stringify(value) : 
                                  String(value)
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* CSS for animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};