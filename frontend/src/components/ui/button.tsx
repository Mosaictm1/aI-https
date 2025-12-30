import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default:
                    'bg-accent-yellow text-deep-teal-200 hover:bg-accent-yellow-50 shadow-glow-yellow hover:shadow-[0_0_30px_rgba(255,236,92,0.4)]',
                secondary:
                    'bg-medium-green text-white hover:bg-medium-green-50',
                destructive:
                    'bg-action-orange text-white hover:bg-action-orange-50 shadow-glow-orange',
                outline:
                    'border border-white/20 bg-transparent hover:bg-white/10 hover:border-white/30',
                ghost:
                    'hover:bg-white/10 hover:text-accent-yellow',
                link:
                    'text-accent-yellow underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-12 rounded-lg px-8 text-base',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {children}
            </Comp>
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
