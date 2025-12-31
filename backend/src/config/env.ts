// ============================================
// Environment Configuration
// ============================================

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ==================== Schema ====================

const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    HOST: z.string().default('0.0.0.0'),

    // Database
    DATABASE_URL: z.string(),
    DIRECT_URL: z.string().optional(),

    // Redis
    REDIS_URL: z.string().optional(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().default('6379'),
    REDIS_PASSWORD: z.string().optional(),

    // JWT
    JWT_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string().default('7d'),
    REFRESH_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

    // Encryption
    ENCRYPTION_KEY: z.string().min(32),

    // AI Integration (Manus Max)
    MANUS_API_KEY: z.string().optional(),

    // Frontend
    FRONTEND_URL: z.string().default('http://localhost:5173'),
    ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

    // Email (optional)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
});

// ==================== Validate ====================

const parseEnv = (): z.infer<typeof envSchema> => {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:');
        console.error(parsed.error.flatten().fieldErrors);
        throw new Error('Invalid environment configuration');
    }

    return parsed.data;
};

// ==================== Export ====================

const envVars = parseEnv();

export const env = {
    // Server
    nodeEnv: envVars.NODE_ENV,
    port: parseInt(envVars.PORT, 10),
    host: envVars.HOST,
    isDevelopment: envVars.NODE_ENV === 'development',
    isProduction: envVars.NODE_ENV === 'production',
    isTest: envVars.NODE_ENV === 'test',

    // Database
    databaseUrl: envVars.DATABASE_URL,
    directUrl: envVars.DIRECT_URL,

    // Redis
    redis: {
        url: envVars.REDIS_URL,
        host: envVars.REDIS_HOST,
        port: parseInt(envVars.REDIS_PORT, 10),
        password: envVars.REDIS_PASSWORD,
    },

    // JWT
    jwt: {
        secret: envVars.JWT_SECRET,
        expiresIn: envVars.JWT_EXPIRES_IN,
        refreshSecret: envVars.REFRESH_TOKEN_SECRET,
        refreshExpiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN,
    },

    // Encryption
    encryptionKey: envVars.ENCRYPTION_KEY,

    // AI Integration (Manus Max)
    manusApiKey: envVars.MANUS_API_KEY,

    // CORS
    frontendUrl: envVars.FRONTEND_URL,
    allowedOrigins: envVars.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(envVars.RATE_LIMIT_WINDOW_MS, 10),
        maxRequests: parseInt(envVars.RATE_LIMIT_MAX_REQUESTS, 10),
    },

    // Email
    email: {
        host: envVars.SMTP_HOST,
        port: envVars.SMTP_PORT ? parseInt(envVars.SMTP_PORT, 10) : undefined,
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS,
        from: envVars.EMAIL_FROM,
    },
} as const;

export type Env = typeof env;
