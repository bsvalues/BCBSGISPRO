/**
 * Counties API Routes
 * 
 * This module implements the API routes for county-related operations.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Mock data store - will be replaced with database in future
const counties = [
  {
    id: 'benton-county',
    name: 'Benton County',
    state: 'WA',
    status: 'active',
    fips: '53005',
    properties: { 
      parcelCount: 65430,
      population: 204390,
      area: 1760,
      gisReady: true,
      valuationSystemIntegrated: true,
      taxSystemIntegrated: true
    },
    lastUpdated: new Date('2023-12-10').toISOString(),
    createdAt: new Date('2023-01-15').toISOString(),
    updatedAt: new Date('2023-12-10').toISOString(),
    contacts: [
      {
        name: 'Sarah Johnson',
        role: 'Assessor',
        email: 'sarah.johnson@example.gov',
        phone: '509-555-1234'
      }
    ]
  },
  {
    id: 'yakima-county',
    name: 'Yakima County',
    state: 'WA',
    status: 'active',
    fips: '53077',
    properties: { 
      parcelCount: 89750,
      population: 250873,
      area: 4296,
      gisReady: true,
      valuationSystemIntegrated: false,
      taxSystemIntegrated: true
    },
    lastUpdated: new Date('2023-11-05').toISOString(),
    createdAt: new Date('2023-02-20').toISOString(),
    updatedAt: new Date('2023-11-05').toISOString(),
    contacts: [
      {
        name: 'Robert Chen',
        role: 'Assessor',
        email: 'robert.chen@example.gov',
        phone: '509-555-9876'
      }
    ]
  }
];

// GET all counties
router.get('/', (req, res) => {
  const { status, state, search } = req.query;
  
  let filteredCounties = [...counties];
  
  // Apply filters
  if (status) {
    filteredCounties = filteredCounties.filter(county => county.status === status);
  }
  
  if (state) {
    filteredCounties = filteredCounties.filter(county => county.state === state);
  }
  
  if (search) {
    const searchTerm = String(search).toLowerCase();
    filteredCounties = filteredCounties.filter(county => 
      county.name.toLowerCase().includes(searchTerm) ||
      county.id.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply pagination
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  
  const paginatedCounties = filteredCounties.slice(offset, offset + limit);
  
  res.json({
    success: true,
    data: paginatedCounties,
    meta: {
      total: filteredCounties.length,
      limit,
      offset
    }
  });
});

// GET county by ID
router.get('/:id', (req, res) => {
  const county = counties.find(c => c.id === req.params.id);
  
  if (!county) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COUNTY_NOT_FOUND',
        message: `County with ID ${req.params.id} not found`
      }
    });
  }
  
  res.json({
    success: true,
    data: county
  });
});

// POST create a new county
router.post('/', (req, res) => {
  const newCounty = {
    id: req.body.id || `${req.body.name.toLowerCase().replace(/\s+/g, '-')}-${uuidv4().substring(0, 8)}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  counties.push(newCounty);
  
  res.status(201).json({
    success: true,
    data: newCounty
  });
});

// PATCH update a county
router.patch('/:id', (req, res) => {
  const countyIndex = counties.findIndex(c => c.id === req.params.id);
  
  if (countyIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COUNTY_NOT_FOUND',
        message: `County with ID ${req.params.id} not found`
      }
    });
  }
  
  // Update county with request body data
  counties[countyIndex] = {
    ...counties[countyIndex],
    ...req.body,
    id: req.params.id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: counties[countyIndex]
  });
});

// DELETE a county
router.delete('/:id', (req, res) => {
  const countyIndex = counties.findIndex(c => c.id === req.params.id);
  
  if (countyIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COUNTY_NOT_FOUND',
        message: `County with ID ${req.params.id} not found`
      }
    });
  }
  
  counties.splice(countyIndex, 1);
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// POST activate a county
router.post('/:id/activate', (req, res) => {
  const countyIndex = counties.findIndex(c => c.id === req.params.id);
  
  if (countyIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COUNTY_NOT_FOUND',
        message: `County with ID ${req.params.id} not found`
      }
    });
  }
  
  counties[countyIndex].status = 'active';
  counties[countyIndex].updatedAt = new Date().toISOString();
  counties[countyIndex].lastUpdated = new Date().toISOString();
  
  res.json({
    success: true,
    data: counties[countyIndex]
  });
});

// POST archive a county
router.post('/:id/archive', (req, res) => {
  const countyIndex = counties.findIndex(c => c.id === req.params.id);
  
  if (countyIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COUNTY_NOT_FOUND',
        message: `County with ID ${req.params.id} not found`
      }
    });
  }
  
  counties[countyIndex].status = 'archived';
  counties[countyIndex].updatedAt = new Date().toISOString();
  counties[countyIndex].lastUpdated = new Date().toISOString();
  
  res.json({
    success: true,
    data: counties[countyIndex]
  });
});

// GET county stats
router.get('/:id/stats', (req, res) => {
  const county = counties.find(c => c.id === req.params.id);
  
  if (!county) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COUNTY_NOT_FOUND',
        message: `County with ID ${req.params.id} not found`
      }
    });
  }
  
  // Mock stats data - would come from database in real app
  const stats = {
    parcelCount: county.properties.parcelCount,
    valuationCount: Math.floor(county.properties.parcelCount * 0.75),
    userCount: Math.floor(Math.random() * 10) + 5,
    lastUpdated: county.lastUpdated
  };
  
  res.json({
    success: true,
    data: stats
  });
});

// GET county validation issues
router.get('/:id/validation-issues', (req, res) => {
  const county = counties.find(c => c.id === req.params.id);
  
  if (!county) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COUNTY_NOT_FOUND',
        message: `County with ID ${req.params.id} not found`
      }
    });
  }
  
  // Mock validation issues - would come from database in real app
  const validationIssues = [
    {
      id: 'issue-1',
      type: 'warning',
      message: 'Missing metadata for 23 parcels',
      component: 'ETL',
      resolved: false
    },
    {
      id: 'issue-2',
      type: 'error',
      message: 'Invalid geometry in 5 parcels',
      component: 'GIS',
      resolved: false
    },
    {
      id: 'issue-3',
      type: 'warning',
      message: 'Outdated tax data (>90 days)',
      component: 'Integration',
      resolved: true
    }
  ];
  
  res.json({
    success: true,
    data: validationIssues
  });
});

// POST resolve a validation issue
router.post('/:countyId/validation-issues/:issueId/resolve', (req, res) => {
  const county = counties.find(c => c.id === req.params.countyId);
  
  if (!county) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COUNTY_NOT_FOUND',
        message: `County with ID ${req.params.countyId} not found`
      }
    });
  }
  
  // In a real app, we would update the validation issue in the database
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// POST test a data source
router.post('/:countyId/datasources/:dataSourceId/test', (req, res) => {
  const county = counties.find(c => c.id === req.params.countyId);
  
  if (!county) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COUNTY_NOT_FOUND',
        message: `County with ID ${req.params.countyId} not found`
      }
    });
  }
  
  // Mock data source test result - would actually test connection in real app
  const testResult = {
    success: true,
    message: 'Connection successful',
    details: {
      responseTime: '120ms',
      availableResources: ['parcels', 'owners', 'valuation']
    }
  };
  
  res.json({
    success: true,
    data: testResult
  });
});

export default router;