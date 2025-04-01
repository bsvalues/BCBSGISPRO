import { 
  insertUserSchema, 
  insertWorkflowSchema, 
  insertWorkflowStateSchema,
  insertChecklistItemSchema,
  insertDocumentSchema,
  insertParcelSchema,
  WorkflowType
} from '../../shared/schema';

describe('Schema Validation', () => {
  // Test User schema validation
  describe('User Schema', () => {
    test('Valid user data passes validation', () => {
      const userData = {
        username: 'testuser',
        password: 'securepassword',
        fullName: 'Test User',
        email: 'user@example.com',
        department: 'IT',
        isAdmin: false,
        createdAt: new Date()
      };
      
      const result = insertUserSchema.safeParse(userData);
      expect(result.success).toBe(true);
    });
    
    test('Invalid user data fails validation', () => {
      const invalidUserData = {
        username: '', // Empty username
        password: 'pass', // Too short password
        email: 'invalid-email', // Invalid email format
      };
      
      const result = insertUserSchema.safeParse(invalidUserData);
      expect(result.success).toBe(false);
    });
  });
  
  // Test Workflow schema validation
  describe('Workflow Schema', () => {
    test('Valid workflow data passes validation', () => {
      const workflowData = {
        title: 'New Workflow',
        type: WorkflowType.LONG_PLAT,
        description: 'Test workflow description',
        userId: 1,
        status: 'in_progress'
      };
      
      const result = insertWorkflowSchema.safeParse(workflowData);
      expect(result.success).toBe(true);
    });
    
    test('Invalid workflow data fails validation', () => {
      const invalidWorkflowData = {
        title: '', // Empty title
        type: 'invalid_type', // Invalid workflow type
        userId: 'not-a-number', // userId should be a number
      };
      
      const result = insertWorkflowSchema.safeParse(invalidWorkflowData);
      expect(result.success).toBe(false);
    });
  });
  
  // Test WorkflowState schema validation
  describe('WorkflowState Schema', () => {
    test('Valid workflow state data passes validation', () => {
      const stateData = {
        currentStep: 1,
        data: JSON.stringify({ status: 'reviewing' })
      };
      
      const result = insertWorkflowStateSchema.safeParse(stateData);
      expect(result.success).toBe(true);
    });
  });
  
  // Test Document schema validation
  describe('Document Schema', () => {
    test('Valid document data passes validation', () => {
      const documentData = {
        name: 'Test Document.pdf',
        type: 'application/pdf',
        workflowId: 1,
        content: 'base64_encoded_content',
        uploadedAt: new Date()
      };
      
      const result = insertDocumentSchema.safeParse(documentData);
      expect(result.success).toBe(true);
    });
  });
  
  // Test Parcel schema validation
  describe('Parcel Schema', () => {
    test('Valid parcel data passes validation', () => {
      const parcelData = {
        parcelNumber: '12345678901',
        acres: 5.25,
        address: '123 Main St',
        ownerName: 'John Doe',
        propertyType: 'residential',
        latitude: 47.123456,
        longitude: -122.987654,
        workflowId: 1
      };
      
      const result = insertParcelSchema.safeParse(parcelData);
      expect(result.success).toBe(true);
    });
  });
});