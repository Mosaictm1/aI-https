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

// ==================== Fix Node ====================

export const fixNodeSchema = {
    body: z.object({
        workflowId: z.string().cuid('Invalid workflow ID'),
        nodeId: z.string().min(1, 'Node ID is required'),
        errorMessage: z.string().min(1, 'Error message is required'),
        applyFix: z.boolean().optional().default(false),
    }),
};

export type FixNodeInput = z.infer<typeof fixNodeSchema.body>;

// ==================== Build Workflow ====================

export const buildWorkflowSchema = {
    body: z.object({
        idea: z.string().min(10, 'Please provide more details about your idea'),
        services: z.array(z.string()).optional(),
        additionalContext: z.string().optional(),
        instanceId: z.string().cuid('Invalid instance ID').optional(),
        autoCreate: z.boolean().optional().default(false),
    }),
};

export type BuildWorkflowInput = z.infer<typeof buildWorkflowSchema.body>;

// ==================== Apply Fix ====================

export const applyFixSchema = {
    body: z.object({
        workflowId: z.string().cuid('Invalid workflow ID'),
        n8nWorkflowId: z.string().min(1, 'n8n workflow ID is required'),
        nodeId: z.string().min(1, 'Node ID is required'),
        fix: z.object({
            url: z.string().optional(),
            method: z.string().optional(),
            headers: z.record(z.string()).optional(),
            body: z.unknown().optional(),
            parameters: z.record(z.unknown()).optional(),
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
