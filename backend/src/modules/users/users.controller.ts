// ============================================
// Users Controller - Routes
// ============================================

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
    asyncHandler,
} from '../../shared/middleware/error-handler.js';
import { authenticate, type AuthenticatedRequest } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { sendSuccess, sendNoContent } from '../../shared/utils/response.js';
import * as usersService from './users.service.js';
import { updateProfileSchema, changePasswordSchema } from './users.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== GET /users/profile ====================

router.get(
    '/profile',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;

        const profile = await usersService.getProfile(userId);

        return sendSuccess(res, profile);
    })
);

// ==================== PATCH /users/profile ====================

router.patch(
    '/profile',
    validate({ body: updateProfileSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;

        const profile = await usersService.updateProfile(userId, req.body);

        return sendSuccess(res, profile, 'Profile updated successfully');
    })
);

// ==================== POST /users/change-password ====================

router.post(
    '/change-password',
    validate({ body: changePasswordSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;

        await usersService.changePassword(userId, req.body);

        return sendSuccess(res, null, 'Password changed successfully');
    })
);

// ==================== GET /users/stats ====================

router.get(
    '/stats',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;

        const stats = await usersService.getUserStats(userId);

        return sendSuccess(res, stats);
    })
);

// ==================== DELETE /users/account ====================

router.delete(
    '/account',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;

        await usersService.deleteAccount(userId);

        return sendNoContent(res);
    })
);

export default router;
