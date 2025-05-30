/**
 * Counties API Routes
 * 
 * This module implements the API routes for county-related operations.
 */

import express from 'express';
import { storage } from '../../storage';
import { ApiError, asyncHandler } from '../../error-handler';
import { insertCountySchema } from '../../../shared/schema';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all counties
router.get('/', asyncHandler(async (req, res) => {
  const counties = await storage.getCounties();
  res.json(counties);
}));

// Get a specific county by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const county = await storage.getCounty(req.params.id);
  
  if (!county) {
    throw new ApiError(404, 'County not found');
  }
  
  res.json(county);
}));

// Create a new county
router.post('/', asyncHandler(async (req, res) => {
  const result = insertCountySchema.safeParse(req.body);
  
  if (!result.success) {
    throw new ApiError(400, 'Invalid county data', result.error);
  }
  
  const newCounty = {
    ...result.data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await storage.createCounty(newCounty);
  res.status(201).json(newCounty);
}));

// Update a county
router.put('/:id', asyncHandler(async (req, res) => {
  // First check if the county exists
  const county = await storage.getCounty(req.params.id);
  
  if (!county) {
    throw new ApiError(404, 'County not found');
  }
  
  const result = insertCountySchema.safeParse(req.body);
  
  if (!result.success) {
    throw new ApiError(400, 'Invalid county data', result.error);
  }
  
  const updatedCounty = {
    ...result.data,
    id: req.params.id,
    createdAt: county.createdAt,
    updatedAt: new Date().toISOString()
  };
  
  await storage.updateCounty(updatedCounty);
  res.json(updatedCounty);
}));

// Delete a county
router.delete('/:id', asyncHandler(async (req, res) => {
  const county = await storage.getCounty(req.params.id);
  
  if (!county) {
    throw new ApiError(404, 'County not found');
  }
  
  await storage.deleteCounty(req.params.id);
  res.status(204).send();
}));

// Get map layers for a county
router.get('/:id/layers', asyncHandler(async (req, res) => {
  const county = await storage.getCounty(req.params.id);
  
  if (!county) {
    throw new ApiError(404, 'County not found');
  }
  
  const layers = await storage.getLayersByCounty(req.params.id);
  res.json(layers);
}));

// Get parcels for a county
router.get('/:id/parcels', asyncHandler(async (req, res) => {
  const county = await storage.getCounty(req.params.id);
  
  if (!county) {
    throw new ApiError(404, 'County not found');
  }
  
  // Support pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = (page - 1) * limit;
  
  const parcels = await storage.getParcelsByCounty(req.params.id, { limit, offset });
  const totalCount = await storage.countParcelsByCounty(req.params.id);
  
  res.json({
    data: parcels,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
}));

// Get statistics for a county
router.get('/:id/statistics', asyncHandler(async (req, res) => {
  const county = await storage.getCounty(req.params.id);
  
  if (!county) {
    throw new ApiError(404, 'County not found');
  }
  
  const totalParcels = await storage.countParcelsByCounty(req.params.id);
  const totalLayers = await storage.countLayersByCounty(req.params.id);
  const recentValuations = await storage.getRecentValuationsByCounty(req.params.id, 5);
  
  res.json({
    totalParcels,
    totalLayers,
    recentValuations,
    lastUpdated: new Date().toISOString()
  });
}));

export default router;