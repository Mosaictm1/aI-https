// ============================================
// Workflows Controller - Routes
// ============================================

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
    asyncHandler,
} from '../../shared/middleware/error-handler.js';
import { authenticate, type AuthenticatedRequest } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as workflowsService from './workflows.service.js';
import {
    workflowIdSchema,
    listWorkflowsSchema,
} from './workflows.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== GET /workflows ====================

router.get(
    '/',
    validate({ query: listWorkflowsSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;

        const result = await workflowsService.getWorkflows(userId, req.query as any);

        return sendSuccess(res, result.data, undefined, 200);
    })
);

// ==================== GET /workflows/:id ====================

router.get(
    '/:id',
    validate({ params: workflowIdSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const { id: workflowId } = req.params;

        const workflow = await workflowsService.getWorkflow(userId, workflowId);

        return sendSuccess(res, workflow);
    })
);

// ==================== GET /workflows/:id/nodes ====================

router.get(
    '/:id/nodes',
    validate({ params: workflowIdSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const { id: workflowId } = req.params;

        const nodes = await workflowsService.getWorkflowNodes(userId, workflowId);

        return sendSuccess(res, nodes);
    })
);

// ==================== GET /workflows/:id/executions ====================

router.get(
    '/:id/executions',
    validate({ params: workflowIdSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const { id: workflowId } = req.params;
        const limit = parseInt(req.query.limit as string) || 20;

        const executions = await workflowsService.getWorkflowExecutions(userId, workflowId, limit);

        return sendSuccess(res, executions);
    })
);

// ==================== GET /workflows/:id/stats ====================

router.get(
    '/:id/stats',
    validate({ params: workflowIdSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const { id: workflowId } = req.params;

        const stats = await workflowsService.getWorkflowStats(userId, workflowId);

        return sendSuccess(res, stats);
    })
);

export default router;
