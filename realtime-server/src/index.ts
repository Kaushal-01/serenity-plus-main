/**
 * Realtime Server Entry Point
 * Initializes Express, Socket.IO, MongoDB, and Redis
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { createSocketServer } from './server';
import { connectMongoDB, disconnectMongoDB } from './services/mongodb';
import { connectRedis, disconnectRedis } from './services/redis';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // Create Express app
    const app = express();

    // Middleware
    app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    }));
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Status endpoint
    app.get('/status', (_req, res) => {
      res.json({
        service: 'Serenity Realtime Server',
        version: '1.0.0',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    });

    // Create HTTP server
    const httpServer = createServer(app);

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectMongoDB();

    // Connect to Redis
    logger.info('Connecting to Redis...');
    await connectRedis();

    // Create Socket.IO server
    logger.info('Creating Socket.IO server...');
    await createSocketServer(httpServer);

    // Start listening
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Realtime server started on port ${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Socket.IO endpoint: ws://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      httpServer.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectMongoDB();
          await disconnectRedis();
          logger.info('All connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
startServer();
