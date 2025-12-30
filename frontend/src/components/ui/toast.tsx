import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Viewport>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
            'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:left-0 sm:top-auto sm:flex-col md:max-w-[420px]',
            className
        )}
        {...props}
    />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-bottom-full',
    {
        variants: {
            variant: {
                default: 'border-white/10 bg-deep-teal/95 backdrop-blur-xl text-white',
                success: 'border-lime-green/30 bg-lime-green/10 backdrop-blur-xl text-lime-green',
                error: 'border-action-orange/30 bg-action-orange/10 backdrop-blur-xl text-action-orange',
                warning: 'border-accent-yellow/30 bg-accent-yellow/10 backdrop-blur-xl text-accent-yellow',
                info: 'border-medium-green/30 bg-medium-green/10 backdrop-blur-xl text-medium-green-50',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

const Toast = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
    return (
        <ToastPrimitives.Root
            ref={ref}
            className={cn(toastVariants({ variant }), className)}
            {...props}
        />
    );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Action>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Action
        ref={ref}
        className={cn(
            'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-white/20 bg-transparent px-3 text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50',
            className
        )}
        {...props}
    />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            'absolute left-2 top-2 rounded-md p-1 text-white/50 opacity-0 transition-opacity hover:text-white focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
            className
        )}
        toast-close=""
        {...props}
    >
        <X className="h-4 w-4" />
    </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Title>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Title
        ref={ref}
        className={cn('text-sm font-semibold', className)}
        {...props}
    />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Description>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Description
        ref={ref}
        className={cn('text-sm opacity-90', className)}
        {...props}
    />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

// Toast Hook
interface ToastOptions {
    title?: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    action?: ToastActionElement;
}

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastOptions & {
    id: string;
    open: boolean;
};

let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}

type Action =
    | { type: 'ADD_TOAST'; toast: ToasterToast }
    | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> }
    | { type: 'DISMISS_TOAST'; toastId?: string }
    | { type: 'REMOVE_TOAST'; toastId?: string };

interface State {
    toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
    if (toastTimeouts.has(toastId)) {
        return;
    }

    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId);
        dispatch({
            type: 'REMOVE_TOAST',
            toastId: toastId,
        });
    }, TOAST_REMOVE_DELAY);

    toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'ADD_TOAST':
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            };

        case 'UPDATE_TOAST':
            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    t.id === action.toast.id ? { ...t, ...action.toast } : t
                ),
            };

        case 'DISMISS_TOAST': {
            const { toastId } = action;

            if (toastId) {
                addToRemoveQueue(toastId);
            } else {
                state.toasts.forEach((toast) => {
                    addToRemoveQueue(toast.id);
                });
            }

            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    t.id === toastId || toastId === undefined
                        ? {
                            ...t,
                            open: false,
                        }
                        : t
                ),
            };
        }
        case 'REMOVE_TOAST':
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: [],
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t) => t.id !== action.toastId),
            };
    }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener) => {
        listener(memoryState);
    });
}

function toast(opts: ToastOptions) {
    const id = genId();

    const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

    dispatch({
        type: 'ADD_TOAST',
        toast: {
            ...opts,
            id,
            open: true,
        },
    });

    return {
        id,
        dismiss,
    };
}

function useToast() {
    const [state, setState] = React.useState<State>(memoryState);

    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [state]);

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
    };
}

// Toaster Component
function Toaster() {
    const { toasts } = useToast();

    const getIcon = (variant?: string) => {
        switch (variant) {
            case 'success':
                return <CheckCircle2 className="h-5 w-5" />;
            case 'error':
                return <AlertCircle className="h-5 w-5" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5" />;
            case 'info':
                return <Info className="h-5 w-5" />;
            default:
                return null;
        }
    };

    return (
        <ToastProvider>
            {toasts.map(({ id, title, description, variant, action, ...props }) => (
                <Toast key={id} variant={variant} {...props}>
                    <div className="flex items-start gap-3">
                        {getIcon(variant)}
                        <div className="grid gap-1">
                            {title && <ToastTitle>{title}</ToastTitle>}
                            {description && <ToastDescription>{description}</ToastDescription>}
                        </div>
                    </div>
                    {action}
                    <ToastClose />
                </Toast>
            ))}
            <ToastViewport />
        </ToastProvider>
    );
}

export {
    type ToastProps,
    type ToastActionElement,
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
    Toaster,
    useToast,
    toast,
};
