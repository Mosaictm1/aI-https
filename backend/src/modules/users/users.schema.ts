// ============================================
// Users Validation Schemas
// ============================================

import { z } from 'zod';

// ==================== Update Profile ====================

export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters')
        .trim()
        .optional(),
    avatar: z.string().url('Invalid avatar URL').optional().nullable(),
    settings: z.record(z.unknown()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

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
