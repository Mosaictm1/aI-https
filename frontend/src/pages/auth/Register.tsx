import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegister } from '@/hooks/useAuth';
import { toast } from '@/components/ui/toast';

const registerSchema = z
    .object({
        name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
        email: z.string().email('البريد الإلكتروني غير صالح'),
        password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'كلمتا المرور غير متطابقتين',
        path: ['confirmPassword'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
    const navigate = useNavigate();
    const registerMutation = useRegister();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await registerMutation.mutateAsync({
                name: data.name,
                email: data.email,
                password: data.password,
            });

            toast({
                title: 'تم إنشاء الحساب!',
                description: 'مرحباً بك في AI-HTTP',
                variant: 'success',
            });

            navigate('/dashboard');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'فشل في إنشاء الحساب. حاول مرة أخرى.';
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
                <h2 className="text-2xl font-bold text-white">إنشاء حساب جديد</h2>
                <p className="text-white/60 mt-2">ابدأ رحلتك مع AI-HTTP</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm text-white/80">الاسم الكامل</label>
                    <Input
                        type="text"
                        placeholder="أحمد محمد"
                        icon={<User className="h-4 w-4" />}
                        error={errors.name?.message}
                        {...register('name')}
                    />
                </div>

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
                    <label className="text-sm text-white/80">كلمة المرور</label>
                    <Input
                        type="password"
                        placeholder="••••••••"
                        icon={<Lock className="h-4 w-4" />}
                        error={errors.password?.message}
                        {...register('password')}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-white/80">تأكيد كلمة المرور</label>
                    <Input
                        type="password"
                        placeholder="••••••••"
                        icon={<Lock className="h-4 w-4" />}
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            جارٍ إنشاء الحساب...
                        </>
                    ) : (
                        <>
                            إنشاء حساب
                            <ArrowLeft className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>

            <p className="text-center text-sm text-white/60">
                لديك حساب بالفعل؟{' '}
                <Link to="/login" className="text-accent-yellow hover:underline font-medium">
                    تسجيل الدخول
                </Link>
            </p>

            <p className="text-center text-xs text-white/40">
                بالتسجيل، أنت توافق على{' '}
                <a href="#" className="text-accent-yellow hover:underline">
                    شروط الخدمة
                </a>{' '}
                و{' '}
                <a href="#" className="text-accent-yellow hover:underline">
                    سياسة الخصوصية
                </a>
            </p>
        </div>
    );
}
