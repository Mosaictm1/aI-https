// ============================================
// AI Analysis Service - Business Logic
// ============================================

import { prisma } from '../../config/database.js';
import { decrypt } from '../../shared/utils/encryption.js';
import { NotFoundError, BadRequestError } from '../../shared/middleware/error-handler.js';
import { createN8nClient } from '../../shared/clients/n8n.client.js';
import type { N8nNode } from '../../shared/clients/n8n.client.js';
import {
    createManusClient,
    type AnalysisResult,
    type ErrorContext
} from '../../shared/clients/manus.client.js';
import type { AnalyzeErrorInput, ApplyFixInput, ResearchApiInput } from './ai-analysis.schema.js';

// Helper to ensure JSON compatibility with Prisma
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toJson = (value: unknown): any => JSON.parse(JSON.stringify(value));

// ==================== Analyze Error ====================

export const analyzeError = async (
    userId: string,
    input: AnalyzeErrorInput
): Promise<AnalysisResult & { analysisId: string }> => {
    const { workflowId, nodeId, errorMessage, errorStack, executionData } = input;

    // Get workflow and verify ownership
    const workflow = await prisma.workflow.findFirst({
        where: {
            id: workflowId,
            instance: { userId },
        },
        include: {
            instance: true,
        },
    });

    if (!workflow) {
        throw new NotFoundError('Workflow not found');
    }

    // Find the node in the workflow
    const nodes = workflow.nodes as unknown as N8nNode[];
    const node = nodes.find(n => n.id === nodeId);

    if (!node) {
        throw new NotFoundError('Node not found in workflow');
    }

    // Build error context
    const context: ErrorContext = {
        workflowId: workflow.id,
        workflowName: workflow.name,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        nodeParameters: node.parameters,
        errorMessage,
        errorStack,
        executionData,
    };

    // Get AI analysis
    const manusClient = createManusClient();

    if (!manusClient.isConfigured()) {
        throw new BadRequestError('AI service not configured');
    }

    const analysis = await manusClient.analyzeError(context);

    // Save analysis to database
    const savedAnalysis = await prisma.analysis.create({
        data: {
            workflowId,
            nodeId,
            nodeName: node.name,
            nodeType: node.type,
            errorMessage,
            errorStack,
            analysis: toJson(analysis),
            suggestions: toJson(analysis.suggestions),
            status: 'COMPLETED',
        },
    });

    return {
        analysisId: savedAnalysis.id,
        ...analysis,
    };
};

// ==================== Get Analysis History ====================

export const getAnalysisHistory = async (
    userId: string,
    workflowId?: string,
    limit = 20
) => {
    const where: Record<string, unknown> = {
        workflow: {
            instance: { userId },
        },
    };

    if (workflowId) {
        where.workflowId = workflowId;
    }

    const analyses = await prisma.analysis.findMany({
        where,
        select: {
            id: true,
            nodeId: true,
            nodeName: true,
            nodeType: true,
            errorMessage: true,
            status: true,
            createdAt: true,
            workflow: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    return analyses;
};

// ==================== Get Analysis By ID ====================

export const getAnalysis = async (userId: string, analysisId: string) => {
    const analysis = await prisma.analysis.findFirst({
        where: {
            id: analysisId,
            workflow: {
                instance: { userId },
            },
        },
    });

    if (!analysis) {
        throw new NotFoundError('Analysis not found');
    }

    return analysis;
};

// ==================== Apply Fix ====================

export const applyFix = async (
    userId: string,
    input: ApplyFixInput
): Promise<{ success: boolean; message: string; updatedNode?: N8nNode }> => {
    const { workflowId, n8nWorkflowId, nodeId, fix } = input;

    // Get workflow and instance
    const workflow = await prisma.workflow.findFirst({
        where: {
            id: workflowId,
            instance: { userId },
        },
        include: {
            instance: true,
        },
    });

    if (!workflow) {
        throw new NotFoundError('Workflow not found');
    }

    // Get decrypted API key
    const apiKey = decrypt(workflow.instance.apiKey);

    // Create n8n client
    const n8nClient = createN8nClient({
        baseUrl: workflow.instance.url,
        apiKey,
    });

    // Get current workflow from n8n
    const n8nWorkflow = await n8nClient.getWorkflow(n8nWorkflowId);

    // Find and update the node
    const nodeIndex = n8nWorkflow.nodes.findIndex(n => n.id === nodeId);

    if (nodeIndex === -1) {
        throw new NotFoundError('Node not found in n8n workflow');
    }

    const currentNode = n8nWorkflow.nodes[nodeIndex];

    // Apply the fix based on type
    const updatedParameters = applyFixToParameters(
        currentNode.parameters,
        fix
    );

    // Update the node
    n8nWorkflow.nodes[nodeIndex] = {
        ...currentNode,
        parameters: updatedParameters,
    };

    // Push update to n8n
    try {
        const updatedWorkflow = await n8nClient.updateWorkflow(n8nWorkflowId, {
            nodes: n8nWorkflow.nodes,
        });

        // Update local database
        await prisma.workflow.update({
            where: { id: workflowId },
            data: {
                nodes: toJson(updatedWorkflow.nodes),
            },
        });

        return {
            success: true,
            message: 'Fix applied successfully',
            updatedNode: updatedWorkflow.nodes[nodeIndex],
        };
    } catch (error) {
        throw new BadRequestError(
            `Failed to apply fix: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
};

// ==================== Research API ====================

export const researchApi = async (
    input: ResearchApiInput
) => {
    const { serviceName, endpoint, errorMessage } = input;

    const manusClient = createManusClient();

    if (!manusClient.isConfigured()) {
        throw new BadRequestError('AI service not configured');
    }

    return manusClient.researchApi(
        serviceName,
        endpoint,
        errorMessage || 'Need API documentation'
    );
};

// ==================== Helper Functions ====================

function applyFixToParameters(
    parameters: Record<string, unknown>,
    fix: ApplyFixInput['fix']
): Record<string, unknown> {
    const updated = { ...parameters };

    if (!fix.path) {
        // Direct value assignment
        return fix.value as Record<string, unknown>;
    }

    // Navigate to the path and update
    const pathParts = fix.path.split('.');
    let current: Record<string, unknown> = updated;

    for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!(part in current)) {
            current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
    }

    const lastPart = pathParts[pathParts.length - 1];

    switch (fix.type) {
        case 'header_add':
            // Add to headers array or object
            if (lastPart === 'headers') {
                const headers = (current[lastPart] as Record<string, unknown>[] || []);
                headers.push(fix.value as Record<string, unknown>);
                current[lastPart] = headers;
            } else {
                current[lastPart] = fix.value;
            }
            break;

        case 'parameter_change':
        case 'url_fix':
        case 'body_fix':
        case 'auth_update':
        default:
            current[lastPart] = fix.value;
            break;
    }

    return updated;
}
