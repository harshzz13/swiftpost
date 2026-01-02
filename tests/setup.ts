import { prisma } from '../src/lib/database';

// Global test setup
beforeAll(async () => {
  // Only connect if database is available
  try {
    await prisma.$connect();
  } catch (error) {
    console.warn('Database not available for tests, skipping database-dependent tests');
  }
});

afterAll(async () => {
  // Clean up and disconnect
  try {
    await prisma.$disconnect();
  } catch (error) {
    // Ignore disconnect errors
  }
});

// Clean database between tests (only if connected)
beforeEach(async () => {
  try {
    // Clean up test data
    await prisma.token.deleteMany();
    await prisma.counter.deleteMany();
  } catch (error) {
    // Skip cleanup if database not available
  }
});