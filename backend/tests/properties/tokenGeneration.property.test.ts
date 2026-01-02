import * as fc from 'fast-check';
import { QueueManager } from '../../src/services/QueueManager';
import { ServiceType, TokenWithDetails } from '../../src/types';
import { prisma } from '../../src/lib/database';

/**
 * Feature: swiftpost-backend, Property 1: Token Generation Consistency
 * **Validates: Requirements 1.1, 1.2, 1.4, 1.5**
 */
describe('Property Tests - Token Generation', () => {
  let queueManager: QueueManager;

  beforeAll(() => {
    queueManager = QueueManager.getInstance();
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

  describe('Token Format and Uniqueness Property', () => {
    it('should generate tokens with correct format and ensure uniqueness', async () => {
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
            fc.record({
              serviceType: fc.constantFrom(
                'Parcel Drop-off' as ServiceType,
                'Banking Services' as ServiceType,
                'General Inquiry' as ServiceType,
                'Document Verification' as ServiceType
              )
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (tokenRequests) => {
            const generatedTokens: TokenWithDetails[] = [];
            
            // Generate tokens sequentially to test uniqueness
            for (const request of tokenRequests) {
              const token = await queueManager.generateToken(request.serviceType);
              generatedTokens.push(token);
            }

            // Property 1: All tokens should follow correct format
            for (const token of generatedTokens) {
              const formatRegex = /^[PBGD]-\d{3}$/;
              expect(token.tokenNumber).toMatch(formatRegex);
              
              // Verify service prefix matches service type
              const expectedPrefix = {
                'Parcel Drop-off': 'P',
                'Banking Services': 'B', 
                'General Inquiry': 'G',
                'Document Verification': 'D'
              }[token.serviceType];
              
              expect(token.tokenNumber.charAt(0)).toBe(expectedPrefix);
            }

            // Property 2: All token numbers should be unique
            const tokenNumbers = generatedTokens.map(t => t.tokenNumber);
            const uniqueTokenNumbers = new Set(tokenNumbers);
            expect(uniqueTokenNumbers.size).toBe(tokenNumbers.length);

            // Property 3: Tokens should be sequential within service type
            const tokensByService = generatedTokens.reduce((acc, token) => {
              if (!acc[token.serviceType]) acc[token.serviceType] = [];
              acc[token.serviceType].push(token);
              return acc;
            }, {} as Record<ServiceType, TokenWithDetails[]>);

            for (const [serviceType, tokens] of Object.entries(tokensByService)) {
              const numbers = tokens.map(t => parseInt(t.tokenNumber.split('-')[1]));
              numbers.sort((a, b) => a - b);
              
              // Should be sequential starting from 1
              for (let i = 0; i < numbers.length; i++) {
                expect(numbers[i]).toBe(i + 1);
              }
            }

            // Property 4: All tokens should start with WAITING status
            for (const token of generatedTokens) {
              expect(token.status).toBe('WAITING');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Queue Position Calculation Property', () => {
    it('should calculate queue positions correctly', async () => {
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
            { minLength: 1, maxLength: 5 }
          ),
          async (serviceTypes) => {
            const tokens: TokenWithDetails[] = [];
            
            // Generate tokens for different service types
            for (const serviceType of serviceTypes) {
              const token = await queueManager.generateToken(serviceType);
              tokens.push(token);
            }

            // Property: Queue positions should be calculated correctly
            for (const token of tokens) {
              const calculatedPosition = await queueManager.calculateQueuePosition(token.tokenNumber);
              
              // Position should be positive
              expect(calculatedPosition).toBeGreaterThan(0);
              
              // Position should match the token's queue position
              expect(calculatedPosition).toBe(token.queuePosition);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});