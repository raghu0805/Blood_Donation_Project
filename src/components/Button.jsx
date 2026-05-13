import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({ className, variant = 'primary', size = 'default', isLoading = false, children, disabled, ...props }) {
    const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-all active:scale-95 focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-[#e60026] text-white hover:bg-red-700 shadow-lg shadow-red-900/20 px-6",
        secondary: "bg-navy-700 text-white hover:bg-navy-600 border border-navy-700 px-6",
        outline: "border-2 border-[#e60026] text-[#e60026] hover:bg-[#e60026] hover:text-white px-6",
        ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/10 px-6",
    };

    const sizes = {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-8 text-lg",
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="opacity-80">{children}</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}
