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
    task_url?: string;
    createdAt?: string;
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
        } else {
            logger.info(`✅ Manus API key configured (length: ${this.apiKey.length}, starts with: ${this.apiKey.substring(0, 5)}...)`);
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
            logger.info('Creating Manus task with prompt length: ' + request.prompt.length);

            const response = await this.client.post('/tasks', {
                prompt: request.prompt,
                agentProfile: request.agentProfile || this.defaultProfile,
            });

            logger.info('Manus API response: ' + JSON.stringify(response.data).substring(0, 500));

            // Handle different response structures
            const rawData = response.data.data || response.data;

            // Manus API returns task_id, normalize to id
            const taskId = rawData.task_id || rawData.id;

            if (!taskId) {
                logger.error('Invalid Manus response - no task ID: ' + JSON.stringify(response.data));
                throw new Error('Manus API did not return a task ID');
            }

            // Normalize response to have consistent id field
            return {
                id: taskId,
                status: rawData.status || 'pending',
                result: rawData.result,
                error: rawData.error,
                task_url: rawData.task_url,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                logger.error('Manus API error: ' + JSON.stringify(error.response?.data));
                throw new Error(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
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
            const rawData = response.data.data || response.data;

            // Normalize task_id to id
            return {
                id: rawData.task_id || rawData.id || taskId,
                status: rawData.status || 'pending',
                result: rawData.result,
                error: rawData.error,
                task_url: rawData.task_url,
            };
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

## الخطوة 3: 🛑 كشف الأخطاء الخارجية 🛑
**قبل أي إصلاح، تحقق إذا كان الخطأ خارج نطاق التحكم:**

### أخطاء لا يمكن إصلاحها (تحليل فقط بدون تنفيذ):
- ❌ **نفاد الرصيد/Credits** (limit reached, quota exceeded, credits exhausted)
- ❌ **خطة مجانية محدودة** (free plan limit, upgrade required)
- ❌ **حساب معلق** (account suspended, banned)
- ❌ **مشاكل دفع** (payment failed, billing issue)
- ❌ **صلاحيات ناقصة** (insufficient permissions on external service)

### إذا اكتشفت خطأ خارجي:
1. **لا تحاول تنفيذ الـ workflow**
2. **لا تحاول الإصلاح التلقائي**
3. **أعطِ تحليل وتوصيات فقط**
4. **اضبط \`success: false\` و \`externalIssue: true\`**

## الخطوة 4: إصلاح الـ Node (إذا لم يكن خطأ خارجي)
- استخدم n8n API لتحديث الـ workflow مباشرة
- طبق الإصلاحات على الـ node المعطل

## الخطوة 5: ⚡ تشغيل الـ Workflow للتحقق ⚡
- شغّل الـ workflow عبر webhook أو API
- انتظر انتهاء التنفيذ
- جلب نتيجة التنفيذ

## الخطوة 6: 🔄 تكرار حتى النجاح (حد أقصى 3 محاولات) 🔄
- إذا فشل التنفيذ، حلل الخطأ الجديد
- **إذا كان خطأ خارجي، توقف فوراً وأعطِ توصيات**
- أصلح المشكلة الجديدة إذا كانت قابلة للإصلاح
- **حد أقصى 3 محاولات** لتوفير الموارد

## الخطوة 7: تأكيد النجاح أو التوصيات
- إذا نجح: وثّق كل التغييرات
- إذا كان خطأ خارجي: أعطِ توصيات واضحة للمستخدم

---

# ⚠️ قواعد مهمة:
1. **كشف الأخطاء الخارجية أولاً** - لا تضيع وقت في إصلاح ما لا يمكن إصلاحه
2. **حد أقصى 3 محاولات** - لا تستنفذ موارد المستخدم
3. **إذا ظهر خطأ billing/quota** - توقف فوراً وأعطِ توصيات
4. **استخدم n8n API بحكمة** - لديك الصلاحيات لكن استخدمها بمسؤولية

---

# 📤 صيغة الرد المطلوبة (JSON فقط):
\`\`\`json
{
  "success": true,
  "externalIssue": false,
  "summary": "The workflow is now working successfully! Here's a summary of what was fixed:",
  
  "recommendations": [
    "توصية 1 للمستخدم (إذا كان هناك خطأ خارجي)",
    "توصية 2 مثل: قم بترقية خطتك على المنصة"
  ],
  
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
        logger.info('Raw AI result length: ' + result.length);
        logger.info('Raw AI result (first 1000 chars): ' + result.substring(0, 1000));

        try {
            const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) ||
                result.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const json = jsonMatch[1] || jsonMatch[0];
                logger.info('Parsed JSON: ' + json.substring(0, 500));
                const parsed = JSON.parse(json);
                logger.info('Parsed result success: ' + parsed.success);
                return parsed;
            }

            const parsed = JSON.parse(result);
            logger.info('Direct parsed result success: ' + parsed.success);
            return parsed;
        } catch (error) {
            logger.error('Failed to parse AI result:', error);
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
