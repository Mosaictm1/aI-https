// ============================================
// AI Analysis Controller - Route Handlers
// ============================================

import type { Request, Response, NextFunction } from 'express';
import * as aiAnalysisService from './ai-analysis.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

// ==================== Types ====================

interface AuthenticatedUser {
    id: string;
    email: string;
    sessionId: string;
    plan: string;
}

interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}

// ==================== Fix Node ====================

export const fixNode = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const result = await aiAnalysisService.fixNode(userId, req.body);

        sendSuccess(res, result, result.success
            ? 'تم تحليل المشكلة بنجاح'
            : 'فشل في تحليل المشكلة'
        );
    } catch (error) {
        next(error);
    }
};

// ==================== Build Workflow ====================

export const buildWorkflow = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const result = await aiAnalysisService.buildWorkflow(userId, req.body);

        sendSuccess(res, result, result.success
            ? 'تم بناء الـ Workflow بنجاح'
            : 'فشل في بناء الـ Workflow'
        );
    } catch (error) {
        next(error);
    }
};

// ==================== Apply Fix ====================

export const applyFix = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const result = await aiAnalysisService.applyNodeFix(userId, req.body);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ==================== Smart Build Workflow ====================

export const smartBuildWorkflow = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const result = await aiAnalysisService.smartBuildWorkflow(userId, req.body);

        sendSuccess(
            res,
            result,
            result.success
                ? 'تم بناء الـ Workflow بنجاح'
                : 'يرجى إدخال الـ API Keys للمتابعة'
        );
    } catch (error) {
        next(error);
    }
};

// ==================== Get Analysis History ====================

export const getAnalysisHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const { workflowId, limit } = req.query;

        const analyses = await aiAnalysisService.getAnalysisHistory(
            userId,
            workflowId as string | undefined,
            limit ? parseInt(limit as string, 10) : undefined
        );

        sendSuccess(res, analyses, 'تم جلب سجل التحليلات');
    } catch (error) {
        next(error);
    }
};

// ==================== Get Analysis By ID ====================

export const getAnalysis = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const { analysisId } = req.params;

        const analysis = await aiAnalysisService.getAnalysis(userId, analysisId);

        sendSuccess(res, analysis, 'تم جلب التحليل');
    } catch (error) {
        next(error);
    }
};

// ==================== Legacy: Analyze Error (maps to fixNode) ====================

export const analyzeError = fixNode;

// ==================== Legacy: Research API ====================

export const researchApi = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    sendSuccess(res, null, 'استخدم /ai/fix-node أو /ai/build-workflow بدلاً من هذا.');
};
