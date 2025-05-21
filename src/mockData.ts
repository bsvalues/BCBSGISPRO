/**
 * Mock data for the TerraFusion Platform
 * 
 * This file contains mock data for demo and development purposes.
 * In a production environment, this would be replaced with actual data from APIs.
 */

import { ComponentStatus } from '../libs/WorkflowUI/components/dashboard/SystemHealthPanel';

/**
 * Mock counties
 */
export const mockCounties = [
  {
    id: 'benton-wa',
    name: 'Benton',
    state: 'WA',
    status: 'active',
    createdAt: new Date('2025-01-15'),
    lastUpdated: new Date('2025-05-15'),
    properties: {
      population: 205700,
      area: 1760,
      parcelCount: 89250
    },
    contacts: [
      {
        name: 'John Smith',
        role: 'GIS Manager',
        email: 'jsmith@benton.gov',
        phone: '509-555-1234'
      },
      {
        name: 'Sarah Johnson',
        role: 'County Assessor',
        email: 'sjohnson@benton.gov',
        phone: '509-555-5678'
      }
    ]
  },
  {
    id: 'king-wa',
    name: 'King',
    state: 'WA',
    status: 'active',
    createdAt: new Date('2025-02-10'),
    lastUpdated: new Date('2025-05-10'),
    properties: {
      population: 2252800,
      area: 2307,
      parcelCount: 785400
    },
    contacts: [
      {
        name: 'Michael Lee',
        role: 'GIS Director',
        email: 'mlee@kingcounty.gov',
        phone: '206-555-1234'
      }
    ]
  },
  {
    id: 'clark-wa',
    name: 'Clark',
    state: 'WA',
    status: 'pending',
    createdAt: new Date('2025-04-20'),
    lastUpdated: new Date('2025-05-18'),
    properties: {
      population: 488200,
      area: 629,
      parcelCount: 172300
    },
    contacts: [
      {
        name: 'Amy Wilson',
        role: 'County Assessor',
        email: 'awilson@clark.gov',
        phone: '360-555-9876'
      }
    ]
  },
  {
    id: 'umatilla-or',
    name: 'Umatilla',
    state: 'OR',
    status: 'active',
    createdAt: new Date('2025-03-05'),
    lastUpdated: new Date('2025-05-05'),
    properties: {
      population: 77950,
      area: 3231,
      parcelCount: 37800
    },
    contacts: [
      {
        name: 'David Martinez',
        role: 'GIS Coordinator',
        email: 'dmartinez@umatilla.or.gov',
        phone: '541-555-4321'
      }
    ]
  },
  {
    id: 'yamhill-or',
    name: 'Yamhill',
    state: 'OR',
    status: 'inactive',
    createdAt: new Date('2025-01-25'),
    lastUpdated: new Date('2025-02-25'),
    properties: {
      population: 108300,
      area: 718,
      parcelCount: 42600
    },
    contacts: [
      {
        name: 'Laura Thomas',
        role: 'County Assessor',
        email: 'lthomas@yamhill.gov',
        phone: '503-555-8765'
      }
    ]
  }
];

/**
 * Mock users
 */
export const mockUsers = [
  {
    id: 'user1',
    name: 'Alex Rodriguez',
    email: 'arodriguez@terrafusion.com',
    role: 'admin',
    status: 'active',
    lastLogin: new Date('2025-05-20'),
    countyIds: ['benton-wa', 'king-wa', 'clark-wa', 'umatilla-or', 'yamhill-or'],
    permissions: ['admin', 'edit', 'view', 'export', 'import']
  },
  {
    id: 'user2',
    name: 'Taylor Smith',
    email: 'tsmith@terrafusion.com',
    role: 'manager',
    status: 'active',
    lastLogin: new Date('2025-05-19'),
    countyIds: ['benton-wa', 'king-wa'],
    permissions: ['edit', 'view', 'export', 'import']
  },
  {
    id: 'user3',
    name: 'Jamie Garcia',
    email: 'jgarcia@benton.gov',
    role: 'editor',
    status: 'active',
    lastLogin: new Date('2025-05-18'),
    countyIds: ['benton-wa'],
    permissions: ['edit', 'view', 'export']
  },
  {
    id: 'user4',
    name: 'Morgan Lee',
    email: 'mlee@clark.gov',
    role: 'viewer',
    status: 'active',
    lastLogin: new Date('2025-05-15'),
    countyIds: ['clark-wa'],
    permissions: ['view']
  },
  {
    id: 'user5',
    name: 'Casey Jones',
    email: 'cjones@kingcounty.gov',
    role: 'editor',
    status: 'pending',
    lastLogin: null,
    countyIds: ['king-wa'],
    permissions: ['edit', 'view', 'export']
  }
];

/**
 * Mock system components
 */
export const mockSystemComponents = [
  {
    id: 'web-server',
    name: 'Web Server',
    description: 'Main application web server',
    status: ComponentStatus.HEALTHY,
    lastUpdated: new Date(),
    metrics: [
      {
        name: 'CPU Usage',
        value: 24,
        unit: '%',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 70,
          error: 90
        },
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 20 + Math.floor(Math.random() * 10),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      },
      {
        name: 'Memory Usage',
        value: 2.4,
        unit: 'GB',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 6,
          error: 7.5
        },
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 2 + Math.random() * 1,
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      },
      {
        name: 'Request Rate',
        value: 42,
        unit: 'req/s',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 30 + Math.floor(Math.random() * 20),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      }
    ],
    dependencies: ['database', 'file-storage']
  },
  {
    id: 'database',
    name: 'Database',
    description: 'PostgreSQL database',
    status: ComponentStatus.HEALTHY,
    lastUpdated: new Date(),
    metrics: [
      {
        name: 'CPU Usage',
        value: 35,
        unit: '%',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 70,
          error: 90
        },
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 30 + Math.floor(Math.random() * 15),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      },
      {
        name: 'Memory Usage',
        value: 4.2,
        unit: 'GB',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 7,
          error: 8
        },
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 4 + Math.random() * 1,
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      },
      {
        name: 'Connections',
        value: 24,
        unit: '',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 80,
          error: 100
        },
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 20 + Math.floor(Math.random() * 10),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      }
    ],
    dependencies: []
  },
  {
    id: 'file-storage',
    name: 'File Storage',
    description: 'GIS and document storage',
    status: ComponentStatus.WARNING,
    lastUpdated: new Date(),
    metrics: [
      {
        name: 'Disk Usage',
        value: 78,
        unit: '%',
        timestamp: new Date(),
        status: ComponentStatus.WARNING,
        thresholds: {
          warning: 75,
          error: 90
        },
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 70 + Math.floor(Math.random() * 10),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      },
      {
        name: 'Read Operations',
        value: 120,
        unit: 'ops/s',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 100 + Math.floor(Math.random() * 50),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      },
      {
        name: 'Write Operations',
        value: 45,
        unit: 'ops/s',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 40 + Math.floor(Math.random() * 20),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      }
    ],
    dependencies: []
  },
  {
    id: 'api-service',
    name: 'API Service',
    description: 'RESTful API services',
    status: ComponentStatus.HEALTHY,
    lastUpdated: new Date(),
    metrics: [
      {
        name: 'Response Time',
        value: 120,
        unit: 'ms',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 500,
          error: 1000
        },
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 100 + Math.floor(Math.random() * 50),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      },
      {
        name: 'Error Rate',
        value: 0.2,
        unit: '%',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 2,
          error: 5
        },
        history: Array.from({ length: 10 }, (_, i) => ({
          value: Math.random() * 0.5,
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      },
      {
        name: 'Request Rate',
        value: 78,
        unit: 'req/s',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 70 + Math.floor(Math.random() * 20),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      }
    ],
    dependencies: ['database', 'web-server']
  },
  {
    id: 'map-services',
    name: 'Map Services',
    description: 'Geo-spatial mapping services',
    status: ComponentStatus.HEALTHY,
    lastUpdated: new Date(),
    metrics: [
      {
        name: 'Tile Generation',
        value: 35,
        unit: 'tiles/s',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 30 + Math.floor(Math.random() * 15),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      },
      {
        name: 'Cache Hit Rate',
        value: 92,
        unit: '%',
        timestamp: new Date(),
        status: ComponentStatus.HEALTHY,
        thresholds: {
          warning: 60,
          error: 40
        },
        history: Array.from({ length: 10 }, (_, i) => ({
          value: 85 + Math.floor(Math.random() * 10),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      }
    ],
    dependencies: ['database', 'file-storage']
  },
  {
    id: 'ai-services',
    name: 'AI Services',
    description: 'Machine learning and AI analysis services',
    status: ComponentStatus.OFFLINE,
    lastUpdated: new Date(),
    metrics: [
      {
        name: 'Model Latency',
        value: 0,
        unit: 'ms',
        timestamp: new Date(),
        status: ComponentStatus.OFFLINE,
        thresholds: {
          warning: 2000,
          error: 5000
        },
        history: Array.from({ length: 10 }, (_, i) => ({
          value: i < 3 ? 0 : 1500 + Math.floor(Math.random() * 500),
          timestamp: new Date(Date.now() - (i * 3600000))
        }))
      }
    ],
    dependencies: ['web-server', 'api-service']
  }
];

/**
 * Mock system alerts
 */
export const mockSystemAlerts = [
  {
    id: 'alert1',
    componentId: 'file-storage',
    level: 'warning',
    message: 'Disk space usage is above 75%',
    timestamp: new Date(),
    acknowledged: false,
    details: {
      currentUsage: '78%',
      threshold: '75%',
      totalSpace: '10 TB',
      freeSpace: '2.2 TB'
    }
  },
  {
    id: 'alert2',
    componentId: 'ai-services',
    level: 'critical',
    message: 'AI services are offline',
    timestamp: new Date(Date.now() - 3600000),
    acknowledged: false,
    details: {
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      affectedServices: ['legal-description-analyzer', 'property-valuation-engine']
    }
  },
  {
    id: 'alert3',
    componentId: 'database',
    level: 'info',
    message: 'Database backup completed successfully',
    timestamp: new Date(Date.now() - 7200000),
    acknowledged: true,
    details: {
      backupSize: '4.2 GB',
      duration: '8 minutes',
      location: 's3://terrafusion-backups/daily/2025-05-21/'
    }
  }
];

/**
 * Mock events
 */
export const mockEvents = [
  {
    id: 'event1',
    type: 'user',
    action: 'User login',
    timestamp: new Date(Date.now() - 1800000),
    userId: 'user1',
    details: {
      ip: '192.168.1.1',
      browser: 'Chrome'
    },
    severity: 'info'
  },
  {
    id: 'event2',
    type: 'county',
    action: 'County data updated',
    timestamp: new Date(Date.now() - 3600000),
    userId: 'user2',
    details: {
      countyId: 'benton-wa',
      changes: ['parcels', 'zoning']
    },
    severity: 'info'
  },
  {
    id: 'event3',
    type: 'system',
    action: 'System backup initiated',
    timestamp: new Date(Date.now() - 7200000),
    details: {
      type: 'Full backup',
      estimatedDuration: '10 minutes'
    },
    severity: 'info'
  },
  {
    id: 'event4',
    type: 'data',
    action: 'Data import completed',
    timestamp: new Date(Date.now() - 10800000),
    userId: 'user3',
    details: {
      countyId: 'benton-wa',
      fileType: 'CSV',
      records: 5427
    },
    severity: 'info'
  },
  {
    id: 'event5',
    type: 'security',
    action: 'Failed login attempt',
    timestamp: new Date(Date.now() - 14400000),
    details: {
      username: 'unknown',
      ip: '203.0.113.45',
      attemptCount: 3
    },
    severity: 'warning'
  }
];

/**
 * Mock county configuration for onboarding
 */
export const mockCountyConfig = {
  id: 'walla-walla-wa',
  name: 'Walla Walla',
  state: 'WA',
  status: 'draft',
  createdAt: new Date(),
  lastUpdated: new Date(),
  properties: {
    population: 60000,
    area: 1271,
    parcelCount: 28500
  },
  contacts: [
    {
      name: 'Robert Chen',
      role: 'GIS Specialist',
      email: 'rchen@wallawalla.gov',
      phone: '509-555-7890'
    }
  ],
  gisDataSources: [
    {
      id: 'parcels-ww',
      name: 'Walla Walla Parcels',
      type: 'shapefile',
      filePath: '/data/wallawalla/parcels.shp',
      description: 'Parcel boundaries for Walla Walla County',
      lastUpdated: new Date(Date.now() - 86400000),
      status: 'ready'
    }
  ],
  validationIssues: [
    {
      type: 'warning',
      message: 'Population data may be outdated',
      component: 'Basic Information',
      resolved: false
    },
    {
      type: 'error',
      message: 'Missing required zoning layer',
      component: 'GIS Data Sources',
      resolved: false
    }
  ]
};

/**
 * Mock GIS data sources
 */
export const mockDataSources = [
  {
    id: 'parcels-ww',
    name: 'Walla Walla Parcels',
    type: 'shapefile',
    filePath: '/data/wallawalla/parcels.shp',
    description: 'Parcel boundaries for Walla Walla County',
    lastUpdated: new Date(Date.now() - 86400000),
    status: 'ready'
  },
  {
    id: 'zoning-ww',
    name: 'Walla Walla Zoning',
    type: 'shapefile',
    filePath: '/data/wallawalla/zoning.shp',
    description: 'Zoning districts for Walla Walla County',
    lastUpdated: new Date(Date.now() - 86400000),
    status: 'ready'
  },
  {
    id: 'roads-ww',
    name: 'Walla Walla Roads',
    type: 'shapefile',
    filePath: '/data/wallawalla/roads.shp',
    description: 'Road network for Walla Walla County',
    lastUpdated: new Date(Date.now() - 86400000),
    status: 'ready'
  },
  {
    id: 'imagery-ww',
    name: 'Walla Walla Aerial Imagery',
    type: 'wms',
    url: 'https://gis.wallawalla.gov/arcgis/services/Imagery/MapServer/WMSServer',
    description: 'Aerial imagery for Walla Walla County',
    lastUpdated: new Date(Date.now() - 7776000000), // 90 days ago
    status: 'ready'
  },
  {
    id: 'addresses-ww',
    name: 'Walla Walla Addresses',
    type: 'geojson',
    filePath: '/data/wallawalla/addresses.geojson',
    description: 'Address points for Walla Walla County',
    lastUpdated: new Date(Date.now() - 86400000),
    status: 'ready'
  }
];

/**
 * Mock valuation systems
 */
export const mockValuationSystems = [
  {
    id: 'cama-system',
    name: 'County CAMA System',
    type: 'cama',
    url: 'https://cama.county.gov/api',
    connectionStatus: 'not_configured'
  },
  {
    id: 'terrafusion-valuation',
    name: 'TerraFusion Valuation Engine',
    type: 'integrated',
    connectionStatus: 'connected'
  },
  {
    id: 'legacy-valuation',
    name: 'Legacy Valuation System',
    type: 'custom',
    url: 'https://legacy.county.gov',
    connectionStatus: 'not_configured'
  }
];

/**
 * Mock tax systems
 */
export const mockTaxSystems = [
  {
    id: 'county-tax',
    name: 'County Tax System',
    type: 'integrated',
    url: 'https://tax.county.gov/api',
    connectionStatus: 'not_configured'
  },
  {
    id: 'terrafusion-tax',
    name: 'TerraFusion Tax Module',
    type: 'integrated',
    connectionStatus: 'connected'
  }
];

/**
 * Get dashboard summary
 */
export const getDashboardSummary = (
  counties: any[],
  users: any[],
  systemComponents: any[],
  systemAlerts: any[],
  recentEvents: any[]
) => {
  return {
    userCount: users.length,
    countyCount: counties.length,
    activeCountyCount: counties.filter(c => c.status === 'active').length,
    totalParcelCount: counties.reduce((sum, county) => sum + (county.properties.parcelCount || 0), 0),
    systemHealthScore: calculateHealthScore(systemComponents, systemAlerts),
    pendingTasks: 3, // Mock value
    recentEvents
  };
};

/**
 * Calculate health score from components and alerts
 */
const calculateHealthScore = (
  components: any[],
  alerts: any[]
) => {
  // Start with 100%
  let score = 100;
  
  // Deduct for component status
  const componentPenalties = {
    [ComponentStatus.WARNING]: 5,
    [ComponentStatus.ERROR]: 15,
    [ComponentStatus.OFFLINE]: 10,
    [ComponentStatus.UNKNOWN]: 5
  };
  
  for (const component of components) {
    const penalty = componentPenalties[component.status as ComponentStatus] || 0;
    score -= penalty;
  }
  
  // Deduct for alerts
  const alertPenalties = {
    'warning': 2,
    'error': 5,
    'critical': 10,
    'info': 0
  };
  
  for (const alert of alerts) {
    if (!alert.acknowledged) {
      const penalty = alertPenalties[alert.level as keyof typeof alertPenalties] || 0;
      score -= penalty;
    }
  }
  
  // Ensure the score is between 0 and 100
  return Math.max(0, Math.min(100, score));
};