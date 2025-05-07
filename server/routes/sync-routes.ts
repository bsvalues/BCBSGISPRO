/**
 * Sync Routes for Property Data Synchronization
 * ICSF-compliant API endpoints for importing, exporting, staging, and approving property data
 */

import express from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { calculateSHA256 } from './sync-helpers';
import { achievementService } from '../services/achievement-service';

// Create Express router
const router = express.Router();

// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use original filename
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Logs directory setup
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const syncLogPath = path.join(logsDir, 'sync_import_log.csv');
const stagingLogPath = path.join(logsDir, 'staging_uploads.json');

// Ensure log files exist
if (!fs.existsSync(syncLogPath)) {
  fs.writeFileSync(syncLogPath, 'timestamp,filename,prop_id,sha256,risk_flag\n');
}

if (!fs.existsSync(stagingLogPath)) {
  fs.writeFileSync(stagingLogPath, JSON.stringify([]));
}

// Helper to extract property ID from XML content
function extractPropIdFromXML(content: string): string {
  // In a real implementation, this would parse the XML properly
  // For demo purposes, we'll use a simplified approach
  const propIdMatch = content.match(/<PropertyID>(.*?)<\/PropertyID>/);
  if (propIdMatch && propIdMatch[1]) {
    return propIdMatch[1];
  }
  
  // Fallback to a random ID for demo purposes
  return `PROP-${Math.floor(Math.random() * 100000)}`;
}

// Helper to add entry to sync log
async function logSync(fileName: string, propId: string, sha256Hash: string, risk = "none") {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp},"${fileName}","${propId}","${sha256Hash}","${risk}"\n`;
  
  try {
    await promisify(fs.appendFile)(syncLogPath, logEntry);
    return true;
  } catch (error) {
    console.error("Error writing to sync log:", error);
    return false;
  }
}

// Helper to get data from staging log
async function getStagingData(): Promise<any[]> {
  try {
    const data = await promisify(fs.readFile)(stagingLogPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading staging data:", error);
    return [];
  }
}

// Helper to write staging data
async function writeStagingData(data: any[]): Promise<boolean> {
  try {
    await promisify(fs.writeFile)(stagingLogPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing staging data:", error);
    return false;
  }
}

// Export logs endpoint
router.get('/export', async (req, res) => {
  try {
    const exists = fs.existsSync(syncLogPath);
    
    if (!exists) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sync_import_log.csv');
    
    const fileStream = fs.createReadStream(syncLogPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error exporting logs:", error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

// Direct import endpoint
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const originalFilename = req.file.originalname;
    const fileContents = await promisify(fs.readFile)(filePath);
    
    // Generate SHA-256 hash
    const sha256Hash = calculateSHA256(fileContents);
    
    // Extract property ID from XML
    const propId = extractPropIdFromXML(fileContents.toString());
    
    // Log the import
    await logSync(originalFilename, propId, sha256Hash);
    
    // Return success response
    res.status(200).json({
      status: 'success',
      filename: originalFilename,
      prop_id: propId,
      sha256: sha256Hash,
      risk_flag: 'none'
    });
  } catch (error) {
    console.error("Error in import:", error);
    res.status(500).json({ error: 'Import failed' });
  }
});

// Stage upload endpoint
router.post('/stage', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const originalFilename = req.file.originalname;
    const fileContents = await promisify(fs.readFile)(filePath);
    
    // Generate SHA-256 hash
    const sha256Hash = calculateSHA256(fileContents);
    
    // Extract property ID from XML
    const propId = extractPropIdFromXML(fileContents.toString());
    
    // Generate upload ID
    const uploadId = uuidv4();
    
    // Add to staging data
    const stagingData = await getStagingData();
    
    stagingData.push({
      upload_id: uploadId,
      timestamp: new Date().toISOString(),
      filename: originalFilename,
      sha256: sha256Hash,
      prop_id: propId,
      status: 'PENDING',
      file_path: filePath
    });
    
    await writeStagingData(stagingData);
    
    // Return success response
    res.status(200).json({
      upload_id: uploadId,
      timestamp: new Date().toISOString(),
      filename: originalFilename,
      sha256: sha256Hash,
      prop_id: propId,
      status: 'PENDING'
    });
  } catch (error) {
    console.error("Error in staging:", error);
    res.status(500).json({ error: 'Staging failed' });
  }
});

// Get staging data endpoint
router.get('/staging-data', async (req, res) => {
  try {
    const stagingData = await getStagingData();
    
    // Filter out the file_path for security
    const safeData = stagingData.map(item => ({
      upload_id: item.upload_id,
      timestamp: item.timestamp,
      filename: item.filename,
      sha256: item.sha256,
      prop_id: item.prop_id,
      status: item.status
    }));
    
    res.json(safeData);
  } catch (error) {
    console.error("Error retrieving staging data:", error);
    res.status(500).json({ error: 'Failed to retrieve staging data' });
  }
});

// Get diff endpoint
router.get('/diff/:id', async (req, res) => {
  try {
    const uploadId = req.params.id;
    const stagingData = await getStagingData();
    
    const upload = stagingData.find(item => item.upload_id === uploadId);
    
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    
    // In a real implementation, this would compare the XML data with the current database values
    // For demo purposes, we'll generate mock diff data
    const diff = {
      prop_id: upload.prop_id,
      fields: [
        {
          field: 'land_value',
          current: 150000,
          proposed: 165000,
          delta: 15000
        },
        {
          field: 'building_value',
          current: 320000,
          proposed: 335000,
          delta: 15000
        },
        {
          field: 'tax_due',
          current: 4750,
          proposed: 5000,
          delta: 250
        }
      ]
    };
    
    res.json(diff);
  } catch (error) {
    console.error("Error generating diff:", error);
    res.status(500).json({ error: 'Failed to generate diff' });
  }
});

// Approve upload endpoint
router.post('/approve/:id', async (req, res) => {
  try {
    const uploadId = req.params.id;
    const stagingData = await getStagingData();
    
    const uploadIndex = stagingData.findIndex(item => item.upload_id === uploadId);
    
    if (uploadIndex === -1) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    
    const upload = stagingData[uploadIndex];
    
    // Update status to APPROVED
    stagingData[uploadIndex].status = 'APPROVED';
    
    await writeStagingData(stagingData);
    
    // Log to sync log
    await logSync(upload.filename, upload.prop_id, upload.sha256);
    
    res.json({
      status: 'success',
      message: 'Upload approved and processed'
    });
  } catch (error) {
    console.error("Error approving upload:", error);
    res.status(500).json({ error: 'Failed to approve upload' });
  }
});

export default router;