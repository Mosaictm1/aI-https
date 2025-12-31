// ============================================
// AI Analysis Module - Router & Exports
// ============================================

import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware/index.js';
import {
    fixNodeSchema,
    buildWorkflowSchema,
    applyFixSchema,
} from './ai-analysis.schema.js';
import * as controller from './ai-analysis.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Main Routes ====================

/**
 * @route POST /api/v1/ai/fix-node
 * @desc Fix a broken HTTP Request node using AI
 * @body { workflowId, nodeId, errorMessage, applyFix? }
 */
router.post(
    '/fix-node',
    validate(fixNodeSchema),
    controller.fixNode
);

/**
 * @route POST /api/v1/ai/build-workflow
 * @desc Build a workflow from user idea using AI
 * @body { idea, services?, additionalContext?, instanceId?, autoCreate? }
 */
router.post(
    '/build-workflow',
    validate(buildWorkflowSchema),
    controller.buildWorkflow
);

/**
 * @route POST /api/v1/ai/smart-build
 * @desc Smart build workflow: research + build + credentials form
 * @body { idea, instanceId? }
 */
router.post(
    '/smart-build',
    controller.smartBuildWorkflow
);

/**
 * @route POST /api/v1/ai/apply-fix
 * @desc Apply a suggested fix to a workflow node
 * @body { workflowId, n8nWorkflowId, nodeId, fix }
 */
router.post(
    '/apply-fix',
    validate(applyFixSchema),
    controller.applyFix
);

// ==================== History Routes ====================

/**
 * @route GET /api/v1/ai/history
 * @desc Get AI analysis history
 */
router.get('/history', controller.getAnalysisHistory);

/**
 * @route GET /api/v1/ai/analysis/:analysisId
 * @desc Get a specific analysis
 */
router.get('/analysis/:analysisId', controller.getAnalysis);

// ==================== Legacy Routes (for compatibility) ====================

router.post('/analyze', validate(fixNodeSchema), controller.analyzeError);
router.post('/research', controller.researchApi);

// ==================== Exports ====================

export { router as aiAnalysisRouter };
export * from './ai-analysis.service.js';
export * from './ai-analysis.schema.js';
