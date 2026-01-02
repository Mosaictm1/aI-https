// ============================================
// Redis Configuration
// ============================================

import Redis from 'ioredis';
import { env } from './env.js';

// ==================== Create Client ====================

const createRedisClient = (): Redis | null => {
    // Skip Redis entirely if no URL is configured (both dev and prod)
    // Redis is optional for this application
    if (!env.redis.url) {
        console.log('⚠️  Redis not configured, using in-memory fallback');
        return null;
    }

    try {
        const client = new Redis(env.redis.url, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            retryStrategy: (times) => {
                // Stop retrying after 3 attempts
                if (times > 3) {
                    console.log('⚠️  Redis connection failed after 3 retries, using in-memory fallback');
                    return null;
                }
                return Math.min(times * 200, 2000);
            },
        });

        // Event handlers - only log once to avoid spam
        let hasConnected = false;
        let hasErrored = false;

        client.on('connect', () => {
            if (!hasConnected) {
                console.log('✅ Redis connected');
                hasConnected = true;
            }
        });

        client.on('error', (err: Error) => {
            if (!hasErrored) {
                console.error('❌ Redis error:', err.message);
                hasErrored = true;
            }
        });

        client.on('close', () => {
            // Only log if we had successfully connected before
            if (hasConnected) {
                console.log('📤 Redis connection closed');
                hasConnected = false;
                hasErrored = false;
            }
        });

        return client;
    } catch (error) {
        console.log('⚠️  Failed to create Redis client, using in-memory fallback');
        return null;
    }
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
