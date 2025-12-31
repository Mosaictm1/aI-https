# 🏗️ Architecture Documentation

## نظرة عامة على الهيكلة

AI-HTTP مبني على هيكلة **Microservices-inspired Monolith** تجمع بين بساطة الـ Monolith وقابلية التوسع.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│     ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│     │   Web    │    │  Mobile  │    │   CLI    │    │   API    │       │
│     └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘       │
│          │               │               │               │              │
└──────────┼───────────────┼───────────────┼───────────────┼──────────────┘
           │               │               │               │
           └───────────────┴───────────────┴───────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
              │   CDN     │  │    LB     │  │  WebSocket│
              │  (Vercel) │  │           │  │   Server  │
              └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
                    │              │              │
┌───────────────────┼──────────────┼──────────────┼───────────────────────┐
│                   │         API GATEWAY         │                        │
│                   └──────────────┴──────────────┘                        │
│                                  │                                        │
│     ┌────────────────────────────┼────────────────────────────┐          │
│     │                            │                            │          │
│     ▼                            ▼                            ▼          │
│ ┌────────┐                 ┌────────┐                 ┌────────┐         │
│ │  Auth  │                 │  Core  │                 │   AI   │         │
│ │Service │                 │Service │                 │Service │         │
│ └───┬────┘                 └───┬────┘                 └───┬────┘         │
│     │                          │                          │              │
│     │     ┌────────────────────┼────────────────────┐     │              │
│     │     │                    │                    │     │              │
│     ▼     ▼                    ▼                    ▼     ▼              │
│ ┌─────────────┐         ┌─────────────┐         ┌─────────────┐         │
│ │ PostgreSQL  │         │    Redis    │         │  Bull Queue │         │
│ │  (Primary)  │         │   (Cache)   │         │   (Jobs)    │         │
│ └─────────────┘         └─────────────┘         └─────────────┘         │
│                                                                          │
│                          BACKEND SERVICES                                │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
   ┌──────────┐             ┌──────────┐             ┌──────────┐
   │  n8n API │             │ Manus    │             │ OpenAPI  │
   │          │             │   Max    │             │  Docs    │
   └──────────┘             └──────────┘             └──────────┘
                     EXTERNAL SERVICES
```

---

## 📁 بنية المشروع

```
ai-http/
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 config/           # إعدادات التطبيق
│   │   │   ├── database.ts      # إعدادات Prisma
│   │   │   ├── redis.ts         # إعدادات Redis
│   │   │   ├── queue.ts         # إعدادات Bull
│   │   │   └── env.ts           # متغيرات البيئة
│   │   │
│   │   ├── 📁 modules/          # الوحدات الرئيسية
│   │   │   ├── 📁 auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   └── auth.dto.ts
│   │   │   │
│   │   │   ├── 📁 users/
│   │   │   ├── 📁 instances/
│   │   │   ├── 📁 workflows/
│   │   │   ├── 📁 http-builder/
│   │   │   ├── 📁 ai/
│   │   │   └── 📁 templates/
│   │   │
│   │   ├── 📁 shared/           # كود مشترك
│   │   │   ├── 📁 middleware/
│   │   │   ├── 📁 guards/
│   │   │   ├── 📁 decorators/
│   │   │   ├── 📁 filters/
│   │   │   ├── 📁 pipes/
│   │   │   └── 📁 utils/
│   │   │
│   │   ├── 📁 integrations/     # تكاملات خارجية
│   │   │   ├── n8n.client.ts
│   │   │   ├── manus.client.ts
│   │   │   └── openapi.parser.ts
│   │   │
│   │   ├── 📁 jobs/             # Background Jobs
│   │   │   ├── sync.job.ts
│   │   │   └── cleanup.job.ts
│   │   │
│   │   └── main.ts              # نقطة البداية
│   │
│   ├── 📁 prisma/
│   │   ├── schema.prisma        # تعريف الجداول
│   │   ├── 📁 migrations/       # الترحيلات
│   │   └── seed.ts              # بيانات أولية
│   │
│   ├── 📁 tests/
│   │   ├── 📁 unit/
│   │   ├── 📁 integration/
│   │   └── 📁 e2e/
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/       # المكونات
│   │   │   ├── 📁 ui/           # Shadcn components
│   │   │   ├── 📁 shared/       # مكونات مشتركة
│   │   │   ├── 📁 layouts/      # التخطيطات
│   │   │   └── 📁 features/     # مكونات خاصة بالميزات
│   │   │
│   │   ├── 📁 pages/            # الصفحات
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Workflows.tsx
│   │   │   ├── HttpBuilder.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── 📁 hooks/            # Custom Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useWorkflows.ts
│   │   │   └── useSocket.ts
│   │   │
│   │   ├── 📁 stores/           # Zustand Stores
│   │   │   ├── authStore.ts
│   │   │   ├── workflowStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── 📁 services/         # API Services
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   └── workflow.service.ts
│   │   │
│   │   ├── 📁 lib/              # أدوات مساعدة
│   │   │   ├── utils.ts
│   │   │   └── validators.ts
│   │   │
│   │   ├── 📁 styles/
│   │   │   └── globals.css
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── 📁 docs/                     # التوثيق
├── 📁 scripts/                  # سكربتات مساعدة
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

---

## 🔧 Backend Architecture

### طبقات التطبيق

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│                    (Controllers, Routes)                     │
├─────────────────────────────────────────────────────────────┤
│                      Application Layer                       │
│                   (Services, Use Cases)                      │
├─────────────────────────────────────────────────────────────┤
│                       Domain Layer                           │
│              (Entities, Business Logic)                      │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                      │
│           (Database, External APIs, Cache)                   │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

كل وحدة تتبع نفس الهيكل:

```typescript
// auth.module.ts
export const authModule = {
  controller: AuthController,
  service: AuthService,
  routes: authRoutes,
  dto: AuthDto
};
```

#### Controller (معالجة الطلبات)

```typescript
// auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);
    return res.json({ success: true, data: result });
  }
}
```

#### Service (منطق الأعمال)

```typescript
// auth.service.ts
import { prisma } from '@/config/database';
import { hashPassword, comparePassword } from '@/shared/utils/crypto';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !await comparePassword(password, user.password)) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = generateToken(user);
    return { user, token };
  }
}
```

#### DTO (التحقق من البيانات)

```typescript
// auth.dto.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type LoginDto = z.infer<typeof loginSchema>;
```

### Middleware Pipeline

```
Request
   │
   ▼
┌─────────────┐
│   Logger    │ ──► تسجيل الطلب
└─────────────┘
   │
   ▼
┌─────────────┐
│  Rate Limit │ ──► التحقق من الحد
└─────────────┘
   │
   ▼
┌─────────────┐
│    Auth     │ ──► التحقق من الهوية
└─────────────┘
   │
   ▼
┌─────────────┐
│  Validator  │ ──► التحقق من البيانات
└─────────────┘
   │
   ▼
┌─────────────┐
│  Controller │ ──► معالجة الطلب
└─────────────┘
   │
   ▼
Response
```

### Error Handling

```typescript
// error-handler.middleware.ts
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error', { error });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}
```

---

## 💾 Database Schema

### ERD (Entity Relationship Diagram)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Users     │       │  Instances   │       │  Workflows   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │───┐   │ id           │───┐   │ id           │
│ email        │   │   │ userId    ◄──┼───┘   │ instanceId◄──┼───┐
│ password     │   │   │ name         │       │ n8nId        │   │
│ name         │   │   │ url          │       │ name         │   │
│ plan         │   │   │ apiKey       │   ┌───│ active       │   │
│ settings     │   │   │ status       │   │   │ nodes        │   │
│ createdAt    │   │   │ createdAt    │   │   │ connections  │   │
└──────────────┘   │   └──────────────┘   │   └──────────────┘   │
                   │                       │                      │
                   │   ┌──────────────┐   │   ┌──────────────┐   │
                   │   │  Executions  │   │   │   Requests   │   │
                   │   ├──────────────┤   │   ├──────────────┤   │
                   │   │ id           │   │   │ id           │   │
                   └───│ userId    ◄──┼───┼───│ userId    ◄──┼───┘
                       │ workflowId◄──┼───┘   │ name         │
                       │ status       │       │ method       │
                       │ data         │       │ url          │
                       │ startedAt    │       │ config       │
                       │ finishedAt   │       │ createdAt    │
                       └──────────────┘       └──────────────┘
```

### Prisma Schema

```prisma
// schema.prisma

model User {
  id          String     @id @default(cuid())
  email       String     @unique
  password    String
  name        String
  avatar      String?
  plan        Plan       @default(FREE)
  settings    Json       @default("{}")
  
  instances   Instance[]
  requests    Request[]
  apiKeys     ApiKey[]
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Instance {
  id            String     @id @default(cuid())
  userId        String
  user          User       @relation(fields: [userId], references: [id])
  
  name          String
  url           String
  apiKey        String     // Encrypted
  status        Status     @default(DISCONNECTED)
  lastSync      DateTime?
  
  workflows     Workflow[]
  
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  
  @@index([userId])
}

model Workflow {
  id            String     @id @default(cuid())
  instanceId    String
  instance      Instance   @relation(fields: [instanceId], references: [id])
  
  n8nId         String
  name          String
  active        Boolean    @default(false)
  nodes         Json
  connections   Json
  settings      Json       @default("{}")
  
  executions    Execution[]
  
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  
  @@unique([instanceId, n8nId])
  @@index([instanceId])
}

model Execution {
  id            String     @id @default(cuid())
  workflowId    String
  workflow      Workflow   @relation(fields: [workflowId], references: [id])
  
  n8nExecutionId String
  status        ExecStatus
  mode          String
  data          Json
  error         Json?
  
  startedAt     DateTime
  finishedAt    DateTime?
  
  @@index([workflowId])
  @@index([status])
}

model Request {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  
  name        String
  method      HttpMethod
  url         String
  headers     Json       @default("{}")
  params      Json       @default("{}")
  body        Json?
  auth        Json?
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  @@index([userId])
}

model ApiKey {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  
  name        String
  key         String     @unique
  permissions String[]
  lastUsedAt  DateTime?
  
  createdAt   DateTime   @default(now())
  
  @@index([userId])
  @@index([key])
}

enum Plan {
  FREE
  PRO
  TEAM
  ENTERPRISE
}

enum Status {
  CONNECTED
  DISCONNECTED
  ERROR
}

enum ExecStatus {
  RUNNING
  SUCCESS
  FAILED
  WAITING
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
```

---

## ⚛️ Frontend Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Sidebar
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── UserMenu
│   │
│   ├── Header
│   │   ├── Breadcrumb
│   │   ├── Search
│   │   └── Notifications
│   │
│   └── Content
│       ├── Dashboard
│       │   ├── StatsCards
│       │   ├── RecentWorkflows
│       │   └── ErrorsChart
│       │
│       ├── Workflows
│       │   ├── WorkflowList
│       │   ├── WorkflowCard
│       │   └── WorkflowDebugger
│       │
│       ├── HttpBuilder
│       │   ├── MethodSelector
│       │   ├── UrlInput
│       │   ├── TabPanel
│       │   │   ├── HeadersTab
│       │   │   ├── ParamsTab
│       │   │   ├── BodyTab
│       │   │   └── AuthTab
│       │   ├── ResponseViewer
│       │   └── ActionButtons
│       │
│       └── Settings
│           ├── Profile
│           ├── Instances
│           └── ApiKeys
│
└── Modals
    ├── AddInstanceModal
    ├── ConfirmModal
    └── ErrorModal
```

### State Management (Zustand)

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { user, token } = await authService.login(email, password);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
);
```

### API Layer

```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Custom Hooks

```typescript
// hooks/useWorkflows.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '@/services/workflow.service';

export function useWorkflows(instanceId: string) {
  return useQuery({
    queryKey: ['workflows', instanceId],
    queryFn: () => workflowService.getAll(instanceId),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useExecuteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ instanceId, workflowId, data }) => 
      workflowService.execute(instanceId, workflowId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workflows', variables.instanceId]
      });
    }
  });
}
```

---

## 🔄 Real-time Communication

### Socket.io Events

```typescript
// Backend
io.on('connection', (socket) => {
  // Join user room
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
  });

  // Execution updates
  socket.on('execution:subscribe', (executionId) => {
    socket.join(`execution:${executionId}`);
  });
});

// Emit execution update
function emitExecutionUpdate(executionId: string, data: any) {
  io.to(`execution:${executionId}`).emit('execution:update', data);
}
```

```typescript
// Frontend
import { io } from 'socket.io-client';
import { useEffect } from 'react';

export function useExecutionUpdates(executionId: string, onUpdate: (data: any) => void) {
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL);

    socket.emit('execution:subscribe', executionId);
    socket.on('execution:update', onUpdate);

    return () => {
      socket.off('execution:update', onUpdate);
      socket.disconnect();
    };
  }, [executionId]);
}
```

---

## 🔐 Security Architecture

### Authentication Flow

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│ Client  │      │  Auth   │      │   DB    │
└────┬────┘      └────┬────┘      └────┬────┘
     │                │                │
     │  1. Login      │                │
     │ ──────────────►│                │
     │                │  2. Verify     │
     │                │ ──────────────►│
     │                │                │
     │                │  3. User data  │
     │                │ ◄──────────────│
     │                │                │
     │  4. JWT Token  │                │
     │ ◄──────────────│                │
     │                │                │
     │  5. API Call   │                │
     │  (with token)  │                │
     │ ──────────────►│                │
     │                │  6. Validate   │
     │                │    & Process   │
     │                │                │
     │  7. Response   │                │
     │ ◄──────────────│                │
     │                │                │
```

### Data Encryption

```typescript
// Encrypt sensitive data (API Keys)
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, content] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## 📊 Caching Strategy

### Redis Cache Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Cache Layers                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  L1: In-Memory (LRU)     │  TTL: 1 min   │  Size: 100 items │
│  ───────────────────────────────────────────────────────── │
│  User sessions, frequent queries                             │
│                                                              │
│  L2: Redis                │  TTL: varies │  Size: unlimited  │
│  ───────────────────────────────────────────────────────── │
│  API responses, computed data, rate limits                   │
│                                                              │
│  L3: Database             │  Persistent  │                   │
│  ───────────────────────────────────────────────────────── │
│  All data                                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Cache Keys Convention

```typescript
const cacheKeys = {
  user: (id: string) => `user:${id}`,
  workflows: (instanceId: string) => `workflows:${instanceId}`,
  execution: (id: string) => `execution:${id}`,
  rateLimit: (userId: string) => `ratelimit:${userId}`,
  template: (serviceId: string) => `template:${serviceId}`
};
```

---

## 📈 Monitoring & Logging

### Logging Structure

```typescript
// Winston Logger Configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-http' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

### Metrics Collection

```typescript
// Prometheus-style metrics
const metrics = {
  httpRequestsTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'path', 'status']
  }),
  
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'path'],
    buckets: [0.1, 0.5, 1, 2, 5]
  }),
  
  activeConnections: new Gauge({
    name: 'active_connections',
    help: 'Number of active connections'
  })
};
```

---

## 🚀 Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare                            │
│                    (DNS, DDoS Protection)                    │
└────────────────────────────┬────────────────────────────────┘
                             │
           ┌─────────────────┴─────────────────┐
           │                                   │
    ┌──────▼──────┐                     ┌──────▼──────┐
    │   Vercel    │                     │   Render    │
    │  (Frontend) │                     │  (Backend)  │
    └─────────────┘                     └──────┬──────┘
                                               │
                    ┌──────────────────────────┤
                    │                          │
             ┌──────▼──────┐            ┌──────▼──────┐
             │  Supabase   │            │   Render    │
             │ (PostgreSQL)│            │   (Redis)   │
             └─────────────┘            └─────────────┘
```

### Docker Compose (Development)

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/ai_http
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - db
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:4000
    volumes:
      - ./frontend:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ai_http
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 📚 المراجع

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Patterns](https://reactpatterns.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/caching/)
