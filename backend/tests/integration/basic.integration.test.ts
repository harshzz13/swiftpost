import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/lib/database';

describe('Basic Integration Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    try {
      await prisma.token.deleteMany();
      await prisma.counter.deleteMany();
    } catch (error) {
      // Skip cleanup if database not available
    }
  });

  describe('Token Generation Flow', () => {
    it('should generate a token and retrieve its status', async () => {
      // Skip test if database is not available
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
      } catch (error) {
        console.warn('Database not available, skipping integration test');
        return;
      }

      // Generate a token
      const generateResponse = await request(app)
        .post('/api/tokens')
        .send({ serviceType: 'Parcel Drop-off' })
        .expect(201);

      expect(generateResponse.body.success).toBe(true);
      expect(generateResponse.body.data.tokenNumber).toMatch(/^P-\d{3}$/);
      expect(generateResponse.body.data.serviceType).toBe('Parcel Drop-off');

      const tokenNumber = generateResponse.body.data.tokenNumber;

      // Check token status
      const statusResponse = await request(app)
        .get(`/api/tokens/${tokenNumber}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.tokenNumber).toBe(tokenNumber);
      expect(statusResponse.body.data.status).toBe('WAITING');
    });

    it('should handle counter operations', async () => {
      // Skip test if database is not available
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
      } catch (error) {
        console.warn('Database not available, skipping integration test');
        return;
      }

      // Create a counter
      const counterResponse = await request(app)
        .post('/api/counters')
        .send({ number: 1 })
        .expect(201);

      expect(counterResponse.body.success).toBe(true);
      expect(counterResponse.body.data.number).toBe(1);
      expect(counterResponse.body.data.status).toBe('ACTIVE');

      // Get all counters
      const countersResponse = await request(app)
        .get('/api/counters')
        .expect(200);

      expect(countersResponse.body.success).toBe(true);
      expect(Array.isArray(countersResponse.body.data)).toBe(true);
      expect(countersResponse.body.data.length).toBe(1);
    });

    it('should get statistics', async () => {
      // Skip test if database is not available
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
      } catch (error) {
        console.warn('Database not available, skipping integration test');
        return;
      }

      const statsResponse = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data).toHaveProperty('totalTokensToday');
      expect(statsResponse.body.data).toHaveProperty('tokensInQueue');
      expect(statsResponse.body.data).toHaveProperty('averageWaitTime');
      expect(statsResponse.body.data).toHaveProperty('activeCounters');
      expect(statsResponse.body.data).toHaveProperty('inactiveCounters');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent token', async () => {
      const response = await request(app)
        .get('/api/tokens/INVALID-TOKEN')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token not found');
    });

    it('should return 400 for invalid service type', async () => {
      const response = await request(app)
        .post('/api/tokens')
        .send({ serviceType: 'Invalid Service' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid service type');
    });
  });
});