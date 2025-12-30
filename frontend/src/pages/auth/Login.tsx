import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/useAuth';
import { toast } from '@/components/ui/toast';

const loginSchema = z.object({
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
    const navigate = useNavigate();
    const loginMutation = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            await loginMutation.mutateAsync(data);

            toast({
                title: 'مرحباً بك!',
                description: 'تم تسجيل الدخول بنجاح',
                variant: 'success',
            });

            navigate('/dashboard');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'فشل في تسجيل الدخول. تحقق من بياناتك.';
            toast({
                title: 'خطأ',
                description: message,
                variant: 'error',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white">تسجيل الدخول</h2>
                <p className="text-white/60 mt-2">أدخل بياناتك للوصول إلى حسابك</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm text-white/80">البريد الإلكتروني</label>
                    <Input
                        type="email"
                        placeholder="example@email.com"
                        icon={<Mail className="h-4 w-4" />}
                        error={errors.email?.message}
                        {...register('email')}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-white/80">كلمة المرور</label>
                        <Link
                            to="/forgot-password"
                            className="text-xs text-accent-yellow hover:underline"
                        >
                            نسيت كلمة المرور؟
                        </Link>
                    </div>
                    <Input
                        type="password"
                        placeholder="••••••••"
                        icon={<Lock className="h-4 w-4" />}
                        error={errors.password?.message}
                        {...register('password')}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            جارٍ تسجيل الدخول...
                        </>
                    ) : (
                        <>
                            تسجيل الدخول
                            <ArrowLeft className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-deep-teal/95 px-2 text-white/40">أو</span>
                </div>
            </div>

            <p className="text-center text-sm text-white/60">
                ليس لديك حساب؟{' '}
                <Link to="/register" className="text-accent-yellow hover:underline font-medium">
                    إنشاء حساب جديد
                </Link>
            </p>
        </div>
    );
}
