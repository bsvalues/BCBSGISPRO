/**
 * Map features routes
 * 
 * Includes:
 * - Map bookmarks
 * - Map preferences
 * - Recently viewed parcels
 */

import { Express } from 'express';
import { IStorage } from '../storage';
import { asyncHandler } from '../error-handler';
import { ApiError } from '../error-handler';
import { z } from 'zod';
import { insertMapBookmarkSchema, insertMapPreferenceSchema } from '../../shared/schema';

/**
 * Registers map features-related routes
 * 
 * Includes:
 * - Map bookmarks
 * - Map preferences
 * - Recently viewed parcels
 */
export function registerMapFeatureRoutes(app: Express, storage: IStorage) {
  // Map bookmarks
  app.get("/api/map-bookmarks", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to access bookmarks');
    }
    
    const userId = req.session.userId;
    const bookmarks = await storage.getMapBookmarks(userId);
    
    res.json(bookmarks);
  }));
  
  app.post("/api/map-bookmarks", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to create bookmarks');
    }
    
    const userId = req.session.userId;
    const bookmarkData = insertMapBookmarkSchema.parse({
      ...req.body,
      userId
    });
    
    const bookmark = await storage.createMapBookmark(bookmarkData);
    
    res.status(201).json(bookmark);
  }));
  
  app.get("/api/map-bookmarks/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to access bookmarks');
    }
    
    const bookmarkId = parseInt(req.params.id, 10);
    if (isNaN(bookmarkId)) {
      throw ApiError.badRequest('Invalid bookmark ID');
    }
    
    const bookmark = await storage.getMapBookmark(bookmarkId);
    
    if (!bookmark) {
      throw ApiError.notFound('Bookmark not found');
    }
    
    // Verify ownership
    if (bookmark.userId !== req.session.userId) {
      throw ApiError.forbidden('You do not have permission to access this bookmark');
    }
    
    res.json(bookmark);
  }));
  
  app.patch("/api/map-bookmarks/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to update bookmarks');
    }
    
    const bookmarkId = parseInt(req.params.id, 10);
    if (isNaN(bookmarkId)) {
      throw ApiError.badRequest('Invalid bookmark ID');
    }
    
    const bookmark = await storage.getMapBookmark(bookmarkId);
    
    if (!bookmark) {
      throw ApiError.notFound('Bookmark not found');
    }
    
    // Verify ownership
    if (bookmark.userId !== req.session.userId) {
      throw ApiError.forbidden('You do not have permission to update this bookmark');
    }
    
    const updatedBookmark = await storage.updateMapBookmark(bookmarkId, req.body);
    
    res.json(updatedBookmark);
  }));
  
  app.delete("/api/map-bookmarks/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to delete bookmarks');
    }
    
    const bookmarkId = parseInt(req.params.id, 10);
    if (isNaN(bookmarkId)) {
      throw ApiError.badRequest('Invalid bookmark ID');
    }
    
    const bookmark = await storage.getMapBookmark(bookmarkId);
    
    if (!bookmark) {
      throw ApiError.notFound('Bookmark not found');
    }
    
    // Verify ownership
    if (bookmark.userId !== req.session.userId) {
      throw ApiError.forbidden('You do not have permission to delete this bookmark');
    }
    
    const success = await storage.deleteMapBookmark(bookmarkId);
    
    if (success) {
      res.status(204).end();
    } else {
      throw ApiError.internalError('Failed to delete bookmark');
    }
  }));
  
  // Map preferences
  app.get("/api/map-preferences", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to access map preferences');
    }
    
    const userId = req.session.userId;
    const preferences = await storage.getMapPreferences(userId);
    
    if (!preferences) {
      // Create default preferences if none exist
      const defaultPreferences = {
        userId,
        defaultCenter: { lat: 46.06, lng: -123.43 }, // Default Benton County center
        defaultZoom: 12,
        baseLayer: 'streets',
        layerVisibility: 'visible',
        theme: 'light',
        measurement: { enabled: false, unit: 'imperial' },
        snapToFeature: true,
        showLabels: true,
        animation: true,
      };
      
      const newPreferences = await storage.createMapPreferences(defaultPreferences);
      return res.json(newPreferences);
    }
    
    res.json(preferences);
  }));
  
  app.post("/api/map-preferences", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to create map preferences');
    }
    
    const userId = req.session.userId;
    const preferencesData = insertMapPreferenceSchema.parse({
      ...req.body,
      userId
    });
    
    const preferences = await storage.createOrUpdateMapPreference(preferencesData);
    
    res.status(201).json(preferences);
  }));
  
  app.patch("/api/map-preferences", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to update map preferences');
    }
    
    const userId = req.session.userId;
    const updatedPreferences = await storage.updateMapPreferences(userId, req.body);
    
    res.json(updatedPreferences);
  }));
  
  app.post("/api/map-preferences/reset", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to reset map preferences');
    }
    
    const userId = req.session.userId;
    const resetPreferences = await storage.resetMapPreferences(userId);
    
    res.json(resetPreferences);
  }));
  
  // Recently viewed parcels
  app.get("/api/recently-viewed-parcels", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to access recently viewed parcels');
    }
    
    const userId = req.session.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    
    const recentParcels = await storage.getRecentlyViewedParcels(userId, limit);
    
    // Enhance with parcel details
    const enhancedParcels = await Promise.all(recentParcels.map(async (recent) => {
      const parcel = await storage.getParcelById(recent.parcelId);
      return {
        id: recent.id,
        parcelId: recent.parcelId,
        parcelNumber: parcel?.parcelNumber || 'Unknown',
        address: parcel?.address || null,
        viewedAt: recent.viewedAt,
        center: parcel?.geometry ? JSON.parse(parcel.geometry).center : [0, 0],
        zoom: 15 // Default zoom level for parcel view
      };
    }));
    
    res.json(enhancedParcels);
  }));
  
  app.post("/api/recently-viewed-parcels", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to track recently viewed parcels');
    }
    
    const userId = req.session.userId;
    const { parcelId } = req.body;
    
    if (!parcelId || isNaN(parseInt(parcelId, 10))) {
      throw ApiError.badRequest('Invalid parcel ID');
    }
    
    const parcelIdInt = parseInt(parcelId, 10);
    
    // Check if the parcel exists
    const parcel = await storage.getParcelById(parcelIdInt);
    
    if (!parcel) {
      throw ApiError.notFound('Parcel not found');
    }
    
    // Add the parcel to recently viewed
    const recentlyViewed = await storage.addRecentlyViewedParcel({
      userId,
      parcelId: parcelIdInt,
      viewedAt: new Date()
    });
    
    res.status(201).json(recentlyViewed);
  }));
  
  app.delete("/api/recently-viewed-parcels/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to remove recently viewed parcels');
    }
    
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw ApiError.badRequest('Invalid record ID');
    }
    
    const success = await storage.removeRecentlyViewedParcel(id);
    
    if (success) {
      res.status(204).end();
    } else {
      throw ApiError.internalError('Failed to remove recently viewed parcel');
    }
  }));
  
  app.delete("/api/recently-viewed-parcels", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to clear recently viewed parcels');
    }
    
    const userId = req.session.userId;
    const success = await storage.clearRecentlyViewedParcels(userId);
    
    if (success) {
      res.status(204).end();
    } else {
      throw ApiError.internalError('Failed to clear recently viewed parcels');
    }
  }));
}