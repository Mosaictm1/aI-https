// ============================================
// Rate Limiter Middleware
// ============================================

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { env } from '../../config/env.js';

// ==================== Types ====================

interface RateLimitResult {
    success: false;
    error: {
        code: string;
        message: string;
        retryAfter: number;
    };
}

// ==================== Response Handler ====================

const rateLimitHandler = (_req: Request, res: Response): Response => {
    const response: RateLimitResult = {
        success: false,
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests, please try again later',
            retryAfter: Math.ceil(env.rateLimit.windowMs / 1000),
        },
    };

    return res.status(429).json(response);
};

// ==================== Key Generator ====================

const keyGenerator = (req: Request): string => {
    // Use user ID if authenticated, otherwise use IP
    const userId = (req as { user?: { id: string } }).user?.id;
    return userId || req.ip || 'unknown';
};

// ==================== Default Rate Limiter ====================

export const defaultRateLimiter = rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.maxRequests,
    message: 'Too many requests',
    handler: rateLimitHandler,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
});

// ==================== Auth Rate Limiter ====================

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    message: 'Too many authentication attempts',
    handler: rateLimitHandler,
    keyGenerator: req => req.ip || 'unknown',
    standardHeaders: true,
    legacyHeaders: false,
});

// ==================== API Rate Limiter ====================

export const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'API rate limit exceeded',
    handler: rateLimitHandler,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
});

// ==================== Strict Rate Limiter ====================

export const strictRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts per hour
    message: 'Rate limit exceeded',
    handler: rateLimitHandler,
    keyGenerator: req => req.ip || 'unknown',
    standardHeaders: true,
    legacyHeaders: false,
});

// ==================== Plan-based Rate Limiter ====================

const planLimits: Record<string, number> = {
    FREE: 100,
    PRO: 500,
    TEAM: 2000,
    ENTERPRISE: 10000,
};

export const planBasedRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: (req: Request): number => {
        const user = (req as { user?: { plan: string } }).user;
        const plan = user?.plan || 'FREE';
        return planLimits[plan] || planLimits.FREE;
    },
    message: 'Plan rate limit exceeded',
    handler: rateLimitHandler,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
});

// ==================== Redis Store (for production) ====================

// Note: In production, you should use a Redis store for rate limiting
// to work across multiple server instances. Example:
// import RedisStore from 'rate-limit-redis';
// store: new RedisStore({ client: redis })
