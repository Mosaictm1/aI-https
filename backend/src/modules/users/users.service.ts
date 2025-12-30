// ============================================
// Users Service - Business Logic
// ============================================

import { prisma } from '../../config/database.js';
import { hashPassword, comparePassword } from '../../shared/utils/password.js';
import {
    NotFoundError,
    UnauthorizedError,
    BadRequestError,
} from '../../shared/middleware/error-handler.js';
import type { UpdateProfileInput, ChangePasswordInput } from './users.schema.js';

// ==================== Get User Profile ====================

export const getProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            plan: true,
            settings: true,
            emailVerified: true,
            twoFactorEnabled: true,
            createdAt: true,
            updatedAt: true,
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

// ==================== Update Profile ====================

export const updateProfile = async (
    userId: string,
    input: UpdateProfileInput
) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(input.name && { name: input.name }),
            ...(input.avatar !== undefined && { avatar: input.avatar }),
            ...(input.settings && { settings: JSON.parse(JSON.stringify(input.settings)) }),
        },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            plan: true,
            settings: true,
            updatedAt: true,
        },
    });

    return user;
};

// ==================== Change Password ====================

export const changePassword = async (
    userId: string,
    input: ChangePasswordInput
): Promise<void> => {
    const { currentPassword, newPassword } = input;

    // Get user with password
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
    });

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.password);

    if (!isValid) {
        throw new UnauthorizedError('Current password is incorrect');
    }

    // Check if new password is same as old
    const isSame = await comparePassword(newPassword, user.password);

    if (isSame) {
        throw new BadRequestError('New password must be different from current password');
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    // Optionally: Invalidate all other sessions
    // await prisma.session.deleteMany({ where: { userId } });
};

// ==================== Delete Account ====================

export const deleteAccount = async (userId: string): Promise<void> => {
    // Delete user (cascade will handle related records)
    await prisma.user.delete({
        where: { id: userId },
    });
};

// ==================== Get User Stats ====================

export const getUserStats = async (userId: string) => {
    const [user, totalExecutions] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                _count: {
                    select: {
                        instances: true,
                        requests: true,
                        apiKeys: true,
                        aiAnalyses: true,
                    },
                },
            },
        }),
        prisma.execution.count({
            where: {
                workflow: {
                    instance: {
                        userId,
                    },
                },
            },
        }),
    ]);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    return {
        instances: user._count.instances,
        requests: user._count.requests,
        apiKeys: user._count.apiKeys,
        aiAnalyses: user._count.aiAnalyses,
        totalExecutions,
    };
};
