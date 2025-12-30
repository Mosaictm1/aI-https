// ============================================
// Response Helpers
// ============================================

import type { Response } from 'express';

// ==================== Types ====================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export interface PaginationParams {
    page: number;
    limit: number;
    total: number;
}

// ==================== Success Responses ====================

/**
 * Send a success response
 */
export const sendSuccess = <T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        data,
        message,
    };

    return res.status(statusCode).json(response);
};

/**
 * Send a success response with pagination
 */
export const sendPaginated = <T>(
    res: Response,
    data: T[],
    pagination: PaginationParams,
    message?: string
): Response => {
    const response: ApiResponse<T[]> = {
        success: true,
        data,
        message,
        meta: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: Math.ceil(pagination.total / pagination.limit),
        },
    };

    return res.status(200).json(response);
};

/**
 * Send a created response (201)
 */
export const sendCreated = <T>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
): Response => {
    return sendSuccess(res, data, message, 201);
};

/**
 * Send a no content response (204)
 */
export const sendNoContent = (res: Response): Response => {
    return res.status(204).send();
};

// ==================== Error Responses ====================

/**
 * Send an error response
 */
export const sendError = (
    res: Response,
    code: string,
    message: string,
    statusCode = 400,
    details?: unknown
): Response => {
    const response: ApiResponse = {
        success: false,
        error: {
            code,
            message,
            details,
        },
    };

    return res.status(statusCode).json(response);
};

/**
 * Send a bad request response (400)
 */
export const sendBadRequest = (
    res: Response,
    message = 'Bad request',
    details?: unknown
): Response => {
    return sendError(res, 'BAD_REQUEST', message, 400, details);
};

/**
 * Send an unauthorized response (401)
 */
export const sendUnauthorized = (
    res: Response,
    message = 'Unauthorized'
): Response => {
    return sendError(res, 'UNAUTHORIZED', message, 401);
};

/**
 * Send a forbidden response (403)
 */
export const sendForbidden = (
    res: Response,
    message = 'Forbidden'
): Response => {
    return sendError(res, 'FORBIDDEN', message, 403);
};

/**
 * Send a not found response (404)
 */
export const sendNotFound = (
    res: Response,
    message = 'Resource not found'
): Response => {
    return sendError(res, 'NOT_FOUND', message, 404);
};

/**
 * Send a conflict response (409)
 */
export const sendConflict = (
    res: Response,
    message = 'Resource already exists'
): Response => {
    return sendError(res, 'CONFLICT', message, 409);
};

/**
 * Send a rate limit response (429)
 */
export const sendRateLimited = (
    res: Response,
    message = 'Too many requests'
): Response => {
    return sendError(res, 'RATE_LIMITED', message, 429);
};

/**
 * Send an internal server error response (500)
 */
export const sendInternalError = (
    res: Response,
    message = 'Internal server error'
): Response => {
    return sendError(res, 'INTERNAL_ERROR', message, 500);
};
