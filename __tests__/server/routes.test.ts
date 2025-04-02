import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';
import { DocumentType } from '../../shared/document-types';

// Mock document service
jest.mock('../../server/services/document-service', () => ({
  documentService: {
    extractDocumentFields: jest.fn(),
    findRelatedDocuments: jest.fn()
  }
}));

describe('API Routes', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll((done) => {
    if (server && server.close) {
      server.close(done);
    } else {
      done();
    }
  });

  // Test authentication bypass middleware
  test('Authentication bypass middleware works', async () => {
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('username', 'admin');
  });

  // Test workflow creation
  test('Can create new workflow', async () => {
    const mockWorkflow = {
      type: 'long_plat',
      title: 'Test Workflow',
      description: 'Created for testing',
    };

    const response = await request(app)
      .post('/api/workflows')
      .send(mockWorkflow);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', mockWorkflow.title);
    expect(response.body).toHaveProperty('type', mockWorkflow.type);
  });

  // Test workflow retrieval
  test('Can fetch workflows', async () => {
    const response = await request(app).get('/api/workflows');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // Test map layers retrieval
  test('Can fetch map layers', async () => {
    const response = await request(app).get('/api/map-layers');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // Test parcel number generation
  test('Can generate parcel numbers', async () => {
    const response = await request(app)
      .post('/api/parcel-numbers/generate')
      .send({ parentParcelId: '12345678', count: 2 });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });
  
  // Test OCR document field extraction
  test('Can extract fields from a document', async () => {
    // Mock the documentService.extractDocumentFields method
    jest.spyOn(storage, 'getDocument').mockResolvedValueOnce({
      id: 1,
      name: 'Test Document.pdf',
      type: 'deed',
      contentType: 'application/pdf',
      contentHash: 'abc123',
      storageKey: 'documents/abc123/Test_Document.pdf',
      classification: null,
      uploadedAt: new Date(),
      updatedAt: new Date(),
      workflowId: null
    });
    
    const mockFields = {
      fullText: 'Sample document text with parcel number 12345-6789',
      parcelNumbers: ['12345-6789'],
      legalDescription: 'Lot 7, Block 3',
      extractionConfidence: 0.85
    };
    
    // Mock the document service to return predefined field data
    const documentService = require('../../server/services/document-service').documentService;
    jest.spyOn(documentService, 'extractDocumentFields').mockResolvedValueOnce(mockFields);
    
    const response = await request(app).get('/api/documents/1/extract-fields');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('parcelNumbers');
    expect(response.body.parcelNumbers).toContain('12345-6789');
    expect(response.body).toHaveProperty('legalDescription');
    expect(response.body.extractionConfidence).toBeGreaterThan(0.8);
  });
  
  // Test finding related documents based on content similarity
  test('Can find related documents', async () => {
    // Mock the document service to return predefined related documents
    const documentService = require('../../server/services/document-service').documentService;
    jest.spyOn(documentService, 'findRelatedDocuments').mockResolvedValueOnce([
      {
        documentId: 2,
        name: 'Related Document.pdf',
        type: 'survey',
        similarityScore: 0.85
      }
    ]);
    
    const response = await request(app).get('/api/documents/1/related');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('documentId', 2);
    expect(response.body[0]).toHaveProperty('similarityScore');
    expect(response.body[0].similarityScore).toBeGreaterThan(0.8);
  });
  
  // Test handling of document not found errors
  test('Returns 404 when document not found for field extraction', async () => {
    // Mock the document service to return null (document not found)
    const documentService = require('../../server/services/document-service').documentService;
    jest.spyOn(documentService, 'extractDocumentFields').mockResolvedValueOnce(null);
    
    const response = await request(app).get('/api/documents/999/extract-fields');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('not found');
  });
});