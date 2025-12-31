# AI-HTTP

مساعد HTTP الذكي لـ n8n - اجعل HTTP debugging سهل زي الضغط على زر! 🚀

## 📚 التوثيق الكامل

راجع مجلد [`docs/`](./docs/) للتوثيق الكامل:

- [README](./docs/README.md) - نظرة عامة
- [Installation](./docs/installation.md) - دليل التثبيت
- [User Guide](./docs/user-guide.md) - دليل المستخدم
- [API Reference](./docs/api-reference.md) - توثيق API
- [Architecture](./docs/architecture.md) - الهيكلة التقنية

## 🚀 البداية السريعة

### المتطلبات
- Node.js 18+
- PostgreSQL 15+ (أو Supabase)
- Redis 7+ (اختياري)

### التثبيت المحلي

```bash
# استنساخ المشروع
git clone https://github.com/your-username/ai-http.git
cd ai-http

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev

# Frontend (terminal جديد)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### باستخدام Docker

```bash
docker-compose -f docker-compose.dev.yml up
```

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express + Prisma |
| Database | Supabase (PostgreSQL) |
| Cache | Redis |
| AI | Manus Max API |
| Hosting | Vercel + Render |

## 📁 هيكل المشروع

```
ai-http/
├── backend/           # Backend API (Express + Prisma)
├── frontend/          # Frontend App (React + Vite)
├── docs/              # التوثيق الكامل
├── .github/           # GitHub Actions CI/CD
├── docker-compose.dev.yml
├── render.yaml        # Render deployment config
└── README.md
```

## 🔗 روابط مهمة

- **Production**: https://ai-http.com
- **API**: https://api.ai-http.com
- **Docs**: https://docs.ai-http.com

## 📄 الرخصة

MIT License - راجع [LICENSE](./docs/LICENSE)
