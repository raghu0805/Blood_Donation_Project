import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMCP } from '../contexts/MCPContext';
import { Button } from '../components/Button';
import { Switch } from '@headlessui/react';
import { MapPin, Bell, Clock, CheckCircle, HeartPulse, Radio, Heart, Droplets, Navigation, Award, TrendingUp, ChevronRight, Share2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDonationEligibility, canDonate } from '../lib/utils';
import CountdownTimer from '../components/CountdownTimer';
import { DonorDeclarationModal } from '../components/DonorDeclarationModal';
import LandingNavbar from '../components/LandingNavbar';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const urgencyStyle = {
  Emergency: { bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)", text: "#dc2626", dot: "#dc2626" },
  Urgent:    { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#d97706", dot: "#f59e0b" },
  Moderate:  { bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", text: "#64748b", dot: "#94a3b8" },
};

export default function DonorDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { activeRequests, toggleDonorAvailability } = useMCP();
    const [isAvailable, setIsAvailable] = useState(currentUser?.isAvailable || false);
    const [showDeclaration, setShowDeclaration] = useState(false);
    const [pendingAvailability, setPendingAvailability] = useState(null);

    const { eligible, message, percentage, daysRemaining, nextDate } = calculateDonationEligibility(currentUser?.lastDonated, currentUser?.gender);

    const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Donor";

    useEffect(() => {
        const autoActivate = async () => {
            if (eligible && !isAvailable && currentUser?.isAvailable) {
                setIsAvailable(true);
            }
        };
        autoActivate();
    }, [eligible, currentUser]);

    const handleToggle = async () => {
        const val = !isAvailable;
        if (!eligible && val) {
            alert(message);
            return;
        }

        if (val === true) {
            setPendingAvailability(true);
            setShowDeclaration(true);
        } else {
            setIsAvailable(false);
            try {
                await toggleDonorAvailability(false);
            } catch (error) {
                console.error("Failed to update availability", error);
                setIsAvailable(true);
            }
        }
    };

    const handleDeclarationConfirm = async () => {
        setShowDeclaration(false);
        if (pendingAvailability) {
            setIsAvailable(true);
            try {
                await toggleDonorAvailability(true);
            } catch (error) {
                console.error("Failed to update availability", error);
                setIsAvailable(false);
            }
        }
    };

    return (
        <div className="min-h-screen font-sans antialiased" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>
            <LandingNavbar userName={userName} showUser activePath="/donor-dashboard" />
            
            <DonorDeclarationModal
                isOpen={showDeclaration}
                onClose={() => { setShowDeclaration(false); setPendingAvailability(null); }}
                onConfirm={handleDeclarationConfirm}
            />

            <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">

                {/* Hero */}
                <motion.div initial="hidden" animate="visible" className="mb-10">
                    <motion.div variants={fadeUp} custom={0} className="mb-4 inline-flex items-center gap-2.5 rounded-full px-4 py-2"
                        style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                        <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-red-600">Live Terminal</span>
                    </motion.div>

                    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div>
                        <motion.h1 variants={fadeUp} custom={1} className="text-5xl font-black text-gray-900 md:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
                            DONATE<br />
                            <span style={{ background: "linear-gradient(135deg, #d4a017 0%, #dc2626 55%, #d4a017 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            YOUR BLOOD
                            </span>
                        </motion.h1>
                        <motion.p variants={fadeUp} custom={2} className="mt-3 text-slate-500">
                            Welcome back, {userName.split(" ")[0] || "Hero"}. You're making a difference.
                        </motion.p>
                        </div>
                        <motion.button variants={fadeUp} custom={3}
                        onClick={() => navigate('/profile')}
                        whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(220,38,38,0.25)" }} whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2.5 self-start rounded-2xl bg-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-500 md:self-auto">
                        <TrendingUp size={16} /> View Your Impact
                        </motion.button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* Left column */}
                    <div className="flex flex-col gap-6 lg:col-span-2">

                        {/* Status Panel */}
                        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible"
                            className="rounded-3xl p-6"
                            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2.5 w-2.5 rounded-full" style={{ background: !eligible ? "#f59e0b" : (isAvailable ? "#22c55e" : "#94a3b8") }} />
                                    <span className="text-lg font-bold text-gray-900">
                                        {!eligible ? "Recovery Active" : (isAvailable ? "Operational" : "Offline")}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">
                                    {!eligible ? <CountdownTimer targetDate={nextDate} /> : (isAvailable ? "You are visible to nearby requests" : "You are hidden from requests")}
                                </p>
                                </div>

                                {/* Toggle */}
                                <div className="flex flex-col items-center gap-2 opacity-100">
                                <p className="text-xs font-semibold text-slate-500">Broadcasting</p>
                                <button onClick={handleToggle}
                                    disabled={!eligible && !isAvailable}
                                    title={!eligible ? "Not eligible yet" : ""}
                                    className={`relative h-8 w-14 rounded-full transition-colors duration-300 ${!eligible && !isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    style={{ background: (isAvailable && eligible) ? "linear-gradient(135deg, #dc2626, #ef4444)" : "#e2e8f0" }}>
                                    <motion.span animate={{ x: (isAvailable && eligible) ? 24 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-md" style={{ left: 2 }} />
                                </button>
                                <span className="text-xs font-bold" style={{ color: (isAvailable && eligible) ? "#dc2626" : "#94a3b8" }}>
                                    {(isAvailable && eligible) ? "ON" : "OFF"}
                                </span>
                                </div>
                            </div>

                            {/* Bio-Replenishment progress bar if in recovery */}
                            {!eligible && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                        <span>Bio-Replenishment</span>
                                        <span>{Math.round(percentage)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            className="bg-amber-500 h-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            )}

                            {isAvailable && eligible && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-3"
                                style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)" }}>
                                <Radio size={14} className="text-red-500" />
                                <span className="text-xs text-red-600 font-medium">Broadcasting your location to nearby emergency requests</span>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Active Requests */}
                        <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="rounded-3xl p-6"
                            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Requests</p>
                                <p className="mt-0.5 text-lg font-bold text-gray-900">Nearby Matches</p>
                                </div>
                                <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-red-600" style={{ background: "rgba(220,38,38,0.08)" }}>
                                    <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                    </span>
                                    {activeRequests.length} Live
                                </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {activeRequests.length === 0 ? (
                                    <p className="text-gray-500 text-sm italic py-4">No active requests in your area at this moment.</p>
                                ) : (
                                    <AnimatePresence>
                                    {activeRequests.map((req, i) => (
                                        <RequestCard 
                                            key={req.id} 
                                            request={req} 
                                            eligible={eligible} 
                                            recoveryMessage={message} 
                                            delay={i * 0.1}
                                        />
                                    ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-6">

                        {/* Location Panel */}
                        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="rounded-3xl p-6"
                            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                <Navigation size={16} className="text-red-500" />
                                <p className="text-sm font-bold text-gray-900">Your Location</p>
                                </div>
                                <span className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-green-600" style={{ background: "rgba(34,197,94,0.08)" }}>
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live
                                </span>
                            </div>
                            {/* Map placeholder */}
                            <div className="relative mb-4 overflow-hidden rounded-2xl" style={{ height: 140, background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)" }}>
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="relative">
                                    <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-red-400 opacity-40" />
                                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-600 shadow-lg">
                                        <MapPin size={14} className="text-white" />
                                    </div>
                                    </div>
                                    <span className="rounded-xl bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow">Live Tracking</span>
                                </div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/profile')}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white"
                                style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)", boxShadow: "0 4px 16px rgba(212,160,23,0.25)" }}>
                                <Navigation size={14} /> Update Location
                            </motion.button>
                        </motion.div>

                        {/* Impact Panel */}
                        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="rounded-3xl p-6"
                            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(212,160,23,0.2)", boxShadow: "0 4px 24px rgba(212,160,23,0.08)" }}>
                            <div className="mb-5 flex items-center gap-2">
                                <Award size={18} className="text-amber-500" />
                                <p className="text-sm font-bold text-gray-900">Your Impact</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                {[
                                { label: "Last Donation", value: currentUser?.lastDonated ? new Date(currentUser.lastDonated?.seconds ? currentUser.lastDonated.seconds * 1000 : currentUser.lastDonated).toLocaleDateString() : "Never", icon: Clock, color: "#94a3b8" },
                                { label: "Lives Saved", value: currentUser?.livesSaved?.toString() || "0", icon: Heart, color: "#dc2626" },
                                { label: "Total Donations", value: currentUser?.livesSaved?.toString() || "0", icon: Droplets, color: "#d4a017" },
                                ].map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="flex items-center justify-between rounded-2xl px-4 py-3"
                                    style={{ background: "rgba(248,250,252,0.8)", border: "1px solid rgba(148,163,184,0.12)" }}>
                                    <div className="flex items-center gap-2.5">
                                    <Icon size={15} style={{ color }} />
                                    <span className="text-sm text-slate-500">{label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{value}</span>
                                </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible" className="rounded-3xl p-6"
                            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                            <p className="mb-4 text-sm font-bold text-gray-900">Quick Actions</p>
                            <div className="flex flex-col gap-3">
                                {[
                                { label: "Update Blood Group", icon: Droplets, color: "#dc2626", path: "/profile" },
                                { label: "Update Location", icon: MapPin, color: "#d4a017", path: "/profile" },
                                { label: "View Notifications", icon: Bell, color: "#dc2626", path: "/donor-dashboard" },
                                { label: "Donation History", icon: Activity, color: "#d4a017", path: "/profile" },
                                ].map(({ label, icon: Icon, color, path }) => (
                                <motion.button key={label} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(path)}
                                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-left transition-all"
                                    style={{ background: "rgba(248,250,252,0.8)", border: "1px solid rgba(148,163,184,0.12)" }}>
                                    <div className="flex items-center gap-2.5">
                                    <Icon size={15} style={{ color }} />
                                    <span className="text-sm font-medium text-slate-600">{label}</span>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300" />
                                </motion.button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Blood Group Badge */}
                        <motion.div variants={fadeUp} custom={6} initial="hidden" animate="visible"
                            className="rounded-3xl p-6 text-center shadow-lg"
                            style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)", boxShadow: "0 8px 32px rgba(220,38,38,0.25)" }}>
                            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-100">Your Blood Group</p>
                            <p className="text-6xl font-black text-white" style={{ fontFamily: "var(--font-heading)" }}>{currentUser?.bloodGroup || "N/A"}</p>
                            <p className="mt-2 text-xs text-red-100">High Demand Type</p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RequestCard({ request, eligible, recoveryMessage, delay = 0 }) {
    const { acceptRequest } = useMCP();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [showConsent, setShowConsent] = useState(false);
    const [accepting, setAccepting] = useState(false);

    const isAcceptedByMe = request.status === 'accepted' && request.donorId === currentUser?.uid;
    const compatible = canDonate(currentUser?.bloodGroup, request.bloodGroup);

    // Dynamic style based on urgency or accepted state
    let style = urgencyStyle[request.urgency] || urgencyStyle.Moderate;
    if (isAcceptedByMe) {
        style = { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#15803d", dot: "#22c55e" };
    }

    const handleAcceptClick = () => {
        if (eligible === false) { 
            alert(`Cannot accept: Recovery Period Active.\n${recoveryMessage || 'Please wait until your recovery period is over.'}`);
            return;
        }
        setShowConsent(true);
    };

    const confirmAccept = async () => {
        setAccepting(true);
        try {
            await acceptRequest(request.id);
            setShowConsent(false);
        } catch (err) {
            console.error(err);
            alert("Failed to accept request");
        } finally {
            setAccepting(false);
        }
    };

    const handleShareClick = () => {
        const shareText = `URGENT: ${request.patientName} needs ${request.bloodGroup} blood at ${request.hospitalName || 'a nearby hospital'}. Share or help if you are capable! (Shared via LifeLink)`;
        if (navigator.share) {
            navigator.share({ title: `Blood Request - ${request.bloodGroup}`, text: shareText, url: window.location.href }).catch(console.error);
        } else {
            alert("Copy this to share:\n\n" + shareText);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
            className="rounded-2xl p-4 transition-all hover:shadow-md"
            style={{ background: style.bg, border: `1px solid ${style.border}` }}>
            
            <DonorDeclarationModal
                isOpen={showConsent}
                onClose={() => setShowConsent(false)}
                onConfirm={confirmAccept}
            />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-white text-sm ${isAcceptedByMe ? '' : 'shadow-sm'}`}
                    style={{ background: isAcceptedByMe ? "#22c55e" : "linear-gradient(135deg, #dc2626, #d4a017)" }}>
                    {request.bloodGroup}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{request.patientName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                    <MapPin size={11} className="text-slate-400" />
                    <span className="text-xs text-slate-400">{request.distance || "Nearby"}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{request.hospitalName || "Hospital"}</span>
                    </div>
                </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                <span className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold" style={{ color: style.text, background: `${style.border}40` }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
                    {isAcceptedByMe ? "ACCEPTED" : (request.urgency || "Request")}
                </span>
                <span className="text-xs text-slate-400">Live</span>
                </div>
            </div>
            
            <div className="mt-4 flex gap-2">
                {isAcceptedByMe ? (
                    <motion.button onClick={() => navigate(`/chat/${request.id}`)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white transition-colors bg-green-600 hover:bg-green-700">
                        <Activity size={12} /> View Mission / Chat
                    </motion.button>
                ) : (
                    <>
                        <motion.button 
                            disabled={!compatible}
                            onClick={handleAcceptClick}
                            whileHover={compatible ? { scale: 1.02 } : {}} whileTap={compatible ? { scale: 0.98 } : {}}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white transition-colors outline-none ${!compatible ? 'opacity-50 cursor-not-allowed' : ''}`}
                            style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}>
                            <Heart size={12} /> {accepting ? "Processing" : (compatible ? "Respond" : "Incompatible")}
                        </motion.button>
                        <motion.button onClick={handleShareClick}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 bg-white"
                            style={{ border: "1px solid rgba(148,163,184,0.3)" }}>
                            <Share2 size={12} /> Share
                        </motion.button>
                    </>
                )}
            </div>
        </motion.div>
    );
}
