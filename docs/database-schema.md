# 🗄️ توثيق قاعدة البيانات (Database Schema)

## نظرة عامة

نستخدم **PostgreSQL** كقاعدة بيانات رئيسية مع **Prisma ORM** للتفاعل معها.

---

## 📊 ERD (Entity Relationship Diagram)

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      Users       │       │    Instances     │       │    Workflows     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id          PK   │──┐    │ id          PK   │──┐    │ id          PK   │
│ email            │  │    │ userId      FK ◄─┼──┘    │ instanceId  FK ◄─┼──┐
│ password         │  │    │ name             │       │ n8nId            │  │
│ name             │  │    │ url              │       │ name             │  │
│ avatar           │  │    │ apiKey           │   ┌───│ active           │  │
│ plan             │  │    │ status           │   │   │ nodes            │  │
│ settings         │  │    │ lastSync         │   │   │ connections      │  │
│ emailVerified    │  │    │ createdAt        │   │   │ settings         │  │
│ createdAt        │  │    │ updatedAt        │   │   │ createdAt        │  │
│ updatedAt        │  │    └──────────────────┘   │   │ updatedAt        │  │
└──────────────────┘  │                           │   └──────────────────┘  │
         │            │                           │              │           │
         │            │    ┌──────────────────┐   │              │           │
         │            │    │   Executions     │   │              │           │
         │            │    ├──────────────────┤   │              │           │
         │            │    │ id          PK   │   │              │           │
         │            │    │ workflowId  FK ◄─┼───┼──────────────┘           │
         │            │    │ n8nExecId        │   │                          │
         │            │    │ status           │   │                          │
         │            │    │ mode             │   │                          │
         │            │    │ data             │   │                          │
         │            │    │ error            │   │                          │
         │            │    │ startedAt        │   │                          │
         │            │    │ finishedAt       │   │                          │
         │            │    └──────────────────┘   │                          │
         │            │                           │                          │
         │            │    ┌──────────────────┐   │    ┌──────────────────┐  │
         │            │    │    Requests      │   │    │     ApiKeys      │  │
         │            │    ├──────────────────┤   │    ├──────────────────┤  │
         │            └───▶│ userId      FK   │   │    │ id          PK   │  │
         │                 │ name             │   │    │ userId      FK ◄─┼──┘
         │                 │ method           │   │    │ name             │
         │                 │ url              │   │    │ key              │
         │                 │ headers          │   │    │ permissions      │
         │                 │ params           │   │    │ lastUsedAt       │
         │                 │ body             │   │    │ expiresAt        │
         │                 │ auth             │   │    │ createdAt        │
         │                 │ createdAt        │   │    └──────────────────┘
         │                 │ updatedAt        │   │
         │                 └──────────────────┘   │
         │                                        │
         │            ┌──────────────────┐        │
         │            │   AiAnalyses     │        │
         │            ├──────────────────┤        │
         └───────────▶│ userId      FK   │        │
                      │ executionId FK ◄─┼────────┘
                      │ errorData        │
                      │ analysis         │
                      │ suggestions      │
                      │ confidence       │
                      │ createdAt        │
                      └──────────────────┘
```

---

## 📝 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum Plan {
  FREE
  PRO
  TEAM
  ENTERPRISE
}

enum InstanceStatus {
  CONNECTED
  DISCONNECTED
  ERROR
  SYNCING
}

enum ExecutionStatus {
  RUNNING
  SUCCESS
  FAILED
  WAITING
  CANCELED
}

enum HttpMethod {
  GET
  POST
  PUT
  PATCH
  DELETE
  HEAD
  OPTIONS
}

// ==================== MODELS ====================

/// المستخدمون في النظام
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  password       String
  name           String
  avatar         String?
  plan           Plan      @default(FREE)
  settings       Json      @default("{}")
  emailVerified  Boolean   @default(false)
  verifyToken    String?   @unique
  resetToken     String?   @unique
  resetTokenExp  DateTime?
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?

  // Relations
  instances      Instance[]
  requests       Request[]
  apiKeys        ApiKey[]
  aiAnalyses     AiAnalysis[]
  sessions       Session[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([email])
  @@map("users")
}

/// جلسات المستخدم
model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  token        String   @unique
  refreshToken String   @unique
  userAgent    String?
  ipAddress    String?
  
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@map("sessions")
}

/// حسابات n8n المتصلة
model Instance {
  id           String         @id @default(cuid())
  userId       String
  user         User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name         String
  url          String
  apiKey       String         // مشفر
  status       InstanceStatus @default(DISCONNECTED)
  version      String?
  lastSync     DateTime?
  lastError    String?
  
  // Relations
  workflows    Workflow[]

  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@unique([userId, url])
  @@index([userId])
  @@index([status])
  @@map("instances")
}

/// الـ Workflows من n8n
model Workflow {
  id           String    @id @default(cuid())
  instanceId   String
  instance     Instance  @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  
  n8nId        String
  name         String
  active       Boolean   @default(false)
  nodes        Json      // مصفوفة الـ nodes
  connections  Json      // الاتصالات بين الـ nodes
  settings     Json      @default("{}")
  tags         String[]  @default([])
  
  // Statistics
  totalExecutions    Int @default(0)
  successfulExecutions Int @default(0)
  
  // Relations
  executions   Execution[]

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([instanceId, n8nId])
  @@index([instanceId])
  @@index([active])
  @@map("workflows")
}

/// تنفيذات الـ Workflows
model Execution {
  id             String          @id @default(cuid())
  workflowId     String
  workflow       Workflow        @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  n8nExecutionId String
  status         ExecutionStatus
  mode           String          // manual, webhook, trigger
  
  data           Json?           // بيانات التنفيذ
  error          Json?           // تفاصيل الخطأ
  
  startedAt      DateTime
  finishedAt     DateTime?
  duration       Float?          // بالثواني
  
  // Relations
  aiAnalyses     AiAnalysis[]

  @@unique([workflowId, n8nExecutionId])
  @@index([workflowId])
  @@index([status])
  @@index([startedAt])
  @@map("executions")
}

/// HTTP Requests المحفوظة
model Request {
  id           String     @id @default(cuid())
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name         String
  description  String?
  method       HttpMethod
  url          String
  headers      Json       @default("{}")
  params       Json       @default("{}")
  body         Json?
  auth         Json?      // نوع المصادقة وتفاصيلها
  
  // Metadata
  lastUsed     DateTime?
  usageCount   Int        @default(0)
  favorite     Boolean    @default(false)
  tags         String[]   @default([])
  
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([userId])
  @@index([method])
  @@map("requests")
}

/// مفاتيح API للمستخدمين
model ApiKey {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name         String
  key          String    @unique  // مشفر، يظهر مرة واحدة فقط
  keyPrefix    String              // أول 8 أحرف للعرض
  permissions  String[]  @default([])
  
  lastUsedAt   DateTime?
  expiresAt    DateTime?
  isRevoked    Boolean   @default(false)
  
  createdAt    DateTime  @default(now())

  @@index([userId])
  @@index([key])
  @@map("api_keys")
}

/// تحليلات AI للأخطاء
model AiAnalysis {
  id           String     @id @default(cuid())
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  executionId  String?
  execution    Execution? @relation(fields: [executionId], references: [id], onDelete: SetNull)
  
  errorData    Json       // بيانات الخطأ الأصلية
  requestData  Json?      // بيانات الـ request
  
  analysis     Json       // نتيجة التحليل
  suggestions  Json       // الحلول المقترحة
  confidence   Float      // نسبة الثقة (0-1)
  
  applied      Boolean    @default(false)  // هل تم تطبيق الإصلاح
  helpful      Boolean?   // تقييم المستخدم
  
  createdAt    DateTime   @default(now())

  @@index([userId])
  @@index([executionId])
  @@map("ai_analyses")
}

/// قوالب الخدمات
model Template {
  id           String   @id @default(cuid())
  
  serviceId    String   // stripe, shopify, etc.
  serviceName  String
  serviceIcon  String?
  category     String   // payments, ecommerce, etc.
  
  endpointId   String
  endpointName String
  description  String?
  
  method       HttpMethod
  urlTemplate  String
  headers      Json     @default("{}")
  bodyTemplate Json?
  
  variables    Json     @default("[]")  // المتغيرات المطلوبة
  documentation String?
  
  isOfficial   Boolean  @default(true)
  usageCount   Int      @default(0)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([serviceId, endpointId])
  @@index([serviceId])
  @@index([category])
  @@map("templates")
}

/// سجل التدقيق
model AuditLog {
  id           String   @id @default(cuid())
  
  userId       String?
  action       String   // user.login, instance.create, etc.
  resource     String   // نوع المورد
  resourceId   String?  // معرف المورد
  
  ipAddress    String?
  userAgent    String?
  
  success      Boolean
  details      Json?    // تفاصيل إضافية
  
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 📋 وصف الجداول

### Users (المستخدمون)

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | CUID | المعرف الفريد |
| email | String | البريد الإلكتروني (فريد) |
| password | String | كلمة المرور (مشفرة bcrypt) |
| name | String | اسم المستخدم |
| avatar | String? | رابط الصورة الشخصية |
| plan | Enum | خطة الاشتراك |
| settings | JSON | إعدادات المستخدم |
| twoFactorEnabled | Boolean | هل 2FA مُفعّل |

### Instances (حسابات n8n)

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | CUID | المعرف الفريد |
| userId | FK | مالك الحساب |
| name | String | اسم تعريفي |
| url | String | رابط n8n |
| apiKey | String | مفتاح API (مشفر) |
| status | Enum | حالة الاتصال |
| lastSync | DateTime? | آخر مزامنة |

### Workflows (الـ Workflows)

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | CUID | المعرف الفريد |
| instanceId | FK | الـ Instance التابع له |
| n8nId | String | معرف الـ workflow في n8n |
| name | String | اسم الـ workflow |
| active | Boolean | هل مُفعّل |
| nodes | JSON | قائمة الـ nodes |
| connections | JSON | الاتصالات بين الـ nodes |

### Executions (التنفيذات)

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | CUID | المعرف الفريد |
| workflowId | FK | الـ workflow المُنفَّذ |
| status | Enum | حالة التنفيذ |
| data | JSON? | بيانات التنفيذ |
| error | JSON? | تفاصيل الخطأ |
| startedAt | DateTime | وقت البدء |
| finishedAt | DateTime? | وقت الانتهاء |

### Requests (الـ HTTP Requests)

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | CUID | المعرف الفريد |
| userId | FK | المالك |
| name | String | اسم تعريفي |
| method | Enum | نوع الطلب |
| url | String | الرابط |
| headers | JSON | الـ Headers |
| body | JSON? | الـ Body |
| auth | JSON? | تفاصيل المصادقة |

---

## 🔄 Migrations

### إنشاء migration جديدة

```bash
# بعد تعديل schema.prisma
npx prisma migrate dev --name migration_name
```

### تطبيق migrations في الإنتاج

```bash
npx prisma migrate deploy
```

### إعادة تعيين قاعدة البيانات

```bash
# ⚠️ حذر: يحذف جميع البيانات
npx prisma migrate reset
```

---

## 🌱 Seeding

```typescript
// prisma/seed.ts
import { PrismaClient, Plan } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // مستخدم تجريبي
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.create({
    data: {
      email: 'demo@ai-http.com',
      password: hashedPassword,
      name: 'Demo User',
      plan: Plan.PRO,
      emailVerified: true
    }
  });

  // قوالب
  await prisma.template.createMany({
    data: [
      {
        serviceId: 'stripe',
        serviceName: 'Stripe',
        category: 'payments',
        endpointId: 'list-customers',
        endpointName: 'List Customers',
        method: 'GET',
        urlTemplate: 'https://api.stripe.com/v1/customers',
        headers: {
          'Authorization': 'Bearer {{STRIPE_SECRET_KEY}}'
        },
        variables: [
          {
            name: 'STRIPE_SECRET_KEY',
            description: 'Stripe Secret API Key',
            required: true
          }
        ]
      },
      // المزيد من القوالب...
    ]
  });

  console.log('Seeding completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```bash
# تشغيل الـ seed
npx prisma db seed
```

---

## 📊 Indexes المهمة

```sql
-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_instances_user_status ON instances(user_id, status);
CREATE INDEX idx_workflows_instance ON workflows(instance_id);
CREATE INDEX idx_executions_workflow_status ON executions(workflow_id, status);
CREATE INDEX idx_executions_started_at ON executions(started_at DESC);
CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

---

## 🔐 الأمان

### تشفير API Keys

```typescript
// قبل الحفظ
const encryptedKey = encrypt(apiKey, ENCRYPTION_KEY);
await prisma.instance.create({
  data: { ...data, apiKey: encryptedKey }
});

// عند القراءة
const instance = await prisma.instance.findUnique({ where: { id } });
const decryptedKey = decrypt(instance.apiKey, ENCRYPTION_KEY);
```

### حماية البيانات الحساسة

```typescript
// استبعاد الحقول الحساسة
const userSelect = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  plan: true,
  // password: false, // لا تُرجع أبداً
};

const user = await prisma.user.findUnique({
  where: { id },
  select: userSelect
});
```

---

## 📈 الأداء

### Query Optimization

```typescript
// استخدم include بحذر
const instance = await prisma.instance.findUnique({
  where: { id },
  include: {
    workflows: {
      take: 10, // حدد العدد
      orderBy: { updatedAt: 'desc' }
    }
  }
});

// استخدم select للحقول المطلوبة فقط
const workflows = await prisma.workflow.findMany({
  where: { instanceId },
  select: {
    id: true,
    name: true,
    active: true
  }
});
```

### Connection Pooling

```env
# في .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
```

---

## 🔄 Backup & Recovery

### Backup يومي

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
gzip backup_$DATE.sql
aws s3 cp backup_$DATE.sql.gz s3://backups/
```

### Restore

```bash
gunzip backup_20240115.sql.gz
psql $DATABASE_URL < backup_20240115.sql
```
