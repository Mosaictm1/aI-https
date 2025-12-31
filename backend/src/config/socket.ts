// ============================================
// Socket.io Configuration - Real-time Features
// ============================================

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../shared/utils/jwt.js';
import { prisma } from './database.js';
import { env } from './env.js';
import { logger } from './logger.js';

// ==================== Types ====================

interface AuthenticatedSocket extends Socket {
    userId: string;
    sessionId: string;
}

interface SocketEventData {
    workflowId?: string;
    executionId?: string;
    status?: string;
    message?: string;
    data?: unknown;
}

// ==================== Socket Server Instance ====================

let io: SocketServer | null = null;

// ==================== Initialize Socket.io ====================

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
    io = new SocketServer(httpServer, {
        cors: {
            origin: env.allowedOrigins,
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // ==================== Authentication Middleware ====================

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token ||
                socket.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const payload = verifyAccessToken(token);
            if (!payload) {
                return next(new Error('Invalid or expired token'));
            }

            // Verify session exists
            const session = await prisma.session.findUnique({
                where: { id: payload.sessionId },
            });

            if (!session || session.expiresAt < new Date()) {
                return next(new Error('Session expired'));
            }

            // Attach user info to socket
            (socket as AuthenticatedSocket).userId = payload.userId;
            (socket as AuthenticatedSocket).sessionId = payload.sessionId;

            next();
        } catch (error) {
            logger.error('Socket authentication error:', error);
            next(new Error('Authentication failed'));
        }
    });

    // ==================== Connection Handler ====================

    io.on('connection', (socket: Socket) => {
        const authSocket = socket as AuthenticatedSocket;
        const userId = authSocket.userId;

        logger.info(`🔌 User connected: ${userId}`);

        // Join user's personal room for direct messages
        socket.join(`user:${userId}`);

        // ==================== Event Handlers ====================

        // Subscribe to workflow updates
        socket.on('subscribe:workflow', (workflowId: string) => {
            socket.join(`workflow:${workflowId}`);
            logger.debug(`User ${userId} subscribed to workflow ${workflowId}`);
        });

        // Unsubscribe from workflow updates
        socket.on('unsubscribe:workflow', (workflowId: string) => {
            socket.leave(`workflow:${workflowId}`);
            logger.debug(`User ${userId} unsubscribed from workflow ${workflowId}`);
        });

        // Subscribe to instance updates
        socket.on('subscribe:instance', (instanceId: string) => {
            socket.join(`instance:${instanceId}`);
            logger.debug(`User ${userId} subscribed to instance ${instanceId}`);
        });

        // Unsubscribe from instance updates
        socket.on('unsubscribe:instance', (instanceId: string) => {
            socket.leave(`instance:${instanceId}`);
            logger.debug(`User ${userId} unsubscribed from instance ${instanceId}`);
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            logger.info(`🔌 User disconnected: ${userId} (${reason})`);
        });

        // Handle errors
        socket.on('error', (error) => {
            logger.error(`Socket error for user ${userId}:`, error);
        });
    });

    logger.info('🔌 Socket.io initialized');
    return io;
};

// ==================== Emit Functions ====================

/**
 * Emit event to a specific user
 */
export const emitToUser = (
    userId: string,
    event: string,
    data: SocketEventData
): void => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
};

/**
 * Emit event to all subscribers of a workflow
 */
export const emitToWorkflow = (
    workflowId: string,
    event: string,
    data: SocketEventData
): void => {
    if (io) {
        io.to(`workflow:${workflowId}`).emit(event, data);
    }
};

/**
 * Emit event to all subscribers of an instance
 */
export const emitToInstance = (
    instanceId: string,
    event: string,
    data: SocketEventData
): void => {
    if (io) {
        io.to(`instance:${instanceId}`).emit(event, data);
    }
};

/**
 * Broadcast event to all connected clients
 */
export const broadcast = (event: string, data: SocketEventData): void => {
    if (io) {
        io.emit(event, data);
    }
};

// ==================== Event Types ====================

export const SocketEvents = {
    // Execution events
    EXECUTION_STARTED: 'execution:started',
    EXECUTION_PROGRESS: 'execution:progress',
    EXECUTION_COMPLETED: 'execution:completed',
    EXECUTION_FAILED: 'execution:failed',

    // Instance events
    INSTANCE_CONNECTED: 'instance:connected',
    INSTANCE_DISCONNECTED: 'instance:disconnected',
    INSTANCE_SYNCED: 'instance:synced',
    INSTANCE_ERROR: 'instance:error',

    // Workflow events
    WORKFLOW_UPDATED: 'workflow:updated',
    WORKFLOW_ACTIVATED: 'workflow:activated',
    WORKFLOW_DEACTIVATED: 'workflow:deactivated',

    // AI events
    AI_ANALYSIS_STARTED: 'ai:analysis:started',
    AI_ANALYSIS_COMPLETED: 'ai:analysis:completed',
    AI_FIX_APPLIED: 'ai:fix:applied',

    // Notification events
    NOTIFICATION: 'notification',
} as const;

// ==================== Get Socket Server ====================

export const getSocketServer = (): SocketServer | null => io;
