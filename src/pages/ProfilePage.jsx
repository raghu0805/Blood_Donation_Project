import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { calculateDonationEligibility, compressImage } from '../lib/utils';
import CountdownTimer from '../components/CountdownTimer';
import { useMCP } from '../contexts/MCPContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { User, Heart, Droplet, Edit2, Save, X, Clock, Activity, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { BackButton } from '../components/BackButton';

export default function ProfilePage() {
    const { currentUser, userRole } = useAuth();
    const { updateUserProfile } = useMCP();
    const navigate = useNavigate();

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        displayName: '',
        gender: '',
        bloodGroup: '',
        whatsappNumber: '',
        age: '',
        weight: '',
        lastDonated: '',
        photoURL: '',
        bloodStock: {} // { 'A+': 10, 'B-': 5 ... }
    });

    // Stats State
    const [donationsMade, setDonationsMade] = useState([]);
    const [donationsReceived, setDonationsReceived] = useState([]);

    // Intake Modal State
    const [showIntakeModal, setShowIntakeModal] = useState(false);
    const [intakeData, setIntakeData] = useState({
        donorName: '',
        bloodGroup: 'O+',
        quantity: 1,
        notes: ''
    });

    useEffect(() => {
        if (currentUser) {
            // Safe date parsing to handle Firestore Timestamps and Date objects/strings
            let formattedDate = '';
            if (currentUser.lastDonated) {
                try {
                    const d = currentUser.lastDonated.seconds
                        ? new Date(currentUser.lastDonated.seconds * 1000)
                        : new Date(currentUser.lastDonated);

                    if (!isNaN(d.getTime())) {
                        formattedDate = d.toISOString().split('T')[0];
                    }
                } catch (e) {
                    console.error("Error parsing lastDonated:", e);
                }
            }

            setFormData({
                displayName: currentUser.displayName || currentUser.name || '',
                gender: currentUser.gender || '',
                bloodGroup: currentUser.bloodGroup || '',
                whatsappNumber: currentUser.whatsappNumber || '',
                age: currentUser.age || '',
                weight: currentUser.weight || '',
                lastDonated: formattedDate,
                photoURL: currentUser.photoURL || '',
                bloodStock: currentUser.bloodStock || {}
            });
            
            // Auto open edit mode if profile is incomplete
            if (userRole === 'admin') {
                if (!currentUser.displayName || !currentUser.whatsappNumber) setIsEditing(true);
            } else {
                if (!currentUser.bloodGroup || !currentUser.gender || !currentUser.age || !currentUser.weight || !currentUser.whatsappNumber) {
                    setIsEditing(true);
                }
            }

            fetchStats();
        }
    }, [currentUser, userRole]);



    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const compressedBase64 = await compressImage(file);
            await updateUserProfile({ photoURL: compressedBase64 });
            // Optimistic update
            setFormData(prev => ({ ...prev, photoURL: compressedBase64 }));
            alert("Profile Photo Updated!");
        } catch (error) {
            console.error(error);
            alert("Failed to upload photo. Try a smaller image.");
        } finally {
            setUploading(false);
        }
    };

    const fetchStats = async () => {
        if (!currentUser) return;
        setLoadingStats(true);
        try {
            // 1. Fetch Donations Made (from subcollection OR just use profile count + query if needed)
            // Using the new subcollection 'donations' for detailed history
            // 1. Fetch Donations Made (or Admin Fulfillments)
            let madeQuery;
            if (userRole === 'admin') {
                // Admin: Fetch requests fulfilled by me (Outgoing)
                madeQuery = query(collection(db, 'requests'), where('donorId', '==', currentUser.uid), where('status', '==', 'completed'));
            } else {
                // User/Donor: Fetch personal donations
                madeQuery = query(collection(db, 'users', currentUser.uid, 'donations'), orderBy('completedAt', 'desc'));
            }

            const madeSnap = await getDocs(madeQuery);
            const made = madeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Client sort for Admin query lacking index
            made.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
            setDonationsMade(made);

            // 2. Fetch Donations Received / Intakes
            // 2. Fetch Donations Received / Intakes / Network Activity
            let receivedData = [];

            if (userRole === 'admin') {
                // Admin: Fetch manual intakes AND all completed network requests (excluding own fulfillments)
                const intakesQuery = query(collection(db, 'users', currentUser.uid, 'intakes'), orderBy('completedAt', 'desc'));
                const networkQuery = query(collection(db, 'requests'), where('status', '==', 'completed'));

                const [intakesSnap, networkSnap] = await Promise.all([
                    getDocs(intakesQuery),
                    getDocs(networkQuery)
                ]);

                const intakes = intakesSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'manual' }));
                const network = networkSnap.docs
                    .map(d => ({ id: d.id, ...d.data(), source: 'network' }))
                    .filter(d => d.donorId !== currentUser.uid); // Exclude admin's own outgoing donations

                receivedData = [...intakes, ...network];
            } else {
                // Patient: Fetch fulfilled requests
                const receivedQuery = query(
                    collection(db, 'requests'),
                    where('patientId', '==', currentUser.uid),
                    where('status', '==', 'completed')
                );
                const receivedSnap = await getDocs(receivedQuery);
                receivedData = receivedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            }

            // Global Sort
            receivedData.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
            setDonationsReceived(receivedData);

        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleSave = async () => {
        try {
            // Validation
            // Validation
            if (userRole !== 'admin') {
                if (parseInt(formData.age) < 18) {
                    alert("Age must be at least 18 years to donate blood.");
                    return;
                }
                if (parseInt(formData.weight) < 50) {
                    alert("Weight must be at least 50 kg to donate blood.");
                    return;
                }
            }

            const updateData = {
                displayName: formData.displayName,
                name: formData.displayName,
                whatsappNumber: formData.whatsappNumber,
            };

            if (userRole === 'admin') {
                updateData.bloodStock = formData.bloodStock;
            } else {
                updateData.gender = formData.gender;
                updateData.bloodGroup = formData.bloodGroup;
                updateData.age = formData.age;
                updateData.weight = formData.weight;
                
                if (formData.lastDonated) {
                    updateData.lastDonated = new Date(formData.lastDonated);
                } else {
                    updateData.lastDonated = null;
                }
            }

            await updateUserProfile(updateData);
            setIsEditing(false);
            alert("Profile Updated!");
            
            // Redirect to landing page after profile is successfully complete
            navigate('/');
        } catch (err) {
            console.error(err);
            alert(`Failed to update profile: ${err.message || 'Unknown Error'}`);
        }
    };

    const getMissingFields = () => {
        const missing = [];
        // Admin only needs Name and Phone
        if (userRole === 'admin') {
            if (!formData.displayName) missing.push("Clinic Name");
            if (!formData.whatsappNumber) missing.push("WhatsApp Number");
            return missing;
        }

        if (!formData.age || parseInt(formData.age) < 18) missing.push("Age (18+)");
        if (!formData.weight || parseInt(formData.weight) < 50) missing.push("Weight (50kg+)");
        if (!formData.bloodGroup) missing.push("Blood Group");
        if (!formData.whatsappNumber) missing.push("WhatsApp Number");
        return missing;
    };


    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8 pb-32 relative">

            <div className="flex items-center gap-6">
                <BackButton />
                <h1 className="text-4xl font-black text-white tracking-tight">User <span className="text-[#e60026]">Profiler</span></h1>
            </div>

            {/* Profile Card */}
            <Card className="p-8 shadow-2xl relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-red-600/10 transition-all duration-700"></div>
                
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative">
                        <div className="h-32 w-32 rounded-3xl overflow-hidden bg-navy-800 border-2 border-navy-700 shadow-inner flex items-center justify-center flex-none group-hover:border-[#e60026] transition-all duration-500 cursor-pointer transform hover:scale-105"
                            onClick={() => document.getElementById('photo-upload').click()}>
                            {formData.photoURL ? (
                                <img src={formData.photoURL} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-16 w-16 text-gray-600 group-hover:text-[#e60026] transition-colors" />
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-navy-900/80 flex items-center justify-center backdrop-blur-sm">
                                    <div className="animate-spin h-8 w-8 border-2 border-[#e60026] border-t-transparent rounded-full shadow-[0_0_15px_rgba(230,0,38,0.5)]"></div>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            id="photo-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />
                        <div
                            className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent double click if bubble happens
                                document.getElementById('photo-upload').click();
                            }}
                        >
                            <Edit2 className="h-3 w-3 text-gray-600" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 w-full">

                        {isEditing ? (
                            <div className="grid gap-4 max-w-md">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Full Name</label>
                                    <input
                                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.displayName}
                                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">WhatsApp Number (Optional)</label>
                                    <input
                                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.whatsappNumber}
                                        placeholder="+91..."
                                        onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                    />
                                </div>


                                {/* Only show personal details for Donors/Patients, hide for Admin */}
                                {userRole !== 'admin' && (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="sm:col-span-1">
                                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Gender</label>
                                                <select
                                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    value={formData.gender}
                                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                                >
                                                    <option value="">Select</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Blood Group</label>
                                                <select
                                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    value={formData.bloodGroup}
                                                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                                                >
                                                    <option value="">Select</option>
                                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                        <option key={bg} value={bg}>{bg}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Age</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    value={formData.age}
                                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                                    min="18"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Weight (kg)</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    value={formData.weight}
                                                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                                    min="50"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Donated (Optional)</label>
                                            <input
                                                type="date"
                                                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                value={formData.lastDonated}
                                                onChange={e => setFormData({ ...formData, lastDonated: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white flex gap-2">
                                        <Save className="h-4 w-4" /> Save
                                    </Button>
                                    <Button onClick={() => setIsEditing(false)} variant="ghost" className="flex gap-2">
                                        <X className="h-4 w-4" /> Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start w-full">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-4xl font-black text-white tracking-tight">{formData.displayName || "Anonymous User"}</h2>
                                        {userRole === 'admin' && <span className="bg-[#e60026] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-red-600/20">Admin</span>}
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400">{currentUser?.email}</p>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {userRole !== 'admin' && (
                                            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-[#e60026] text-white shadow-lg shadow-red-600/20 transition-transform hover:scale-105">
                                                <Droplet className="h-3 w-3 mr-1.5 fill-current" />
                                                GROUP: {currentUser?.bloodGroup || "Pending"}
                                            </div>
                                        )}
                                        {currentUser?.gender && (
                                            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-navy-800 border border-navy-700 text-gray-300 shadow-xl transition-transform hover:scale-105">
                                                {currentUser.gender}
                                            </div>
                                        )}
                                        {currentUser?.age && (
                                            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-navy-800 border border-navy-700 text-gray-300 shadow-xl transition-transform hover:scale-105">
                                                AGE: {currentUser.age}
                                            </div>
                                        )}
                                        {currentUser?.weight && (
                                            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-navy-800 border border-navy-700 text-gray-300 shadow-xl transition-transform hover:scale-105">
                                                {currentUser.weight}KG
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-4">
                                        {currentUser?.whatsappNumber && (
                                            <>
                                                <p className="text-sm text-gray-400 font-medium bg-navy-800 px-3 py-1 rounded-full border border-navy-700">💬 {currentUser.whatsappNumber}</p>
                                                {currentUser?.whatsappVerified ? (
                                                    <span className="inline-flex items-center px-4 py-1.5 bg-green-900/50 text-green-500 border border-green-500/50 text-xs font-black rounded-full uppercase tracking-widest cursor-default">
                                                        ✓ Verified
                                                    </span>
                                                ) : (
                                                    <a 
                                                        href="https://api.whatsapp.com/send/?phone=%2B14155238886&text=join+rain-additional&type=phone_number&app_absent=0" 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        onClick={() => {
                                                            try {
                                                                // Optimistically mark as verified upon clicking the activation link
                                                                updateUserProfile({ whatsappVerified: true });
                                                            } catch(err) {
                                                                console.error("Failed to update status", err);
                                                            }
                                                        }}
                                                        className="inline-flex items-center px-4 py-1.5 bg-[#25D366] text-white text-xs font-black rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(37,211,102,0.4)] hover:scale-105 transition-transform"
                                                    >
                                                        ✓ Verify WhatsApp
                                                    </a>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div >
            </Card >

            {/* Operational Readiness / Eligibility Status */}
            {userRole !== 'admin' && (
                <Card className="p-8 border-l-4 border-l-[#e60026] overflow-hidden shadow-2xl relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#e60026]/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[#e60026]/10 transition-all duration-700"></div>
                    
                    <div className="relative z-10 space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                    <Activity className="h-6 w-6 text-[#e60026]" />
                                    Donation <span className="text-[#e60026]">Readiness</span>
                                </h3>
                                <p className="text-gray-500 text-sm font-medium">Protocol: Minimum gap between consecutive donations.</p>
                            </div>

                            {/* Rule Display */}
                            <div className="flex gap-4">
                                <div className="px-4 py-2 rounded-2xl bg-navy-800 border border-navy-700 text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Men</p>
                                    <p className="text-lg font-black text-white">90 <span className="text-xs text-[#e60026]">DAYS</span></p>
                                </div>
                                <div className="px-4 py-2 rounded-2xl bg-navy-800 border border-navy-700 text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Women</p>
                                    <p className="text-lg font-black text-white">120 <span className="text-xs text-[#e60026]">DAYS</span></p>
                                </div>
                            </div>
                        </div>

                        {(() => {
                            const { eligible, daysRemaining, percentage, nextDate } = calculateDonationEligibility(currentUser?.lastDonated, currentUser?.gender);
                            
                            if (eligible) {
                                return (
                                    <div className="flex flex-col items-center justify-center p-8 bg-green-500/5 rounded-[2rem] border border-green-500/20 text-center space-y-4">
                                        <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                            <CheckCircle className="h-10 w-10 text-green-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">Status: Operational</h4>
                                            <p className="text-green-500 font-bold uppercase tracking-widest text-xs mt-1">You are eligible to donate today</p>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-amber-500/5 rounded-[2rem] border border-amber-500/20">
                                        <div className="space-y-2 text-center md:text-left flex-1">
                                            <h4 className="text-xl font-black text-white uppercase tracking-tight">Recovery in Progress</h4>
                                            <p className="text-gray-400 text-sm font-medium max-w-sm">
                                                Based on your last donation, your biological assets are being replenished.
                                            </p>
                                            <p className="text-xs font-bold text-amber-500/80 uppercase tracking-widest pt-2">
                                                Next available: {nextDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Time Remaining</p>
                                            <CountdownTimer targetDate={nextDate} variant="default" size="lg" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                            <span>Replenishment Progress</span>
                                            <span>{Math.round(percentage)}%</span>
                                        </div>
                                        <div className="w-full bg-navy-800 rounded-full h-3 overflow-hidden shadow-inner p-0.5">
                                            <motion.div
                                                className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </Card>
            )}

            {/* Impact Stats Grid */}
            {
                userRole !== 'admin' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Donations Made Column */}
                        <div className="space-y-4">
                            <Card className="p-6 border-l-4 border-l-[#e60026] relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-red-600/10 to-transparent pointer-events-none"></div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="p-4 bg-[#e60026]/10 rounded-2xl border border-[#e60026]/20 group-hover:scale-110 transition-transform duration-500">
                                        <Heart className="h-8 w-8 text-[#e60026] fill-[#e60026]/20" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Impact Factor</p>
                                        <p className="text-4xl font-black text-white">{currentUser?.livesSaved || 0} <span className="text-lg text-gray-500">LIVES</span></p>
                                    </div>
                                </div>
                            </Card>

                            <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2 pt-4">
                                <span className="h-2 w-2 rounded-full bg-[#e60026] animate-pulse"></span> Donation Logs
                            </h3>
                            <div className="space-y-3">
                                {loadingStats ? <p className="text-gray-400 text-sm">Loading...</p> :
                                    donationsMade.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No donations recorded yet.</p>
                                    ) : (
                                        donationsMade.map(d => (
                                            <Card key={d.id} className="p-4 bg-navy-800/50 border-navy-700 hover:border-[#e60026]/50 transition-colors">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-black text-white text-sm uppercase tracking-tight">{d.patientName}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold">
                                                            {d.completedAt?.seconds && new Date(d.completedAt.seconds * 1000).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] bg-[#e60026]/20 text-[#e60026] border border-[#e60026]/30 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Verified</span>
                                                </div>
                                            </Card>
                                        ))
                                    )
                                }
                            </div>
                        </div>

                        {/* Donations Received Column */}
                        <div className="space-y-4">
                            <Card className="p-6 border-l-4 border-l-blue-500 relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                                        <Droplet className="h-8 w-8 text-blue-500 fill-blue-500/20" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Network Support</p>
                                        <p className="text-4xl font-black text-white">
                                            {currentUser?.unitsReceived ?? donationsReceived.length} <span className="text-lg text-gray-500">UNITS</span>
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Droplet className="h-4 w-4 text-blue-500" /> Received History
                            </h3>
                            <div className="space-y-3">
                                {loadingStats ? <p className="text-gray-400 text-sm">Loading...</p> :
                                    donationsReceived.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No donations received yet.</p>
                                    ) : (
                                        donationsReceived.map(d => (
                                            <Card key={d.id} className="p-4 bg-navy-800/50 border-navy-700 hover:border-blue-500/50 transition-colors">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-black text-white text-sm uppercase tracking-tight">{d.donorName || "Unknown Node"}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold">
                                                            {d.completedAt?.seconds && new Date(d.completedAt.seconds * 1000).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Received</span>
                                                </div>
                                            </Card>
                                        ))
                                    )
                                }
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="space-y-6">
                        <Card className="p-6 bg-white dark:bg-gray-800 border-l-4 border-l-red-600 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <Droplet className="h-6 w-6 text-red-600 dark:text-red-500" />
                                Blood Bank Stock Management
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Manage available blood units in your center.</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                    <div key={bg} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-red-200 dark:hover:border-red-500/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">{bg}</span>
                                            <Droplet className={`h-4 w-4 ${formData.bloodStock?.[bg] > 0 ? 'text-red-500 fill-red-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    bloodStock: { ...prev.bloodStock, [bg]: Math.max(0, (prev.bloodStock?.[bg] || 0) - 1) }
                                                }))}
                                                className="h-8 w-8 rounded-full bg-white dark:bg-gray-600 border dark:border-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-200 font-bold flex items-center justify-center transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="text-xl font-bold text-gray-800 dark:text-gray-100 flex-1 text-center">
                                                {formData.bloodStock?.[bg] || 0}
                                            </span>
                                            <button
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    bloodStock: { ...prev.bloodStock, [bg]: (prev.bloodStock?.[bg] || 0) + 1 }
                                                }))}
                                                className="h-8 w-8 rounded-full bg-white dark:bg-gray-600 border dark:border-gray-500 hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-600 dark:text-gray-200 font-bold flex items-center justify-center transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">Units Available</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white flex gap-2">
                                    <Save className="h-4 w-4" /> Save Stock Updates
                                </Button>
                            </div>
                        </Card>

                        {/* Admin Transaction History (New) */}
                        <Card className="mt-6 p-6 bg-white dark:bg-gray-800 border-l-4 border-l-blue-600 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                                Blood Transaction History
                            </h3>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Outgoing / Distributed */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                        Blood Distributed (to Patients)
                                    </h4>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {donationsMade.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No recent distributions found.</p>
                                        ) : (
                                            donationsMade.map(d => (
                                                <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{d.patientName || "Anonymous Patient"}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {d.completedAt?.seconds ? new Date(d.completedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                        </p>
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

                                {/* Incoming / Received (Placeholder for now as we don't track donor-to-bank history yet) */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                        Blood Received (from Donors)
                                    </h4>

                                    <div className="mb-4">
                                        <Button onClick={() => setShowIntakeModal(true)} variant="outline" size="sm" className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                            + Log Manual Intake
                                        </Button>
                                    </div>

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

                        {/* Manual Intake Modal */}
                        {showIntakeModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                <Card className="w-full max-w-sm bg-white dark:bg-gray-800 p-6 shadow-2xl animate-fade-in-up">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Log Blood Intake</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Donor Name / Source</label>
                                            <input
                                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="e.g. John Doe / Walk-in"
                                                value={intakeData.donorName}
                                                onChange={e => setIntakeData({ ...intakeData, donorName: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Blood Group</label>
                                                <select
                                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    value={intakeData.bloodGroup}
                                                    onChange={e => setIntakeData({ ...intakeData, bloodGroup: e.target.value })}
                                                >
                                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                        <option key={bg} value={bg}>{bg}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Quantity (Units)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    value={intakeData.quantity}
                                                    onChange={e => setIntakeData({ ...intakeData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Notes (Optional)</label>
                                            <input
                                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="e.g. Donation Camp"
                                                value={intakeData.notes}
                                                onChange={e => setIntakeData({ ...intakeData, notes: e.target.value })}
                                            />
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <Button
                                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
                                                onClick={() => setShowIntakeModal(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={async () => {
                                                    try {
                                                        // 1. Add Log
                                                        await addDoc(collection(db, 'users', currentUser.uid, 'intakes'), {
                                                            ...intakeData,
                                                            completedAt: serverTimestamp(),
                                                            type: 'manual_intake'
                                                        });

                                                        // 2. Update Stock
                                                        await updateUserProfile({
                                                            bloodStock: {
                                                                [intakeData.bloodGroup]: increment(intakeData.quantity)
                                                            }
                                                        });

                                                        // 3. UI Updates
                                                        alert("Intake Logged & Stock Updated!");
                                                        setShowIntakeModal(false);
                                                        setIntakeData({ donorName: '', bloodGroup: 'O+', quantity: 1, notes: '' });
                                                        // Optimistic or real fetch
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            bloodStock: {
                                                                ...prev.bloodStock,
                                                                [intakeData.bloodGroup]: (prev.bloodStock?.[intakeData.bloodGroup] || 0) + intakeData.quantity
                                                            }
                                                        }));
                                                        fetchStats();

                                                    } catch (err) {
                                                        console.error(err);
                                                        alert("Failed to log intake.");
                                                    }
                                                }}
                                            >
                                                Log Intake
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                    </div>
                )
            }
        </div >
    );
}
