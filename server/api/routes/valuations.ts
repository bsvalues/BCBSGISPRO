/**
 * Valuations API Routes
 * 
 * This module implements the API routes for valuation-related operations.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Mock data store - will be replaced with database in future
const valuations = [
  {
    id: 'val-1',
    parcelId: 'parcel-1',
    countyId: 'benton-county',
    valuationDate: new Date('2023-08-20').toISOString(),
    requestedBy: 'user-1',
    landValue: 85000,
    improvementsValue: 225000,
    totalValue: 310000,
    confidence: 0.92,
    method: 'comparable-sales',
    status: 'completed',
    notes: 'Valuation based on 5 comparable properties within 0.5 miles',
    comparableProperties: ['parcel-2', 'parcel-4', 'parcel-5', 'parcel-7', 'parcel-8'],
    factors: {
      location: 1.05,
      size: 0.98,
      improvements: 1.03,
      condition: 1.0,
      market: 1.02
    },
    metadata: {
      algorithmVersion: '2.3.0',
      dataPoints: 47,
      marketTrends: {
        annual: 0.058,
        quarterly: 0.012
      }
    },
    createdAt: new Date('2023-08-15').toISOString(),
    updatedAt: new Date('2023-08-20').toISOString()
  },
  {
    id: 'val-2',
    parcelId: 'parcel-2',
    countyId: 'benton-county',
    valuationDate: new Date('2023-09-25').toISOString(),
    requestedBy: 'user-2',
    landValue: 110000,
    improvementsValue: 275000,
    totalValue: 385000,
    confidence: 0.89,
    method: 'comparable-sales',
    status: 'completed',
    notes: 'Valuation based on 4 comparable properties within 0.7 miles',
    comparableProperties: ['parcel-1', 'parcel-6', 'parcel-9', 'parcel-12'],
    factors: {
      location: 1.08,
      size: 1.02,
      improvements: 1.05,
      condition: 1.01,
      market: 1.03
    },
    metadata: {
      algorithmVersion: '2.3.0',
      dataPoints: 52,
      marketTrends: {
        annual: 0.061,
        quarterly: 0.015
      }
    },
    createdAt: new Date('2023-09-20').toISOString(),
    updatedAt: new Date('2023-09-25').toISOString()
  },
  {
    id: 'val-3',
    parcelId: 'parcel-3',
    countyId: 'yakima-county',
    valuationDate: new Date('2023-07-18').toISOString(),
    requestedBy: 'user-3',
    landValue: 75000,
    improvementsValue: 195000,
    totalValue: 270000,
    confidence: 0.85,
    method: 'comparable-sales',
    status: 'completed',
    notes: 'Valuation based on 3 comparable properties within 0.6 miles',
    comparableProperties: ['parcel-10', 'parcel-11', 'parcel-14'],
    factors: {
      location: 0.98,
      size: 0.99,
      improvements: 0.97,
      condition: 0.95,
      market: 1.01
    },
    metadata: {
      algorithmVersion: '2.3.0',
      dataPoints: 38,
      marketTrends: {
        annual: 0.052,
        quarterly: 0.009
      }
    },
    createdAt: new Date('2023-07-10').toISOString(),
    updatedAt: new Date('2023-07-18').toISOString()
  },
  {
    id: 'val-4',
    parcelId: 'parcel-1',
    countyId: 'benton-county',
    valuationDate: new Date('2022-08-10').toISOString(),
    requestedBy: 'user-1',
    landValue: 80000,
    improvementsValue: 215000,
    totalValue: 295000,
    confidence: 0.90,
    method: 'comparable-sales',
    status: 'completed',
    notes: 'Previous year valuation',
    comparableProperties: ['parcel-2', 'parcel-4', 'parcel-5'],
    factors: {
      location: 1.04,
      size: 0.98,
      improvements: 1.02,
      condition: 0.99,
      market: 1.01
    },
    metadata: {
      algorithmVersion: '2.2.5',
      dataPoints: 42
    },
    createdAt: new Date('2022-08-05').toISOString(),
    updatedAt: new Date('2022-08-10').toISOString()
  }
];

// GET all valuations with filtering
router.get('/', (req, res) => {
  const {
    countyId,
    parcelId,
    startDate,
    endDate,
    minValue,
    maxValue,
    method,
    status,
    requestedBy,
  } = req.query;
  
  let filteredValuations = [...valuations];
  
  // Apply filters
  if (countyId) {
    filteredValuations = filteredValuations.filter(valuation => valuation.countyId === countyId);
  }
  
  if (parcelId) {
    filteredValuations = filteredValuations.filter(valuation => valuation.parcelId === parcelId);
  }
  
  if (startDate) {
    const startDateObj = new Date(String(startDate));
    filteredValuations = filteredValuations.filter(valuation => 
      new Date(valuation.valuationDate) >= startDateObj
    );
  }
  
  if (endDate) {
    const endDateObj = new Date(String(endDate));
    filteredValuations = filteredValuations.filter(valuation => 
      new Date(valuation.valuationDate) <= endDateObj
    );
  }
  
  if (minValue) {
    filteredValuations = filteredValuations.filter(valuation => 
      valuation.totalValue >= Number(minValue)
    );
  }
  
  if (maxValue) {
    filteredValuations = filteredValuations.filter(valuation => 
      valuation.totalValue <= Number(maxValue)
    );
  }
  
  if (method) {
    filteredValuations = filteredValuations.filter(valuation => valuation.method === method);
  }
  
  if (status) {
    filteredValuations = filteredValuations.filter(valuation => valuation.status === status);
  }
  
  if (requestedBy) {
    filteredValuations = filteredValuations.filter(valuation => valuation.requestedBy === requestedBy);
  }
  
  // Apply pagination
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  
  const paginatedValuations = filteredValuations.slice(offset, offset + limit);
  
  res.json({
    success: true,
    data: paginatedValuations,
    meta: {
      total: filteredValuations.length,
      limit,
      offset
    }
  });
});

// GET specific valuation by ID
router.get('/:id', (req, res) => {
  const valuation = valuations.find(v => v.id === req.params.id);
  
  if (!valuation) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'VALUATION_NOT_FOUND',
        message: `Valuation with ID ${req.params.id} not found`
      }
    });
  }
  
  res.json({
    success: true,
    data: valuation
  });
});

// POST request a new valuation
router.post('/', (req, res) => {
  const {
    parcelId,
    countyId,
    method = 'comparable-sales',
    options,
    notes
  } = req.body;
  
  if (!parcelId || !countyId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'parcelId and countyId are required'
      }
    });
  }
  
  // In a real app, we would calculate the actual valuation here
  // For now, just create a mock valuation
  const newValuation = {
    id: `val-${uuidv4().substring(0, 8)}`,
    parcelId,
    countyId,
    valuationDate: new Date().toISOString(),
    requestedBy: 'user-1', // In a real app, this would come from the authenticated user
    landValue: Math.floor(Math.random() * 150000) + 50000,
    improvementsValue: Math.floor(Math.random() * 300000) + 100000,
    method,
    status: Math.random() > 0.1 ? 'completed' : 'pending', // 90% chance of completing immediately
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Calculate total value
  newValuation.totalValue = newValuation.landValue + newValuation.improvementsValue;
  
  // Add random confidence
  newValuation.confidence = Math.random() * 0.25 + 0.75; // Between 0.75 and 1.0
  
  // Add other fields if valuation is completed
  if (newValuation.status === 'completed') {
    // Mock comparable properties
    newValuation.comparableProperties = Array.from({ length: Math.floor(Math.random() * 5) + 2 }, 
      (_, i) => `parcel-${Math.floor(Math.random() * 15) + 1}`);
    
    // Mock factors
    newValuation.factors = {
      location: Math.random() * 0.2 + 0.9, // Between 0.9 and 1.1
      size: Math.random() * 0.2 + 0.9,
      improvements: Math.random() * 0.2 + 0.9,
      condition: Math.random() * 0.2 + 0.9,
      market: Math.random() * 0.2 + 0.9
    };
    
    // Mock metadata
    newValuation.metadata = {
      algorithmVersion: '2.3.0',
      dataPoints: Math.floor(Math.random() * 30) + 30,
      marketTrends: {
        annual: Math.random() * 0.03 + 0.04, // Between 0.04 and 0.07
        quarterly: Math.random() * 0.01 + 0.008 // Between 0.008 and 0.018
      }
    };
  }
  
  valuations.push(newValuation);
  
  res.status(201).json({
    success: true,
    data: newValuation
  });
});

// PATCH update a valuation
router.patch('/:id', (req, res) => {
  const valuationIndex = valuations.findIndex(v => v.id === req.params.id);
  
  if (valuationIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'VALUATION_NOT_FOUND',
        message: `Valuation with ID ${req.params.id} not found`
      }
    });
  }
  
  // Update valuation with request body data
  valuations[valuationIndex] = {
    ...valuations[valuationIndex],
    ...req.body,
    id: req.params.id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: valuations[valuationIndex]
  });
});

// DELETE a valuation
router.delete('/:id', (req, res) => {
  const valuationIndex = valuations.findIndex(v => v.id === req.params.id);
  
  if (valuationIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'VALUATION_NOT_FOUND',
        message: `Valuation with ID ${req.params.id} not found`
      }
    });
  }
  
  valuations.splice(valuationIndex, 1);
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// POST request review for a valuation
router.post('/:id/review', (req, res) => {
  const valuationIndex = valuations.findIndex(v => v.id === req.params.id);
  
  if (valuationIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'VALUATION_NOT_FOUND',
        message: `Valuation with ID ${req.params.id} not found`
      }
    });
  }
  
  // Update valuation status to review-required
  valuations[valuationIndex].status = 'review-required';
  valuations[valuationIndex].notes = req.body.notes || valuations[valuationIndex].notes;
  valuations[valuationIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: valuations[valuationIndex]
  });
});

// POST approve a valuation after review
router.post('/:id/approve', (req, res) => {
  const valuationIndex = valuations.findIndex(v => v.id === req.params.id);
  
  if (valuationIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'VALUATION_NOT_FOUND',
        message: `Valuation with ID ${req.params.id} not found`
      }
    });
  }
  
  // Update valuation status to completed
  valuations[valuationIndex].status = 'completed';
  if (req.body.notes) {
    valuations[valuationIndex].notes = req.body.notes;
  }
  valuations[valuationIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: valuations[valuationIndex]
  });
});

// GET valuation history for a parcel
router.get('/parcels/:parcelId/valuation-history', (req, res) => {
  const parcelValuations = valuations.filter(
    v => v.parcelId === req.params.parcelId && v.status === 'completed'
  );
  
  if (parcelValuations.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NO_VALUATIONS_FOUND',
        message: `No valuations found for parcel ${req.params.parcelId}`
      }
    });
  }
  
  // Sort valuations by date
  parcelValuations.sort((a, b) => 
    new Date(a.valuationDate).getTime() - new Date(b.valuationDate).getTime()
  );
  
  // Create trend data
  const trend = {
    dates: parcelValuations.map(v => v.valuationDate),
    values: parcelValuations.map(v => v.totalValue)
  };
  
  res.json({
    success: true,
    data: {
      valuations: parcelValuations,
      trend
    }
  });
});

// GET generate a valuation report
router.get('/:id/report', (req, res) => {
  const valuation = valuations.find(v => v.id === req.params.id);
  
  if (!valuation) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'VALUATION_NOT_FOUND',
        message: `Valuation with ID ${req.params.id} not found`
      }
    });
  }
  
  const format = req.query.format || 'pdf';
  
  // In a real app, we would generate a proper report in the requested format
  // For now, just return the valuation data with a different content type
  
  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    // We would generate a real PDF here, but for the mock just return text
    res.send(`Mock PDF report for valuation ${valuation.id}`);
  } else if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    // Mock CSV data
    const csv = `id,parcelId,countyId,valuationDate,landValue,improvementsValue,totalValue,confidence\n${valuation.id},${valuation.parcelId},${valuation.countyId},${valuation.valuationDate},${valuation.landValue},${valuation.improvementsValue},${valuation.totalValue},${valuation.confidence}`;
    res.send(csv);
  } else {
    // Default to JSON
    res.json({
      success: true,
      data: {
        report: {
          valuationId: valuation.id,
          generatedAt: new Date().toISOString(),
          data: valuation
        }
      }
    });
  }
});

export default router;