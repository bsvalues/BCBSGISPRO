// Demo user data for the application
export interface DemoUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: string;
  email?: string;
  permissions: string[];
}

// Demo property data
export interface Property {
  id: string;
  parcelId: string;
  address: string;
  owner: string;
  type: 'Residential' | 'Commercial' | 'Agricultural' | 'Industrial' | 'Vacant';
  valuationYear: number;
  assessedValue: number;
  marketValue: number;
  acres: number;
  latitude: number;
  longitude: number;
  documents?: string[];
  taxes?: {
    year: number;
    amount: number;
    paid: boolean;
  }[];
  lastInspection?: string;
  improvements?: {
    type: string;
    value: number;
    year: number;
  }[];
}

// Demo users with different roles
export const demoUsers: DemoUser[] = [
  {
    id: 'user-1',
    username: 'assessor_demo',
    password: 'demo123',
    fullName: 'Morgan Williams',
    role: 'Assessor',
    email: 'morgan.williams@bentoncounty.gov',
    permissions: ['view_all', 'edit_all', 'approve_assessments', 'admin_access']
  },
  {
    id: 'user-2',
    username: 'appraiser_demo',
    password: 'demo123',
    fullName: 'Taylor Rodriguez',
    role: 'Appraiser',
    email: 'taylor.rodriguez@bentoncounty.gov',
    permissions: ['view_all', 'edit_properties', 'conduct_assessments']
  },
  {
    id: 'user-3',
    username: 'gis_demo',
    password: 'demo123',
    fullName: 'Jordan Chen',
    role: 'GIS Analyst',
    email: 'jordan.chen@bentoncounty.gov',
    permissions: ['view_all', 'edit_maps', 'manage_layers', 'spatial_analysis']
  },
  {
    id: 'user-4',
    username: 'clerk_demo',
    password: 'demo123',
    fullName: 'Casey Smith',
    role: 'Clerk',
    email: 'casey.smith@bentoncounty.gov',
    permissions: ['view_properties', 'process_documents', 'customer_service']
  }
];

// Demo properties (Benton County sample data)
export const demoProperties: Property[] = [
  {
    id: 'prop-1',
    parcelId: '10123-45-67890',
    address: '1200 Main Street, Kennewick, WA 99336',
    owner: 'Johnson Family Trust',
    type: 'Residential',
    valuationYear: 2024,
    assessedValue: 425000,
    marketValue: 450000,
    acres: 0.25,
    latitude: 46.2112,
    longitude: -119.1372,
    documents: ['deed-10123.pdf', 'survey-2022.pdf', 'tax-statement-2024.pdf'],
    taxes: [
      { year: 2024, amount: 4250, paid: true },
      { year: 2023, amount: 4100, paid: true }
    ],
    lastInspection: '2023-08-15',
    improvements: [
      { type: 'Deck Addition', value: 12000, year: 2022 },
      { type: 'Kitchen Renovation', value: 45000, year: 2020 }
    ]
  },
  {
    id: 'prop-2',
    parcelId: '10456-78-90123',
    address: '500 Columbia Drive, Richland, WA 99352',
    owner: 'Columbia River Ventures LLC',
    type: 'Commercial',
    valuationYear: 2024,
    assessedValue: 1250000,
    marketValue: 1400000,
    acres: 1.5,
    latitude: 46.2855,
    longitude: -119.2938,
    documents: ['commercial-deed-10456.pdf', 'building-permit-2021.pdf'],
    taxes: [
      { year: 2024, amount: 15500, paid: true },
      { year: 2023, amount: 14800, paid: true }
    ],
    lastInspection: '2023-10-05',
    improvements: [
      { type: 'Parking Lot Expansion', value: 85000, year: 2023 },
      { type: 'HVAC Replacement', value: 65000, year: 2022 }
    ]
  },
  {
    id: 'prop-3',
    parcelId: '10789-01-23456',
    address: '3200 Duportail Street, Richland, WA 99352',
    owner: 'Smith Agricultural Holdings',
    type: 'Agricultural',
    valuationYear: 2024,
    assessedValue: 875000,
    marketValue: 950000,
    acres: 24.5,
    latitude: 46.2715,
    longitude: -119.3100,
    documents: ['ag-deed-10789.pdf', 'water-rights-cert.pdf'],
    taxes: [
      { year: 2024, amount: 7500, paid: true },
      { year: 2023, amount: 7200, paid: true }
    ],
    lastInspection: '2023-06-22',
    improvements: [
      { type: 'Irrigation System', value: 120000, year: 2022 },
      { type: 'Equipment Barn', value: 95000, year: 2021 }
    ]
  },
  {
    id: 'prop-4',
    parcelId: '10234-56-78901',
    address: '750 George Washington Way, Richland, WA 99352',
    owner: 'Pacific Northwest Properties',
    type: 'Commercial',
    valuationYear: 2024,
    assessedValue: 1850000,
    marketValue: 2000000,
    acres: 1.8,
    latitude: 46.2961,
    longitude: -119.2782,
    documents: ['commercial-deed-10234.pdf', 'renovation-permit-2023.pdf'],
    taxes: [
      { year: 2024, amount: 22500, paid: true },
      { year: 2023, amount: 21000, paid: true }
    ],
    lastInspection: '2024-01-15',
    improvements: [
      { type: 'Building Expansion', value: 350000, year: 2023 },
      { type: 'Solar Panel Installation', value: 125000, year: 2022 }
    ]
  },
  {
    id: 'prop-5',
    parcelId: '10345-67-89012',
    address: '2100 Yakima River Drive, Prosser, WA 99350',
    owner: 'Yakima Valley Vineyards',
    type: 'Agricultural',
    valuationYear: 2024,
    assessedValue: 1650000,
    marketValue: 1750000,
    acres: 45.2,
    latitude: 46.2066,
    longitude: -119.7644,
    documents: ['ag-deed-10345.pdf', 'water-rights-2020.pdf'],
    taxes: [
      { year: 2024, amount: 14500, paid: true },
      { year: 2023, amount: 13800, paid: true }
    ],
    lastInspection: '2023-09-18',
    improvements: [
      { type: 'Vineyard Expansion', value: 250000, year: 2023 },
      { type: 'Processing Facility', value: 375000, year: 2021 }
    ]
  },
  {
    id: 'prop-6',
    parcelId: '10567-89-01234',
    address: '1500 Badger Mountain Loop, Richland, WA 99352',
    owner: 'Martinez Family Trust',
    type: 'Residential',
    valuationYear: 2024,
    assessedValue: 520000,
    marketValue: 550000,
    acres: 0.35,
    latitude: 46.2527,
    longitude: -119.3284,
    documents: ['deed-10567.pdf', 'permit-2022.pdf'],
    taxes: [
      { year: 2024, amount: 5100, paid: true },
      { year: 2023, amount: 4900, paid: true }
    ],
    lastInspection: '2023-07-30',
    improvements: [
      { type: 'Swimming Pool', value: 65000, year: 2022 },
      { type: 'Landscaping', value: 35000, year: 2022 }
    ]
  },
  {
    id: 'prop-7',
    parcelId: '10678-90-12345',
    address: '800 Edison Street, Kennewick, WA 99336',
    owner: 'Edison Industrial Corp',
    type: 'Industrial',
    valuationYear: 2024,
    assessedValue: 2250000,
    marketValue: 2400000,
    acres: 3.5,
    latitude: 46.2124,
    longitude: -119.1564,
    documents: ['industrial-deed-10678.pdf', 'environmental-report-2023.pdf'],
    taxes: [
      { year: 2024, amount: 28500, paid: true },
      { year: 2023, amount: 27200, paid: true }
    ],
    lastInspection: '2023-11-12',
    improvements: [
      { type: 'Manufacturing Facility Upgrade', value: 750000, year: 2023 },
      { type: 'Loading Dock Expansion', value: 185000, year: 2022 }
    ]
  },
  {
    id: 'prop-8',
    parcelId: '10890-12-34567',
    address: '320 Keene Road, Richland, WA 99352',
    owner: 'Future Development LLC',
    type: 'Vacant',
    valuationYear: 2024,
    assessedValue: 325000,
    marketValue: 350000,
    acres: 2.8,
    latitude: 46.2717,
    longitude: -119.3005,
    documents: ['deed-10890.pdf', 'zoning-certificate.pdf'],
    taxes: [
      { year: 2024, amount: 3250, paid: true },
      { year: 2023, amount: 3100, paid: true }
    ],
    lastInspection: '2023-05-18'
  }
];

// Property statistics for the dashboard
export const propertyStatistics = {
  totalProperties: demoProperties.length,
  totalValue: demoProperties.reduce((sum, prop) => sum + prop.assessedValue, 0),
  averageValue: Math.round(
    demoProperties.reduce((sum, prop) => sum + prop.assessedValue, 0) / demoProperties.length
  ),
  byType: {
    Residential: demoProperties.filter(p => p.type === 'Residential').length,
    Commercial: demoProperties.filter(p => p.type === 'Commercial').length,
    Agricultural: demoProperties.filter(p => p.type === 'Agricultural').length,
    Industrial: demoProperties.filter(p => p.type === 'Industrial').length,
    Vacant: demoProperties.filter(p => p.type === 'Vacant').length
  },
  recentUpdates: [
    { id: 'update-1', parcelId: '10123-45-67890', type: 'Assessment Completed', date: '2024-04-10', user: 'Taylor Rodriguez' },
    { id: 'update-2', parcelId: '10456-78-90123', type: 'Document Added', date: '2024-04-12', user: 'Casey Smith' },
    { id: 'update-3', parcelId: '10789-01-23456', type: 'Map Updated', date: '2024-04-14', user: 'Jordan Chen' },
    { id: 'update-4', parcelId: '10234-56-78901', type: 'Valuation Change', date: '2024-04-15', user: 'Morgan Williams' }
  ]
};