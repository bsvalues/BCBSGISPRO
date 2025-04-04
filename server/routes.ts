import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketManager } from "./websocket-server";
import * as fs from 'fs';
import * as path from 'path';
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { hashPassword } from "./auth";
import { ApiError, asyncHandler } from "./error-handler";
import { 
  workflows, 
  WorkflowState, 
  insertWorkflowStateSchema,
  documents,
  documentVersions,
  documentParcelLinks,
  parcels,
  mapLayers,
  checklistItems,
  WorkflowType,
  insertDocumentSchema,
  insertDocumentParcelLinkSchema
} from "@shared/schema";
import { classifyDocument, getDocumentTypeLabel } from "./services/document-classifier";
import { DocumentType } from "@shared/document-types";
import { documentService } from "./services/document-service";
import { documentParcelService } from "./services/document-parcel-service";
import { parseLegalDescription, ParsedLegalDescription } from "./services/legal-description-parser";
import { 
  runGeospatialAnalysis, 
  GeospatialOperationType, 
  MeasurementUnit, 
  type OperationParams,
  type GeospatialAnalysisResult
} from "./services/geospatial-analysis";
import {
  generateReport,
  ReportFormat,
  getSupportedFormats
} from "./services/report-generator";
import {
  parseDescription,
  getExampleDescriptions,
  analyzeLegalDescription
} from "./services/legal-description-service";
import { z } from "zod";
import { eq } from "drizzle-orm";

// Map of operation types to human-readable titles
const operationTitles: Record<GeospatialOperationType, string> = {
  [GeospatialOperationType.BUFFER]: 'Buffer Analysis',
  [GeospatialOperationType.INTERSECTION]: 'Intersection Analysis',
  [GeospatialOperationType.UNION]: 'Union Analysis',
  [GeospatialOperationType.DIFFERENCE]: 'Difference Analysis',
  [GeospatialOperationType.AREA]: 'Area Calculation',
  [GeospatialOperationType.CENTROID]: 'Centroid Analysis',
  [GeospatialOperationType.DISTANCE]: 'Distance Measurement',
  [GeospatialOperationType.MERGE]: 'Parcel Merge Analysis',
  [GeospatialOperationType.SPLIT]: 'Parcel Split Analysis',
  [GeospatialOperationType.SIMPLIFY]: 'Geometry Simplification'
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Mapbox token endpoint - serves the token securely to the frontend
  app.get("/api/mapbox-token", (req, res) => {
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      return res.status(500).json({ 
        error: 'Mapbox token not configured',
        message: 'The Mapbox access token is not available in the server environment'
      });
    }
    
    // Return the token to the client
    return res.json({ token: mapboxToken });
  });
  
  // Legal description parsing endpoints
  app.post("/api/legal-description/parse", asyncHandler(async (req, res) => {
    const { text, referencePoint } = req.body;
    
    if (!text) {
      throw ApiError.badRequest('Legal description text is required');
    }
    
    // Use direct import instead of dynamic import since we've already added it
    const result = await parseDescription(text, referencePoint);
    
    return res.json(result);
  }));
  
  app.get("/api/legal-description/examples", asyncHandler(async (req, res) => {
    // Use the already imported function
    const examples = getExampleDescriptions();
    
    return res.json(examples);
  }));
  
  app.post("/api/legal-description/analyze", asyncHandler(async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
      throw ApiError.badRequest('Legal description text is required');
    }
    
    // Use the already imported function
    const analysis = analyzeLegalDescription(text);
    
    return res.json(analysis);
  }));
  
  // Legal description parsing using our enhanced parser
  app.post("/api/legal-description/parse", asyncHandler(async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
      throw ApiError.badRequest('Legal description text is required');
    }
    
    try {
      // Parse the legal description using our service
      const result: ParsedLegalDescription = parseLegalDescription(text);
      
      return res.json(result);
    } catch (error) {
      console.error('Error parsing legal description:', error);
      throw ApiError.internal('Failed to parse legal description', 'PARSER_ERROR', {
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }));
  
  // Create a new parcel from legal description
  app.post("/api/parcels", asyncHandler(async (req, res) => {
    const { 
      parcelNumber, 
      legalDescription, 
      geometry, 
      owner, 
      address, 
      city, 
      zip, 
      propertyType,
      assessedValue,
      acres
    } = req.body;
    
    if (!parcelNumber) {
      throw ApiError.badRequest('Parcel number is required');
    }
    
    try {
      // Check if parcel with this number already exists
      const existingParcel = await storage.getParcelByNumber(parcelNumber);
      
      if (existingParcel) {
        throw ApiError.conflict('A parcel with this number already exists');
      }
      
      // Create the new parcel
      const newParcel = await storage.createParcel({
        parcelNumber,
        legalDescription,
        geometry: geometry ? JSON.stringify(geometry) : null,
        owner,
        address,
        city,
        zip,
        propertyType,
        assessedValue,
        acres
      });
      
      return res.status(201).json(newParcel);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error creating parcel:', error);
      throw ApiError.internal('Failed to create parcel', 'PARCEL_CREATE_ERROR', {
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }));
  
  // Public property information API
  app.get("/api/public/properties/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      
      if (!query || query.trim().length < 3) {
        return res.status(400).json({ error: "Search query must be at least 3 characters" });
      }
      
      // Search by address, parse out city and zip if included
      let address = query;
      let city = undefined;
      let zip = undefined;
      
      // Extract city from query if it's in the format "address, city"
      if (query.includes(',')) {
        const parts = query.split(',');
        address = parts[0].trim();
        city = parts[1].trim();
      }
      
      // Extract zip if it's in the format of 5 digits
      const zipMatch = query.match(/\b\d{5}\b/);
      if (zipMatch) {
        zip = zipMatch[0];
      }
      
      // Try to interpret query as parcel ID if it matches pattern
      const parcelIdMatch = query.match(/[\d-]{4,}/);
      if (parcelIdMatch) {
        // Get exact match for parcel ID
        const parcelInfo = await storage.getParcelInfo(parcelIdMatch[0]);
        if (parcelInfo) {
          return res.json([{
            id: parcelInfo.parcelId,
            taxParcelId: parcelInfo.parcelId,
            address: parcelInfo.address || 'No address on file',
            owner: parcelInfo.ownerName || 'Unknown',
            zoning: parcelInfo.zones?.[0] || 'R-1',
            acreage: Number(parcelInfo.acres) || 0,
            assessedValue: parcelInfo.assessedValue || 0,
            yearBuilt: parcelInfo.improvements?.[0]?.yearBuilt || null
          }]);
        }
      }
      
      // Search by address components
      const results = await storage.searchParcelsByAddress(address, city, zip);
      
      // Format results for the client
      const formattedResults = results.map(parcel => ({
        id: parcel.parcelId,
        taxParcelId: parcel.parcelId,
        address: parcel.address || 'No address on file',
        owner: parcel.ownerName || 'Unknown',
        zoning: parcel.zones?.[0] || 'R-1',
        acreage: Number(parcel.acres) || 0,
        assessedValue: parcel.assessedValue || 0,
        yearBuilt: parcel.improvements?.[0]?.yearBuilt || null
      }));
      
      res.json(formattedResults);
    } catch (error) {
      console.error("Error searching properties:", error);
      res.status(500).json({ error: "Error searching properties" });
    }
  });
  
  app.get("/api/public/properties/details/:id", async (req, res) => {
    try {
      const parcelId = req.params.id;
      
      if (!parcelId) {
        return res.status(400).json({ error: "Parcel ID is required" });
      }
      
      const parcelInfo = await storage.getParcelInfo(parcelId);
      
      if (!parcelInfo) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      // Format the property details for the client
      const formattedDetails = {
        id: parcelInfo.parcelId,
        taxParcelId: parcelInfo.parcelId,
        address: parcelInfo.address || 'No address on file',
        owner: parcelInfo.ownerName || 'Unknown',
        zoning: parcelInfo.zones?.[0] || 'R-1',
        acreage: Number(parcelInfo.acres) || 0,
        assessedValue: parcelInfo.assessedValue || 0,
        yearBuilt: parcelInfo.improvements?.[0]?.yearBuilt || null,
        legalDescription: parcelInfo.legalDescription || '',
        propertyType: parcelInfo.propertyType || 'Residential',
        city: parcelInfo.city || '',
        zip: parcelInfo.zip || ''
      };
      
      res.json(formattedDetails);
    } catch (error) {
      console.error("Error fetching property details:", error);
      res.status(500).json({ error: "Error fetching property details" });
    }
  });
  
  // Enhanced health check endpoint with resilience
  app.get("/api/health", async (req, res) => {
    const { checkDatabaseConnection, getDatabaseStatus } = await import("./db-resilience");
    
    const healthStatus = {
      service: "BentonGeoPro API",
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      database: {
        status: "unknown",
        details: {}
      }
    };
    
    try {
      // Check database connection with resilience
      const isConnected = await checkDatabaseConnection();
      
      if (isConnected) {
        healthStatus.database.status = "connected";
      } else {
        healthStatus.database.status = "disconnected";
        healthStatus.status = "degraded";
        
        // Get detailed status information
        const dbStatus = getDatabaseStatus();
        healthStatus.database.details = {
          lastCheck: dbStatus.lastCheck,
          failedAttempts: dbStatus.failedAttempts,
          lastError: dbStatus.lastError
        };
      }
    } catch (error) {
      console.error("Health check - Database error:", error);
      healthStatus.database.status = "disconnected";
      healthStatus.status = "degraded";
      healthStatus.database.details = {
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Return appropriate status code based on service health
    const statusCode = healthStatus.status === "ok" ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  });

  // Database test endpoint
  app.get("/api/db-test", async (req, res) => {
    try {
      // Import the db instance
      const { db } = await import("./db");
      
      // Try to query the database
      const result = await db.select().from(workflows).limit(5);
      
      res.json({
        success: true,
        message: "Database connection successful",
        data: result
      });
    } catch (error) {
      console.error("Database test error:", error);
      res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Test endpoint to directly query map layers from the database
  app.get("/api/map-layers-direct", async (req, res) => {
    try {
      // Import the db instance
      const { db } = await import("./db");
      
      // Query all map layers
      const layers = await db.select().from(mapLayers);
      
      res.json({
        success: true,
        count: layers.length,
        layers
      });
    } catch (error) {
      console.error("Map layers query error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch map layers",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Testing endpoint for database resilience
  app.get("/api/db-resilience", async (req, res) => {
    try {
      const { withRetry, checkDatabaseConnection, getDatabaseStatus, attemptReconnect } = await import("./db-resilience");
      
      const action = req.query.action as string;
      
      if (action === "check") {
        // Just check the connection
        const isConnected = await checkDatabaseConnection();
        res.json({
          action: "check",
          isConnected,
          status: getDatabaseStatus()
        });
      } else if (action === "retry") {
        // Execute a database operation with retries
        try {
          const result = await withRetry(async () => {
            const { db } = await import("./db");
            return db.select().from(workflows).limit(5);
          });
          
          res.json({
            action: "retry",
            success: true,
            status: getDatabaseStatus(),
            data: result
          });
        } catch (retryError) {
          res.status(500).json({
            action: "retry",
            success: false,
            status: getDatabaseStatus(),
            error: retryError instanceof Error ? retryError.message : String(retryError)
          });
        }
      } else if (action === "reconnect") {
        // Attempt to reconnect to the database
        const reconnected = await attemptReconnect();
        res.json({
          action: "reconnect",
          success: reconnected,
          status: getDatabaseStatus()
        });
      } else {
        // Default: return status
        res.json({
          status: getDatabaseStatus()
        });
      }
    } catch (error) {
      console.error("Database resilience test error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test database resilience",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Enhanced auto-login endpoint for development purposes
  app.get("/api/dev-login", async (req, res) => {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: "Endpoint not available in production" });
    }
    
    console.log("\n====== DEV LOGIN ENDPOINT ======");
    console.log("Current Session ID:", req.sessionID);
    console.log("Cookies:", req.headers.cookie);
    console.log("Is authenticated:", req.isAuthenticated());
    
    // Set strong cache control headers for all responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Set session cookie explicitly to ensure it's properly set
    // Use SameSite=None for better support with cross-domain requests in Replit
    const cookieMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    res.cookie('bentongis.sid', req.sessionID, {
      path: '/',
      httpOnly: true,
      maxAge: cookieMaxAge,
      sameSite: 'none',
      secure: false
    });
    
    try {
      // Check if user is already logged in
      if (req.isAuthenticated() && req.user) {
        console.log("User already authenticated, providing existing session");
        console.log("User ID:", req.user.id);
        console.log("User:", req.user.username);
        
        // Force session save to ensure it persists
        req.session.cookie.maxAge = cookieMaxAge;
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
          } else {
            console.log("Session saved successfully, cookie maxAge:", req.session.cookie.maxAge);
            console.log("Cookie settings:", JSON.stringify(req.session.cookie));
          }
          
          const { password, ...userWithoutPassword } = req.user;
          return res.status(200).json(userWithoutPassword);
        });
        return;
      }
      
      console.log("Creating new login session");
      
      // Check if test user exists, if not, create it
      let user = await storage.getUserByUsername("admin");
      
      if (!user) {
        console.log("Creating default admin user");
        try {
          // Create a default admin user
          user = await storage.createUser({
            username: "admin",
            password: await hashPassword("admin123"),
            fullName: "Admin User",
            email: "admin@bentoncounty.gov",
            department: "Assessor's Office",
            isAdmin: true
          });
          console.log("Admin user created successfully");
        } catch (createError) {
          console.error("Error creating default admin user:", createError);
          return res.status(500).json({ 
            message: "Failed to create default admin user", 
            error: createError instanceof Error ? createError.message : String(createError) 
          });
        }
      } else {
        console.log("Found existing admin user:", user.id);
      }

      // Wrap session methods in Promises for better async handling
      const regenerateSession = () => {
        return new Promise((resolve, reject) => {
          if (!req.session) {
            return resolve(null);
          }
          req.session.regenerate((err) => {
            if (err) reject(err);
            else resolve(null);
          });
        });
      };

      const saveSession = () => {
        return new Promise((resolve, reject) => {
          if (!req.session) {
            return resolve(null);
          }
          req.session.save((err) => {
            if (err) reject(err);
            else resolve(null);
          });
        });
      };

      const loginUser = () => {
        return new Promise((resolve, reject) => {
          req.login(user, (err) => {
            if (err) reject(err);
            else resolve(null);
          });
        });
      };

      try {
        // Regenerate session to prevent session fixation
        await regenerateSession();
        
        // Login the user
        await loginUser();
        
        // Set more detailed cookie options
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
        req.session.cookie.httpOnly = true;
        req.session.cookie.secure = false; // Allow non-HTTPS in development
        req.session.cookie.sameSite = 'none'; // Better cross-domain support
        req.session.cookie.path = "/";
        
        // Explicitly save the session
        await saveSession();
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        // Verify the session was created properly
        console.log("Session ID after login:", req.sessionID);
        console.log("Is authenticated:", req.isAuthenticated());
        
        // Prevent caching of authentication responses
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        console.log("Auto-login successful for user:", userWithoutPassword.username);
        return res.status(200).json(userWithoutPassword);
      } catch (err) {
        console.error("Login process error:", err);
        return res.status(500).json({ 
          message: "Failed to auto-login during session handling", 
          error: err instanceof Error ? err.message : String(err) 
        });
      }
    } catch (error) {
      console.error("Auto-login error:", error);
      res.status(500).json({ 
        message: "Failed to auto-login", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Get all workflows
  app.get("/api/workflows", async (req, res) => {
    try {
      const userWorkflows = await storage.getWorkflows(req.user?.id);
      res.json(userWorkflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  // Get workflow by id
  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(parseInt(req.params.id));
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });
  
  // Get workflow events (timeline)
  app.get("/api/workflows/:id/events", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const events = await storage.getWorkflowEvents(workflowId);
      
      // Sort events by creation date descending (newest first)
      const sortedEvents = [...events].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      res.json(sortedEvents);
    } catch (error) {
      console.error("Error fetching workflow events:", error);
      res.status(500).json({ message: "Failed to fetch workflow events" });
    }
  });
  
  // Create workflow event
  app.post("/api/workflows/:id/events", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { eventType, description, metadata } = req.body;
      
      if (!eventType || !description) {
        return res.status(400).json({ 
          message: "Event type and description are required" 
        });
      }
      
      const newEvent = await storage.createWorkflowEvent({
        workflowId,
        eventType,
        description,
        metadata,
        createdBy: req.user.id
      });
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating workflow event:", error);
      res.status(500).json({ message: "Failed to create workflow event" });
    }
  });

  // Create new workflow
  app.post("/api/workflows", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parsedWorkflow = z.object({
        type: z.nativeEnum(WorkflowType),
        title: z.string(),
        description: z.string().optional(),
      }).parse(req.body);

      const newWorkflow = await storage.createWorkflow({
        ...parsedWorkflow,
        userId: req.user.id,
        status: "in_progress"
      });
      
      // Automatically create initial workflow event
      await storage.createWorkflowEvent({
        workflowId: newWorkflow.id,
        eventType: "created",
        description: `Workflow "${newWorkflow.title}" was created`,
        metadata: { workflowType: newWorkflow.type },
        createdBy: req.user.id
      });

      res.status(201).json(newWorkflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });
  
  // Update workflow status
  app.patch("/api/workflows/:id/status", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const workflowId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Get current workflow
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Check if status is different
      if (workflow.status === status) {
        return res.json(workflow); // No change needed
      }
      
      // Update workflow in the database
      // Note: This would need to be implemented in storage.ts
      // For now, simulate with the workflow object
      const updatedWorkflow = {
        ...workflow,
        status
      };
      
      // Create workflow event for status change
      await storage.createWorkflowEvent({
        workflowId,
        eventType: "status_changed",
        description: `Workflow status changed from "${workflow.status}" to "${status}"`,
        metadata: {
          oldStatus: workflow.status,
          newStatus: status
        },
        createdBy: req.user.id
      });
      
      res.json(updatedWorkflow);
    } catch (error) {
      console.error("Error updating workflow status:", error);
      res.status(500).json({ message: "Failed to update workflow status" });
    }
  });

  // Get workflow state
  app.get("/api/workflows/:id/state", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const state = await storage.getWorkflowState(workflowId);
      
      if (!state) {
        return res.status(404).json({ message: "Workflow state not found" });
      }
      
      res.json(state);
    } catch (error) {
      console.error("Error fetching workflow state:", error);
      res.status(500).json({ message: "Failed to fetch workflow state" });
    }
  });

  // Update workflow state
  app.patch("/api/workflows/:id/state", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const workflowState = insertWorkflowStateSchema.parse(req.body);

      const updatedState = await storage.updateWorkflowState(workflowId, workflowState);
      res.json(updatedState);
    } catch (error) {
      console.error("Error updating workflow state:", error);
      res.status(500).json({ message: "Failed to update workflow state" });
    }
  });

  // Get checklist items for a workflow
  app.get("/api/workflows/:id/checklist", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const items = await storage.getChecklistItems(workflowId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      res.status(500).json({ message: "Failed to fetch checklist items" });
    }
  });

  // Create checklist item
  app.post("/api/workflows/:id/checklist", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const { title, description, order } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      const newItem = await storage.createChecklistItem({
        workflowId,
        title,
        description,
        completed: false,
        order: order || 0
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating checklist item:", error);
      res.status(500).json({ message: "Failed to create checklist item" });
    }
  });

  // Update checklist item
  app.patch("/api/checklist-items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { completed } = req.body;
      
      const updatedItem = await storage.updateChecklistItem(itemId, completed);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating checklist item:", error);
      res.status(500).json({ message: "Failed to update checklist item" });
    }
  });

  // Upload document
  app.post("/api/workflows/:id/documents", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const document = insertDocumentSchema.parse(req.body);
      
      const result = await documentService.createDocument({
        workflowId,
        name: document.name,
        contentType: document.contentType,
        content: document.content
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ 
        message: "Failed to upload document", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get documents for a workflow
  app.get("/api/workflows/:id/documents", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const documents = await storage.getDocuments(workflowId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  
  // Get all documents (for document management page)
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching all documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  
  // Get a specific document
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });
  
  // Update document classification manually
  app.patch("/api/documents/:id/classification", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { documentType } = req.body;
      
      if (!documentType) {
        return res.status(400).json({ message: "Document type is required" });
      }
      
      const updatedDocument = await documentService.updateDocumentClassification(
        documentId, 
        documentType as DocumentType
      );
      
      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating document classification:", error);
      res.status(500).json({ message: "Failed to update document classification" });
    }
  });
  
  // Extract fields from a document using OCR
  app.get("/api/documents/:id/extract-fields", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      const fields = await documentService.extractDocumentFields(documentId);
      
      if (!fields) {
        return res.status(404).json({ message: "Document not found or field extraction failed" });
      }
      
      res.json(fields);
    } catch (error) {
      console.error("Error extracting document fields:", error);
      res.status(500).json({ message: "Failed to extract document fields" });
    }
  });
  
  // Find documents related to a specific document based on content similarity
  app.get("/api/documents/:id/related", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const minSimilarity = req.query.minSimilarity ? parseFloat(req.query.minSimilarity as string) : 0.4;
      
      const relatedDocuments = await documentService.findRelatedDocuments(documentId, minSimilarity);
      
      res.json(relatedDocuments);
    } catch (error) {
      console.error("Error finding related documents:", error);
      res.status(500).json({ message: "Failed to find related documents" });
    }
  });
  
  // Create a new document version
  app.post("/api/documents/:id/versions", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { content, notes } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Document content is required" });
      }
      
      // Get current versions count to determine the next version number
      const versions = await documentService.getDocumentVersions(documentId);
      const versionNumber = versions.length + 1;
      
      const newVersion = await documentService.createDocumentVersion({
        documentId,
        versionNumber,
        content,
        notes
      });
      
      res.status(201).json(newVersion);
    } catch (error) {
      console.error("Error creating document version:", error);
      res.status(500).json({ message: "Failed to create document version" });
    }
  });
  
  // Get all versions of a document
  app.get("/api/documents/:id/versions", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const versions = await documentService.getDocumentVersions(documentId);
      
      res.json(versions);
    } catch (error) {
      console.error("Error fetching document versions:", error);
      res.status(500).json({ message: "Failed to fetch document versions" });
    }
  });
  
  // NEW DOCUMENT INTELLIGENCE FEATURES
  
  // Associate document with parcels (with optional relationship metadata)
  app.post("/api/documents/:id/parcels", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { parcelIds, linkType, notes } = req.body;
      
      if (!Array.isArray(parcelIds) || parcelIds.length === 0) {
        return res.status(400).json({ message: "Parcel IDs array is required" });
      }
      
      const result = await documentParcelService.associateDocumentWithParcels(
        documentId,
        parcelIds,
        linkType,
        notes
      );
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error associating document with parcels:", error);
      res.status(500).json({ message: "Failed to associate document with parcels" });
    }
  });
  
  // Remove document-parcel associations
  app.delete("/api/documents/:id/parcels", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { parcelIds } = req.body;
      
      // If parcelIds is provided, remove specific associations, otherwise remove all
      const removedCount = await documentParcelService.disassociateDocumentFromParcels(
        documentId,
        Array.isArray(parcelIds) ? parcelIds : undefined
      );
      
      res.json({ count: removedCount });
    } catch (error) {
      console.error("Error removing document-parcel associations:", error);
      res.status(500).json({ message: "Failed to remove document-parcel associations" });
    }
  });
  
  // Get parcels associated with a document
  app.get("/api/documents/:id/parcels", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const parcels = await documentParcelService.getParcelsForDocument(documentId);
      
      res.json(parcels);
    } catch (error) {
      console.error("Error fetching parcels for document:", error);
      res.status(500).json({ message: "Failed to fetch parcels for document" });
    }
  });
  
  // Get document-parcel links (with metadata) for a document
  app.get("/api/documents/:id/parcel-links", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const links = await documentParcelService.getDocumentParcelLinks(documentId);
      
      res.json(links);
    } catch (error) {
      console.error("Error fetching document-parcel links:", error);
      res.status(500).json({ message: "Failed to fetch document-parcel links" });
    }
  });
  
  // Get full relationship information for a document
  app.get("/api/documents/:id/relationships", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const relationshipData = await documentParcelService.getDocumentRelationships(documentId);
      
      res.json(relationshipData);
    } catch (error) {
      console.error("Error fetching document relationships:", error);
      res.status(500).json({ message: "Failed to fetch document relationships" });
    }
  });
  
  // Get documents associated with a parcel
  app.get("/api/parcels/:id/documents", async (req, res) => {
    try {
      const parcelId = parseInt(req.params.id);
      const documents = await documentParcelService.getDocumentsForParcel(parcelId);
      
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents for parcel:", error);
      res.status(500).json({ message: "Failed to fetch documents for parcel" });
    }
  });
  
  // Get document-parcel links (with metadata) for a parcel
  app.get("/api/parcels/:id/document-links", async (req, res) => {
    try {
      const parcelId = parseInt(req.params.id);
      const links = await documentParcelService.getParcelDocumentLinks(parcelId);
      
      res.json(links);
    } catch (error) {
      console.error("Error fetching parcel-document links:", error);
      res.status(500).json({ message: "Failed to fetch parcel-document links" });
    }
  });
  
  // Get full relationship information for a parcel
  app.get("/api/parcels/:id/relationships", async (req, res) => {
    try {
      const parcelId = parseInt(req.params.id);
      const relationshipData = await documentParcelService.getParcelRelationships(parcelId);
      
      res.json(relationshipData);
    } catch (error) {
      console.error("Error fetching parcel relationships:", error);
      res.status(500).json({ message: "Failed to fetch parcel relationships" });
    }
  });
  
  // Update document-parcel link metadata
  app.patch("/api/document-parcel-links/:id", async (req, res) => {
    try {
      const linkId = parseInt(req.params.id);
      const { linkType, notes } = req.body;
      
      const updatedLink = await documentParcelService.updateDocumentParcelLink(
        linkId, 
        linkType, 
        notes
      );
      
      res.json(updatedLink);
    } catch (error) {
      console.error("Error updating document-parcel link:", error);
      res.status(500).json({ message: "Failed to update document-parcel link" });
    }
  });
  
  // Search for documents by parcel number
  app.get("/api/parcels/number/:parcelNumber/documents", async (req, res) => {
    try {
      const parcelNumber = req.params.parcelNumber;
      
      if (!parcelNumber) {
        return res.status(400).json({ message: "Parcel number is required" });
      }
      
      const documents = await documentParcelService.getDocumentsForParcelNumber(parcelNumber);
      
      res.json(documents);
    } catch (error) {
      console.error("Error searching documents by parcel number:", error);
      res.status(500).json({ message: "Failed to search documents by parcel number" });
    }
  });

  // Generate parcel number
  app.post("/api/parcel-numbers/generate", async (req, res) => {
    try {
      const { parentParcelId, count } = req.body;
      const newParcelNumbers = await storage.generateParcelNumbers(parentParcelId, count);
      res.json(newParcelNumbers);
    } catch (error) {
      console.error("Error generating parcel numbers:", error);
      res.status(500).json({ message: "Failed to generate parcel numbers" });
    }
  });

  // Get visible map layers, sorted by order
  app.get("/api/map-layers", async (req, res) => {
    try {
      const visibleLayers = await storage.getVisibleMapLayers();
      // Create a new copy before sorting and normalize opacity from 0-100 to 0-1
      const sortedLayers = [...visibleLayers]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(layer => ({
          ...layer,
          opacity: (layer.opacity ?? 100) / 100 // Convert DB opacity (0-100) to UI opacity (0-1)
        }));
      res.json(sortedLayers);
    } catch (error) {
      console.error("Error fetching map layers:", error);
      res.status(500).json({ message: "Failed to fetch map layers" });
    }
  });
  
  // Get all map layers (including hidden ones)
  app.get("/api/map-layers/all", async (req, res) => {
    try {
      const layers = await storage.getMapLayers();
      // Create a new sorted array and normalize opacity from 0-100 to 0-1
      const sortedLayers = [...layers]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(layer => ({
          ...layer,
          opacity: (layer.opacity ?? 100) / 100 // Convert DB opacity (0-100) to UI opacity (0-1) 
        }));
      res.json(sortedLayers);
    } catch (error) {
      console.error("Error fetching all map layers:", error);
      res.status(500).json({ message: "Failed to fetch map layers" });
    }
  });
  
  // Direct access to map layers for testing purposes
  app.get("/api/map-layers-direct", async (req, res) => {
    try {
      const layers = await storage.getMapLayers();
      res.json({
        success: true,
        count: layers.length,
        layers: layers
      });
    } catch (error) {
      console.error("Error fetching direct map layers:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch map layers",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Update map layer settings
  app.patch("/api/map-layers/:id", async (req, res) => {
    try {
      const layerId = parseInt(req.params.id, 10);
      if (isNaN(layerId)) {
        return res.status(400).json({ message: "Invalid layer ID" });
      }
      
      const { visible, opacity, zindex, order } = req.body;
      
      // Convert UI opacity (0-1) to DB opacity (0-100) if provided
      const dbOpacity = opacity !== undefined ? Math.round(opacity * 100) : undefined;
      
      const updatedLayer = await storage.updateMapLayer(layerId, {
        visible,
        opacity: dbOpacity,
        zindex,
        order
      });
      
      // Convert DB opacity (0-100) to UI opacity (0-1) before sending to client
      res.json({
        ...updatedLayer,
        opacity: (updatedLayer.opacity ?? 100) / 100
      });
    } catch (error) {
      console.error("Error updating map layer:", error);
      res.status(500).json({ message: "Failed to update map layer" });
    }
  });

  // Get parcel information by parcel ID - Restricted endpoint for authenticated users
  app.get("/api/parcels/:parcelId", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const parcelId = req.params.parcelId;
      const parcelInfo = await storage.getParcelInfo(parcelId);
      
      if (!parcelInfo) {
        return res.status(404).json({ message: "Parcel not found" });
      }
      
      res.json(parcelInfo);
    } catch (error) {
      console.error("Error fetching parcel information:", error);
      res.status(500).json({ message: "Failed to fetch parcel information" });
    }
  });
  
  // Public endpoint for basic parcel information (limited data)
  app.get("/api/public/parcels/:parcelId", async (req, res) => {
    try {
      const parcelId = req.params.parcelId;
      const parcelInfo = await storage.getParcelInfo(parcelId);
      
      if (!parcelInfo) {
        return res.status(404).json({ message: "Parcel not found" });
      }
      
      // Return limited information for public access
      const publicInfo = {
        parcelId: parcelInfo.parcelId,
        legalDescription: parcelInfo.legalDescription,
        acres: parcelInfo.acres,
        propertyType: parcelInfo.propertyType,
        address: parcelInfo.address,
        city: parcelInfo.city,
        zip: parcelInfo.zip,
        county: "Benton",
        state: "WA",
        // Omit sensitive information like ownerName, assessedValue, etc.
      };
      
      res.json(publicInfo);
    } catch (error) {
      console.error("Error fetching public parcel information:", error);
      res.status(500).json({ message: "Failed to fetch parcel information" });
    }
  });
  
  // Public search endpoint
  app.get("/api/public/parcels/search/by-address", async (req, res) => {
    try {
      const { address, city, zip } = req.query;
      
      if (!address) {
        return res.status(400).json({ message: "Address is required for search" });
      }
      
      const results = await storage.searchParcelsByAddress(
        address as string, 
        city as string | undefined, 
        zip as string | undefined
      );
      
      // Return limited search results for public access
      const publicResults = results.map(parcel => ({
        parcelId: parcel.parcelId || parcel.parcelNumber,
        address: parcel.address,
        city: parcel.city,
        zip: parcel.zip,
        propertyType: parcel.propertyType,
        acres: parcel.acres || parcel.acreage,
      }));
      
      res.json(publicResults);
    } catch (error) {
      console.error("Error searching parcels by address:", error);
      res.status(500).json({ message: "Failed to search parcels" });
    }
  });

  // Generate SM00 report
  app.post("/api/reports/sm00", async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const report = await storage.generateSM00Report(startDate, endDate);
      res.json(report);
    } catch (error) {
      console.error("Error generating SM00 report:", error);
      res.status(500).json({ message: "Failed to generate SM00 report" });
    }
  });

  // Enhanced chatbot endpoint with context-awareness
  app.post("/api/chatbot/query", async (req, res) => {
    try {
      const { query, workflowId, currentStep } = req.body;
      
      // If no workflow context is provided, fall back to basic assistant
      if (!workflowId) {
        const answer = await storage.queryAssistant(query);
        return res.json({ answer });
      }
      
      // Import enhanced assistant functionalities
      const { getEnhancedResponse } = await import("./services/enhanced-assistant");
      
      // Gather context data for the workflow
      const workflow = await storage.getWorkflow(workflowId);
      const workflowState = await storage.getWorkflowState(workflowId);
      const checklistItems = await storage.getChecklistItems(workflowId);
      const documents = await storage.getDocuments(workflowId);
      
      // Get context-aware response
      const context = {
        workflow,
        workflowState,
        checklistItems,
        documents,
        currentStep: currentStep || workflowState?.currentStep || undefined
      };
      
      const answer = getEnhancedResponse(query, context);
      res.json({ answer });
    } catch (error) {
      console.error("Error querying assistant:", error);
      res.status(500).json({ message: "Failed to query assistant" });
    }
  });

  // Get workflow recommendations
  app.get("/api/workflows/:id/recommendations", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      
      // Import enhanced assistant functionalities
      const { generateWorkflowRecommendations } = await import("./services/enhanced-assistant");
      
      // Gather context data for the workflow
      const workflow = await storage.getWorkflow(workflowId);
      const workflowState = await storage.getWorkflowState(workflowId);
      const checklistItems = await storage.getChecklistItems(workflowId);
      const documents = await storage.getDocuments(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Get context-aware recommendations
      const context = {
        workflow,
        workflowState,
        checklistItems,
        documents,
        currentStep: workflowState?.currentStep || undefined
      };
      
      const recommendations = generateWorkflowRecommendations(context);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating workflow recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });
  
  // Extract data from uploaded document
  app.post("/api/workflows/:id/documents/extract-data", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const { documentId, documentContent, documentType } = req.body;
      
      // Import enhanced assistant functionalities
      const { extractDocumentData } = await import("./services/enhanced-assistant");
      
      if (!documentContent) {
        return res.status(400).json({ message: "Document content is required" });
      }
      
      // Extract data from document
      const extractedData = extractDocumentData(documentContent, documentType || "unknown");
      
      // Return the extracted data
      res.json({
        workflowId,
        documentId,
        extractedData
      });
    } catch (error) {
      console.error("Error extracting document data:", error);
      res.status(500).json({ message: "Failed to extract document data" });
    }
  });
  
  // Generate dynamic checklist for a workflow
  app.post("/api/workflows/:id/generate-checklist", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const { specialConsiderations } = req.body;
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Import enhanced assistant functionalities
      const { generateDynamicChecklist } = await import("./services/enhanced-assistant");
      
      // Generate dynamic checklist based on workflow type
      const checklistItems = generateDynamicChecklist(workflow.type as WorkflowType, specialConsiderations);
      
      // Store the generated checklist items in the database
      const savedItems = [];
      
      for (let i = 0; i < checklistItems.length; i++) {
        const item = checklistItems[i];
        const savedItem = await storage.createChecklistItem({
          workflowId,
          title: item.title,
          description: item.description,
          completed: false,
          order: i + 1
        });
        savedItems.push(savedItem);
      }
      
      res.json(savedItems);
    } catch (error) {
      console.error("Error generating dynamic checklist:", error);
      res.status(500).json({ message: "Failed to generate checklist" });
    }
  });

  // Document classification endpoint - analyze text without saving
  app.post("/api/documents/classify", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ 
          message: "Document text is required for classification" 
        });
      }
      
      const classification = await classifyDocument(text);
      
      res.json({
        ...classification,
        documentTypeLabel: getDocumentTypeLabel(classification.documentType)
      });
    } catch (error) {
      console.error("Error classifying document:", error);
      res.status(500).json({ message: "Failed to classify document" });
    }
  });
  
  // Enhanced document upload with automatic classification
  app.post("/api/workflows/:id/documents/auto-classify", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const { name, contentType, content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ 
          message: "Document content is required for classification" 
        });
      }
      
      if (!contentType) {
        return res.status(400).json({
          message: "Content type is required"
        });
      }
      
      // Create document using document service - this handles auto-classification
      const newDocument = await documentService.createDocument({
        workflowId,
        name,
        contentType,
        content
      });
      
      // Get the actual classification information from the document
      const classificationInfo = newDocument.classification || {
        documentType: newDocument.type as string,
        confidence: 1.0,
        wasManuallyClassified: false,
        classifiedAt: new Date().toISOString()
      };
      
      // Return the document with classification information
      res.status(201).json({
        document: newDocument,
        classification: {
          ...classificationInfo,
          documentTypeLabel: getDocumentTypeLabel(classificationInfo.documentType as DocumentType)
        }
      });
    } catch (error) {
      console.error("Error processing document:", error);
      res.status(500).json({ message: "Failed to process document" });
    }
  });

  // Geospatial Analysis Operations Endpoint
  app.post("/api/geospatial/analyze", async (req, res) => {
    try {
      const { operation, features, params } = req.body;
      
      // Input validation
      if (!operation || !Object.values(GeospatialOperationType).includes(operation)) {
        return res.status(400).json({ 
          message: "Valid operation type is required",
          validOperations: Object.values(GeospatialOperationType)
        });
      }
      
      if (!features || (Array.isArray(features) && features.length === 0)) {
        return res.status(400).json({ 
          message: "At least one feature is required for analysis" 
        });
      }
      
      // Run the geospatial analysis
      const result = runGeospatialAnalysis(
        operation as GeospatialOperationType, 
        features, 
        params as OperationParams
      );
      
      // If there was an error in the analysis
      if (result.error) {
        return res.status(400).json({ 
          message: result.error,
          operation 
        });
      }
      
      // Return the analysis result
      res.json(result);
    } catch (error) {
      console.error("Error in geospatial analysis:", error);
      res.status(500).json({ 
        message: "Failed to perform geospatial analysis",
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Merge Parcels Operation
  app.post("/api/geospatial/merge-parcels", async (req, res) => {
    try {
      const { parcels, newParcelId } = req.body;
      
      if (!parcels || !Array.isArray(parcels) || parcels.length < 2) {
        return res.status(400).json({ 
          message: "At least two parcel features are required for merging" 
        });
      }
      
      // Run the merge operation
      const result = runGeospatialAnalysis(
        GeospatialOperationType.MERGE,
        parcels,
        { preserveProperties: true }
      );
      
      // If there was an error in the analysis
      if (result.error) {
        return res.status(400).json({ 
          message: result.error,
          operation: GeospatialOperationType.MERGE
        });
      }
      
      // In a real implementation, we would update the database 
      // to reflect the merged parcels
      
      // Return the analysis result
      res.json(result);
    } catch (error) {
      console.error("Error in parcel merging:", error);
      res.status(500).json({ 
        message: "Failed to merge parcels",
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Split Parcel Operation
  app.post("/api/geospatial/split-parcel", async (req, res) => {
    try {
      const { parcel, splitLine, newParcelIds } = req.body;
      
      if (!parcel) {
        return res.status(400).json({ 
          message: "A parcel feature is required for splitting" 
        });
      }
      
      if (!splitLine) {
        return res.status(400).json({ 
          message: "A line feature is required to define the split" 
        });
      }
      
      // Run the split operation (custom implementation using the features)
      const result = runGeospatialAnalysis(
        GeospatialOperationType.SPLIT,
        [parcel, splitLine],
        { preserveProperties: true }
      );
      
      // If there was an error in the analysis
      if (result.error) {
        return res.status(400).json({ 
          message: result.error,
          operation: GeospatialOperationType.SPLIT
        });
      }
      
      // In a real implementation, we would update the database 
      // to reflect the split parcels
      
      // Return the analysis result
      res.json(result);
    } catch (error) {
      console.error("Error in parcel splitting:", error);
      res.status(500).json({ 
        message: "Failed to split parcel",
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Get supported report formats
  app.get("/api/geospatial/report-formats", async (req, res) => {
    try {
      const formats = getSupportedFormats();
      res.json(formats);
    } catch (error) {
      console.error("Error getting report formats:", error);
      res.status(500).json({ 
        message: "Failed to get report formats",
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Generate a report from geospatial analysis results
  app.post("/api/geospatial/generate-report", async (req, res) => {
    try {
      const { result, options } = req.body;
      
      if (!result) {
        return res.status(400).json({ 
          message: "Analysis result is required for report generation" 
        });
      }
      
      if (!options || !options.format) {
        return res.status(400).json({ 
          message: "Report format is required" 
        });
      }
      
      // Validate the format
      if (!Object.values(ReportFormat).includes(options.format)) {
        return res.status(400).json({ 
          message: "Invalid report format",
          validFormats: Object.values(ReportFormat)
        });
      }
      
      // Generate the report
      const reportPath = await generateReport(
        result as GeospatialAnalysisResult,
        {
          format: options.format as ReportFormat,
          title: options.title,
          fileName: options.fileName,
          includeMetadata: options.includeMetadata !== false,
          includeTimestamp: options.includeTimestamp !== false
        }
      );
      
      // Read the file content
      const fileContent = fs.readFileSync(reportPath);
      
      // Set appropriate headers based on format
      let contentType = 'application/octet-stream';
      let disposition = 'attachment';
      let filename = path.basename(reportPath);
      
      switch (options.format) {
        case ReportFormat.PDF:
          contentType = 'application/pdf';
          break;
        case ReportFormat.GEOJSON:
          contentType = 'application/geo+json';
          break;
        case ReportFormat.CSV:
          contentType = 'text/csv';
          break;
      }
      
      // Set response headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      res.setHeader('Content-Length', fileContent.length);
      
      // Send the file
      res.end(fileContent);
      
      // Clean up the temporary file after sending
      setTimeout(() => {
        try {
          fs.unlinkSync(reportPath);
        } catch (err) {
          console.error('Error deleting temporary report file:', err);
        }
      }, 1000);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ 
        message: "Failed to generate report",
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Export analysis result directly
  app.post("/api/geospatial/export", async (req, res) => {
    try {
      const { operation, features, params, format } = req.body;
      
      // Input validation
      if (!operation || !Object.values(GeospatialOperationType).includes(operation)) {
        return res.status(400).json({ 
          message: "Valid operation type is required",
          validOperations: Object.values(GeospatialOperationType)
        });
      }
      
      if (!features || (Array.isArray(features) && features.length === 0)) {
        return res.status(400).json({ 
          message: "At least one feature is required for analysis" 
        });
      }
      
      if (!format || !Object.values(ReportFormat).includes(format)) {
        return res.status(400).json({ 
          message: "Valid report format is required",
          validFormats: Object.values(ReportFormat)
        });
      }
      
      // Run the geospatial analysis
      const result = runGeospatialAnalysis(
        operation as GeospatialOperationType, 
        features, 
        params as OperationParams
      );
      
      // If there was an error in the analysis
      if (result.error) {
        return res.status(400).json({ 
          message: result.error,
          operation 
        });
      }
      
      // Generate the report directly
      const reportPath = await generateReport(
        result,
        {
          format: format as ReportFormat,
          title: `${operationTitles[operation]} Export`,
          includeMetadata: true,
          includeTimestamp: true
        }
      );
      
      // Read the file content
      const fileContent = fs.readFileSync(reportPath);
      
      // Set appropriate headers based on format
      let contentType = 'application/octet-stream';
      let disposition = 'attachment';
      let filename = path.basename(reportPath);
      
      switch (format) {
        case ReportFormat.PDF:
          contentType = 'application/pdf';
          break;
        case ReportFormat.GEOJSON:
          contentType = 'application/geo+json';
          break;
        case ReportFormat.CSV:
          contentType = 'text/csv';
          break;
      }
      
      // Set response headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      res.setHeader('Content-Length', fileContent.length);
      
      // Send the file
      res.end(fileContent);
      
      // Clean up the temporary file after sending
      setTimeout(() => {
        try {
          fs.unlinkSync(reportPath);
        } catch (err) {
          console.error('Error deleting temporary report file:', err);
        }
      }, 1000);
    } catch (error) {
      console.error("Error in export operation:", error);
      res.status(500).json({ 
        message: "Failed to export analysis",
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Bulk auto-classification for workflow documents
  app.post("/api/workflows/:id/documents/bulk-auto-classify", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      
      // Get all documents for this workflow
      const documents = await storage.getDocuments(workflowId);
      
      if (!documents || documents.length === 0) {
        return res.json({ 
          message: "No documents found for this workflow", 
          updatedCount: 0 
        });
      }
      
      // Track documents that were updated
      const updatedDocuments = [];
      
      // Only process documents without manual classification
      for (const doc of documents) {
        // Skip documents that were manually classified
        if (doc.classification?.wasManuallyClassified) {
          continue;
        }
        
        try {
          // In a real system, we would fetch the document content from storage using storageKey
          // For this demo, we'll use a sample text to simulate document content
          // This would typically be fetched from a document store using the storageKey
          // const content = await documentStorageService.getContent(doc.storageKey);
          
          // For demonstration purposes only - in production, use real document content
          const sampleContent = Buffer.from(
            doc.name.includes("deed") ? "This is a deed for property transfer" :
            doc.name.includes("survey") ? "Land survey report with property boundaries" :
            doc.name.includes("plat") ? "Plat map showing subdivision of parcels" :
            doc.name.includes("tax") ? "Property tax form with assessment values" :
            doc.name.includes("legal") ? "Legal description of property boundaries" :
            doc.name.includes("boundary") ? "Boundary line adjustment application" :
            "General document content for classification"
          ).toString('base64');
          
          // Extract text from the sample content
          const textContent = await documentService.extractText(sampleContent, doc.contentType);
          
          // Classify the document
          const classification = await classifyDocument(textContent);
          
          // Update the document classification if confidence is high enough
          if (classification.confidence > 0.7) {
            const updatedDoc = await documentService.updateDocumentClassification(
              doc.id,
              classification.documentType as DocumentType
            );
            
            updatedDocuments.push(updatedDoc);
          }
        } catch (docError) {
          console.error(`Error auto-classifying document ${doc.id}:`, docError);
          // Continue with other documents
        }
      }
      
      res.json({
        message: `Auto-classified ${updatedDocuments.length} of ${documents.length} documents`,
        updatedCount: updatedDocuments.length,
        totalDocuments: documents.length,
        updatedDocuments: updatedDocuments.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          classification: doc.classification
        }))
      });
    } catch (error) {
      console.error("Error auto-classifying workflow documents:", error);
      res.status(500).json({ 
        message: "Failed to auto-classify documents",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ---------- REPORT SYSTEM ENDPOINTS ----------
  
  // Get report templates
  app.get("/api/reports/templates", async (req, res) => {
    try {
      const templates = await storage.getReportTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching report templates:", error);
      res.status(500).json({ 
        message: "Failed to fetch report templates",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get report template by ID
  app.get("/api/reports/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getReportTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Report template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching report template:", error);
      res.status(500).json({ 
        message: "Failed to fetch report template",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create report template
  app.post("/api/reports/templates", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const template = await storage.createReportTemplate({
        ...req.body,
        createdBy: req.user.id
      });
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating report template:", error);
      res.status(500).json({ 
        message: "Failed to create report template",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Generate report
  app.post("/api/reports", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { templateId, parameters } = req.body;
      
      if (!templateId) {
        return res.status(400).json({ message: "Template ID is required" });
      }
      
      // Get the template
      const template = await storage.getReportTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Report template not found" });
      }
      
      // Generate the report name
      let reportName = template.name;
      if (parameters.startDate && parameters.endDate) {
        reportName += ` - ${parameters.startDate} to ${parameters.endDate}`;
      }
      
      // Create the report
      const report = await storage.createReport({
        name: reportName,
        templateId,
        parameters,
        generatedBy: req.user.id
      });
      
      // Generate report data (this would be processed asynchronously in a real system)
      // For now, we'll update the report status and add placeholder data
      const resultData = await storage.generateReportData(report.id, parameters);
      
      // Update the report with the generated data
      const updatedReport = await storage.updateReport(report.id, {
        status: 'completed',
        resultData,
        completedAt: new Date().toISOString(),
        totalRows: resultData.rows?.length || 0
      });
      
      res.status(201).json(updatedReport);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ 
        message: "Failed to generate report",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      // Extract query parameters for filtering
      const { startDate, endDate, status, templateId } = req.query;
      
      // Create filter object
      const filter: Record<string, any> = {};
      if (startDate) filter.startDate = startDate as string;
      if (endDate) filter.endDate = endDate as string;
      if (status) filter.status = status as string;
      if (templateId) filter.templateId = parseInt(templateId as string);
      
      const reports = await storage.getReports(filter);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ 
        message: "Failed to fetch reports",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get report by ID
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ 
        message: "Failed to fetch report",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get report data
  app.get("/api/reports/:id/data", async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      if (report.status !== 'completed') {
        return res.status(400).json({ 
          message: "Report is not completed yet",
          status: report.status 
        });
      }
      
      // Get sorting parameters
      const { sortField, sortDirection } = req.query;
      
      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      // Get the report data (with sorting and pagination applied)
      const reportData = await storage.getReportData(
        reportId, 
        sortField as string | undefined, 
        sortDirection as 'asc' | 'desc' | undefined,
        page,
        pageSize
      );
      
      res.json(reportData);
    } catch (error) {
      console.error("Error fetching report data:", error);
      res.status(500).json({ 
        message: "Failed to fetch report data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Export report
  app.post("/api/reports/:id/export", async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const { format } = req.body;
      
      if (!format || !['pdf', 'excel', 'csv', 'html'].includes(format)) {
        return res.status(400).json({ message: "Valid format is required (pdf, excel, csv, html)" });
      }
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      if (report.status !== 'completed') {
        return res.status(400).json({ message: "Report is not completed yet" });
      }
      
      // Generate the export and get the file path
      const exportResult = await storage.exportReport(reportId, format as 'pdf' | 'excel' | 'csv' | 'html');
      
      // Return the download URL
      res.json({
        downloadUrl: `/api/reports/${reportId}/export/${format}`,
        filename: exportResult.filename
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ 
        message: "Failed to export report",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Download exported report
  app.get("/api/reports/:id/export/:format", async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const format = req.params.format;
      
      if (!['pdf', 'excel', 'csv', 'html'].includes(format)) {
        return res.status(400).json({ message: "Invalid format" });
      }
      
      // Get the export file info
      const exportInfo = await storage.getReportExport(reportId, format as 'pdf' | 'excel' | 'csv' | 'html');
      if (!exportInfo) {
        return res.status(404).json({ message: "Export not found" });
      }
      
      // Set the content type based on format
      let contentType = 'application/octet-stream';
      switch (format) {
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'excel':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'csv':
          contentType = 'text/csv';
          break;
        case 'html':
          contentType = 'text/html';
          break;
      }
      
      // Set headers for download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportInfo.filename}"`);
      
      // Send the file
      res.sendFile(exportInfo.filePath);
    } catch (error) {
      console.error("Error downloading report export:", error);
      res.status(500).json({ 
        message: "Failed to download report export",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Preview report (similar to generate but returns limited preview data)
  app.post("/api/reports/preview", async (req, res) => {
    try {
      const { templateId, parameters } = req.body;
      
      if (!templateId) {
        return res.status(400).json({ message: "Template ID is required" });
      }
      
      // Get the template
      const template = await storage.getReportTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Report template not found" });
      }
      
      // Generate preview data (limited subset of full report)
      const previewData = await storage.generateReportPreview(templateId, parameters);
      
      res.json(previewData);
    } catch (error) {
      console.error("Error generating report preview:", error);
      res.status(500).json({ 
        message: "Failed to generate report preview",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Report Schedules
  
  // Get all report schedules
  app.get("/api/reports/schedules", async (req, res) => {
    try {
      const schedules = await storage.getReportSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching report schedules:", error);
      res.status(500).json({ 
        message: "Failed to fetch report schedules",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Create report schedule
  app.post("/api/reports/schedules", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const schedule = await storage.createReportSchedule({
        ...req.body,
        createdBy: req.user.id,
        nextRun: calculateNextRun(req.body)
      });
      
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating report schedule:", error);
      res.status(500).json({ 
        message: "Failed to create report schedule",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Update report schedule
  app.patch("/api/reports/schedules/:id", async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const schedule = await storage.getReportSchedule(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Report schedule not found" });
      }
      
      // If frequency or time parameters changed, recalculate next run
      const updatedSchedule = { ...req.body };
      if (
        req.body.frequency !== undefined || 
        req.body.dayOfWeek !== undefined ||
        req.body.dayOfMonth !== undefined ||
        req.body.month !== undefined ||
        req.body.hour !== undefined ||
        req.body.minute !== undefined
      ) {
        updatedSchedule.nextRun = calculateNextRun({
          frequency: req.body.frequency || schedule.frequency,
          dayOfWeek: req.body.dayOfWeek !== undefined ? req.body.dayOfWeek : schedule.dayOfWeek,
          dayOfMonth: req.body.dayOfMonth !== undefined ? req.body.dayOfMonth : schedule.dayOfMonth,
          month: req.body.month !== undefined ? req.body.month : schedule.month,
          hour: req.body.hour !== undefined ? req.body.hour : schedule.hour,
          minute: req.body.minute !== undefined ? req.body.minute : schedule.minute
        });
      }
      
      const result = await storage.updateReportSchedule(scheduleId, updatedSchedule);
      res.json(result);
    } catch (error) {
      console.error("Error updating report schedule:", error);
      res.status(500).json({ 
        message: "Failed to update report schedule",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Delete report schedule
  app.delete("/api/reports/schedules/:id", async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      await storage.deleteReportSchedule(scheduleId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting report schedule:", error);
      res.status(500).json({ 
        message: "Failed to delete report schedule",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Helper function to calculate next run for schedules
  function calculateNextRun(schedule: any): string {
    const now = new Date();
    let nextRun = new Date();
    
    // Set time
    nextRun.setHours(schedule.hour);
    nextRun.setMinutes(schedule.minute);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
    
    // If the time is in the past for today, move to next occurrence
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1); // Move to tomorrow
    }
    
    // Adjust based on frequency
    switch (schedule.frequency) {
      case 'daily':
        // Already set to next day if needed
        break;
      case 'weekly':
        if (schedule.dayOfWeek !== undefined) {
          const currentDay = nextRun.getDay();
          const daysUntilTargetDay = (schedule.dayOfWeek - currentDay + 7) % 7;
          nextRun.setDate(nextRun.getDate() + daysUntilTargetDay);
        }
        break;
      case 'monthly':
        if (schedule.dayOfMonth !== undefined) {
          nextRun.setDate(1); // Start at beginning of month
          // If dayOfMonth is too high for current month, limit to last day
          const lastDayOfMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
          const targetDay = Math.min(schedule.dayOfMonth, lastDayOfMonth);
          nextRun.setDate(targetDay);
          
          // If it's in the past, move to next month
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
            const newLastDay = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
            nextRun.setDate(Math.min(schedule.dayOfMonth, newLastDay));
          }
        }
        break;
      case 'quarterly':
        // Set to first day of the next quarter if current quarter has passed
        const currentMonth = now.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3);
        const nextQuarterStartMonth = (currentQuarter + 1) % 4 * 3;
        
        if (nextRun <= now || currentMonth !== nextQuarterStartMonth) {
          if (currentMonth >= nextQuarterStartMonth) {
            // Move to next year's quarter if we're already past this year's quarter
            nextRun.setFullYear(nextRun.getFullYear() + 1);
          }
          nextRun.setMonth(nextQuarterStartMonth);
          nextRun.setDate(1);
        }
        break;
    }
    
    return nextRun.toISOString();
  }

  // Test API endpoints (for development purposes only)
  
  // Get workflow details (no authentication required)
  app.get("/api/test/workflows/:id", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      
      // Get workflow
      const workflow = await storage.getWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json(workflow);
    } catch (error) {
      console.error("Error retrieving workflow:", error);
      res.status(500).json({ message: "Failed to retrieve workflow" });
    }
  });
  
  // Get workflow state (no authentication required)
  app.get("/api/test/workflows/:id/state", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      
      // Get workflow state
      const state = await storage.getWorkflowState(workflowId);
      
      if (!state) {
        return res.status(404).json({ message: "Workflow state not found" });
      }
      
      res.json(state);
    } catch (error) {
      console.error("Error retrieving workflow state:", error);
      res.status(500).json({ message: "Failed to retrieve workflow state" });
    }
  });
  
  // Get workflow events (no authentication required)
  app.get("/api/test/workflows/:id/events", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      
      // Get workflow events
      const events = await storage.getWorkflowEvents(workflowId);
      
      res.json(events);
    } catch (error) {
      console.error("Error retrieving workflow events:", error);
      res.status(500).json({ message: "Failed to retrieve workflow events" });
    }
  });
  
  // Get checklist items for a workflow (no authentication required)
  app.get("/api/test/workflows/:id/checklist", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      
      // Get checklist items
      const items = await storage.getChecklistItems(workflowId);
      
      res.json(items);
    } catch (error) {
      console.error("Error retrieving checklist items:", error);
      res.status(500).json({ message: "Failed to retrieve checklist items" });
    }
  });
  
  // Update checklist item (no authentication required)
  app.patch("/api/test/workflows/checklist/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { completed } = req.body;
      
      // Update checklist item
      const updatedItem = await storage.updateChecklistItem(itemId, completed);
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating checklist item:", error);
      res.status(500).json({ message: "Failed to update checklist item" });
    }
  });
  
  // Document classification endpoint (no authentication required)
  app.post("/api/test/documents/classify", async (req, res) => {
    try {
      const { content, fileType, fileName } = req.body;
      
      // Import document classifier service
      const { classifyDocument } = await import("./services/document-classifier");
      
      // Classify document
      const classification = await classifyDocument(content, fileType, fileName);
      
      res.json(classification);
    } catch (error) {
      console.error("Error classifying document:", error);
      res.status(500).json({ 
        message: "Failed to classify document",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Document classification update endpoint (no authentication required)
  app.patch("/api/test/documents/:id/classification", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { documentType, confidence, wasManuallyClassified } = req.body;
      
      if (!documentId || isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      // Update document classification
      const updatedDocument = await storage.updateDocumentClassification(documentId, {
        documentType,
        confidence,
        wasManuallyClassified: wasManuallyClassified || false,
        classifiedAt: new Date().toISOString()
      });
      
      // Import document-related modules for logging events
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { users } = await import("../shared/schema");
      
      // Get test user for event logging
      const testUsers = await db.select().from(users).where(eq(users.username, "test_user"));
      const testUser = testUsers[0];
      
      if (testUser) {
        // Get workflow ID from document (if available)
        const document = await storage.getDocument(documentId);
        if (document && document.workflowId) {
          // Create workflow event for document classification
          await storage.createWorkflowEvent({
            workflowId: document.workflowId,
            eventType: wasManuallyClassified ? "document_manually_classified" : "document_auto_classified",
            description: `Document "${document.name}" classified as ${documentType}`,
            metadata: {
              documentId,
              documentType,
              confidence,
              wasManuallyClassified
            },
            createdBy: testUser.id
          });
        }
      }
      
      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating document classification:", error);
      res.status(500).json({ 
        message: "Failed to update document classification",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Batch document classification endpoint (no authentication required)
  app.post("/api/documents/batch/classify", async (req, res) => {
    try {
      const { documentIds, documentType, wasManuallyClassified = true } = req.body;
      
      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({ message: "Document IDs array is required" });
      }
      
      if (!documentType) {
        return res.status(400).json({ message: "Document type is required" });
      }
      
      const results = [];
      const errors = [];
      const classificationData = {
        documentType,
        confidence: 1.0, // Manual classifications are 100% confident by default
        wasManuallyClassified,
        classifiedAt: new Date().toISOString()
      };
      
      // Process each document
      for (const documentId of documentIds) {
        try {
          const updatedDocument = await storage.updateDocumentClassification(
            documentId,
            classificationData
          );
          
          results.push(updatedDocument);
          
          // Get workflow ID from document (if available) and create event
          const document = await storage.getDocument(documentId);
          if (document && document.workflowId) {
            // Create workflow event for document classification
            await storage.createWorkflowEvent({
              workflowId: document.workflowId,
              eventType: "document_batch_classified",
              description: `Document "${document.name}" batch classified as ${documentType}`,
              metadata: {
                documentId,
                documentType,
                wasManuallyClassified
              },
              createdBy: 1 // System user
            });
          }
        } catch (error) {
          console.error(`Error classifying document ${documentId}:`, error);
          errors.push({
            documentId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      res.json({
        success: true,
        totalProcessed: documentIds.length,
        successCount: results.length,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error in batch classification:", error);
      res.status(500).json({ 
        message: "Failed to process batch classification",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Batch document-parcel linking endpoint (no authentication required)
  app.post("/api/documents/batch/link-parcel", asyncHandler(async (req, res) => {
    const { documentIds, parcelId } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      throw ApiError.badRequest("Document IDs array is required");
    }
    
    if (!parcelId || isNaN(parseInt(parcelId))) {
      throw ApiError.badRequest("Valid parcel ID is required");
    }
    
    const parcelIdNum = parseInt(parcelId);
    const results = [];
    const errors = [];
    
    // Process each document
    for (const documentId of documentIds) {
      try {
        // Check if link already exists
        const existingLink = await storage.getDocumentParcelLink(documentId, parcelIdNum);
        
        if (!existingLink) {
          // Create the link
          const newLink = await storage.createDocumentParcelLink({
            documentId,
            parcelId: parcelIdNum,
            linkType: "related", // Default link type
          });
          
          results.push(newLink);
          
          // Get document details and create workflow event
          const document = await storage.getDocument(documentId);
          const parcel = await storage.getParcelById(parcelIdNum);
          
          if (document && document.workflowId && parcel) {
            await storage.createWorkflowEvent({
              workflowId: document.workflowId,
              eventType: "document_parcel_linked",
              description: `Document "${document.name}" linked to parcel ${parcel.parcelNumber}`,
              metadata: {
                documentId,
                parcelId: parcelIdNum,
                parcelNumber: parcel.parcelNumber
              },
              createdBy: 1 // System user
            });
          }
        } else {
          // Link already exists, count as success but note it
          results.push({
            ...existingLink,
            alreadyExists: true
          });
        }
      } catch (error) {
        console.error(`Error linking document ${documentId} to parcel ${parcelId}:`, error);
        errors.push({
          documentId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    res.json({
      success: true,
      totalProcessed: documentIds.length,
      successCount: results.length,
      errorCount: errors.length,
      newLinksCreated: results.filter(r => r.alreadyExists === undefined).length,
      existingLinks: results.filter(r => r.alreadyExists !== undefined).length,
      errors: errors.length > 0 ? errors : undefined
    });
  }));
  
  // Get parcels referenced by a document (no authentication required)
  app.get("/api/test/documents/:id/parcels", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      if (!documentId || isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      // Get parcels for document
      const parcels = await storage.getParcelsForDocument(documentId);
      
      res.json(parcels);
    } catch (error) {
      console.error("Error retrieving document parcels:", error);
      res.status(500).json({ message: "Failed to retrieve document parcels" });
    }
  });
  
  // Link a document to a parcel (no authentication required)
  app.post("/api/test/documents/:documentId/parcels/:parcelId", async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const parcelId = parseInt(req.params.parcelId);
      const { linkType = "reference", notes } = req.body;
      
      if (!documentId || isNaN(documentId) || !parcelId || isNaN(parcelId)) {
        return res.status(400).json({ message: "Invalid document or parcel ID" });
      }
      
      // Check if document exists
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if parcel exists
      const parcel = await storage.getParcelById(parcelId);
      if (!parcel) {
        return res.status(404).json({ message: "Parcel not found" });
      }
      
      // Check if link already exists
      const existingLink = await storage.getDocumentParcelLink(documentId, parcelId);
      if (existingLink) {
        return res.status(409).json({ 
          message: "Document is already linked to this parcel",
          link: existingLink
        });
      }
      
      // Create link
      const link = await storage.createDocumentParcelLink({
        documentId,
        parcelId,
        linkType,
        notes
      });
      
      // Import required packages for event logging
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { users } = await import("../shared/schema");
      
      // Get test user for event logging
      const testUsers = await db.select().from(users).where(eq(users.username, "test_user"));
      const testUser = testUsers[0];
      
      if (testUser && document.workflowId) {
        // Create workflow event for document-parcel link
        await storage.createWorkflowEvent({
          workflowId: document.workflowId,
          eventType: "document_parcel_linked",
          description: `Document "${document.name}" linked to parcel ${parcel.parcelNumber}`,
          metadata: {
            documentId,
            parcelId,
            linkType,
            notes
          },
          createdBy: testUser.id
        });
      }
      
      res.status(201).json(link);
    } catch (error) {
      console.error("Error linking document to parcel:", error);
      res.status(500).json({ 
        message: "Failed to link document to parcel",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Unlink a document from a parcel (no authentication required)
  app.delete("/api/test/documents/:documentId/parcels/:parcelId", async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const parcelId = parseInt(req.params.parcelId);
      
      if (!documentId || isNaN(documentId) || !parcelId || isNaN(parcelId)) {
        return res.status(400).json({ message: "Invalid document or parcel ID" });
      }
      
      // Check if link exists
      const existingLink = await storage.getDocumentParcelLink(documentId, parcelId);
      if (!existingLink) {
        return res.status(404).json({ message: "Document-parcel link not found" });
      }
      
      // Get document and parcel for event logging
      const document = await storage.getDocument(documentId);
      const parcel = await storage.getParcelById(parcelId);
      
      // Remove link
      await storage.removeDocumentParcelLinks(documentId, [parcelId]);
      
      // Import required packages for event logging
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { users } = await import("../shared/schema");
      
      // Get test user for event logging
      const testUsers = await db.select().from(users).where(eq(users.username, "test_user"));
      const testUser = testUsers[0];
      
      if (testUser && document && document.workflowId && parcel) {
        // Create workflow event for document-parcel unlink
        await storage.createWorkflowEvent({
          workflowId: document.workflowId,
          eventType: "document_parcel_unlinked",
          description: `Document "${document.name}" unlinked from parcel ${parcel.parcelNumber}`,
          metadata: {
            documentId,
            parcelId
          },
          createdBy: testUser.id
        });
      }
      
      res.json({ success: true, message: "Document unlinked from parcel" });
    } catch (error) {
      console.error("Error unlinking document from parcel:", error);
      res.status(500).json({ 
        message: "Failed to unlink document from parcel",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Create checklist item (no authentication required)
  app.post("/api/test/workflows/:id/checklist", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const { title, description, order } = req.body;
      
      // Create checklist item
      const newItem = await storage.createChecklistItem({
        workflowId,
        title,
        description,
        completed: false,
        order: order || 0
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating checklist item:", error);
      res.status(500).json({ message: "Failed to create checklist item" });
    }
  });
  
  // Create test workflow (no authentication required)
  app.post("/api/test/workflows", async (req, res) => {
    try {
      const parsedWorkflow = z.object({
        type: z.nativeEnum(WorkflowType),
        title: z.string(),
        description: z.string().optional(),
      }).parse(req.body);
      
      // Import required packages
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { users } = await import("../shared/schema");
      
      // Create test user if not exists
      const testUsers = await db.select().from(users).where(eq(users.username, "test_user"));
      let testUser = testUsers[0];
      
      if (!testUser) {
        const hashedPassword = await hashPassword("test123");
        
        const insertedUsers = await db.insert(users).values({
          username: "test_user",
          email: "test@example.com",
          password: hashedPassword,
          fullName: "Test User",
          department: "Development",
          isAdmin: true
        }).returning();
        
        testUser = insertedUsers[0];
      }
      
      // Create workflow
      const newWorkflow = await storage.createWorkflow({
        ...parsedWorkflow,
        userId: testUser.id,
        status: "in_progress"
      });
      
      // Create initial event
      await storage.createWorkflowEvent({
        workflowId: newWorkflow.id,
        eventType: "created",
        description: `Test workflow "${newWorkflow.title}" created`,
        metadata: { workflowType: newWorkflow.type },
        createdBy: testUser.id
      });
      
      res.status(201).json(newWorkflow);
    } catch (error) {
      console.error("Error creating test workflow:", error);
      res.status(500).json({ 
        message: "Failed to create test workflow",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Create test workflow event (no authentication required)
  app.post("/api/test/workflows/:id/events", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const { eventType, description, metadata } = req.body;
      
      // Import required packages
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { users } = await import("../shared/schema");
      
      // Get test user
      const testUsers = await db.select().from(users).where(eq(users.username, "test_user"));
      const testUser = testUsers[0];
      
      if (!testUser) {
        return res.status(500).json({ message: "Test user not found" });
      }
      
      // Create event
      const newEvent = await storage.createWorkflowEvent({
        workflowId,
        eventType,
        description,
        metadata,
        createdBy: testUser.id
      });
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating test workflow event:", error);
      res.status(500).json({ message: "Failed to create test workflow event" });
    }
  });

  // Update test workflow state (no authentication required)
  app.patch("/api/test/workflows/:id/state", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const workflowState = insertWorkflowStateSchema.parse(req.body);
      
      const updatedState = await storage.updateWorkflowState(workflowId, workflowState);
      
      // Import required packages
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { users, workflowEventTypeEnum } = await import("../shared/schema");
      
      // Get test user
      const testUsers = await db.select().from(users).where(eq(users.username, "test_user"));
      const testUser = testUsers[0];
      
      if (testUser) {
        // Create workflow event for state update
        await storage.createWorkflowEvent({
          workflowId,
          eventType: "updated", // Using a valid event type from the enum
          description: "Workflow state updated via test API",
          metadata: workflowState,
          createdBy: testUser.id
        });
      }
      
      res.json(updatedState);
    } catch (error) {
      console.error("Error updating test workflow state:", error);
      res.status(500).json({ message: "Failed to update test workflow state" });
    }
  });

  // WebSocket Test Endpoints
  app.get("/api/websocket/test", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WebSocket Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          #status { font-weight: bold; }
          #log { height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
          .connected { color: green; }
          .disconnected { color: red; }
          .message { margin: 5px 0; }
          .sent { color: blue; }
          .received { color: purple; }
          button, input, select { margin: 5px; padding: 5px; }
          fieldset { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
          legend { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>WebSocket Server Test</h1>
        <div>Status: <span id="status" class="disconnected">Disconnected</span></div>
        
        <fieldset>
          <legend>Connection</legend>
          <div>
            <input type="text" id="username" placeholder="Username" value="TestUser">
            <button id="connect">Connect</button>
            <button id="disconnect" disabled>Disconnect</button>
          </div>
        </fieldset>
        
        <fieldset>
          <legend>Room</legend>
          <div>
            <input type="text" id="roomId" placeholder="Room ID" value="test-room">
            <button id="join" disabled>Join Room</button>
            <button id="leave" disabled>Leave Room</button>
          </div>
        </fieldset>
        
        <fieldset>
          <legend>Messages</legend>
          <div>
            <input type="text" id="message" placeholder="Message text" style="width: 60%;">
            <select id="messageType">
              <option value="chat_message">Chat Message</option>
              <option value="heartbeat">Heartbeat</option>
              <option value="cursor_move">Cursor Move</option>
            </select>
            <button id="send" disabled>Send</button>
          </div>
        </fieldset>
        
        <div id="log"></div>
        
        <script>
          let socket;
          let currentRoom = "";
          let userId = "user_" + Math.floor(Math.random() * 10000);
          
          const statusEl = document.getElementById("status");
          const logEl = document.getElementById("log");
          const connectBtn = document.getElementById("connect");
          const disconnectBtn = document.getElementById("disconnect");
          const joinBtn = document.getElementById("join");
          const leaveBtn = document.getElementById("leave");
          const sendBtn = document.getElementById("send");
          
          function log(message, type = "") {
            const div = document.createElement("div");
            div.className = "message " + type;
            div.textContent = message;
            logEl.appendChild(div);
            logEl.scrollTop = logEl.scrollHeight;
          }
          
          function connect() {
            try {
              const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
              const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
              
              log("Connecting to " + wsUrl);
              socket = new WebSocket(wsUrl);
              
              socket.onopen = () => {
                statusEl.textContent = "Connected";
                statusEl.className = "connected";
                log("WebSocket connection established");
                
                connectBtn.disabled = true;
                disconnectBtn.disabled = false;
                joinBtn.disabled = false;
              };
              
              socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                log("Received: " + JSON.stringify(data, null, 2), "received");
                
                // Enable send button when in a room
                if (data.type === "join_room" && data.roomId === currentRoom) {
                  sendBtn.disabled = false;
                }
              };
              
              socket.onclose = () => {
                statusEl.textContent = "Disconnected";
                statusEl.className = "disconnected";
                log("WebSocket connection closed");
                
                connectBtn.disabled = false;
                disconnectBtn.disabled = true;
                joinBtn.disabled = true;
                leaveBtn.disabled = true;
                sendBtn.disabled = true;
                currentRoom = "";
              };
              
              socket.onerror = (error) => {
                log("WebSocket error: " + error, "error");
              };
            } catch (error) {
              log("Error connecting to WebSocket: " + error);
            }
          }
          
          function disconnect() {
            if (socket) {
              socket.close();
            }
          }
          
          function joinRoom() {
            const roomIdEl = document.getElementById("roomId");
            const usernameEl = document.getElementById("username");
            const roomId = roomIdEl.value.trim();
            const username = usernameEl.value.trim();
            
            if (!roomId) {
              return log("Please enter a room ID");
            }
            
            const message = {
              type: "join_room",
              roomId: roomId,
              userId: userId,
              username: username
            };
            
            socket.send(JSON.stringify(message));
            log("Sent: " + JSON.stringify(message, null, 2), "sent");
            
            currentRoom = roomId;
            joinBtn.disabled = true;
            leaveBtn.disabled = false;
          }
          
          function leaveRoom() {
            if (!currentRoom) return;
            
            const message = {
              type: "leave_room",
              roomId: currentRoom,
              userId: userId
            };
            
            socket.send(JSON.stringify(message));
            log("Sent: " + JSON.stringify(message, null, 2), "sent");
            
            currentRoom = "";
            joinBtn.disabled = false;
            leaveBtn.disabled = true;
            sendBtn.disabled = true;
          }
          
          function sendMessage() {
            if (!currentRoom) return;
            
            const messageEl = document.getElementById("message");
            const messageTypeEl = document.getElementById("messageType");
            const messageText = messageEl.value.trim();
            const messageType = messageTypeEl.value;
            
            if (!messageText && messageType === "chat_message") {
              return log("Please enter a message");
            }
            
            let payload = {};
            
            switch (messageType) {
              case "chat_message":
                payload = { text: messageText };
                break;
              case "cursor_move":
                payload = { 
                  position: { 
                    x: Math.floor(Math.random() * 100), 
                    y: Math.floor(Math.random() * 100) 
                  } 
                };
                break;
              case "heartbeat":
                payload = { timestamp: Date.now() };
                break;
            }
            
            const message = {
              type: messageType,
              roomId: currentRoom,
              userId: userId,
              username: document.getElementById("username").value,
              payload: payload
            };
            
            socket.send(JSON.stringify(message));
            log("Sent: " + JSON.stringify(message, null, 2), "sent");
            
            if (messageType === "chat_message") {
              messageEl.value = "";
            }
          }
          
          // Event listeners
          connectBtn.addEventListener("click", connect);
          disconnectBtn.addEventListener("click", disconnect);
          joinBtn.addEventListener("click", joinRoom);
          leaveBtn.addEventListener("click", leaveRoom);
          sendBtn.addEventListener("click", sendMessage);
          
          // Handle Enter key in message input
          document.getElementById("message").addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !sendBtn.disabled) {
              sendMessage();
            }
          });
        </script>
      </body>
      </html>
    `);
  });



  const httpServer = createServer(app);
  
  // Setup WebSocket server using the HTTP server for real-time collaboration
  const wsManager = new WebSocketManager(httpServer);
  
  // Health check endpoint for WebSocket server
  app.get("/api/websocket/health", (req, res) => {
    try {
      const status = {
        status: 'healthy',
        isRunning: !!wsManager,
        rooms: wsManager.getRoomsStatus(),
        activeConnections: wsManager.getActiveConnectionsCount(),
        timestamp: Date.now()
      };
      
      res.json(status);
    } catch (error) {
      console.error('Error retrieving WebSocket health status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve WebSocket server health status',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Endpoint to get details about a specific room
  app.get("/api/websocket/rooms/:roomId", (req, res) => {
    try {
      const roomId = req.params.roomId;
      const rooms = wsManager.getRoomsStatus();
      const room = rooms.find(r => r.id === roomId);
      
      if (!room) {
        return res.status(404).json({
          status: 'error',
          message: `Room with ID ${roomId} not found`
        });
      }
      
      res.json({
        status: 'success',
        room,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`Error retrieving room ${req.params.roomId}:`, error);
      res.status(500).json({
        status: 'error',
        message: `Failed to retrieve room ${req.params.roomId}`,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return httpServer;
}
