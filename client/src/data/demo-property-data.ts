/**
 * Demo data for BentonGeoPro application
 * 
 * This file contains demo data for Benton County property assessments,
 * including property records, demo users, and demo documents.
 */

// Demo user accounts for different roles
export interface DemoUser {
  id: string;
  username: string;
  password: string; // Note: In a real app, passwords would never be stored in clear text
  fullName: string;
  role: 'Assessor' | 'Appraiser' | 'GIS Analyst' | 'Clerk';
  email: string;
  department: string;
  permissions: string[];
  lastLogin: Date;
}

// Demo document with classification information
export interface DemoDocument {
  id: string;
  name: string;
  type: string;
  parcelId: string;
  uploadDate: string;
  fileSize: number; // Size in bytes
  uploadedBy: string;
  description: string;
  tags: string[];
  classificationStatus?: 'pending' | 'classified' | 'reviewed';
  confidenceScore?: number; // Between 0 and 1
  reviewedBy?: string;
}

// Demo property record representing assessment data
export interface DemoProperty {
  id: string;
  parcelId: string;
  ownerName: string;
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  propertyType: 'Residential' | 'Commercial' | 'Agricultural' | 'Vacant Land';
  assessedValue: number;
  marketValue: number;
  landArea: number; // In acres
  buildingArea?: number; // In sq. ft
  yearBuilt?: number;
  lastAssessmentDate: string;
  taxDistrict: string;
  zoning: string;
  features: string[];
  images: string[];
  taxExemptions: string[];
  floodZone: boolean;
  lastUpdated: string;
  assessmentHistory: {
    year: number;
    assessedValue: number;
    marketValue: number;
  }[];
}

// Demo user accounts
export const demoUsers: DemoUser[] = [
  {
    id: "user-001",
    username: "jsmith",
    password: "password123", // Never do this in a real application!
    fullName: "John Smith",
    role: "Assessor",
    email: "jsmith@bentoncounty.gov",
    department: "Assessment & Taxation",
    permissions: ["read", "write", "approve", "admin"],
    lastLogin: new Date("2025-04-15T10:30:00Z")
  },
  {
    id: "user-002",
    username: "mjohnson",
    password: "password123",
    fullName: "Mary Johnson",
    role: "Appraiser",
    email: "mjohnson@bentoncounty.gov",
    department: "Assessment & Taxation",
    permissions: ["read", "write", "field_assessment"],
    lastLogin: new Date("2025-04-14T14:20:00Z")
  },
  {
    id: "user-003",
    username: "rwilliams",
    password: "password123",
    fullName: "Robert Williams",
    role: "GIS Analyst",
    email: "rwilliams@bentoncounty.gov",
    department: "GIS Services",
    permissions: ["read", "write", "gis_edit", "map_publish"],
    lastLogin: new Date("2025-04-15T09:15:00Z")
  },
  {
    id: "user-004",
    username: "abrown",
    password: "password123",
    fullName: "Amanda Brown",
    role: "Clerk",
    email: "abrown@bentoncounty.gov",
    department: "Records",
    permissions: ["read", "document_process"],
    lastLogin: new Date("2025-04-15T08:45:00Z")
  }
];

// Demo document records for document classification system
export const demoDocuments: DemoDocument[] = [
  {
    id: "doc-001",
    name: "Deed_12345.pdf",
    type: "Deed",
    parcelId: "11525",
    uploadDate: "2025-03-25",
    fileSize: 2458092,
    uploadedBy: "Amanda Brown",
    description: "Property deed transfer from Smith to Johnson for residential property on 5th Street.",
    tags: ["deed", "transfer", "residential"],
    classificationStatus: "reviewed",
    confidenceScore: 0.95,
    reviewedBy: "John Smith"
  },
  {
    id: "doc-002",
    name: "PropertySurvey_22456.pdf",
    type: "Survey",
    parcelId: "11526",
    uploadDate: "2025-04-02",
    fileSize: 5689234,
    uploadedBy: "Mary Johnson",
    description: "Complete property survey of commercial lot on Main Street, including boundary measurements and easements.",
    tags: ["survey", "commercial", "boundary"],
    classificationStatus: "classified",
    confidenceScore: 0.92
  },
  {
    id: "doc-003",
    name: "TaxAssessment_2025_11527.pdf",
    type: "Tax Assessment",
    parcelId: "11527",
    uploadDate: "2025-04-10",
    fileSize: 1257890,
    uploadedBy: "John Smith",
    description: "2025 tax assessment report for agricultural property owned by Willamette Valley Farms.",
    tags: ["tax", "assessment", "agricultural"],
    classificationStatus: "pending"
  },
  {
    id: "doc-004",
    name: "BuildingPermit_45678.pdf",
    type: "Building Permit",
    parcelId: "11528",
    uploadDate: "2025-04-12",
    fileSize: 3456789,
    uploadedBy: "Amanda Brown",
    description: "Building permit application for new garage construction at residential property on Oak Avenue.",
    tags: ["permit", "construction", "garage"],
    classificationStatus: "pending"
  },
  {
    id: "doc-005",
    name: "AppraisalReport_11529_2025.pdf",
    type: "Appraisal",
    parcelId: "11529",
    uploadDate: "2025-04-14",
    fileSize: 7895623,
    uploadedBy: "Mary Johnson",
    description: "Detailed property appraisal report for commercial retail space in downtown Corvallis.",
    tags: ["appraisal", "commercial", "retail"],
    classificationStatus: "classified",
    confidenceScore: 0.88
  },
  {
    id: "doc-006",
    name: "Variance_Request_11530.pdf",
    type: "Variance Request",
    parcelId: "11530",
    uploadDate: "2025-04-15",
    fileSize: 1562378,
    uploadedBy: "Amanda Brown",
    description: "Zoning variance request for property on Pine Street to allow home business operation.",
    tags: ["variance", "zoning", "home business"],
    classificationStatus: "pending"
  },
  {
    id: "doc-007",
    name: "MapAmendment_SouthCorvallis.pdf",
    type: "Map Amendment",
    parcelId: "Multiple",
    uploadDate: "2025-04-05",
    fileSize: 8912456,
    uploadedBy: "Robert Williams",
    description: "Proposed map amendment for rezoning portion of South Corvallis to mixed-use development.",
    tags: ["map", "amendment", "rezoning"],
    classificationStatus: "reviewed",
    confidenceScore: 0.96,
    reviewedBy: "John Smith"
  },
  {
    id: "doc-008",
    name: "FloodplainCertification_11532.pdf",
    type: "Floodplain Certificate",
    parcelId: "11532",
    uploadDate: "2025-04-08",
    fileSize: 4123789,
    uploadedBy: "Robert Williams",
    description: "Floodplain certification for property adjacent to Willamette River, including elevation data.",
    tags: ["floodplain", "certification", "elevation"],
    classificationStatus: "classified",
    confidenceScore: 0.94
  }
];

// Demo property records
export const demoProperties: DemoProperty[] = [
  {
    id: "prop-11525",
    parcelId: "11525",
    ownerName: "Johnson Family Trust",
    address: {
      street: "1234 5th Street",
      city: "Corvallis",
      zipCode: "97330"
    },
    coordinates: {
      latitude: 44.5698,
      longitude: -123.2780
    },
    propertyType: "Residential",
    assessedValue: 420000,
    marketValue: 450000,
    landArea: 0.25,
    buildingArea: 2200,
    yearBuilt: 1992,
    lastAssessmentDate: "2025-01-15",
    taxDistrict: "Corvallis School District",
    zoning: "R-1 (Low Density Residential)",
    features: ["Single Family Home", "3 Bedroom", "2 Bath", "Garage", "Fireplace"],
    images: ["property_11525_1.jpg", "property_11525_2.jpg"],
    taxExemptions: [],
    floodZone: false,
    lastUpdated: "2025-01-15",
    assessmentHistory: [
      { year: 2025, assessedValue: 420000, marketValue: 450000 },
      { year: 2024, assessedValue: 405000, marketValue: 435000 },
      { year: 2023, assessedValue: 390000, marketValue: 420000 }
    ]
  },
  {
    id: "prop-11526",
    parcelId: "11526",
    ownerName: "Corvallis Business Center LLC",
    address: {
      street: "567 Main Street",
      city: "Corvallis",
      zipCode: "97330"
    },
    coordinates: {
      latitude: 44.5642,
      longitude: -123.2615
    },
    propertyType: "Commercial",
    assessedValue: 1250000,
    marketValue: 1350000,
    landArea: 0.75,
    buildingArea: 8500,
    yearBuilt: 1985,
    lastAssessmentDate: "2025-02-10",
    taxDistrict: "Corvallis Central Business",
    zoning: "CB (Central Business)",
    features: ["Retail Space", "Office Space", "Parking Lot", "ADA Accessible"],
    images: ["property_11526_1.jpg", "property_11526_2.jpg"],
    taxExemptions: [],
    floodZone: false,
    lastUpdated: "2025-02-10",
    assessmentHistory: [
      { year: 2025, assessedValue: 1250000, marketValue: 1350000 },
      { year: 2024, assessedValue: 1200000, marketValue: 1300000 },
      { year: 2023, assessedValue: 1150000, marketValue: 1250000 }
    ]
  },
  {
    id: "prop-11527",
    parcelId: "11527",
    ownerName: "Willamette Valley Farms Inc.",
    address: {
      street: "12300 Agricultural Way",
      city: "Monroe",
      zipCode: "97456"
    },
    coordinates: {
      latitude: 44.3150,
      longitude: -123.2986
    },
    propertyType: "Agricultural",
    assessedValue: 850000,
    marketValue: 950000,
    landArea: 120.5,
    buildingArea: 3200,
    yearBuilt: 1976,
    lastAssessmentDate: "2025-01-20",
    taxDistrict: "Monroe Rural",
    zoning: "EFU (Exclusive Farm Use)",
    features: ["Farmland", "Barn", "Silo", "Equipment Storage", "Irrigation System"],
    images: ["property_11527_1.jpg", "property_11527_2.jpg"],
    taxExemptions: ["Farm Use Special Assessment"],
    floodZone: true,
    lastUpdated: "2025-01-20",
    assessmentHistory: [
      { year: 2025, assessedValue: 850000, marketValue: 950000 },
      { year: 2024, assessedValue: 825000, marketValue: 925000 },
      { year: 2023, assessedValue: 800000, marketValue: 900000 }
    ]
  },
  {
    id: "prop-11528",
    parcelId: "11528",
    ownerName: "Garcia, Miguel & Elena",
    address: {
      street: "789 Oak Avenue",
      city: "Corvallis",
      zipCode: "97330"
    },
    coordinates: {
      latitude: 44.5801,
      longitude: -123.2850
    },
    propertyType: "Residential",
    assessedValue: 380000,
    marketValue: 410000,
    landArea: 0.18,
    buildingArea: 1950,
    yearBuilt: 1998,
    lastAssessmentDate: "2025-02-05",
    taxDistrict: "Corvallis School District",
    zoning: "R-1 (Low Density Residential)",
    features: ["Single Family Home", "4 Bedroom", "2.5 Bath", "Garage", "Deck"],
    images: ["property_11528_1.jpg", "property_11528_2.jpg"],
    taxExemptions: [],
    floodZone: false,
    lastUpdated: "2025-02-05",
    assessmentHistory: [
      { year: 2025, assessedValue: 380000, marketValue: 410000 },
      { year: 2024, assessedValue: 365000, marketValue: 395000 },
      { year: 2023, assessedValue: 350000, marketValue: 380000 }
    ]
  },
  {
    id: "prop-11529",
    parcelId: "11529",
    ownerName: "Corvallis Retail Properties LLC",
    address: {
      street: "123 Downtown Plaza",
      city: "Corvallis",
      zipCode: "97330"
    },
    coordinates: {
      latitude: 44.5639,
      longitude: -123.2624
    },
    propertyType: "Commercial",
    assessedValue: 980000,
    marketValue: 1050000,
    landArea: 0.35,
    buildingArea: 6200,
    yearBuilt: 1972,
    lastAssessmentDate: "2025-03-01",
    taxDistrict: "Corvallis Central Business",
    zoning: "CB (Central Business)",
    features: ["Retail Space", "Storage", "Parking", "Recently Renovated"],
    images: ["property_11529_1.jpg", "property_11529_2.jpg"],
    taxExemptions: [],
    floodZone: false,
    lastUpdated: "2025-03-01",
    assessmentHistory: [
      { year: 2025, assessedValue: 980000, marketValue: 1050000 },
      { year: 2024, assessedValue: 925000, marketValue: 990000 },
      { year: 2023, assessedValue: 875000, marketValue: 940000 }
    ]
  },
  {
    id: "prop-11530",
    parcelId: "11530",
    ownerName: "Chen, Wei & Liu, Mei",
    address: {
      street: "456 Pine Street",
      city: "Corvallis",
      zipCode: "97333"
    },
    coordinates: {
      latitude: 44.5725,
      longitude: -123.2730
    },
    propertyType: "Residential",
    assessedValue: 395000,
    marketValue: 425000,
    landArea: 0.2,
    buildingArea: 2100,
    yearBuilt: 2005,
    lastAssessmentDate: "2025-02-15",
    taxDistrict: "Corvallis School District",
    zoning: "R-2 (Medium Density Residential)",
    features: ["Single Family Home", "3 Bedroom", "2 Bath", "Home Office", "Garden"],
    images: ["property_11530_1.jpg", "property_11530_2.jpg"],
    taxExemptions: [],
    floodZone: false,
    lastUpdated: "2025-02-15",
    assessmentHistory: [
      { year: 2025, assessedValue: 395000, marketValue: 425000 },
      { year: 2024, assessedValue: 375000, marketValue: 405000 },
      { year: 2023, assessedValue: 360000, marketValue: 390000 }
    ]
  },
  {
    id: "prop-11531",
    parcelId: "11531",
    ownerName: "South Corvallis Development Co.",
    address: {
      street: "S Corvallis Development Area",
      city: "Corvallis",
      zipCode: "97333"
    },
    coordinates: {
      latitude: 44.5465,
      longitude: -123.2689
    },
    propertyType: "Vacant Land",
    assessedValue: 550000,
    marketValue: 650000,
    landArea: 3.8,
    lastAssessmentDate: "2025-01-25",
    taxDistrict: "Corvallis South",
    zoning: "MUC (Mixed Use Commercial)",
    features: ["Vacant", "Development Ready", "Utilities Available", "Near Highway Access"],
    images: ["property_11531_1.jpg", "property_11531_2.jpg"],
    taxExemptions: [],
    floodZone: false,
    lastUpdated: "2025-01-25",
    assessmentHistory: [
      { year: 2025, assessedValue: 550000, marketValue: 650000 },
      { year: 2024, assessedValue: 520000, marketValue: 620000 },
      { year: 2023, assessedValue: 490000, marketValue: 590000 }
    ]
  },
  {
    id: "prop-11532",
    parcelId: "11532",
    ownerName: "Riverfront Properties LLC",
    address: {
      street: "789 River Road",
      city: "Corvallis",
      zipCode: "97333"
    },
    coordinates: {
      latitude: 44.5564,
      longitude: -123.2493
    },
    propertyType: "Residential",
    assessedValue: 520000,
    marketValue: 575000,
    landArea: 0.8,
    buildingArea: 2800,
    yearBuilt: 1982,
    lastAssessmentDate: "2025-03-10",
    taxDistrict: "Corvallis School District",
    zoning: "R-3 (High Density Residential)",
    features: ["Single Family Home", "4 Bedroom", "3 Bath", "Waterfront", "Dock"],
    images: ["property_11532_1.jpg", "property_11532_2.jpg"],
    taxExemptions: [],
    floodZone: true,
    lastUpdated: "2025-03-10",
    assessmentHistory: [
      { year: 2025, assessedValue: 520000, marketValue: 575000 },
      { year: 2024, assessedValue: 495000, marketValue: 550000 },
      { year: 2023, assessedValue: 475000, marketValue: 530000 }
    ]
  }
];