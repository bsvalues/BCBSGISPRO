import { storage } from '../../server/storage';
import { WorkflowType } from '../../shared/schema';

describe('Storage', () => {
  // User operations tests
  describe('User operations', () => {
    test('Can create and retrieve user', async () => {
      const newUser = await storage.createUser({
        username: 'testuser',
        password: 'password',
        fullName: 'Test User',
        email: 'test@example.com',
        department: 'Testing',
        isAdmin: false,
        createdAt: new Date()
      });
      
      expect(newUser).toHaveProperty('id');
      expect(newUser.username).toBe('testuser');
      
      const retrievedUser = await storage.getUser(newUser.id);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.username).toBe(newUser.username);
    });
    
    test('Can retrieve user by username', async () => {
      const user = await storage.getUserByUsername('testuser');
      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });
  });
  
  // Workflow operations tests
  describe('Workflow operations', () => {
    let workflowId: number;
    
    test('Can create workflow', async () => {
      const newWorkflow = await storage.createWorkflow({
        title: 'Test Workflow',
        type: WorkflowType.LONG_PLAT,
        description: 'Testing workflow',
        userId: 1,
        status: 'in_progress'
      });
      
      expect(newWorkflow).toHaveProperty('id');
      expect(newWorkflow.title).toBe('Test Workflow');
      workflowId = newWorkflow.id;
    });
    
    test('Can retrieve workflows', async () => {
      const workflows = await storage.getWorkflows(1);
      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBeGreaterThan(0);
      
      const workflow = await storage.getWorkflow(workflowId);
      expect(workflow).toBeDefined();
      expect(workflow?.title).toBe('Test Workflow');
    });
    
    test('Can update workflow state', async () => {
      const state = await storage.updateWorkflowState(workflowId, {
        currentStep: 2,
        data: JSON.stringify({ status: 'in_progress' })
      });
      
      expect(state).toHaveProperty('workflowId', workflowId);
      expect(state).toHaveProperty('currentStep', 2);
      
      const retrievedState = await storage.getWorkflowState(workflowId);
      expect(retrievedState).toBeDefined();
      expect(retrievedState?.currentStep).toBe(2);
    });
  });
  
  // Map operations tests
  describe('Map operations', () => {
    test('Can retrieve map layers', async () => {
      const layers = await storage.getMapLayers();
      expect(Array.isArray(layers)).toBe(true);
      expect(layers.length).toBeGreaterThan(0);
    });
  });
  
  // Parcel operations tests
  describe('Parcel operations', () => {
    test('Can generate parcel numbers', async () => {
      const count = 3;
      const parcels = await storage.generateParcelNumbers('12345678', count);
      expect(Array.isArray(parcels)).toBe(true);
      expect(parcels.length).toBe(count);
      
      // Check that parcel numbers follow expected format
      parcels.forEach(parcel => {
        expect(typeof parcel).toBe('string');
        expect(parcel.length).toBeGreaterThan(0);
      });
    });
  });
});