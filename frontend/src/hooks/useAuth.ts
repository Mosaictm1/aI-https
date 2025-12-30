// ============================================
// Auth API Hooks
// ============================================

import { useMutation } from '@tanstack/react-query';
import api, { ApiResponse } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/types';

// ==================== Types ====================

interface LoginInput {
    email: string;
    password: string;
}

interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

// ==================== Mutations ====================

export function useLogin() {
    const login = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: async (data: LoginInput) => {
            const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
            return response.data.data;
        },
        onSuccess: (data) => {
            localStorage.setItem('refreshToken', data.refreshToken);
            login(
                {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    avatar: data.user.avatar,
                },
                data.accessToken
            );
        },
    });
}

export function useRegister() {
    const login = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: async (data: RegisterInput) => {
            const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
            return response.data.data;
        },
        onSuccess: (data) => {
            localStorage.setItem('refreshToken', data.refreshToken);
            login(
                {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    avatar: data.user.avatar,
                },
                data.accessToken
            );
        },
    });
}

export function useLogout() {
    const logout = useAuthStore((state) => state.logout);

    return useMutation({
        mutationFn: async () => {
            await api.post('/auth/logout');
        },
        onSettled: () => {
            localStorage.removeItem('refreshToken');
            logout();
        },
    });
}

export function useUpdateProfile() {
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation({
        mutationFn: async (data: { name?: string; avatar?: string }) => {
            const response = await api.patch<ApiResponse<User>>('/users/me', data);
            return response.data.data;
        },
        onSuccess: (data) => {
            setUser({
                id: data.id,
                email: data.email,
                name: data.name,
                avatar: data.avatar,
            });
        },
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
            await api.post('/users/me/password', data);
        },
    });
}
