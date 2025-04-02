import { storage } from '../../server/storage';
import { DocumentType } from '../../shared/document-types';

describe('Storage Interface', () => {
  // Test user operations
  test('User CRUD operations', async () => {
    // Create a test user
    const testUser = await storage.createUser({
      username: 'testuser',
      password: 'hashed_password_for_test',
      fullName: 'Test User',
      email: 'test@example.com',
      department: 'Testing',
      isAdmin: false
    });

    expect(testUser).toBeDefined();
    expect(testUser.username).toBe('testuser');
    
    // Get user by ID
    const retrievedUser = await storage.getUser(testUser.id);
    expect(retrievedUser).toBeDefined();
    expect(retrievedUser?.username).toBe('testuser');
    
    // Get user by username
    const userByUsername = await storage.getUserByUsername('testuser');
    expect(userByUsername).toBeDefined();
    expect(userByUsername?.id).toBe(testUser.id);
  });
  
  // Test workflow operations
  test('Workflow CRUD operations', async () => {
    // Create a test workflow
    const testWorkflow = await storage.createWorkflow({
      name: 'Test Workflow',
      description: 'A workflow for testing',
      type: 'plat_review',
      userId: 2, // Admin user ID from dev-login
      status: 'in_progress'
    });
    
    expect(testWorkflow).toBeDefined();
    expect(testWorkflow.name).toBe('Test Workflow');
    
    // Get workflow by ID
    const retrievedWorkflow = await storage.getWorkflow(testWorkflow.id);
    expect(retrievedWorkflow).toBeDefined();
    expect(retrievedWorkflow?.name).toBe('Test Workflow');
    
    // Get all workflows
    const workflows = await storage.getWorkflows(2);
    expect(workflows.length).toBeGreaterThan(0);
    expect(workflows.some(w => w.id === testWorkflow.id)).toBe(true);
  });
  
  // Test document operations
  test('Document operations', async () => {
    // Create a test document
    const testDocument = await storage.addDocument({
      name: 'Test Document',
      type: DocumentType.PLAT_MAP,
      contentType: 'application/pdf',
      contentHash: 'test-hash-123',
      storageKey: 'test-key-123',
      content: 'Test content'
    });
    
    expect(testDocument).toBeDefined();
    expect(testDocument.name).toBe('Test Document');
    
    // Get document by ID
    const retrievedDocument = await storage.getDocument(testDocument.id);
    expect(retrievedDocument).toBeDefined();
    expect(retrievedDocument?.name).toBe('Test Document');
    
    // Update document classification
    const updatedDocument = await storage.updateDocumentClassification(
      testDocument.id,
      {
        documentType: DocumentType.DEED,
        confidence: 0.95,
        wasManuallyClassified: true,
        classifiedAt: new Date().toISOString()
      }
    );
    
    expect(updatedDocument).toBeDefined();
    expect(updatedDocument.classification?.documentType).toBe(DocumentType.DEED);
  });
  
  // Test map layer operations
  test('Map layer operations', async () => {
    // Get all map layers
    const layers = await storage.getMapLayers();
    expect(layers.length).toBeGreaterThan(0);
    
    if (layers.length > 0) {
      const firstLayer = layers[0];
      
      // Update a map layer
      const updatedLayer = await storage.updateMapLayer(firstLayer.id, {
        visible: !firstLayer.visible,
        opacity: 0.75
      });
      
      expect(updatedLayer).toBeDefined();
      expect(updatedLayer.visible).toBe(!firstLayer.visible);
      expect(updatedLayer.opacity).toBe(0.75);
      
      // Get visible map layers
      const visibleLayers = await storage.getVisibleMapLayers();
      if (updatedLayer.visible) {
        expect(visibleLayers.some(l => l.id === updatedLayer.id)).toBe(true);
      } else {
        expect(visibleLayers.some(l => l.id === updatedLayer.id)).toBe(false);
      }
    }
  });
});