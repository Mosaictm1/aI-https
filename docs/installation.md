# 📥 دليل التثبيت

## المتطلبات الأساسية

قبل البدء، تأكد من توفر المتطلبات التالية:

### البرمجيات المطلوبة

| البرنامج | الإصدار الأدنى | ملاحظات |
|----------|---------------|---------|
| Node.js | 18.0+ | [تحميل Node.js](https://nodejs.org/) |
| npm | 9.0+ | يأتي مع Node.js |
| PostgreSQL | 14.0+ | [تحميل PostgreSQL](https://www.postgresql.org/download/) |
| Redis | 6.0+ | [تحميل Redis](https://redis.io/download/) |
| Git | 2.30+ | [تحميل Git](https://git-scm.com/) |

### حسابات مطلوبة

- **حساب n8n**: [n8n Cloud](https://n8n.io/) أو Self-hosted
- **حساب Anthropic**: للحصول على Claude API Key (اختياري للـ AI features)

---

## 🖥️ التثبيت المحلي (Development)

### الخطوة 1: استنساخ المشروع

```bash
git clone https://github.com/your-username/ai-http.git
cd ai-http
```

### الخطوة 2: تثبيت المكتبات

```bash
# تثبيت مكتبات Backend
cd backend
npm install

# تثبيت مكتبات Frontend
cd ../frontend
npm install
```

### الخطوة 3: إعداد قاعدة البيانات

#### PostgreSQL

```bash
# إنشاء قاعدة البيانات
psql -U postgres
CREATE DATABASE ai_http;
CREATE USER ai_http_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_http TO ai_http_user;
\q
```

#### Redis

```bash
# تشغيل Redis (Windows)
redis-server

# تشغيل Redis (Linux/Mac)
redis-server --daemonize yes
```

### الخطوة 4: إعداد المتغيرات البيئية

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

عدّل ملف `.env`:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://ai_http_user:your_password@localhost:5432/ai_http"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# n8n  Integration
N8N_API_URL="https://your-n8n-instance.com/api/v1"
N8N_API_KEY="your-n8n-api-key"

# AI (Optional)
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"
```

#### Frontend (.env.local)

```bash
cd frontend
cp .env.example .env.local
```

عدّل ملف `.env.local`:

```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

### الخطوة 5: تهيئة قاعدة البيانات

```bash
cd backend

# إنشاء الجداول
npx prisma migrate dev

# (اختياري) إضافة بيانات تجريبية
npx prisma db seed
```

### الخطوة 6: تشغيل المشروع

#### الطريقة 1: تشغيل منفصل

```bash
# Terminal 1: تشغيل Backend
cd backend
npm run dev

# Terminal 2: تشغيل Frontend
cd frontend
npm run dev
```

#### الطريقة 2: تشغيل متزامن

```bash
# من المجلد الرئيسي
npm run dev
```

### الخطوة 7: التحقق من التثبيت

- **Frontend**: افتح [http://localhost:3000](http://localhost:3000)
- **Backend API**: افتح [http://localhost:4000/health](http://localhost:4000/health)
- **API Docs**: افتح [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

---

## 🐳 التثبيت باستخدام Docker

### الخطوة 1: إعداد Docker Compose

```bash
# استنساخ المشروع
git clone https://github.com/your-username/ai-http.git
cd ai-http

# نسخ ملف البيئة
cp .env.example .env
```

### الخطوة 2: تعديل المتغيرات البيئية

عدّل ملف `.env` بالقيم المناسبة.

### الخطوة 3: تشغيل الحاويات

```bash
# بناء وتشغيل
docker-compose up -d

# للتطوير مع live reload
docker-compose -f docker-compose.dev.yml up
```

### الخطوة 4: التحقق

```bash
# عرض حالة الحاويات
docker-compose ps

# عرض السجلات
docker-compose logs -f
```

---

## ☁️ التثبيت على الخادم (Production)

### الخيار 1: Render + Supabase + Vercel (موصى به)

#### 1. إعداد Supabase (قاعدة البيانات)

1. أنشئ حساب على [Supabase](https://supabase.com/)
2. أنشئ مشروع جديد
3. انسخ الـ Connection String من:
   - **Settings** > **Database** > **Connection string** > **URI**
4. فعّل **Realtime** إذا كنت تحتاجه

```env
# Connection String Format
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (للـ migrations)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

#### 2. إعداد Render (Backend)

1. أنشئ حساب على [Render](https://render.com/)
2. اضغط **New** > **Web Service**
3. اربط مستودع GitHub
4. أدخل الإعدادات:

| الإعداد | القيمة |
|---------|--------|
| **Name** | ai-http-backend |
| **Region** | أقرب منطقة |
| **Branch** | main |
| **Root Directory** | backend |
| **Runtime** | Node |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm run start:prod` |

5. أضف المتغيرات البيئية:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=your_supabase_connection_string
DIRECT_URL=your_supabase_direct_connection
JWT_SECRET=your_production_secret
ANTHROPIC_API_KEY=your_api_key
ENCRYPTION_KEY=your_32_char_key
FRONTEND_URL=https://your-app.vercel.app
```

6. اضغط **Create Web Service**

#### 3. إعداد Redis على Render (اختياري)

1. اضغط **New** > **Redis**
2. اختر الخطة المناسبة
3. انسخ الـ **Internal URL** للمتغير `REDIS_URL`

#### 4. إعداد Vercel (Frontend)

1. أنشئ حساب على [Vercel](https://vercel.com/)
2. اضغط **Add New Project**
3. استورد المستودع من GitHub
4. أدخل الإعدادات:

| الإعداد | القيمة |
|---------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | frontend |
| **Build Command** | `npm run build` |
| **Output Directory** | dist |

5. أضف المتغيرات البيئية:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

6. اضغط **Deploy**

```bash
# أو باستخدام CLI
cd frontend
npm i -g vercel
vercel login
vercel
```

### الخيار 2: VPS (Ubuntu)

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# تثبيت Redis
sudo apt install redis-server
sudo systemctl start redis

# تثبيت PM2
sudo npm install -g pm2

# استنساخ وتشغيل
git clone https://github.com/your-username/ai-http.git
cd ai-http/backend
npm install
npm run build
pm2 start dist/main.js --name ai-http-backend
```

---

## ⚙️ إعداد n8n

### n8n Cloud

1. سجّل دخول على [n8n Cloud](https://app.n8n.cloud/)
2. اذهب إلى **Settings** > **API**
3. أنشئ API Key جديد
4. انسخ الـ API Key و Instance URL

### n8n Self-hosted

1. تأكد من تفعيل الـ API في `n8n`:

```bash
# في ملف .env الخاص بـ n8n
N8N_API_KEY_ENABLED=true
```

2. أعد تشغيل n8n
3. اذهب إلى **Settings** > **API**
4. أنشئ API Key

---

## 🔧 استكشاف الأخطاء

### مشكلة: خطأ في الاتصال بقاعدة البيانات

```bash
# تحقق من حالة PostgreSQL
sudo systemctl status postgresql

# تحقق من الاتصال
psql -h localhost -U ai_http_user -d ai_http
```

### مشكلة: Redis غير متصل

```bash
# تحقق من حالة Redis
redis-cli ping
# يجب أن يرد: PONG
```

### مشكلة: الـ Frontend لا يتصل بالـ Backend

1. تحقق من `VITE_API_URL` في `.env.local`
2. تأكد من تشغيل Backend على المنفذ الصحيح
3. تحقق من CORS settings في Backend

### مشكلة: Prisma migration فاشلة

```bash
# إعادة تعيين قاعدة البيانات
npx prisma migrate reset

# إعادة توليد Prisma Client
npx prisma generate
```

---

## 📞 الدعم

إذا واجهت أي مشاكل:

1. راجع [الأسئلة الشائعة](./faq.md)
2. افتح [Issue على GitHub](https://github.com/your-username/ai-http/issues)
3. انضم لـ [Discord Server](https://discord.gg/ai-http)
