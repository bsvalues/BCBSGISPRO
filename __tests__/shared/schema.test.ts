import { 
  workflows, 
  workflowEvents, 
  workflowStates,
  documents, 
  documentVersions,
  parcels,
  documentParcelLinks,
  mapLayers,
  checklistItems,
  users,
  insertUserSchema,
  insertWorkflowSchema,
  insertDocumentSchema,
  insertDocumentVersionSchema,
  insertParcelSchema,
  insertDocumentParcelLinkSchema,
  insertMapLayerSchema,
  insertChecklistItemSchema,
  insertWorkflowEventSchema,
  insertWorkflowStateSchema
} from '../../shared/schema';

describe('Schema Definitions', () => {
  test('Schema tables should be defined', () => {
    expect(workflows).toBeDefined();
    expect(workflowEvents).toBeDefined();
    expect(workflowStates).toBeDefined();
    expect(documents).toBeDefined();
    expect(documentVersions).toBeDefined();
    expect(parcels).toBeDefined();
    expect(documentParcelLinks).toBeDefined();
    expect(mapLayers).toBeDefined();
    expect(checklistItems).toBeDefined();
    expect(users).toBeDefined();
  });
  
  test('Insert schemas should be defined', () => {
    expect(insertUserSchema).toBeDefined();
    expect(insertWorkflowSchema).toBeDefined();
    expect(insertDocumentSchema).toBeDefined();
    expect(insertDocumentVersionSchema).toBeDefined();
    expect(insertParcelSchema).toBeDefined();
    expect(insertDocumentParcelLinkSchema).toBeDefined();
    expect(insertMapLayerSchema).toBeDefined();
    expect(insertChecklistItemSchema).toBeDefined();
    expect(insertWorkflowEventSchema).toBeDefined();
    expect(insertWorkflowStateSchema).toBeDefined();
  });
  
  test('Workflow insert schema should validate properly', () => {
    // Valid workflow data
    const validWorkflow = {
      name: 'Test Workflow',
      description: 'A workflow for testing',
      type: 'plat_review',
      userId: 1,
      status: 'in_progress'
    };
    
    // This should not throw
    const result = insertWorkflowSchema.parse(validWorkflow);
    expect(result).toEqual(validWorkflow);
    
    // Invalid workflow data (missing required fields)
    const invalidWorkflow = {
      description: 'A workflow for testing'
    };
    
    // This should throw
    expect(() => {
      insertWorkflowSchema.parse(invalidWorkflow);
    }).toThrow();
  });
  
  test('Document insert schema should validate properly', () => {
    // Valid document data
    const validDocument = {
      name: 'Test Document',
      type: 'plat_map',
      contentType: 'application/pdf',
      contentHash: 'test-hash-123',
      storageKey: 'test-key-123',
      content: 'Test content'
    };
    
    // This should not throw
    const result = insertDocumentSchema.parse(validDocument);
    expect(result).toEqual(validDocument);
    
    // Invalid document data (invalid type)
    const invalidDocument = {
      name: 'Test Document',
      type: 'invalid_type',
      contentType: 'application/pdf',
      contentHash: 'test-hash-123',
      storageKey: 'test-key-123',
      content: 'Test content'
    };
    
    // This should throw
    expect(() => {
      insertDocumentSchema.parse(invalidDocument);
    }).toThrow();
  });
});