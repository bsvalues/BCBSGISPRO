/**
 * Mock data for development and testing
 * 
 * This file contains mock data for the application to use during development.
 * In a production environment, this would be replaced with actual API calls.
 */

import { 
  County, 
  GISDataSource, 
  Layer, 
  SystemComponent, 
  SystemAlert,
  AdminEvent,
  ComponentStatus,
  AlertLevel,
  EventType,
  EventSeverity
} from '../libs/types';

/**
 * Mock counties data
 */
export const counties: County[] = [
  {
    id: '1',
    name: 'Benton County',
    state: 'WA',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    lastUpdated: new Date('2025-04-15'),
    properties: {
      population: 205700,
      area: 1760,
      parcelCount: 78250,
      gisReady: true,
      valuationSystemIntegrated: true,
      taxSystemIntegrated: false
    },
    contacts: [
      {
        name: 'John Smith',
        role: 'Assessor',
        email: 'jsmith@bentoncounty.gov',
        phone: '509-555-1234'
      },
      {
        name: 'Sarah Johnson',
        role: 'GIS Manager',
        email: 'sjohnson@bentoncounty.gov',
        phone: '509-555-5678'
      }
    ]
  },
  {
    id: '2',
    name: 'Franklin County',
    state: 'WA',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    lastUpdated: new Date('2025-03-20'),
    properties: {
      population: 95500,
      area: 1265,
      parcelCount: 42300,
      gisReady: true,
      valuationSystemIntegrated: false,
      taxSystemIntegrated: false
    },
    contacts: [
      {
        name: 'Michael Davis',
        role: 'Assessor',
        email: 'mdavis@franklincounty.gov',
        phone: '509-555-4321'
      }
    ]
  },
  {
    id: '3',
    name: 'Grant County',
    state: 'WA',
    status: 'pending',
    createdAt: new Date('2025-03-15'),
    lastUpdated: new Date('2025-04-10'),
    properties: {
      population: 97800,
      area: 2680,
      parcelCount: 56200,
      gisReady: false,
      valuationSystemIntegrated: false,
      taxSystemIntegrated: false
    },
    contacts: []
  }
];

/**
 * Mock GIS data sources
 */
export const gisDataSources: GISDataSource[] = [
  {
    id: '1',
    name: 'Benton County Parcels',
    type: 'arcgis_service',
    url: 'https://services.arcgis.com/benton-county/parcels',
    description: 'Primary parcel layer for Benton County',
    lastUpdated: new Date('2025-04-10'),
    status: 'ready'
  },
  {
    id: '2',
    name: 'Benton County Zoning',
    type: 'arcgis_service',
    url: 'https://services.arcgis.com/benton-county/zoning',
    description: 'Zoning boundaries for Benton County',
    lastUpdated: new Date('2025-03-15'),
    status: 'ready'
  },
  {
    id: '3',
    name: 'Benton County Roads',
    type: 'arcgis_service',
    url: 'https://services.arcgis.com/benton-county/roads',
    description: 'Road network for Benton County',
    lastUpdated: new Date('2025-02-20'),
    status: 'ready'
  },
  {
    id: '4',
    name: 'Franklin County Parcels',
    type: 'shapefile',
    filePath: '/data/franklin/parcels.shp',
    description: 'Primary parcel layer for Franklin County',
    lastUpdated: new Date('2025-03-05'),
    status: 'ready'
  },
  {
    id: '5',
    name: 'Grant County Parcels (Draft)',
    type: 'geojson',
    filePath: '/data/grant/parcels.geojson',
    description: 'Draft parcel layer for Grant County',
    lastUpdated: new Date('2025-04-01'),
    status: 'processing',
    error: 'Incomplete boundaries detected'
  }
];

/**
 * Mock map layers
 */
export const mapLayers: Layer[] = [
  {
    id: 'parcels',
    name: 'Parcels',
    type: 'vector',
    visible: true,
    opacity: 1.0,
    zIndex: 10,
    description: 'County parcels with property information',
    source: 'https://services.arcgis.com/benton-county/parcels'
  },
  {
    id: 'zoning',
    name: 'Zoning',
    type: 'vector',
    visible: true,
    opacity: 0.7,
    zIndex: 5,
    description: 'County zoning districts',
    source: 'https://services.arcgis.com/benton-county/zoning'
  },
  {
    id: 'roads',
    name: 'Roads',
    type: 'vector',
    visible: true,
    opacity: 1.0,
    zIndex: 15,
    description: 'County road network',
    source: 'https://services.arcgis.com/benton-county/roads'
  },
  {
    id: 'aerial',
    name: 'Aerial Imagery',
    type: 'raster',
    visible: false,
    opacity: 1.0,
    zIndex: 1,
    description: 'Recent aerial imagery',
    url: 'https://services.arcgis.com/benton-county/aerial',
    attribution: '© Benton County GIS'
  },
  {
    id: 'pending_subdivisions',
    name: 'Pending Subdivisions',
    type: 'polygon',
    visible: false,
    opacity: 0.6,
    zIndex: 11,
    description: 'Pending subdivision applications',
    source: 'https://services.arcgis.com/benton-county/pending-subdivisions'
  }
];

/**
 * Mock system components
 */
export const systemComponents: SystemComponent[] = [
  {
    id: 'map-service',
    name: 'Map Service',
    description: 'Core mapping and spatial data service',
    status: ComponentStatus.HEALTHY,
    lastUpdated: new Date(),
    metrics: [
      {
        name: 'Response Time',
        value: 45,
        unit: 'ms',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 200,
          error: 500
        }
      },
      {
        name: 'Requests per Minute',
        value: 127,
        unit: 'rpm',
        timestamp: new Date()
      },
      {
        name: 'Error Rate',
        value: 0.01,
        unit: '%',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 1,
          error: 5
        }
      }
    ],
    dependencies: ['database', 'authentication']
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Central database for application data',
    status: ComponentStatus.HEALTHY,
    lastUpdated: new Date(),
    metrics: [
      {
        name: 'Query Time',
        value: 12,
        unit: 'ms',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 50,
          error: 200
        }
      },
      {
        name: 'Connections',
        value: 35,
        unit: '',
        timestamp: new Date()
      },
      {
        name: 'Disk Usage',
        value: 67,
        unit: '%',
        timestamp: new Date(),
        status: ComponentStatus.WARNING,
        thresholds: {
          warning: 60,
          error: 85
        }
      }
    ],
    dependencies: []
  },
  {
    id: 'authentication',
    name: 'Authentication Service',
    description: 'User authentication and authorization',
    status: ComponentStatus.WARNING,
    lastUpdated: new Date(),
    metrics: [
      {
        name: 'Response Time',
        value: 187,
        unit: 'ms',
        timestamp: new Date(),
        status: ComponentStatus.WARNING,
        thresholds: {
          warning: 150,
          error: 500
        }
      },
      {
        name: 'Active Sessions',
        value: 42,
        unit: '',
        timestamp: new Date()
      },
      {
        name: 'Failed Logins',
        value: 3,
        unit: 'per hour',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 10,
          error: 20
        }
      }
    ],
    dependencies: ['database']
  },
  {
    id: 'valuation-engine',
    name: 'Valuation Engine',
    description: 'Property valuation and analysis service',
    status: ComponentStatus.ERROR,
    lastUpdated: new Date(),
    metrics: [
      {
        name: 'Request Processing Time',
        value: 890,
        unit: 'ms',
        timestamp: new Date(),
        status: ComponentStatus.ERROR,
        thresholds: {
          warning: 300,
          error: 600
        }
      },
      {
        name: 'Queue Length',
        value: 12,
        unit: '',
        timestamp: new Date(),
        status: ComponentStatus.WARNING,
        thresholds: {
          warning: 10,
          error: 25
        }
      }
    ],
    dependencies: ['database', 'map-service']
  },
  {
    id: 'document-service',
    name: 'Document Service',
    description: 'Document storage and management',
    status: ComponentStatus.OFFLINE,
    lastUpdated: new Date(),
    metrics: [],
    dependencies: ['database', 'storage-service']
  },
  {
    id: 'storage-service',
    name: 'Storage Service',
    description: 'File storage service',
    status: ComponentStatus.UNKNOWN,
    lastUpdated: new Date(),
    metrics: [],
    dependencies: []
  }
];

/**
 * Mock system alerts
 */
export const systemAlerts: SystemAlert[] = [
  {
    id: '1',
    componentId: 'database',
    level: 'warning',
    message: 'Database disk usage above 60%',
    timestamp: new Date(Date.now() - 3600000),
    acknowledged: false,
    details: {
      currentUsage: '67%',
      trend: 'increasing',
      timeToThreshold: '~48 hours'
    }
  },
  {
    id: '2',
    componentId: 'authentication',
    level: 'warning',
    message: 'Authentication service response time degraded',
    timestamp: new Date(Date.now() - 7200000),
    acknowledged: true,
    details: {
      currentResponseTime: '187ms',
      normalResponseTime: '95ms',
      possibleCause: 'Increased load or network latency'
    }
  },
  {
    id: '3',
    componentId: 'valuation-engine',
    level: 'error',
    message: 'Valuation engine processing error',
    timestamp: new Date(Date.now() - 1800000),
    acknowledged: false,
    details: {
      errorMessage: 'Failed to connect to external data source',
      affectedCounties: ['Benton County'],
      impactedFunctionality: 'Automated property valuations'
    }
  },
  {
    id: '4',
    componentId: 'document-service',
    level: 'critical',
    message: 'Document service offline',
    timestamp: new Date(Date.now() - 900000),
    acknowledged: false,
    details: {
      failureReason: 'Service container crashed',
      lastSuccessfulHealthCheck: new Date(Date.now() - 950000),
      autoRecoveryStatus: 'In progress'
    }
  }
];

/**
 * Mock admin events
 */
export const adminEvents: AdminEvent[] = [
  {
    id: '1',
    type: 'user',
    action: 'User login',
    timestamp: new Date(Date.now() - 300000),
    userId: 'user-123',
    details: {
      username: 'admin',
      ipAddress: '192.168.1.100',
      browser: 'Chrome 112.0.0.0'
    },
    severity: 'info'
  },
  {
    id: '2',
    type: 'county',
    action: 'County data updated',
    timestamp: new Date(Date.now() - 600000),
    userId: 'user-123',
    details: {
      countyId: '1',
      countyName: 'Benton County',
      dataType: 'Parcels',
      changeCount: 47
    },
    severity: 'info'
  },
  {
    id: '3',
    type: 'system',
    action: 'Backup completed',
    timestamp: new Date(Date.now() - 3600000),
    details: {
      backupSize: '4.5GB',
      duration: '12 minutes',
      location: 'cloud-backup-2025-05-20'
    },
    severity: 'info'
  },
  {
    id: '4',
    type: 'security',
    action: 'Failed login attempts',
    timestamp: new Date(Date.now() - 7200000),
    details: {
      username: 'admin',
      ipAddress: '203.0.113.42',
      attemptCount: 5
    },
    severity: 'warning'
  },
  {
    id: '5',
    type: 'data',
    action: 'Valuation model updated',
    timestamp: new Date(Date.now() - 86400000),
    userId: 'user-456',
    details: {
      modelId: 'residential-2025',
      changeDescription: 'Updated coefficients for lot size factors',
      approvalStatus: 'pending'
    },
    severity: 'info'
  }
];

/**
 * Dashboard summary statistics
 */
export const dashboardSummary = {
  userCount: 58,
  countyCount: 3,
  activeCountyCount: 2,
  totalParcelCount: 176750,
  systemHealthScore: 85,
  pendingTasks: 12,
  recentEvents: adminEvents.slice(0, 3)
};

/**
 * System health statistics
 */
export const healthStatistics = {
  componentsByStatus: {
    [ComponentStatus.HEALTHY]: 2,
    [ComponentStatus.WARNING]: 1,
    [ComponentStatus.ERROR]: 1,
    [ComponentStatus.OFFLINE]: 1,
    [ComponentStatus.UNKNOWN]: 1
  },
  alertsByLevel: {
    info: 0,
    warning: 2,
    error: 1,
    critical: 1
  },
  averageResponseTime: 283.5,
  uptime: 99.7
};