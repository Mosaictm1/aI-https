// ============================================
// Instances Controller - Routes
// ============================================

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
    asyncHandler,
} from '../../shared/middleware/error-handler.js';
import { authenticate, type AuthenticatedRequest } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response.js';
import * as instancesService from './instances.service.js';
import {
    createInstanceSchema,
    updateInstanceSchema,
    instanceIdSchema,
} from './instances.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== GET /instances ====================

router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;

        const instances = await instancesService.getInstances(userId);

        return sendSuccess(res, instances);
    })
);

// ==================== POST /instances ====================

router.post(
    '/',
    validate({ body: createInstanceSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;

        const instance = await instancesService.createInstance(userId, req.body);

        return sendCreated(res, instance, 'Instance created successfully');
    })
);

// ==================== GET /instances/:id ====================

router.get(
    '/:id',
    validate({ params: instanceIdSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const { id: instanceId } = req.params;

        const instance = await instancesService.getInstance(userId, instanceId);

        return sendSuccess(res, instance);
    })
);

// ==================== PATCH /instances/:id ====================

router.patch(
    '/:id',
    validate({ params: instanceIdSchema, body: updateInstanceSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const { id: instanceId } = req.params;

        const instance = await instancesService.updateInstance(userId, instanceId, req.body);

        return sendSuccess(res, instance, 'Instance updated successfully');
    })
);

// ==================== DELETE /instances/:id ====================

router.delete(
    '/:id',
    validate({ params: instanceIdSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const { id: instanceId } = req.params;

        await instancesService.deleteInstance(userId, instanceId);

        return sendNoContent(res);
    })
);

// ==================== POST /instances/:id/test ====================

router.post(
    '/:id/test',
    validate({ params: instanceIdSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const { id: instanceId } = req.params;

        const result = await instancesService.testInstanceConnection(userId, instanceId);

        return sendSuccess(res, result, result.success ? 'Connection successful' : 'Connection failed');
    })
);

// ==================== POST /instances/:id/sync ====================

router.post(
    '/:id/sync',
    validate({ params: instanceIdSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const { id: instanceId } = req.params;

        const result = await instancesService.syncWorkflows(userId, instanceId);

        return sendSuccess(res, result, `Synced ${result.synced} workflows`);
    })
);

export default router;
