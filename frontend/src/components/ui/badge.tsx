import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-white/10 text-white border border-white/10',
                success: 'bg-lime-green/20 text-lime-green border border-lime-green/30',
                warning: 'bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/30',
                error: 'bg-action-orange/20 text-action-orange border border-action-orange/30',
                info: 'bg-medium-green/20 text-medium-green-50 border border-medium-green/30',
                outline: 'text-white border border-white/20',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props}>
            {dot && (
                <span
                    className={cn(
                        'ml-1.5 h-1.5 w-1.5 rounded-full',
                        variant === 'success' && 'bg-lime-green',
                        variant === 'warning' && 'bg-accent-yellow',
                        variant === 'error' && 'bg-action-orange',
                        variant === 'info' && 'bg-medium-green-50',
                        (!variant || variant === 'default') && 'bg-white/50'
                    )}
                />
            )}
            {children}
        </div>
    );
}

export { Badge, badgeVariants };
