// ============================================
// Manus AI Client - Task-based API
// ============================================

import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

// ==================== Types ====================

export type AgentProfile = 'manus-1.6-max' | 'manus-1.6' | 'manus-1.6-lite';

export interface ManusTaskRequest {
    prompt: string;
    agentProfile?: AgentProfile;
}

export interface ManusTaskResponse {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: string;
    error?: string;
    createdAt: string;
    completedAt?: string;
}

export interface NodeFixRequest {
    errorMessage: string;
    nodeType: string;
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: unknown;
    parameters?: Record<string, unknown>;
    serviceName?: string;
}

export interface NodeFixResult {
    success: boolean;
    analysis: string;
    fix: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
        parameters?: Record<string, unknown>;
    };
    explanation: string;
    documentationLinks?: string[];
}

export interface WorkflowBuildRequest {
    idea: string;
    services?: string[];
    additionalContext?: string;
}

export interface WorkflowBuildResult {
    success: boolean;
    workflow: {
        name: string;
        nodes: unknown[];
        connections: Record<string, unknown>;
        settings?: Record<string, unknown>;
    };
    explanation: string;
    requiredCredentials: string[];
}

// ==================== Client Class ====================

export class ManusClient {
    private client: AxiosInstance;
    private apiKey: string;
    private defaultProfile: AgentProfile = 'manus-1.6-max';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || env.manusApiKey || '';

        if (!this.apiKey) {
            logger.warn('⚠️ Manus API key not configured');
        }

        this.client = axios.create({
            baseURL: 'https://api.manus.ai/v1',
            timeout: 120000, // 2 minutes for long tasks
            headers: {
                'API_KEY': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Check if client is configured
     */
    isConfigured(): boolean {
        return !!this.apiKey;
    }

    // ==================== Core Task API ====================

    /**
     * Create a new task
     */
    async createTask(request: ManusTaskRequest): Promise<ManusTaskResponse> {
        if (!this.isConfigured()) {
            throw new Error('Manus API key not configured');
        }

        try {
            const response = await this.client.post('/tasks', {
                prompt: request.prompt,
                agentProfile: request.agentProfile || this.defaultProfile,
            });

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.error ||
                    error.message ||
                    'Failed to create Manus task'
                );
            }
            throw error;
        }
    }

    /**
     * Get task status
     */
    async getTask(taskId: string): Promise<ManusTaskResponse> {
        try {
            const response = await this.client.get(`/tasks/${taskId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.error ||
                    `Failed to get task ${taskId}`
                );
            }
            throw error;
        }
    }

    /**
     * Wait for task completion with polling
     */
    async waitForTask(
        taskId: string,
        maxWaitMs = 300000, // 5 minutes
        pollIntervalMs = 5000 // 5 seconds
    ): Promise<ManusTaskResponse> {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitMs) {
            const task = await this.getTask(taskId);

            if (task.status === 'completed') {
                return task;
            }

            if (task.status === 'failed') {
                throw new Error(task.error || 'Task failed');
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        throw new Error('Task timed out');
    }

    /**
     * Execute a task and wait for result
     */
    async executeTask(
        prompt: string,
        agentProfile?: AgentProfile
    ): Promise<string> {
        const task = await this.createTask({ prompt, agentProfile });
        const completedTask = await this.waitForTask(task.id);

        if (!completedTask.result) {
            throw new Error('Task completed without result');
        }

        return completedTask.result;
    }

    // ==================== Fix Node Feature ====================

    /**
     * Fix a broken HTTP Request node
     */
    async fixNode(request: NodeFixRequest): Promise<NodeFixResult> {
        const prompt = this.buildFixNodePrompt(request);

        try {
            const result = await this.executeTask(prompt, 'manus-1.6-max');
            return this.parseFixNodeResult(result);
        } catch (error) {
            logger.error('Fix node failed:', error);
            return {
                success: false,
                analysis: error instanceof Error ? error.message : 'Unknown error',
                fix: {},
                explanation: 'فشل في تحليل الخطأ. يرجى المحاولة مرة أخرى.',
            };
        }
    }

    private buildFixNodePrompt(request: NodeFixRequest): string {
        const serviceName = request.serviceName || this.detectServiceFromUrl(request.url);

        return `أنت خبير في n8n workflows و HTTP APIs.

## المشكلة
**رسالة الخطأ:** ${request.errorMessage}

## تفاصيل الـ Node
- **النوع:** ${request.nodeType}
- **URL:** ${request.url}
- **Method:** ${request.method}
- **Headers:** ${JSON.stringify(request.headers || {}, null, 2)}
- **Body:** ${JSON.stringify(request.body || {}, null, 2)}
- **Parameters:** ${JSON.stringify(request.parameters || {}, null, 2)}

## الخدمة المستخدمة
${serviceName}

## المطلوب منك:
1. **تحليل الخطأ** - اشرح لماذا حدث هذا الخطأ بالضبط
2. **البحث في التوثيق** - ابحث في documentation الخاصة بـ ${serviceName} للعثور على الحل الصحيح
3. **تقديم الإصلاح** - قدم الإصلاح بصيغة JSON

## صيغة الرد المطلوبة (JSON فقط):
\`\`\`json
{
  "success": true,
  "analysis": "شرح سبب الخطأ",
  "fix": {
    "url": "الـ URL الصحيح إن تغير",
    "method": "الـ method الصحيح إن تغير",
    "headers": { "Header-Name": "value" },
    "body": {},
    "parameters": {}
  },
  "explanation": "شرح الإصلاح وكيفية تطبيقه",
  "documentationLinks": ["روابط التوثيق المرجعية"]
}
\`\`\`

يجب أن يكون ردك JSON فقط بدون أي نص إضافي.`;
    }

    private parseFixNodeResult(result: string): NodeFixResult {
        try {
            // Extract JSON from result
            const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) ||
                result.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const json = jsonMatch[1] || jsonMatch[0];
                return JSON.parse(json);
            }

            // Try parsing the whole result as JSON
            return JSON.parse(result);
        } catch {
            return {
                success: false,
                analysis: 'فشل في تحليل رد الـ AI',
                fix: {},
                explanation: result,
            };
        }
    }

    // ==================== Build Workflow Feature ====================

    /**
     * Build a workflow from user idea
     */
    async buildWorkflow(request: WorkflowBuildRequest): Promise<WorkflowBuildResult> {
        const prompt = this.buildWorkflowPrompt(request);

        try {
            const result = await this.executeTask(prompt, 'manus-1.6-max');
            return this.parseWorkflowResult(result);
        } catch (error) {
            logger.error('Build workflow failed:', error);
            return {
                success: false,
                workflow: { name: '', nodes: [], connections: {} },
                explanation: error instanceof Error ? error.message : 'Unknown error',
                requiredCredentials: [],
            };
        }
    }

    private buildWorkflowPrompt(request: WorkflowBuildRequest): string {
        return `أنت خبير في بناء n8n workflows و ربط التطبيقات عبر HTTP APIs.

## فكرة المستخدم
${request.idea}

${request.services?.length ? `## الخدمات المطلوبة\n${request.services.join(', ')}` : ''}

${request.additionalContext ? `## سياق إضافي\n${request.additionalContext}` : ''}

## المطلوب منك:
1. **تحليل الفكرة** - فهم ما يريده المستخدم بالضبط
2. **تحديد APIs** - البحث عن endpoints المناسبة لكل خدمة
3. **بناء الـ Workflow** - إنشاء workflow JSON كامل يعمل على n8n

## صيغة n8n Workflow:
- كل node يجب أن يحتوي على: id, name, type, typeVersion, position, parameters
- الـ connections تربط بين الـ nodes
- استخدم HTTP Request nodes للـ API calls

## صيغة الرد المطلوبة (JSON فقط):
\`\`\`json
{
  "success": true,
  "workflow": {
    "name": "اسم الـ Workflow",
    "nodes": [
      {
        "id": "uuid",
        "name": "Node Name",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [250, 300],
        "parameters": {
          "url": "https://api.example.com/endpoint",
          "method": "POST",
          "headers": {},
          "body": {}
        }
      }
    ],
    "connections": {
      "Node1": {
        "main": [[{"node": "Node2", "type": "main", "index": 0}]]
      }
    },
    "settings": {
      "executionOrder": "v1"
    }
  },
  "explanation": "شرح كيف يعمل الـ Workflow",
  "requiredCredentials": ["اسم كل credential مطلوب"]
}
\`\`\`

يجب أن يكون ردك JSON فقط بدون أي نص إضافي.`;
    }

    private parseWorkflowResult(result: string): WorkflowBuildResult {
        try {
            const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) ||
                result.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const json = jsonMatch[1] || jsonMatch[0];
                return JSON.parse(json);
            }

            return JSON.parse(result);
        } catch {
            return {
                success: false,
                workflow: { name: '', nodes: [], connections: {} },
                explanation: result,
                requiredCredentials: [],
            };
        }
    }

    // ==================== Helpers ====================

    private detectServiceFromUrl(url: string): string {
        const urlLower = url.toLowerCase();

        const services: Record<string, string> = {
            'stripe.com': 'Stripe API',
            'api.openai.com': 'OpenAI API',
            'graph.facebook.com': 'Facebook Graph API',
            'api.twitter.com': 'Twitter API',
            'api.github.com': 'GitHub API',
            'api.slack.com': 'Slack API',
            'api.telegram.org': 'Telegram Bot API',
            'api.whatsapp.com': 'WhatsApp API',
            'api.shopify.com': 'Shopify API',
            'api.notion.com': 'Notion API',
            'api.airtable.com': 'Airtable API',
            'api.hubspot.com': 'HubSpot API',
            'api.mailchimp.com': 'Mailchimp API',
            'api.sendgrid.com': 'SendGrid API',
            'api.twilio.com': 'Twilio API',
            'googleapis.com': 'Google API',
            'api.zoom.us': 'Zoom API',
            'api.calendly.com': 'Calendly API',
        };

        for (const [domain, name] of Object.entries(services)) {
            if (urlLower.includes(domain)) {
                return name;
            }
        }

        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return 'Unknown Service';
        }
    }
}

// ==================== Factory & Default Instance ====================

export const createManusClient = (apiKey?: string): ManusClient => {
    return new ManusClient(apiKey);
};

export const manusClient = new ManusClient();
