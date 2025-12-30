// ============================================
// Auth Controller - Routes
// ============================================

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
    asyncHandler,
} from '../../shared/middleware/error-handler.js';
import { authenticate, type AuthenticatedRequest } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { authRateLimiter } from '../../shared/middleware/rate-limiter.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response.js';
import * as authService from './auth.service.js';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
} from './auth.schema.js';

const router = Router();

// ==================== POST /auth/register ====================

router.post(
    '/register',
    authRateLimiter,
    validate({ body: registerSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.register(req.body);

        return sendCreated(res, result, 'Registration successful');
    })
);

// ==================== POST /auth/login ====================

router.post(
    '/login',
    authRateLimiter,
    validate({ body: loginSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip;

        const result = await authService.login(req.body, userAgent, ipAddress);

        return sendSuccess(res, result, 'Login successful');
    })
);

// ==================== POST /auth/logout ====================

router.post(
    '/logout',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const { sessionId } = (req as AuthenticatedRequest).user;

        await authService.logout(sessionId);

        return sendNoContent(res);
    })
);

// ==================== POST /auth/logout-all ====================

router.post(
    '/logout-all',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;

        await authService.logoutAll(userId);

        return sendSuccess(res, null, 'All sessions logged out');
    })
);

// ==================== POST /auth/refresh ====================

router.post(
    '/refresh',
    validate({ body: refreshTokenSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const tokens = await authService.refreshToken(req.body);

        return sendSuccess(res, tokens, 'Token refreshed');
    })
);

// ==================== GET /auth/me ====================

router.get(
    '/me',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;

        const user = await authService.getCurrentUser(userId);

        return sendSuccess(res, user);
    })
);

export default router;
