import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function CountdownTimer({ targetDate, className, variant = 'default', size = 'md' }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        const difference = +new Date(targetDate) - +new Date();

        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }; // Time's up
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    // Styles based on variant
    const styles = {
        default: {
            box: "bg-white/80 border-amber-200 text-amber-600",
            label: "text-amber-800/60",
            separator: "text-amber-400"
        },
        hero: {
            box: "bg-white/90 border-white/20 text-red-600 shadow-lg",
            label: "text-red-900/60",
            separator: "text-white/80"
        },
        critical: {
            box: "bg-red-600 border-red-600 text-white shadow-md",
            label: "text-white/90",
            separator: "text-red-600"
        }
    };

    const currentStyle = styles[variant] || styles.default;

    // Size mappings
    const sizeClasses = {
        sm: { box: "min-w-[2rem] md:min-w-[2.5rem] p-1 md:p-1.5", num: "text-sm md:text-lg", label: "text-[0.5rem] md:text-[0.6rem]" },
        md: { box: "min-w-[2.5rem] sm:min-w-[3rem] p-1.5 sm:p-2", num: "text-lg sm:text-xl", label: "text-[0.6rem] sm:text-[0.65rem]" },
        lg: { box: "min-w-[3rem] sm:min-w-[4rem] p-2 sm:p-3", num: "text-xl sm:text-3xl", label: "text-[0.65rem] sm:text-xs" }
    };

    const currentSize = sizeClasses[size] || sizeClasses.md;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="flex gap-2">
                <TimeUnit value={timeLeft.days} label="Days" currentStyle={currentStyle} currentSize={currentSize} />
                <span className={cn("font-bold self-start mt-2", currentStyle.separator, size === 'lg' ? 'mt-4 text-2xl' : '')}>:</span>
                <TimeUnit value={timeLeft.hours} label="Hrs" currentStyle={currentStyle} currentSize={currentSize} />
                <span className={cn("font-bold self-start mt-2", currentStyle.separator, size === 'lg' ? 'mt-4 text-2xl' : '')}>:</span>
                <TimeUnit value={timeLeft.minutes} label="Mins" currentStyle={currentStyle} currentSize={currentSize} />
                <span className={cn("font-bold self-start mt-2", currentStyle.separator, size === 'lg' ? 'mt-4 text-2xl' : '')}>:</span>
                <TimeUnit value={timeLeft.seconds} label="Secs" currentStyle={currentStyle} currentSize={currentSize} />
            </div>
        </div>
    );
}

const TimeUnit = ({ value, label, currentStyle, currentSize }) => (
    <div className="flex flex-col items-center">
        <div className={cn(
            "backdrop-blur-sm rounded-lg text-center border shadow-sm transition-all",
            currentStyle.box,
            currentSize.box
        )}>
            <span className={cn("font-bold block leading-none", currentSize.num)}>
                {String(value).padStart(2, '0')}
            </span>
            <span className={cn("uppercase font-bold mt-0.5 block", currentStyle.label, currentSize.label)}>
                {label}
            </span>
        </div>
    </div>
);
