import { motion } from 'framer-motion';
import { HeartPulse } from 'lucide-react';

export function LoadingSpinner({ size = "md", className = "", fullScreen = false }) {
    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-12 w-12",
        lg: "h-20 w-20",
        xl: "h-32 w-32"
    };

    const iconSizes = {
        sm: 14,
        md: 24,
        lg: 40,
        xl: 64
    };

    const content = (
        <div className={`flex flex-col justify-center items-center gap-4 ${className}`}>
            <div className="relative">
                {/* Outer Glow Ring */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={`${sizeClasses[size]} absolute rounded-full bg-red-500 blur-xl`}
                />
                
                {/* Spinning Ring */}
                <div
                    className={`${sizeClasses[size]} animate-spin rounded-full border-[3px] border-red-100 border-t-red-600 shadow-sm`}
                    role="status"
                    aria-label="Loading"
                />

                {/* Pulsing Heart Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <HeartPulse size={iconSizes[size]} className="text-red-600" />
                    </motion.div>
                </div>
            </div>
            
            {size !== 'sm' && (
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-bold uppercase tracking-[0.2em] text-red-600/60"
                >
                    Synchronizing
                </motion.p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md">
                {content}
            </div>
        );
    }

    return content;
}
