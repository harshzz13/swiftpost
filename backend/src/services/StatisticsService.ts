import { prisma } from '../lib/database';
import { QueueStats, ServiceStats, HourlyStats } from '../types';

export class StatisticsService {
  private static instance: StatisticsService;
  
  public static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService();
    }
    return StatisticsService.instance;
  }

  /**
   * Get comprehensive queue statistics
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  async getQueueStatistics(): Promise<QueueStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalTokensToday,
      tokensInQueue,
      activeCounters,
      inactiveCounters,
      completedTokens
    ] = await Promise.all([
      // Total tokens issued today
      prisma.token.count({
        where: {
          createdAt: { gte: todayStart }
        }
      }),
      
      // Current tokens in queue
      prisma.token.count({
        where: { status: 'WAITING' }
      }),
      
      // Active counters
      prisma.counter.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Inactive counters
      prisma.counter.count({
        where: { status: 'INACTIVE' }
      }),
      
      // Completed tokens today for average calculation
      prisma.token.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: todayStart },
          calledAt: { not: null },
          completedAt: { not: null }
        },
        select: {
          createdAt: true,
          calledAt: true,
          completedAt: true
        }
      })
    ]);

    // Calculate average wait time (time from creation to being called)
    let averageWaitTime = 0;
    if (completedTokens.length > 0) {
      const totalWaitTime = completedTokens.reduce((sum: number, token: { createdAt: Date; calledAt: Date | null; completedAt: Date | null }) => {
        if (token.calledAt) {
          const waitTime = token.calledAt.getTime() - token.createdAt.getTime();
          return sum + waitTime;
        }
        return sum;
      }, 0);
      
      // Convert to minutes, round to 1 decimal place for more accuracy
      averageWaitTime = Math.round((totalWaitTime / completedTokens.length / 60000) * 10) / 10;
    }

    return {
      totalTokensToday,
      tokensInQueue,
      averageWaitTime,
      activeCounters,
      inactiveCounters
    };
  }

  /**
   * Get statistics by service type
   * Requirements: 5.1, 5.4
   */
  async getServiceStatistics(): Promise<ServiceStats[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const serviceStats = await prisma.token.groupBy({
      by: ['serviceType'],
      where: {
        createdAt: { gte: todayStart }
      },
      _count: {
        id: true
      }
    });

    const waitingByService = await prisma.token.groupBy({
      by: ['serviceType'],
      where: {
        status: 'WAITING'
      },
      _count: {
        id: true
      }
    });

    const completedByService = await prisma.token.groupBy({
      by: ['serviceType'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: todayStart }
      },
      _count: {
        id: true
      }
    });

    // Combine the statistics
    const serviceTypes = ['Parcel Drop-off', 'Banking Services', 'General Inquiry', 'Document Verification'];
    
    return serviceTypes.map(serviceType => {
      const total = serviceStats.find((s: { serviceType: string; _count: { id: number } }) => s.serviceType === serviceType)?._count.id || 0;
      const waiting = waitingByService.find((s: { serviceType: string; _count: { id: number } }) => s.serviceType === serviceType)?._count.id || 0;
      const completed = completedByService.find((s: { serviceType: string; _count: { id: number } }) => s.serviceType === serviceType)?._count.id || 0;
      const serving = total - waiting - completed;

      return {
        serviceType,
        totalToday: total,
        waiting,
        serving: Math.max(0, serving),
        completed
      };
    });
  }

  /**
   * Get hourly statistics for today
   * Requirements: 5.5
   */
  async getHourlyStatistics(): Promise<HourlyStats[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get tokens created each hour today
    const hourlyTokens = await prisma.$queryRaw<Array<{hour: number, count: bigint}>>`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as count
      FROM tokens 
      WHERE "createdAt" >= ${todayStart} AND "createdAt" <= ${todayEnd}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `;

    // Get tokens completed each hour today
    const hourlyCompleted = await prisma.$queryRaw<Array<{hour: number, count: bigint}>>`
      SELECT 
        EXTRACT(HOUR FROM "completedAt") as hour,
        COUNT(*) as count
      FROM tokens 
      WHERE "completedAt" >= ${todayStart} AND "completedAt" <= ${todayEnd}
      GROUP BY EXTRACT(HOUR FROM "completedAt")
      ORDER BY hour
    `;

    // Create hourly stats for all 24 hours
    const hourlyStats: HourlyStats[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const tokensCreated = hourlyTokens.find((h: { hour: number; count: bigint }) => h.hour === hour);
      const tokensCompleted = hourlyCompleted.find((h: { hour: number; count: bigint }) => h.hour === hour);
      
      hourlyStats.push({
        hour,
        tokensGenerated: tokensCreated ? Number(tokensCreated.count) : 0,
        tokensCompleted: tokensCompleted ? Number(tokensCompleted.count) : 0
      });
    }

    return hourlyStats;
  }

  /**
   * Get counter utilization statistics
   * Requirements: 5.3
   */
  async getCounterUtilization(): Promise<{
    totalCounters: number;
    activeCounters: number;
    busyCounters: number;
    utilizationRate: number;
  }> {
    const [totalCounters, activeCounters, busyCounters] = await Promise.all([
      prisma.counter.count(),
      prisma.counter.count({ where: { status: 'ACTIVE' } }),
      prisma.counter.count({
        where: {
          status: 'ACTIVE',
          tokens: {
            some: { status: 'SERVING' }
          }
        }
      })
    ]);

    const utilizationRate = activeCounters > 0 ? (busyCounters / activeCounters) * 100 : 0;

    return {
      totalCounters,
      activeCounters,
      busyCounters,
      utilizationRate: Math.round(utilizationRate * 100) / 100 // Round to 2 decimal places
    };
  }

  /**
   * Get real-time queue summary
   */
  async getQueueSummary(): Promise<{
    totalWaiting: number;
    totalServing: number;
    longestWaitTime: number;
    averageQueuePosition: number;
  }> {
    const [waitingTokens, servingTokens] = await Promise.all([
      prisma.token.findMany({
        where: { status: 'WAITING' },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.token.count({ where: { status: 'SERVING' } })
    ]);

    const totalWaiting = waitingTokens.length;
    const totalServing = servingTokens;

    let longestWaitTime = 0;
    if (waitingTokens.length > 0) {
      const oldestToken = waitingTokens[0];
      longestWaitTime = Math.round((Date.now() - oldestToken.createdAt.getTime()) / 60000); // Minutes
    }

    const averageQueuePosition = totalWaiting > 0 ? (totalWaiting + 1) / 2 : 0;

    return {
      totalWaiting,
      totalServing,
      longestWaitTime,
      averageQueuePosition: Math.round(averageQueuePosition * 100) / 100
    };
  }
}