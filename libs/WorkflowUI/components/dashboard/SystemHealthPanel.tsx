/**
 * System Health Panel Component
 * 
 * This component provides a real-time dashboard for monitoring the health
 * of various platform components and services.
 */

import React, { useState, useEffect } from 'react';
import { 
  healthCheckRegistry, 
  HealthStatus,
  HealthCheckResult
} from '../../../../libs/DevOps/monitoring/health-check';

// Health status color mapping
const statusColors = {
  [HealthStatus.HEALTHY]: '#10b981', // Green
  [HealthStatus.DEGRADED]: '#f59e0b', // Yellow
  [HealthStatus.UNHEALTHY]: '#ef4444', // Red
  [HealthStatus.UNKNOWN]: '#6b7280'   // Gray
};

// Health status icon mapping
const statusIcons = {
  [HealthStatus.HEALTHY]: '✓',
  [HealthStatus.DEGRADED]: '⚠',
  [HealthStatus.UNHEALTHY]: '✗',
  [HealthStatus.UNKNOWN]: '?'
};

interface SystemHealthPanelProps {
  title?: string;
  refreshInterval?: number;
  showDetails?: boolean;
  showDependencies?: boolean;
  maxHeight?: string;
  className?: string;
  style?: React.CSSProperties;
  onHealthStatusChange?: (isHealthy: boolean) => void;
}

/**
 * System Health Panel Component
 */
export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  title = 'System Health',
  refreshInterval = 60000, // Default refresh: 1 minute
  showDetails = true,
  showDependencies = false,
  maxHeight = '400px',
  className = '',
  style = {},
  onHealthStatusChange
}) => {
  // State for health check results
  const [healthResults, setHealthResults] = useState<HealthCheckResult | null>(null);
  
  // State for loading status
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for error
  const [error, setError] = useState<string | null>(null);
  
  // State for overall system health
  const [systemHealthy, setSystemHealthy] = useState<boolean>(true);

  // State for expanded items
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Function to fetch health check data
  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Execute all health checks
      const results = await healthCheckRegistry.runAll();
      
      // Update state with results
      setHealthResults(results);
      
      // Determine overall system health
      const isHealthy = results.status === HealthStatus.HEALTHY;
      setSystemHealthy(isHealthy);
      
      // Notify parent component of health status change
      if (onHealthStatusChange) {
        onHealthStatusChange(isHealthy);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(`Failed to fetch health data: ${err.message}`);
      setLoading(false);
      
      // Notify parent component of health status change
      if (onHealthStatusChange) {
        onHealthStatusChange(false);
      }
    }
  };
  
  // Fetch health data on component mount and at intervals
  useEffect(() => {
    // Initial fetch
    fetchHealthData();
    
    // Set up interval for periodic fetching
    const intervalId = setInterval(fetchHealthData, refreshInterval);
    
    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);
  
  // Toggle expansion of a health check item
  const toggleExpand = (name: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };
  
  // Render a health check result
  const renderHealthCheckItem = (result: HealthCheckResult, level: number = 0) => {
    const isExpanded = expandedItems[result.name] || false;
    const hasDependencies = result.dependencies && result.dependencies.length > 0;
    const showToggle = showDependencies && hasDependencies;
    
    return (
      <div 
        key={result.name}
        className="health-check-item"
        style={{
          marginLeft: `${level * 16}px`,
          marginBottom: '8px',
          padding: '8px 12px',
          borderRadius: '4px',
          backgroundColor: level === 0 ? '#f9fafb' : 'transparent',
          border: level === 0 ? '1px solid #e5e7eb' : 'none'
        }}
      >
        <div className="health-check-header" style={{ display: 'flex', alignItems: 'center' }}>
          {/* Status indicator */}
          <div 
            className="status-indicator"
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: statusColors[result.status],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              marginRight: '8px'
            }}
          >
            {statusIcons[result.status]}
          </div>
          
          {/* Health check name */}
          <div className="health-check-name" style={{ fontWeight: 'bold', flex: 1 }}>
            {result.name}
          </div>
          
          {/* Toggle button for dependencies */}
          {showToggle && (
            <button 
              onClick={() => toggleExpand(result.name)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '18px'
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>
        
        {/* Health check details */}
        {showDetails && (
          <div 
            className="health-check-details"
            style={{ 
              marginTop: '4px',
              fontSize: '13px',
              color: '#6b7280',
              paddingLeft: '24px'
            }}
          >
            <div>Status: <span style={{ color: statusColors[result.status] }}>{result.status}</span></div>
            {result.message && <div>Message: {result.message}</div>}
            <div>Checked: {new Date(result.timestamp).toLocaleTimeString()}</div>
            <div>Duration: {result.duration}ms</div>
            
            {/* Additional details */}
            {showDetails && result.details && Object.keys(result.details).length > 0 && (
              <div 
                className="additional-details"
                style={{ 
                  marginTop: '4px',
                  fontSize: '12px'
                }}
              >
                <details>
                  <summary>Details</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
        
        {/* Dependencies */}
        {showDependencies && isExpanded && result.dependencies && result.dependencies.length > 0 && (
          <div className="dependencies" style={{ marginTop: '8px', marginLeft: '12px' }}>
            {result.dependencies.map(dep => renderHealthCheckItem(dep, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // Calculate overall status summary
  const calculateSummary = (result: HealthCheckResult | null): {
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
    total: number;
  } => {
    if (!result || !result.dependencies) {
      return { healthy: 0, degraded: 0, unhealthy: 0, unknown: 0, total: 0 };
    }
    
    // Start with the main check
    let summary = {
      healthy: result.status === HealthStatus.HEALTHY ? 1 : 0,
      degraded: result.status === HealthStatus.DEGRADED ? 1 : 0,
      unhealthy: result.status === HealthStatus.UNHEALTHY ? 1 : 0,
      unknown: result.status === HealthStatus.UNKNOWN ? 1 : 0,
      total: 1
    };
    
    // Add dependencies
    for (const dep of result.dependencies) {
      const depSummary = calculateSummary(dep);
      summary.healthy += depSummary.healthy;
      summary.degraded += depSummary.degraded;
      summary.unhealthy += depSummary.unhealthy;
      summary.unknown += depSummary.unknown;
      summary.total += depSummary.total;
    }
    
    return summary;
  };
  
  // Render the overall health status
  const renderOverallStatus = () => {
    if (!healthResults) return null;
    
    const summary = calculateSummary(healthResults);
    
    // Calculate percentages
    const healthyPercent = (summary.healthy / summary.total) * 100;
    const degradedPercent = (summary.degraded / summary.total) * 100;
    const unhealthyPercent = (summary.unhealthy / summary.total) * 100;
    const unknownPercent = (summary.unknown / summary.total) * 100;
    
    return (
      <div className="overall-status">
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Overall Status: 
          <span style={{ color: statusColors[healthResults.status], marginLeft: '4px' }}>
            {healthResults.status.toUpperCase()}
          </span>
        </div>
        
        {/* Status bars */}
        <div className="status-bars" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', width: '100%', marginBottom: '4px' }}>
            {healthyPercent > 0 && (
              <div style={{ width: `${healthyPercent}%`, backgroundColor: statusColors[HealthStatus.HEALTHY] }}></div>
            )}
            {degradedPercent > 0 && (
              <div style={{ width: `${degradedPercent}%`, backgroundColor: statusColors[HealthStatus.DEGRADED] }}></div>
            )}
            {unhealthyPercent > 0 && (
              <div style={{ width: `${unhealthyPercent}%`, backgroundColor: statusColors[HealthStatus.UNHEALTHY] }}></div>
            )}
            {unknownPercent > 0 && (
              <div style={{ width: `${unknownPercent}%`, backgroundColor: statusColors[HealthStatus.UNKNOWN] }}></div>
            )}
          </div>
          
          <div className="status-legend" style={{ display: 'flex', fontSize: '12px', color: '#6b7280' }}>
            <div style={{ marginRight: '16px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: statusColors[HealthStatus.HEALTHY], marginRight: '4px' }}></span>
              Healthy: {summary.healthy}
            </div>
            <div style={{ marginRight: '16px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: statusColors[HealthStatus.DEGRADED], marginRight: '4px' }}></span>
              Degraded: {summary.degraded}
            </div>
            <div style={{ marginRight: '16px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: statusColors[HealthStatus.UNHEALTHY], marginRight: '4px' }}></span>
              Unhealthy: {summary.unhealthy}
            </div>
            <div>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: statusColors[HealthStatus.UNKNOWN], marginRight: '4px' }}></span>
              Unknown: {summary.unknown}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div 
      className={`system-health-panel ${className}`}
      style={{
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        ...style
      }}
    >
      {/* Panel header */}
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{title}</h2>
        
        <div className="actions">
          <button 
            onClick={fetchHealthData}
            disabled={loading}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && !healthResults && (
        <div className="loading" style={{ textAlign: 'center', padding: '16px' }}>
          Loading health data...
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div 
          className="error"
          style={{ 
            padding: '12px',
            borderRadius: '4px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            marginBottom: '16px'
          }}
        >
          {error}
        </div>
      )}
      
      {/* Health results */}
      {healthResults && (
        <div className="health-results" style={{ maxHeight, overflowY: 'auto' }}>
          {/* Overall status */}
          {renderOverallStatus()}
          
          {/* Individual health checks */}
          <div className="health-checks">
            {renderHealthCheckItem(healthResults)}
          </div>
        </div>
      )}
      
      {/* Last refreshed timestamp */}
      {healthResults && (
        <div className="last-refreshed" style={{ fontSize: '12px', color: '#6b7280', marginTop: '16px', textAlign: 'right' }}>
          Last refreshed: {new Date().toLocaleString()}
        </div>
      )}
    </div>
  );
};