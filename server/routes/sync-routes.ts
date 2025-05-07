import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const router = Router();

// Configure multer for XML file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Only accept XML files
    if (file.mimetype === 'application/xml' || file.mimetype === 'text/xml' || path.extname(file.originalname).toLowerCase() === '.xml') {
      cb(null, true);
    } else {
      cb(new Error('Only XML files are allowed'));
    }
  }
});

// Set up log directory
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log file paths
const stagingLogPath = path.join(logDir, 'staging_area.csv');
const importLogPath = path.join(logDir, 'sync_import_log.csv');
const mockPacsPath = path.join(logDir, 'mock_pacs_data.csv');

// Helper function to create CSV files if they don't exist
function ensureLogFilesExist() {
  // Create staging log
  if (!fs.existsSync(stagingLogPath)) {
    fs.writeFileSync(
      stagingLogPath, 
      'upload_id,timestamp,filename,sha256,prop_id,status\n',
      'utf8'
    );
  }
  
  // Create import log
  if (!fs.existsSync(importLogPath)) {
    fs.writeFileSync(
      importLogPath, 
      'timestamp,filename,prop_id,sha256,risk\n',
      'utf8'
    );
  }
  
  // Create mock PACS data
  if (!fs.existsSync(mockPacsPath)) {
    fs.writeFileSync(
      mockPacsPath,
      'prop_id,land_value,building_value,tax_due\n' +
      '10001,50000,120000,3000\n' +
      '10002,60000,100000,2900\n' +
      '10003,75000,90000,3200\n',
      'utf8'
    );
  }
}

// Ensure log files exist
ensureLogFilesExist();

// Helper functions for working with property data
function extractPropIdFromXML(content: string): string | null {
  const propIdMatch = content.match(/<prop_id[^>]*>([^<]+)<\/prop_id>/i);
  if (propIdMatch && propIdMatch[1]) {
    return propIdMatch[1].trim();
  }
  return null;
}

function calculateSHA256(data: Buffer): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Import API endpoint - direct import
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileContent = fileBuffer.toString('utf8');
    const propId = extractPropIdFromXML(fileContent) || 'UNKNOWN';
    const sha256 = calculateSHA256(fileBuffer);
    const risk = propId === 'UNKNOWN' ? 'high' : 'none';
    
    // Log the import
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp},${req.file.originalname},${propId},${sha256},${risk}\n`;
    fs.appendFileSync(importLogPath, logEntry, 'utf8');
    
    return res.status(200).json({
      status: 'received',
      filename: req.file.originalname,
      prop_id: propId,
      sha256: sha256,
      risk_flag: risk
    });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ error: 'Failed to process the import' });
  }
});

// Stage API endpoint - for review before application
router.post('/stage', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileContent = fileBuffer.toString('utf8');
    const propId = extractPropIdFromXML(fileContent) || 'UNKNOWN';
    const sha256 = calculateSHA256(fileBuffer);
    
    // Generate a unique upload ID
    const crypto = require('crypto');
    const uploadId = crypto.randomUUID();
    
    // Log the staged upload
    const timestamp = new Date().toISOString();
    const logEntry = `${uploadId},${timestamp},${req.file.originalname},${sha256},${propId},PENDING\n`;
    fs.appendFileSync(stagingLogPath, logEntry, 'utf8');
    
    return res.status(200).json({
      upload_id: uploadId,
      timestamp: timestamp,
      filename: req.file.originalname,
      sha256: sha256,
      prop_id: propId,
      status: 'PENDING'
    });
  } catch (error) {
    console.error('Staging error:', error);
    return res.status(500).json({ error: 'Failed to stage the file' });
  }
});

// Get staged uploads endpoint
router.get('/staging-data', async (req, res) => {
  try {
    if (!fs.existsSync(stagingLogPath)) {
      return res.status(200).json([]);
    }
    
    const fileContent = fs.readFileSync(stagingLogPath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    // Skip header line and parse each record
    const stagedUploads = lines.slice(1).map(line => {
      const [upload_id, timestamp, filename, sha256, prop_id, status] = line.split(',');
      return {
        upload_id,
        timestamp,
        filename,
        sha256,
        prop_id,
        status
      };
    });
    
    return res.status(200).json(stagedUploads);
  } catch (error) {
    console.error('Error fetching staged uploads:', error);
    return res.status(500).json({ error: 'Failed to fetch staged uploads' });
  }
});

// Approve staged upload endpoint
router.post('/approve/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    if (!fs.existsSync(stagingLogPath)) {
      return res.status(404).json({ error: 'Staging file not found' });
    }
    
    const fileContent = fs.readFileSync(stagingLogPath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    const header = lines[0];
    const records = lines.slice(1);
    
    let found = false;
    const updatedRecords = records.map(line => {
      const [record_id, timestamp, filename, sha256, prop_id, status] = line.split(',');
      
      if (record_id === uploadId) {
        found = true;
        // Update status to APPROVED
        return `${record_id},${timestamp},${filename},${sha256},${prop_id},APPROVED`;
      }
      
      return line;
    });
    
    if (!found) {
      return res.status(404).json({ error: 'Upload ID not found' });
    }
    
    // Write updated records back to the file
    fs.writeFileSync(stagingLogPath, [header, ...updatedRecords].join('\n') + '\n', 'utf8');
    
    // Also log as an import with current timestamp
    const approvedRecord = updatedRecords.find(line => line.split(',')[0] === uploadId);
    if (approvedRecord) {
      const [, , filename, sha256, prop_id] = approvedRecord.split(',');
      const timestamp = new Date().toISOString();
      const risk = prop_id === 'UNKNOWN' ? 'high' : 'none';
      
      const importLogEntry = `${timestamp},${filename},${prop_id},${sha256},${risk}\n`;
      fs.appendFileSync(importLogPath, importLogEntry, 'utf8');
    }
    
    return res.status(200).json({ status: 'approved', upload_id: uploadId });
  } catch (error) {
    console.error('Error approving upload:', error);
    return res.status(500).json({ error: 'Failed to approve upload' });
  }
});

// Get diff for a staged upload
router.get('/diff/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    if (!fs.existsSync(stagingLogPath)) {
      return res.status(404).json({ error: 'Staging file not found' });
    }
    
    const stagingContent = fs.readFileSync(stagingLogPath, 'utf8');
    const stagingLines = stagingContent.split('\n').filter(line => line.trim() !== '');
    const stagingRecords = stagingLines.slice(1);
    
    // Find the record with the matching upload ID
    const targetRecord = stagingRecords.find(line => line.split(',')[0] === uploadId);
    if (!targetRecord) {
      return res.status(404).json({ error: 'Upload ID not found' });
    }
    
    const [, , , sha256, prop_id] = targetRecord.split(',');
    
    // Check if the prop_id exists in the mock PACS data
    if (!fs.existsSync(mockPacsPath)) {
      return res.status(404).json({ error: 'PACS data not found' });
    }
    
    const pacsContent = fs.readFileSync(mockPacsPath, 'utf8');
    const pacsLines = pacsContent.split('\n').filter(line => line.trim() !== '');
    const pacsRecords = pacsLines.slice(1);
    
    // Find the matching property record
    const propertyRecord = pacsRecords.find(line => line.split(',')[0] === prop_id);
    if (!propertyRecord) {
      return res.status(404).json({ error: `No current data for prop_id ${prop_id}` });
    }
    
    const [, current_land_value, current_building_value, current_tax_due] = propertyRecord.split(',');
    
    // Generate "proposed" values based on the SHA256 hash (for simulation)
    const proposed_land_value = parseInt(sha256.substring(0, 2), 16) * 1000;
    const proposed_building_value = parseInt(sha256.substring(2, 4), 16) * 1000;
    const proposed_tax_due = parseInt(sha256.substring(4, 6), 16) * 100;
    
    // Calculate deltas
    const land_value_delta = proposed_land_value - parseInt(current_land_value);
    const building_value_delta = proposed_building_value - parseInt(current_building_value);
    const tax_due_delta = proposed_tax_due - parseInt(current_tax_due);
    
    const diffResult = {
      prop_id,
      fields: [
        {
          field: 'land_value',
          current: parseInt(current_land_value),
          proposed: proposed_land_value,
          delta: land_value_delta
        },
        {
          field: 'building_value',
          current: parseInt(current_building_value),
          proposed: proposed_building_value,
          delta: building_value_delta
        },
        {
          field: 'tax_due',
          current: parseInt(current_tax_due),
          proposed: proposed_tax_due,
          delta: tax_due_delta
        }
      ]
    };
    
    return res.status(200).json(diffResult);
  } catch (error) {
    console.error('Error generating diff:', error);
    return res.status(500).json({ error: 'Failed to generate diff' });
  }
});

// Export logs endpoint
router.get('/export', async (req, res) => {
  try {
    if (!fs.existsSync(importLogPath)) {
      return res.status(404).json({ error: 'Import log file not found' });
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sync_import_log.csv');
    
    const fileStream = fs.createReadStream(importLogPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error exporting logs:', error);
    return res.status(500).json({ error: 'Failed to export logs' });
  }
});

// Function to initialize Python sync API servers
async function launchPythonSyncAPI() {
  try {
    // Check if Python is installed
    await execPromise('python --version');
    
    // Install required Python packages if needed
    await execPromise('pip install fastapi uvicorn');
    
    // Launch the Python API server in the background
    exec('uvicorn sync_import_api:app --reload --port 8000', (error, stdout, stderr) => {
      if (error) {
        console.error('Failed to start Python sync API:', error);
        return;
      }
      
      console.log('Python sync API server started on port 8000');
      console.log(stdout);
      
      if (stderr) {
        console.error('Python sync API stderr:', stderr);
      }
    });
    
    console.log('Launched Python sync API server');
  } catch (error) {
    console.error('Error launching Python sync API:', error);
  }
}

// Try to launch Python API if needed
// launchPythonSyncAPI();

export default router;