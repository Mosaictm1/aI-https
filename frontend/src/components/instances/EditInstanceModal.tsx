// ============================================
// Edit Instance Modal
// ============================================

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Server, Eye, EyeOff, Loader2 } from 'lucide-react';
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
import { useUpdateInstance } from '@/hooks/useInstances';
import { useToast } from '@/components/ui/toast';
import type { Instance } from '@/types';

// ==================== Schema ====================

const editInstanceSchema = z.object({
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
    apiKey: z.string().optional(),
});

type EditInstanceFormData = z.infer<typeof editInstanceSchema>;

// ==================== Props ====================

interface EditInstanceModalProps {
    instance: Instance | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ==================== Component ====================

export default function EditInstanceModal({
    instance,
    open,
    onOpenChange,
}: EditInstanceModalProps) {
    const [showApiKey, setShowApiKey] = useState(false);
    const { toast } = useToast();

    const updateInstance = useUpdateInstance();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<EditInstanceFormData>({
        resolver: zodResolver(editInstanceSchema),
    });

    // Update form when instance changes
    useEffect(() => {
        if (instance) {
            reset({
                name: instance.name,
                url: instance.url,
                apiKey: '',
            });
        }
    }, [instance, reset]);

    const onSubmit = async (data: EditInstanceFormData) => {
        if (!instance) return;

        try {
            // Only include apiKey if it was changed
            const updateData: EditInstanceFormData = {
                name: data.name,
                url: data.url,
            };
            if (data.apiKey) {
                updateData.apiKey = data.apiKey;
            }

            await updateInstance.mutateAsync({ id: instance.id, data: updateData });
            toast({
                title: 'تم بنجاح!',
                description: 'تم تحديث الـ Instance بنجاح',
                variant: 'success',
            });
            onOpenChange(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'حدث خطأ أثناء التحديث';
            toast({
                title: 'خطأ',
                description: message,
                variant: 'error',
            });
        }
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
                            <DialogTitle>تعديل Instance</DialogTitle>
                            <DialogDescription>
                                تعديل معلومات {instance?.name}
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
                            <span className="text-white/50 text-xs mr-2">
                                (اتركه فارغاً للإبقاء على المفتاح الحالي)
                            </span>
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

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={handleClose}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={updateInstance.isPending}>
                            {updateInstance.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                'حفظ التغييرات'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
