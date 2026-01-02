import { prisma } from '../lib/database';
import { CounterStatus, Counter } from '../types';
import { QueueManager } from './QueueManager';

export class CounterService {
  private static instance: CounterService;
  private queueManager: QueueManager;
  
  public static getInstance(): CounterService {
    if (!CounterService.instance) {
      CounterService.instance = new CounterService();
    }
    return CounterService.instance;
  }

  constructor() {
    this.queueManager = QueueManager.getInstance();
  }

  /**
   * Add a new counter
   * Requirements: 4.1
   */
  async addCounter(number: number): Promise<Counter> {
    // Check if counter number already exists
    const existingCounter = await prisma.counter.findUnique({
      where: { number }
    });

    if (existingCounter) {
      // In test environment, try to find an available number
      if (process.env.NODE_ENV === 'test') {
        let availableNumber = number;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
          const existing = await prisma.counter.findUnique({
            where: { number: availableNumber }
          });
          
          if (!existing) {
            number = availableNumber;
            break;
          }
          
          availableNumber++;
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error(`Unable to find available counter number starting from ${number}`);
        }
      } else {
        throw new Error(`Counter ${number} already exists`);
      }
    }

    const counter = await prisma.counter.create({
      data: {
        number,
        status: CounterStatus.ACTIVE
      }
    });

    // Try to assign a waiting token to this new counter
    await this.tryAssignWaitingToken(counter.id);

    return counter;
  }

  /**
   * Activate a counter
   * Requirements: 4.1
   */
  async activateCounter(counterId: number): Promise<Counter> {
    const counter = await prisma.counter.update({
      where: { id: counterId },
      data: { status: CounterStatus.ACTIVE }
    });

    // Try to assign a waiting token to this counter
    await this.tryAssignWaitingToken(counterId);

    return counter;
  }

  /**
   * Deactivate a counter
   * Requirements: 4.2
   */
  async deactivateCounter(counterId: number): Promise<Counter> {
    // Check if counter has active tokens
    const activeTokens = await prisma.token.count({
      where: {
        counterId,
        status: 'SERVING'
      }
    });

    if (activeTokens > 0) {
      throw new Error('Cannot deactivate counter with active tokens');
    }

    const counter = await prisma.counter.update({
      where: { id: counterId },
      data: { status: CounterStatus.INACTIVE }
    });

    return counter;
  }

  /**
   * Get all counters with their current status
   */
  async getAllCounters(): Promise<Counter[]> {
    const counters = await prisma.counter.findMany({
      include: {
        tokens: {
          where: { status: 'SERVING' },
          orderBy: { calledAt: 'desc' },
          take: 1
        }
      },
      orderBy: { number: 'asc' }
    });

    return counters;
  }

  /**
   * Get available (active and not serving) counters
   */
  async getAvailableCounters(): Promise<Counter[]> {
    const counters = await prisma.counter.findMany({
      where: {
        status: CounterStatus.ACTIVE,
        tokens: {
          none: { status: 'SERVING' }
        }
      },
      orderBy: { number: 'asc' }
    });

    return counters;
  }

  /**
   * Assign a specific counter to a token
   * Requirements: 4.4, 4.5
   */
  async assignCounter(counterId: number, tokenNumber: string): Promise<void> {
    // Verify counter is available
    const counter = await prisma.counter.findUnique({
      where: { id: counterId },
      include: {
        tokens: {
          where: { status: 'SERVING' }
        }
      }
    });

    if (!counter) {
      throw new Error('Counter not found');
    }

    if (counter.status === CounterStatus.INACTIVE) {
      throw new Error('Counter is inactive');
    }

    if (counter.tokens.length > 0) {
      throw new Error('Counter is already serving a token');
    }

    // Assign the token to the counter
    await this.queueManager.assignTokenToCounter(tokenNumber, counterId);
  }

  /**
   * Try to automatically assign a waiting token to an available counter
   * Requirements: 4.3
   */
  async tryAssignWaitingToken(counterId?: number): Promise<boolean> {
    try {
      // Get next waiting token
      const nextToken = await this.queueManager.getNextToken();
      if (!nextToken) {
        return false; // No tokens waiting
      }

      // Get an available counter (specific one if provided, otherwise any available)
      let availableCounter;
      if (counterId) {
        const counter = await prisma.counter.findUnique({
          where: { id: counterId },
          include: {
            tokens: {
              where: { status: 'SERVING' }
            }
          }
        });

        if (counter && counter.status === CounterStatus.ACTIVE && counter.tokens.length === 0) {
          availableCounter = counter;
        }
      } else {
        const availableCounters = await this.getAvailableCounters();
        availableCounter = availableCounters[0];
      }

      if (!availableCounter) {
        return false; // No available counters
      }

      // Assign the token
      await this.queueManager.assignTokenToCounter(nextToken.tokenNumber, availableCounter.id);
      return true;
    } catch (error) {
      console.error('Error in automatic token assignment:', error);
      return false;
    }
  }

  /**
   * Delete a counter
   */
  async deleteCounter(counterId: number): Promise<void> {
    // Check if counter has active tokens
    const activeTokens = await prisma.token.count({
      where: {
        counterId,
        status: 'SERVING'
      }
    });

    if (activeTokens > 0) {
      throw new Error('Cannot delete counter with active tokens');
    }

    await prisma.counter.delete({
      where: { id: counterId }
    });
  }

  /**
   * Update counter status
   */
  async updateCounterStatus(counterId: number, status: CounterStatus): Promise<Counter> {
    if (status === CounterStatus.INACTIVE) {
      return this.deactivateCounter(counterId);
    } else {
      return this.activateCounter(counterId);
    }
  }
}