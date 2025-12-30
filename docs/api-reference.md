# 📘 API Reference

## نظرة عامة

توثيق شامل لجميع الـ API Endpoints في AI-HTTP.

### Base URL

```
Production: https://api.ai-http.com/v1
Development: http://localhost:4000/api/v1
```

### المصادقة

جميع الـ Endpoints (باستثناء `/auth`) تتطلب مصادقة عبر JWT Token.

```http
Authorization: Bearer <your_jwt_token>
```

### الاستجابات

#### نجاح (Success)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### خطأ (Error)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

### أكواد الحالة

| الكود | الوصف |
|-------|-------|
| 200 | نجاح |
| 201 | تم الإنشاء |
| 400 | طلب غير صالح |
| 401 | غير مصرح |
| 403 | ممنوع |
| 404 | غير موجود |
| 429 | طلبات كثيرة |
| 500 | خطأ في الخادم |

---

## 🔐 Authentication

### تسجيل حساب جديد

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### تسجيل الدخول

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### تحديث الـ Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### تسجيل الخروج

```http
POST /auth/logout
```

### تغيير كلمة المرور

```http
PUT /auth/password
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

### إعادة تعيين كلمة المرور

```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword456"
}
```

---

## 👤 Users

### الحصول على بيانات المستخدم الحالي

```http
GET /users/me
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "plan": "pro",
    "createdAt": "2024-01-15T10:30:00Z",
    "settings": {
      "theme": "dark",
      "language": "ar",
      "timezone": "Asia/Riyadh"
    }
  }
}
```

### تحديث بيانات المستخدم

```http
PUT /users/me
```

**Request Body:**
```json
{
  "name": "John Updated",
  "avatar": "https://...",
  "settings": {
    "theme": "dark"
  }
}
```

---

## 🔗 n8n Instances

### قائمة الـ Instances

```http
GET /instances
```

**Query Parameters:**
| المعامل | النوع | الوصف |
|---------|-------|-------|
| page | number | رقم الصفحة (default: 1) |
| limit | number | عدد العناصر (default: 10, max: 50) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "instances": [
      {
        "id": "inst_xyz789",
        "name": "Production n8n",
        "url": "https://my-n8n.cloud",
        "status": "connected",
        "workflowsCount": 25,
        "lastSync": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-10T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "pages": 1
    }
  }
}
```

### إضافة Instance جديد

```http
POST /instances
```

**Request Body:**
```json
{
  "name": "My n8n Instance",
  "url": "https://my-n8n.cloud",
  "apiKey": "n8n_api_key_here"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "inst_xyz789",
    "name": "My n8n Instance",
    "url": "https://my-n8n.cloud",
    "status": "connected",
    "workflowsCount": 0
  }
}
```

### الحصول على Instance

```http
GET /instances/:id
```

### تحديث Instance

```http
PUT /instances/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "apiKey": "new_api_key"
}
```

### حذف Instance

```http
DELETE /instances/:id
```

### اختبار الاتصال

```http
POST /instances/:id/test
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "version": "1.20.0",
    "responseTime": 245
  }
}
```

### مزامنة Workflows

```http
POST /instances/:id/sync
```

---

## 📋 Workflows

### قائمة Workflows

```http
GET /instances/:instanceId/workflows
```

**Query Parameters:**
| المعامل | النوع | الوصف |
|---------|-------|-------|
| page | number | رقم الصفحة |
| limit | number | عدد العناصر |
| status | string | active, inactive, all |
| search | string | بحث بالاسم |
| sort | string | name, createdAt, updatedAt |
| order | string | asc, desc |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "wf_abc123",
        "n8nId": "12345",
        "name": "Email Automation",
        "active": true,
        "nodes": [
          {
            "name": "Start",
            "type": "n8n-nodes-base.start"
          },
          {
            "name": "HTTP Request",
            "type": "n8n-nodes-base.httpRequest"
          }
        ],
        "lastExecution": {
          "status": "success",
          "finishedAt": "2024-01-15T10:30:00Z"
        },
        "createdAt": "2024-01-10T08:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### الحصول على Workflow

```http
GET /instances/:instanceId/workflows/:workflowId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "n8nId": "12345",
    "name": "Email Automation",
    "active": true,
    "nodes": [ ... ],
    "connections": { ... },
    "settings": { ... },
    "statistics": {
      "totalExecutions": 150,
      "successRate": 98.5,
      "averageTime": 1.2
    }
  }
}
```

### تشغيل Workflow

```http
POST /instances/:instanceId/workflows/:workflowId/execute
```

**Request Body:**
```json
{
  "data": {
    "key": "value"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "executionId": "exec_xyz789",
    "status": "running"
  }
}
```

### الحصول على حالة التنفيذ

```http
GET /instances/:instanceId/executions/:executionId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "exec_xyz789",
    "status": "success",
    "startedAt": "2024-01-15T10:30:00Z",
    "finishedAt": "2024-01-15T10:30:02Z",
    "duration": 2.3,
    "nodes": [
      {
        "name": "Start",
        "status": "success",
        "startTime": 0,
        "endTime": 0.1,
        "output": { ... }
      },
      {
        "name": "HTTP Request",
        "status": "success",
        "startTime": 0.1,
        "endTime": 1.5,
        "input": { ... },
        "output": { ... }
      }
    ]
  }
}
```

---

## 🛠️ HTTP Builder

### إنشاء Request

```http
POST /http-builder/requests
```

**Request Body:**
```json
{
  "name": "Get Users",
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": {
    "Authorization": "Bearer token123",
    "Content-Type": "application/json"
  },
  "params": {
    "page": "1",
    "limit": "10"
  },
  "body": null,
  "auth": {
    "type": "bearer",
    "token": "{{API_TOKEN}}"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "req_abc123",
    "name": "Get Users",
    "method": "GET",
    "url": "https://api.example.com/users",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### اختبار Request

```http
POST /http-builder/test
```

**Request Body:**
```json
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": { ... },
  "body": null
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": 200,
    "statusText": "OK",
    "headers": {
      "content-type": "application/json",
      "x-request-id": "abc123"
    },
    "body": {
      "users": [ ... ]
    },
    "timing": {
      "total": 245,
      "dns": 10,
      "tcp": 30,
      "tls": 50,
      "firstByte": 100,
      "download": 55
    },
    "size": {
      "headers": 512,
      "body": 2048
    }
  }
}
```

### تحويل cURL

```http
POST /http-builder/parse-curl
```

**Request Body:**
```json
{
  "curl": "curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{\"name\":\"John\"}'"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "method": "POST",
    "url": "https://api.example.com/users",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "name": "John"
    }
  }
}
```

### تصدير إلى cURL

```http
POST /http-builder/export-curl
```

**Request Body:**
```json
{
  "method": "POST",
  "url": "https://api.example.com/users",
  "headers": { ... },
  "body": { ... }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "curl": "curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -d '{\"name\":\"John\"}'"
  }
}
```

### حفظ إلى n8n Node

```http
POST /http-builder/save-to-node
```

**Request Body:**
```json
{
  "instanceId": "inst_xyz789",
  "workflowId": "wf_abc123",
  "nodeName": "HTTP Request",
  "request": {
    "method": "GET",
    "url": "https://api.example.com/users",
    "headers": { ... }
  }
}
```

---

## 🤖 AI Analysis

### تحليل خطأ

```http
POST /ai/analyze-error
```

**Request Body:**
```json
{
  "error": {
    "status": 401,
    "message": "Unauthorized",
    "body": {
      "error": "Invalid API key"
    }
  },
  "request": {
    "method": "GET",
    "url": "https://api.stripe.com/v1/customers",
    "headers": { ... }
  },
  "context": {
    "service": "stripe",
    "nodeName": "Get Customers"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "problem": "خطأ 401 - غير مصرح بالوصول",
      "cause": "الـ API Key غير صحيح أو منتهي الصلاحية",
      "solutions": [
        {
          "title": "تحقق من صحة الـ API Key",
          "description": "تأكد من نسخ الـ API Key بشكل صحيح من لوحة تحكم Stripe",
          "priority": "high"
        },
        {
          "title": "تحقق من نوع الـ API Key",
          "description": "تأكد من استخدام Secret Key وليس Publishable Key",
          "priority": "high"
        }
      ],
      "documentation": "https://stripe.com/docs/api/authentication",
      "suggestedFix": {
        "headers": {
          "Authorization": "Bearer sk_test_..."
        }
      }
    },
    "confidence": 0.95
  }
}
```

### الحصول على اقتراحات

```http
POST /ai/suggest
```

**Request Body:**
```json
{
  "description": "أريد جلب قائمة العملاء من Stripe",
  "service": "stripe"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "name": "List Customers",
        "method": "GET",
        "url": "https://api.stripe.com/v1/customers",
        "headers": {
          "Authorization": "Bearer {{STRIPE_SECRET_KEY}}"
        },
        "documentation": "https://stripe.com/docs/api/customers/list"
      }
    ]
  }
}
```

---

## 📚 Templates

### قائمة الخدمات

```http
GET /templates/services
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "stripe",
        "name": "Stripe",
        "icon": "https://...",
        "category": "payments",
        "endpointsCount": 45
      },
      {
        "id": "shopify",
        "name": "Shopify",
        "icon": "https://...",
        "category": "ecommerce",
        "endpointsCount": 120
      }
    ]
  }
}
```

### قائمة Endpoints لخدمة

```http
GET /templates/services/:serviceId/endpoints
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "endpoints": [
      {
        "id": "list-customers",
        "name": "List Customers",
        "method": "GET",
        "path": "/v1/customers",
        "description": "جلب قائمة العملاء"
      },
      {
        "id": "create-customer",
        "name": "Create Customer",
        "method": "POST",
        "path": "/v1/customers",
        "description": "إنشاء عميل جديد"
      }
    ]
  }
}
```

### الحصول على Template

```http
GET /templates/services/:serviceId/endpoints/:endpointId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "template": {
      "method": "POST",
      "url": "https://api.stripe.com/v1/customers",
      "headers": {
        "Authorization": "Bearer {{STRIPE_SECRET_KEY}}",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": {
        "email": "{{EMAIL}}",
        "name": "{{NAME}}"
      },
      "variables": [
        {
          "name": "STRIPE_SECRET_KEY",
          "description": "Stripe Secret API Key",
          "required": true
        },
        {
          "name": "EMAIL",
          "description": "Customer email",
          "required": true
        }
      ],
      "documentation": "https://stripe.com/docs/api/customers/create"
    }
  }
}
```

---

## 📊 Analytics

### إحصائيات المستخدم

```http
GET /analytics/overview
```

**Query Parameters:**
| المعامل | النوع | الوصف |
|---------|-------|-------|
| period | string | day, week, month, year |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "stats": {
      "totalRequests": 1250,
      "successfulRequests": 1180,
      "failedRequests": 70,
      "successRate": 94.4,
      "aiAnalyses": 45,
      "timeSaved": "12h 30m"
    },
    "chart": [
      { "date": "2024-01-01", "requests": 42, "errors": 2 },
      { "date": "2024-01-02", "requests": 38, "errors": 1 }
    ]
  }
}
```

### الأخطاء الشائعة

```http
GET /analytics/common-errors
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "errors": [
      {
        "code": 401,
        "message": "Unauthorized",
        "count": 25,
        "percentage": 35.7
      },
      {
        "code": 404,
        "message": "Not Found",
        "count": 15,
        "percentage": 21.4
      }
    ]
  }
}
```

---

## 🔑 API Keys

### قائمة API Keys

```http
GET /api-keys
```

### إنشاء API Key

```http
POST /api-keys
```

**Request Body:**
```json
{
  "name": "Production Key",
  "permissions": ["read", "write", "execute"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "key_abc123",
    "name": "Production Key",
    "key": "aihttp_sk_abc123xyz...",
    "permissions": ["read", "write", "execute"],
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "احفظ الـ API Key، لن يظهر مرة أخرى"
}
```

### حذف API Key

```http
DELETE /api-keys/:id
```

---

## 🔄 Webhooks

### قائمة Webhooks

```http
GET /webhooks
```

### إنشاء Webhook

```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["execution.completed", "execution.failed"],
  "secret": "optional_secret"
}
```

### اختبار Webhook

```http
POST /webhooks/:id/test
```

---

## 📝 Rate Limiting

| الخطة | الحد | الفترة |
|-------|------|--------|
| Free | 100 | ساعة |
| Pro | 1000 | ساعة |
| Team | 5000 | ساعة |
| Enterprise | غير محدود | - |

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705320000
```

**عند تجاوز الحد (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "تجاوزت الحد المسموح. حاول بعد 5 دقائق",
    "retryAfter": 300
  }
}
```
