// ============================================
// AI Analysis Schema - Validation
// ============================================

import { z } from 'zod';

// ==================== Analyze Error ====================

export const analyzeErrorSchema = {
    body: z.object({
        workflowId: z.string().uuid('Invalid workflow ID'),
        nodeId: z.string().min(1, 'Node ID is required'),
        errorMessage: z.string().min(1, 'Error message is required'),
        errorStack: z.string().optional(),
        executionData: z.record(z.unknown()).optional(),
    }),
};

export type AnalyzeErrorInput = z.infer<typeof analyzeErrorSchema.body>;

// ==================== Apply Fix ====================

export const applyFixSchema = {
    body: z.object({
        workflowId: z.string().uuid('Invalid workflow ID'),
        n8nWorkflowId: z.string().min(1, 'n8n workflow ID is required'),
        nodeId: z.string().min(1, 'Node ID is required'),
        fix: z.object({
            id: z.string(),
            type: z.enum(['parameter_change', 'header_add', 'auth_update', 'url_fix', 'body_fix']),
            path: z.string().optional(),
            value: z.unknown(),
        }),
    }),
};

export type ApplyFixInput = z.infer<typeof applyFixSchema.body>;

// ==================== Research API ====================

export const researchApiSchema = {
    body: z.object({
        serviceName: z.string().min(1, 'Service name is required'),
        endpoint: z.string().min(1, 'Endpoint is required'),
        errorMessage: z.string().optional(),
    }),
};

export type ResearchApiInput = z.infer<typeof researchApiSchema.body>;
