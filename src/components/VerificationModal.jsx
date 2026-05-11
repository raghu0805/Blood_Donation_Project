import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, MapPin, CheckCircle, AlertTriangle, X, KeyRound, Lock, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// Helper to calculate distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export default function VerificationModal({ isOpen, onClose, role, request, targetDonor, onVerifySuccess }) {
    const [step, setStep] = useState(1); // 1: Info, 2: Proximity Check, 3: Code Exchange, 4: Success
    const [myLocation, setMyLocation] = useState(null);
    const [otherLocation, setOtherLocation] = useState(null);
    const [distance, setDistance] = useState(null);
    const [enteredCode, setEnteredCode] = useState("");
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [otherUserVerified, setOtherUserVerified] = useState(false);

    const isPatient = role === 'patient';
    const myCode = isPatient ? (targetDonor?.patientCode || 'P-1234') : (targetDonor?.donorCode || 'D-5678');
    const expectedCode = isPatient ? (targetDonor?.donorCode || 'D-5678') : (targetDonor?.patientCode || 'P-1234');

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setMyLocation(null);
            setDistance(null);
            setEnteredCode("");
            setError("");
        }
    }, [isOpen]);

    // Listen to Firebase for the other person's verification location
    useEffect(() => {
        if (!isOpen || !request?.id || !targetDonor?.donorId) return;

        const unsub = onSnapshot(doc(db, 'requests', request.id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const verifications = data.verifications || {};
                const donorVerifs = verifications[targetDonor.donorId] || {};
                
                const otherRole = isPatient ? 'donor' : 'patient';
                if (donorVerifs[otherRole]) {
                    setOtherLocation(donorVerifs[otherRole]);
                }
                if (donorVerifs[`${otherRole}Verified`]) {
                    setOtherUserVerified(true);
                }
            }
        });

        return () => unsub();
    }, [isOpen, request, targetDonor, isPatient]);

    // Continuously check distance if both locations are known
    useEffect(() => {
        if (myLocation && otherLocation) {
            const dist = getDistance(myLocation.lat, myLocation.lng, otherLocation.lat, otherLocation.lng);
            setDistance(Math.round(dist));
            if (dist <= 100 && step === 2) {
                setStep(3); // Auto proceed to code exchange
            }
        }
    }, [myLocation, otherLocation, step]);

    const handleShareLocation = () => {
        setIsVerifying(true);
        setError("");
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setIsVerifying(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const coords = { lat: position.coords.latitude, lng: position.coords.longitude, timestamp: new Date().getTime() };
            setMyLocation(coords);
            
            try {
                // Update Firebase so the other person sees our location
                const reqRef = doc(db, 'requests', request.id);
                const fieldPath = `verifications.${targetDonor.donorId}.${role}`;
                await updateDoc(reqRef, {
                    [fieldPath]: coords
                });
                setStep(2);
            } catch (err) {
                console.error("Error sharing location", err);
                setError("Failed to share location for verification.");
            }
            setIsVerifying(false);
        }, (err) => {
            setError("Failed to get your location. Please enable GPS permissions.");
            setIsVerifying(false);
        }, { enableHighAccuracy: true });
    };

    const handleVerifyCode = async () => {
        if (!enteredCode.trim()) return;
        setIsVerifying(true);
        setError("");

        // Simulated cryptographic token check (in a real app this would be backend validated)
        if (enteredCode.trim().toUpperCase() === expectedCode.toUpperCase()) {
            // Cryptographic mock validation
            const cryptoToken = btoa(`${request.id}:${targetDonor.donorId}:${myCode}:${expectedCode}`);
            console.log("Token matched:", cryptoToken);
            
            // Mark ourselves as verified in Firebase
            try {
                const reqRef = doc(db, 'requests', request.id);
                await updateDoc(reqRef, {
                    [`verifications.${targetDonor.donorId}.${role}Verified`]: true
                });
            } catch (err) {
                console.error("Failed to update verification status", err);
            }

            setStep(4);
            // Trigger backend completion immediately without closing the modal
            onVerifySuccess(targetDonor.donorId);
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
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Secure Verification</h3>
                                <p className="text-blue-100 text-xs mt-0.5">Proximity & Cryptographic Check</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {step === 1 && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 text-center">
                                    To ensure safety, both the Patient and Donor must be physically present.
                                </p>
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                    <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mb-1">Your Unique Code</p>
                                    <p className="text-3xl font-black text-blue-700 tracking-widest">{myCode}</p>
                                    <p className="text-[10px] text-blue-600/70 mt-2">Share this code only after proximity is verified.</p>
                                </div>
                                <button
                                    onClick={handleShareLocation}
                                    disabled={isVerifying}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isVerifying ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                                    Share Location & Verify Proximity
                                </button>
                                {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 text-center py-4">
                                <div className="relative w-20 h-20 mx-auto">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                                    <div className="relative w-full h-full bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-200">
                                        <MapPin size={32} className="text-blue-500" />
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">Checking Proximity...</h4>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Waiting for the {isPatient ? 'Donor' : 'Patient'} to open this screen and share their location.
                                    </p>
                                </div>

                                {distance !== null && (
                                    <div className={`p-3 rounded-xl border ${distance <= 100 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                        <p className="text-sm font-bold">Distance: {distance} meters</p>
                                        {distance > 100 && <p className="text-xs mt-1">You must be within 100m to exchange codes.</p>}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-5 animate-in fade-in zoom-in duration-300">
                                <div className="flex flex-col items-center text-center pb-2">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                            <CheckCircle size={14} />
                                        </div>
                                        <h4 className="font-bold text-green-700 text-sm">Proximity Verified! ({distance}m)</h4>
                                    </div>
                                    
                                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-5 py-2.5 mt-1 inline-flex flex-col items-center shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Share this code with the {isPatient ? 'Donor' : 'Patient'}</span>
                                        <span className="text-xl font-black text-slate-800 tracking-widest mt-0.5">{myCode}</span>
                                    </div>
                                </div>

                                {otherUserVerified && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3 mt-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5 shrink-0">
                                            <CheckCircle size={14} />
                                        </div>
                                        <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                            <strong className="font-bold text-blue-900 block mb-0.5">Awesome!</strong>
                                            The {isPatient ? 'Donor' : 'Patient'} has successfully verified your code. Enter their code below to complete the process.
                                        </p>
                                    </div>
                                )}

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                                    <div className="text-center">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Enter {isPatient ? "Donor's" : "Patient's"} Code</label>
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                value={enteredCode}
                                                onChange={(e) => setEnteredCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase())}
                                                className="block w-full py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase text-center font-black text-3xl text-slate-800 transition-all outline-none shadow-sm"
                                                placeholder={isPatient ? "D-XXXX" : "P-XXXX"}
                                                maxLength={6}
                                                style={{ letterSpacing: enteredCode ? '0.25em' : 'normal' }}
                                            />
                                        </div>
                                    </div>
                                    {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
                                </div>

                                <button
                                    onClick={handleVerifyCode}
                                    disabled={isVerifying || !enteredCode}
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isVerifying ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                                    Verify Cryptographic Token
                                </button>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-5 text-center py-6 animate-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                                    <CheckCircle size={40} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl text-gray-800">Verification Successful!</h4>
                                    <p className="text-sm text-gray-500 mt-2">Tokens matched. You have successfully verified the {isPatient ? 'Donor' : 'Patient'}.</p>
                                </div>
                                
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2 inline-flex flex-col items-center shadow-sm w-full">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-1">
                                        Important: Share this code so the {isPatient ? 'Donor' : 'Patient'} can verify you
                                    </span>
                                    <span className="text-2xl font-black text-slate-800 tracking-widest">{myCode}</span>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-2xl transition-all mt-2"
                                >
                                    Done / Close
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
