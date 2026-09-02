import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MapPin, ShieldAlert, CheckCircle, Sparkles, X, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { requestFCMToken, getNotificationPermissionStatus } from '../lib/fcm';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SNOOZE_KEY = 'lifelink_permission_prompt_snoozed';
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

export default function PermissionPrompt() {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifStatus, setNotifStatus] = useState('default'); // 'default' | 'granted' | 'denied' | 'unsupported'
    const [locStatus, setLocStatus] = useState('default');   // 'default' | 'granted' | 'denied' | 'unsupported'
    const [isGrantingNotif, setIsGrantingNotif] = useState(false);
    const [isGrantingLoc, setIsGrantingLoc] = useState(false);
    const [isGrantingAll, setIsGrantingAll] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            setIsOpen(false);
            return;
        }

        // Check Notification Status
        const currentNotif = getNotificationPermissionStatus();
        setNotifStatus(currentNotif);

        // Check Location Status using Permissions API if available
        if (typeof window !== 'undefined' && 'permissions' in navigator && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' })
                .then(permissionStatus => {
                    setLocStatus(permissionStatus.state); // 'granted' | 'prompt' -> 'default' | 'denied'
                    permissionStatus.onchange = () => {
                        setLocStatus(permissionStatus.state);
                    };
                })
                .catch(() => {
                    setLocStatus('default');
                });
        } else if (typeof window !== 'undefined' && 'geolocation' in navigator) {
            setLocStatus('default');
        } else {
            setLocStatus('unsupported');
        }

        // Determine if we should show the modal
        const checkShowPrompt = () => {
            const snoozedAt = localStorage.getItem(SNOOZE_KEY);
            if (snoozedAt) {
                const elapsed = Date.now() - parseInt(snoozedAt, 10);
                if (elapsed < SNOOZE_DURATION_MS) {
                    return false; // Snoozed
                }
            }

            // Show prompt if Notification or Location is not yet granted
            const notifNeedsGrant = currentNotif !== 'granted' && currentNotif !== 'unsupported';
            
            // Location needs grant if user doesn't have coordinates saved or permission state is not granted
            const hasUserLocationInProfile = !!(currentUser.location?.lat || currentUser.location?.address);
            const locNeedsGrant = !hasUserLocationInProfile;

            return notifNeedsGrant || locNeedsGrant;
        };

        // Small delay on page load so UI settles smoothly
        const timer = setTimeout(() => {
            if (checkShowPrompt()) {
                setIsOpen(true);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [currentUser]);

    // Handle Enable Notifications Only
    const handleEnableNotifications = async () => {
        if (!currentUser) return;
        setIsGrantingNotif(true);
        try {
            const token = await requestFCMToken(currentUser.uid);
            const status = getNotificationPermissionStatus();
            setNotifStatus(status);
            if (token || status === 'granted') {
                toast.success("Push Notifications Enabled! You will receive alerts even when browser is closed.");
                return true;
            } else if (status === 'denied') {
                toast.error("Notifications blocked in browser settings. Please allow notifications in site settings.");
            }
        } catch (err) {
            console.error("Error requesting FCM token:", err);
            toast.error("Failed to enable notifications.");
        } finally {
            setIsGrantingNotif(false);
        }
        return false;
    };

    // Handle Enable Location Only
    const handleEnableLocation = async () => {
        if (!currentUser || !('geolocation' in navigator)) return false;
        setIsGrantingLoc(true);
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            const coords = { lat: latitude, lng: longitude };

            // Reverse Geocode
            let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const data = await res.json();
                if (data && data.display_name) {
                    address = data.display_name;
                }
            } catch (e) {
                console.warn("Geocoding failed, fallback to raw coords", e);
            }

            // Save to Firestore
            const locationData = {
                lat: latitude,
                lng: longitude,
                address,
                updatedAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'users', currentUser.uid), { location: locationData }, { merge: true });
            try {
                await setDoc(doc(db, 'donars', currentUser.uid), { location: locationData, updatedAt: new Date().toISOString() }, { merge: true });
            } catch (e) {}

            setLocStatus('granted');
            toast.success("Live Location updated successfully!");
            return true;
        } catch (err) {
            console.error("Error getting geolocation:", err);
            if (err.code === 1) { // PERMISSION_DENIED
                setLocStatus('denied');
                toast.error("Location permission was denied in browser settings.");
            } else {
                toast.error("Could not retrieve precise location. Please try again.");
            }
            return false;
        } finally {
            setIsGrantingLoc(false);
        }
    };

    // Handle Enable Both (One-Click)
    const handleEnableAll = async () => {
        setIsGrantingAll(true);
        try {
            const notifSuccess = await handleEnableNotifications();
            const locSuccess = await handleEnableLocation();

            if (notifSuccess || locSuccess) {
                toast.success("Emergency Alerts & Location Enabled! Thank you for staying connected.", {
                    icon: '🚀',
                    duration: 5000
                });
                setIsOpen(false);
            }
        } finally {
            setIsGrantingAll(false);
        }
    };

    // Snooze modal for 24h
    const handleDismiss = () => {
        localStorage.setItem(SNOOZE_KEY, Date.now().toString());
        setIsOpen(false);
        toast("We'll remind you later to turn on permissions.", { icon: '🔔' });
    };

    if (!isOpen || !currentUser) return null;

    const notifIsGranted = notifStatus === 'granted';
    const locIsGranted = locStatus === 'granted' || !!currentUser.location?.lat;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-red-100 dark:bg-slate-900 dark:border-slate-800"
                    >
                        {/* Glowing Header Accent */}
                        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

                        {/* Top Close Button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                            title="Remind me later"
                        >
                            <X size={18} />
                        </button>

                        <div className="p-6 sm:p-8">
                            {/* Icon Badges */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200/50 dark:border-red-800/50 shadow-inner">
                                    <Bell size={26} className="animate-bounce" />
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                                    </span>
                                </div>
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 shadow-inner">
                                    <MapPin size={26} />
                                </div>
                            </div>

                            {/* Title & Tagline */}
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                                Stay Alerted for Emergency Blood Requests
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                LifeLink relies on instant notifications and live location to match blood donors with patients in urgent need.
                            </p>

                            {/* Feature List */}
                            <div className="mt-6 space-y-3">
                                {/* Push Notifications Feature */}
                                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${notifIsGranted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'}`}>
                                        {notifIsGranted ? <CheckCircle size={18} /> : <Bell size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                Browser Push Notifications
                                            </h4>
                                            {notifIsGranted ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                                    Enabled ✓
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={handleEnableNotifications}
                                                    disabled={isGrantingNotif || isGrantingAll}
                                                    className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 underline underline-offset-2 disabled:opacity-50"
                                                >
                                                    {isGrantingNotif ? 'Allowing...' : 'Turn On'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Receive critical blood requests & chat alerts even when your browser is closed.
                                        </p>
                                    </div>
                                </div>

                                {/* Live Location Feature */}
                                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${locIsGranted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'}`}>
                                        {locIsGranted ? <CheckCircle size={18} /> : <MapPin size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                Live Geolocation
                                            </h4>
                                            {locIsGranted ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                                    Enabled ✓
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={handleEnableLocation}
                                                    disabled={isGrantingLoc || isGrantingAll}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 underline underline-offset-2 disabled:opacity-50"
                                                >
                                                    {isGrantingLoc ? 'Locating...' : 'Allow GPS'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Instantly match with patients & hospital donation hubs in your exact area.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    onClick={handleEnableAll}
                                    disabled={isGrantingAll || isGrantingNotif || isGrantingLoc}
                                    className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    {isGrantingAll ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Enabling Permissions...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            <span>Enable Notifications & GPS</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleDismiss}
                                    className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm transition-all"
                                >
                                    Remind Me Later
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
