/**
 * Main API Router for TerraFusion Platform
 * 
 * This file combines all our API route modules into a single Express router.
 */

const express = require('express');
const countiesRouter = require('./routes/counties');
const parcelsRouter = require('./routes/parcels');
const valuationsRouter = require('./routes/valuations');
const layersRouter = require('./routes/layers');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

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

module.exports = router;