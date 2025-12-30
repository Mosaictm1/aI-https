// ============================================
// Dashboard API Hooks
// ============================================

import { useQuery } from '@tanstack/react-query';
import api, { ApiResponse } from '@/lib/axios';
import type { DashboardStats } from '@/types';

// ==================== Query Keys ====================

export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
};

// ==================== Queries ====================

export function useDashboardStats() {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: async () => {
            const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
            return response.data.data;
        },
        // Refetch every 30 seconds for live data
        refetchInterval: 30000,
    });
}
