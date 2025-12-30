// ============================================
// Redis Configuration
// ============================================

import Redis from 'ioredis';
import { env } from './env.js';

// ==================== Create Client ====================

const createRedisClient = (): Redis | null => {
    // Skip Redis in development if not configured
    if (!env.redis.url && env.isDevelopment) {
        console.log('⚠️  Redis not configured, using in-memory fallback');
        return null;
    }

    const client = env.redis.url
        ? new Redis(env.redis.url, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        })
        : new Redis({
            host: env.redis.host,
            port: env.redis.port,
            password: env.redis.password,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });

    // Event handlers
    client.on('connect', () => {
        console.log('✅ Redis connected');
    });

    client.on('error', (err: Error) => {
        console.error('❌ Redis error:', err.message);
    });

    client.on('close', () => {
        console.log('📤 Redis connection closed');
    });

    return client;
};

export const redis = createRedisClient();

// ==================== Connection Functions ====================

export const connectRedis = async (): Promise<void> => {
    if (!redis) {
        return;
    }

    try {
        await redis.connect();
    } catch (error) {
        console.error('❌ Redis connection failed:', error);
        // Don't throw - Redis is optional
    }
};

export const disconnectRedis = async (): Promise<void> => {
    if (redis) {
        await redis.quit();
    }
};

// ==================== Health Check ====================

export const checkRedisHealth = async (): Promise<boolean> => {
    if (!redis) {
        return false;
    }

    try {
        const result = await redis.ping();
        return result === 'PONG';
    } catch {
        return false;
    }
};

// ==================== In-Memory Cache Fallback ====================

class InMemoryCache {
    private cache: Map<string, { value: string; expiry?: number }> = new Map();

    async get(key: string): Promise<string | null> {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        if (item.expiry && Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        this.cache.set(key, {
            value,
            expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
        });
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async exists(key: string): Promise<boolean> {
        return this.cache.has(key);
    }
}

export const inMemoryCache = new InMemoryCache();

// ==================== Cache Interface ====================

export const cache = {
    async get(key: string): Promise<string | null> {
        if (redis) {
            return redis.get(key);
        }
        return inMemoryCache.get(key);
    },

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (redis) {
            if (ttlSeconds) {
                await redis.setex(key, ttlSeconds, value);
            } else {
                await redis.set(key, value);
            }
        } else {
            await inMemoryCache.set(key, value, ttlSeconds);
        }
    },

    async del(key: string): Promise<void> {
        if (redis) {
            await redis.del(key);
        } else {
            await inMemoryCache.del(key);
        }
    },

    async exists(key: string): Promise<boolean> {
        if (redis) {
            const result = await redis.exists(key);
            return result === 1;
        }
        return inMemoryCache.exists(key);
    },
};

export default redis;
