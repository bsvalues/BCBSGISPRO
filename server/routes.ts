import type { Express } from "express";
import { createServer, type Server } from "http";
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
import { z } from "zod";
import { eq } from "drizzle-orm";

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

  const httpServer = createServer(app);
  return httpServer;
}
