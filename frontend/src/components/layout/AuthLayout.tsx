import { Link } from 'react-router-dom';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex-center relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 animated-bg" />

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 right-10 w-72 h-72 bg-accent-yellow/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-10 left-10 w-96 h-96 bg-lime-green/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
                <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-action-orange/5 rounded-full blur-3xl" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-md px-4">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <h1 className="text-3xl font-bold gradient-text">AI-HTTP</h1>
                        <p className="text-white/60 text-sm mt-1">مساعد HTTP الذكي</p>
                    </Link>
                </div>

                {/* Auth Card */}
                <div className="glass-card p-8">
                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-white/40 text-xs mt-6">
                    © 2024 AI-HTTP. جميع الحقوق محفوظة.
                </p>
            </div>
        </div>
    );
}
