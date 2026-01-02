import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SwiftPost Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API routes will be added here in future tasks
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SwiftPost API v1.0',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`SwiftPost Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, server, io };