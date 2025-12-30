// ============================================
// Express Application Setup
// ============================================

import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import {
    errorHandler,
    notFoundHandler,
    defaultRateLimiter,
    requestLoggerWithSkip,
} from './shared/middleware/index.js';

// Import routers
import { authRouter } from './modules/auth/index.js';
import { usersRouter } from './modules/users/index.js';
import { instancesRouter } from './modules/instances/index.js';
import { workflowsRouter } from './modules/workflows/index.js';

// ==================== Create App ====================

export const createApp = (): Application => {
    const app = express();

    // ==================== Security Middleware ====================

    // Helmet for security headers
    app.use(helmet({
        contentSecurityPolicy: env.isProduction,
    }));

    // CORS
    app.use(cors({
        origin: env.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    }));

    // ==================== Body Parsing ====================

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // ==================== Rate Limiting ====================

    app.use(defaultRateLimiter);

    // ==================== Request Logging ====================

    app.use(requestLoggerWithSkip);

    // ==================== Health Check ====================

    app.get('/health', (_req, res) => {
        res.status(200).json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
            },
        });
    });

    // ==================== API Routes ====================

    // Auth routes
    app.use('/api/v1/auth', authRouter);

    // Users routes
    app.use('/api/v1/users', usersRouter);

    // Instances routes
    app.use('/api/v1/instances', instancesRouter);

    // Workflows routes
    app.use('/api/v1/workflows', workflowsRouter);

    // API info endpoint
    app.get('/api/v1', (_req, res) => {
        res.status(200).json({
            success: true,
            data: {
                name: 'AI-HTTP API',
                version: 'v1',
                description: 'مساعد HTTP الذكي لـ n8n',
                endpoints: {
                    auth: '/api/v1/auth',
                    users: '/api/v1/users',
                    instances: '/api/v1/instances',
                    workflows: '/api/v1/workflows',
                },
            },
        });
    });

    // ==================== Error Handling ====================

    // 404 handler
    app.use(notFoundHandler);

    // Global error handler
    app.use(errorHandler);

    return app;
};

export default createApp;
