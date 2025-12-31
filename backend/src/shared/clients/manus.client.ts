// ============================================
// Manus Max AI Client - Error Analysis & Fixes
// ============================================

import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env.js';

// ==================== Types ====================

export interface ManusMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ManusCompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface ManusResponse {
    id: string;
    content: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface ErrorContext {
    workflowId: string;
    workflowName: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    nodeParameters?: Record<string, unknown>;
    errorMessage: string;
    errorStack?: string;
    executionData?: Record<string, unknown>;
}

export interface AnalysisResult {
    summary: string;
    rootCause: string;
    suggestions: FixSuggestion[];
    confidence: 'high' | 'medium' | 'low';
}

export interface FixSuggestion {
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

// ==================== Prompts ====================

const SYSTEM_PROMPT = `You are an expert n8n workflow debugger and HTTP API specialist.
Your role is to analyze errors in n8n workflows, particularly HTTP Request nodes, and provide actionable fixes.

When analyzing errors:
1. Identify the root cause precisely
2. Consider common issues: authentication, headers, URL formatting, request body structure
3. Check for API documentation compliance
4. Suggest specific parameter changes

Always respond in JSON format with this structure:
{
    "summary": "Brief one-line summary of the issue",
    "rootCause": "Detailed explanation of why this error occurred",
    "suggestions": [
        {
            "id": "unique-id",
            "title": "Short title",
            "description": "What this fix does and why",
            "fix": {
                "type": "parameter_change|header_add|auth_update|url_fix|body_fix",
                "path": "parameter.path.to.change",
                "value": "new value",
                "originalValue": "old value if applicable"
            },
            "code": "Optional code snippet showing the change",
            "priority": "high|medium|low"
        }
    ],
    "confidence": "high|medium|low"
}`;

// ==================== Client Class ====================

export class ManusClient {
    private client: AxiosInstance;
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || env.manusApiKey || '';

        if (!this.apiKey) {
            console.warn('⚠️ Manus API key not configured');
        }

        // Manus Max API endpoint (update as needed)
        this.client = axios.create({
            baseURL: 'https://api.manus.ai/v1',
            timeout: 60000,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Check if the client is configured
     */
    isConfigured(): boolean {
        return !!this.apiKey;
    }

    /**
     * Send a chat completion request
     */
    async chat(
        messages: ManusMessage[],
        options: ManusCompletionOptions = {}
    ): Promise<ManusResponse> {
        if (!this.isConfigured()) {
            throw new Error('Manus API key not configured');
        }

        try {
            const response = await this.client.post('/chat/completions', {
                model: options.model || 'manus-max',
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 2000,
            });

            return {
                id: response.data.id,
                content: response.data.choices[0]?.message?.content || '',
                model: response.data.model,
                usage: response.data.usage ? {
                    promptTokens: response.data.usage.prompt_tokens,
                    completionTokens: response.data.usage.completion_tokens,
                    totalTokens: response.data.usage.total_tokens,
                } : undefined,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.error?.message ||
                    error.message ||
                    'Failed to get AI response'
                );
            }
            throw error;
        }
    }

    /**
     * Analyze a workflow error and get suggestions
     */
    async analyzeError(context: ErrorContext): Promise<AnalysisResult> {
        const userMessage = this.buildAnalysisPrompt(context);

        const response = await this.chat([
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
        ], {
            temperature: 0.3, // Lower temperature for more consistent analysis
            maxTokens: 2000,
        });

        try {
            // Parse the JSON response
            const result = JSON.parse(response.content);
            return this.validateAnalysisResult(result);
        } catch {
            // If JSON parsing fails, return a structured response
            return {
                summary: 'Error analysis completed',
                rootCause: response.content,
                suggestions: [],
                confidence: 'low',
            };
        }
    }

    /**
     * Generate a specific fix for a node
     */
    async generateFix(
        context: ErrorContext,
        suggestion: FixSuggestion
    ): Promise<{ parameters: Record<string, unknown>; explanation: string }> {
        const prompt = `Based on the error context and suggested fix, generate the exact parameter changes needed.

Error Context:
- Node: ${context.nodeName} (${context.nodeType})
- Error: ${context.errorMessage}
- Current Parameters: ${JSON.stringify(context.nodeParameters, null, 2)}

Suggested Fix:
- ${suggestion.title}: ${suggestion.description}
- Type: ${suggestion.fix.type}
- Path: ${suggestion.fix.path}
- New Value: ${JSON.stringify(suggestion.fix.value)}

Respond with JSON:
{
    "parameters": { /* complete updated parameters object */ },
    "explanation": "Brief explanation of what was changed"
}`;

        const response = await this.chat([
            { role: 'system', content: 'You are an n8n parameter generator. Respond only with valid JSON.' },
            { role: 'user', content: prompt },
        ], {
            temperature: 0.2,
            maxTokens: 1500,
        });

        try {
            return JSON.parse(response.content);
        } catch {
            throw new Error('Failed to generate fix parameters');
        }
    }

    /**
     * Research API documentation for a specific service
     */
    async researchApi(
        serviceName: string,
        endpoint: string,
        errorMessage: string
    ): Promise<{ documentation: string; examples: string[] }> {
        const prompt = `Research the ${serviceName} API for the endpoint: ${endpoint}

Error encountered: ${errorMessage}

Provide:
1. Correct API documentation for this endpoint
2. Required headers and authentication
3. Request body format
4. Example curl commands that work

Respond with JSON:
{
    "documentation": "API documentation summary",
    "examples": ["curl example 1", "curl example 2"]
}`;

        const response = await this.chat([
            { role: 'system', content: 'You are an API documentation expert. Provide accurate, up-to-date API information.' },
            { role: 'user', content: prompt },
        ], {
            temperature: 0.5,
            maxTokens: 2000,
        });

        try {
            return JSON.parse(response.content);
        } catch {
            return {
                documentation: response.content,
                examples: [],
            };
        }
    }

    // ==================== Private Methods ====================

    private buildAnalysisPrompt(context: ErrorContext): string {
        return `Analyze this n8n workflow error:

## Workflow Info
- Workflow: ${context.workflowName} (ID: ${context.workflowId})
- Node: ${context.nodeName} (ID: ${context.nodeId})
- Type: ${context.nodeType}

## Error
${context.errorMessage}
${context.errorStack ? `\nStack trace:\n${context.errorStack}` : ''}

## Node Parameters
${JSON.stringify(context.nodeParameters, null, 2)}

${context.executionData ? `## Execution Data\n${JSON.stringify(context.executionData, null, 2)}` : ''}

Please analyze this error and provide specific, actionable fixes.`;
    }

    private validateAnalysisResult(data: unknown): AnalysisResult {
        const result = data as AnalysisResult;

        // Ensure required fields exist
        return {
            summary: result.summary || 'Analysis complete',
            rootCause: result.rootCause || 'Unknown root cause',
            suggestions: Array.isArray(result.suggestions)
                ? result.suggestions.map((s, i) => ({
                    id: s.id || `suggestion-${i}`,
                    title: s.title || 'Untitled suggestion',
                    description: s.description || '',
                    fix: s.fix || { type: 'parameter_change' as const },
                    code: s.code,
                    priority: s.priority || 'medium',
                }))
                : [],
            confidence: ['high', 'medium', 'low'].includes(result.confidence)
                ? result.confidence
                : 'medium',
        };
    }
}

// ==================== Factory Function ====================

export const createManusClient = (apiKey?: string): ManusClient => {
    return new ManusClient(apiKey);
};

// ==================== Default Instance ====================

export const manusClient = new ManusClient();
