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

// ==================== Analyze Error ====================

export const analyzeError = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const result = await aiAnalysisService.analyzeError(userId, req.body);

        sendSuccess(res, result, 'Error analyzed successfully');
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

        sendSuccess(res, analyses, 'Analysis history retrieved');
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

        sendSuccess(res, analysis, 'Analysis retrieved');
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
        const result = await aiAnalysisService.applyFix(userId, req.body);

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
};

// ==================== Research API ====================

export const researchApi = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await aiAnalysisService.researchApi(req.body);

        sendSuccess(res, result, 'API research completed');
    } catch (error) {
        next(error);
    }
};
