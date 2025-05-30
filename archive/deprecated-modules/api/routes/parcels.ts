/**
 * Parcels API Routes
 * 
 * This module implements the API routes for parcel-related operations.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Mock data store - will be replaced with database in future
const parcels = [
  {
    id: 'parcel-1',
    countyId: 'benton-county',
    apn: '1-2345-67890',
    address: {
      street: '123 Main St',
      city: 'Kennewick',
      state: 'WA',
      zip: '99336',
      country: 'USA'
    },
    legalDescription: 'Lot 5, Block 2, Meadow Vista Addition, City of Kennewick, Benton County, Washington',
    acreage: 0.25,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.137, 46.211],
        [-119.135, 46.211],
        [-119.135, 46.212],
        [-119.137, 46.212],
        [-119.137, 46.211]
      ]]
    },
    zoning: 'R-1',
    landUse: 'residential',
    propertyClass: 'single-family',
    ownerName: 'John Smith',
    ownerAddress: '123 Main St, Kennewick, WA 99336',
    lastAssessmentDate: new Date('2023-08-15').toISOString(),
    assessedValue: {
      land: 85000,
      improvements: 225000,
      total: 310000
    },
    marketValue: {
      land: 90000,
      improvements: 235000,
      total: 325000
    },
    lastSaleDate: new Date('2019-04-22').toISOString(),
    lastSalePrice: 298000,
    metadata: {
      yearBuilt: 1998,
      squareFeet: 2150,
      bedrooms: 4,
      bathrooms: 2.5
    },
    createdAt: new Date('2023-01-15').toISOString(),
    updatedAt: new Date('2023-08-15').toISOString(),
    active: true
  },
  {
    id: 'parcel-2',
    countyId: 'benton-county',
    apn: '1-3456-78901',
    address: {
      street: '456 Oak Ave',
      city: 'Richland',
      state: 'WA',
      zip: '99352',
      country: 'USA'
    },
    legalDescription: 'Lot 12, Block 4, River View Addition, City of Richland, Benton County, Washington',
    acreage: 0.35,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.285, 46.285],
        [-119.283, 46.285],
        [-119.283, 46.287],
        [-119.285, 46.287],
        [-119.285, 46.285]
      ]]
    },
    zoning: 'R-2',
    landUse: 'residential',
    propertyClass: 'single-family',
    ownerName: 'Mary Johnson',
    ownerAddress: '456 Oak Ave, Richland, WA 99352',
    lastAssessmentDate: new Date('2023-09-20').toISOString(),
    assessedValue: {
      land: 110000,
      improvements: 275000,
      total: 385000
    },
    marketValue: {
      land: 120000,
      improvements: 290000,
      total: 410000
    },
    lastSaleDate: new Date('2020-07-15').toISOString(),
    lastSalePrice: 395000,
    metadata: {
      yearBuilt: 2005,
      squareFeet: 2800,
      bedrooms: 4,
      bathrooms: 3
    },
    createdAt: new Date('2023-02-10').toISOString(),
    updatedAt: new Date('2023-09-20').toISOString(),
    active: true
  },
  {
    id: 'parcel-3',
    countyId: 'yakima-county',
    apn: '2-4567-89012',
    address: {
      street: '789 Pine St',
      city: 'Yakima',
      state: 'WA',
      zip: '98901',
      country: 'USA'
    },
    legalDescription: 'Lot 8, Block 3, Mountain View Addition, City of Yakima, Yakima County, Washington',
    acreage: 0.2,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-120.531, 46.602],
        [-120.529, 46.602],
        [-120.529, 46.603],
        [-120.531, 46.603],
        [-120.531, 46.602]
      ]]
    },
    zoning: 'R-1',
    landUse: 'residential',
    propertyClass: 'single-family',
    ownerName: 'Robert Wilson',
    ownerAddress: '789 Pine St, Yakima, WA 98901',
    lastAssessmentDate: new Date('2023-07-10').toISOString(),
    assessedValue: {
      land: 75000,
      improvements: 195000,
      total: 270000
    },
    marketValue: {
      land: 80000,
      improvements: 205000,
      total: 285000
    },
    lastSaleDate: new Date('2018-09-30').toISOString(),
    lastSalePrice: 260000,
    metadata: {
      yearBuilt: 1985,
      squareFeet: 1850,
      bedrooms: 3,
      bathrooms: 2
    },
    createdAt: new Date('2023-03-05').toISOString(),
    updatedAt: new Date('2023-07-10').toISOString(),
    active: true
  }
];

// GET all parcels with filtering
router.get('/', (req, res) => {
  const {
    countyId,
    apn,
    ownerName,
    minAcreage,
    maxAcreage,
    zoning,
    landUse,
    propertyClass,
    minValue,
    maxValue,
    active,
    bbox,
  } = req.query;
  
  let filteredParcels = [...parcels];
  
  // Apply filters
  if (countyId) {
    filteredParcels = filteredParcels.filter(parcel => parcel.countyId === countyId);
  }
  
  if (apn) {
    filteredParcels = filteredParcels.filter(parcel => 
      parcel.apn.toLowerCase().includes(String(apn).toLowerCase())
    );
  }
  
  if (ownerName) {
    filteredParcels = filteredParcels.filter(parcel => 
      parcel.ownerName.toLowerCase().includes(String(ownerName).toLowerCase())
    );
  }
  
  if (minAcreage) {
    filteredParcels = filteredParcels.filter(parcel => parcel.acreage >= Number(minAcreage));
  }
  
  if (maxAcreage) {
    filteredParcels = filteredParcels.filter(parcel => parcel.acreage <= Number(maxAcreage));
  }
  
  if (zoning) {
    filteredParcels = filteredParcels.filter(parcel => parcel.zoning === zoning);
  }
  
  if (landUse) {
    filteredParcels = filteredParcels.filter(parcel => parcel.landUse === landUse);
  }
  
  if (propertyClass) {
    filteredParcels = filteredParcels.filter(parcel => parcel.propertyClass === propertyClass);
  }
  
  if (minValue) {
    filteredParcels = filteredParcels.filter(parcel => 
      parcel.assessedValue.total >= Number(minValue)
    );
  }
  
  if (maxValue) {
    filteredParcels = filteredParcels.filter(parcel => 
      parcel.assessedValue.total <= Number(maxValue)
    );
  }
  
  if (active !== undefined) {
    const isActive = active === 'true';
    filteredParcels = filteredParcels.filter(parcel => parcel.active === isActive);
  }
  
  if (bbox) {
    // Parse bbox as [minX, minY, maxX, maxY]
    const [minX, minY, maxX, maxY] = String(bbox).split(',').map(Number);
    
    // Filter parcels within bounding box
    // This is a simplified check - in a real app we would use proper geospatial functions
    filteredParcels = filteredParcels.filter(parcel => {
      if (!parcel.geometry || !parcel.geometry.coordinates) return false;
      
      // For Polygon geometries, check if any point is within the bounding box
      const coords = parcel.geometry.coordinates[0];
      for (const [x, y] of coords) {
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          return true;
        }
      }
      return false;
    });
  }
  
  // Apply pagination
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  
  const paginatedParcels = filteredParcels.slice(offset, offset + limit);
  
  res.json({
    success: true,
    data: paginatedParcels,
    meta: {
      total: filteredParcels.length,
      limit,
      offset
    }
  });
});

// GET specific parcel by ID
router.get('/:id', (req, res) => {
  const parcel = parcels.find(p => p.id === req.params.id);
  
  if (!parcel) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PARCEL_NOT_FOUND',
        message: `Parcel with ID ${req.params.id} not found`
      }
    });
  }
  
  res.json({
    success: true,
    data: parcel
  });
});

// POST create a new parcel
router.post('/', (req, res) => {
  const newParcel = {
    id: req.body.id || `parcel-${uuidv4().substring(0, 8)}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: req.body.active !== undefined ? req.body.active : true
  };
  
  parcels.push(newParcel);
  
  res.status(201).json({
    success: true,
    data: newParcel
  });
});

// PATCH update a parcel
router.patch('/:id', (req, res) => {
  const parcelIndex = parcels.findIndex(p => p.id === req.params.id);
  
  if (parcelIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PARCEL_NOT_FOUND',
        message: `Parcel with ID ${req.params.id} not found`
      }
    });
  }
  
  // Update parcel with request body data
  parcels[parcelIndex] = {
    ...parcels[parcelIndex],
    ...req.body,
    id: req.params.id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: parcels[parcelIndex]
  });
});

// DELETE a parcel
router.delete('/:id', (req, res) => {
  const parcelIndex = parcels.findIndex(p => p.id === req.params.id);
  
  if (parcelIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PARCEL_NOT_FOUND',
        message: `Parcel with ID ${req.params.id} not found`
      }
    });
  }
  
  parcels.splice(parcelIndex, 1);
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// POST batch import parcels for a county
router.post('/counties/:countyId/batch', (req, res) => {
  if (!req.body.parcels || !Array.isArray(req.body.parcels)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Request body must include a parcels array'
      }
    });
  }
  
  const importedParcels = [];
  const errors = [];
  
  req.body.parcels.forEach((parcelData, index) => {
    try {
      const newParcel = {
        id: parcelData.id || `parcel-${uuidv4().substring(0, 8)}`,
        ...parcelData,
        countyId: req.params.countyId, // Ensure correct county ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        active: parcelData.active !== undefined ? parcelData.active : true
      };
      
      parcels.push(newParcel);
      importedParcels.push(newParcel);
    } catch (error) {
      errors.push({
        index,
        error: error.message || 'Unknown error'
      });
    }
  });
  
  res.status(201).json({
    success: true,
    data: {
      success: true,
      imported: importedParcels.length,
      errors: errors.length > 0 ? errors : undefined
    }
  });
});

// GET parcel history
router.get('/:id/history', (req, res) => {
  const parcel = parcels.find(p => p.id === req.params.id);
  
  if (!parcel) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PARCEL_NOT_FOUND',
        message: `Parcel with ID ${req.params.id} not found`
      }
    });
  }
  
  // Mock history data - would come from database in real app
  const history = [
    {
      id: 'hist-1',
      parcelId: parcel.id,
      userId: 'user-1',
      action: 'create',
      timestamp: new Date(parcel.createdAt).toISOString(),
      changes: {}
    },
    {
      id: 'hist-2',
      parcelId: parcel.id,
      userId: 'user-2',
      action: 'update',
      timestamp: new Date(new Date(parcel.updatedAt).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      changes: {
        assessedValue: {
          old: {
            land: 80000,
            improvements: 215000,
            total: 295000
          },
          new: {
            land: 85000,
            improvements: 225000,
            total: 310000
          }
        }
      }
    },
    {
      id: 'hist-3',
      parcelId: parcel.id,
      userId: 'user-1',
      action: 'update',
      timestamp: parcel.updatedAt,
      changes: {
        zoning: {
          old: 'R-2',
          new: 'R-1'
        }
      }
    }
  ];
  
  res.json({
    success: true,
    data: history
  });
});

export default router;