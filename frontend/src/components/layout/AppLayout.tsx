import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

export default function AppLayout() {
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className="min-h-screen bg-gradient-to-br from-deep-teal-300 via-deep-teal to-deep-teal-200">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-96 h-96 bg-accent-yellow/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-medium-green/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-green/5 rounded-full blur-3xl" />
            </div>

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div
                className={cn(
                    'transition-all duration-300',
                    sidebarCollapsed ? 'mr-20' : 'mr-64'
                )}
            >
                <Header />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
