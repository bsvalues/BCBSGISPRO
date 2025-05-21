/**
 * API Router
 * 
 * This file sets up the API routes for the TerraFusion platform.
 */

import express from 'express';
import countiesRouter from './routes/counties';
import parcelsRouter from './routes/parcels';
import valuationsRouter from './routes/valuations';
import layersRouter from './routes/layers';
import usersRouter from './routes/users';
import authRouter from './routes/auth';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
router.use('/counties', countiesRouter);
router.use('/parcels', parcelsRouter);
router.use('/valuations', valuationsRouter);
router.use('/layers', layersRouter);
router.use('/users', usersRouter);
router.use('/auth', authRouter);

export default router;