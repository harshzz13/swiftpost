import request from 'supertest';
import { app } from '../../src/index';

// Don't start the server in tests - just test the app
describe('Server Setup', () => {
  describe('Health Check', () => {
    it('should return 200 and success message', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'SwiftPost Backend is running'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('API Base Route', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'SwiftPost API v1.0'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Route /non-existent-route not found'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });
});