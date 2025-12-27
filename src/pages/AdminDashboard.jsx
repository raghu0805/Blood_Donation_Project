import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CheckCircle, Search, Phone, Calendar, Ruler } from 'lucide-react';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('requested'); // 'requested' | 'pending' | 'verified' | 'all'
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, [currentUser]);

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

                    {/* Filters */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm overflow-x-auto max-w-full">
                        <Button
                            variant={filter === 'requested' ? 'primary' : 'ghost'}
                            onClick={() => setFilter('requested')}
                            className={`whitespace-nowrap flex-1 md:flex-none ${filter === 'requested' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}`}
                        >
                            Requests
                        </Button>
                        <Button
                            variant={filter === 'pending' ? 'primary' : 'ghost'}
                            onClick={() => setFilter('pending')}
                            className={`whitespace-nowrap flex-1 md:flex-none ${filter === 'pending' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : ''}`}
                        >
                            <span className="md:hidden">Pending</span>
                            <span className="hidden md:inline">All Pending</span>
                        </Button>
                        <Button
                            variant={filter === 'verified' ? 'primary' : 'ghost'}
                            onClick={() => setFilter('verified')}
                            className={`whitespace-nowrap flex-1 md:flex-none ${filter === 'verified' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}`}
                        >
                            Verified
                        </Button>
                        <Button
                            variant={filter === 'all' ? 'primary' : 'ghost'}
                            onClick={() => setFilter('all')}
                            className="whitespace-nowrap flex-1 md:flex-none"
                        >
                            All
                        </Button>
                    </div>
                </div>

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
            </div>
        </div>
    );
}
