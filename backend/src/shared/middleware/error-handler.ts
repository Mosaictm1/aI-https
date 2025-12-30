// ============================================
// Error Handler Middleware
// ============================================

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

// ==================== Custom Error Classes ====================

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode = 500,
        code = 'INTERNAL_ERROR',
        isOperational = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400, 'BAD_REQUEST');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

export class ValidationError extends AppError {
    public readonly errors: Record<string, string[]>;

    constructor(message = 'Validation failed', errors: Record<string, string[]> = {}) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

// ==================== Error Response ====================

interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
        stack?: string;
    };
}

// ==================== Handler ====================

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): Response => {
    // Log the error
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
    });

    // Build response
    const response: ErrorResponse = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
        },
    };

    let statusCode = 500;

    // Handle known error types
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        response.error.code = err.code;
        response.error.message = err.message;

        if (err instanceof ValidationError) {
            response.error.details = err.errors;
        }
    } else if (err instanceof ZodError) {
        statusCode = 400;
        response.error.code = 'VALIDATION_ERROR';
        response.error.message = 'Validation failed';
        response.error.details = err.flatten().fieldErrors;
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle Prisma errors
        switch (err.code) {
            case 'P2002':
                statusCode = 409;
                response.error.code = 'CONFLICT';
                response.error.message = 'A record with this value already exists';
                break;
            case 'P2025':
                statusCode = 404;
                response.error.code = 'NOT_FOUND';
                response.error.message = 'Record not found';
                break;
            default:
                response.error.message = 'Database error';
        }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        response.error.code = 'VALIDATION_ERROR';
        response.error.message = 'Invalid data provided';
    }

    // Include stack trace in development
    if (env.isDevelopment) {
        response.error.stack = err.stack;
    }

    return res.status(statusCode).json(response);
};

// ==================== Not Found Handler ====================

export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): Response => {
    return res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
};

// ==================== Async Handler Wrapper ====================

type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<unknown>;

export const asyncHandler = (fn: AsyncHandler) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
