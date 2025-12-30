import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    // Sidebar
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;

    // Theme
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;

    // Modal
    activeModal: string | null;
    modalData: Record<string, unknown> | null;
    openModal: (modalId: string, data?: Record<string, unknown>) => void;
    closeModal: () => void;

    // Global loading
    globalLoading: boolean;
    setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Sidebar
            sidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

            // Theme (default dark)
            theme: 'dark',
            setTheme: (theme) => set({ theme }),

            // Modal
            activeModal: null,
            modalData: null,
            openModal: (modalId, data) => set({ activeModal: modalId, modalData: data || null }),
            closeModal: () => set({ activeModal: null, modalData: null }),

            // Global loading
            globalLoading: false,
            setGlobalLoading: (loading) => set({ globalLoading: loading }),
        }),
        {
            name: 'ai-http-ui',
            partialize: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                theme: state.theme,
            }),
        }
    )
);
