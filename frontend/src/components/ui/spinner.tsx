import { cn } from '@/lib/utils';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <div className={cn('relative', sizeClasses[size], className)}>
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-yellow animate-spin" />
        </div>
    );
}

export function LoadingScreen({ message = 'جارٍ التحميل...' }: { message?: string }) {
    return (
        <div className="fixed inset-0 flex-center bg-background/80 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-white/70 text-sm animate-pulse">{message}</p>
            </div>
        </div>
    );
}

export function LoadingCard() {
    return (
        <div className="glass-card p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-white/10" />
                <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                </div>
            </div>
            <div className="space-y-3">
                <div className="h-3 w-full rounded bg-white/10" />
                <div className="h-3 w-4/5 rounded bg-white/10" />
                <div className="h-3 w-3/5 rounded bg-white/10" />
            </div>
        </div>
    );
}
