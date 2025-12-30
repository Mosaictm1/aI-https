// ============================================
// Settings Page
// ============================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    User,
    Lock,
    Palette,
    Eye,
    EyeOff,
    Loader2,
    Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useUpdateProfile, useChangePassword } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';

// ==================== Schemas ====================

const profileSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    email: z.string().email('البريد الإلكتروني غير صالح'),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ==================== Component ====================

export default function Settings() {
    const { user } = useAuthStore();
    const { theme, setTheme } = useUIStore();
    const { toast } = useToast();

    const updateProfile = useUpdateProfile();
    const changePassword = useChangePassword();

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Profile Form
    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
        },
    });

    // Password Form
    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    // ==================== Handlers ====================

    const onProfileSubmit = async (data: ProfileFormData) => {
        try {
            await updateProfile.mutateAsync({ name: data.name });
            toast({
                title: 'تم الحفظ',
                description: 'تم تحديث الملف الشخصي بنجاح',
                variant: 'success',
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'حدث خطأ';
            toast({
                title: 'خطأ',
                description: message,
                variant: 'error',
            });
        }
    };

    const onPasswordSubmit = async (data: PasswordFormData) => {
        try {
            await changePassword.mutateAsync({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast({
                title: 'تم التغيير',
                description: 'تم تغيير كلمة المرور بنجاح',
                variant: 'success',
            });
            passwordForm.reset();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'حدث خطأ';
            toast({
                title: 'خطأ',
                description: message,
                variant: 'error',
            });
        }
    };

    // ==================== Render ====================

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
                <p className="text-white/60 mt-1">إدارة حسابك وتفضيلاتك</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="profile">
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        الملف الشخصي
                    </TabsTrigger>
                    <TabsTrigger value="password" className="gap-2">
                        <Lock className="h-4 w-4" />
                        كلمة المرور
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Palette className="h-4 w-4" />
                        المظهر
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">معلومات الملف الشخصي</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">الاسم</label>
                                    <Input
                                        {...profileForm.register('name')}
                                        placeholder="اسمك"
                                        error={profileForm.formState.errors.name?.message}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">
                                        البريد الإلكتروني
                                    </label>
                                    <Input
                                        {...profileForm.register('email')}
                                        type="email"
                                        placeholder="email@example.com"
                                        disabled
                                        className="opacity-50"
                                    />
                                    <p className="text-xs text-white/50">
                                        لا يمكن تغيير البريد الإلكتروني
                                    </p>
                                </div>

                                <Button type="submit" disabled={updateProfile.isPending}>
                                    {updateProfile.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        'حفظ التغييرات'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Password Tab */}
                <TabsContent value="password" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">تغيير كلمة المرور</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">
                                        كلمة المرور الحالية
                                    </label>
                                    <div className="relative">
                                        <Input
                                            {...passwordForm.register('currentPassword')}
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="pl-10"
                                            error={passwordForm.formState.errors.currentPassword?.message}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">
                                        كلمة المرور الجديدة
                                    </label>
                                    <div className="relative">
                                        <Input
                                            {...passwordForm.register('newPassword')}
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="pl-10"
                                            error={passwordForm.formState.errors.newPassword?.message}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">
                                        تأكيد كلمة المرور
                                    </label>
                                    <Input
                                        {...passwordForm.register('confirmPassword')}
                                        type="password"
                                        placeholder="••••••••"
                                        error={passwordForm.formState.errors.confirmPassword?.message}
                                    />
                                </div>

                                <Button type="submit" disabled={changePassword.isPending}>
                                    {changePassword.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                            جاري التغيير...
                                        </>
                                    ) : (
                                        'تغيير كلمة المرور'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">المظهر</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-white">السمة</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`p-4 rounded-lg border-2 transition-all ${theme === 'dark'
                                                ? 'border-accent-yellow bg-accent-yellow/10'
                                                : 'border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-deep-teal-200 border border-white/10" />
                                                <span className="text-white font-medium">داكن</span>
                                            </div>
                                            {theme === 'dark' && (
                                                <Check className="h-5 w-5 text-accent-yellow" />
                                            )}
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`p-4 rounded-lg border-2 transition-all ${theme === 'light'
                                                ? 'border-accent-yellow bg-accent-yellow/10'
                                                : 'border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200" />
                                                <span className="text-white font-medium">فاتح</span>
                                            </div>
                                            {theme === 'light' && (
                                                <Check className="h-5 w-5 text-accent-yellow" />
                                            )}
                                        </div>
                                    </button>
                                </div>
                                <p className="text-xs text-white/50">
                                    (السمة الفاتحة قيد التطوير)
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
