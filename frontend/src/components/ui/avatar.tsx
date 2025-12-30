import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg';
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
        const [hasError, setHasError] = React.useState(false);

        const sizeClasses = {
            sm: 'h-8 w-8 text-xs',
            md: 'h-10 w-10 text-sm',
            lg: 'h-12 w-12 text-base',
        };

        const getFallbackText = () => {
            if (fallback) return fallback;
            if (alt) {
                const words = alt.split(' ');
                if (words.length >= 2) {
                    return words[0][0] + words[1][0];
                }
                return alt.slice(0, 2);
            }
            return '??';
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'relative flex shrink-0 overflow-hidden rounded-full',
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                {src && !hasError ? (
                    <img
                        src={src}
                        alt={alt}
                        className="aspect-square h-full w-full object-cover"
                        onError={() => setHasError(true)}
                    />
                ) : (
                    <div className="flex-center h-full w-full bg-gradient-to-br from-medium-green to-deep-teal font-medium text-white uppercase">
                        {getFallbackText()}
                    </div>
                )}
            </div>
        );
    }
);
Avatar.displayName = 'Avatar';

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    max?: number;
    children: React.ReactNode;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
    ({ className, max = 4, children, ...props }, ref) => {
        const childrenArray = React.Children.toArray(children);
        const visibleChildren = childrenArray.slice(0, max);
        const remainingCount = childrenArray.length - max;

        return (
            <div
                ref={ref}
                className={cn('flex -space-x-2 rtl:space-x-reverse', className)}
                {...props}
            >
                {visibleChildren}
                {remainingCount > 0 && (
                    <div className="flex-center h-10 w-10 rounded-full bg-white/10 border-2 border-background text-xs font-medium text-white">
                        +{remainingCount}
                    </div>
                )}
            </div>
        );
    }
);
AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup };
