import { MapTool } from '../lib/map-utils';

// Demo Users for the application
export interface DemoUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: string;
  email: string;
  department: string;
  permissions: string[];
  lastLogin: Date;
}

export const demoUsers: DemoUser[] = [
  {
    id: '1',
    username: 'assessor',
    password: 'demo123',
    fullName: 'Sarah Johnson',
    role: 'County Assessor',
    email: 'sjohnson@bentoncounty.gov',
    department: 'Assessor\'s Office',
    permissions: ['admin', 'edit', 'view', 'approve'],
    lastLogin: new Date('2023-04-15T08:30:00')
  },
  {
    id: '2',
    username: 'appraiser',
    password: 'demo123',
    fullName: 'Michael Chen',
    role: 'Senior Appraiser',
    email: 'mchen@bentoncounty.gov',
    department: 'Assessor\'s Office',
    permissions: ['edit', 'view'],
    lastLogin: new Date('2023-04-14T15:45:00')
  },
  {
    id: '3',
    username: 'gisanalyst',
    password: 'demo123',
    fullName: 'Emily Rodriguez',
    role: 'GIS Analyst',
    email: 'erodriguez@bentoncounty.gov',
    department: 'GIS Department',
    permissions: ['view', 'edit_gis'],
    lastLogin: new Date('2023-04-16T09:15:00')
  },
  {
    id: '4',
    username: 'clerk',
    password: 'demo123',
    fullName: 'James Wilson',
    role: 'Records Clerk',
    email: 'jwilson@bentoncounty.gov',
    department: 'Records Management',
    permissions: ['view', 'upload_documents'],
    lastLogin: new Date('2023-04-13T16:20:00')
  }
];

// Residential Property Data
interface ResidentialProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  owner: string;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  assessedValue: number;
  marketValue: number;
  taxAmount: number;
  lastAssessment: Date;
}

export const residentialProperties: ResidentialProperty[] = [
  {
    id: 'R-1001',
    address: '123 Oak Street',
    city: 'Corvallis',
    state: 'OR',
    zip: '97330',
    owner: 'John & Mary Smith',
    yearBuilt: 2005,
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 2400,
    lotSize: 0.25,
    assessedValue: 350000,
    marketValue: 425000,
    taxAmount: 4500,
    lastAssessment: new Date('2022-06-15')
  },
  {
    id: 'R-1002',
    address: '456 Maple Avenue',
    city: 'Corvallis',
    state: 'OR',
    zip: '97330',
    owner: 'Robert & Susan Johnson',
    yearBuilt: 1998,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1850,
    lotSize: 0.18,
    assessedValue: 285000,
    marketValue: 340000,
    taxAmount: 3600,
    lastAssessment: new Date('2022-05-22')
  },
  {
    id: 'R-1003',
    address: '789 Pine Lane',
    city: 'Philomath',
    state: 'OR',
    zip: '97370',
    owner: 'David & Jennifer Williams',
    yearBuilt: 2010,
    bedrooms: 5,
    bathrooms: 3,
    squareFeet: 3200,
    lotSize: 0.4,
    assessedValue: 425000,
    marketValue: 520000,
    taxAmount: 5500,
    lastAssessment: new Date('2022-07-03')
  },
  {
    id: 'R-1004',
    address: '321 Cedar Road',
    city: 'Corvallis',
    state: 'OR',
    zip: '97330',
    owner: 'Michael & Elizabeth Brown',
    yearBuilt: 1985,
    bedrooms: 3,
    bathrooms: 1.5,
    squareFeet: 1600,
    lotSize: 0.15,
    assessedValue: 230000,
    marketValue: 280000,
    taxAmount: 3000,
    lastAssessment: new Date('2022-06-10')
  },
  {
    id: 'R-1005',
    address: '654 Birch Street',
    city: 'Monroe',
    state: 'OR',
    zip: '97456',
    owner: 'James & Patricia Davis',
    yearBuilt: 2015,
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 2600,
    lotSize: 0.3,
    assessedValue: 375000,
    marketValue: 450000,
    taxAmount: 4750,
    lastAssessment: new Date('2022-07-20')
  }
];

// Commercial Property Data
interface CommercialProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  owner: string;
  yearBuilt: number;
  propertyType: 'retail' | 'office' | 'industrial' | 'mixed-use';
  squareFeet: number;
  lotSize: number;
  assessedValue: number;
  marketValue: number;
  taxAmount: number;
  lastAssessment: Date;
}

export const commercialProperties: CommercialProperty[] = [
  {
    id: 'C-2001',
    name: 'Riverfront Plaza',
    address: '100 Main Street',
    city: 'Corvallis',
    state: 'OR',
    zip: '97330',
    owner: 'Benton Commercial Holdings LLC',
    yearBuilt: 2000,
    propertyType: 'retail',
    squareFeet: 15000,
    lotSize: 1.2,
    assessedValue: 1200000,
    marketValue: 1500000,
    taxAmount: 22000,
    lastAssessment: new Date('2022-08-05')
  },
  {
    id: 'C-2002',
    name: 'Tech Innovation Center',
    address: '200 Research Way',
    city: 'Corvallis',
    state: 'OR',
    zip: '97330',
    owner: 'Oregon Research Properties Inc.',
    yearBuilt: 2010,
    propertyType: 'office',
    squareFeet: 25000,
    lotSize: 2.5,
    assessedValue: 2400000,
    marketValue: 2800000,
    taxAmount: 32000,
    lastAssessment: new Date('2022-07-12')
  },
  {
    id: 'C-2003',
    name: 'Valley Distribution Center',
    address: '500 Industrial Parkway',
    city: 'Philomath',
    state: 'OR',
    zip: '97370',
    owner: 'Northwest Logistics Corp.',
    yearBuilt: 2005,
    propertyType: 'industrial',
    squareFeet: 45000,
    lotSize: 5.0,
    assessedValue: 3500000,
    marketValue: 4100000,
    taxAmount: 42000,
    lastAssessment: new Date('2022-06-28')
  },
  {
    id: 'C-2004',
    name: 'Downtown Mixed Development',
    address: '300 Monroe Avenue',
    city: 'Corvallis',
    state: 'OR',
    zip: '97330',
    owner: 'Urban Renewal Partners LLC',
    yearBuilt: 2015,
    propertyType: 'mixed-use',
    squareFeet: 22000,
    lotSize: 0.8,
    assessedValue: 2800000,
    marketValue: 3200000,
    taxAmount: 36000,
    lastAssessment: new Date('2022-08-15')
  }
];

// Agricultural Property Data
interface AgriculturalProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  owner: string;
  acres: number;
  propertyType: 'cropland' | 'pasture' | 'orchard' | 'vineyard' | 'forest';
  waterRights: boolean;
  assessedValue: number;
  marketValue: number;
  taxAmount: number;
  lastAssessment: Date;
}

export const agriculturalProperties: AgriculturalProperty[] = [
  {
    id: 'A-3001',
    name: 'Green Valley Farm',
    address: '5000 Rural Route 1',
    city: 'Monroe',
    state: 'OR',
    zip: '97456',
    owner: 'Green Valley Agricultural Enterprises',
    acres: 320,
    propertyType: 'cropland',
    waterRights: true,
    assessedValue: 1800000,
    marketValue: 2200000,
    taxAmount: 12000,
    lastAssessment: new Date('2022-05-30')
  },
  {
    id: 'A-3002',
    name: 'Hillside Vineyards',
    address: '2500 Wine Country Road',
    city: 'Philomath',
    state: 'OR',
    zip: '97370',
    owner: 'Williamette Valley Wines LLC',
    acres: 85,
    propertyType: 'vineyard',
    waterRights: true,
    assessedValue: 950000,
    marketValue: 1100000,
    taxAmount: 8500,
    lastAssessment: new Date('2022-06-18')
  },
  {
    id: 'A-3003',
    name: 'Evergreen Timber',
    address: '7800 Forest Road',
    city: 'Philomath',
    state: 'OR',
    zip: '97370',
    owner: 'Pacific Northwest Timber Corp.',
    acres: 520,
    propertyType: 'forest',
    waterRights: false,
    assessedValue: 2600000,
    marketValue: 3100000,
    taxAmount: 16000,
    lastAssessment: new Date('2022-07-10')
  },
  {
    id: 'A-3004',
    name: 'Sunny Acres Orchard',
    address: '4200 Orchard Lane',
    city: 'Monroe',
    state: 'OR',
    zip: '97456',
    owner: 'Benton Fresh Fruit Inc.',
    acres: 45,
    propertyType: 'orchard',
    waterRights: true,
    assessedValue: 750000,
    marketValue: 900000,
    taxAmount: 6500,
    lastAssessment: new Date('2022-06-05')
  }
];

// GeoJSON Parcel Data for Map
export const residentialParcels = [
  {
    type: 'Feature',
    id: 'R-1001',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.2912, 44.5641],
        [-123.2906, 44.5641],
        [-123.2906, 44.5645],
        [-123.2912, 44.5645],
        [-123.2912, 44.5641]
      ]]
    },
    properties: {
      parcelId: 'R-1001',
      address: '123 Oak Street, Corvallis, OR 97330',
      owner: 'John & Mary Smith',
      category: 'residential',
      acres: 0.25,
      yearBuilt: 2005,
      assessedValue: 350000,
      marketValue: 425000,
      landValue: 125000
    }
  },
  {
    type: 'Feature',
    id: 'R-1002',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.2890, 44.5620],
        [-123.2884, 44.5620],
        [-123.2884, 44.5624],
        [-123.2890, 44.5624],
        [-123.2890, 44.5620]
      ]]
    },
    properties: {
      parcelId: 'R-1002',
      address: '456 Maple Avenue, Corvallis, OR 97330',
      owner: 'Robert & Susan Johnson',
      category: 'residential',
      acres: 0.18,
      yearBuilt: 1998,
      assessedValue: 285000,
      marketValue: 340000,
      landValue: 95000
    }
  },
  {
    type: 'Feature',
    id: 'R-1003',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.3650, 44.5380],
        [-123.3640, 44.5380],
        [-123.3640, 44.5390],
        [-123.3650, 44.5390],
        [-123.3650, 44.5380]
      ]]
    },
    properties: {
      parcelId: 'R-1003',
      address: '789 Pine Lane, Philomath, OR 97370',
      owner: 'David & Jennifer Williams',
      category: 'residential',
      acres: 0.4,
      yearBuilt: 2010,
      assessedValue: 425000,
      marketValue: 520000,
      landValue: 150000
    }
  }
];

export const commercialParcels = [
  {
    type: 'Feature',
    id: 'C-2001',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.2600, 44.5700],
        [-123.2580, 44.5700],
        [-123.2580, 44.5720],
        [-123.2600, 44.5720],
        [-123.2600, 44.5700]
      ]]
    },
    properties: {
      parcelId: 'C-2001',
      address: '100 Main Street, Corvallis, OR 97330',
      owner: 'Benton Commercial Holdings LLC',
      category: 'commercial',
      acres: 1.2,
      yearBuilt: 2000,
      assessedValue: 1200000,
      marketValue: 1500000,
      landValue: 500000
    }
  },
  {
    type: 'Feature',
    id: 'C-2002',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.2850, 44.5630],
        [-123.2820, 44.5630],
        [-123.2820, 44.5650],
        [-123.2850, 44.5650],
        [-123.2850, 44.5630]
      ]]
    },
    properties: {
      parcelId: 'C-2002',
      address: '200 Research Way, Corvallis, OR 97330',
      owner: 'Oregon Research Properties Inc.',
      category: 'commercial',
      acres: 2.5,
      yearBuilt: 2010,
      assessedValue: 2400000,
      marketValue: 2800000,
      landValue: 900000
    }
  }
];

export const agriculturalParcels = [
  {
    type: 'Feature',
    id: 'A-3001',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.2950, 44.3150],
        [-123.2800, 44.3150],
        [-123.2800, 44.3250],
        [-123.2950, 44.3250],
        [-123.2950, 44.3150]
      ]]
    },
    properties: {
      parcelId: 'A-3001',
      address: '5000 Rural Route 1, Monroe, OR 97456',
      owner: 'Green Valley Agricultural Enterprises',
      category: 'agricultural',
      acres: 320,
      yearBuilt: 1975,
      assessedValue: 1800000,
      marketValue: 2200000,
      landValue: 1600000
    }
  },
  {
    type: 'Feature',
    id: 'A-3002',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.3750, 44.5450],
        [-123.3650, 44.5450],
        [-123.3650, 44.5550],
        [-123.3750, 44.5550],
        [-123.3750, 44.5450]
      ]]
    },
    properties: {
      parcelId: 'A-3002',
      address: '2500 Wine Country Road, Philomath, OR 97370',
      owner: 'Williamette Valley Wines LLC',
      category: 'agricultural',
      acres: 85,
      yearBuilt: 1990,
      assessedValue: 950000,
      marketValue: 1100000,
      landValue: 750000
    }
  }
];

export const specialPurposeParcels = [
  {
    type: 'Feature',
    id: 'S-4001',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-123.2700, 44.5600],
        [-123.2650, 44.5600],
        [-123.2650, 44.5640],
        [-123.2700, 44.5640],
        [-123.2700, 44.5600]
      ]]
    },
    properties: {
      parcelId: 'S-4001',
      address: '400 Education Avenue, Corvallis, OR 97330',
      owner: 'Benton County School District',
      category: 'special purpose',
      acres: 4.5,
      yearBuilt: 1995,
      assessedValue: 3800000,
      marketValue: 4200000,
      landValue: 1200000
    }
  }
];

// Document Classification Demo Data
export interface DemoDocument {
  id: string;
  name: string;
  type: string;
  parcelId: string;
  uploadDate: string;
  fileSize: number;
  uploadedBy: string;
  description: string;
  tags: string[];
  confidenceScore?: number;
  classificationStatus?: 'pending' | 'classified' | 'reviewed';
  reviewedBy?: string;
}

export const demoDocuments: DemoDocument[] = [
  {
    id: 'DOC-1001',
    name: 'Deed of Trust - 123 Oak Street.pdf',
    type: 'Deed',
    parcelId: 'R-1001',
    uploadDate: '2023-02-15T10:30:00',
    fileSize: 1248576,
    uploadedBy: 'jwilson',
    description: 'Deed of Trust for 123 Oak Street property',
    tags: ['deed', 'residential', 'oak street'],
    confidenceScore: 0.98,
    classificationStatus: 'classified',
    reviewedBy: 'sjohnson'
  },
  {
    id: 'DOC-1002',
    name: 'Property Survey - 456 Maple Avenue.pdf',
    type: 'Survey',
    parcelId: 'R-1002',
    uploadDate: '2023-01-22T14:15:00',
    fileSize: 3562480,
    uploadedBy: 'erodriguez',
    description: 'Property survey including boundary measurements',
    tags: ['survey', 'residential', 'maple avenue', 'boundary'],
    confidenceScore: 0.95,
    classificationStatus: 'classified',
    reviewedBy: 'mchen'
  },
  {
    id: 'DOC-1003',
    name: 'Tax Assessment - Riverfront Plaza.pdf',
    type: 'Tax Assessment',
    parcelId: 'C-2001',
    uploadDate: '2023-03-10T09:45:00',
    fileSize: 2154983,
    uploadedBy: 'sjohnson',
    description: 'Annual tax assessment for Riverfront Plaza commercial property',
    tags: ['tax', 'commercial', 'assessment', 'riverfront'],
    confidenceScore: 0.97,
    classificationStatus: 'classified',
    reviewedBy: 'sjohnson'
  },
  {
    id: 'DOC-1004',
    name: 'Water Rights Certificate - Green Valley Farm.pdf',
    type: 'Water Rights',
    parcelId: 'A-3001',
    uploadDate: '2023-02-05T11:20:00',
    fileSize: 1856421,
    uploadedBy: 'jwilson',
    description: 'Certificate of water rights for agricultural property',
    tags: ['water rights', 'agricultural', 'certificate', 'green valley'],
    confidenceScore: 0.92,
    classificationStatus: 'classified',
    reviewedBy: 'mchen'
  },
  {
    id: 'DOC-1005',
    name: 'Building Permit - Tech Innovation Center.pdf',
    type: 'Permit',
    parcelId: 'C-2002',
    uploadDate: '2023-03-25T15:30:00',
    fileSize: 4125367,
    uploadedBy: 'erodriguez',
    description: 'Building permit for office expansion',
    tags: ['permit', 'commercial', 'construction', 'expansion'],
    confidenceScore: 0.89,
    classificationStatus: 'classified',
    reviewedBy: 'mchen'
  },
  {
    id: 'DOC-1006',
    name: 'Easement Agreement - Hillside Vineyards.pdf',
    type: 'Easement',
    parcelId: 'A-3002',
    uploadDate: '2023-01-18T13:10:00',
    fileSize: 1524876,
    uploadedBy: 'jwilson',
    description: 'Road access easement agreement',
    tags: ['easement', 'agricultural', 'access', 'vineyard'],
    confidenceScore: 0.94,
    classificationStatus: 'classified',
    reviewedBy: 'sjohnson'
  },
  {
    id: 'DOC-1007',
    name: 'Property Appraisal - Downtown Mixed Development.pdf',
    type: 'Appraisal',
    parcelId: 'C-2004',
    uploadDate: '2023-04-05T10:00:00',
    fileSize: 3256891,
    uploadedBy: 'mchen',
    description: 'Recent property appraisal for commercial mixed-use development',
    tags: ['appraisal', 'commercial', 'mixed-use', 'downtown'],
    confidenceScore: 0.96,
    classificationStatus: 'classified',
    reviewedBy: 'sjohnson'
  },
  {
    id: 'DOC-1008',
    name: 'Zoning Variance - 789 Pine Lane.pdf',
    type: 'Zoning',
    parcelId: 'R-1003',
    uploadDate: '2023-03-02T16:45:00',
    fileSize: 1892456,
    uploadedBy: 'erodriguez',
    description: 'Zoning variance for property improvements',
    tags: ['zoning', 'variance', 'residential', 'pine lane'],
    confidenceScore: 0.91,
    classificationStatus: 'classified',
    reviewedBy: 'mchen'
  }
];

// Demo Collaboration Projects
export interface CollaborationProject {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'active' | 'planning' | 'completed';
  createdDate: string;
  dueDate: string;
  creator: string;
  participants: string[];
  parcels: string[];
}

export const demoCollaborationProjects: CollaborationProject[] = [
  {
    id: 'PROJ-1001',
    name: 'Downtown District Reassessment',
    description: 'Comprehensive reassessment of all commercial properties in the downtown district to reflect recent market changes.',
    type: 'Assessment',
    status: 'active',
    createdDate: '2023-02-01T09:00:00',
    dueDate: '2023-06-30T17:00:00',
    creator: 'sjohnson',
    participants: ['sjohnson', 'mchen', 'erodriguez'],
    parcels: ['C-2001', 'C-2004']
  },
  {
    id: 'PROJ-1002',
    name: 'Agricultural Land Value Study',
    description: 'Research project to analyze and normalize agricultural land values across the county based on soil type, water rights, and accessibility.',
    type: 'Research',
    status: 'active',
    createdDate: '2023-01-15T10:30:00',
    dueDate: '2023-05-15T16:00:00',
    creator: 'mchen',
    participants: ['mchen', 'erodriguez'],
    parcels: ['A-3001', 'A-3002', 'A-3003', 'A-3004']
  },
  {
    id: 'PROJ-1003',
    name: 'Residential Growth Zone Planning',
    description: 'Collaborative project with Planning Department to analyze potential rezoning for residential expansion in north county area.',
    type: 'Planning',
    status: 'planning',
    createdDate: '2023-03-10T11:00:00',
    dueDate: '2023-07-31T17:00:00',
    creator: 'sjohnson',
    participants: ['sjohnson', 'mchen', 'erodriguez', 'jwilson'],
    parcels: ['R-1001', 'R-1003', 'R-1005']
  },
  {
    id: 'PROJ-1004',
    name: 'Special District Tax Assessment',
    description: 'Annual review and update of properties within special tax districts including schools and fire protection zones.',
    type: 'Assessment',
    status: 'active',
    createdDate: '2023-02-20T13:45:00',
    dueDate: '2023-04-30T17:00:00',
    creator: 'mchen',
    participants: ['mchen', 'jwilson'],
    parcels: ['S-4001', 'R-1002', 'R-1004']
  }
];