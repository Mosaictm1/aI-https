// ============================================
// Instance Card Component
// ============================================

import { useState } from 'react';
import {
    Server,
    MoreVertical,
    Pencil,
    Trash2,
    RefreshCw,
    Wifi,
    WifiOff,
    Workflow,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown';
import { cn } from '@/lib/utils';
import type { Instance } from '@/types';

interface InstanceCardProps {
    instance: Instance;
    onEdit: (instance: Instance) => void;
    onDelete: (instance: Instance) => void;
    onSync: (instance: Instance) => void;
    onTest: (instance: Instance) => void;
    isSyncing?: boolean;
    isTesting?: boolean;
}

export default function InstanceCard({
    instance,
    onEdit,
    onDelete,
    onSync,
    onTest,
    isSyncing = false,
    isTesting = false,
}: InstanceCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    const formatDate = (date: string | null) => {
        if (!date) return 'لم يتم المزامنة بعد';
        return new Date(date).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card hover className="overflow-hidden group">
            <CardContent className="p-0">
                {/* Header with gradient */}
                <div className="h-2 bg-gradient-to-r from-accent-yellow via-action-orange to-lime-green" />

                <div className="p-5 space-y-4">
                    {/* Top Row */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-yellow/20 to-action-orange/10 flex-center">
                                <Server className="h-6 w-6 text-accent-yellow" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-lg">{instance.name}</h3>
                                <p className="text-sm text-white/50 truncate max-w-[200px]">
                                    {instance.url}
                                </p>
                            </div>
                        </div>

                        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(instance)}>
                                    <Pencil className="h-4 w-4 ml-2" />
                                    تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onSync(instance)}>
                                    <RefreshCw className="h-4 w-4 ml-2" />
                                    مزامنة Workflows
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onTest(instance)}>
                                    <Wifi className="h-4 w-4 ml-2" />
                                    اختبار الاتصال
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(instance)}
                                    className="text-action-orange focus:text-action-orange"
                                >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                'w-2 h-2 rounded-full',
                                instance.status === 'CONNECTED'
                                    ? 'bg-lime-green animate-pulse'
                                    : instance.status === 'ERROR'
                                        ? 'bg-action-orange'
                                        : instance.status === 'SYNCING'
                                            ? 'bg-accent-yellow animate-pulse'
                                            : 'bg-white/30'
                            )}
                        />
                        <span className="text-sm text-white/60">
                            {instance.status === 'CONNECTED' ? 'متصل' :
                                instance.status === 'ERROR' ? 'خطأ' :
                                    instance.status === 'SYNCING' ? 'جاري المزامنة...' : 'غير متصل'}
                        </span>
                        <Badge variant={instance.status === 'CONNECTED' ? 'success' : instance.status === 'ERROR' ? 'error' : 'warning'} className="mr-auto">
                            {instance.status === 'CONNECTED' ? (
                                <Wifi className="h-3 w-3 ml-1" />
                            ) : (
                                <WifiOff className="h-3 w-3 ml-1" />
                            )}
                            {instance.status === 'CONNECTED' ? 'نشط' : 'غير نشط'}
                        </Badge>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2 text-white/50">
                                <Workflow className="h-4 w-4" />
                                <span className="text-xs">Workflows</span>
                            </div>
                            <p className="text-xl font-bold text-white mt-1">
                                {instance.workflowCount}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2 text-white/50">
                                <RefreshCw className="h-4 w-4" />
                                <span className="text-xs">آخر مزامنة</span>
                            </div>
                            <p className="text-xs font-medium text-white mt-1 truncate">
                                {formatDate(instance.lastSync)}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => onSync(instance)}
                            disabled={isSyncing}
                        >
                            <RefreshCw className={cn('h-4 w-4 ml-2', isSyncing && 'animate-spin')} />
                            {isSyncing ? 'جاري المزامنة...' : 'مزامنة'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => onTest(instance)}
                            disabled={isTesting}
                        >
                            <Wifi className="h-4 w-4 ml-2" />
                            {isTesting ? 'جاري الاختبار...' : 'اختبار'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
