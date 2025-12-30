// ============================================
// Instances Service - Business Logic
// ============================================

import axios from 'axios';
import { prisma } from '../../config/database.js';
import { encrypt, decrypt } from '../../shared/utils/encryption.js';
import {
    NotFoundError,
    BadRequestError,
    ConflictError,
} from '../../shared/middleware/error-handler.js';
import type { CreateInstanceInput, UpdateInstanceInput } from './instances.schema.js';

// ==================== Types ====================

// Helper to ensure JSON compatibility with Prisma
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toJson = (value: unknown): any => JSON.parse(JSON.stringify(value));

// ==================== Create Instance ====================

export const createInstance = async (
    userId: string,
    input: CreateInstanceInput
) => {
    const { name, url, apiKey } = input;

    // Normalize URL (remove trailing slash)
    const normalizedUrl = url.replace(/\/+$/, '');

    // Check if instance with same URL already exists for user
    const existingInstance = await prisma.instance.findUnique({
        where: {
            userId_url: {
                userId,
                url: normalizedUrl,
            },
        },
    });

    if (existingInstance) {
        throw new ConflictError('Instance with this URL already exists');
    }

    // Test connection before saving
    const connectionResult = await testConnection(normalizedUrl, apiKey);

    if (!connectionResult.success) {
        throw new BadRequestError(`Failed to connect: ${connectionResult.error}`);
    }

    // Encrypt API key
    const encryptedApiKey = encrypt(apiKey);

    // Create instance
    const instance = await prisma.instance.create({
        data: {
            userId,
            name,
            url: normalizedUrl,
            apiKey: encryptedApiKey,
            status: 'CONNECTED',
            version: connectionResult.version,
            lastSync: new Date(),
        },
        select: {
            id: true,
            name: true,
            url: true,
            status: true,
            version: true,
            lastSync: true,
            createdAt: true,
        },
    });

    return instance;
};

// ==================== Get All Instances ====================

export const getInstances = async (userId: string) => {
    const instances = await prisma.instance.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            url: true,
            status: true,
            version: true,
            lastSync: true,
            lastError: true,
            createdAt: true,
            _count: {
                select: { workflows: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return instances;
};

// ==================== Get Instance By ID ====================

export const getInstance = async (userId: string, instanceId: string) => {
    const instance = await prisma.instance.findFirst({
        where: {
            id: instanceId,
            userId,
        },
        select: {
            id: true,
            name: true,
            url: true,
            status: true,
            version: true,
            lastSync: true,
            lastError: true,
            createdAt: true,
            updatedAt: true,
            workflows: {
                select: {
                    id: true,
                    name: true,
                    active: true,
                    n8nId: true,
                    totalExecutions: true,
                    successfulExecutions: true,
                },
                orderBy: { name: 'asc' },
            },
        },
    });

    if (!instance) {
        throw new NotFoundError('Instance not found');
    }

    return instance;
};

// ==================== Update Instance ====================

export const updateInstance = async (
    userId: string,
    instanceId: string,
    input: UpdateInstanceInput
) => {
    // Check if instance exists and belongs to user
    const existingInstance = await prisma.instance.findFirst({
        where: { id: instanceId, userId },
    });

    if (!existingInstance) {
        throw new NotFoundError('Instance not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (input.name) {
        updateData.name = input.name;
    }

    if (input.url) {
        updateData.url = input.url.replace(/\/+$/, '');
    }

    if (input.apiKey) {
        updateData.apiKey = encrypt(input.apiKey);
    }

    // Update instance
    const instance = await prisma.instance.update({
        where: { id: instanceId },
        data: updateData,
        select: {
            id: true,
            name: true,
            url: true,
            status: true,
            version: true,
            lastSync: true,
            updatedAt: true,
        },
    });

    return instance;
};

// ==================== Delete Instance ====================

export const deleteInstance = async (
    userId: string,
    instanceId: string
): Promise<void> => {
    // Check if instance exists and belongs to user
    const instance = await prisma.instance.findFirst({
        where: { id: instanceId, userId },
    });

    if (!instance) {
        throw new NotFoundError('Instance not found');
    }

    // Delete instance (cascade will handle workflows)
    await prisma.instance.delete({
        where: { id: instanceId },
    });
};

// ==================== Test Connection ====================

export const testConnection = async (
    url: string,
    apiKey: string
): Promise<{ success: boolean; version?: string; error?: string }> => {
    try {
        await axios.get(`${url}/api/v1/workflows`, {
            headers: {
                'X-N8N-API-KEY': apiKey,
            },
            timeout: 10000,
        });

        // Try to get version info
        let version: string | undefined;
        try {
            const versionResponse = await axios.get(`${url}/api/v1/`, {
                headers: { 'X-N8N-API-KEY': apiKey },
                timeout: 5000,
            });
            version = (versionResponse.data as { version?: string })?.version;
        } catch {
            // Version endpoint might not exist in all n8n versions
        }

        return {
            success: true,
            version,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                return { success: false, error: 'Invalid API key' };
            }
            if (error.response?.status === 403) {
                return { success: false, error: 'API access forbidden' };
            }
            if (error.code === 'ECONNREFUSED') {
                return { success: false, error: 'Connection refused - check URL' };
            }
            if (error.code === 'ETIMEDOUT') {
                return { success: false, error: 'Connection timed out' };
            }
            return {
                success: false,
                error: error.message || 'Connection failed',
            };
        }
        return { success: false, error: 'Unknown error' };
    }
};

// ==================== Test Existing Instance Connection ====================

export const testInstanceConnection = async (
    userId: string,
    instanceId: string
) => {
    const instance = await prisma.instance.findFirst({
        where: { id: instanceId, userId },
    });

    if (!instance) {
        throw new NotFoundError('Instance not found');
    }

    const apiKey = decrypt(instance.apiKey);
    const result = await testConnection(instance.url, apiKey);

    // Update instance status
    await prisma.instance.update({
        where: { id: instanceId },
        data: {
            status: result.success ? 'CONNECTED' : 'ERROR',
            lastError: result.error || null,
            version: result.version || instance.version,
        },
    });

    return result;
};

// ==================== Sync Workflows ====================

export const syncWorkflows = async (
    userId: string,
    instanceId: string
) => {
    const instance = await prisma.instance.findFirst({
        where: { id: instanceId, userId },
    });

    if (!instance) {
        throw new NotFoundError('Instance not found');
    }

    const apiKey = decrypt(instance.apiKey);

    try {
        // Update status to syncing
        await prisma.instance.update({
            where: { id: instanceId },
            data: { status: 'SYNCING' },
        });

        // Fetch workflows from n8n
        const response = await axios.get(`${instance.url}/api/v1/workflows`, {
            headers: { 'X-N8N-API-KEY': apiKey },
            timeout: 30000,
        });

        const workflows = (response.data as { data: unknown[] })?.data || [];

        // Upsert workflows
        let synced = 0;
        for (const wf of workflows as Array<{
            id: string;
            name: string;
            active: boolean;
            nodes: unknown[];
            connections: unknown;
            settings: unknown;
            tags?: Array<{ name: string }>;
        }>) {
            await prisma.workflow.upsert({
                where: {
                    instanceId_n8nId: {
                        instanceId,
                        n8nId: String(wf.id),
                    },
                },
                create: {
                    instanceId,
                    n8nId: String(wf.id),
                    name: wf.name,
                    active: wf.active ?? false,
                    nodes: toJson(wf.nodes ?? []),
                    connections: toJson(wf.connections ?? {}),
                    settings: toJson(wf.settings ?? {}),
                    tags: wf.tags?.map(t => t.name) ?? [],
                },
                update: {
                    name: wf.name,
                    active: wf.active ?? false,
                    nodes: toJson(wf.nodes ?? []),
                    connections: toJson(wf.connections ?? {}),
                    settings: toJson(wf.settings ?? {}),
                    tags: wf.tags?.map(t => t.name) ?? [],
                },
            });
            synced++;
        }

        // Update instance
        await prisma.instance.update({
            where: { id: instanceId },
            data: {
                status: 'CONNECTED',
                lastSync: new Date(),
                lastError: null,
            },
        });

        return { synced, total: workflows.length };
    } catch (error) {
        // Update status to error
        await prisma.instance.update({
            where: { id: instanceId },
            data: {
                status: 'ERROR',
                lastError: error instanceof Error ? error.message : 'Sync failed',
            },
        });

        throw new BadRequestError('Failed to sync workflows');
    }
};
