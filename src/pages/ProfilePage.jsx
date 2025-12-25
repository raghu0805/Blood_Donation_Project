import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { calculateDonationEligibility, compressImage } from '../lib/utils';
import CountdownTimer from '../components/CountdownTimer';
import { useMCP } from '../contexts/MCPContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { VerificationBadge } from '../components/VerificationBadge';
import { User, Heart, Droplet, Edit2, Save, X, Clock } from 'lucide-react';

export default function ProfilePage() {
    const { currentUser, userRole } = useAuth();
    const { updateUserProfile } = useMCP();

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State

    // Form State
    const [formData, setFormData] = useState({
        displayName: '',
        gender: '',
        bloodGroup: '',
        phoneNumber: '', // Optional default
        age: '',
        weight: '',
        lastDonated: '',
        photoURL: '',
        isVerified: false,
        bloodStock: {} // { 'A+': 10, 'B-': 5 ... }
    });

    // Stats State
    const [donationsMade, setDonationsMade] = useState([]);
    const [donationsReceived, setDonationsReceived] = useState([]);

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
                phoneNumber: currentUser.phoneNumber || '',
                age: currentUser.age || '',
                weight: currentUser.weight || '',
                lastDonated: formattedDate,
                photoURL: currentUser.photoURL || '',
                isVerified: currentUser.isVerified || false,
                bloodStock: currentUser.bloodStock || {}
            });
            fetchStats();
        }
    }, [currentUser]);



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
            const madeQuery = query(collection(db, 'users', currentUser.uid, 'donations'), orderBy('completedAt', 'desc'));
            const madeSnap = await getDocs(madeQuery);
            setDonationsMade(madeSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // 2. Fetch Donations Received (Requests where I am patient AND status is completed)
            const receivedQuery = query(
                collection(db, 'requests'),
                where('patientId', '==', currentUser.uid),
                where('status', '==', 'completed')
                // Index might be needed for orderBy, so let's stick to client sort or simple query first
            );
            const receivedSnap = await getDocs(receivedQuery);
            const received = receivedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Client sort
            received.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
            setDonationsReceived(received);

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
                name: formData.displayName, // syncing both for safety
                gender: formData.gender,
                bloodGroup: formData.bloodGroup,
                phoneNumber: formData.phoneNumber,
                age: formData.age,
                weight: formData.weight,
                bloodStock: formData.bloodStock // Persist stock data
            };

            if (formData.lastDonated) {
                // Convert string date to Firestore timestamp or Date object
                updateData.lastDonated = new Date(formData.lastDonated);
            } else {
                // Explicitly set to null if empty to allow clearing the date
                updateData.lastDonated = null;
            }

            await updateUserProfile(updateData);
            setIsEditing(false);
            alert("Profile Updated!");
        } catch (err) {
            alert("Failed to update profile.");
        }
    };

    const getMissingFields = () => {
        const missing = [];
        // Admin only needs Name and Phone
        if (userRole === 'admin') {
            if (!formData.displayName) missing.push("Clinic Name");
            if (!formData.phoneNumber) missing.push("Phone Number");
            return missing;
        }

        if (!formData.age || parseInt(formData.age) < 18) missing.push("Age (18+)");
        if (!formData.weight || parseInt(formData.weight) < 50) missing.push("Weight (50kg+)");
        if (!formData.bloodGroup) missing.push("Blood Group");
        if (!formData.phoneNumber) missing.push("Phone Number");
        return missing;
    };

    const handleRequestVerification = async () => {
        const missing = getMissingFields();
        if (missing.length > 0) {
            alert(`Please complete the following profile details first:\n• ${missing.join('\n• ')}`);
            return;
        }


        try {
            await updateUserProfile({
                verificationStatus: 'requested',
                verificationRequestedAt: new Date().toISOString()
            });
            // Optimistic update
            // setFormData(prev => ({ ...prev, verificationStatus: 'requested' })); // updateUserProfile should trigger effect, but let's see
            alert("Verification Request Sent! Visit the clinic for physical verification.");
        } catch (err) {
            console.error(err);
            alert("Failed to send request.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24 relative">

            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

            {/* Profile Card */}
            <Card className="p-6 bg-white dark:bg-gray-800 dark:border-gray-700">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group">
                        <div className="h-24 w-24 rounded-full overflow-hidden bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-none border-2 border-transparent group-hover:border-red-500 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('photo-upload').click()}>
                            {formData.photoURL ? (
                                <img src={formData.photoURL} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-12 w-12 text-red-600" />
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
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
                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 cursor-pointer pointer-events-none">
                            <Edit2 className="h-3 w-3 text-gray-600" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                        {!formData.isVerified && !isEditing && (!currentUser?.role || currentUser?.role === 'donor') && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                                <div className="text-sm text-yellow-800">
                                    <span className="font-semibold block">Blood Bank Verification</span>
                                    {currentUser?.verificationStatus === 'requested'
                                        ? "Your request is pending. Please visit the clinic with your ID."
                                        : "Request verification to enable blood donation."}

                                    {/* Inline Validation Error */}
                                    {getMissingFields().length > 0 && (
                                        <div className="mt-2 text-red-600 text-xs font-medium">
                                            <p className="mb-0.5">Missing Required Fields:</p>
                                            <ul className="list-disc list-inside">
                                                {getMissingFields().map(field => (
                                                    <li key={field}>{field}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                {currentUser?.verificationStatus === 'requested' ? (
                                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold uppercase tracking-wider">
                                        Request Sent
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRequestVerification}
                                        className={`border-yellow-600 text-yellow-700 hover:bg-yellow-100 ${getMissingFields().length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Request Verification
                                    </Button>
                                )}
                            </div>
                        )}

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
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Phone Number</label>
                                    <input
                                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.phoneNumber}
                                        placeholder="+91..."
                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
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
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{formData.displayName || "Anonymous User"}</h2>
                                        <VerificationBadge isVerified={formData.isVerified} />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400">{currentUser?.email}</p>

                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                            Blood Group: {currentUser?.bloodGroup || "Not Set"}
                                        </div>
                                        {currentUser?.gender && (
                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300">
                                                {currentUser.gender}
                                            </div>
                                        )}
                                        {currentUser?.age && (
                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300">
                                                Age: {currentUser.age}
                                            </div>
                                        )}
                                        {currentUser?.weight && (
                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300">
                                                Weight: {currentUser.weight}kg
                                            </div>
                                        )}
                                    </div>

                                    {currentUser?.phoneNumber && (
                                        <p className="text-sm text-gray-500 mt-2">📞 {currentUser.phoneNumber}</p>
                                    )}
                                </div>
                                <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div >
            </Card >

            {/* Eligibility Status (New) - Hide for Admin */}
            {
                userRole !== 'admin' && (
                    <Card className="bg-white border-l-4 border-l-amber-500 overflow-hidden">
                        {(() => {
                            const { eligible, daysRemaining, percentage, nextDate } = calculateDonationEligibility(currentUser?.lastDonated, currentUser?.gender);
                            if (eligible) return null; // Don't show if eligible (or show a green card saying 'Ready to Donate')

                            return (
                                <div className="p-4 md:p-6">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                                        <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-full flex-none">
                                            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                                        </div>
                                        <div className="flex-1 w-full">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Recovery Period Active</h3>
                                            <div className="mt-2 text-gray-600 dark:text-gray-300">
                                                You can donate again in:
                                                <div className="mt-2 mb-2 flex justify-center sm:justify-start">
                                                    <CountdownTimer targetDate={nextDate} />
                                                </div>
                                                <span className="text-xs">Next eligible date: <span className="font-semibold">{nextDate.toLocaleDateString()}</span></span>
                                            </div>

                                            <div className="mt-4">
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className="bg-amber-500 h-3 rounded-full transition-all duration-1000 ease-out"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </Card>
                )
            }

            {/* Impact Stats Grid */}
            {
                userRole !== 'admin' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Donations Made Column */}
                        <div className="space-y-4">
                            <Card className="p-4 border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-900/10 dark:to-gray-800 dark:border-gray-700">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-200 dark:bg-red-900/40 rounded-full">
                                        <Heart className="h-6 w-6 text-red-700 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Lives Saved (Donated)</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{currentUser?.livesSaved || 0}</p>
                                    </div>
                                </div>
                            </Card>

                            <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Heart className="h-4 w-4 text-red-500" /> Donation History
                            </h3>
                            <div className="space-y-3">
                                {loadingStats ? <p className="text-gray-400 text-sm">Loading...</p> :
                                    donationsMade.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No donations recorded yet.</p>
                                    ) : (
                                        donationsMade.map(d => (
                                            <Card key={d.id} className="p-3 bg-white dark:bg-gray-800 dark:border-gray-700">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">Patient: {d.patientName}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {d.completedAt?.seconds && new Date(d.completedAt.seconds * 1000).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">Completed</span>
                                                </div>
                                            </Card>
                                        ))
                                    )
                                }
                            </div>
                        </div>

                        {/* Donations Received Column */}
                        <div className="space-y-4">
                            <Card className="p-4 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800 dark:border-gray-700">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-200 dark:bg-blue-900/40 rounded-full">
                                        <Droplet className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Support Received</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{donationsReceived.length}</p>
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
                                            <Card key={d.id} className="p-3 bg-white dark:bg-gray-800 dark:border-gray-700">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">Donor: {d.donorName || "Unknown"}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {d.completedAt?.seconds && new Date(d.completedAt.seconds * 1000).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">Received</span>
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
                    </div>
                )
            }
        </div >
    );
}
