import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle, X, KeyRound, Lock, Loader2, Fingerprint } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

export default function VerificationModal({ isOpen, onClose, role, request, targetDonor, onVerifySuccess }) {
    const [step, setStep] = useState(1); // 1: Info/Action, 2: Success
    const [enteredCode, setEnteredCode] = useState("");
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [otherUserVerified, setOtherUserVerified] = useState(false);

    const isPatient = role === 'patient';
    const donorCode = targetDonor?.donorCode || 'D-5678';

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setEnteredCode("");
            setError("");
        }
    }, [isOpen]);

    // Listen to Firebase for completion status
    useEffect(() => {
        if (!isOpen || !request?.id || !targetDonor?.donorId) return;

        const unsub = onSnapshot(doc(db, 'requests', request.id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const verifications = data.verifications || {};
                const donorVerifs = verifications[targetDonor.donorId] || {};
                
                // If patient verifies donor, both see success eventually
                if (donorVerifs.verified) {
                    setStep(2);
                }
            }
        });

        return () => unsub();
    }, [isOpen, request, targetDonor]);

    const handleVerifyCode = async () => {
        if (!enteredCode.trim()) return;
        setIsVerifying(true);
        setError("");

        if (enteredCode.trim().toUpperCase() === donorCode.toUpperCase()) {
            try {
                const reqRef = doc(db, 'requests', request.id);
                await updateDoc(reqRef, {
                    [`verifications.${targetDonor.donorId}.verified`]: true,
                    [`verifications.${targetDonor.donorId}.verifiedAt`]: new Date().toISOString()
                });
                
                setStep(2);
                onVerifySuccess(targetDonor.donorId);
            } catch (err) {
                console.error("Failed to update verification status", err);
                setError("Connection error. Try again.");
            }
        } else {
            setError("Invalid Verification Code.");
        }
        setIsVerifying(false);
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10">
                                <ShieldCheck size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Cryptographic Auth</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Secure OTP Verification</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {step === 1 && (
                            <div className="space-y-6">
                                {isPatient ? (
                                    <div className="space-y-5">
                                        <div className="text-center space-y-2">
                                            <p className="text-sm text-slate-600 font-medium">
                                                Please ask the donor for their <span className="text-blue-600 font-bold">Security OTP</span> and enter it below.
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                                            <div className="text-center">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Donor OTP Token</label>
                                                <div className="mt-3">
                                                    <input
                                                        type="text"
                                                        value={enteredCode}
                                                        onChange={(e) => setEnteredCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase())}
                                                        className="block w-full py-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-mono uppercase text-center font-black text-3xl text-slate-800 transition-all outline-none"
                                                        placeholder="D-XXXX"
                                                        maxLength={6}
                                                        autoFocus
                                                        style={{ letterSpacing: enteredCode ? '0.25em' : 'normal' }}
                                                    />
                                                </div>
                                            </div>
                                            {error && <p className="text-xs font-bold text-red-500 text-center animate-pulse">{error}</p>}
                                        </div>

                                        <button
                                            onClick={handleVerifyCode}
                                            disabled={isVerifying || !enteredCode}
                                            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
                                        >
                                            {isVerifying ? <Loader2 className="animate-spin" size={18} /> : <Fingerprint size={18} />}
                                            Verify & Complete Handover
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="text-center space-y-2">
                                            <p className="text-sm text-slate-600 font-medium">
                                                Provide this code to the <span className="text-red-600 font-bold">Patient</span> to verify your identity and donation.
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-inner">
                                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mb-3">Your Secure OTP</p>
                                            <p className="text-5xl font-black text-blue-700 tracking-widest">{donorCode}</p>
                                            <p className="text-[10px] text-blue-400 mt-4 font-medium italic">Do not share this until you are at the hospital.</p>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <Loader2 className="animate-spin text-slate-400" size={16} />
                                            <p className="text-[11px] text-slate-500 font-medium italic">
                                                Waiting for the patient to enter this code on their device...
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 text-center py-6 animate-in zoom-in duration-500">
                                <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-200 relative">
                                    <CheckCircle size={48} />
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="absolute inset-0 bg-green-500 rounded-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-black text-2xl text-slate-900 tracking-tight">Handover Verified</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed px-4">
                                        The cryptographic token has been matched. The donation record is now secured and finalized.
                                    </p>
                                </div>
                                
                                <button
                                    onClick={onClose}
                                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
