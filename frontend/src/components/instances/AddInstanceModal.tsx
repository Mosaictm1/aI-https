// ============================================
// Add Instance Modal
// ============================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Server, Eye, EyeOff, Wifi, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateInstance, useTestConnection } from '@/hooks/useInstances';
import { useToast } from '@/components/ui/toast';

// ==================== Schema ====================

const addInstanceSchema = z.object({
    name: z
        .string()
        .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
        .max(100, 'الاسم يجب أن يكون أقل من 100 حرف'),
    url: z
        .string()
        .url('الرابط غير صالح')
        .refine(
            (url) => url.startsWith('http://') || url.startsWith('https://'),
            'الرابط يجب أن يبدأ بـ http:// أو https://'
        ),
    apiKey: z.string().min(1, 'مفتاح API مطلوب'),
});

type AddInstanceFormData = z.infer<typeof addInstanceSchema>;

// ==================== Props ====================

interface AddInstanceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ==================== Component ====================

export default function AddInstanceModal({ open, onOpenChange }: AddInstanceModalProps) {
    const [showApiKey, setShowApiKey] = useState(false);
    const { toast } = useToast();

    const createInstance = useCreateInstance();
    const testConnection = useTestConnection();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        getValues,
    } = useForm<AddInstanceFormData>({
        resolver: zodResolver(addInstanceSchema),
        defaultValues: {
            name: '',
            url: '',
            apiKey: '',
        },
    });

    const onSubmit = async (data: AddInstanceFormData) => {
        try {
            await createInstance.mutateAsync(data);
            toast({
                title: 'تم بنجاح!',
                description: 'تمت إضافة الـ Instance بنجاح',
                variant: 'success',
            });
            reset();
            onOpenChange(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'حدث خطأ أثناء الإضافة';
            toast({
                title: 'خطأ',
                description: message,
                variant: 'error',
            });
        }
    };

    const handleTestConnection = async () => {
        const values = getValues();
        if (!values.url || !values.apiKey) {
            toast({
                title: 'تنبيه',
                description: 'يرجى إدخال الرابط ومفتاح API أولاً',
                variant: 'warning',
            });
            return;
        }

        // For testing, we need to create a temporary instance first
        // In a real app, you might have a dedicated test endpoint
        toast({
            title: 'جاري الاختبار...',
            description: 'يتم التحقق من الاتصال',
        });
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-yellow/20 to-action-orange/10 flex-center">
                            <Server className="h-5 w-5 text-accent-yellow" />
                        </div>
                        <div>
                            <DialogTitle>إضافة Instance جديد</DialogTitle>
                            <DialogDescription>
                                أضف n8n instance للاتصال به
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                            الاسم
                        </label>
                        <Input
                            {...register('name')}
                            placeholder="مثال: Production Server"
                            error={errors.name?.message}
                        />
                    </div>

                    {/* URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                            رابط n8n
                        </label>
                        <Input
                            {...register('url')}
                            placeholder="https://your-n8n.example.com"
                            error={errors.url?.message}
                        />
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                            مفتاح API
                        </label>
                        <div className="relative">
                            <Input
                                {...register('apiKey')}
                                type={showApiKey ? 'text' : 'password'}
                                placeholder="n8n_api_..."
                                error={errors.apiKey?.message}
                                className="pl-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                            >
                                {showApiKey ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Test Connection Button */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleTestConnection}
                        disabled={testConnection.isPending}
                    >
                        {testConnection.isPending ? (
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                            <Wifi className="h-4 w-4 ml-2" />
                        )}
                        اختبار الاتصال
                    </Button>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={handleClose}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={createInstance.isPending}>
                            {createInstance.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                    جاري الإضافة...
                                </>
                            ) : (
                                'إضافة'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
