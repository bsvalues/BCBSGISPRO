import type { Express } from "express";
import { createServer, type Server } from "http";
import * as fs from 'fs';
import * as path from 'path';
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  workflows, 
  WorkflowState, 
  insertWorkflowStateSchema,
  documents,
  parcels,
  mapLayers,
  checklistItems,
  WorkflowType
} from "@shared/schema";
import { classifyDocument, DocumentType, getDocumentTypeLabel } from "./services/document-classifier";
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

  // Development mode middleware to bypass authentication
  app.use((req, res, next) => {
    // For development, create a mock user if not authenticated
    if (!req.user) {
      req.user = {
        id: 1,
        username: 'admin',
        fullName: 'Administrator',
        email: 'admin@example.com',
        department: 'IT',
        isAdmin: true,
        createdAt: new Date(),
        password: 'hashed_password'
      };
    }
    next();
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

      res.status(201).json(newWorkflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      res.status(500).json({ message: "Failed to create workflow" });
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
      // In a real implementation, this would handle file uploads
      const { name, type, content } = req.body;
      
      const newDocument = await storage.addDocument(workflowId, { name, type, content });
      res.status(201).json(newDocument);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
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

  // Get map layers
  app.get("/api/map-layers", async (req, res) => {
    try {
      const layers = await storage.getMapLayers();
      res.json(layers);
    } catch (error) {
      console.error("Error fetching map layers:", error);
      res.status(500).json({ message: "Failed to fetch map layers" });
    }
  });

  // Get parcel information by parcel ID
  app.get("/api/parcels/:parcelId", async (req, res) => {
    try {
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

  // Basic chatbot endpoint
  app.post("/api/chatbot/query", async (req, res) => {
    try {
      const { query } = req.body;
      // In a real implementation, this would integrate with a proper NLP service
      const answer = await storage.queryAssistant(query);
      res.json({ answer });
    } catch (error) {
      console.error("Error querying assistant:", error);
      res.status(500).json({ message: "Failed to query assistant" });
    }
  });

  // Document classification endpoint
  app.post("/api/documents/classify", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ 
          message: "Document text is required for classification" 
        });
      }
      
      const classification = classifyDocument(text);
      
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
      const { name, content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ 
          message: "Document content is required for classification" 
        });
      }
      
      // Classify the document based on its content
      const classification = classifyDocument(content);
      
      // Add the document with the classified type
      const newDocument = await storage.addDocument(workflowId, {
        name,
        type: classification.documentType,
        content
      });
      
      // Return the document with classification information
      res.status(201).json({
        document: newDocument,
        classification: {
          ...classification,
          documentTypeLabel: getDocumentTypeLabel(classification.documentType)
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

  const httpServer = createServer(app);
  return httpServer;
}
