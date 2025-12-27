import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlayCircle, Building2, MapPin } from 'lucide-react';
import { Button } from './Button';

export default function DemoModal({ isOpen, onClose }) {
    const [scene, setScene] = useState(0);

    // Auto-advance scenes
    useEffect(() => {
        if (!isOpen) {
            setScene(0);
            return;
        }

        const timers = [
            setTimeout(() => setScene(1), 5000), // Scene 0 -> 1 
            setTimeout(() => setScene(2), 10000), // Scene 1 -> 2
            setTimeout(() => setScene(3), 16000) // Scene 2 -> 3
        ];

        return () => timers.forEach(clearTimeout);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-900 w-[95vw] md:w-full max-w-5xl max-h-[85dvh] aspect-[4/5] md:aspect-video rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
            >
                {/* Header */}
                <div className="absolute top-4 right-4 z-20">
                    <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 dark:bg-gray-800 flex">
                    <motion.div
                        className="h-full bg-red-600"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 21, ease: "linear" }}
                    />
                </div>

                {/* Content Container */}
                <div className="flex-1 relative bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-gray-900 overflow-hidden">
                    {/* Background Elements (Clouds, Ground) */}
                    <div className="absolute bottom-0 w-full h-1/3 bg-green-50/50 dark:bg-green-900/10 border-t border-green-100/50 dark:border-green-900/20" />
                    <Cloud className="top-10 left-10" delay={0} />
                    <Cloud className="top-20 right-20" delay={2} />

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            {scene === 0 && <SceneRequest key="scene0" />}
                            {scene === 1 && <SceneBroadcast key="scene1" />}
                            {scene === 2 && <SceneTravel key="scene2" />}
                            {scene === 3 && <SceneCelebration key="scene3" onClose={onClose} />}
                        </AnimatePresence>
                    </div>

                    {/* Scene Indicators */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                        {["Request", "Network", "Response", "Life Saved"].map((label, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${i === scene ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${i === scene ? 'text-red-900 dark:text-red-400' : 'text-gray-300 dark:text-gray-600'}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ----------------------------------------------------------------------
// CHARACTERS & ASSETS
// ----------------------------------------------------------------------

function Cloud({ className, delay }) {
    return (
        <motion.div
            className={`absolute ${className} text-blue-100 dark:text-white/5`}
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: delay, ease: "easeInOut" }}
        >
            <div className="h-8 w-16 bg-white rounded-full opacity-80" />
        </motion.div>
    );
}

function Human({ color, scale = 1, expression = "neutral" }) {
    return (
        <motion.div className="flex flex-col items-center relative" style={{ scale }}>
            {/* Head */}
            <div className={`h-8 w-8 rounded-full ${color} shadow-sm z-10 relative overflow-hidden`}>
                {/* Simple Face */}
                {expression === "sad" && (
                    <div className="absolute top-3 left-2 right-2 flex justify-between px-1">
                        <div className="h-1 w-1 bg-white/50 rounded-full" />
                        <div className="h-1 w-1 bg-white/50 rounded-full" />
                    </div>
                )}
            </div>
            {/* Body */}
            <div className={`h-10 w-6 rounded-t-xl rounded-b-md ${color} -mt-1 opacity-90 shadow-sm`} />
        </motion.div>
    );
}

function Hospital() {
    return (
        <div className="relative flex flex-col items-center">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center absolute -top-10 shadow-sm animate-bounce">
                <div className="h-4 w-1 bg-red-600 absolute" />
                <div className="h-1 w-4 bg-red-600 absolute" />
            </div>
            <div className="h-24 w-20 bg-white border-2 border-gray-200 rounded-t-xl shadow-lg relative overflow-hidden flex flex-col items-center justify-end">
                {/* Windows */}
                <div className="flex gap-1 mb-2">
                    <div className="h-3 w-3 bg-blue-100 rounded-sm" />
                    <div className="h-3 w-3 bg-blue-100 rounded-sm" />
                </div>
                <div className="flex gap-1 mb-4">
                    <div className="h-3 w-3 bg-blue-100 rounded-sm" />
                    <div className="h-3 w-3 bg-blue-100 rounded-sm" />
                </div>
                {/* Door */}
                <div className="h-6 w-8 bg-gray-100 rounded-t-md" />
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 px-2 py-0.5 rounded-full shadow-sm">Blood Center</span>
        </div>
    );
}

// ----------------------------------------------------------------------
// SCENES
// ----------------------------------------------------------------------

// Scene 0: Patient at Hospital needs blood
function SceneRequest() {
    return (
        <div className="flex flex-col items-center gap-8">
            <div className="flex items-end gap-2 md:gap-12 scale-75 md:scale-100 origin-bottom">
                {/* Hospital */}
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <Hospital />
                </motion.div>

                {/* Patient */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative"
                >
                    <Human color="bg-gray-400" expression="sad" />
                    {/* Distress Signal */}
                    <motion.div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                    >
                        Needs A+ Blood!
                    </motion.div>
                </motion.div>
            </div>

            <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-bold text-gray-800 dark:text-gray-100"
            >
                1. Request
            </motion.h2>
            <p className="text-gray-500 dark:text-gray-400">Patient or Hospital broadcasts an emergency.</p>
        </div>
    );
}

// Scene 1: Network Broadcast
function SceneBroadcast() {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Center Broadcast Hub */}
            <div className="relative z-10">
                <Hospital />
                {/* Waves */}
                {[1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-red-500 rounded-full opacity-0"
                        animate={{ width: [50, 400], height: [50, 400], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                    />
                ))}
            </div>

            {/* Donors appearing */}
            <motion.div className="absolute top-[25%] left-[10%] scale-75 md:scale-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                <Human color="bg-blue-500" scale={0.8} />
                <NotificationBubble delay={1.5} />
            </motion.div>

            <motion.div className="absolute bottom-[35%] right-[15%] scale-75 md:scale-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                <Human color="bg-indigo-500" scale={0.8} />
                <NotificationBubble delay={1.7} />
            </motion.div>

            <motion.div className="absolute top-[35%] right-[5%] scale-75 md:scale-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                <Human color="bg-teal-500" scale={0.8} />
                <NotificationBubble delay={1.9} />
            </motion.div>

            <div className="absolute bottom-10 text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">2. Notification</h2>
                <p className="text-gray-500 dark:text-gray-400">Nearby eligible donors are instantly alerted.</p>
            </div>
        </div>
    );
}

function NotificationBubble({ delay }) {
    return (
        <motion.div
            className="absolute -top-8 -right-8 bg-red-600 text-white p-1 rounded-lg text-[10px] font-bold shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay, type: "spring" }}
        >
            Help!
        </motion.div>
    );
}

// Scene 2: Travel & Donating
function SceneTravel() {
    return (
        <div className="w-full flex flex-col items-center justify-center relative h-full">
            {/* Road */}
            <div className="absolute bottom-1/3 md:bottom-32 w-2/3 h-2 bg-gray-200 rounded-full" />

            <div className="flex justify-between w-[90%] md:w-1/2 items-end relative z-10 mb-8 scale-90 md:scale-100 origin-bottom">
                {/* Donor Walking */}
                <motion.div
                    initial={{ x: -100 }}
                    animate={{ x: 0 }} // Move to center
                    transition={{ duration: 4, ease: "easeInOut" }}
                >
                    <Human color="bg-blue-600" />
                    <motion.div
                        className="text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1 rounded absolute -bottom-4 left-0 text-gray-900 dark:text-gray-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Donor
                    </motion.div>
                </motion.div>

                {/* Hospital Destination */}
                <Hospital />
            </div>

            <div className="text-center mt-12">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">3. Donation</h2>
                <p className="text-gray-500 dark:text-gray-400">Donor accepts and travels to the center.</p>
            </div>
        </div>
    );
}

// Scene 3: Conclusion
function SceneCelebration({ onClose }) {
    return (
        <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-4 mb-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                >
                    <Human color="bg-blue-600" />
                </motion.div>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.2 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-red-500"
                >
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                        <div className="h-12 w-12 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl animate-pulse">
                            ❤️
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                >
                    <Human color="bg-gray-400" />
                </motion.div>
            </div>

            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900 mb-4"
            >
                Life Saved!
            </motion.h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                This is how LifeLink bridges the gap between emergency and hope.
            </p>

            <Button size="lg" onClick={onClose} className="shadow-xl shadow-red-200 px-8">
                Join the Network
            </Button>
        </div>
    );
}
