import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from './Button';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", variant = "danger" }) {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const variants = {
        danger: {
            icon: <AlertTriangle className="text-red-600" />,
            bg: "bg-red-50",
            button: "bg-red-600 hover:bg-red-700",
            border: "border-red-100"
        },
        warning: {
            icon: <AlertTriangle className="text-amber-600" />,
            bg: "bg-amber-50",
            button: "bg-amber-600 hover:bg-amber-700",
            border: "border-amber-100"
        },
        info: {
            icon: <AlertTriangle className="text-blue-600" />,
            bg: "bg-blue-50",
            button: "bg-blue-600 hover:bg-blue-700",
            border: "border-blue-100"
        }
    };

    const current = variants[variant] || variants.info;

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            await onConfirm();
            onClose();
        } catch (err) {
            console.error("ConfirmModal action failed:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { if (!isProcessing) onClose(); }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
                    >
                        <div className="p-6 text-center">
                            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${current.bg} ${current.border} border`}>
                                {current.icon}
                            </div>
                            <h3 className="mb-2 text-xl font-black text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
                                {title}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <div className="flex gap-2 p-4 bg-slate-50/50">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                disabled={isProcessing}
                                className="flex-1 rounded-2xl font-bold text-slate-600 hover:bg-white disabled:opacity-50"
                            >
                                {cancelText}
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className={`flex-1 rounded-2xl font-bold text-white shadow-lg ${current.button} disabled:opacity-70`}
                            >
                                {isProcessing ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                ) : (
                                    confirmText
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
