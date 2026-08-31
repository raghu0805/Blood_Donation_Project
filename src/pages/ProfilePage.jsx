import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { calculateDonationEligibility, compressImage, ALL_BLOOD_GROUPS as bloodGroups } from '../lib/utils';
import { useMCP } from '../contexts/MCPContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Camera, User, Phone, Droplets, Calendar, Weight, ChevronRight, ArrowLeft, Heart, Droplet, Edit2, Save, X, Activity, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import LandingNavbar from '../components/LandingNavbar';
import UserAvatar from '../components/UserAvatar';
import LoadingOverlay from '../components/LoadingOverlay';
import { toast } from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

function EligibilityBadge({ age, weight, lastDonated, gender }) {
  const ageOk = age >= 18 && age <= 65;
  const weightOk = weight >= 50;
  
  const { eligible: donationOk, daysRemaining } = calculateDonationEligibility(lastDonated, gender);
  const monthsAgo = lastDonated ? (Date.now() - new Date(lastDonated)) / (1000 * 60 * 60 * 24 * 30) : 999;
  
  const eligible = ageOk && weightOk && donationOk;

  const daysAgo = lastDonated ? (Date.now() - new Date(lastDonated)) / (1000 * 60 * 60 * 24) : 999;

  const getDonationLabel = () => {
      if (!lastDonated) return "Never donated";
      if (Math.floor(daysAgo) < 30) return `${Math.floor(daysAgo)}d ago`;
      return `${Math.floor(monthsAgo)}mo ago`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{ background: eligible ? "rgba(34,197,94,0.06)" : "rgba(220,38,38,0.06)", border: `1px solid ${eligible ? "rgba(34,197,94,0.2)" : "rgba(220,38,38,0.2)"}` }}>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: eligible ? "#16a34a" : "#dc2626" }}>
        {eligible ? "✓ Eligible to Donate" : "⚠ Not Yet Eligible"}
      </p>
      <div className="flex flex-wrap gap-2">
        {[
          { label: `Age ${age || "?"}`, ok: ageOk, hint: "18–65 yrs" },
          { label: `${weight || "?"}kg`, ok: weightOk, hint: "Min 50kg" },
          { label: getDonationLabel(), ok: donationOk, hint: !lastDonated ? "Required Gap" : (donationOk ? "Gap Met" : `Wait ${daysRemaining} Days`) },
        ].map(({ label, ok, hint }) => (
          <span key={hint} className="rounded-xl px-3 py-1 text-xs font-semibold"
            style={{ background: ok ? "rgba(34,197,94,0.1)" : "rgba(220,38,38,0.1)", color: ok ? "#16a34a" : "#dc2626" }}>
            {label} · {hint}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function ProfilePage() {
    const { currentUser, userRole } = useAuth();
    const { updateUserProfile } = useMCP();
    const navigate = useNavigate();
    const location = useLocation();

    const wasRedirected = location.state?.profileIncomplete;
    const redirectedFrom = location.state?.redirectedFrom;

    // Shared State
    const [loadingStats, setLoadingStats] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Used primarily by Admin now
    const [isSaving, setIsSaving] = useState(false);
    const [activeDetailsTab, setActiveDetailsTab] = useState(null); // 'saved' or 'gained'

    const [form, setForm] = useState({
        fullName: "",
        whatsapp: "",
        gender: "",
        bloodGroup: "",
        age: "",
        weight: "",
        lastDonated: "",
        photoURL: "",
        bloodStock: {}
    });

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const getMissingFields = () => {
        const missing = [];
        if (!form.fullName || !form.fullName.trim()) missing.push("Full Name");
        if (!form.whatsapp || !form.whatsapp.trim()) missing.push("WhatsApp Number");
        if (userRole !== 'admin') {
            if (!form.gender) missing.push("Gender");
            if (!form.bloodGroup) missing.push("Blood Group");
            if (!form.age) missing.push("Age");
            if (!form.weight) missing.push("Weight");
        }
        return missing;
    };

    const missingFields = getMissingFields();
    const isProfileIncomplete = missingFields.length > 0;

    // Admin specific states
    const [donationsMade, setDonationsMade] = useState([]);
    const [donationsReceived, setDonationsReceived] = useState([]);
    const [showIntakeModal, setShowIntakeModal] = useState(false);
    const [intakeData, setIntakeData] = useState({ donorName: '', bloodGroup: 'O+', quantity: 1, notes: '' });

    useEffect(() => {
        if (currentUser) {
            let formattedDate = '';
            if (currentUser.lastDonated) {
                try {
                    const d = currentUser.lastDonated.seconds ? new Date(currentUser.lastDonated.seconds * 1000) : new Date(currentUser.lastDonated);
                    if (!isNaN(d.getTime())) formattedDate = d.toISOString().split('T')[0];
                } catch (e) {
                    console.error("Error parsing lastDonated:", e);
                }
            }

            setForm({
                fullName: currentUser.displayName || currentUser.name || '',
                gender: currentUser.gender || '',
                bloodGroup: currentUser.bloodGroup || '',
                whatsapp: currentUser.whatsappNumber || '',
                age: currentUser.age || '',
                weight: currentUser.weight || '',
                lastDonated: formattedDate,
                photoURL: currentUser.photoURL || '',
                bloodStock: currentUser.bloodStock || {}
            });
            
            if (userRole === 'admin') {
                if (!currentUser.displayName || !currentUser.whatsappNumber) setIsEditing(true);
            }
            fetchStats();
        }
    }, [currentUser, userRole]);

    useEffect(() => {
        if (donationsMade.length > 0) {
            const latestDonation = donationsMade[0];
            if (latestDonation.completedAt) {
                try {
                    const d = latestDonation.completedAt.seconds ? new Date(latestDonation.completedAt.seconds * 1000) : new Date(latestDonation.completedAt);
                    if (!isNaN(d.getTime())) {
                        setForm(prev => ({ ...prev, lastDonated: d.toISOString().split('T')[0] }));
                    }
                } catch (e) {
                    console.error("Error parsing donationsMade date:", e);
                }
            }
        }
    }, [donationsMade]);

    const handleAvatar = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const compressedBase64 = await compressImage(file);
            await updateUserProfile({ photoURL: compressedBase64 });
            setForm(prev => ({ ...prev, photoURL: compressedBase64 }));
            if (userRole === 'admin') toast.success("Profile Photo Updated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload photo.");
        } finally {
            setUploading(false);
        }
    };

    const fetchStats = async () => {
        if (!currentUser) return;
        setLoadingStats(true);
        try {
            if (userRole === 'admin') {
                const madeQuery = query(collection(db, 'requests'), where('donorId', '==', currentUser.uid), where('status', '==', 'completed'));
                const madeSnap = await getDocs(madeQuery);
                const made = madeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                made.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
                setDonationsMade(made);

                const intakesQuery = query(collection(db, 'users', currentUser.uid, 'intakes'), orderBy('completedAt', 'desc'));
                const networkQuery = query(collection(db, 'requests'), where('status', '==', 'completed'));
                const [intakesSnap, networkSnap] = await Promise.all([getDocs(intakesQuery), getDocs(networkQuery)]);

                const intakes = intakesSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'manual' }));
                const network = networkSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'network' })).filter(d => d.donorId !== currentUser.uid);

                let receivedData = [...intakes, ...network];
                receivedData.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
                setDonationsReceived(receivedData);
            } else {
                const madeQuery = query(collection(db, 'users', currentUser.uid, 'donations'), orderBy('completedAt', 'desc'));
                const madeSnap = await getDocs(madeQuery);
                setDonationsMade(madeSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                const receivedQuery = query(collection(db, 'requests'), where('patientId', '==', currentUser.uid), where('status', '==', 'completed'));
                const receivedSnap = await getDocs(receivedQuery);
                const received = receivedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                received.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
                setDonationsReceived(received);
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleSaveAdmin = async () => {
        if (isSaving) return;
        if (!form.fullName || !form.fullName.trim()) {
            toast.error("Profile Failed: Clinic/Admin Name is required.");
            return;
        }
        if (!form.whatsapp || !form.whatsapp.trim()) {
            toast.error("Profile Failed: WhatsApp Number is required.");
            return;
        }
        setIsSaving(true);
        try {
            await updateUserProfile({
                displayName: form.fullName,
                name: form.fullName,
                whatsappNumber: form.whatsapp,
                bloodStock: form.bloodStock
            });
            setIsEditing(false);
            toast.success("Profile Updated!");
        } catch (err) {
            console.error(err);
            toast.error(`Failed to update profile: ${err.message || 'Unknown Error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveUser = async () => {
        if (isSaving) return;

        if (!form.fullName || !form.fullName.trim()) {
            toast.error("Profile Setup Incomplete: Full Name is required.");
            return;
        }
        if (!form.whatsapp || !form.whatsapp.trim()) {
            toast.error("Profile Setup Incomplete: WhatsApp Number is required.");
            return;
        }
        if (!form.gender) {
            toast.error("Profile Setup Incomplete: Gender is required.");
            return;
        }
        if (!form.bloodGroup) {
            toast.error("Profile Setup Incomplete: Blood Group is required.");
            return;
        }
        if (!form.age) {
            toast.error("Profile Setup Incomplete: Age is required.");
            return;
        }
        if (!form.weight) {
            toast.error("Profile Setup Incomplete: Weight is required.");
            return;
        }

        try {
            if (parseInt(form.age) < 18) { toast.error("Profile Setup Incomplete: Age must be at least 18 years to donate blood."); return; }
            if (parseInt(form.weight) < 50) { toast.error("Profile Setup Incomplete: Weight must be at least 50 kg to donate blood."); return; }

            setIsSaving(true);
            const updateData = {
                displayName: form.fullName,
                name: form.fullName,
                whatsappNumber: form.whatsapp,
                gender: form.gender,
                bloodGroup: form.bloodGroup,
                age: form.age,
                weight: form.weight,
                lastDonated: form.lastDonated ? new Date(form.lastDonated) : null,
            };

            await updateUserProfile(updateData);
            toast.success("Profile saved successfully!");
            navigate('/role-selection');
        } catch (err) {
            console.error(err);
            toast.error(`Failed to update profile: ${err.message || 'Unknown Error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (isProfileIncomplete) {
            navigate('/');
        } else {
            navigate(-1);
        }
    };

    // ADMIN RENDER - Redirect Admin directly to Admin Dashboard
    if (userRole === 'admin') {
        return <Navigate to="/admin-dashboard" replace />;
    }

    // --------------------------------------------------------------------------------------------------------------------------
    // STANDARD USER RENDER (DONOR/PATIENT)
    // --------------------------------------------------------------------------------------------------------------------------
    const isLastDonatedImmutable = donationsMade.length > 0 || !!currentUser?.lastDonated;

    return (
        <div className="min-h-screen font-sans antialiased" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>
            <LoadingOverlay isLoading={isSaving} message="Saving Profile..." subMessage="Updating your information" />
            <LandingNavbar activePath="/profile" />

            {/* Animated blobs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)", filter: "blur(50px)" }} />
                <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(212,160,23,0.35) 0%, transparent 70%)", filter: "blur(50px)" }} />
            </div>

            <div className="relative z-10 mx-auto max-w-2xl px-6 pt-28 pb-16">
                {/* Back */}
                <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    onClick={handleCancel}
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors">
                    <ArrowLeft size={16} /> Back
                </motion.button>

                {/* Header */}
                <motion.div initial="hidden" animate="visible" className="mb-8">
                    <motion.p variants={fadeUp} custom={0} className="mb-1 text-xs font-bold uppercase tracking-widest text-red-400">Onboarding</motion.p>
                    <motion.h1 variants={fadeUp} custom={1} className="text-4xl font-black text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>
                        Complete Your{" "}
                        <span style={{ background: "linear-gradient(135deg, #d4a017, #dc2626, #d4a017)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                        Profile
                        </span>
                    </motion.h1>
                    <motion.p variants={fadeUp} custom={2} className="mt-2 text-slate-500 text-sm">This helps us match you with the right donors or recipients.</motion.p>
                </motion.div>

                {/* Incomplete Profile Alert Banner */}
                {isProfileIncomplete && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 rounded-3xl p-6 border shadow-xl relative overflow-hidden"
                        style={{ 
                            background: "linear-gradient(135deg, #fff1f2 0%, #fffbeb 100%)", 
                            borderColor: "#ef4444" 
                        }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-600 rounded-2xl text-white shrink-0 shadow-md">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-black text-red-900 tracking-tight">
                                    Action Required: Profile Setup Incomplete
                                </h3>
                                <p className="text-xs text-red-700 font-medium mt-1 leading-relaxed">
                                    {wasRedirected 
                                        ? `You were redirected here because your profile is missing required details needed to access ${redirectedFrom || 'that page'}.` 
                                        : "Please fill in the highlighted required fields below to complete your setup and access all features."}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {missingFields.map((field) => (
                                        <span key={field} className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-600 text-white px-2.5 py-1 rounded-xl shadow-xs">
                                            ⚠️ Missing {field}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <motion.div initial="hidden" animate="visible" className="flex flex-col gap-6">

                    {/* Avatar */}
                    <motion.div variants={fadeUp} custom={3} className="flex justify-center">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-3xl overflow-hidden shadow-lg" style={{ border: "2px solid rgba(220,38,38,0.2)" }}>
                                <UserAvatar 
                                    photoURL={form.photoURL} 
                                    name={form.fullName || currentUser?.email} 
                                    className="h-full w-full"
                                    textClassName="text-3xl"
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-[2px]">
                                        <div className="animate-spin h-6 w-6 border-2 border-[#e60026] border-t-transparent rounded-full shadow-[0_0_15px_rgba(230,0,38,0.5)]"></div>
                                    </div>
                                )}
                            </div>
                            <label className={`absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl shadow-lg transition-transform hover:scale-110 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)" }}>
                                <Camera size={14} className="text-white" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
                            </label>
                        </div>
                    </motion.div>

                    {/* Impact Details */}
                    <motion.div variants={fadeUp} custom={3.5} className="rounded-3xl p-6"
                        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(212,160,23,0.2)", boxShadow: "0 4px 24px rgba(212,160,23,0.08)" }}>
                        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Your Impact</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div onClick={() => setActiveDetailsTab(activeDetailsTab === 'saved' ? null : 'saved')} className={`flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all ${activeDetailsTab === 'saved' ? 'ring-2 ring-red-400' : 'hover:bg-red-50'}`} style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)" }}>
                                <Heart className="text-red-500 mb-2" size={24} />
                                <span className="text-3xl font-black text-gray-900">{loadingStats ? (currentUser?.livesSaved || 0) : Math.max(currentUser?.livesSaved || 0, donationsMade.length)}</span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Lives Saved</span>
                            </div>
                            <div onClick={() => setActiveDetailsTab(activeDetailsTab === 'gained' ? null : 'gained')} className={`flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all ${activeDetailsTab === 'gained' ? 'ring-2 ring-green-400' : 'hover:bg-green-50'}`} style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}>
                                <Droplets className="text-green-500 mb-2" size={24} />
                                <span className="text-3xl font-black text-gray-900">{loadingStats ? (currentUser?.unitsReceived || 0) : Math.max(currentUser?.unitsReceived || 0, donationsReceived.length)}</span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Blood Gained</span>
                            </div>
                        </div>

                        {/* Render Active Details Tab */}
                        {activeDetailsTab && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-slate-200">
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    {activeDetailsTab === 'saved' ? <><Heart size={16} className="text-red-500"/> Blood Donated History</> : <><Droplets size={16} className="text-green-500"/> Blood Received History</>}
                                </h3>
                                
                                {loadingStats ? (
                                    <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-slate-400" size={20} /></div>
                                ) : (activeDetailsTab === 'saved' ? donationsMade : donationsReceived).length === 0 ? (
                                    <p className="text-xs text-slate-500 italic py-2">No history found.</p>
                                ) : (
                                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        {(activeDetailsTab === 'saved' ? donationsMade : donationsReceived).map(item => (
                                            <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{activeDetailsTab === 'saved' ? (item.patientName || "Anonymous Patient") : (item.donorName || "Anonymous Donor")}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {item.completedAt?.seconds ? new Date(item.completedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                                <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${activeDetailsTab === 'saved' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                                    {item.bloodGroup}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Basic Info */}
                    <motion.div variants={fadeUp} custom={4} className="rounded-3xl p-6"
                        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(148,163,184,0.15)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
                        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Basic Info</p>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Full Name <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400 focus-within:shadow-sm" style={{ background: "#f8fafc", borderColor: (!form.fullName || !form.fullName.trim()) ? "#ef4444" : "rgba(148,163,184,0.2)" }}>
                                    <User size={15} className="text-slate-400 shrink-0" />
                                    <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                                        placeholder="e.g. Fathima Safana"
                                        className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-slate-300" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">WhatsApp Number <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400 focus-within:shadow-sm" style={{ background: "#f8fafc", borderColor: (!form.whatsapp || !form.whatsapp.trim()) ? "#ef4444" : "rgba(148,163,184,0.2)" }}>
                                    <Phone size={15} className="text-slate-400 shrink-0" />
                                    <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)}
                                        placeholder="+91 98765 43210" type="tel"
                                        className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-slate-300" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Medical Info */}
                    <motion.div variants={fadeUp} custom={5} className="rounded-3xl p-6"
                        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(220,38,38,0.1)", boxShadow: "0 4px 24px rgba(220,38,38,0.04)" }}>
                        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Medical & Eligibility</p>
                        <div className="flex flex-col gap-5">

                            {/* Gender */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Gender <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400" style={{ background: "#f8fafc", borderColor: !form.gender ? "#ef4444" : "rgba(148,163,184,0.2)" }}>
                                    <select value={form.gender} onChange={(e) => set("gender", e.target.value)}
                                        className="w-full bg-transparent text-sm text-gray-800 outline-none">
                                        <option value="">Select gender</option>
                                        {["Male", "Female", "Other"].map((g) => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Blood Group */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Blood Group <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400" style={{ background: "#f8fafc", borderColor: !form.bloodGroup ? "#ef4444" : "rgba(148,163,184,0.2)" }}>
                                    <Droplets size={15} className="text-red-400 shrink-0" />
                                    <select value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}
                                        className="w-full bg-transparent text-sm text-gray-800 outline-none">
                                        <option value="">Select blood group</option>
                                        {bloodGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Age + Weight */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Age (years) <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400" style={{ background: "#f8fafc", borderColor: !form.age ? "#ef4444" : "rgba(148,163,184,0.2)" }}>
                                        <Calendar size={15} className="text-slate-400 shrink-0" />
                                        <input value={form.age} onChange={(e) => set("age", e.target.value)}
                                        placeholder="e.g. 24" type="number" min="1" max="100"
                                        className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-slate-300" />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Weight (kg) <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400" style={{ background: "#f8fafc", borderColor: !form.weight ? "#ef4444" : "rgba(148,163,184,0.2)" }}>
                                        <Weight size={15} className="text-slate-400 shrink-0" />
                                        <input value={form.weight} onChange={(e) => set("weight", e.target.value)}
                                        placeholder="e.g. 65" type="number" min="1"
                                        className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-slate-300" />
                                    </div>
                                </div>
                            </div>

                            {/* Last Donated */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Last Donated Date</label>
                                <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${isLastDonatedImmutable ? 'opacity-80 cursor-not-allowed' : 'focus-within:border-red-400'}`} style={{ background: isLastDonatedImmutable ? "#f1f5f9" : "#f8fafc", borderColor: "rgba(148,163,184,0.2)" }}>
                                    <Droplets size={15} className={`${isLastDonatedImmutable ? 'text-slate-400' : 'text-red-400'} shrink-0`} />
                                    <input value={form.lastDonated} onChange={(e) => set("lastDonated", e.target.value)}
                                        type="date"
                                        disabled={isLastDonatedImmutable}
                                        className={`w-full bg-transparent text-sm outline-none ${isLastDonatedImmutable ? 'text-slate-500 cursor-not-allowed' : 'text-gray-800'}`} />
                                </div>
                                <p className="mt-1.5 text-xs text-slate-400">{isLastDonatedImmutable ? "This date is automatically tracked by the platform and cannot be manually edited." : "Leave empty if you've never donated before."}</p>
                            </div>

                            {/* Eligibility checker */}
                            {(form.age || form.weight || form.lastDonated) && (
                                <EligibilityBadge age={Number(form.age)} weight={Number(form.weight)} lastDonated={form.lastDonated} gender={form.gender} />
                            )}
                        </div>
                    </motion.div>

                    {/* Actions */}
                    <motion.div variants={fadeUp} custom={6} className="flex gap-3">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={handleCancel}
                            className="flex-1 rounded-2xl border py-4 text-sm font-bold text-slate-600 transition-all hover:border-red-300 hover:text-red-600"
                            style={{ borderColor: "rgba(148,163,184,0.25)", background: "rgba(255,255,255,0.8)" }}>
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={!isSaving ? { scale: 1.02, boxShadow: "0 8px 32px rgba(220,38,38,0.35)" } : {}}
                            whileTap={!isSaving ? { scale: 0.97 } : {}}
                            onClick={handleSaveUser}
                            disabled={isSaving}
                            className="flex flex-[2] items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)", boxShadow: "0 4px 20px rgba(220,38,38,0.25)" }}>
                            {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <>Save Profile <ChevronRight size={16} /></>}
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
