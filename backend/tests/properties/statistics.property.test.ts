import * as fc from 'fast-check';
import { QueueManager } from '../../src/services/QueueManager';
import { CounterService } from '../../src/services/CounterService';
import { StatisticsService } from '../../src/services/StatisticsService';
import { ServiceType, Counter, TokenWithDetails } from '../../src/types';
import { prisma } from '../../src/lib/database';

/**
 * Feature: swiftpost-backend, Property 6: Statistics Calculation Accuracy
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 */
describe('Property Tests - Statistics', () => {
  let queueManager: QueueManager;
  let counterService: CounterService;
  let statisticsService: StatisticsService;

  beforeAll(() => {
    queueManager = QueueManager.getInstance();
    counterService = CounterService.getInstance();
    statisticsService = StatisticsService.getInstance();
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

  describe('Queue Statistics Accuracy Property', () => {
    it('should calculate queue statistics accurately based on underlying data', async () => {
      // Skip test if database is not available
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
      } catch (error) {
        console.warn('Database not available, skipping property test');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            numCounters: fc.integer({ min: 1, max: 4 }),
            tokens: fc.array(
              fc.constantFrom(
                'Parcel Drop-off' as ServiceType,
                'Banking Services' as ServiceType,
                'General Inquiry' as ServiceType
              ),
              { minLength: 0, maxLength: 8 }
            )
          }),
          async ({ numCounters, tokens: tokenTypes }) => {
            // Create counters
            const counters: Counter[] = [];
            for (let i = 1; i <= numCounters; i++) {
              const counter = await counterService.addCounter(i);
              counters.push(counter);
            }

            // Generate tokens
            const tokens: TokenWithDetails[] = [];
            for (const serviceType of tokenTypes) {
              const token = await queueManager.generateToken(serviceType);
              tokens.push(token);
            }

            // Assign some tokens to counters and complete some
            let completedCount = 0;
            let servingCount = 0;
            
            for (let i = 0; i < Math.min(tokens.length, counters.length); i++) {
              const token = tokens[i];
              const counter = counters[i % counters.length];
              
              await queueManager.assignTokenToCounter(token.tokenNumber, counter.id);
              servingCount++;
              
              // Complete half of the assigned tokens
              if (i % 2 === 0) {
                await queueManager.completeToken(token.tokenNumber);
                servingCount--;
                completedCount++;
              }
            }

            const waitingCount = tokens.length - servingCount - completedCount;

            // Get statistics
            const stats = await statisticsService.getQueueStatistics();

            // Property: Statistics should accurately reflect the data
            expect(stats.totalTokensToday).toBe(tokens.length);
            expect(stats.tokensInQueue).toBe(waitingCount);
            expect(stats.activeCounters).toBe(numCounters);
            expect(stats.inactiveCounters).toBe(0);

            // Average wait time should be non-negative
            expect(stats.averageWaitTime).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Service Statistics Property', () => {
    it('should calculate service-specific statistics correctly', async () => {
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
            { minLength: 1, maxLength: 6 }
          ),
          async (serviceTypes) => {
            // Count tokens by service type
            const serviceTypeCounts = serviceTypes.reduce((acc, serviceType) => {
              acc[serviceType] = (acc[serviceType] || 0) + 1;
              return acc;
            }, {} as Record<ServiceType, number>);

            // Generate tokens
            for (const serviceType of serviceTypes) {
              await queueManager.generateToken(serviceType);
            }

            // Get service statistics
            const serviceStats = await statisticsService.getServiceStatistics();

            // Property: Service statistics should match actual token counts
            for (const stat of serviceStats) {
              const expectedCount = serviceTypeCounts[stat.serviceType as ServiceType] || 0;
              expect(stat.totalToday).toBe(expectedCount);
              
              // All tokens should be waiting initially
              expect(stat.waiting).toBe(expectedCount);
              expect(stat.serving).toBe(0);
              expect(stat.completed).toBe(0);
            }

            // Property: Total across all services should equal total tokens
            const totalFromServices = serviceStats.reduce((sum, stat) => sum + stat.totalToday, 0);
            expect(totalFromServices).toBe(serviceTypes.length);
          }
        ),
        { numRuns: 40 }
      );
    });
  });

  describe('Counter Utilization Property', () => {
    it('should calculate counter utilization correctly', async () => {
      // Skip test if database is not available
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
      } catch (error) {
        console.warn('Database not available, skipping property test');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            activeCounters: fc.integer({ min: 1, max: 4 }),
            inactiveCounters: fc.integer({ min: 0, max: 2 }),
            tokensToAssign: fc.integer({ min: 0, max: 3 })
          }),
          async ({ activeCounters, inactiveCounters, tokensToAssign }) => {
            // Create active counters
            const counters: Counter[] = [];
            for (let i = 1; i <= activeCounters; i++) {
              const counter = await counterService.addCounter(i);
              counters.push(counter);
            }

            // Create inactive counters
            for (let i = activeCounters + 1; i <= activeCounters + inactiveCounters; i++) {
              const counter = await counterService.addCounter(i);
              await counterService.deactivateCounter(counter.id);
            }

            // Generate and assign tokens
            const assignedTokens = Math.min(tokensToAssign, activeCounters);
            for (let i = 0; i < assignedTokens; i++) {
              const token = await queueManager.generateToken('General Inquiry');
              await queueManager.assignTokenToCounter(token.tokenNumber, counters[i].id);
            }

            // Get counter utilization
            const utilization = await statisticsService.getCounterUtilization();

            // Property: Utilization should match actual counter states
            expect(utilization.totalCounters).toBe(activeCounters + inactiveCounters);
            expect(utilization.activeCounters).toBe(activeCounters);
            expect(utilization.busyCounters).toBe(assignedTokens);

            const expectedUtilizationRate = activeCounters > 0 ? (assignedTokens / activeCounters) * 100 : 0;
            expect(utilization.utilizationRate).toBeCloseTo(expectedUtilizationRate, 2);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});