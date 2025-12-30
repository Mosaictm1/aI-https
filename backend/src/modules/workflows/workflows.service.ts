// ============================================
// Workflows Service - Business Logic
// ============================================

import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../shared/middleware/error-handler.js';
import type { ListWorkflowsQuery } from './workflows.schema.js';

// ==================== Get All Workflows ====================

export const getWorkflows = async (
    userId: string,
    query: ListWorkflowsQuery
) => {
    const { page, limit, active, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
        instance: { userId },
    };

    if (active !== undefined) {
        where.active = active;
    }

    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    // Get workflows with pagination
    const [workflows, total] = await Promise.all([
        prisma.workflow.findMany({
            where,
            select: {
                id: true,
                n8nId: true,
                name: true,
                active: true,
                tags: true,
                totalExecutions: true,
                successfulExecutions: true,
                createdAt: true,
                updatedAt: true,
                instance: {
                    select: {
                        id: true,
                        name: true,
                        url: true,
                    },
                },
            },
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        }),
        prisma.workflow.count({ where }),
    ]);

    return {
        data: workflows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// ==================== Get Workflow By ID ====================

export const getWorkflow = async (userId: string, workflowId: string) => {
    const workflow = await prisma.workflow.findFirst({
        where: {
            id: workflowId,
            instance: { userId },
        },
        select: {
            id: true,
            n8nId: true,
            name: true,
            active: true,
            nodes: true,
            connections: true,
            settings: true,
            tags: true,
            totalExecutions: true,
            successfulExecutions: true,
            createdAt: true,
            updatedAt: true,
            instance: {
                select: {
                    id: true,
                    name: true,
                    url: true,
                },
            },
        },
    });

    if (!workflow) {
        throw new NotFoundError('Workflow not found');
    }

    return workflow;
};

// ==================== Get Workflow Nodes ====================

export const getWorkflowNodes = async (userId: string, workflowId: string) => {
    const workflow = await prisma.workflow.findFirst({
        where: {
            id: workflowId,
            instance: { userId },
        },
        select: {
            nodes: true,
        },
    });

    if (!workflow) {
        throw new NotFoundError('Workflow not found');
    }

    // Parse nodes and return HTTP Request nodes with more detail
    const nodes = workflow.nodes as Array<{
        id: string;
        name: string;
        type: string;
        parameters: Record<string, unknown>;
        position: [number, number];
    }>;

    return nodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        isHttpRequest: node.type === 'n8n-nodes-base.httpRequest',
        parameters: node.type === 'n8n-nodes-base.httpRequest' ? node.parameters : undefined,
    }));
};

// ==================== Get Workflow Executions ====================

export const getWorkflowExecutions = async (
    userId: string,
    workflowId: string,
    limit = 20
) => {
    // Verify workflow belongs to user
    const workflow = await prisma.workflow.findFirst({
        where: {
            id: workflowId,
            instance: { userId },
        },
    });

    if (!workflow) {
        throw new NotFoundError('Workflow not found');
    }

    const executions = await prisma.execution.findMany({
        where: { workflowId },
        select: {
            id: true,
            n8nExecutionId: true,
            status: true,
            mode: true,
            startedAt: true,
            finishedAt: true,
            duration: true,
            error: true,
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
    });

    return executions;
};

// ==================== Get Workflow Stats ====================

export const getWorkflowStats = async (userId: string, workflowId: string) => {
    const workflow = await prisma.workflow.findFirst({
        where: {
            id: workflowId,
            instance: { userId },
        },
        select: {
            totalExecutions: true,
            successfulExecutions: true,
        },
    });

    if (!workflow) {
        throw new NotFoundError('Workflow not found');
    }

    const failedExecutions = await prisma.execution.count({
        where: {
            workflowId,
            status: 'FAILED',
        },
    });

    const recentExecutions = await prisma.execution.findMany({
        where: { workflowId },
        select: { status: true, startedAt: true },
        orderBy: { startedAt: 'desc' },
        take: 10,
    });

    return {
        totalExecutions: workflow.totalExecutions,
        successfulExecutions: workflow.successfulExecutions,
        failedExecutions,
        successRate: workflow.totalExecutions > 0
            ? (workflow.successfulExecutions / workflow.totalExecutions * 100).toFixed(1)
            : '0',
        recentExecutions,
    };
};
