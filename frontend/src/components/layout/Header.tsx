import { Bell, Search, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { useAuthStore } from '@/stores/auth.store';

export default function Header() {
    const { user, logout } = useAuthStore();

    return (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-deep-teal/50 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                            placeholder="بحث..."
                            className="pr-10 bg-white/5 border-white/10"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5 text-white/70" />
                        <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-action-orange animate-pulse" />
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 p-1.5 pr-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                                <Avatar
                                    size="sm"
                                    alt={user?.name || 'User'}
                                    fallback={user?.name?.slice(0, 2) || 'U'}
                                />
                                <span className="text-sm text-white/80 font-medium">
                                    {user?.name || 'المستخدم'}
                                </span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="ml-2 h-4 w-4" />
                                الملف الشخصي
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="ml-2 h-4 w-4" />
                                الإعدادات
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-action-orange focus:text-action-orange">
                                <LogOut className="ml-2 h-4 w-4" />
                                تسجيل الخروج
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
