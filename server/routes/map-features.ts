import { Express } from "express";
import { asyncHandler, ApiError } from "../error-handler";
import { IStorage } from "../storage";
import { 
  insertMapBookmarkSchema, 
  insertMapPreferenceSchema, 
} from "../../shared/schema";

/**
 * Registers map features-related routes
 * 
 * Includes:
 * - Map bookmarks
 * - Map preferences
 * - Recently viewed parcels
 */
export function registerMapFeatureRoutes(app: Express, storage: IStorage) {
  // Map Bookmarks API Routes
  app.get("/api/map/bookmarks", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to access map bookmarks');
    }
    
    const userId = req.session.userId;
    const bookmarks = await storage.getMapBookmarks(userId);
    
    res.json(bookmarks);
  }));
  
  app.get("/api/map/bookmarks/:id", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to access map bookmarks');
    }
    
    const bookmarkId = parseInt(req.params.id, 10);
    if (isNaN(bookmarkId)) {
      throw ApiError.badRequest('Invalid bookmark ID');
    }
    
    const bookmark = await storage.getMapBookmark(bookmarkId);
    
    if (!bookmark) {
      throw ApiError.notFound('Bookmark not found');
    }
    
    // Check if the bookmark belongs to the user
    if (bookmark.userId !== req.session.userId) {
      throw ApiError.forbidden('You do not have permission to access this bookmark');
    }
    
    res.json(bookmark);
  }));
  
  app.post("/api/map/bookmarks", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to create map bookmarks');
    }
    
    // Validate request body against our schema
    const validationResult = insertMapBookmarkSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw ApiError.badRequest('Invalid bookmark data', 'VALIDATION_ERROR', validationResult.error);
    }
    
    // Make sure userId matches the authenticated user
    const bookmarkData = {
      ...validationResult.data,
      userId: req.session.userId
    };
    
    const bookmark = await storage.createMapBookmark(bookmarkData);
    
    res.status(201).json(bookmark);
  }));
  
  app.patch("/api/map/bookmarks/:id", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to update map bookmarks');
    }
    
    const bookmarkId = parseInt(req.params.id, 10);
    if (isNaN(bookmarkId)) {
      throw ApiError.badRequest('Invalid bookmark ID');
    }
    
    // Check if the bookmark exists and belongs to the user
    const existingBookmark = await storage.getMapBookmark(bookmarkId);
    
    if (!existingBookmark) {
      throw ApiError.notFound('Bookmark not found');
    }
    
    if (existingBookmark.userId !== req.session.userId) {
      throw ApiError.forbidden('You do not have permission to update this bookmark');
    }
    
    // Update the bookmark
    const updatedBookmark = await storage.updateMapBookmark(bookmarkId, req.body);
    
    res.json(updatedBookmark);
  }));
  
  app.delete("/api/map/bookmarks/:id", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to delete map bookmarks');
    }
    
    const bookmarkId = parseInt(req.params.id, 10);
    if (isNaN(bookmarkId)) {
      throw ApiError.badRequest('Invalid bookmark ID');
    }
    
    // Check if the bookmark exists and belongs to the user
    const existingBookmark = await storage.getMapBookmark(bookmarkId);
    
    if (!existingBookmark) {
      throw ApiError.notFound('Bookmark not found');
    }
    
    if (existingBookmark.userId !== req.session.userId) {
      throw ApiError.forbidden('You do not have permission to delete this bookmark');
    }
    
    // Delete the bookmark
    const success = await storage.deleteMapBookmark(bookmarkId);
    
    if (success) {
      res.status(204).end();
    } else {
      throw ApiError.internal('Failed to delete bookmark');
    }
  }));
  
  // Map Preferences API Routes
  app.get("/api/map/preferences", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to access map preferences');
    }
    
    const userId = req.session.userId;
    const preferences = await storage.getMapPreferences(userId);
    
    if (!preferences) {
      // Return default preferences if none exist
      return res.json({
        userId,
        defaultCenter: { lat: 44.5646, lng: -123.2620 }, // Default to Benton County
        defaultZoom: 11,
        baseLayer: 'streets',
        theme: 'system',
        measurement: {
          enabled: true,
          unit: 'imperial'
        },
        grid: false,
        scalebar: true,
        animation: true,
        terrain: false,
        buildings3D: false,
        traffic: false,
        labels: true,
        layers: []
      });
    }
    
    res.json(preferences);
  }));
  
  app.patch("/api/map/preferences", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to update map preferences');
    }
    
    const userId = req.session.userId;
    
    // Get existing preferences or create default
    let existingPreferences = await storage.getMapPreferences(userId);
    
    if (!existingPreferences) {
      // Create default preferences first
      existingPreferences = await storage.createMapPreferences({
        userId,
        defaultCenter: { lat: 44.5646, lng: -123.2620 },
        defaultZoom: 11,
        baseLayer: 'streets',
        theme: 'system',
        measurement: {
          enabled: true,
          unit: 'imperial'
        },
        layerVisibility: 'visible',
        snapToFeature: true,
        showLabels: true,
        animation: true
      });
    }
    
    // Apply updates
    const updates = {
      ...req.body,
      userId // Ensure userId stays the same
    };
    
    const preferences = await storage.updateMapPreferences(userId, updates);
    
    res.json(preferences);
  }));
  
  app.post("/api/map/preferences/reset", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to reset map preferences');
    }
    
    const userId = req.session.userId;
    
    // Create default preferences
    const preferences = await storage.resetMapPreferences(userId);
    
    res.json(preferences);
  }));
  
  // Recently Viewed Parcels API Routes
  app.get("/api/map/recently-viewed", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to access recently viewed parcels');
    }
    
    const userId = req.session.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    
    const recentParcels = await storage.getRecentlyViewedParcels(userId, limit);
    
    // Format the response to match the expected type in our hook
    const formattedParcels = recentParcels.map(record => ({
      id: record.id,
      parcelId: record.parcel.id,
      parcelNumber: record.parcel.parcelNumber,
      address: record.parcel.address,
      // Parse geography info from parcel if available, or use default coordinates
      center: record.parcel.geometry 
        ? JSON.parse(record.parcel.geometry).coordinates.slice(0, 2).reverse() as [number, number] 
        : [44.5646, -123.2620] as [number, number],
      zoom: 15, // Default zoom level for parcel view
      viewedAt: record.viewedAt,
      userId: record.userId
    }));
    
    res.json(formattedParcels);
  }));
  
  app.post("/api/map/recently-viewed", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to track recently viewed parcels');
    }
    
    const userId = req.session.userId;
    const { parcelId, parcelNumber, center, zoom, address } = req.body;
    
    if (!parcelId || isNaN(parseInt(parcelId, 10))) {
      throw ApiError.badRequest('Invalid parcel ID');
    }
    
    const parcelIdInt = parseInt(parcelId, 10);
    
    // Add the parcel to recently viewed
    const recentlyViewed = await storage.addRecentlyViewedParcel({
      userId,
      parcelId: parcelIdInt,
      viewedAt: new Date()
    });
    
    // Format the response to match the expected type in our hook
    const formattedRecentlyViewed = {
      id: recentlyViewed.id,
      parcelId: parcelIdInt,
      parcelNumber: parcelNumber,
      address: address,
      center: center || ([44.5646, -123.2620] as [number, number]),
      zoom: zoom || 15,
      viewedAt: recentlyViewed.viewedAt,
      userId
    };
    
    res.status(201).json(formattedRecentlyViewed);
  }));
  
  app.delete("/api/map/recently-viewed/:id", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to remove recently viewed parcels');
    }
    
    const recentId = parseInt(req.params.id, 10);
    
    if (isNaN(recentId)) {
      throw ApiError.badRequest('Invalid ID');
    }
    
    const success = await storage.removeRecentlyViewedParcel(recentId);
    
    if (success) {
      res.status(204).end();
    } else {
      throw ApiError.internal('Failed to remove recently viewed parcel');
    }
  }));
  
  app.post("/api/map/recently-viewed/clear", asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      throw ApiError.unauthorized('You must be logged in to clear recently viewed parcels');
    }
    
    const userId = req.session.userId;
    
    const success = await storage.clearRecentlyViewedParcels(userId);
    
    if (success) {
      res.status(204).end();
    } else {
      throw ApiError.internal('Failed to clear recently viewed parcels');
    }
  }));
}