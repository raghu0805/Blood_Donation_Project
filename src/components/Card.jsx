import { cn } from '../lib/utils';

export function Card({ className, children, ...props }) {
    return (
        <div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors text-gray-900 dark:text-gray-100", className)} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }) {
    return (
        <div className={cn("p-6 pb-2", className)} {...props}>
            {children}
        </div>
    );
}

export function CardContent({ className, children, ...props }) {
    return (
        <div className={cn("p-6 pt-2", className)} {...props}>
            {children}
        </div>
    );
}
