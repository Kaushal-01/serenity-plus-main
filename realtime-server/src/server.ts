/**
 * Socket.IO Server Setup
 * Configures Socket.IO with Redis adapter and event handlers
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createRedisPubSubClients } from './services/redis';
import { authMiddleware } from './middleware/auth';
import { registerChatHandlers } from './handlers/chat';
import { registerRoomHandlers } from './handlers/rooms';
import { registerPresenceHandlers } from './handlers/presence';
import { registerTypingHandlers } from './handlers/typing';
import { registerAudioRoomHandlers } from './handlers/audioRooms';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from './types/events';
import { logger } from './utils/logger';

export const createSocketServer = async (httpServer: HTTPServer): Promise<Server> => {
  // Parse allowed origins from environment
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

  // Create Socket.IO server
  const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  // Setup Redis adapter for horizontal scaling
  try {
    const { pubClient, subClient } = await createRedisPubSubClients();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Redis adapter configured for Socket.IO');
  } catch (error) {
    logger.error('Failed to setup Redis adapter', error);
    throw error;
  }

  // Apply authentication middleware
  io.use(authMiddleware);

  // Connection handler
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) => {
    const userId = socket.data.userId;
    const username = socket.data.username;

    logger.info(`Client connected: ${socket.id}`, { userId, username });

    // Register all event handlers
    registerChatHandlers(io, socket);
    registerRoomHandlers(io, socket);
    registerPresenceHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerAudioRoomHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}`, { userId, username, reason });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}`, { userId, error });
    });

    // Send reconnection success message
    socket.emit('reconnect_success', {
      message: 'Connected to realtime server',
      timestamp: Date.now(),
    });
  });

  // Global error handler
  io.on('error', (error) => {
    logger.error('Socket.IO server error', error);
  });

  logger.info('Socket.IO server created successfully');

  return io;
};
