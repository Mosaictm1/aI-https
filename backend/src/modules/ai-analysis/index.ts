// ============================================
// AI Analysis Module - Router & Exports
// ============================================

import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware/index.js';
import {
    analyzeErrorSchema,
    applyFixSchema,
    researchApiSchema,
} from './ai-analysis.schema.js';
import * as controller from './ai-analysis.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Routes ====================

/**
 * @route POST /api/v1/ai/analyze
 * @desc Analyze a workflow error using AI
 */
router.post(
    '/analyze',
    validate(analyzeErrorSchema),
    controller.analyzeError
);

/**
 * @route GET /api/v1/ai/history
 * @desc Get analysis history
 */
router.get('/history', controller.getAnalysisHistory);

/**
 * @route GET /api/v1/ai/analysis/:analysisId
 * @desc Get a specific analysis
 */
router.get('/analysis/:analysisId', controller.getAnalysis);

/**
 * @route POST /api/v1/ai/apply-fix
 * @desc Apply a suggested fix to a workflow node
 */
router.post(
    '/apply-fix',
    validate(applyFixSchema),
    controller.applyFix
);

/**
 * @route POST /api/v1/ai/research
 * @desc Research API documentation for a service
 */
router.post(
    '/research',
    validate(researchApiSchema),
    controller.researchApi
);

// ==================== Exports ====================

export { router as aiAnalysisRouter };
export * from './ai-analysis.service.js';
export * from './ai-analysis.schema.js';
