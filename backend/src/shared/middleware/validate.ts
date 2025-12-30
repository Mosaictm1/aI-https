// ============================================
// Validation Middleware
// ============================================

import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error-handler.js';

// ==================== Types ====================

interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

// ==================== Middleware ====================

/**
 * Validate request against Zod schemas
 */
export const validate = (schemas: ValidationSchemas) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const errors: Record<string, string[]> = {};

            // Validate body
            if (schemas.body) {
                try {
                    req.body = await schemas.body.parseAsync(req.body);
                } catch (err) {
                    if (err instanceof ZodError) {
                        const fieldErrors = err.flatten().fieldErrors;
                        Object.entries(fieldErrors).forEach(([key, value]) => {
                            errors[`body.${key}`] = value as string[];
                        });
                    }
                }
            }

            // Validate query
            if (schemas.query) {
                try {
                    req.query = await schemas.query.parseAsync(req.query);
                } catch (err) {
                    if (err instanceof ZodError) {
                        const fieldErrors = err.flatten().fieldErrors;
                        Object.entries(fieldErrors).forEach(([key, value]) => {
                            errors[`query.${key}`] = value as string[];
                        });
                    }
                }
            }

            // Validate params
            if (schemas.params) {
                try {
                    req.params = await schemas.params.parseAsync(req.params);
                } catch (err) {
                    if (err instanceof ZodError) {
                        const fieldErrors = err.flatten().fieldErrors;
                        Object.entries(fieldErrors).forEach(([key, value]) => {
                            errors[`params.${key}`] = value as string[];
                        });
                    }
                }
            }

            // If there were any errors, throw ValidationError
            if (Object.keys(errors).length > 0) {
                throw new ValidationError('Validation failed', errors);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// ==================== Common Schemas ====================

export const paginationSchema = z.object({
    page: z
        .string()
        .optional()
        .transform(val => (val ? parseInt(val, 10) : 1))
        .pipe(z.number().min(1)),
    limit: z
        .string()
        .optional()
        .transform(val => (val ? parseInt(val, 10) : 20))
        .pipe(z.number().min(1).max(100)),
});

export const idParamSchema = z.object({
    id: z.string().cuid(),
});

export const emailSchema = z.string().email('Invalid email format').toLowerCase();

export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

export const urlSchema = z.string().url('Invalid URL format');

export const httpMethodSchema = z.enum([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS',
]);
