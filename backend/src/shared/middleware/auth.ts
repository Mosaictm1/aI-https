// ============================================
// Authentication Middleware
// ============================================

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from './error-handler.js';

// ==================== Types ====================

export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        sessionId: string;
        plan: string;
    };
}

// ==================== Auth Middleware ====================

/**
 * Require authentication
 */
export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Extract token
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            throw new UnauthorizedError('Access token is required');
        }

        // Verify token
        const payload = verifyAccessToken(token);

        if (!payload) {
            throw new UnauthorizedError('Invalid or expired access token');
        }

        // Verify session exists
        const session = await prisma.session.findUnique({
            where: { id: payload.sessionId },
            include: { user: true },
        });

        if (!session) {
            throw new UnauthorizedError('Session not found or expired');
        }

        if (session.expiresAt < new Date()) {
            // Delete expired session
            await prisma.session.delete({ where: { id: session.id } });
            throw new UnauthorizedError('Session expired');
        }

        // Attach user to request
        (req as AuthenticatedRequest).user = {
            id: session.user.id,
            email: session.user.email,
            sessionId: session.id,
            plan: session.user.plan,
        };

        next();
    } catch (error) {
        next(error);
    }
};

// ==================== Optional Auth ====================

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            return next();
        }

        const payload = verifyAccessToken(token);

        if (!payload) {
            return next();
        }

        const session = await prisma.session.findUnique({
            where: { id: payload.sessionId },
            include: { user: true },
        });

        if (session && session.expiresAt > new Date()) {
            (req as AuthenticatedRequest).user = {
                id: session.user.id,
                email: session.user.email,
                sessionId: session.id,
                plan: session.user.plan,
            };
        }

        next();
    } catch {
        next();
    }
};

// ==================== Plan Check ====================

/**
 * Require specific plan(s)
 */
export const requirePlan = (...plans: string[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = (req as AuthenticatedRequest).user;

        if (!user) {
            next(new UnauthorizedError('Authentication required'));
            return;
        }

        if (!plans.includes(user.plan)) {
            next(new ForbiddenError(`This feature requires ${plans.join(' or ')} plan`));
            return;
        }

        next();
    };
};

// ==================== API Key Auth ====================

/**
 * Authenticate via API key
 */
export const authenticateApiKey = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {
            throw new UnauthorizedError('API key is required');
        }

        const key = await prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: { user: true },
        });

        if (!key) {
            throw new UnauthorizedError('Invalid API key');
        }

        if (key.isRevoked) {
            throw new UnauthorizedError('API key has been revoked');
        }

        if (key.expiresAt && key.expiresAt < new Date()) {
            throw new UnauthorizedError('API key has expired');
        }

        // Update last used
        await prisma.apiKey.update({
            where: { id: key.id },
            data: { lastUsedAt: new Date() },
        });

        // Attach user to request
        (req as AuthenticatedRequest).user = {
            id: key.user.id,
            email: key.user.email,
            sessionId: key.id, // Using API key ID as session ID
            plan: key.user.plan,
        };

        next();
    } catch (error) {
        next(error);
    }
};

// ==================== Combined Auth ====================

/**
 * Accept either JWT or API key
 */
export const authenticateAny = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const hasApiKey = req.headers['x-api-key'];
    const hasBearer = req.headers.authorization?.startsWith('Bearer');

    if (hasApiKey) {
        return authenticateApiKey(req, res, next);
    }

    if (hasBearer) {
        return authenticate(req, res, next);
    }

    next(new UnauthorizedError('Authentication required'));
};
