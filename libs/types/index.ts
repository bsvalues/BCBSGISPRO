/**
 * Core types for the TerraFusion platform
 * 
 * This file contains standardized type definitions used across all modules.
 * These types ensure consistency in data flow and prevent type errors during
 * integration between components.
 */

/**
 * Basic geographical coordinates
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Bounding box for map extents
 */
export interface BoundingBox {
  northEast: Coordinates;
  southWest: Coordinates;
}

/**
 * Map provider options
 */
export type MapProviderType = 'mapbox' | 'leaflet' | 'arcgis';

// For backward compatibility
export type MapProvider = MapProviderType;

/**
 * Map layer types
 */
export type LayerType = 'vector' | 'raster' | 'point' | 'line' | 'polygon' | 'imagery';

/**
 * Base layer interface
 */
export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  visible?: boolean;
  opacity?: number;
  zIndex?: number;
  description?: string;
}

/**
 * Vector layer with source data
 */
export interface VectorLayer extends BaseLayer {
  type: 'vector' | 'point' | 'line' | 'polygon';
  source: string | object;
  style?: object;
  filter?: object | Function;
}

/**
 * Raster layer with source data
 */
export interface RasterLayer extends BaseLayer {
  type: 'raster' | 'imagery';
  url: string;
  attribution?: string;
  tileSize?: number;
}

/**
 * Union type for all layer types
 */
export type Layer = VectorLayer | RasterLayer;

/**
 * Map view state
 */
export interface MapViewState {
  center: Coordinates;
  zoom: number;
  bearing?: number;
  pitch?: number;
  bounds?: BoundingBox;
}

/**
 * Measurement types
 */
export type MeasurementType = 'distance' | 'area' | 'angle';

/**
 * Units for measurements
 */
export type DistanceUnit = 'meters' | 'kilometers' | 'feet' | 'miles' | 'yards';
export type AreaUnit = 'squareMeters' | 'squareKilometers' | 'acres' | 'squareFeet' | 'squareMiles';
export type AngleUnit = 'degrees' | 'radians';

/**
 * Distance measurement
 */
export interface DistanceMeasurement {
  type: 'distance';
  start: Coordinates;
  end: Coordinates;
  distance: number; // in meters
  units: Record<DistanceUnit, number>;
}

/**
 * Area measurement
 */
export interface AreaMeasurement {
  type: 'area';
  coordinates: Coordinates[];
  area: number; // in square meters
  units: Record<AreaUnit, number>;
}

/**
 * Angle measurement
 */
export interface AngleMeasurement {
  type: 'angle';
  vertex: Coordinates;
  point1: Coordinates;
  point2: Coordinates;
  angle: number; // in degrees
  units: Record<AngleUnit, number>;
}

/**
 * Union type for all measurement types
 */
export type Measurement = DistanceMeasurement | AreaMeasurement | AngleMeasurement;

/**
 * Print/export options
 */
export interface PrintExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  width?: number;
  height?: number;
  dpi?: number;
  includeAttribution?: boolean;
  includeScale?: boolean;
  includeNorth?: boolean;
  includeTitle?: boolean;
  title?: string;
}

/**
 * County status
 */
export type CountyStatus = 'active' | 'inactive' | 'pending' | 'archived' | 'draft';

/**
 * Basic county information
 */
export interface County {
  id: string;
  name: string;
  state: string;
  status: CountyStatus;
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
 * GIS data source
 */
export interface GISDataSource {
  id: string;
  name: string;
  type: 'shapefile' | 'geojson' | 'gdb' | 'arcgis_service' | 'wms' | 'wfs' | 'other';
  url?: string;
  filePath?: string;
  description?: string;
  lastUpdated?: Date;
  status: 'ready' | 'processing' | 'error' | 'not_started';
  error?: string;
}

/**
 * Valuation system
 */
export interface ValuationSystem {
  id: string;
  name: string;
  type: 'cama' | 'custom' | 'integrated' | 'manual' | 'other';
  url?: string;
  apiKey?: string;
  connectionStatus: 'connected' | 'disconnected' | 'pending' | 'not_configured';
  lastSync?: Date;
}

/**
 * Tax system
 */
export interface TaxSystem {
  id: string;
  name: string;
  type: 'integrated' | 'custom' | 'manual' | 'other';
  url?: string;
  apiKey?: string;
  connectionStatus: 'connected' | 'disconnected' | 'pending' | 'not_configured';
  lastSync?: Date;
}

/**
 * County data access configuration
 */
export interface DataAccess {
  parcelLayers: string[];
  zoningSources: string[];
  dataRefreshSchedule?: 'daily' | 'weekly' | 'monthly' | 'manual';
  dataSecurityLevel: 'public' | 'private' | 'restricted';
  apiAccessEnabled: boolean;
  exportFormats: Array<'shapefile' | 'geojson' | 'csv' | 'pdf'>;
}

/**
 * County configuration for onboarding and management
 */
export interface CountyConfig {
  id: string;
  name: string;
  state: string;
  status: CountyStatus;
  createdAt: Date;
  lastUpdated: Date;
  properties: {
    population?: number;
    area?: number;
    parcelCount?: number;
  };
  contacts: Array<{
    name: string;
    role: string;
    email: string;
    phone?: string;
  }>;
  gisDataSources: GISDataSource[];
  valuationSystem?: ValuationSystem;
  taxSystem?: TaxSystem;
  dataAccess?: DataAccess;
  validationIssues: Array<{
    type: 'error' | 'warning';
    message: string;
    component: string;
    resolved: boolean;
  }>;
}

/**
 * User role
 */
export type UserRole = 'admin' | 'manager' | 'editor' | 'viewer';

/**
 * User status
 */
export type UserStatus = 'active' | 'inactive' | 'pending';

/**
 * User information
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  countyIds: string[];
  permissions: string[];
}

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
 * System alert level
 */
export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

/**
 * System alert
 */
export interface SystemAlert {
  id: string;
  componentId: string;
  level: AlertLevel;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  details?: Record<string, any>;
}

/**
 * Event type
 */
export type EventType = 'user' | 'system' | 'county' | 'data' | 'security';

/**
 * Event severity
 */
export type EventSeverity = 'info' | 'warning' | 'error';

/**
 * Admin event
 */
export interface AdminEvent {
  id: string;
  type: EventType;
  action: string;
  timestamp: Date;
  userId?: string;
  details: Record<string, any>;
  severity: EventSeverity;
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
 * Legal description parsing result
 */
export interface LegalDescriptionParseResult {
  property: {
    type: string;
    description: string;
    section?: string;
    township?: string;
    range?: string;
    meridian?: string;
    lotNumber?: string;
    blockNumber?: string;
    subdivision?: string;
    county?: string;
    state?: string;
  };
  boundaries: {
    points: Coordinates[];
    area?: number;
  };
  confidence: number;
  warnings: string[];
}

/**
 * CSV parsing options
 */
export interface CSVParseOptions {
  delimiter?: string;
  columns?: boolean | string[] | ((record: string[], options?: any) => string[]);
  skip_empty_lines?: boolean;
  skip_lines_with_error?: boolean;
  from_line?: number;
  to_line?: number;
  ltrim?: boolean;
  rtrim?: boolean;
  trim?: boolean;
  cast?: boolean;
  cast_date?: boolean;
  comment?: string;
  relax_quotes?: boolean;
  bom?: boolean;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  field: string | number | ((record: Record<string, any>) => any);
  name: string;
  validate: (value: any, record: Record<string, any>) => boolean;
  message?: string | ((value: any, record: Record<string, any>) => string);
  level?: 'error' | 'warning';
}

/**
 * Transformation rule
 */
export interface TransformationRule {
  field: string | number | ((record: Record<string, any>) => any);
  name: string;
  transform: (value: any, record: Record<string, any>) => any;
}

/**
 * Validation error
 */
export interface ValidationError {
  row: number;
  field: string;
  value: any;
  rule: string;
  message: string;
  level: 'error' | 'warning';
}

/**
 * CSV import result
 */
export interface CSVImportResult<T> {
  // Parsed data
  data: T[];
  
  // Original raw data
  rawData: string[][];
  
  // Import metadata
  metadata: {
    rowCount: number;
    columnCount: number;
    headers: string[];
    startTime: Date;
    endTime: Date;
    duration: number;
  };
  
  // Validation results
  validationResults: {
    valid: boolean;
    errors: ValidationError[];
    warningCount: number;
    errorCount: number;
  };
}

/**
 * Filter criteria
 */
export interface FilterCriteria {
  field: string | number | ((record: Record<string, any>) => any);
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'matches' | 'is_empty' | 'is_not_empty' | 'custom';
  value?: any;
  custom?: (value: any, record: Record<string, any>) => boolean;
}

/**
 * Application settings
 */
export interface AppSettings {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  mapProvider: MapProvider;
  defaultCountyId: string | null;
}

/**
 * Logger level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  tags: string[];
  data?: Record<string, any>;
}