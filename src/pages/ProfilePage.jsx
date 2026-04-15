import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { calculateDonationEligibility, compressImage } from '../lib/utils';
import { useMCP } from '../contexts/MCPContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Camera, User, Phone, Droplets, Calendar, Weight, ChevronRight, ArrowLeft, Heart, Droplet, Edit2, Save, X, Activity } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import LandingNavbar from '../components/LandingNavbar';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function EligibilityBadge({ age, weight, lastDonated, gender }) {
  const ageOk = age >= 18 && age <= 65;
  const weightOk = weight >= 50;
  
  const { eligible: donationOk } = calculateDonationEligibility(lastDonated, gender);
  const monthsAgo = lastDonated ? (Date.now() - new Date(lastDonated)) / (1000 * 60 * 60 * 24 * 30) : 999;
  
  const eligible = ageOk && weightOk && donationOk;

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
          { label: lastDonated ? `${Math.floor(monthsAgo)}mo ago` : "Never donated", ok: donationOk, hint: "Required Gap" },
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

    // Shared State
    const [loadingStats, setLoadingStats] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Used primarily by Admin now

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
                fetchStats();
            }
        }
    }, [currentUser, userRole]);

    const handleAvatar = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const compressedBase64 = await compressImage(file);
            await updateUserProfile({ photoURL: compressedBase64 });
            setForm(prev => ({ ...prev, photoURL: compressedBase64 }));
            if (userRole === 'admin') alert("Profile Photo Updated!");
        } catch (error) {
            console.error(error);
            alert("Failed to upload photo.");
        } finally {
            setUploading(false);
        }
    };

    const fetchStats = async () => {
        if (!currentUser || userRole !== 'admin') return;
        setLoadingStats(true);
        try {
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

        } catch (err) {
            console.error("Error fetching admin stats:", err);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleSaveAdmin = async () => {
        try {
            await updateUserProfile({
                displayName: form.fullName,
                name: form.fullName,
                whatsappNumber: form.whatsapp,
                bloodStock: form.bloodStock
            });
            setIsEditing(false);
            alert("Profile Updated!");
        } catch (err) {
            console.error(err);
            alert(`Failed to update profile: ${err.message || 'Unknown Error'}`);
        }
    };

    const handleSaveUser = async () => {
        try {
            if (parseInt(form.age) < 18) { alert("Age must be at least 18 years to donate blood."); return; }
            if (parseInt(form.weight) < 50) { alert("Weight must be at least 50 kg to donate blood."); return; }

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
            navigate('/role-selection');
        } catch (err) {
            console.error(err);
            alert(`Failed to update profile: ${err.message || 'Unknown Error'}`);
        }
    };

    // --------------------------------------------------------------------------------------------------------------------------
    // ADMIN RENDER
    // --------------------------------------------------------------------------------------------------------------------------
    if (userRole === 'admin') {
        return (
            <div className="max-w-4xl mx-auto p-4 space-y-8 pb-32 relative">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5 mr-2" /> Back</Button>
                    <h1 className="text-4xl font-black text-white tracking-tight">Admin <span className="text-[#e60026]">Profiler</span></h1>
                </div>

                {/* Profile Card */}
                <Card className="p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-red-600/10 transition-all duration-700"></div>
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="relative">
                            <div className="h-32 w-32 rounded-3xl overflow-hidden bg-navy-800 border-2 border-navy-700 shadow-inner flex items-center justify-center flex-none group-hover:border-[#e60026] transition-all duration-500 cursor-pointer transform hover:scale-105"
                                onClick={() => document.getElementById('photo-upload-admin').click()}>
                                {form.photoURL ? (
                                    <img src={form.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-16 w-16 text-gray-600 group-hover:text-[#e60026] transition-colors" />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-navy-900/80 flex items-center justify-center backdrop-blur-sm">
                                        <div className="animate-spin h-8 w-8 border-2 border-[#e60026] border-t-transparent rounded-full shadow-[0_0_15px_rgba(230,0,38,0.5)]"></div>
                                    </div>
                                )}
                            </div>
                            <input type="file" id="photo-upload-admin" className="hidden" accept="image/*" onChange={handleAvatar} disabled={uploading} />
                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={(e) => { e.stopPropagation(); document.getElementById('photo-upload-admin').click(); }}>
                                <Edit2 className="h-3 w-3 text-gray-600" />
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                            {isEditing ? (
                                <div className="grid gap-4 max-w-md">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Clinic Name</label>
                                        <input className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">WhatsApp Number</label>
                                        <input className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={form.whatsapp} placeholder="+91..." onChange={e => set('whatsapp', e.target.value)} />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button onClick={handleSaveAdmin} className="bg-red-600 hover:bg-red-700 text-white flex gap-2"><Save className="h-4 w-4" /> Save</Button>
                                        <Button onClick={() => setIsEditing(false)} variant="ghost" className="flex gap-2"><X className="h-4 w-4" /> Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start w-full">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-4xl font-black text-white tracking-tight">{form.fullName || "Anonymous Clinic"}</h2>
                                            <span className="bg-[#e60026] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-red-600/20">Admin</span>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
                                        {form.whatsapp && <p className="text-sm text-gray-400 font-medium bg-navy-800 px-3 py-1 rounded-full border border-navy-700 mt-4 inline-block">💬 {form.whatsapp}</p>}
                                    </div>
                                    <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm"><Edit2 className="h-4 w-4" /></Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Blood Bank Stock Management */}
                <Card className="p-6 bg-white dark:bg-gray-800 border-l-4 border-l-red-600 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <Droplet className="h-6 w-6 text-red-600 dark:text-red-500" /> Blood Bank Stock Management
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Manage available blood units in your center.</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {bloodGroups.map(bg => (
                            <div key={bg} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-red-200 dark:hover:border-red-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{bg}</span>
                                    <Droplet className={`h-4 w-4 ${form.bloodStock?.[bg] > 0 ? 'text-red-500 fill-red-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => set('bloodStock', { ...form.bloodStock, [bg]: Math.max(0, (form.bloodStock?.[bg] || 0) - 1) })}
                                        className="h-8 w-8 rounded-full bg-white dark:bg-gray-600 border dark:border-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-200 font-bold flex items-center justify-center transition-colors">
                                        -
                                    </button>
                                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100 flex-1 text-center">{form.bloodStock?.[bg] || 0}</span>
                                    <button onClick={() => set('bloodStock', { ...form.bloodStock, [bg]: (form.bloodStock?.[bg] || 0) + 1 })}
                                        className="h-8 w-8 rounded-full bg-white dark:bg-gray-600 border dark:border-gray-500 hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-600 dark:text-gray-200 font-bold flex items-center justify-center transition-colors">
                                        +
                                    </button>
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">Units Available</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSaveAdmin} className="bg-red-600 hover:bg-red-700 text-white flex gap-2"><Save className="h-4 w-4" /> Save Stock Updates</Button>
                    </div>
                </Card>

                {/* Admin Transaction History */}
                <Card className="mt-6 p-6 bg-white dark:bg-gray-800 border-l-4 border-l-blue-600 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                        <Activity className="h-6 w-6 text-blue-600 dark:text-blue-500" /> Blood Transaction History
                    </h3>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500"></span> Blood Distributed (to Patients)
                            </h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {donationsMade.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No recent distributions found.</p>
                                ) : (
                                    donationsMade.map(d => (
                                        <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{d.patientName || "Anonymous Patient"}</p>
                                                <p className="text-xs text-gray-500">{d.completedAt?.seconds ? new Date(d.completedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-red-600 dark:text-red-400 block">{d.bloodGroup}</span>
                                                <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full uppercase tracking-wide">Fulfilled</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span> Blood Received (from Donors)
                            </h4>

                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {donationsReceived.length === 0 ? (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 text-center">
                                        <p className="text-sm text-gray-500">No intakes recorded yet.</p>
                                    </div>
                                ) : (
                                    donationsReceived.map(d => (
                                        <div key={d.id} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{d.donorName || "Anonymous Donor"}</p>
                                                <p className="text-xs text-gray-500">
                                                    {d.completedAt?.seconds ? new Date(d.completedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                    {d.notes && <span className="ml-2 italic opacity-75">- {d.notes}</span>}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-blue-600 dark:text-blue-400 block">{d.bloodGroup}</span>
                                                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wide">Received</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // --------------------------------------------------------------------------------------------------------------------------
    // STANDARD USER RENDER (DONOR/PATIENT)
    // --------------------------------------------------------------------------------------------------------------------------
    return (
        <div className="min-h-screen font-sans antialiased" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>
            <LandingNavbar activePath="/profile" />

            {/* Animated blobs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)", filter: "blur(50px)" }} />
                <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(212,160,23,0.35) 0%, transparent 70%)", filter: "blur(50px)" }} />
            </div>

            <div className="relative z-10 mx-auto max-w-2xl px-6 pt-28 pb-16">
                {/* Back */}
                <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
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

                <motion.div initial="hidden" animate="visible" className="flex flex-col gap-6">

                    {/* Avatar */}
                    <motion.div variants={fadeUp} custom={3} className="flex justify-center">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-3xl overflow-hidden shadow-lg" style={{ border: "2px solid rgba(220,38,38,0.2)" }}>
                                {form.photoURL ? (
                                    <img src={form.photoURL} alt="avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.08), rgba(212,160,23,0.08))" }}>
                                        <User size={36} className="text-slate-300" />
                                    </div>
                                )}
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

                    {/* Basic Info */}
                    <motion.div variants={fadeUp} custom={4} className="rounded-3xl p-6"
                        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(148,163,184,0.15)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
                        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Basic Info</p>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Full Name</label>
                                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400 focus-within:shadow-sm" style={{ background: "#f8fafc", borderColor: "rgba(148,163,184,0.2)" }}>
                                    <User size={15} className="text-slate-400 shrink-0" />
                                    <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                                        placeholder="e.g. Fathima Safana"
                                        className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-slate-300" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">WhatsApp Number</label>
                                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400 focus-within:shadow-sm" style={{ background: "#f8fafc", borderColor: "rgba(148,163,184,0.2)" }}>
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
                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Gender</label>
                                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400" style={{ background: "#f8fafc", borderColor: "rgba(148,163,184,0.2)" }}>
                                    <select value={form.gender} onChange={(e) => set("gender", e.target.value)}
                                        className="w-full bg-transparent text-sm text-gray-800 outline-none">
                                        <option value="">Select gender</option>
                                        {["Male", "Female", "Other"].map((g) => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Blood Group */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Blood Group</label>
                                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400" style={{ background: "#f8fafc", borderColor: "rgba(148,163,184,0.2)" }}>
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
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Age (years)</label>
                                    <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400" style={{ background: "#f8fafc", borderColor: "rgba(148,163,184,0.2)" }}>
                                        <Calendar size={15} className="text-slate-400 shrink-0" />
                                        <input value={form.age} onChange={(e) => set("age", e.target.value)}
                                        placeholder="e.g. 24" type="number" min="1" max="100"
                                        className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-slate-300" />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Weight (kg)</label>
                                    <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400" style={{ background: "#f8fafc", borderColor: "rgba(148,163,184,0.2)" }}>
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
                                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-400" style={{ background: "#f8fafc", borderColor: "rgba(148,163,184,0.2)" }}>
                                    <Droplets size={15} className="text-red-400 shrink-0" />
                                    <input value={form.lastDonated} onChange={(e) => set("lastDonated", e.target.value)}
                                        type="date"
                                        className="w-full bg-transparent text-sm text-gray-800 outline-none" />
                                </div>
                                <p className="mt-1.5 text-xs text-slate-400">Leave empty if you've never donated before.</p>
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
                            onClick={() => navigate(-1)}
                            className="flex-1 rounded-2xl border py-4 text-sm font-bold text-slate-600 transition-all hover:border-red-300 hover:text-red-600"
                            style={{ borderColor: "rgba(148,163,184,0.25)", background: "rgba(255,255,255,0.8)" }}>
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(220,38,38,0.35)" }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSaveUser}
                            className="flex flex-[2] items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white"
                            style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)", boxShadow: "0 4px 20px rgba(220,38,38,0.25)" }}>
                            Save Profile <ChevronRight size={16} />
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
