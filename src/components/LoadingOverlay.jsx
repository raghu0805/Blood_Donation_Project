import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse } from 'lucide-react';

/**
 * Premium full-screen loading overlay for async operations.
 * 
 * @param {boolean} isLoading - Whether the overlay is visible
 * @param {string} message - Primary status message (e.g. "Saving Profile...")
 * @param {string} subMessage - Optional secondary message (e.g. "Please wait while we update your data")
 */
export default function LoadingOverlay({ isLoading, message = "Processing...", subMessage = "" }) {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 20 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col items-center gap-6 rounded-3xl px-10 py-10"
                        style={{
                            background: "rgba(255,255,255,0.92)",
                            boxShadow: "0 32px 80px rgba(220,38,38,0.12), 0 0 0 1px rgba(220,38,38,0.06)",
                            border: "1px solid rgba(220,38,38,0.08)"
                        }}
                    >
                        {/* Animated Heart Logo */}
                        <div className="relative">
                            {/* Outer ping ring */}
                            <motion.div
                                animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 rounded-full"
                                style={{ background: "radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 70%)" }}
                            />
                            {/* Middle pulse ring */}
                            <motion.div
                                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                                className="absolute inset-0 rounded-full"
                                style={{ background: "radial-gradient(circle, rgba(212,160,23,0.2) 0%, transparent 70%)" }}
                            />
                            {/* Icon container with heartbeat */}
                            <motion.div
                                animate={{ scale: [1, 1.08, 1, 1.08, 1] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                className="relative flex h-20 w-20 items-center justify-center rounded-2xl"
                                style={{
                                    background: "linear-gradient(135deg, #dc2626, #d4a017)",
                                    boxShadow: "0 8px 32px rgba(220,38,38,0.3)"
                                }}
                            >
                                <HeartPulse className="h-10 w-10 text-white" />
                            </motion.div>
                        </div>

                        {/* Message */}
                        <div className="text-center">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="text-lg font-black text-gray-900 tracking-tight"
                                style={{ fontFamily: "var(--font-heading)" }}
                            >
                                {message}
                            </motion.p>
                            {subMessage && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                    className="mt-1.5 text-sm text-slate-400 font-medium"
                                >
                                    {subMessage}
                                </motion.p>
                            )}
                        </div>

                        {/* Animated progress dots */}
                        <div className="flex items-center gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                                    className="h-2 w-2 rounded-full"
                                    style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)" }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
