/**
 * Main API Router for TerraFusion Platform
 * 
 * This file combines all our API route modules into a single Express router.
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
    name: 'TerraFusion API',
    version: '1.0.0'
  });
});

// API routes
router.use('/counties', countiesRouter);
router.use('/parcels', parcelsRouter);
router.use('/valuations', valuationsRouter);
router.use('/layers', layersRouter);
router.use('/users', usersRouter);
router.use('/auth', authRouter);

export default router;