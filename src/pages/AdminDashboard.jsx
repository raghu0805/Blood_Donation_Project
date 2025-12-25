import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useMCP } from '../contexts/MCPContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CheckCircle, XCircle, Search, User, Phone, Calendar, Ruler, Award, Megaphone, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('requested'); // 'requested' | 'pending' | 'verified' | 'all'
    const [viewMode, setViewMode] = useState('users'); // 'users' | 'responses'
    const { currentUser } = useAuth();
    const [adminRequests, setAdminRequests] = useState([]); // Requests broadcasted by this admin

    // Check if profile is complete
    const isProfileComplete = currentUser && currentUser.displayName && currentUser.phoneNumber;

    // Admin Request State
    const { broadcastRequest, completeRequest } = useMCP();
    const [showRequestForm, setShowRequestForm] = useState(false);
    const navigate = useNavigate();
    const [requestData, setRequestData] = useState({ bloodGroup: 'A+', urgency: 'Emergency' });

    const handleAdminBroadcast = async (e) => {
        e.preventDefault();
        try {
            await broadcastRequest({
                ...requestData,
                patientName: currentUser.displayName || "Blood Bank Center", // Use actual admin name
                requesterType: 'admin',
                location: { lat: 12.9716, lng: 77.5946 }, // Default to Center location (simulated for now)
                isCenterRequest: true,
                centerId: currentUser.uid // Track which center
            });
            alert("Emergency supply request broadcasted to network!");
            setShowRequestForm(false);
        } catch (error) {
            alert("Failed to broadcast: " + error.message);
        }
    };

    useEffect(() => {
        fetchUsers();
        if (currentUser) {
            fetchAdminRequests();
        }
    }, [currentUser]);

    const fetchAdminRequests = async () => {
        try {
            const q = query(
                collection(db, "requests"),
                where("patientId", "==", currentUser.uid)
            );
            const snapshot = await getDocs(q);
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by newest
            reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setAdminRequests(reqs);
        } catch (error) {
            console.error("Error fetching admin requests:", error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch all users for now (in production, implement pagination)
            const q = query(collection(db, "users"));
            const querySnapshot = await getDocs(q);
            const usersList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (userId) => {
        if (!confirm("Are you sure you want to verify this donor physically?")) return;
        try {
            await updateDoc(doc(db, "users", userId), {
                isVerified: true,
                verifiedAt: new Date().toISOString(),
                verifiedByAdmin: true
            });
            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: true, verifiedAt: new Date().toISOString() } : u));
        } catch (error) {
            console.error("Verification failed:", error);
            alert("Failed to verify user.");
        }
    };

    const handleReject = async (userId) => {
        if (!confirm("Reject this verification request?")) return;
        try {
            await updateDoc(doc(db, "users", userId), {
                isVerified: false,
                verificationRejected: true
            });
            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: false } : u));
        } catch (error) {
            console.error("Rejection failed:", error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.displayName || user.name || user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'verified' ? user.isVerified :
                    filter === 'requested' ? (user.verificationStatus === 'requested' && !user.isVerified) :
                        !user.isVerified; // 'pending' (all unverified)
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Donor Verification Portal</h1>
                        <p className="text-gray-500">Validate donor eligibility and physical identity</p>
                    </div>

                    <div className="flex gap-2 relative group">
                        {/* Responses Button - Moved to Header */}
                        <Button
                            onClick={() => setViewMode(viewMode === 'responses' ? 'users' : 'responses')}
                            className={`flex items-center gap-2 shadow-sm ${viewMode === 'responses' ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'bg-white text-gray-700 hover:bg-gray-50 border'}`}
                        >
                            {viewMode === 'responses' ? <User className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                            {viewMode === 'responses' ? 'Manage Users' : 'View Responses'}
                        </Button>

                        <Button
                            onClick={() => {
                                if (!isProfileComplete) {
                                    alert("Please complete your profile (Name & Phone) in the Profile page to perform admin actions.");
                                    return;
                                }
                                setShowRequestForm(true);
                            }}
                            disabled={!isProfileComplete && false} // We let them click to see the alert, or we can disable styled
                            className={`flex items-center gap-2 shadow-lg ${isProfileComplete ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                            <Megaphone className="h-4 w-4" />
                            Request Blood Supply
                        </Button>
                        {!isProfileComplete && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-black text-white text-xs rounded p-2 z-50 hidden group-hover:block">
                                Action disabled. Please update your Profile Name and Phone Number.
                            </div>
                        )}
                    </div>

                    {/* Filters - Only visible when in 'users' view mode */}
                    {viewMode === 'users' && (
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm overflow-x-auto max-w-full">
                            <Button
                                variant={filter === 'requested' ? 'primary' : 'ghost'}
                                onClick={() => setFilter('requested')}
                                className={`whitespace-nowrap ${filter === 'requested' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}`}
                            >
                                Requests
                            </Button>
                            <Button
                                variant={filter === 'pending' ? 'primary' : 'ghost'}
                                onClick={() => setFilter('pending')}
                                className={`whitespace-nowrap ${filter === 'pending' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : ''}`}
                            >
                                All Pending
                            </Button>
                            <Button
                                variant={filter === 'verified' ? 'primary' : 'ghost'}
                                onClick={() => setFilter('verified')}
                                className={`whitespace-nowrap ${filter === 'verified' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}`}
                            >
                                Verified
                            </Button>
                            <Button
                                variant={filter === 'all' ? 'primary' : 'ghost'}
                                onClick={() => setFilter('all')}
                                className="whitespace-nowrap"
                            >
                                All Users
                            </Button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                {viewMode === 'responses' ? (
                    /* ------------------------ ADMIN REQUESTS VIEW ------------------------ */
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Blood Requests & Responses</h2>
                        {adminRequests.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500">You haven't broadcasted any requests yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {adminRequests.map(req => (
                                    <Card key={req.id} className="p-5 border-l-4 border-l-red-500 relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded-full">
                                                    {req.urgency}
                                                </span>
                                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{req.bloodGroup}</h3>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                req.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {req.status}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-500 mb-4">
                                            Posted: {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                        </p>

                                        {['accepted', 'completed'].includes(req.status) ? (
                                            <div className={`p-3 rounded-lg border ${req.status === 'completed' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                                                <p className={`text-xs font-semibold uppercase mb-1 ${req.status === 'completed' ? 'text-blue-800' : 'text-green-800'}`}>
                                                    {req.status === 'completed' ? 'Donation Completed By' : 'Accepted By'}
                                                </p>
                                                <p className="font-bold text-gray-900">{req.donorName}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Phone className={`h-4 w-4 ${req.status === 'completed' ? 'text-blue-600' : 'text-green-600'}`} />
                                                    <a href={`tel:${req.donorPhone}`} className={`text-sm font-medium hover:underline ${req.status === 'completed' ? 'text-blue-700' : 'text-green-700'}`}>
                                                        {req.donorPhone || "No Phone Shared"}
                                                    </a>
                                                </div>

                                                <div className="flex gap-2 mt-3">
                                                    <Button
                                                        onClick={() => navigate(`/chat/${req.id}`)}
                                                        className={`flex-1 text-xs text-white ${req.status === 'completed' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                    >
                                                        {req.status === 'completed' ? 'View Chat' : 'Message Donor'}
                                                    </Button>
                                                </div>

                                                {req.status === 'accepted' && (
                                                    <div className="mt-3 pt-3 border-t border-green-200">
                                                        <Button
                                                            onClick={async () => {
                                                                if (confirm("Confirm donation to add to stock?")) {
                                                                    await completeRequest(req.id);
                                                                    alert("Stock Updated!");
                                                                    fetchAdminRequests(); // Refresh
                                                                }
                                                            }}
                                                            className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            Mark Completed & Add to Stock
                                                        </Button>
                                                        <div className="mt-2 text-xs text-green-600 flex gap-1 justify-center">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Donor is on the way
                                                        </div>
                                                    </div>
                                                )}

                                                {req.status === 'completed' && (
                                                    <div className="mt-3 pt-3 border-t border-blue-200 text-center">
                                                        <span className="text-xs font-bold text-blue-700 flex items-center justify-center gap-1">
                                                            <CheckCircle className="h-4 w-4" />
                                                            Donation Verified & Stock Added
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 text-center">
                                                <div className="animate-pulse flex justify-center mb-1">
                                                    <div className="h-2 w-2 bg-gray-400 rounded-full mx-0.5"></div>
                                                    <div className="h-2 w-2 bg-gray-400 rounded-full mx-0.5 animation-delay-200"></div>
                                                    <div className="h-2 w-2 bg-gray-400 rounded-full mx-0.5 animation-delay-400"></div>
                                                </div>
                                                <span className="text-xs text-gray-500">Waiting for donors...</span>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="Search donors by name, email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* List */}
                        <div className="grid gap-4">
                            {loading ? (
                                <p className="text-center text-gray-500 py-10">Loading users...</p>
                            ) : filteredUsers.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">No users found matching criteria.</p>
                            ) : (
                                filteredUsers.map(user => (
                                    <Card key={user.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4">
                                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold flex-none ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {user.bloodGroup || '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 text-lg">{user.displayName || user.name || "Unknown Name"}</h3>
                                                    {user.isVerified && <CheckCircle className="h-5 w-5 text-green-500 mb-0.5" />}
                                                    {user.verificationStatus === 'requested' && !user.isVerified && (
                                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">Request Pending</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2">{user.email}</p>

                                                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                                        <Calendar className="h-3.5 w-3.5" /> Age: <span className="font-semibold">{user.age || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                                        <Ruler className="h-3.5 w-3.5" /> Weight: <span className="font-semibold">{user.weight || 'N/A'}kg</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                                        <Phone className="h-3.5 w-3.5" /> {user.phoneNumber || 'No Phone'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 flex-none border-t md:border-t-0 pt-4 md:pt-0">
                                            {!user.isVerified ? (
                                                <>
                                                    <Button
                                                        onClick={() => handleReject(user.id)}
                                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                                                    >
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleVerify(user.id)}
                                                        className="bg-green-600 hover:bg-green-700 text-white flex gap-2"
                                                    >
                                                        <CheckCircle className="h-4 w-4" /> Verify Physical ID
                                                    </Button>
                                                </>
                                            ) : (
                                                <div className="text-right">
                                                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wider block">Verified On</span>
                                                    <span className="text-sm text-gray-700">
                                                        {user.verifiedAt ? new Date(user.verifiedAt).toLocaleDateString() : 'Unknown Date'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>

                    </>
                )}

                {/* Admin Request Modal */}
                {showRequestForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                    Broadcast Center Request
                                </h3>
                                <button onClick={() => setShowRequestForm(false)}><XCircle className="h-6 w-6 text-gray-400 hover:text-gray-600" /></button>
                            </div>

                            <form onSubmit={handleAdminBroadcast} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group Required</label>
                                    <select
                                        value={requestData.bloodGroup}
                                        onChange={e => setRequestData({ ...requestData, bloodGroup: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                                    >
                                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                                    <select
                                        value={requestData.urgency}
                                        onChange={e => setRequestData({ ...requestData, urgency: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                                    >
                                        <option value="Emergency">Critical / Emergency</option>
                                        <option value="High">High Priority</option>
                                        <option value="Routine">Restock / Routine</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowRequestForm(false)}>Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">Broadcast Alert</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
