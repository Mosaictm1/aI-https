// ============================================
// Auth Validation Schemas
// ============================================

import { z } from 'zod';

// ==================== Register ====================

export const registerSchema = z.object({
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters')
        .trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ==================== Login ====================

export const loginSchema = z.object({
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ==================== Refresh Token ====================

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ==================== Forgot Password ====================

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ==================== Reset Password ====================

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ==================== Change Password ====================

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
