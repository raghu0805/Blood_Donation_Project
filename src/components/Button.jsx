import { cn } from '../lib/utils';
// We'll create utils next




export function Button({ className, variant = 'primary', size = 'default', children, ...props }) {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md shadow-red-200",
        secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 focus:ring-gray-200",
        outline: "border border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-200",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
    };

    const sizes = {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-8 text-lg",
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
}
