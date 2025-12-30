// ============================================
// Auth Service - Business Logic
// ============================================

import { prisma } from '../../config/database.js';
import { hashPassword, comparePassword } from '../../shared/utils/password.js';
import { generateTokenPair, verifyRefreshToken } from '../../shared/utils/jwt.js';
import { generateRandomToken } from '../../shared/utils/encryption.js';
import {
    ConflictError,
    UnauthorizedError,
    NotFoundError,
} from '../../shared/middleware/error-handler.js';
import type {
    RegisterInput,
    LoginInput,
    RefreshTokenInput,
} from './auth.schema.js';

// ==================== Types ====================

export interface AuthResult {
    user: {
        id: string;
        email: string;
        name: string;
        plan: string;
    };
    accessToken: string;
    refreshToken: string;
}

// ==================== Register ====================

export const register = async (input: RegisterInput): Promise<AuthResult> => {
    const { email, password, name } = input;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            verifyToken: generateRandomToken(),
        },
    });

    // Create session
    const sessionId = await createSession(user.id);

    // Generate tokens
    const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        sessionId,
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
        },
        ...tokens,
    };
};

// ==================== Login ====================

export const login = async (
    input: LoginInput,
    userAgent?: string,
    ipAddress?: string
): Promise<AuthResult> => {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
    }

    // Create session
    const sessionId = await createSession(user.id, userAgent, ipAddress);

    // Generate tokens
    const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        sessionId,
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
        },
        ...tokens,
    };
};

// ==================== Logout ====================

export const logout = async (sessionId: string): Promise<void> => {
    await prisma.session.delete({
        where: { id: sessionId },
    }).catch(() => {
        // Session might already be deleted, ignore error
    });
};

// ==================== Logout All Sessions ====================

export const logoutAll = async (userId: string): Promise<void> => {
    await prisma.session.deleteMany({
        where: { userId },
    });
};

// ==================== Refresh Token ====================

export const refreshToken = async (
    input: RefreshTokenInput
): Promise<{ accessToken: string; refreshToken: string }> => {
    const { refreshToken: token } = input;

    // Verify refresh token
    const payload = verifyRefreshToken(token);

    if (!payload) {
        throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
        include: { user: true },
    });

    if (!session) {
        throw new UnauthorizedError('Session not found');
    }

    if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } });
        throw new UnauthorizedError('Session expired');
    }

    // Generate new tokens
    const tokens = generateTokenPair({
        userId: session.user.id,
        email: session.user.email,
        sessionId: session.id,
    });

    // Update session with new refresh token
    await prisma.session.update({
        where: { id: session.id },
        data: {
            refreshToken: tokens.refreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    });

    return tokens;
};

// ==================== Get Current User ====================

export const getCurrentUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            plan: true,
            emailVerified: true,
            twoFactorEnabled: true,
            createdAt: true,
            _count: {
                select: {
                    instances: true,
                    requests: true,
                    apiKeys: true,
                },
            },
        },
    });

    if (!user) {
        throw new NotFoundError('User not found');
    }

    return user;
};

// ==================== Helper: Create Session ====================

const createSession = async (
    userId: string,
    userAgent?: string,
    ipAddress?: string
): Promise<string> => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session = await prisma.session.create({
        data: {
            userId,
            token: generateRandomToken(),
            refreshToken: generateRandomToken(),
            userAgent,
            ipAddress,
            expiresAt,
        },
    });

    return session.id;
};
