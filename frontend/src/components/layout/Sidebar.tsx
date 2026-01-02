import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Server,
    Workflow,
    Key,
    Settings,
    ChevronRight,
    ChevronLeft,
    Zap,
    Bot,
    History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';

const navigation = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
    { name: 'الـ Instances', href: '/instances', icon: Server },
    { name: 'سير العمل', href: '/workflows', icon: Workflow },
    { name: 'AI Fixer', href: '/ai-fixer', icon: Bot },
    { name: 'السجل', href: '/history', icon: History },
];

const bottomNavigation = [
    { name: 'مفاتيح API', href: '/api-keys', icon: Key },
    { name: 'الإعدادات', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar } = useUIStore();

    return (
        <aside
            className={cn(
                'fixed top-0 right-0 h-screen z-40 transition-all duration-300',
                'bg-deep-teal-200/80 backdrop-blur-xl border-l border-white/10',
                sidebarCollapsed ? 'w-20' : 'w-64'
            )}
        >
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-yellow to-action-orange flex-center shadow-glow-yellow">
                            <Zap className="h-5 w-5 text-deep-teal-200" />
                        </div>
                        {!sidebarCollapsed && (
                            <div className="animate-fade-in">
                                <h1 className="font-bold text-white">AI-HTTP</h1>
                                <p className="text-xs text-white/50">مساعد HTTP الذكي</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto hide-scrollbar">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                                    isActive
                                        ? 'bg-accent-yellow/10 text-accent-yellow'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        className={cn(
                                            'h-5 w-5 shrink-0 transition-colors',
                                            isActive ? 'text-accent-yellow' : 'text-white/50 group-hover:text-white'
                                        )}
                                    />
                                    {!sidebarCollapsed && (
                                        <span className="animate-fade-in font-medium text-sm">{item.name}</span>
                                    )}
                                    {isActive && !sidebarCollapsed && (
                                        <div className="mr-auto w-1.5 h-1.5 rounded-full bg-accent-yellow animate-pulse" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Navigation */}
                <div className="p-3 border-t border-white/10 space-y-1">
                    {bottomNavigation.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                                    isActive
                                        ? 'bg-accent-yellow/10 text-accent-yellow'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                )
                            }
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!sidebarCollapsed && (
                                <span className="animate-fade-in font-medium text-sm">{item.name}</span>
                            )}
                        </NavLink>
                    ))}
                </div>

                {/* Collapse Toggle */}
                <div className="p-3 border-t border-white/10">
                    <button
                        onClick={toggleSidebar}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200"
                    >
                        {sidebarCollapsed ? (
                            <ChevronLeft className="h-5 w-5" />
                        ) : (
                            <>
                                <ChevronRight className="h-5 w-5" />
                                <span className="text-sm">طي القائمة</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}
