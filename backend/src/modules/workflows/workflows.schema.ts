// ============================================
// Workflows Validation Schemas
// ============================================

import { z } from 'zod';

// ==================== Workflow ID Param ====================

export const workflowIdSchema = z.object({
    id: z.string().cuid('Invalid workflow ID'),
});

export const workflowInstanceIdSchema = z.object({
    instanceId: z.string().cuid('Invalid instance ID'),
    workflowId: z.string().cuid('Invalid workflow ID'),
});

// ==================== List Query ====================

export const listWorkflowsSchema = z.object({
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
    active: z
        .string()
        .optional()
        .transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    search: z.string().optional(),
});

export type ListWorkflowsQuery = z.infer<typeof listWorkflowsSchema>;
