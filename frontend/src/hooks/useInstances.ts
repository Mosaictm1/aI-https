// ============================================
// Instances API Hooks
// ============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { ApiResponse } from '@/lib/axios';
import type { Instance, CreateInstanceInput, UpdateInstanceInput, PaginatedResponse } from '@/types';

// ==================== Query Keys ====================

export const instanceKeys = {
    all: ['instances'] as const,
    lists: () => [...instanceKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...instanceKeys.lists(), filters] as const,
    details: () => [...instanceKeys.all, 'detail'] as const,
    detail: (id: string) => [...instanceKeys.details(), id] as const,
};

// ==================== Queries ====================

export function useInstances() {
    return useQuery({
        queryKey: instanceKeys.lists(),
        queryFn: async () => {
            const response = await api.get<ApiResponse<PaginatedResponse<Instance>>>('/instances');
            return response.data.data;
        },
    });
}

export function useInstance(id: string) {
    return useQuery({
        queryKey: instanceKeys.detail(id),
        queryFn: async () => {
            const response = await api.get<ApiResponse<Instance>>(`/instances/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

// ==================== Mutations ====================

export function useCreateInstance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateInstanceInput) => {
            const response = await api.post<ApiResponse<Instance>>('/instances', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: instanceKeys.lists() });
        },
    });
}

export function useUpdateInstance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateInstanceInput }) => {
            const response = await api.patch<ApiResponse<Instance>>(`/instances/${id}`, data);
            return response.data.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: instanceKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: instanceKeys.lists() });
        },
    });
}

export function useDeleteInstance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/instances/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: instanceKeys.lists() });
        },
    });
}

export function useTestConnection() {
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post<ApiResponse<{ connected: boolean; message: string }>>(
                `/instances/${id}/test`
            );
            return response.data.data;
        },
    });
}

export function useSyncWorkflows() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post<ApiResponse<{ synced: number }>>(
                `/instances/${id}/sync`
            );
            return response.data.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: instanceKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: instanceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
}
