// ============================================
// AI Analysis Hook - Error Analysis & Fixes
// ============================================

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// ==================== Types ====================

interface FixSuggestion {
    id: string;
    title: string;
    description: string;
    fix: {
        type: 'parameter_change' | 'header_add' | 'auth_update' | 'url_fix' | 'body_fix';
        path?: string;
        value?: unknown;
        originalValue?: unknown;
    };
    code?: string;
    priority: 'high' | 'medium' | 'low';
}

interface AnalysisResult {
    analysisId: string;
    summary: string;
    rootCause: string;
    suggestions: FixSuggestion[];
    confidence: 'high' | 'medium' | 'low';
}

interface AnalyzeErrorInput {
    workflowId: string;
    nodeId: string;
    errorMessage: string;
    errorStack?: string;
    executionData?: Record<string, unknown>;
}

interface ApplyFixInput {
    workflowId: string;
    n8nWorkflowId: string;
    nodeId: string;
    fix: {
        id: string;
        type: string;
        path?: string;
        value?: unknown;
    };
}

interface AnalysisHistoryItem {
    id: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    errorMessage: string;
    status: string;
    analysis?: unknown;
    suggestions?: unknown;
    createdAt: string;
    workflow: {
        id: string;
        name: string;
    };
}

interface ApiResearchResult {
    documentation: string;
    examples: string[];
}

// ==================== API Functions ====================

const analyzeError = async (input: AnalyzeErrorInput): Promise<AnalysisResult> => {
    const response = await api.post('/ai/fix-node', input);
    return response.data.data;
};

const applyFix = async (input: ApplyFixInput): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/ai/apply-fix', input);
    return response.data.data;
};

const getAnalysisHistory = async (workflowId?: string): Promise<AnalysisHistoryItem[]> => {
    const params = workflowId ? { workflowId } : {};
    const response = await api.get('/ai/history', { params });
    return response.data.data;
};

const getAnalysis = async (analysisId: string): Promise<AnalysisResult> => {
    const response = await api.get(`/ai/analysis/${analysisId}`);
    return response.data.data;
};

const researchApi = async (
    serviceName: string,
    endpoint: string,
    errorMessage?: string
): Promise<ApiResearchResult> => {
    const response = await api.post('/ai/research', {
        serviceName,
        endpoint,
        errorMessage,
    });
    return response.data.data;
};

// ==================== Hook ====================

export const useAIAnalysis = () => {
    const queryClient = useQueryClient();
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState<FixSuggestion | null>(null);

    // ==================== Analyze Error Mutation ====================

    const analyzeMutation = useMutation({
        mutationFn: analyzeError,
        onSuccess: (data) => {
            setCurrentAnalysis(data);
            // Invalidate history to refresh
            queryClient.invalidateQueries({ queryKey: ['ai-history'] });
        },
    });

    // ==================== Apply Fix Mutation ====================

    const applyFixMutation = useMutation({
        mutationFn: applyFix,
        onSuccess: () => {
            // Invalidate workflows to refresh
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            setSelectedSuggestion(null);
        },
    });

    // ==================== Research API Mutation ====================

    const researchMutation = useMutation({
        mutationFn: (params: { serviceName: string; endpoint: string; errorMessage?: string }) =>
            researchApi(params.serviceName, params.endpoint, params.errorMessage),
    });

    // ==================== Analysis History Query ====================

    const useAnalysisHistory = (workflowId?: string) => {
        return useQuery({
            queryKey: ['ai-history', workflowId],
            queryFn: () => getAnalysisHistory(workflowId),
        });
    };

    // ==================== Single Analysis Query ====================

    const useAnalysis = (analysisId: string) => {
        return useQuery({
            queryKey: ['ai-analysis', analysisId],
            queryFn: () => getAnalysis(analysisId),
            enabled: !!analysisId,
        });
    };

    // ==================== Actions ====================

    const analyze = useCallback(async (input: AnalyzeErrorInput) => {
        return analyzeMutation.mutateAsync(input);
    }, [analyzeMutation]);

    const apply = useCallback(async (input: ApplyFixInput) => {
        return applyFixMutation.mutateAsync(input);
    }, [applyFixMutation]);

    const research = useCallback(async (
        serviceName: string,
        endpoint: string,
        errorMessage?: string
    ) => {
        return researchMutation.mutateAsync({ serviceName, endpoint, errorMessage });
    }, [researchMutation]);

    const clearAnalysis = useCallback(() => {
        setCurrentAnalysis(null);
        setSelectedSuggestion(null);
    }, []);

    const selectSuggestion = useCallback((suggestion: FixSuggestion | null) => {
        setSelectedSuggestion(suggestion);
    }, []);

    return {
        // State
        currentAnalysis,
        selectedSuggestion,

        // Mutations
        analyze,
        isAnalyzing: analyzeMutation.isPending,
        analyzeError: analyzeMutation.error,

        apply,
        isApplying: applyFixMutation.isPending,
        applyError: applyFixMutation.error,

        research,
        isResearching: researchMutation.isPending,
        researchResult: researchMutation.data,

        // Queries
        useAnalysisHistory,
        useAnalysis,

        // Actions
        clearAnalysis,
        selectSuggestion,
    };
};

export default useAIAnalysis;
