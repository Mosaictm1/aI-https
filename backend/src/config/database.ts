// ============================================
// Database Configuration - Prisma Client
// ============================================

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// ==================== Singleton Pattern ====================

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
    return new PrismaClient({
        log: env.isDevelopment
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
        errorFormat: env.isDevelopment ? 'pretty' : 'minimal',
    });
};

// Use global variable to prevent multiple instances in development
export const prisma = globalThis.prisma ?? createPrismaClient();

if (env.isDevelopment) {
    globalThis.prisma = prisma;
}

// ==================== Connection Functions ====================

export const connectDatabase = async (): Promise<void> => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    await prisma.$disconnect();
    console.log('📤 Database disconnected');
};

// ==================== Health Check ====================

export const checkDatabaseHealth = async (): Promise<boolean> => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch {
        return false;
    }
};

// ==================== Graceful Shutdown ====================

const handleShutdown = async (): Promise<void> => {
    console.log('\n🔄 Gracefully shutting down...');
    await disconnectDatabase();
    process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

export default prisma;
