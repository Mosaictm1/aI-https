// ============================================
// Instances Validation Schemas
// ============================================

import { z } from 'zod';

// ==================== Create Instance ====================

export const createInstanceSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters')
        .trim(),
    url: z
        .string()
        .url('Invalid URL format')
        .refine(
            url => url.startsWith('http://') || url.startsWith('https://'),
            'URL must start with http:// or https://'
        ),
    apiKey: z.string().min(1, 'API key is required'),
});

export type CreateInstanceInput = z.infer<typeof createInstanceSchema>;

// ==================== Update Instance ====================

export const updateInstanceSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters')
        .trim()
        .optional(),
    url: z
        .string()
        .url('Invalid URL format')
        .optional(),
    apiKey: z.string().min(1).optional(),
});

export type UpdateInstanceInput = z.infer<typeof updateInstanceSchema>;

// ==================== ID Param ====================

export const instanceIdSchema = z.object({
    id: z.string().cuid('Invalid instance ID'),
});

export type InstanceIdParam = z.infer<typeof instanceIdSchema>;
