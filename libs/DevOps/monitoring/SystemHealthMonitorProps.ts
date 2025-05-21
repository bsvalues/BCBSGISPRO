/**
 * SystemHealthMonitor Props Interface
 * 
 * This file defines the prop interface for the SystemHealthMonitor component,
 * using the standardized types from the shared types library.
 */

import { SystemComponent, SystemAlert, ComponentStatus } from '../../../libs/types';

/**
 * Dashboard view mode
 */
export type HealthDashboardView = 'summary' | 'components' | 'alerts' | 'metrics' | 'logs';

/**
 * Props for the SystemHealthMonitor component
 */
export interface SystemHealthMonitorProps {
  // System components to monitor
  components?: SystemComponent[];
  
  // System alerts to display
  alerts?: SystemAlert[];
  
  // Current dashboard view
  currentView?: HealthDashboardView;
  
  // Auto-refresh interval in milliseconds
  refreshInterval?: number;
  
  // Whether to auto-refresh
  autoRefresh?: boolean;
  
  // Filter options
  showHealthyComponents?: boolean;
  showWarningComponents?: boolean;
  showErrorComponents?: boolean;
  showOfflineComponents?: boolean;
  
  // Alert filter options
  alertLevelFilter?: Array<'info' | 'warning' | 'error' | 'critical'>;
  showAcknowledgedAlerts?: boolean;
  
  // Whether the dashboard is in a loading state
  isLoading?: boolean;
  
  // Error message to display (if any)
  error?: string;
  
  // Event handlers
  onViewChange?: (view: HealthDashboardView) => void;
  onComponentSelect?: (componentId: string) => void;
  onAlertAcknowledge?: (alertId: string) => void;
  onRefresh?: () => void;
  onExportStatus?: (format: 'pdf' | 'csv' | 'json') => void;
  onStatusChange?: (componentId: string, newStatus: ComponentStatus) => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}