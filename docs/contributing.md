# 🤝 دليل المساهمة

شكراً لاهتمامك بالمساهمة في **AI-HTTP**! نحن نقدر كل مساهمة مهما كانت صغيرة.

---

## 📜 قواعد المساهمة

### قواعد السلوك

- كن محترماً ومهذباً
- رحب بالمساهمين الجدد
- قدم نقداً بناءً
- تقبل وجهات النظر المختلفة

### أنواع المساهمات المرحب بها

- 🐛 الإبلاغ عن الأخطاء
- ✨ اقتراح ميزات جديدة
- 📝 تحسين التوثيق
- 🔧 إصلاح الأخطاء
- 🎨 تحسين واجهة المستخدم
- ⚡ تحسين الأداء
- 🌍 الترجمة

---

## 🚀 البداية السريعة

### 1. Fork المشروع

اضغط على زر **Fork** في صفحة المشروع على GitHub.

### 2. استنسخ المشروع

```bash
git clone https://github.com/YOUR_USERNAME/ai-http.git
cd ai-http
```

### 3. أضف الـ upstream

```bash
git remote add upstream https://github.com/original/ai-http.git
```

### 4. إعداد بيئة التطوير

```bash
# Backend
cd backend
npm install
cp .env.example .env
# عدّل .env بالقيم المناسبة

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
```

### 5. تشغيل المشروع

```bash
# من المجلد الرئيسي
npm run dev
```

---

## 🔄 عملية المساهمة

### الإبلاغ عن خطأ

1. تأكد أن الخطأ لم يُبلَّغ عنه مسبقاً
2. افتح [Issue جديد](https://github.com/your-username/ai-http/issues/new)
3. استخدم قالب الإبلاغ عن خطأ
4. قدم معلومات كافية لإعادة إنتاج الخطأ

#### قالب الإبلاغ عن خطأ

```markdown
## وصف الخطأ
وصف واضح ومختصر للخطأ.

## خطوات إعادة الإنتاج
1. اذهب إلى '...'
2. اضغط على '...'
3. مرر إلى '...'
4. شاهد الخطأ

## السلوك المتوقع
ما كنت تتوقع حدوثه.

## السلوك الفعلي
ما حدث فعلاً.

## لقطات الشاشة
إن وجدت.

## البيئة
- نظام التشغيل: [مثال: Windows 11]
- المتصفح: [مثال: Chrome 120]
- إصدار Node: [مثال: 18.19.0]

## معلومات إضافية
أي معلومات أخرى قد تكون مفيدة.
```

### اقتراح ميزة جديدة

1. افتح [Issue جديد](https://github.com/your-username/ai-http/issues/new)
2. استخدم قالب اقتراح ميزة
3. اشرح المشكلة التي ستحلها الميزة
4. قدم أمثلة على الاستخدام

#### قالب اقتراح ميزة

```markdown
## المشكلة
وصف واضح للمشكلة التي تواجهها.

## الحل المقترح
وصف واضح لما تريد تحقيقه.

## البدائل
أي حلول بديلة فكرت فيها.

## معلومات إضافية
أي معلومات أخرى أو لقطات شاشة.
```

### إرسال Pull Request

#### 1. أنشئ Branch جديد

```bash
# أحدث النسخة من main
git checkout main
git pull upstream main

# أنشئ branch جديد
git checkout -b feature/amazing-feature
# أو
git checkout -b fix/bug-description
```

#### تسمية الـ Branches

| النوع | المثال |
|-------|--------|
| ميزة جديدة | `feature/add-dark-mode` |
| إصلاح خطأ | `fix/login-validation` |
| توثيق | `docs/update-readme` |
| تحسين | `refactor/optimize-queries` |
| اختبارات | `test/add-auth-tests` |

#### 2. أجرِ التعديلات

```bash
# تأكد من تشغيل الـ linter
npm run lint

# تأكد من نجاح الاختبارات
npm run test

# أضف التعديلات
git add .
```

#### 3. اكتب رسالة Commit جيدة

نتبع نمط [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

##### أنواع الـ Commits

| النوع | الوصف |
|-------|-------|
| `feat` | ميزة جديدة |
| `fix` | إصلاح خطأ |
| `docs` | تحديث التوثيق |
| `style` | تنسيق الكود |
| `refactor` | إعادة هيكلة |
| `test` | إضافة اختبارات |
| `chore` | مهام صيانة |
| `perf` | تحسين الأداء |

##### أمثلة

```bash
feat(auth): add two-factor authentication

fix(http-builder): resolve url parsing issue

docs(readme): update installation instructions

refactor(api): optimize database queries for workflows
```

#### 4. ارفع التعديلات

```bash
git push origin feature/amazing-feature
```

#### 5. افتح Pull Request

1. اذهب إلى صفحة المشروع على GitHub
2. اضغط **"Compare & pull request"**
3. املأ القالب بالتفاصيل
4. اربط الـ Issue المتعلق (إن وجد)
5. انتظر المراجعة

#### قالب Pull Request

```markdown
## الوصف
وصف موجز للتغييرات.

## نوع التغيير
- [ ] ميزة جديدة
- [ ] إصلاح خطأ
- [ ] تحديث توثيق
- [ ] إعادة هيكلة
- [ ] تحسين أداء
- [ ] اختبارات

## الـ Issue المتعلق
Fixes #(issue number)

## التغييرات
- تغيير 1
- تغيير 2
- تغيير 3

## قائمة التحقق
- [ ] اتبعت دليل الأسلوب
- [ ] أجريت مراجعة ذاتية
- [ ] أضفت تعليقات للكود المعقد
- [ ] حدّثت التوثيق
- [ ] تغييراتي لا تولد تحذيرات جديدة
- [ ] أضفت اختبارات
- [ ] جميع الاختبارات تنجح محلياً

## لقطات الشاشة (إن وجدت)
```

---

## 📏 معايير الكود

### TypeScript/JavaScript

```typescript
// ✅ جيد
const getUserById = async (id: string): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

// ❌ سيء
async function getUser(id) {
  var user = await prisma.user.findUnique({ where: { id } });
  return user;
}
```

### React Components

```tsx
// ✅ جيد
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// ❌ سيء
export function Button(props) {
  return (
    <button className={'btn btn-' + props.variant} onClick={props.onClick}>
      {props.children}
    </button>
  );
}
```

### CSS/Styling

```css
/* ✅ جيد */
.workflow-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-6);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

/* ❌ سيء */
.card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 12px;
  background: #1a1a1a;
}
```

### التسمية

| العنصر | النمط | مثال |
|--------|-------|-------|
| المتغيرات | camelCase | `userName`, `isLoading` |
| الثوابت | UPPER_SNAKE | `MAX_RETRIES`, `API_URL` |
| الدوال | camelCase | `getUser`, `handleClick` |
| المكونات | PascalCase | `UserProfile`, `WorkflowCard` |
| الملفات (components) | PascalCase | `Button.tsx`, `UserProfile.tsx` |
| الملفات (utils) | camelCase | `helpers.ts`, `validators.ts` |
| CSS Classes | kebab-case | `workflow-card`, `btn-primary` |

---

## 🧪 الاختبارات

### تشغيل الاختبارات

```bash
# جميع الاختبارات
npm run test

# مع التغطية
npm run test:coverage

# اختبارات محددة
npm run test -- --grep "auth"

# وضع المراقبة
npm run test:watch
```

### كتابة اختبارات

```typescript
// auth.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should return user and token for valid credentials', async () => {
      const result = await authService.login('test@example.com', 'password');
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedError for invalid credentials', async () => {
      await expect(
        authService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### تغطية الاختبارات المطلوبة

| المجال | الحد الأدنى |
|--------|------------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

---

## 📝 التوثيق

### توثيق الكود

```typescript
/**
 * يقوم بتحليل خطأ HTTP واقتراح حلول باستخدام AI.
 * 
 * @param error - تفاصيل الخطأ من الـ HTTP response
 * @param request - تفاصيل الـ request الأصلي
 * @param context - سياق إضافي (اسم الخدمة، الـ node، إلخ)
 * @returns تحليل AI مع الحلول المقترحة
 * 
 * @example
 * ```ts
 * const analysis = await analyzeError(
 *   { status: 401, message: 'Unauthorized' },
 *   { method: 'GET', url: 'https://api.stripe.com/v1/customers' },
 *   { service: 'stripe' }
 * );
 * ```
 */
async function analyzeError(
  error: HttpError,
  request: HttpRequest,
  context?: AnalysisContext
): Promise<AIAnalysis> {
  // ...
}
```

### تحديث التوثيق

عند إضافة ميزة جديدة، حدّث:

1. `README.md` - إذا كانت ميزة رئيسية
2. `docs/user-guide.md` - كيفية الاستخدام
3. `docs/api-reference.md` - إذا كانت API جديدة
4. `CHANGELOG.md` - سجل التغييرات

---

## 🔍 مراجعة الكود

### ما نبحث عنه

- ✅ الكود يعمل ويحل المشكلة
- ✅ الاختبارات موجودة وتنجح
- ✅ الكود واضح وسهل الفهم
- ✅ لا يوجد تكرار غير ضروري
- ✅ الأداء مقبول
- ✅ الأمان لا يتأثر
- ✅ التوثيق محدث

### نصائح لمراجعة سريعة

1. اجعل الـ PR صغيراً ومركزاً
2. اكتب وصفاً واضحاً
3. أضف لقطات شاشة للتغييرات المرئية
4. رد على التعليقات بسرعة
5. كن مستعداً لإجراء تعديلات

---

## 🏆 المساهمون

نشكر جميع المساهمين الرائعين!

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

---

## ❓ أسئلة؟

- افتح [Discussion](https://github.com/your-username/ai-http/discussions)
- انضم لـ [Discord](https://discord.gg/ai-http)
- راسلنا على: contributors@ai-http.com

---

<p align="center">
  شكراً لمساهمتك! 🎉
</p>
