// ============================================
// API Keys Page
// ============================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Key,
    Plus,
    Copy,
    Trash2,
    Eye,
    EyeOff,
    AlertCircle,
    Loader2,
    Calendar,
    Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import DeleteConfirmModal from '@/components/instances/DeleteConfirmModal';
import type { ApiKey } from '@/types';

// ==================== Schema ====================

const createKeySchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
});

type CreateKeyFormData = z.infer<typeof createKeySchema>;

// ==================== Mock Data (replace with API hooks) ====================

const mockApiKeys: ApiKey[] = [
    {
        id: '1',
        name: 'Production Key',
        keyPreview: 'ai_http_k1...xyz',
        lastUsedAt: '2024-12-30T10:00:00Z',
        expiresAt: null,
        createdAt: '2024-12-01T00:00:00Z',
    },
    {
        id: '2',
        name: 'Development Key',
        keyPreview: 'ai_http_k2...abc',
        lastUsedAt: '2024-12-29T15:30:00Z',
        expiresAt: '2025-06-01T00:00:00Z',
        createdAt: '2024-12-15T00:00:00Z',
    },
];

// ==================== Component ====================

export default function ApiKeys() {
    const { toast } = useToast();

    const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
    const [isLoading] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
    const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
    const [showNewKey, setShowNewKey] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateKeyFormData>({
        resolver: zodResolver(createKeySchema),
    });

    // ==================== Handlers ====================

    const formatDate = (date: string | null) => {
        if (!date) return 'لا يوجد';
        return new Date(date).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const onCreateSubmit = async (data: CreateKeyFormData) => {
        setIsCreating(true);
        try {
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newKey: ApiKey = {
                id: Date.now().toString(),
                name: data.name,
                keyPreview: `ai_http_${Math.random().toString(36).slice(2, 8)}...`,
                lastUsedAt: null,
                expiresAt: null,
                createdAt: new Date().toISOString(),
            };

            setApiKeys([...apiKeys, newKey]);
            setNewKeyValue(`ai_http_${Math.random().toString(36).slice(2, 32)}`);
            reset();

            toast({
                title: 'تم الإنشاء',
                description: 'تم إنشاء مفتاح API بنجاح',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء الإنشاء',
                variant: 'error',
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = (key: ApiKey) => {
        setSelectedKey(key);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedKey) return;

        setIsDeleting(true);
        try {
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 500));

            setApiKeys(apiKeys.filter((k) => k.id !== selectedKey.id));
            toast({
                title: 'تم الحذف',
                description: 'تم حذف مفتاح API',
                variant: 'success',
            });
            setDeleteModalOpen(false);
            setSelectedKey(null);
        } catch {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء الحذف',
                variant: 'error',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const copyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        toast({
            title: 'تم النسخ',
            description: 'تم نسخ المفتاح',
        });
    };

    const closeCreateModal = () => {
        setCreateModalOpen(false);
        setNewKeyValue(null);
        setShowNewKey(false);
        reset();
    };

    // ==================== Render ====================

    if (isLoading) {
        return (
            <div className="flex-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">مفاتيح API</h1>
                    <p className="text-white/60 mt-1">إدارة مفاتيح الوصول للـ API</p>
                </div>
                <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    إنشاء مفتاح جديد
                </Button>
            </div>

            {/* Warning */}
            <div className="p-4 rounded-lg bg-accent-yellow/10 border border-accent-yellow/20 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-accent-yellow shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm text-white font-medium">تنبيه أمني</p>
                    <p className="text-xs text-white/60 mt-1">
                        لا تشارك مفاتيح API مع أي شخص. المفتاح يمنح وصولاً كاملاً لحسابك.
                    </p>
                </div>
            </div>

            {/* API Keys List */}
            {apiKeys.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-accent-yellow/10 flex-center mb-4">
                            <Key className="h-8 w-8 text-accent-yellow" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            لا توجد مفاتيح API
                        </h3>
                        <p className="text-white/60 text-center max-w-md mb-4">
                            أنشئ مفتاح API للوصول لخدمات AI-HTTP
                        </p>
                        <Button onClick={() => setCreateModalOpen(true)}>
                            <Plus className="h-4 w-4 ml-2" />
                            إنشاء مفتاح
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {apiKeys.map((key) => (
                        <Card key={key.id} hover>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 flex-center shrink-0">
                                        <Key className="h-5 w-5 text-accent-yellow" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-white">{key.name}</h3>
                                            {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                                                <Badge variant="error">منتهي</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-white/50 font-mono">{key.keyPreview}</p>
                                    </div>

                                    <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-white/50">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>أُنشئ: {formatDate(key.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>آخر استخدام: {formatDate(key.lastUsedAt)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyKey(key.keyPreview)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(key)}
                                        >
                                            <Trash2 className="h-4 w-4 text-action-orange" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Dialog open={createModalOpen} onOpenChange={closeCreateModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 flex-center">
                                <Key className="h-5 w-5 text-accent-yellow" />
                            </div>
                            <div>
                                <DialogTitle>
                                    {newKeyValue ? 'مفتاح API الجديد' : 'إنشاء مفتاح API'}
                                </DialogTitle>
                                <DialogDescription>
                                    {newKeyValue
                                        ? 'احفظ المفتاح في مكان آمن. لن تتمكن من رؤيته مرة أخرى.'
                                        : 'أدخل اسماً لمفتاح API الجديد'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {newKeyValue ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-lime-green/10 border border-lime-green/20">
                                <div className="flex items-center justify-between gap-2">
                                    <code
                                        className={`text-sm font-mono ${showNewKey ? 'text-white' : 'text-white/50'
                                            }`}
                                    >
                                        {showNewKey ? newKeyValue : '•'.repeat(40)}
                                    </code>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowNewKey(!showNewKey)}
                                        >
                                            {showNewKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyKey(newKeyValue)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={closeCreateModal}>تم</Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">اسم المفتاح</label>
                                <Input
                                    {...register('name')}
                                    placeholder="مثال: Production API Key"
                                    error={errors.name?.message}
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="ghost" onClick={closeCreateModal}>
                                    إلغاء
                                </Button>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                            جاري الإنشاء...
                                        </>
                                    ) : (
                                        'إنشاء'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="حذف مفتاح API"
                description={`هل أنت متأكد من حذف "${selectedKey?.name}"؟`}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}
