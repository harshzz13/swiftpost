import * as fc from 'fast-check';
import { QueueManager } from '../../src/services/QueueManager';
import { CounterService } from '../../src/services/CounterService';
import { ServiceType, TokenStatus, TokenWithDetails, Counter, Token } from '../../src/types';
import { prisma } from '../../src/lib/database';

/**
 * Feature: swiftpost-backend, Property 2: Queue Ordering Invariant
 * Feature: swiftpost-backend, Property 3: Token State Transition Correctness
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 4.4, 4.5, 6.3**
 */
describe('Property Tests - Queue Management', () => {
  let queueManager: QueueManager;
  let counterService: CounterService;

  beforeAll(() => {
    queueManager = QueueManager.getInstance();
    counterService = CounterService.getInstance();
  });

  beforeEach(async () => {
    // Clean up test data
    try {
      await prisma.token.deleteMany();
      await prisma.counter.deleteMany();
    } catch (error) {
      // Skip cleanup if database not available
    }
  });

  describe('Queue Ordering Property', () => {
    it('should maintain correct queue ordering based on creation time', async () => {
      // Skip test if database is not available
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
      } catch (error) {
        console.warn('Database not available, skipping property test');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(
              'Parcel Drop-off' as ServiceType,
              'Banking Services' as ServiceType,
              'General Inquiry' as ServiceType
            ),
            { minLength: 2, maxLength: 8 }
          ),
          async (serviceTypes) => {
            const tokens: TokenWithDetails[] = [];
            
            // Generate tokens with small delays to ensure different creation times
            for (let i = 0; i < serviceTypes.length; i++) {
              const token = await queueManager.generateToken(serviceTypes[i]);
              tokens.push(token);
              
              // Small delay to ensure different timestamps
              if (i < serviceTypes.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }

            // Property: Next token should always be the earliest waiting token
            let previousToken: Token | null = null;
            while (true) {
              const nextToken = await queueManager.getNextToken();
              if (!nextToken) break;

              // If this is not the first token, verify it was created after the previous one
              if (previousToken) {
                expect(nextToken.createdAt.getTime()).toBeGreaterThanOrEqual(
                  previousToken.createdAt.getTime()
                );
              }

              // Mark token as serving to remove it from queue
              await queueManager.assignTokenToCounter(nextToken.tokenNumber, 1);
              previousToken = nextToken;
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Token State Transition Property', () => {
    it('should handle token state transitions correctly', async () => {
      // Skip test if database is not available
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
      } catch (error) {
        console.warn('Database not available, skipping property test');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(
              'Parcel Drop-off' as ServiceType,
              'Banking Services' as ServiceType
            ),
            { minLength: 1, maxLength: 3 }
          ),
          async (serviceTypes) => {
            // Create a counter for testing
            const counter: Counter = await counterService.addCounter(1);

            const tokens: TokenWithDetails[] = [];
            
            // Generate tokens
            for (const serviceType of serviceTypes) {
              const token = await queueManager.generateToken(serviceType);
              tokens.push(token);
            }

            // Property: Token state transitions should be correct
            for (const token of tokens) {
              // Initial state should be WAITING
              let currentToken = await queueManager.getTokenDetails(token.tokenNumber);
              expect(currentToken?.status).toBe(TokenStatus.WAITING);

              // Assign to counter - should transition to SERVING
              await queueManager.assignTokenToCounter(token.tokenNumber, counter.id);
              currentToken = await queueManager.getTokenDetails(token.tokenNumber);
              expect(currentToken?.status).toBe(TokenStatus.SERVING);
              expect(currentToken?.counter).toBe(counter.number);

              // Complete token - should transition to COMPLETED
              await queueManager.completeToken(token.tokenNumber);
              currentToken = await queueManager.getTokenDetails(token.tokenNumber);
              expect(currentToken?.status).toBe(TokenStatus.COMPLETED);
              expect(currentToken?.counter).toBeNull(); // Counter should be freed
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Counter Assignment Property', () => {
    it('should handle counter assignments correctly', async () => {
      // Skip test if database is not available
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
      } catch (error) {
        console.warn('Database not available, skipping property test');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          fc.array(
            fc.constantFrom(
              'Parcel Drop-off' as ServiceType,
              'Banking Services' as ServiceType
            ),
            { minLength: 1, maxLength: 5 }
          ),
          async (numCounters, serviceTypes) => {
            // Create multiple counters
            const counters: Counter[] = [];
            for (let i = 1; i <= numCounters; i++) {
              const counter = await counterService.addCounter(i);
              counters.push(counter);
            }

            // Generate tokens
            const tokens: TokenWithDetails[] = [];
            for (const serviceType of serviceTypes) {
              const token = await queueManager.generateToken(serviceType);
              tokens.push(token);
            }

            // Property: Counter assignments should be tracked correctly
            const assignedCounters = new Set();
            
            for (let i = 0; i < Math.min(tokens.length, counters.length); i++) {
              const token = tokens[i];
              const counter = counters[i];
              
              // Assign token to counter
              await queueManager.assignTokenToCounter(token.tokenNumber, counter.id);
              assignedCounters.add(counter.id);
              
              // Verify assignment
              const tokenDetails = await queueManager.getTokenDetails(token.tokenNumber);
              expect(tokenDetails?.status).toBe(TokenStatus.SERVING);
              expect(tokenDetails?.counter).toBe(counter.number);
            }

            // Property: Completing tokens should free counters
            for (let i = 0; i < Math.min(tokens.length, counters.length); i++) {
              const token = tokens[i];
              
              await queueManager.completeToken(token.tokenNumber);
              
              const tokenDetails = await queueManager.getTokenDetails(token.tokenNumber);
              expect(tokenDetails?.status).toBe(TokenStatus.COMPLETED);
              expect(tokenDetails?.counter).toBeNull();
            }
          }
        ),
        { numRuns: 25 }
      );
    });
  });
});