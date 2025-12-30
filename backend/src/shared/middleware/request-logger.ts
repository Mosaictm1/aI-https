// ============================================
// Request Logger Middleware
// ============================================

import type { Request, Response, NextFunction } from 'express';
import { logRequest } from '../../config/logger.js';
import type { AuthenticatedRequest } from './auth.js';

// ==================== Middleware ====================

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const userId = (req as AuthenticatedRequest).user?.id;

        logRequest(
            req.method,
            req.originalUrl || req.url,
            res.statusCode,
            duration,
            userId
        );
    });

    next();
};

// ==================== Skip Paths ====================

const skipPaths = ['/health', '/favicon.ico'];

export const requestLoggerWithSkip = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (skipPaths.some(path => req.path.startsWith(path))) {
        return next();
    }

    requestLogger(req, res, next);
};
