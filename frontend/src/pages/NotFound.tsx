import { Link } from 'react-router-dom';
import { Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="min-h-screen flex-center relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 animated-bg" />

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-72 h-72 bg-action-orange/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent-yellow/5 rounded-full blur-3xl animate-pulse-slow" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4">
                {/* 404 Text */}
                <div className="relative mb-8">
                    <h1 className="text-[150px] md:text-[200px] font-black leading-none gradient-text-orange opacity-20">
                        404
                    </h1>
                    <div className="absolute inset-0 flex-center">
                        <div className="text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                الصفحة غير موجودة
                            </h2>
                            <p className="text-white/60 max-w-md">
                                عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
                                ربما تم نقلها أو حذفها.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button asChild>
                        <Link to="/">
                            <Home className="h-4 w-4 ml-2" />
                            العودة للرئيسية
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to="/dashboard">
                            الذهاب للوحة التحكم
                            <ArrowRight className="h-4 w-4 mr-2" />
                        </Link>
                    </Button>
                </div>

                {/* Help Link */}
                <p className="mt-8 text-sm text-white/40">
                    تحتاج مساعدة؟{' '}
                    <a href="#" className="text-accent-yellow hover:underline">
                        تواصل معنا
                    </a>
                </p>
            </div>
        </div>
    );
}
