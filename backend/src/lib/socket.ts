import { Server as SocketIOServer } from 'socket.io';
import { RealTimeEventManager } from '../services/RealTimeEventManager';

let io: SocketIOServer;

export const setSocketInstance = (socketInstance: SocketIOServer) => {
  io = socketInstance;
  
  // Initialize RealTimeEventManager with the socket instance
  const eventManager = RealTimeEventManager.getInstance();
  eventManager.setSocketInstance(socketInstance);
  
  // Set up connection handling
  socketInstance.on('connection', (socket) => {
    eventManager.handleConnection(socket);
  });
};

export const getSocketInstance = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO instance not initialized');
  }
  return io;
};