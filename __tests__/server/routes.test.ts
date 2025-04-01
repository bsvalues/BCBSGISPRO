import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';

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
});