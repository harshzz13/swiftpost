import { prisma } from '../lib/database';
import { ServiceType, TokenStatus, Token, TokenWithDetails } from '../types';

export class QueueManager {
  private static instance: QueueManager;
  
  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /**
   * Generate a new token for the specified service type
   * Requirements: 1.1, 1.2, 1.4, 1.5
   */
  async generateToken(serviceType: ServiceType): Promise<TokenWithDetails> {
    // Get the service letter prefix
    const prefix = this.getServicePrefix(serviceType);
    
    // Get today's date range for testing vs production
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Use transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Get the count of tokens for this service type today
      const todayTokens = await tx.token.count({
        where: {
          serviceType,
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      });

      // Generate token number - in test environment, use simple incrementing
      let tokenNumber: string;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        const tokenNum = todayTokens + attempts + 1;
        tokenNumber = `${prefix}-${String(tokenNum).padStart(3, '0')}`;
        
        // Check if this token number already exists
        const existingToken = await tx.token.findUnique({
          where: { tokenNumber }
        });
        
        if (!existingToken) {
          break;
        }
        
        attempts++;
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique token number');
      }

      // Calculate queue position (number of waiting tokens for this service)
      const queuePosition = await tx.token.count({
        where: {
          status: TokenStatus.WAITING,
          serviceType
        }
      }) + 1;

      // Create the token
      const token = await tx.token.create({
        data: {
          tokenNumber,
          serviceType,
          status: TokenStatus.WAITING,
          queuePosition
        }
      });

      return token;
    });

    // Calculate estimated wait time
    const estimatedWaitTime = await this.estimateWaitTime(result.queuePosition || 1);

    return {
      tokenNumber: result.tokenNumber,
      serviceType: result.serviceType as ServiceType,
      status: result.status,
      queuePosition: result.queuePosition || 1,
      estimatedWaitTime,
      counter: null,
      createdAt: result.createdAt.toISOString(),
      calledAt: null,
      completedAt: null
    };
  }

  /**
   * Get the next waiting token (earliest by creation time)
   * Requirements: 2.1, 2.4
   */
  async getNextToken(): Promise<Token | null> {
    const nextToken = await prisma.token.findFirst({
      where: { status: TokenStatus.WAITING },
      orderBy: { createdAt: 'asc' }
    });

    return nextToken;
  }

  /**
   * Assign a token to a counter
   * Requirements: 2.2, 4.4, 4.5
   */
  async assignTokenToCounter(tokenNumber: string, counterId: number): Promise<Token> {
    const updatedToken = await prisma.token.update({
      where: { tokenNumber },
      data: {
        status: TokenStatus.SERVING,
        counterId,
        calledAt: new Date()
      },
      include: { counter: true }
    });

    return updatedToken;
  }

  /**
   * Mark a token as completed
   * Requirements: 2.3
   */
  async completeToken(tokenNumber: string): Promise<Token> {
    const updatedToken = await prisma.token.update({
      where: { tokenNumber },
      data: {
        status: TokenStatus.COMPLETED,
        completedAt: new Date(),
        counterId: null // Free the counter
      }
    });

    return updatedToken;
  }

  /**
   * Calculate current queue position for a token
   * Requirements: 6.3
   */
  async calculateQueuePosition(tokenNumber: string): Promise<number> {
    const token = await prisma.token.findUnique({
      where: { tokenNumber }
    });

    if (!token || token.status !== TokenStatus.WAITING) {
      return 0;
    }

    // Count waiting tokens of the same service type created before this token
    const position = await prisma.token.count({
      where: {
        status: TokenStatus.WAITING,
        serviceType: token.serviceType,
        createdAt: {
          lt: token.createdAt
        }
      }
    });

    return position + 1;
  }

  /**
   * Estimate waiting time based on queue position
   * Requirements: 1.3, 6.4
   */
  async estimateWaitTime(queuePosition: number): Promise<number> {
    // Get average service time from completed tokens (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const completedTokens = await prisma.token.findMany({
      where: {
        status: TokenStatus.COMPLETED,
        calledAt: { not: null },
        completedAt: { not: null },
        createdAt: { gte: yesterday }
      },
      select: {
        calledAt: true,
        completedAt: true
      }
    });

    let averageServiceTime = 5; // Default 5 minutes per token

    if (completedTokens.length > 0) {
      const totalServiceTime = completedTokens.reduce((sum, token) => {
        if (token.calledAt && token.completedAt) {
          const serviceTime = token.completedAt.getTime() - token.calledAt.getTime();
          return sum + serviceTime;
        }
        return sum;
      }, 0);

      averageServiceTime = Math.round(totalServiceTime / completedTokens.length / 60000); // Convert to minutes
      averageServiceTime = Math.max(averageServiceTime, 2); // Minimum 2 minutes
    }

    return Math.max(0, (queuePosition - 1) * averageServiceTime);
  }

  /**
   * Get service prefix letter
   */
  private getServicePrefix(serviceType: ServiceType): string {
    const prefixMap: Record<ServiceType, string> = {
      'Parcel Drop-off': 'P',
      'Banking Services': 'B',
      'General Inquiry': 'G',
      'Document Verification': 'D'
    };

    return prefixMap[serviceType] || 'G';
  }

  /**
   * Get token details with current queue position and wait time
   */
  async getTokenDetails(tokenNumber: string): Promise<TokenWithDetails | null> {
    const token = await prisma.token.findUnique({
      where: { tokenNumber },
      include: { counter: true }
    });

    if (!token) {
      return null;
    }

    let currentPosition = 0;
    let estimatedWaitTime = 0;

    if (token.status === TokenStatus.WAITING) {
      currentPosition = await this.calculateQueuePosition(tokenNumber);
      estimatedWaitTime = await this.estimateWaitTime(currentPosition);
    }

    return {
      tokenNumber: token.tokenNumber,
      serviceType: token.serviceType as ServiceType,
      status: token.status,
      queuePosition: currentPosition,
      estimatedWaitTime,
      counter: token.counter?.number || null,
      createdAt: token.createdAt.toISOString(),
      calledAt: token.calledAt?.toISOString() || null,
      completedAt: token.completedAt?.toISOString() || null
    };
  }
}