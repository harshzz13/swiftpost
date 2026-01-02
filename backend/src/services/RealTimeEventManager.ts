import { Server as SocketIOServer } from 'socket.io';
import { QueueStats, Token, Counter } from '../types';

export class RealTimeEventManager {
  private static instance: RealTimeEventManager;
  private io: SocketIOServer | null = null;
  
  public static getInstance(): RealTimeEventManager {
    if (!RealTimeEventManager.instance) {
      RealTimeEventManager.instance = new RealTimeEventManager();
    }
    return RealTimeEventManager.instance;
  }

  /**
   * Initialize the Socket.IO server instance
   */
  public setSocketInstance(io: SocketIOServer): void {
    this.io = io;
  }

  /**
   * Broadcast queue position updates to all connected clients
   * Requirements: 3.1, 3.2
   */
  public broadcastQueueUpdate(tokenNumber: string, newPosition: number, estimatedWait: number): void {
    if (!this.io) return;

    this.io.emit('queue-updated', {
      tokenNumber,
      newPosition,
      estimatedWait,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify specific customer that their token has been called
   * Requirements: 3.3
   */
  public notifyTokenCalled(tokenNumber: string, counterNumber: number): void {
    if (!this.io) return;

    // Broadcast to all clients - frontend can filter by token number
    this.io.emit('token-called', {
      tokenNumber,
      counterNumber,
      timestamp: new Date().toISOString()
    });

    // Also send a targeted notification to the specific token room
    this.io.to(`token-${tokenNumber}`).emit('your-token-called', {
      tokenNumber,
      counterNumber,
      message: `Your token ${tokenNumber} is now being served at Counter ${counterNumber}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast statistics updates to admin dashboard
   * Requirements: 3.1
   */
  public broadcastStatistics(stats: QueueStats): void {
    if (!this.io) return;

    this.io.emit('statistics-updated', {
      stats,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify counter status changes
   * Requirements: 3.1
   */
  public notifyCounterStatusChange(counterId: number, status: 'ACTIVE' | 'INACTIVE'): void {
    if (!this.io) return;

    this.io.emit('counter-status-changed', {
      counterId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast token generation event
   */
  public broadcastTokenGenerated(token: any, queueUpdate: QueueStats): void {
    if (!this.io) return;

    this.io.emit('tokenGenerated', {
      token,
      queueUpdate,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast token assignment to counter
   */
  public broadcastTokenCalled(token: Token, queueUpdate: QueueStats): void {
    if (!this.io) return;

    this.io.emit('tokenCalled', {
      token,
      queueUpdate,
      timestamp: new Date().toISOString()
    });

    // Notify the specific token
    if (token.counterId) {
      this.notifyTokenCalled(token.tokenNumber, token.counterId);
    }
  }

  /**
   * Broadcast token completion
   */
  public broadcastTokenCompleted(token: Token, queueUpdate: QueueStats): void {
    if (!this.io) return;

    this.io.emit('tokenCompleted', {
      token,
      queueUpdate,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast counter addition
   */
  public broadcastCounterAdded(counter: Counter): void {
    if (!this.io) return;

    this.io.emit('counterAdded', {
      counter,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast counter deletion
   */
  public broadcastCounterDeleted(counterId: number): void {
    if (!this.io) return;

    this.io.emit('counterDeleted', {
      counterId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle client connection
   */
  public handleConnection(socket: any): void {
    console.log(`Client connected: ${socket.id}`);
    
    // Join general updates room
    socket.join('queue-updates');
    
    // Handle token-specific subscriptions
    socket.on('subscribe-token', (tokenNumber: string) => {
      socket.join(`token-${tokenNumber}`);
      console.log(`Client ${socket.id} subscribed to token ${tokenNumber}`);
    });

    socket.on('unsubscribe-token', (tokenNumber: string) => {
      socket.leave(`token-${tokenNumber}`);
      console.log(`Client ${socket.id} unsubscribed from token ${tokenNumber}`);
    });
    
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  }

  /**
   * Get connection count for monitoring
   */
  public getConnectionCount(): number {
    if (!this.io) return 0;
    return this.io.engine.clientsCount;
  }
}