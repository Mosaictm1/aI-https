// ============================================
// Workflows API Hooks
// ============================================

import { useQuery } from '@tanstack/react-query';
import api, { ApiResponse, PaginatedResponse } from '@/lib/axios';
import type { Workflow, WorkflowExecution } from '@/types';

// ==================== Query Keys ====================

export const workflowKeys = {
    all: ['workflows'] as const,
    lists: () => [...workflowKeys.all, 'list'] as const,
    list: (instanceId?: string) => [...workflowKeys.lists(), { instanceId }] as const,
    details: () => [...workflowKeys.all, 'detail'] as const,
    detail: (id: string) => [...workflowKeys.details(), id] as const,
    executions: (id: string) => [...workflowKeys.detail(id), 'executions'] as const,
};

// ==================== Types ====================

interface WorkflowsQuery {
    instanceId?: string;
    page?: number;
    limit?: number;
    active?: boolean;
    search?: string;
}

// ==================== Queries ====================

export function useWorkflows(query: WorkflowsQuery = {}) {
    return useQuery({
        queryKey: workflowKeys.list(query.instanceId),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (query.instanceId) params.append('instanceId', query.instanceId);
            if (query.page) params.append('page', query.page.toString());
            if (query.limit) params.append('limit', query.limit.toString());
            if (query.active !== undefined) params.append('active', query.active.toString());
            if (query.search) params.append('search', query.search);

            const response = await api.get<ApiResponse<PaginatedResponse<Workflow>>>(
                `/workflows?${params.toString()}`
            );
            return response.data.data;
        },
    });
}

export function useWorkflow(id: string) {
    return useQuery({
        queryKey: workflowKeys.detail(id),
        queryFn: async () => {
            const response = await api.get<ApiResponse<Workflow>>(`/workflows/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

export function useWorkflowExecutions(workflowId: string, page = 1, limit = 10) {
    return useQuery({
        queryKey: workflowKeys.executions(workflowId),
        queryFn: async () => {
            const response = await api.get<ApiResponse<PaginatedResponse<WorkflowExecution>>>(
                `/workflows/${workflowId}/executions?page=${page}&limit=${limit}`
            );
            return response.data.data;
        },
        enabled: !!workflowId,
    });
}
