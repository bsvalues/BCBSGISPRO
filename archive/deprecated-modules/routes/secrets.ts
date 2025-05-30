/**
 * Secret Management Routes
 * 
 * Routes for checking availability of secrets.
 */

import { Router } from 'express';
import { asyncHandler } from '../error-handler';

// Create a router for secrets-related endpoints
const router = Router();

/**
 * Check if secrets exist
 * POST /api/check-secrets
 * 
 * Checks if specific environment variables (secrets) are set in the server environment.
 * Returns an object mapping secret names to boolean values indicating their presence.
 */
router.post('/check-secrets', asyncHandler(async (req, res) => {
  const { secretKeys } = req.body;
  
  // Validate input
  if (!secretKeys || !Array.isArray(secretKeys)) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'secretKeys must be an array of strings'
    });
  }
  
  // Check if each secret exists in the environment
  const secretStatus: Record<string, boolean> = {};
  for (const key of secretKeys) {
    // Only check valid string keys
    if (typeof key === 'string') {
      // Check if the environment variable exists and has a value
      secretStatus[key] = !!process.env[key]; 
    }
  }
  
  // Return the status of each requested secret
  res.json(secretStatus);
}));

export default router;