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
    type NodeFixResult,
    type WorkflowBuildResult,
} from '../../shared/clients/manus.client.js';
import type {
    FixNodeInput,
    BuildWorkflowInput,
    ApplyFixInput,
} from './ai-analysis.schema.js';
import { logger } from '../../config/logger.js';

// Create manus client instance
const manusClient = createManusClient();

// Helper to ensure JSON compatibility with Prisma
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toJson = (value: unknown): any => JSON.parse(JSON.stringify(value));

// ==================== Fix Node ====================

export const fixNode = async (
    userId: string,
    input: FixNodeInput
): Promise<NodeFixResult & { analysisId: string }> => {
    const { workflowId, nodeId, errorMessage, applyFix } = input;

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

    // Check if it's an HTTP Request node
    const nodeTypeLower = node.type.toLowerCase();
    if (!nodeTypeLower.includes('httprequest') && !nodeTypeLower.includes('http')) {
        throw new BadRequestError('This feature only works with HTTP Request nodes');
    }

    // Get Manus client
    const manusClient = createManusClient();

    if (!manusClient.isConfigured()) {
        throw new BadRequestError('AI service not configured. Please add MANUS_API_KEY.');
    }

    // Get node parameters
    const parameters = node.parameters as Record<string, unknown>;
    const url = (parameters.url as string) || '';
    const method = (parameters.method as string) || 'GET';
    const headers = (parameters.headers as Record<string, string>) || {};
    const body = parameters.body;

    // Get decrypted API key for n8n access
    const n8nApiKey = decrypt(workflow.instance.apiKey);

    // Call Manus to fix the node with full n8n access
    logger.info(`Fixing node ${nodeId} in workflow ${workflowId} - sending to Manus AI`);

    const fixResult = await manusClient.fixNode({
        errorMessage,
        nodeType: node.type,
        nodeId: node.id,
        nodeName: node.name,
        url,
        method,
        headers,
        body,
        parameters,
        n8n: {
            instanceUrl: workflow.instance.url,
            apiKey: n8nApiKey,
            workflowId: workflow.n8nId,
        },
        workflowJson: workflow.nodes, // إرسال كل الـ nodes
    });


    // Try to save analysis to database (optional - don't block if fails)
    let analysisId = 'temp-' + Date.now();
    try {
        const savedAnalysis = await prisma.analysis.create({
            data: {
                workflowId,
                nodeId,
                nodeName: node.name,
                nodeType: node.type,
                errorMessage,
                analysis: toJson(fixResult),
                suggestions: toJson(fixResult.fix),
                status: fixResult.success ? 'COMPLETED' : 'FAILED',
            },
        });
        analysisId = savedAnalysis.id;

        // Apply fix if requested
        if (applyFix && fixResult.success && Object.keys(fixResult.fix).length > 0) {
            try {
                await applyNodeFix(userId, {
                    workflowId,
                    n8nWorkflowId: workflow.n8nId,
                    nodeId,
                    fix: fixResult.fix,
                });

                await prisma.analysis.update({
                    where: { id: savedAnalysis.id },
                    data: { status: 'APPLIED' },
                });
            } catch (error) {
                logger.error('Failed to apply fix:', error);
            }
        }
    } catch (dbError) {
        logger.warn('Failed to save analysis to database (table may not exist):', dbError);
    }

    return {
        analysisId,
        ...fixResult,
    };
};

// ==================== Build Workflow ====================

export const buildWorkflow = async (
    userId: string,
    input: BuildWorkflowInput
): Promise<WorkflowBuildResult & { workflowId?: string }> => {
    const { idea, services, additionalContext, instanceId, autoCreate } = input;

    // Get Manus client
    const manusClient = createManusClient();

    if (!manusClient.isConfigured()) {
        throw new BadRequestError('AI service not configured. Please add MANUS_API_KEY.');
    }

    // Build workflow using Manus with n8n access if available
    let n8nAccess;
    if (instanceId) {
        const instance = await prisma.instance.findFirst({
            where: { id: instanceId, userId },
        });
        if (instance) {
            n8nAccess = {
                instanceUrl: instance.url,
                apiKey: decrypt(instance.apiKey),
            };
        }
    }

    logger.info(`Building workflow from idea: ${idea.substring(0, 50)}...`);

    const buildResult = await manusClient.buildWorkflow({
        idea,
        services,
        additionalContext,
        n8n: n8nAccess,
    });


    let createdWorkflowId: string | undefined;

    // Auto-create in n8n if requested
    if (autoCreate && buildResult.success && instanceId) {
        try {
            const instance = await prisma.instance.findFirst({
                where: { id: instanceId, userId },
            });

            if (instance) {
                const apiKey = decrypt(instance.apiKey);
                const n8nClient = createN8nClient({
                    baseUrl: instance.url,
                    apiKey,
                });

                // Create workflow in n8n
                const createdWorkflow = await n8nClient.updateWorkflow(
                    'new', // This would need special handling
                    buildResult.workflow as any
                );

                createdWorkflowId = createdWorkflow.id;
                logger.info(`Created workflow ${createdWorkflowId} in n8n`);
            }
        } catch (error) {
            logger.error('Failed to create workflow in n8n:', error);
        }
    }

    return {
        ...buildResult,
        workflowId: createdWorkflowId,
    };
};

// ==================== Smart Build Workflow ====================

export const smartBuildWorkflow = async (
    userId: string,
    input: { idea: string; instanceId?: string }
) => {
    const { idea, instanceId } = input;

    // Build n8n access if instance provided
    let n8nAccess;
    if (instanceId) {
        const instance = await prisma.instance.findFirst({
            where: { id: instanceId, userId },
        });
        if (instance) {
            n8nAccess = {
                instanceUrl: instance.url,
                apiKey: decrypt(instance.apiKey),
            };
        }
    }

    logger.info(`🧠 Smart building workflow from idea: ${idea.substring(0, 50)}...`);

    const result = await manusClient.smartBuildWorkflow({
        idea,
        instanceId,
        n8n: n8nAccess,
    });

    return result;
};

// ==================== Apply Node Fix ====================

export const applyNodeFix = async (
    userId: string,
    input: ApplyFixInput
): Promise<{ success: boolean; message: string }> => {
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

    // Find the node
    const nodeIndex = n8nWorkflow.nodes.findIndex(n => n.id === nodeId);

    if (nodeIndex === -1) {
        throw new NotFoundError('Node not found in n8n workflow');
    }

    const currentNode = n8nWorkflow.nodes[nodeIndex];
    const currentParams = currentNode.parameters as Record<string, unknown>;

    // Apply fixes
    const updatedParams = { ...currentParams };

    if (fix.url) updatedParams.url = fix.url;
    if (fix.method) updatedParams.method = fix.method;
    if (fix.headers) {
        // Merge headers
        const existingHeaders = (currentParams.headers as Record<string, unknown>) || {};
        updatedParams.headers = { ...existingHeaders, ...fix.headers };
    }
    if (fix.body !== undefined) updatedParams.body = fix.body;
    if (fix.parameters) {
        // Merge parameters
        Object.assign(updatedParams, fix.parameters);
    }

    // Update the node
    n8nWorkflow.nodes[nodeIndex] = {
        ...currentNode,
        parameters: updatedParams,
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
            message: 'تم تطبيق الإصلاح بنجاح',
        };
    } catch (error) {
        throw new BadRequestError(
            `فشل في تطبيق الإصلاح: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
};

// ==================== Get Analysis History ====================

export const getAnalysisHistory = async (
    userId: string,
    workflowId?: string,
    limit = 20
) => {
    try {
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
                analysis: true,
                suggestions: true,
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
    } catch (error) {
        // Return empty array if table doesn't exist
        logger.warn('Failed to get analysis history (table may not exist):', error);
        return [];
    }
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

// ==================== Legacy exports for compatibility ====================

export const analyzeError = fixNode;
export const applyFix = applyNodeFix;
export const researchApi = async () => {
    throw new BadRequestError('Use /ai/fix-node or /ai/build-workflow instead');
};
