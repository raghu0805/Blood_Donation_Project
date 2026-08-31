import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Search, UserCheck, AlertTriangle, Phone, Mail, MapPin, Calendar, Heart, Shield, Activity, X, ChevronLeft, ChevronRight, CheckCircle, ExternalLink, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [reportUserModal, setReportUserModal] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, [currentUser]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch all registered users
            const querySnapshot = await getDocs(collection(db, "users"));
            const usersList = querySnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));
            
            // Sort by createdAt desc or name
            usersList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            setUsers(usersList);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load user directory");
        } finally {
            setLoading(false);
        }
    };

    // Online status check helper
    const isUserOnline = (user) => {
        if (user.isOnline === true) return true;
        if (user.lastSeen) {
            const lastSeenTime = new Date(user.lastSeen).getTime();
            const now = Date.now();
            // Online if active within last 5 minutes (300,000 ms)
            if (now - lastSeenTime < 5 * 60 * 1000) return true;
        }
        return false;
    };

    const filteredUsers = users.filter(user => {
        const name = (user.displayName || user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.whatsappNumber || user.phone || '').toLowerCase();
        const blood = (user.bloodGroup || '').toLowerCase();
        const query = searchTerm.toLowerCase();
        return name.includes(query) || email.includes(query) || phone.includes(query) || blood.includes(query);
    });

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleSubmitReport = () => {
        if (!reportUserModal) return;
        toast.success(`Report submitted for ${reportUserModal.displayName || reportUserModal.name || 'user'}. Admin team flagged details.`);
        setReportUserModal(null);
        setReportReason('');
    };

    return (
        <div className="min-h-screen bg-slate-900 p-4 md:p-8 text-slate-100">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 shadow-lg">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                                <p className="text-sm text-slate-400">Registered User Directory & Real-time Network Monitoring</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Total Registered Users: <span className="text-white font-bold">{users.length}</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800 border-2 border-slate-700 text-white placeholder-slate-400 shadow-inner focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm md:text-base"
                        placeholder="Search registered users by name, mobile number, blood group, email..."
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>

                {/* Directory Table matching Image Layout */}
                <div className="bg-slate-200 text-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-400">
                    
                    {/* Top Pagination Row matching Screenshot */}
                    <div className="bg-slate-300 px-6 py-2.5 flex justify-between items-center text-xs md:text-sm font-bold border-b border-slate-400 text-slate-700">
                        <span>Registered User Directory</span>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors ${
                                        currentPage === page 
                                            ? 'bg-blue-600 text-white shadow-sm' 
                                            : 'text-slate-800 hover:bg-slate-400/50'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            {/* Table Header Band */}
                            <thead>
                                <tr className="bg-slate-400 text-slate-900 font-bold border-b-2 border-slate-500 text-sm md:text-base">
                                    <th className="py-3.5 px-6 border-r border-slate-500 w-1/3">Name</th>
                                    <th className="py-3.5 px-6 border-r border-slate-500 text-center w-1/5">Available/Unavailable</th>
                                    <th className="py-3.5 px-6 border-r border-slate-500 text-center w-1/4">Mobile No.</th>
                                    <th className="py-3.5 px-6 text-center w-1/4">Report if details are incorrect</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-slate-600 font-semibold">
                                            Loading registered user directory...
                                        </td>
                                    </tr>
                                ) : paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-slate-600 font-semibold">
                                            No registered users found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map((user, idx) => {
                                        const online = isUserOnline(user);
                                        const isEven = idx % 2 === 0;
                                        const userName = user.displayName || user.name || "Unknown User";
                                        const mobileNo = user.whatsappNumber || user.phone || user.mobile || "N/A";

                                        return (
                                            <tr
                                                key={user.id}
                                                className={`transition-colors text-sm md:text-base border-b border-slate-300 font-medium ${
                                                    isEven ? 'bg-[#EAEFF5]' : 'bg-[#FFFFFF]'
                                                } hover:bg-blue-50/80`}
                                            >
                                                {/* Name Column (Clickable to open popup) */}
                                                <td className="py-3 px-6 border-r border-slate-300">
                                                    <button
                                                        onClick={() => setSelectedUser(user)}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left transition-colors flex items-center gap-1.5 focus:outline-none"
                                                        title="Click to view full details"
                                                    >
                                                        <span>{userName}</span>
                                                    </button>
                                                </td>

                                                {/* Available / Unavailable Status Column */}
                                                <td className="py-3 px-6 border-r border-slate-300 text-center font-bold">
                                                    {online ? (
                                                        <span className="text-emerald-600 flex items-center justify-center gap-1">
                                                            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
                                                            Available
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-500 font-semibold">
                                                            Unavailable
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Mobile No. Column */}
                                                <td className="py-3 px-6 border-r border-slate-300 text-center font-mono font-semibold text-slate-800">
                                                    {mobileNo}
                                                </td>

                                                {/* Report Action Column */}
                                                <td className="py-3 px-6 text-center">
                                                    <button
                                                        onClick={() => setReportUserModal(user)}
                                                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors focus:outline-none"
                                                    >
                                                        Report
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Pagination Row matching Screenshot */}
                    <div className="bg-slate-300 px-6 py-2.5 flex justify-end items-center border-t border-slate-400">
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors ${
                                        currentPage === page 
                                            ? 'bg-blue-600 text-white shadow-sm' 
                                            : 'text-slate-800 hover:bg-slate-400/50'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* USER DETAILS POPUP MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                        
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Modal Header */}
                        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                            <div className="h-16 w-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-400 font-extrabold text-xl shadow-md flex-none">
                                {selectedUser.bloodGroup || '?'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    {selectedUser.displayName || selectedUser.name || "Unknown User"}
                                </h2>
                                <p className="text-slate-400 text-sm">{selectedUser.email || 'No email registered'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                        isUserOnline(selectedUser) 
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                        {isUserOnline(selectedUser) ? '🟢 Available (Online)' : '🔴 Unavailable (Offline)'}
                                    </span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                                        Role: {selectedUser.role || 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* User Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Mobile / WhatsApp</span>
                                <span className="text-slate-100 font-mono font-semibold text-base flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-emerald-400" />
                                    {selectedUser.whatsappNumber || selectedUser.phone || selectedUser.mobile || 'Not provided'}
                                </span>
                            </div>

                            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Blood Group</span>
                                <span className="text-slate-100 font-semibold text-base flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-red-400" />
                                    {selectedUser.bloodGroup || 'Not specified'}
                                </span>
                            </div>

                            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Age & Gender</span>
                                <span className="text-slate-100 font-medium text-base">
                                    {selectedUser.age ? `${selectedUser.age} yrs` : 'Age N/A'} • {selectedUser.gender || 'Gender N/A'}
                                </span>
                            </div>

                            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Weight</span>
                                <span className="text-slate-100 font-medium text-base">
                                    {selectedUser.weight ? `${selectedUser.weight} kg` : 'Weight N/A'}
                                </span>
                            </div>

                            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Lives Saved</span>
                                <span className="text-emerald-400 font-bold text-base flex items-center gap-1.5">
                                    <Activity className="h-4 w-4" />
                                    {selectedUser.livesSaved || 0} lives
                                </span>
                            </div>

                            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Donor Availability Toggle</span>
                                <span className={`font-semibold text-sm ${selectedUser.isAvailable ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {selectedUser.isAvailable ? 'Available for Donation' : 'Unavailable'}
                                </span>
                            </div>

                            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 md:col-span-2">
                                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Location / Address</span>
                                <span className="text-slate-200 text-sm flex items-start gap-1.5">
                                    <MapPin className="h-4 w-4 text-red-400 flex-none mt-0.5" />
                                    {typeof selectedUser.location === 'object'
                                        ? selectedUser.location?.address || `${selectedUser.location?.city || ''}, ${selectedUser.location?.state || ''}`
                                        : (selectedUser.location || 'Location not updated')}
                                </span>
                            </div>

                            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Last Donated Date</span>
                                <span className="text-slate-200 text-sm">
                                    {selectedUser.lastDonated || 'No donation history'}
                                </span>
                            </div>

                            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Roll No / Student ID</span>
                                <span className="text-slate-200 text-sm font-mono">
                                    {selectedUser.rollNo || 'Not linked'}
                                </span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3 justify-end">
                            {(selectedUser.whatsappNumber || selectedUser.phone) && (
                                <a
                                    href={`https://wa.me/${(selectedUser.whatsappNumber || selectedUser.phone).replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors shadow"
                                >
                                    <Phone className="h-4 w-4" /> WhatsApp User
                                </a>
                            )}
                            <button
                                onClick={() => {
                                    setReportUserModal(selectedUser);
                                    setSelectedUser(null);
                                }}
                                className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold text-sm flex items-center gap-2 transition-colors"
                            >
                                <Flag className="h-4 w-4" /> Report Incorrect Details
                            </button>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REPORT INCORRECT DETAILS MODAL */}
            {reportUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
                        <div className="flex items-center gap-3 text-red-400">
                            <AlertTriangle className="h-6 w-6" />
                            <h3 className="text-lg font-bold text-white">Report Incorrect Details</h3>
                        </div>

                        <p className="text-sm text-slate-300">
                            Flag incorrect profile information for <span className="font-bold text-white">{reportUserModal.displayName || reportUserModal.name || 'User'}</span>.
                        </p>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reason / Details</label>
                            <textarea
                                rows={3}
                                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="Specify what details are incorrect (e.g. invalid phone number, wrong blood group)..."
                                value={reportReason}
                                onChange={e => setReportReason(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setReportUserModal(null);
                                    setReportReason('');
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReport}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow transition-colors"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

