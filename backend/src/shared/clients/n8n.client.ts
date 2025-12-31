// ============================================
// n8n API Client - Unified Interface
// ============================================

import axios, { AxiosInstance, AxiosError } from 'axios';

// ==================== Types ====================

export interface N8nWorkflow {
    id: string;
    name: string;
    active: boolean;
    nodes: N8nNode[];
    connections: Record<string, unknown>;
    settings?: Record<string, unknown>;
    tags?: Array<{ id: string; name: string }>;
    createdAt?: string;
    updatedAt?: string;
}

export interface N8nNode {
    id: string;
    name: string;
    type: string;
    typeVersion: number;
    position: [number, number];
    parameters: Record<string, unknown>;
    credentials?: Record<string, unknown>;
}

export interface N8nExecution {
    id: string;
    finished: boolean;
    mode: string;
    startedAt: string;
    stoppedAt?: string;
    workflowId: string;
    status: 'success' | 'error' | 'running' | 'waiting';
    data?: {
        resultData?: {
            runData?: Record<string, unknown[]>;
            error?: {
                message: string;
                node?: string;
            };
        };
    };
}

export interface N8nClientConfig {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
}

export interface N8nClientError {
    message: string;
    status?: number;
    code?: string;
}

// ==================== Client Class ====================

export class N8nClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(config: N8nClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, '');

        this.client = axios.create({
            baseURL: `${this.baseUrl}/api/v1`,
            timeout: config.timeout || 30000,
            headers: {
                'X-N8N-API-KEY': config.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    // ==================== Workflows ====================

    /**
     * Get all workflows from the n8n instance
     */
    async getWorkflows(): Promise<N8nWorkflow[]> {
        try {
            const response = await this.client.get('/workflows');
            return response.data.data || [];
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get a specific workflow by ID
     */
    async getWorkflow(workflowId: string): Promise<N8nWorkflow> {
        try {
            const response = await this.client.get(`/workflows/${workflowId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Update a workflow
     */
    async updateWorkflow(
        workflowId: string,
        data: Partial<N8nWorkflow>
    ): Promise<N8nWorkflow> {
        try {
            const response = await this.client.put(`/workflows/${workflowId}`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Activate a workflow
     */
    async activateWorkflow(workflowId: string): Promise<N8nWorkflow> {
        try {
            const response = await this.client.post(`/workflows/${workflowId}/activate`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Deactivate a workflow
     */
    async deactivateWorkflow(workflowId: string): Promise<N8nWorkflow> {
        try {
            const response = await this.client.post(`/workflows/${workflowId}/deactivate`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== Executions ====================

    /**
     * Get executions for a workflow
     */
    async getExecutions(
        workflowId?: string,
        limit = 20
    ): Promise<N8nExecution[]> {
        try {
            const params: Record<string, string | number> = { limit };
            if (workflowId) {
                params.workflowId = workflowId;
            }
            const response = await this.client.get('/executions', { params });
            return response.data.data || [];
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get a specific execution by ID
     */
    async getExecution(executionId: string): Promise<N8nExecution> {
        try {
            const response = await this.client.get(`/executions/${executionId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Execute a workflow with optional input data (via webhook if available)
     * Note: n8n Cloud doesn't support direct execution API, use webhook instead
     */
    async executeWorkflow(
        workflowId: string,
        data?: Record<string, unknown>
    ): Promise<{ executionId?: string; message: string }> {
        try {
            // Try the execute endpoint (works on self-hosted)
            const response = await this.client.post(`/workflows/${workflowId}/execute`, {
                workflowData: data || {},
            });
            return {
                executionId: response.data.executionId,
                message: 'Workflow execution started',
            };
        } catch (error) {
            // If direct execution fails (n8n Cloud), return guidance
            if (axios.isAxiosError(error) && error.response?.status === 405) {
                return {
                    message: 'Direct execution not available. Please use webhook trigger.',
                };
            }
            throw this.handleError(error);
        }
    }

    // ==================== Nodes ====================

    /**
     * Update a specific node in a workflow
     */
    async updateNode(
        workflowId: string,
        nodeId: string,
        nodeData: Partial<N8nNode>
    ): Promise<N8nWorkflow> {
        try {
            // Get current workflow
            const workflow = await this.getWorkflow(workflowId);

            // Find and update the node
            const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex === -1) {
                throw new Error(`Node ${nodeId} not found in workflow`);
            }

            // Merge node data
            workflow.nodes[nodeIndex] = {
                ...workflow.nodes[nodeIndex],
                ...nodeData,
            };

            // Update the workflow
            return this.updateWorkflow(workflowId, {
                nodes: workflow.nodes,
            });
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get all HTTP Request nodes from a workflow
     */
    async getHttpNodes(workflowId: string): Promise<N8nNode[]> {
        const workflow = await this.getWorkflow(workflowId);
        return workflow.nodes.filter(
            node => node.type === 'n8n-nodes-base.httpRequest'
        );
    }

    // ==================== Health Check ====================

    /**
     * Test connection to n8n instance
     */
    async healthCheck(): Promise<{
        connected: boolean;
        version?: string;
        error?: string;
    }> {
        try {
            // Try to fetch workflows as a connection test
            await this.client.get('/workflows', { timeout: 10000 });

            // Try to get version info
            let version: string | undefined;
            try {
                const versionResponse = await this.client.get('/', { timeout: 5000 });
                version = versionResponse.data?.version;
            } catch {
                // Version endpoint might not exist
            }

            return { connected: true, version };
        } catch (error) {
            const err = this.handleError(error);
            return { connected: false, error: err.message };
        }
    }

    // ==================== Error Handling ====================

    private handleError(error: unknown): N8nClientError {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ message?: string }>;

            if (axiosError.response) {
                const status = axiosError.response.status;
                const message = axiosError.response.data?.message
                    || axiosError.message;

                switch (status) {
                    case 401:
                        return { message: 'Invalid API key', status, code: 'UNAUTHORIZED' };
                    case 403:
                        return { message: 'Access forbidden', status, code: 'FORBIDDEN' };
                    case 404:
                        return { message: 'Resource not found', status, code: 'NOT_FOUND' };
                    case 405:
                        return { message: 'Method not allowed', status, code: 'METHOD_NOT_ALLOWED' };
                    default:
                        return { message, status };
                }
            }

            if (axiosError.code === 'ECONNREFUSED') {
                return { message: 'Connection refused', code: 'CONNECTION_REFUSED' };
            }

            if (axiosError.code === 'ETIMEDOUT') {
                return { message: 'Connection timeout', code: 'TIMEOUT' };
            }

            return { message: axiosError.message };
        }

        if (error instanceof Error) {
            return { message: error.message };
        }

        return { message: 'Unknown error occurred' };
    }
}

// ==================== Factory Function ====================

export const createN8nClient = (config: N8nClientConfig): N8nClient => {
    return new N8nClient(config);
};
