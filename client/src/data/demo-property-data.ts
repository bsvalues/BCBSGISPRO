import { GeoJSONFeature } from '@/lib/map-utils';
import { v4 as uuidv4 } from 'uuid';

// Realistic Benton County property data for demo purposes
// Based on authentic Benton County, Washington assessment standards
// These represent the 10 diverse examples requested in the BentonGeoPro demo

// 1. Residential Parcels (3 examples from distinct neighborhoods)
export const residentialParcels: GeoJSONFeature[] = [
  {
    type: 'Feature',
    id: uuidv4(),
    properties: {
      parcelId: '1-2345-401-1670-001',
      owner: 'Rodriguez Family Trust',
      address: '1470 Brentwood Drive, Richland, WA 99352',
      acres: 0.28,
      zoning: 'R-1 Residential',
      propertyType: 'Single Family Residential',
      yearBuilt: 1975,
      assessedValue: 329500,
      marketValue: 352000,
      landValue: 85000,
      improvementValue: 267000,
      taxCode: 'R003',
      levyCode: 'LC24',
      exemptionType: null,
      exemptionAmount: 0,
      neighborhoodCode: 'RICH-NE',
      schoolDistrict: 'Richland School District',
      dataQualityScore: 98,
      lastPhysicalInspection: '2023-06-12',
      assessmentYear: 2024,
      legalDescription: 'LOT 16, BLOCK 7, MEADOW SPRINGS ADDITION NO. 4, CITY OF RICHLAND, BENTON COUNTY, WASHINGTON.',
      subdivision: 'Meadow Springs',
      category: 'residential',
      location: 'Richland - Meadow Springs'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.286, 46.245],
        [-119.284, 46.245],
        [-119.284, 46.243],
        [-119.286, 46.243],
        [-119.286, 46.245]
      ]]
    }
  },
  {
    type: 'Feature',
    id: uuidv4(),
    properties: {
      parcelId: '1-1579-300-2840-002',
      owner: 'Smith, Robert & Sarah',
      address: '2305 West 4th Avenue, Kennewick, WA 99336',
      acres: 0.19,
      zoning: 'RS Residential Suburban',
      propertyType: 'Single Family Residential',
      yearBuilt: 1998,
      assessedValue: 425000,
      marketValue: 430000,
      landValue: 92000,
      improvementValue: 338000,
      taxCode: 'R001',
      levyCode: 'LC17',
      exemptionType: null,
      exemptionAmount: 0,
      neighborhoodCode: 'KENN-SW',
      schoolDistrict: 'Kennewick School District',
      dataQualityScore: 95,
      lastPhysicalInspection: '2022-09-04',
      assessmentYear: 2024,
      legalDescription: 'LOT 7, BLOCK 3, CANYON LAKES PHASE 6, CITY OF KENNEWICK, BENTON COUNTY, WASHINGTON.',
      subdivision: 'Canyon Lakes',
      category: 'residential',
      location: 'Kennewick - Canyon Lakes'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.193, 46.204],
        [-119.191, 46.204],
        [-119.191, 46.202],
        [-119.193, 46.202],
        [-119.193, 46.204]
      ]]
    }
  },
  {
    type: 'Feature',
    id: uuidv4(),
    properties: {
      parcelId: '1-0495-203-0072-003',
      owner: 'Johnson, David & Maria',
      address: '103 Eastlake Drive, West Richland, WA 99353',
      acres: 0.32,
      zoning: 'R-1 Medium Density Residential',
      propertyType: 'Single Family Residential',
      yearBuilt: 2018,
      assessedValue: 495000,
      marketValue: 510000,
      landValue: 110000,
      improvementValue: 400000,
      taxCode: 'R005',
      levyCode: 'LC09',
      exemptionType: null,
      exemptionAmount: 0,
      neighborhoodCode: 'WRICH-E',
      schoolDistrict: 'Richland School District',
      dataQualityScore: 99,
      lastPhysicalInspection: '2023-11-15',
      assessmentYear: 2024,
      legalDescription: 'LOT 4, BLOCK 2, WILLIAMS PLACE, CITY OF WEST RICHLAND, BENTON COUNTY, WASHINGTON.',
      subdivision: 'Williams Place',
      category: 'residential',
      location: 'West Richland - Eastlake'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.374, 46.292],
        [-119.372, 46.292],
        [-119.372, 46.290],
        [-119.374, 46.290],
        [-119.374, 46.292]
      ]]
    }
  }
];

// 2. Commercial Parcels (3 examples from varied business districts)
export const commercialParcels: GeoJSONFeature[] = [
  {
    type: 'Feature',
    id: uuidv4(),
    properties: {
      parcelId: '1-6089-400-1221-001',
      owner: 'Tri-Cities Business Center LLC',
      address: '1101 Columbia Center Blvd, Kennewick, WA 99336',
      acres: 2.74,
      zoning: 'CC Commercial Community',
      propertyType: 'Retail - Shopping Center',
      yearBuilt: 1988,
      assessedValue: 3850000,
      marketValue: 4100000,
      landValue: 1250000,
      improvementValue: 2850000,
      taxCode: 'C002',
      levyCode: 'LC17',
      exemptionType: null,
      exemptionAmount: 0,
      neighborhoodCode: 'COMM-COL',
      schoolDistrict: 'Kennewick School District',
      dataQualityScore: 92,
      lastPhysicalInspection: '2022-07-21',
      assessmentYear: 2024,
      legalDescription: 'PORTION OF THE NW 1/4 OF SECTION 15, TOWNSHIP 8 NORTH, RANGE 29 EAST, W.M., BENTON COUNTY, WASHINGTON',
      category: 'commercial',
      location: 'Kennewick - Columbia Center'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.222, 46.210],
        [-119.218, 46.210],
        [-119.218, 46.208],
        [-119.222, 46.208],
        [-119.222, 46.210]
      ]]
    }
  },
  {
    type: 'Feature',
    id: uuidv4(),
    properties: {
      parcelId: '1-0759-302-0015-002',
      owner: 'Richland Office Partners',
      address: '723 The Parkway, Richland, WA 99352',
      acres: 0.85,
      zoning: 'CBD Central Business District',
      propertyType: 'Office Building',
      yearBuilt: 1979,
      assessedValue: 1852000,
      marketValue: 1950000,
      landValue: 425000,
      improvementValue: 1525000,
      taxCode: 'C001',
      levyCode: 'LC24',
      exemptionType: null,
      exemptionAmount: 0,
      neighborhoodCode: 'COMM-UPT',
      schoolDistrict: 'Richland School District',
      dataQualityScore: 94,
      lastPhysicalInspection: '2023-02-08',
      assessmentYear: 2024,
      legalDescription: 'LOT 3, BLOCK 5, UPTOWN BUSINESS DISTRICT, CITY OF RICHLAND, BENTON COUNTY, WASHINGTON',
      category: 'commercial',
      location: 'Richland - Uptown'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.273, 46.277],
        [-119.271, 46.277],
        [-119.271, 46.276],
        [-119.273, 46.276],
        [-119.273, 46.277]
      ]]
    }
  },
  {
    type: 'Feature',
    id: uuidv4(),
    properties: {
      parcelId: '1-2279-103-4092-003',
      owner: 'Vintner Square Holdings LLC',
      address: '5453 Ridgeline Drive, Benton City, WA 99320',
      acres: 3.12,
      zoning: 'C-G General Commercial',
      propertyType: 'Winery/Tourism',
      yearBuilt: 2008,
      assessedValue: 2350000,
      marketValue: 2520000,
      landValue: 580000,
      improvementValue: 1940000,
      taxCode: 'C005',
      levyCode: 'LC13',
      exemptionType: null,
      exemptionAmount: 0,
      neighborhoodCode: 'WINE-RED',
      schoolDistrict: 'Kiona-Benton City School District',
      dataQualityScore: 96,
      lastPhysicalInspection: '2023-05-17',
      assessmentYear: 2024,
      legalDescription: 'PORTION OF THE SE 1/4 OF SECTION 22, TOWNSHIP 9 NORTH, RANGE 26 EAST, W.M., BENTON COUNTY, WASHINGTON',
      category: 'commercial',
      location: 'Benton City - Red Mountain AVA'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.478, 46.275],
        [-119.473, 46.275],
        [-119.473, 46.272],
        [-119.478, 46.272],
        [-119.478, 46.275]
      ]]
    }
  }
];

// 3. Agricultural Parcels (2 examples of typical Benton County farmland)
export const agriculturalParcels: GeoJSONFeature[] = [
  {
    type: 'Feature',
    id: uuidv4(),
    properties: {
      parcelId: '1-0394-100-0005-001',
      owner: 'Valley Harvest Farms Inc.',
      address: '242000 E Schuster Rd, Benton City, WA 99320',
      acres: 124.8,
      zoning: 'GMA-AG Agricultural',
      propertyType: 'Agricultural - Cropland',
      yearBuilt: null,
      assessedValue: 1250000,
      marketValue: 1370000,
      landValue: 1250000,
      improvementValue: 120000,
      taxCode: 'A001',
      levyCode: 'LC12',
      exemptionType: 'Agricultural Land',
      exemptionAmount: 450000,
      neighborhoodCode: 'AG-EAST',
      schoolDistrict: 'Kiona-Benton City School District',
      dataQualityScore: 91,
      lastPhysicalInspection: '2022-09-28',
      assessmentYear: 2024,
      legalDescription: 'S 1/2 OF THE NW 1/4 AND THE SW 1/4 OF SECTION 14, TOWNSHIP 9 NORTH, RANGE 26 EAST, W.M., BENTON COUNTY, WASHINGTON',
      cropType: 'Wine Grapes/Vineyards',
      irrigationSource: 'Irrigation District',
      soilType: 'Hezel-Quincy complex',
      category: 'agricultural',
      location: 'Eastern Benton County'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.420, 46.260],
        [-119.390, 46.260],
        [-119.390, 46.250],
        [-119.420, 46.250],
        [-119.420, 46.260]
      ]]
    }
  },
  {
    type: 'Feature',
    id: uuidv4(),
    properties: {
      parcelId: '1-1836-400-0023-002',
      owner: 'Columbia Basin Orchards LLC',
      address: '59403 N Glade Rd, Mesa, WA 99343',
      acres: 87.5,
      zoning: 'GMA-AG Agricultural',
      propertyType: 'Agricultural - Orchard',
      yearBuilt: 1968,
      assessedValue: 980000,
      marketValue: 1120000,
      landValue: 875000,
      improvementValue: 245000,
      taxCode: 'A002',
      levyCode: 'LC05',
      exemptionType: 'Agricultural Land',
      exemptionAmount: 380000,
      neighborhoodCode: 'AG-NORTH',
      schoolDistrict: 'North Franklin School District',
      dataQualityScore: 90,
      lastPhysicalInspection: '2022-11-03',
      assessmentYear: 2024,
      legalDescription: 'PORTION OF THE SW 1/4 OF SECTION 28, TOWNSHIP 12 NORTH, RANGE 29 EAST, W.M., BENTON COUNTY, WASHINGTON',
      cropType: 'Apple Orchard',
      irrigationSource: 'Columbia Basin Project',
      soilType: 'Scooteney silt loam',
      category: 'agricultural',
      location: 'Northern Benton County'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.120, 46.590],
        [-119.100, 46.590],
        [-119.100, 46.580],
        [-119.120, 46.580],
        [-119.120, 46.590]
      ]]
    }
  }
];

// 4. Special-Purpose Parcels (2 examples of unique zoning cases)
export const specialPurposeParcels: GeoJSONFeature[] = [
  {
    type: 'Feature',
    id: uuidv4(),
    properties: {
      parcelId: '1-3789-200-0056-001',
      owner: 'Benton County Public Utility District',
      address: '5601 W Van Giesen St, West Richland, WA 99353',
      acres: 4.25,
      zoning: 'PF Public Facility',
      propertyType: 'Utility Substation',
      yearBuilt: 1995,
      assessedValue: 4250000,
      marketValue: 4250000,
      landValue: 850000,
      improvementValue: 3400000,
      taxCode: 'P001',
      levyCode: 'LC09',
      exemptionType: 'Public Utility',
      exemptionAmount: 4250000,
      neighborhoodCode: 'UTIL-WR',
      schoolDistrict: 'Richland School District',
      dataQualityScore: 97,
      lastPhysicalInspection: '2023-07-19',
      assessmentYear: 2024,
      legalDescription: 'PORTION OF THE NE 1/4 OF SECTION 36, TOWNSHIP 10 NORTH, RANGE 27 EAST, W.M., BENTON COUNTY, WASHINGTON',
      category: 'special_purpose',
      location: 'West Richland - Van Giesen'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.366, 46.305],
        [-119.360, 46.305],
        [-119.360, 46.302],
        [-119.366, 46.302],
        [-119.366, 46.305]
      ]]
    }
  },
  {
    type: 'Feature',
    id: uuidv4(),
    properties: {
      parcelId: '1-5043-301-0079-002',
      owner: 'Washington State of - Department of Fish & Wildlife',
      address: '1149 Port Dr, Richland, WA 99354',
      acres: 15.72,
      zoning: 'OS Open Space',
      propertyType: 'Recreation Land',
      yearBuilt: 1982,
      assessedValue: 1850000,
      marketValue: 1850000,
      landValue: 1570000,
      improvementValue: 280000,
      taxCode: 'P003',
      levyCode: 'LC24',
      exemptionType: 'Government',
      exemptionAmount: 1850000,
      neighborhoodCode: 'WDLF-COL',
      schoolDistrict: 'Richland School District',
      dataQualityScore: 93,
      lastPhysicalInspection: '2023-03-22',
      assessmentYear: 2024,
      legalDescription: 'PORTION OF GOVERNMENT LOT 2, SECTION 11, TOWNSHIP 9 NORTH, RANGE 28 EAST, W.M., BENTON COUNTY, WASHINGTON',
      category: 'special_purpose',
      location: 'Richland - Columbia River Shoreline'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.269, 46.335],
        [-119.260, 46.335],
        [-119.260, 46.330],
        [-119.269, 46.330],
        [-119.269, 46.335]
      ]]
    }
  }
];

// Combined collection of all parcels for easy access
export const demoParcelCollection = [
  ...residentialParcels,
  ...commercialParcels,
  ...agriculturalParcels,
  ...specialPurposeParcels
];

// Demo collaboration projects
export const demoCollaborationProjects = [
  {
    id: uuidv4(),
    name: "Red Mountain AVA Development",
    description: "Collaborative assessment of vineyard and winery properties in the Red Mountain American Viticultural Area",
    parcels: [
      specialPurposeParcels[1].properties.parcelId,
      commercialParcels[2].properties.parcelId,
      agriculturalParcels[0].properties.parcelId
    ],
    createdBy: "admin",
    createdAt: new Date().toISOString(),
    status: "active",
    collaborators: ["admin", "assessor", "viewer"],
    tags: ["vineyard", "winery", "agricultural", "commercial"],
    lastModified: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Residential Growth Analysis",
    description: "Assessment of residential development patterns and property values in newer neighborhoods",
    parcels: [
      residentialParcels[0].properties.parcelId,
      residentialParcels[1].properties.parcelId,
      residentialParcels[2].properties.parcelId
    ],
    createdBy: "assessor",
    createdAt: new Date().toISOString(),
    status: "active",
    collaborators: ["admin", "assessor"],
    tags: ["residential", "development", "growth"],
    lastModified: new Date().toISOString()
  }
];

// Demo user accounts for the application
export const demoUserAccounts = [
  {
    id: 1,
    username: "admin",
    email: "admin@bentoncounty.gov",
    fullName: "Admin User",
    role: "Administrator",
    lastLogin: new Date().toISOString(),
    permissions: ["view", "edit", "delete", "create", "approve", "admin"],
    preferences: {
      defaultMapView: {
        center: [-119.33, 46.25],
        zoom: 9
      },
      theme: "light",
      notification: true
    }
  },
  {
    id: 2,
    username: "assessor",
    email: "assessor@bentoncounty.gov",
    fullName: "Assessment Officer",
    role: "Assessor",
    lastLogin: new Date().toISOString(),
    permissions: ["view", "edit", "create"],
    preferences: {
      defaultMapView: {
        center: [-119.33, 46.25],
        zoom: 9
      },
      theme: "light",
      notification: true
    }
  },
  {
    id: 3,
    username: "viewer",
    email: "viewer@bentoncounty.gov",
    fullName: "View Only User",
    role: "Viewer",
    lastLogin: new Date().toISOString(),
    permissions: ["view"],
    preferences: {
      defaultMapView: {
        center: [-119.33, 46.25],
        zoom: 9
      },
      theme: "light",
      notification: false
    }
  }
];

// Document examples related to our demo parcels
export const demoDocuments = [
  {
    id: uuidv4(),
    name: "Deed of Trust - Rodriguez Family",
    type: "DEED",
    parcelId: residentialParcels[0].properties.parcelId,
    uploadDate: "2023-12-15T10:30:00Z",
    size: 1250000, // 1.25 MB
    isArchived: false,
    metadata: {
      documentNumber: "2023-136940",
      recordingDate: "2023-12-10",
      parties: ["Rodriguez Family Trust", "First Benton Bank"],
      description: "Deed of Trust for residential property refinance"
    }
  },
  {
    id: uuidv4(),
    name: "Boundary Survey - Canyon Lakes Lot 7",
    type: "SURVEY",
    parcelId: residentialParcels[1].properties.parcelId,
    uploadDate: "2022-05-22T14:15:00Z",
    size: 3450000, // 3.45 MB
    isArchived: false,
    metadata: {
      surveyorName: "Tri-Cities Surveying Inc.",
      surveyDate: "2022-05-10",
      recordingNumber: "S-2022-0542",
      description: "ALTA/NSPS Land Title Survey"
    }
  },
  {
    id: uuidv4(),
    name: "Red Mountain AVA - Winery Plat",
    type: "PLAT",
    parcelId: commercialParcels[2].properties.parcelId,
    uploadDate: "2008-07-30T09:45:00Z",
    size: 2780000, // 2.78 MB
    isArchived: false,
    metadata: {
      platName: "Vintner Square",
      recordingNumber: "P-2008-0033",
      lots: 4,
      description: "Commercial plat for winery development"
    }
  },
  {
    id: uuidv4(),
    name: "Valley Harvest Farms - Agricultural Exemption",
    type: "TAX_RECORD",
    parcelId: agriculturalParcels[0].properties.parcelId,
    uploadDate: "2024-01-10T11:20:00Z",
    size: 890000, // 0.89 MB
    isArchived: false,
    metadata: {
      taxYear: 2024,
      exemptionType: "Agricultural Land",
      amount: 450000,
      description: "Annual agricultural exemption certification"
    }
  },
  {
    id: uuidv4(),
    name: "PUD Utility Easement",
    type: "EASEMENT",
    parcelId: specialPurposeParcels[0].properties.parcelId,
    uploadDate: "2020-09-05T15:50:00Z",
    size: 1120000, // 1.12 MB
    isArchived: false,
    metadata: {
      easementType: "Utility",
      width: "20 feet",
      recordingNumber: "E-2020-0879",
      description: "Permanent easement for electrical transmission equipment"
    }
  }
];