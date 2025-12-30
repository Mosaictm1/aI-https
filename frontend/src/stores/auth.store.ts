import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    _hasHydrated: boolean;

    // Actions
    setUser: (user: User) => void;
    setToken: (token: string) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    setLoading: (isLoading: boolean) => void;
    setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,
            _hasHydrated: false,

            setUser: (user) => set({ user, isAuthenticated: true }),

            setToken: (token) => set({ token }),

            login: (user, token) => set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
            }),

            logout: () => set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            }),

            setLoading: (isLoading) => set({ isLoading }),

            setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated, isLoading: false }),
        }),
        {
            name: 'ai-http-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

