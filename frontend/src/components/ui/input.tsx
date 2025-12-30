import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, icon, ...props }, ref) => {
        return (
            <div className="relative">
                {icon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        'flex h-10 w-full rounded-lg border bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 transition-all duration-200',
                        'border-white/10 focus:border-accent-yellow/50 focus:outline-none focus:ring-1 focus:ring-accent-yellow/30',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-action-orange focus:border-action-orange focus:ring-action-orange/30',
                        icon && 'pr-10',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-action-orange">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
