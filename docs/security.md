# 🔒 دليل الأمان (Security Guide)

## نظرة عامة

الأمان هو أولوية قصوى في AI-HTTP. هذا الدليل يوضح ممارسات الأمان المتبعة وكيفية الإبلاغ عن ثغرات.

---

## 🛡️ ممارسات الأمان

### المصادقة

#### كلمات المرور
- تُخزَّن مشفرة باستخدام **bcrypt** مع salt فريد
- حد أدنى 8 أحرف مع متطلبات تعقيد
- حماية من هجمات Brute Force (rate limiting)

```typescript
// مثال على تشفير كلمة المرور
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

#### JWT Tokens
- توقيع باستخدام **RS256**
- صلاحية محدودة (Access: 15 دقيقة، Refresh: 7 أيام)
- تخزين آمن في HttpOnly cookies

```typescript
// إعدادات JWT
const jwtConfig = {
  accessToken: {
    algorithm: 'RS256',
    expiresIn: '15m'
  },
  refreshToken: {
    algorithm: 'RS256',
    expiresIn: '7d'
  }
};
```

#### المصادقة الثنائية (2FA)
- دعم TOTP (Google Authenticator, Authy)
- رموز احتياطية مشفرة
- فرض 2FA للحسابات الحساسة

### التشفير

#### البيانات في النقل
- **TLS 1.3** إجباري على جميع الاتصالات
- HSTS مُفعَّل
- شهادات SSL من Let's Encrypt

#### البيانات المخزنة
- API Keys مشفرة باستخدام **AES-256-GCM**
- مفاتيح التشفير تُدار عبر **HashiCorp Vault** أو **AWS KMS**

```typescript
// تشفير API Keys
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string, key: Buffer): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
```

### قاعدة البيانات

#### PostgreSQL
- اتصالات مشفرة (SSL required)
- صلاحيات محدودة (Principle of Least Privilege)
- Parameterized queries لمنع SQL Injection

```typescript
// استخدام Prisma (آمن افتراضياً)
const user = await prisma.user.findUnique({
  where: { email: userInput } // Parameterized automatically
});
```

#### Redis
- Password protected
- TLS enabled
- No persistence of sensitive data

---

## 🔐 حماية API

### Rate Limiting

```typescript
// حدود الطلبات
const rateLimits = {
  free: {
    requests: 100,
    window: '1h'
  },
  pro: {
    requests: 1000,
    window: '1h'
  },
  enterprise: {
    requests: 10000,
    window: '1h'
  }
};
```

### Input Validation

كل المدخلات تُتحقق منها باستخدام **Zod**:

```typescript
import { z } from 'zod';

const createInstanceSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().startsWith('https://'),
  apiKey: z.string().min(20)
});
```

### CORS

```typescript
const corsOptions = {
  origin: [
    'https://ai-http.com',
    'https://app.ai-http.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### Headers الأمنية

```typescript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  referrerPolicy: { policy: 'same-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
```

---

## 🔍 المراقبة والتدقيق

### Audit Logs

نسجل جميع العمليات الحساسة:

```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  details?: object;
}

// الأحداث المسجلة
const auditEvents = [
  'user.login',
  'user.logout',
  'user.password_change',
  'instance.create',
  'instance.delete',
  'workflow.execute',
  'api_key.create',
  'api_key.revoke'
];
```

### Monitoring

- **Sentry**: لتتبع الأخطاء
- **DataDog**: للمراقبة والتنبيهات
- **CloudFlare**: للحماية من DDoS

---

## 🚨 الإبلاغ عن ثغرات

### عملية الإبلاغ

1. **لا تفصح علنياً** عن الثغرة
2. أرسل تقريراً إلى: **security@ai-http.com**
3. سنرد خلال 24 ساعة
4. سنعمل معك على الإصلاح
5. سنذكرك في Hall of Fame (إن رغبت)

### ما نبحث عنه

| الخطورة | الأمثلة |
|---------|---------|
| **حرجة** | RCE, SQL Injection, Auth Bypass |
| **عالية** | XSS, CSRF, Data Exposure |
| **متوسطة** | IDOR, Rate Limit Bypass |
| **منخفضة** | Information Disclosure |

### قالب التقرير

```markdown
## ملخص الثغرة
وصف موجز للثغرة.

## خطوات إعادة الإنتاج
1. خطوة 1
2. خطوة 2
3. خطوة 3

## التأثير
ما الضرر المحتمل من هذه الثغرة.

## Proof of Concept
كود أو لقطات شاشة توضح الثغرة.

## الإصلاح المقترح
(اختياري) اقتراحك لإصلاح الثغرة.
```

### مكافآت الأمان

| الخطورة | المكافأة |
|---------|----------|
| حرجة | $500 - $2000 |
| عالية | $200 - $500 |
| متوسطة | $50 - $200 |
| منخفضة | ذكر في Hall of Fame |

---

## ✅ قائمة التحقق للمطورين

### قبل كل Commit

- [ ] لا يوجد secrets في الكود
- [ ] Input validation لكل المدخلات
- [ ] Error messages لا تكشف معلومات حساسة
- [ ] Dependencies محدثة

### قبل كل Deploy

- [ ] Security tests ناجحة
- [ ] Dependency audit نظيف
- [ ] Environment variables صحيحة
- [ ] SSL certificates صالحة

### دورياً

- [ ] مراجعة صلاحيات المستخدمين
- [ ] تدوير encryption keys
- [ ] مراجعة audit logs
- [ ] اختبار اختراق

---

## 📚 موارد إضافية

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Guidelines](https://reactjs.org/docs/security.html)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)

---

## 📞 التواصل

- **أمان عاجل**: security@ai-http.com
- **أسئلة عامة**: support@ai-http.com
- **PGP Key**: [متاح على request]
