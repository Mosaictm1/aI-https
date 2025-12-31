// ============================================
// Manus AI Client - Task-based API with n8n Control
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

export interface N8nAccess {
    instanceUrl: string;
    apiKey: string;
    workflowId?: string;
}

export interface NodeFixRequest {
    errorMessage: string;
    nodeType: string;
    nodeId: string;
    nodeName: string;
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: unknown;
    parameters?: Record<string, unknown>;
    serviceName?: string;
    n8n: N8nAccess;
    workflowJson?: unknown;
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
    appliedDirectly?: boolean;
}

export interface WorkflowBuildRequest {
    idea: string;
    services?: string[];
    additionalContext?: string;
    n8n?: N8nAccess;
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
    createdInN8n?: boolean;
    n8nWorkflowId?: string;
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
            timeout: 600000, // 10 minutes for long tasks
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
     * Wait for task completion with polling (10 minutes max)
     */
    async waitForTask(
        taskId: string,
        maxWaitMs = 600000, // 10 minutes
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

            logger.debug(`Task ${taskId} status: ${task.status}`);
            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        throw new Error('Task timed out after 10 minutes');
    }

    /**
     * Execute a task and wait for result
     */
    async executeTask(
        prompt: string,
        agentProfile?: AgentProfile
    ): Promise<string> {
        const task = await this.createTask({ prompt, agentProfile });
        logger.info(`Created Manus task: ${task.id}`);

        const completedTask = await this.waitForTask(task.id);

        if (!completedTask.result) {
            throw new Error('Task completed without result');
        }

        return completedTask.result;
    }

    // ==================== Fix Node Feature ====================

    /**
     * Fix a broken HTTP Request node with full n8n access
     */
    async fixNode(request: NodeFixRequest): Promise<NodeFixResult> {
        const prompt = this.buildFixNodePrompt(request);

        try {
            logger.info(`Sending fix request for node ${request.nodeId} to Manus AI`);
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

        return `أنت خبير في n8n workflows و HTTP APIs. لديك صلاحية كاملة للتحكم في n8n instance وإصلاح المشاكل.

# 🔌 معلومات الوصول إلى n8n (استخدمها مباشرة)
- **Instance URL:** ${request.n8n.instanceUrl}
- **API Key:** ${request.n8n.apiKey}
- **Workflow ID:** ${request.n8n.workflowId}

## n8n API Commands يمكنك استخدامها:

### قراءة الـ Workflow:
\`\`\`bash
curl -X GET "${request.n8n.instanceUrl}/api/v1/workflows/${request.n8n.workflowId}" \\
  -H "X-N8N-API-KEY: ${request.n8n.apiKey}"
\`\`\`

### تحديث الـ Workflow:
\`\`\`bash
curl -X PUT "${request.n8n.instanceUrl}/api/v1/workflows/${request.n8n.workflowId}" \\
  -H "X-N8N-API-KEY: ${request.n8n.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{ "nodes": [...], "connections": {...} }'
\`\`\`

### تشغيل الـ Workflow (عبر Webhook):
\`\`\`bash
# ابحث عن webhook URL في الـ workflow nodes
curl -X POST "<webhook-url>" \\
  -H "Content-Type: application/json" \\
  -d '{ "test": true }'
\`\`\`

### جلب آخر Executions:
\`\`\`bash
curl -X GET "${request.n8n.instanceUrl}/api/v1/executions?workflowId=${request.n8n.workflowId}&limit=5" \\
  -H "X-N8N-API-KEY: ${request.n8n.apiKey}"
\`\`\`

---

# 🔴 المشكلة الحالية
**رسالة الخطأ:** ${request.errorMessage}

# 📝 تفاصيل الـ Node المعطل
- **Node ID:** ${request.nodeId}
- **Node Name:** ${request.nodeName}
- **النوع:** ${request.nodeType}
- **URL:** ${request.url}
- **Method:** ${request.method}
- **Headers:** ${JSON.stringify(request.headers || {}, null, 2)}
- **Body:** ${JSON.stringify(request.body || {}, null, 2)}
- **كل الـ Parameters:** ${JSON.stringify(request.parameters || {}, null, 2)}

${request.workflowJson ? `# 📋 Workflow JSON الكامل\n\`\`\`json\n${JSON.stringify(request.workflowJson, null, 2)}\n\`\`\`` : ''}

# 🌐 الخدمة المستخدمة
${serviceName}

---

# 📌 المهمة المطلوبة (اتبع هذه الخطوات بالترتيب):

## الخطوة 1: تحليل الخطأ
- اقرأ رسالة الخطأ بعناية
- حدد السبب الجذري للمشكلة
- افهم ماذا يتوقع الـ API

## الخطوة 2: البحث في التوثيق
- ابحث في documentation الخاصة بـ ${serviceName}
- جد الـ endpoint الصحيح
- جد الـ headers المطلوبة
- جد صيغة الـ body الصحيحة
- جد متطلبات الـ authentication

## الخطوة 3: إصلاح الـ Node
- استخدم n8n API لتحديث الـ workflow مباشرة
- طبق الإصلاحات على الـ node المعطل

## الخطوة 4: ⚡ تشغيل الـ Workflow للتحقق ⚡
- شغّل الـ workflow عبر webhook أو API
- انتظر انتهاء التنفيذ
- جلب نتيجة التنفيذ

## الخطوة 5: 🔄 تكرار حتى النجاح 🔄
- إذا فشل التنفيذ، حلل الخطأ الجديد
- أصلح المشكلة الجديدة
- شغّل مرة أخرى
- **كرر حتى ينجح التنفيذ بالكامل**

## الخطوة 6: تأكيد النجاح
- تأكد أن الـ workflow يعمل بدون أخطاء
- وثّق كل التغييرات التي أجريتها

---

# ⚠️ قواعد مهمة:
1. **لا تتوقف عند أول إصلاح** - شغّل وتحقق
2. **إذا ظهر خطأ جديد** - أصلحه وشغّل مرة أخرى
3. **كرر حتى النجاح الكامل** - الهدف هو workflow يعمل 100%
4. **استخدم n8n API مباشرة** - لديك كل الصلاحيات

---

# 📤 صيغة الرد المطلوبة (JSON فقط):
\`\`\`json
{
  "success": true,
  "summary": "The workflow is now working successfully! Here's a summary of what was fixed:",
  
  "issuesFixed": [
    {
      "errorName": "اسم الخطأ (مثل: 401 Unauthorized Error)",
      "description": "شرح المشكلة",
      "solution": "ما تم فعله لحل المشكلة",
      "nodeAffected": "اسم الـ Node الذي تأثر"
    }
  ],
  
  "nodesModified": [
    {
      "nodeName": "اسم الـ Node",
      "changeType": "modified | added | removed",
      "description": "ما تم تغييره"
    }
  ],
  
  "nodesAdded": [
    {
      "nodeName": "اسم الـ Node الجديد",
      "purpose": "لماذا تمت إضافته",
      "type": "n8n-nodes-base.httpRequest"
    }
  ],
  
  "executionResult": {
    "tested": true,
    "successful": true,
    "status": "Published ✅",
    "resultUrl": "رابط النتيجة إن وجد (مثل رابط Instagram Post)",
    "executedAt": "2025-12-31T07:40:45.069Z",
    "iterationsNeeded": 3
  },
  
  "workflowNowDoes": [
    "الخطوة 1: يفعل كذا",
    "الخطوة 2: يفعل كذا",
    "الخطوة 3: يفعل كذا"
  ],
  
  "fix": {
    "url": "الـ URL النهائي",
    "method": "POST",
    "headers": {},
    "body": {},
    "parameters": {}
  },
  
  "documentationLinks": ["روابط مرجعية"],
  "appliedDirectly": true,
  "finalMessage": "Your workflow is now fully functional! ✅"
}
\`\`\`

⚠️ مهم جداً:
- يجب أن يكون ردك JSON فقط بدون أي نص إضافي
- اكتب summary و finalMessage بالإنجليزية
- اكتب التفاصيل بالعربية أو الإنجليزية حسب المناسب`;
    }

    private parseFixNodeResult(result: string): NodeFixResult {
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
                analysis: 'فشل في تحليل رد الـ AI',
                fix: {},
                explanation: result,
            };
        }
    }


    // ==================== Build Workflow Feature ====================

    /**
     * Build a workflow from user idea with n8n access
     */
    async buildWorkflow(request: WorkflowBuildRequest): Promise<WorkflowBuildResult> {
        const prompt = this.buildWorkflowPrompt(request);

        try {
            logger.info(`Building workflow from idea: ${request.idea.substring(0, 50)}...`);
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
        const n8nSection = request.n8n ? `
## 🔌 معلومات الوصول إلى n8n
- **Instance URL:** ${request.n8n.instanceUrl}
- **API Key:** ${request.n8n.apiKey}

يمكنك إنشاء الـ Workflow مباشرة في n8n باستخدام:
\`\`\`
POST ${request.n8n.instanceUrl}/api/v1/workflows
Headers: X-N8N-API-KEY: ${request.n8n.apiKey}
\`\`\`
` : '';

        return `أنت خبير في بناء n8n workflows و ربط التطبيقات عبر HTTP APIs.

${n8nSection}

## 💡 فكرة المستخدم
${request.idea}

${request.services?.length ? `## 🔗 الخدمات المطلوبة\n${request.services.join(', ')}` : ''}

${request.additionalContext ? `## 📝 سياق إضافي\n${request.additionalContext}` : ''}

## 📌 المهمة المطلوبة:

### 1. تحليل الفكرة
- فهم ما يريده المستخدم بالضبط
- تحديد الخطوات المطلوبة

### 2. البحث عن APIs
- ابحث عن documentation كل خدمة
- حدد الـ endpoints الصحيحة
- حدد الـ authentication المطلوب

### 3. بناء الـ Workflow
- أنشئ workflow JSON كامل وصحيح
- تأكد من أن كل node يحتوي على كل الـ parameters المطلوبة

### 4. (اختياري) إنشاء في n8n
- إذا متاح الوصول، أنشئ الـ workflow مباشرة

## 📋 متطلبات n8n Workflow:
- كل node يجب أن يحتوي على: id, name, type, typeVersion, position, parameters
- استخدم UUIDs صحيحة للـ node IDs
- الـ connections تربط بين الـ nodes بالشكل الصحيح
- استخدم HTTP Request nodes (n8n-nodes-base.httpRequest) للـ API calls
- typeVersion للـ HTTP Request = 4.2

## 📤 صيغة الرد المطلوبة (JSON فقط):
\`\`\`json
{
  "success": true,
  "workflow": {
    "name": "اسم وصفي للـ Workflow",
    "nodes": [
      {
        "id": "unique-uuid-here",
        "name": "اسم الـ Node",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [250, 300],
        "parameters": {
          "url": "https://api.example.com/endpoint",
          "method": "POST",
          "authentication": "none",
          "sendHeaders": true,
          "headerParameters": {
            "parameters": [
              {"name": "Content-Type", "value": "application/json"}
            ]
          },
          "sendBody": true,
          "bodyParameters": {
            "parameters": []
          }
        }
      }
    ],
    "connections": {
      "Start": {
        "main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]
      }
    },
    "settings": {
      "executionOrder": "v1"
    }
  },
  "explanation": "شرح مفصل لكيفية عمل الـ Workflow خطوة بخطوة",
  "requiredCredentials": ["API Keys أو credentials المطلوبة"],
  "createdInN8n": false,
  "n8nWorkflowId": null
}
\`\`\`

⚠️ مهم: يجب أن يكون ردك JSON فقط بدون أي نص إضافي.`;
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
            'wavespeed': 'Wavespeed AI API',
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
