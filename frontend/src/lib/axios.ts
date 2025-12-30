import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Try to refresh token
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    const response = await axios.post(
                        `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`,
                        { refreshToken }
                    );

                    const { accessToken } = response.data.data;
                    useAuthStore.getState().setToken(accessToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch {
                    // Refresh failed, logout user
                    useAuthStore.getState().logout();
                    window.location.href = '/login';
                }
            } else {
                useAuthStore.getState().logout();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// API helper types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
