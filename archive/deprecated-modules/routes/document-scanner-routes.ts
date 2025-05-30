/**
 * Document Scanner Routes
 * 
 * These routes handle document uploads, OCR processing, and AI analysis
 * for title reports, property documents, and legal descriptions.
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ApiError, asyncHandler } from '../error-handler';
import { analyzeDocument } from '../services/document-analyzer-service';
import { logger } from '../logger';

// Get the directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'doc-' + uniqueSuffix + ext);
  }
});

// File filter to only accept images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 
    'image/png', 
    'image/tiff', 
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('File type not supported. Please upload a PDF or image file.'), false);
  }
};

// Set up the multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB max file size
  }
});

// Function to register document scanner routes
export function registerDocumentScannerRoutes(app: express.Express) {
  // Document upload and analysis endpoint
  app.post('/api/documents/analyze', upload.single('document'), asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('No document file uploaded');
    }

    try {
      logger.info(`Document uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        throw ApiError.internal('OpenAI API key not configured', 'OPENAI_API_KEY_MISSING');
      }
      
      // Process the uploaded file
      const analysisResult = await analyzeDocument(
        req.file.path,
        req.file.originalname
      );
      
      // Clean up temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) logger.error(`Failed to delete temporary file: ${req.file.path}`, err);
      });

      return res.json({
        success: true,
        data: analysisResult
      });
    } catch (error) {
      // Clean up temporary file on error
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      
      logger.error('Document analysis error:', error);
      throw ApiError.internal(
        'Failed to analyze document', 
        'DOCUMENT_ANALYSIS_ERROR',
        error instanceof Error ? { message: error.message } : {}
      );
    }
  }));

  // Document analysis status endpoint (stub for long-running processes)
  app.get('/api/documents/status/:jobId', asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    
    // In a real implementation, this would query a job status database
    // For now, we'll return a mock "completed" status
    
    return res.json({
      jobId,
      status: 'completed',
      progress: 100,
      message: 'Document analysis complete'
    });
  }));

  // Add more document scanner endpoints here...

  logger.info('Document scanner routes registered');
}