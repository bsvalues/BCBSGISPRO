/**
 * AI Co-worker API Routes
 * 
 * This module provides API routes for the AI co-worker functionality.
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../error-handler';
import { 
  aiCoworkerService, 
  CoworkerContextData,
  CoworkerMessageInput 
} from '../services/ai-coworker';
import { coworkerModeEnum } from '../../shared/schema';
import passport from 'passport';

const router = Router();

// Middleware to ensure user is authenticated
router.use(passport.authenticate('session'));

/**
 * GET /api/coworker/profiles
 * Get all available co-worker profiles
 */
router.get('/profiles', asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const profiles = await aiCoworkerService.getAllCoworkerProfiles(includeInactive);
  res.json(profiles);
}));

/**
 * GET /api/coworker/profiles/:id
 * Get a specific co-worker profile
 */
router.get('/profiles/:id', asyncHandler(async (req, res) => {
  const profileId = parseInt(req.params.id, 10);
  
  if (isNaN(profileId)) {
    throw new ApiError('INVALID_ID', 'Invalid profile ID', 400);
  }
  
  const profile = await aiCoworkerService.getCoworkerProfile(profileId);
  
  if (!profile) {
    throw new ApiError('PROFILE_NOT_FOUND', `Co-worker profile not found: ${profileId}`, 404);
  }
  
  res.json(profile);
}));

/**
 * POST /api/coworker/profiles
 * Create a new co-worker profile
 */
router.post('/profiles', asyncHandler(async (req, res) => {
  // Validate request body
  const schema = z.object({
    name: z.string().min(1).max(100),
    role: z.string().min(1).max(100),
    description: z.string().optional().nullable(),
    avatarUrl: z.string().optional().nullable(),
    specialties: z.array(z.string()).optional().nullable(),
    defaultMode: z.enum(['ASSISTANT', 'COLLABORATOR', 'PARTNER', 'SUPERVISOR']).optional().nullable(),
    systemPrompt: z.string().optional().nullable(),
    isActive: z.boolean().optional().nullable()
  });
  
  const profileData = schema.parse(req.body);
  
  // Convert undefined values to null for database compatibility
  const dbProfileData = {
    name: profileData.name,
    role: profileData.role,
    description: profileData.description ?? null,
    avatarUrl: profileData.avatarUrl ?? null,
    specialties: profileData.specialties ?? null,
    defaultMode: profileData.defaultMode ?? null,
    systemPrompt: profileData.systemPrompt ?? null,
    isActive: profileData.isActive ?? null
  };
  
  const profile = await aiCoworkerService.createCoworkerProfile(dbProfileData);
  
  res.status(201).json(profile);
}));

/**
 * GET /api/coworker/sessions
 * Get co-worker sessions for the current user
 */
router.get('/sessions', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit as string || '10', 10);
  
  const sessions = await aiCoworkerService.getUserSessions(userId, limit);
  res.json(sessions);
}));

/**
 * GET /api/coworker/sessions/:id
 * Get a specific co-worker session
 */
router.get('/sessions/:id', asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  
  if (isNaN(sessionId)) {
    throw new ApiError('INVALID_ID', 'Invalid session ID', 400);
  }
  
  const session = await aiCoworkerService.getSession(sessionId);
  
  if (!session) {
    throw new ApiError('SESSION_NOT_FOUND', `Co-worker session not found: ${sessionId}`, 404);
  }
  
  // Verify the session belongs to the current user
  if (session.userId !== req.user.id) {
    throw new ApiError('UNAUTHORIZED', 'You do not have permission to access this session', 403);
  }
  
  res.json(session);
}));

/**
 * POST /api/coworker/sessions
 * Start a new co-worker session
 */
router.post('/sessions', asyncHandler(async (req, res) => {
  // Validate request body
  const schema = z.object({
    coworkerId: z.number().int().positive(),
    initialContext: z.record(z.any()).optional(),
    mode: z.enum(['ASSISTANT', 'COLLABORATOR', 'PARTNER', 'SUPERVISOR']).optional()
  });
  
  const { coworkerId, initialContext, mode } = schema.parse(req.body);
  const userId = req.user.id;
  
  const session = await aiCoworkerService.startSession(
    userId, 
    coworkerId, 
    initialContext as CoworkerContextData,
    mode
  );
  
  res.status(201).json(session);
}));

/**
 * PUT /api/coworker/sessions/:id/context
 * Update session context
 */
router.put('/sessions/:id/context', asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  
  if (isNaN(sessionId)) {
    throw new ApiError('INVALID_ID', 'Invalid session ID', 400);
  }
  
  // Get the session to verify ownership
  const session = await aiCoworkerService.getSession(sessionId);
  
  if (!session) {
    throw new ApiError('SESSION_NOT_FOUND', `Co-worker session not found: ${sessionId}`, 404);
  }
  
  if (session.userId !== req.user.id) {
    throw new ApiError('UNAUTHORIZED', 'You do not have permission to update this session', 403);
  }
  
  // Validate request body
  const schema = z.record(z.any());
  const contextData = schema.parse(req.body);
  
  // Update context
  const updatedSession = await aiCoworkerService.updateSessionContext(
    sessionId, 
    contextData as CoworkerContextData
  );
  
  res.json(updatedSession);
}));

/**
 * PUT /api/coworker/sessions/:id/end
 * End a co-worker session
 */
router.put('/sessions/:id/end', asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  
  if (isNaN(sessionId)) {
    throw new ApiError('INVALID_ID', 'Invalid session ID', 400);
  }
  
  // Get the session to verify ownership
  const session = await aiCoworkerService.getSession(sessionId);
  
  if (!session) {
    throw new ApiError('SESSION_NOT_FOUND', `Co-worker session not found: ${sessionId}`, 404);
  }
  
  if (session.userId !== req.user.id) {
    throw new ApiError('UNAUTHORIZED', 'You do not have permission to end this session', 403);
  }
  
  // End the session
  const updatedSession = await aiCoworkerService.endSession(sessionId);
  res.json(updatedSession);
}));

/**
 * GET /api/coworker/sessions/:id/messages
 * Get messages for a co-worker session
 */
router.get('/sessions/:id/messages', asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  
  if (isNaN(sessionId)) {
    throw new ApiError('INVALID_ID', 'Invalid session ID', 400);
  }
  
  // Get the session to verify ownership
  const session = await aiCoworkerService.getSession(sessionId);
  
  if (!session) {
    throw new ApiError('SESSION_NOT_FOUND', `Co-worker session not found: ${sessionId}`, 404);
  }
  
  if (session.userId !== req.user.id) {
    throw new ApiError('UNAUTHORIZED', 'You do not have permission to access messages for this session', 403);
  }
  
  const messages = await aiCoworkerService.getSessionMessages(sessionId, limit);
  res.json(messages);
}));

/**
 * POST /api/coworker/sessions/:id/messages
 * Send a message in a co-worker session
 */
router.post('/sessions/:id/messages', asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  
  if (isNaN(sessionId)) {
    throw new ApiError('INVALID_ID', 'Invalid session ID', 400);
  }
  
  // Get the session to verify ownership
  const session = await aiCoworkerService.getSession(sessionId);
  
  if (!session) {
    throw new ApiError('SESSION_NOT_FOUND', `Co-worker session not found: ${sessionId}`, 404);
  }
  
  if (session.userId !== req.user.id) {
    throw new ApiError('UNAUTHORIZED', 'You do not have permission to send messages in this session', 403);
  }
  
  // Validate request body
  const schema = z.object({
    content: z.string().min(1),
    type: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    relatedEntityType: z.string().optional(),
    relatedEntityId: z.number().int().optional()
  });
  
  const messageData = schema.parse(req.body);
  const userId = req.user.id;
  
  // Process the message and get AI response
  const aiResponse = await aiCoworkerService.processUserMessage(
    sessionId,
    userId,
    messageData as CoworkerMessageInput
  );
  
  res.json(aiResponse);
}));

/**
 * POST /api/coworker/sessions/:id/suggestions
 * Generate a proactive suggestion based on context
 */
router.post('/sessions/:id/suggestions', asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  
  if (isNaN(sessionId)) {
    throw new ApiError('INVALID_ID', 'Invalid session ID', 400);
  }
  
  // Get the session to verify ownership
  const session = await aiCoworkerService.getSession(sessionId);
  
  if (!session) {
    throw new ApiError('SESSION_NOT_FOUND', `Co-worker session not found: ${sessionId}`, 404);
  }
  
  if (session.userId !== req.user.id) {
    throw new ApiError('UNAUTHORIZED', 'You do not have permission for this session', 403);
  }
  
  // Validate request body
  const schema = z.record(z.any());
  const contextData = schema.parse(req.body);
  
  // Generate suggestion
  const suggestion = await aiCoworkerService.generateProactiveSuggestion(
    sessionId,
    contextData as CoworkerContextData
  );
  
  if (!suggestion) {
    res.json({ message: "No suggestion available at this time" });
    return;
  }
  
  res.json(suggestion);
}));

/**
 * POST /api/coworker/sessions/:id/review
 * Review work and provide feedback
 */
router.post('/sessions/:id/review', asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  
  if (isNaN(sessionId)) {
    throw new ApiError('INVALID_ID', 'Invalid session ID', 400);
  }
  
  // Get the session to verify ownership
  const session = await aiCoworkerService.getSession(sessionId);
  
  if (!session) {
    throw new ApiError('SESSION_NOT_FOUND', `Co-worker session not found: ${sessionId}`, 404);
  }
  
  if (session.userId !== req.user.id) {
    throw new ApiError('UNAUTHORIZED', 'You do not have permission for this session', 403);
  }
  
  // Validate request body
  const schema = z.object({
    workDescription: z.string().min(1),
    workContent: z.any()
  });
  
  const { workDescription, workContent } = schema.parse(req.body);
  
  // Generate review
  const review = await aiCoworkerService.reviewWork(
    sessionId,
    workDescription,
    workContent
  );
  
  res.json(review);
}));

export default router;