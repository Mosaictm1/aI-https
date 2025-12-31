# 🚀 دليل النشر (Deployment Guide)

## نظرة عامة

هذا الدليل يغطي جميع خيارات نشر AI-HTTP من التطوير المحلي إلى الإنتاج على نطاق واسع.

---

## 📋 المتطلبات

### الحد الأدنى

| المورد | Development | Production |
|--------|-------------|------------|
| CPU | 2 cores | 4 cores |
| RAM | 4GB | 8GB |
| Storage | 10GB | 50GB |
| Node.js | 18+ | 18+ |
| PostgreSQL | 14+ | 15+ |
| Redis | 6+ | 7+ |

### الخدمات الخارجية

- **Manus Max API**: لتحليل AI - [الوثائق](https://open.manus.ai/docs)
- **SMTP**: لإرسال البريد
- **S3/R2**: لتخزين الملفات (اختياري)

---

## 🖥️ التطوير المحلي

### Docker Compose (موصى به)

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
      - JWT_SECRET=dev-secret-key
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - db
      - redis
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:4000
      - VITE_SOCKET_URL=http://localhost:4000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

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

```bash
# تشغيل
docker-compose -f docker-compose.dev.yml up

# إعادة بناء
docker-compose -f docker-compose.dev.yml up --build

# إيقاف
docker-compose -f docker-compose.dev.yml down
```

### بدون Docker

```bash
# 1. قاعدة البيانات
psql -U postgres -c "CREATE DATABASE ai_http;"

# 2. Redis
redis-server

# 3. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev

# 4. Frontend (terminal جديد)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

---

## ☁️ Render + Supabase + Vercel (موصى به)

هذا الـ Stack الموصى به للإنتاج:

```
┌───────────────────────────────────────────────────────┐
│                Production Stack                       │
├──────────────────┬─────────────────┬─────────────────┤
│     Frontend     │    Backend     │    Database     │
│                  │                │                 │
│     Vercel       │    Render      │    Supabase     │
│                  │                │   (PostgreSQL)  │
└──────────────────┴─────────────────┴─────────────────┘
```

### 1️⃣ إعداد Supabase (قاعدة البيانات)

#### الخطوة 1: إنشاء المشروع

1. اذهب إلى [Supabase](https://supabase.com/)
2. سجّل دخول أو أنشئ حساب
3. اضغط **New Project**
4. أدخل:
   - **Name**: ai-http-db
   - **Database Password**: كلمة مرور قوية
   - **Region**: أقرب منطقة لمستخدميك
5. اضغط **Create new project**

#### الخطوة 2: الحصول على Connection String

1. اذهب إلى **Settings** > **Database**
2. انسخ **Connection string** > **URI**
3. استبدل `[YOUR-PASSWORD]` بكلمة المرور

```env
# Connection String (للـ Prisma - مع connection pooling)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (للـ migrations)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

#### الخطوة 3: تحديث Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

### 2️⃣ إعداد Render (Backend)

#### الخطوة 1: إنشاء Web Service

1. اذهب إلى [Render](https://render.com/)
2. سجّل دخول أو أنشئ حساب
3. اضغط **New** > **Web Service**
4. اربط مستودع GitHub

#### الخطوة 2: إعدادات الخدمة

| الإعداد | القيمة |
|---------|--------|
| **Name** | ai-http-backend |
| **Region** | Frankfurt (EU) أو الأقرب |
| **Branch** | main |
| **Root Directory** | backend |
| **Runtime** | Node |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | Starter ($7/شهر) أو Standard |

#### الخطوة 3: المتغيرات البيئية

اضغط **Environment** وأضف:

```env
# Server
NODE_ENV=production
PORT=4000

# Supabase Database
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key

# AI
MANUS_API_KEY=your-manus-api-key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app
```

#### الخطوة 4: إعداد Redis (اختياري)

1. في Render Dashboard، اضغط **New** > **Redis**
2. اختر **Free** أو **Starter**
3. انسخ **Internal URL**
4. أضفه كمتغير `REDIS_URL`

#### الخطوة 5: النشر

1. اضغط **Create Web Service**
2. انتظر اكتمال البناء (قد يستغرق 5-10 دقائق)
3. انسخ الرابط: `https://ai-http-backend.onrender.com`

#### render.yaml (اختياري - Infrastructure as Code)

```yaml
# render.yaml
services:
  - type: web
    name: ai-http-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start:prod
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
```

---

### 3️⃣ إعداد Vercel (Frontend)

#### الخطوة 1: إنشاء المشروع

```bash
# باستخدام CLI
npm i -g vercel
vercel login

cd frontend
vercel
```

أو من Dashboard:

1. اذهب إلى [Vercel](https://vercel.com/)
2. اضغط **Add New** > **Project**
3. استورد المستودع من GitHub

#### الخطوة 2: إعدادات البناء

| الإعداد | القيمة |
|---------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | frontend |
| **Build Command** | `npm run build` |
| **Output Directory** | dist |
| **Install Command** | `npm install` |

#### الخطوة 3: المتغيرات البيئية

```env
VITE_API_URL=https://ai-http-backend.onrender.com
VITE_SOCKET_URL=https://ai-http-backend.onrender.com
```

#### الخطوة 4: vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

#### الخطوة 5: النشر

1. اضغط **Deploy**
2. انتظر اكتمال البناء
3. انسخ الرابط: `https://your-app.vercel.app`

---

### 4️⃣ ربط المكونات

#### تحديث Render CORS

أضف رابط Vercel إلى `FRONTEND_URL`:

```env
FRONTEND_URL=https://your-app.vercel.app
```

#### تشغيل Migrations

في Render، أضف **Build Command** محدّث:

```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

---

## 🐳 Docker Production

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["npm", "run", "start:prod"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend:
    image: ai-http-backend:latest
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - MANUS_API_KEY=${MANUS_API_KEY}
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - ai-http-network

  frontend:
    image: ai-http-frontend:latest
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - ai-http-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ai_http
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - ai-http-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - ai-http-network

networks:
  ai-http-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

---

## ☸️ Kubernetes

### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-http
```

### Backend Deployment

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: ai-http
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: your-registry/ai-http-backend:latest
          ports:
            - containerPort: 4000
          envFrom:
            - secretRef:
                name: backend-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Backend Service

```yaml
# k8s/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: ai-http
spec:
  selector:
    app: backend
  ports:
    - port: 4000
      targetPort: 4000
  type: ClusterIP
```

### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-http-ingress
  namespace: ai-http
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.ai-http.com
        - app.ai-http.com
      secretName: ai-http-tls
  rules:
    - host: api.ai-http.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 4000
    - host: app.ai-http.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

---

## 🔄 CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          curl -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            -H "Content-Type: application/json"

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

---

## 📊 المراقبة

### Health Check Endpoint

```typescript
// backend/src/health.controller.ts
import { Router } from 'express';
import { prisma } from './config/database';
import { redis } from './config/redis';

const router = Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'ok';
  } catch {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  try {
    await redis.ping();
    health.services.redis = 'ok';
  } catch {
    health.services.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
```

### Sentry Integration

```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 📝 Checklist للنشر

### قبل النشر

- [ ] اختبارات ناجحة
- [ ] متغيرات البيئة مُعدَّة
- [ ] Database migrations جاهزة
- [ ] SSL certificates صالحة
- [ ] Backups مُفعَّلة

### بعد النشر

- [ ] Health check ناجح
- [ ] Logs سليمة
- [ ] Monitoring يعمل
- [ ] Error tracking مُفعَّل
- [ ] اختبار يدوي للميزات الرئيسية

---

## 🆘 استكشاف الأخطاء

### مشاكل الاتصال بقاعدة البيانات

```bash
# تحقق من الاتصال
psql $DATABASE_URL -c "SELECT 1"

# تحقق من الـ migrations
npx prisma migrate status
```

### مشاكل Redis

```bash
# تحقق من الاتصال
redis-cli -u $REDIS_URL ping
```

### مشاكل الذاكرة

```bash
# زيادة heap size
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

---

## 📞 الدعم

- **توثيق**: [docs.ai-http.com](https://docs.ai-http.com)
- **Discord**: [discord.gg/ai-http](https://discord.gg/ai-http)
- **Email**: devops@ai-http.com
