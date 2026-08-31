import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { 
    Users, 
    Droplets, 
    Heart, 
    Search, 
    Calendar, 
    Ruler, 
    Filter, 
    ShieldCheck, 
    Activity, 
    CheckCircle2, 
    Clock, 
    Phone, 
    MapPin, 
    ExternalLink, 
    X, 
    RefreshCw, 
    UserCheck, 
    FileText,
    ChevronRight,
    AlertCircle,
    Building2,
    LogOut,
    Shield,
    AlertTriangle,
    Flag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import logo from '../assets/app logo.png';
import pecLogo from '../assets/pec logo.png';
import yrcLogo from '../assets/yrc logo.png';

const STANDARD_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const normalizeBloodGroup = (bg) => {
    if (!bg || typeof bg !== 'string') return 'UNSPECIFIED';
    const s = bg.trim().toUpperCase().replace(/\s+/g, '');
    if (!s || s === 'PENDING' || s === 'NOTLINKED' || s === 'N/A' || s === 'UNKNOWN' || s === '?') return 'UNSPECIFIED';

    if (s.includes('A1B+') || s === 'AB+' || s.includes('ABPOS') || s.includes('AB+VE')) return 'AB+';
    if (s.includes('A1B-') || s === 'AB-' || s.includes('ABNEG') || s.includes('AB-VE')) return 'AB-';
    if (s.includes('A1+') || s === 'A+' || s.includes('APOS') || s.includes('A+VE')) return 'A+';
    if (s.includes('A1-') || s === 'A-' || s.includes('ANEG') || s.includes('A-VE')) return 'A-';
    if (s === 'B+' || s.includes('BPOS') || s.includes('B+VE')) return 'B+';
    if (s === 'B-' || s.includes('BNEG') || s.includes('B-VE')) return 'B-';
    if (s === 'O+' || s.includes('OPOS') || s.includes('O+VE') || s.includes('OPOSITIVE')) return 'O+';
    if (s === 'O-' || s.includes('ONEG') || s.includes('O-VE') || s.includes('ONEGATIVE')) return 'O-';
    if (s.includes('OH') || s.includes('BOMBAY')) return 'BOMBAY';

    return s;
};

export default function AdminDashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    // Data state
    const [users, setUsers] = useState([]);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Active tab: 'users' | 'history' | 'inventory'
    const [activeTab, setActiveTab] = useState('users');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBloodGroup, setSelectedBloodGroup] = useState('ALL');
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [selectedAvailability, setSelectedAvailability] = useState('ALL');

    // Pagination for User Directory Table
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    // Modals
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [reportUserModal, setReportUserModal] = useState(null);
    const [reportReason, setReportReason] = useState('');

    useEffect(() => {
        fetchAllData();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/admin-login');
        } catch (e) {
            console.error("Logout error", e);
        }
    };

    const fetchAllData = async () => {
        if (loading) setLoading(true);
        setRefreshing(true);
        try {
            // 1. Fetch registered users (excluding admin accounts)
            const usersQuery = query(collection(db, "users"));
            const usersSnapshot = await getDocs(usersQuery);
            const usersList = usersSnapshot.docs
                .map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                }))
                .filter(u => {
                    const role = String(u.role || '').toLowerCase();
                    const email = String(u.email || '').toLowerCase();
                    const name = String(u.displayName || u.name || '').toLowerCase();
                    const id = String(u.id || '');
                    const currentUid = String(currentUser?.uid || '');

                    if (u.isAdmin === true || u.isAdmin === 'true') return false;
                    if (role.includes('admin')) return false;
                    if (email.includes('admin')) return false;
                    if (name.includes('admin') || name.includes('system')) return false;
                    if (currentUid && id === currentUid) return false;
                    return true;
                });

            usersList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            setUsers(usersList);

            // 2. Fetch completed donation requests across the platform
            const completedRequestsQuery = query(
                collection(db, "requests"),
                where('status', '==', 'completed')
            );
            const requestsSnapshot = await getDocs(completedRequestsQuery);
            const requestsList = requestsSnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                type: 'request',
                ...docSnap.data()
            }));

            // Sort donation history by completion date descending
            requestsList.sort((a, b) => {
                const timeA = a.completedAt?.seconds || a.createdAt?.seconds || 0;
                const timeB = b.completedAt?.seconds || b.createdAt?.seconds || 0;
                return timeB - timeA;
            });

            setDonations(requestsList);
        } catch (error) {
            console.error("Error loading admin dashboard data:", error);
            toast.error("Failed to sync dashboard data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Online status check helper
    const isUserOnline = (user) => {
        if (user.isOnline === true) return true;
        if (user.lastSeen) {
            const lastSeenTime = new Date(user.lastSeen).getTime();
            const now = Date.now();
            if (now - lastSeenTime < 5 * 60 * 1000) return true;
        }
        return false;
    };

    // Calculate metrics
    const metrics = useMemo(() => {
        const totalUsers = users.length;
        const totalDonors = users.filter(u => u.role === 'donor' || !u.role).length;
        const totalPatients = users.filter(u => u.role === 'patient').length;
        const availableDonors = users.filter(u => u.isAvailable === true).length;
        const totalCompletedDonations = donations.length;
        
        const totalLivesSavedSum = users.reduce((acc, u) => acc + (Number(u.livesSaved) || 0), 0);

        const groupCounts = {};
        STANDARD_BLOOD_GROUPS.forEach(bg => { groupCounts[bg] = 0; });
        groupCounts['UNSPECIFIED'] = 0;

        users.forEach(u => {
            const norm = normalizeBloodGroup(u.bloodGroup);
            if (groupCounts[norm] !== undefined) {
                groupCounts[norm]++;
            } else {
                groupCounts[norm] = 1;
            }
        });

        const displayedGroups = [...STANDARD_BLOOD_GROUPS];
        if (groupCounts['UNSPECIFIED'] > 0) {
            displayedGroups.push('UNSPECIFIED');
        }
        Object.keys(groupCounts).forEach(g => {
            if (!displayedGroups.includes(g) && groupCounts[g] > 0) {
                displayedGroups.push(g);
            }
        });

        return {
            totalUsers,
            totalDonors,
            totalPatients,
            availableDonors,
            totalCompletedDonations,
            totalLivesSavedSum,
            groupCounts,
            displayedGroups
        };
    }, [users, donations]);

    // Filter users based on search, blood group, role, and availability
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const name = (user.displayName || user.name || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            const rollNo = (user.rollNo || '').toLowerCase();
            const phone = (user.whatsappNumber || user.phone || '').toLowerCase();
            const dept = (user.department || '').toLowerCase();
            const query = searchTerm.toLowerCase();

            const matchesSearch = name.includes(query) || email.includes(query) || rollNo.includes(query) || phone.includes(query) || dept.includes(query);

            const userBg = normalizeBloodGroup(user.bloodGroup);
            const matchesBloodGroup = selectedBloodGroup === 'ALL' || userBg === selectedBloodGroup;

            const userRole = user.role || 'donor';
            const matchesRole = selectedRole === 'ALL' || userRole === selectedRole;

            const online = isUserOnline(user);
            const matchesAvailability = selectedAvailability === 'ALL' || 
                (selectedAvailability === 'available' && (user.isAvailable || online)) ||
                (selectedAvailability === 'unavailable' && (!user.isAvailable && !online));

            return matchesSearch && matchesBloodGroup && matchesRole && matchesAvailability;
        });
    }, [users, searchTerm, selectedBloodGroup, selectedRole, selectedAvailability]);

    // Filter donation history
    const filteredDonations = useMemo(() => {
        return donations.filter(item => {
            const matchesSearch = 
                (item.patientName || item.donorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.hospitalName || item.locationName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.id || '').toLowerCase().includes(searchTerm.toLowerCase());

            const itemBg = normalizeBloodGroup(item.bloodGroup);
            const matchesBloodGroup = selectedBloodGroup === 'ALL' || itemBg === selectedBloodGroup;

            return matchesSearch && matchesBloodGroup;
        });
    }, [donations, searchTerm, selectedBloodGroup]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const paginatedUsers = useMemo(() => {
        return filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredUsers, currentPage, pageSize]);

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

    const formatTimestamp = (ts) => {
        if (!ts) return 'N/A';
        if (typeof ts === 'string') return ts;
        try {
            const dateObj = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
            if (isNaN(dateObj.getTime())) return 'N/A';
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'N/A';
        }
    };

    const safeRender = (val, fallback = 'N/A') => {
        if (val === null || val === undefined || val === '') return fallback;
        if (typeof val === 'object') {
            if (val.seconds !== undefined) return formatTimestamp(val);
            if (val.address) return String(val.address);
            if (val.name) return String(val.name);
            try {
                return JSON.stringify(val);
            } catch (e) {
                return fallback;
            }
        }
        return String(val);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 w-full select-none">
            
            {/* Dark Executive Admin Navbar */}
            <header className="sticky top-0 z-50 bg-gray-900/95 border-b border-gray-800 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl select-none">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="LifeLink" className="h-9 w-auto object-contain select-none" />
                    <div className="h-6 w-px bg-gray-800 hidden sm:block" />
                    <div className="hidden items-center gap-2 sm:flex">
                        <div className="rounded-lg px-2 py-0.5 bg-red-600">
                            <img src={pecLogo} alt="PEC" className="h-7 w-auto object-contain" />
                        </div>
                        <img src={yrcLogo} alt="YRC" className="h-8 w-auto object-contain" />
                    </div>
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-950/80 px-3 py-1 rounded-full border border-red-800/80 ml-2 select-none flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-red-500" /> Executive Monitoring Console
                    </span>
                </div>

                <div className="flex items-center gap-3 select-none">
                    <div className="flex items-center gap-2 bg-gray-950 px-3.5 py-1.5 rounded-xl border border-gray-800 select-none">
                        <div className="h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs select-none">
                            S
                        </div>
                        <span className="text-xs font-bold text-white tracking-wide select-none">System Admin</span>
                    </div>

                    <Button
                        type="button"
                        onClick={handleLogout}
                        className="bg-gray-800 hover:bg-red-900/60 text-gray-300 hover:text-white text-xs px-3.5 py-2 rounded-xl border border-gray-700 flex items-center gap-1.5 transition-all select-none cursor-pointer"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Log Out</span>
                    </Button>
                </div>
            </header>

            {/* Dashboard Content Container */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 select-none">

                {/* Dashboard Header Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight select-none">Admin Monitoring Directory</h1>
                        <p className="text-gray-400 text-sm mt-1 select-none">Real-time stats, user availability, and completed network donations</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            type="button"
                            onClick={fetchAllData} 
                            disabled={refreshing}
                            className="bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-200 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm select-none cursor-pointer"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-red-400' : 'text-gray-400'}`} />
                            {refreshing ? 'Syncing...' : 'Sync Data'}
                        </Button>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
                    
                    {/* Total Registered Users Card */}
                    <Card className="p-5 bg-gray-900/90 border-gray-800 hover:border-gray-700 transition-all shadow-xl relative overflow-hidden group select-none">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Donors & Patients</span>
                            <div className="p-2.5 bg-blue-950/60 text-blue-400 rounded-xl border border-blue-800/40">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight">{metrics.totalUsers}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <span className="text-blue-400 font-semibold">{metrics.totalDonors} Donors</span>
                            <span>•</span>
                            <span className="text-purple-400 font-semibold">{metrics.totalPatients} Patients</span>
                        </div>
                    </Card>

                    {/* Active Available Donors Card */}
                    <Card className="p-5 bg-gray-900/90 border-gray-800 hover:border-gray-700 transition-all shadow-xl relative overflow-hidden group select-none">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ready Donors</span>
                            <div className="p-2.5 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-800/40">
                                <UserCheck className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-emerald-400 tracking-tight">{metrics.availableDonors}</div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Available for immediate donation
                        </div>
                    </Card>

                    {/* Total Completed Donations */}
                    <Card className="p-5 bg-gray-900/90 border-gray-800 hover:border-gray-700 transition-all shadow-xl relative overflow-hidden group select-none">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Donations Completed</span>
                            <div className="p-2.5 bg-red-950/60 text-red-400 rounded-xl border border-red-800/40">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight">{metrics.totalCompletedDonations}</div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-red-400 font-semibold">
                            <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                            <span>{metrics.totalLivesSavedSum} Total Lives Touched</span>
                        </div>
                    </Card>

                    {/* Blood Group Types */}
                    <Card className="p-5 bg-gray-900/90 border-gray-800 hover:border-gray-700 transition-all shadow-xl relative overflow-hidden group select-none">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Blood Categories</span>
                            <div className="p-2.5 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-800/40">
                                <Droplets className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight">{metrics.displayedGroups.length} Groups</div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-amber-400 line-clamp-1">
                            <span>A+, A-, B+, B-, AB+, AB-, O+, O-</span>
                        </div>
                    </Card>
                </div>

                {/* Section Navigation Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-900/80 p-2 rounded-2xl border border-gray-800 backdrop-blur-md select-none">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all select-none cursor-pointer ${
                                activeTab === 'users'
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            Registered User Directory ({metrics.totalUsers})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all select-none cursor-pointer ${
                                activeTab === 'history'
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            <Activity className="h-4 w-4" />
                            Donation History ({donations.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('inventory')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all select-none cursor-pointer ${
                                activeTab === 'inventory'
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            <Droplets className="h-4 w-4" />
                            Blood Distribution
                        </button>
                    </div>

                    <div className="text-xs text-gray-500 px-3 hidden md:block select-none">
                        Executive Console v2.0
                    </div>
                </div>

                {/* Global Search & Filters Toolbar */}
                <div className="space-y-4 bg-gray-900/60 p-5 rounded-2xl border border-gray-800">
                    
                    {/* Top Row: Search Input & Role / Availability Selectors */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500 pointer-events-none" />
                            <input
                                type="text"
                                className="w-full pl-11 pr-10 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-500 shadow-inner focus:ring-2 focus:ring-red-500 outline-none focus:border-red-500 transition-all text-sm select-text"
                                placeholder="Search by name, email, roll number, phone or location..."
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            {searchTerm && (
                                <button 
                                    type="button"
                                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }} 
                                    className="absolute right-3.5 top-3.5 text-gray-500 hover:text-white select-none cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {activeTab === 'users' && (
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Filter className="h-4 w-4 text-gray-400 hidden sm:block" />
                                <select
                                    value={selectedRole}
                                    onChange={e => { setSelectedRole(e.target.value); setCurrentPage(1); }}
                                    className="bg-gray-950 border border-gray-800 text-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500 w-full sm:w-auto cursor-pointer"
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="donor">Donors</option>
                                    <option value="patient">Patients / Recipients</option>
                                </select>

                                <select
                                    value={selectedAvailability}
                                    onChange={e => { setSelectedAvailability(e.target.value); setCurrentPage(1); }}
                                    className="bg-gray-950 border border-gray-800 text-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500 w-full sm:w-auto cursor-pointer"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="available">Available Now</option>
                                    <option value="unavailable">Unavailable</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Bottom Row: Blood Group Filter Pills */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 select-none">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Droplets className="h-3.5 w-3.5 text-red-500" /> Filter by Blood Group:
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 select-none">
                            <button
                                type="button"
                                onClick={() => { setSelectedBloodGroup('ALL'); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border select-none cursor-pointer ${
                                    selectedBloodGroup === 'ALL'
                                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                                        : 'bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white'
                                }`}
                            >
                                ALL ({activeTab === 'history' ? donations.length : users.length})
                            </button>

                            {metrics.displayedGroups.map(bg => {
                                const count = metrics.groupCounts[bg] || 0;
                                const isSelected = selectedBloodGroup === bg;
                                return (
                                    <button
                                        key={bg}
                                        type="button"
                                        onClick={() => { setSelectedBloodGroup(bg); setCurrentPage(1); }}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 select-none cursor-pointer ${
                                            isSelected
                                                ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                                                : 'bg-gray-950 text-gray-300 border-gray-800 hover:border-red-900/60 hover:text-white'
                                        }`}
                                    >
                                        <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`} />
                                        {bg}
                                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                                            isSelected ? 'bg-red-800 text-white' : 'bg-gray-800 text-gray-400'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* TAB 1: Registered Users View (Refactor Layout Format matching Image) */}
                {activeTab === 'users' && (
                    <div className="space-y-4">
                        
                        {/* Directory Table matching Reference Image Layout */}
                        <div className="bg-slate-200 text-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-400">
                            
                            {/* Top Pagination Row matching Screenshot */}
                            <div className="bg-slate-300 px-6 py-2.5 flex justify-between items-center text-xs md:text-sm font-bold border-b border-slate-400 text-slate-700">
                                <span>Registered User Directory ({filteredUsers.length} Users)</span>
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

                            {/* Main Directory Table */}
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
                                                    No registered users found matching selected criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedUsers.map((user, idx) => {
                                                const online = isUserOnline(user);
                                                const isEven = idx % 2 === 0;
                                                const userName = safeRender(user.displayName || user.name, "Unknown User");
                                                const mobileNo = safeRender(user.whatsappNumber || user.phone || user.mobile, "N/A");

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
                                                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer"
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
                                                                className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors focus:outline-none cursor-pointer"
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
                )}

                {/* TAB 2: Dedicated Donation History Section */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between select-none">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-red-500" />
                                Network Donation History Log
                            </h2>
                            <span className="text-xs text-gray-400">
                                Completed Transactions: <strong className="text-white">{filteredDonations.length}</strong>
                            </span>
                        </div>

                        {loading ? (
                            <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800 select-none">
                                <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">Fetching donation history records...</p>
                            </div>
                        ) : filteredDonations.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800 select-none">
                                <Clock className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-white">No Donation History Found</h3>
                                <p className="text-gray-500 text-sm mt-1">No completed blood donations matched your search or blood group filters.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredDonations.map(item => (
                                    <Card key={item.id} className="p-5 bg-gray-900 border-gray-800 hover:border-gray-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg select-none">
                                        
                                        {/* Left Side: Blood badge & Details */}
                                        <div className="flex items-start gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-red-950/90 border border-red-800/80 flex flex-col items-center justify-center text-red-400 flex-none shadow-inner">
                                                <span className="text-xs text-gray-400 font-medium">Group</span>
                                                <span className="text-lg font-black text-white">{normalizeBloodGroup(item.bloodGroup)}</span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Completed
                                                    </span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-gray-500" />
                                                        {formatTimestamp(item.completedAt || item.createdAt)}
                                                    </span>
                                                </div>

                                                <h3 className="font-bold text-white text-base">
                                                    Patient: <span className="text-red-400">{safeRender(item.patientName, 'Anonymous Patient')}</span>
                                                    {item.donorName && (
                                                        <span className="text-gray-400 text-sm font-normal"> • Donated by <strong className="text-gray-200">{safeRender(item.donorName)}</strong></span>
                                                    )}
                                                </h3>

                                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                                                    {item.hospitalName && (
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="h-3.5 w-3.5 text-gray-500" /> {safeRender(item.hospitalName)}
                                                        </span>
                                                    )}
                                                    {item.locationName && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3.5 w-3.5 text-gray-500" /> {safeRender(item.locationName)}
                                                        </span>
                                                    )}
                                                    {item.unitsNeeded && (
                                                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                                            <Droplets className="h-3.5 w-3.5" /> {safeRender(item.unitsNeeded)} Unit(s)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: View Details Button */}
                                        <div className="flex items-center gap-3 self-end md:self-center">
                                            <Button
                                                type="button"
                                                onClick={() => setSelectedDonation(item)}
                                                className="bg-gray-800 hover:bg-red-600 text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all select-none cursor-pointer"
                                            >
                                                <span>Transaction Details</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: Blood Group Inventory & Distribution */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between select-none">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Droplets className="h-5 w-5 text-red-500" />
                                Registered Donor Blood Group Analytics
                            </h2>
                            <span className="text-xs text-gray-400">Total Classified Donors: {users.length}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {metrics.displayedGroups.map(bg => {
                                const count = metrics.groupCounts[bg] || 0;
                                const percentage = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                                return (
                                    <Card key={bg} className="p-5 bg-gray-900 border-gray-800 hover:border-gray-700 transition-all space-y-4 select-none">
                                        <div className="flex items-center justify-between">
                                            <div className="h-12 w-12 rounded-xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center text-xl font-black">
                                                {bg}
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800">
                                                {percentage}% of Network
                                            </span>
                                        </div>

                                        <div>
                                            <div className="text-2xl font-black text-white">{count} Registered</div>
                                            <p className="text-xs text-gray-400 mt-1">Donors available in database</p>
                                        </div>

                                        <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden border border-gray-800">
                                            <div 
                                                className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.max(percentage, 5)}%` }}
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setSelectedBloodGroup(bg);
                                                setActiveTab('users');
                                            }}
                                            className="w-full bg-gray-950 hover:bg-gray-800 text-gray-300 text-xs py-2 rounded-xl border border-gray-800 flex items-center justify-center gap-1 select-none cursor-pointer"
                                        >
                                            <span>View {bg} Donors</span>
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

            </main>

            {/* MODAL 1: User Full Profile Details Popup */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
                    <div className="bg-gray-900 border border-gray-800 text-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                        
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors select-none cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Modal Header */}
                        <div className="flex items-center gap-4 border-b border-gray-800 pb-5">
                            <div className="h-16 w-16 rounded-2xl bg-red-950/90 border-2 border-red-800 flex items-center justify-center text-red-400 font-extrabold text-xl shadow-md flex-none">
                                {normalizeBloodGroup(selectedUser.bloodGroup) !== 'UNSPECIFIED' ? normalizeBloodGroup(selectedUser.bloodGroup) : '?'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    {safeRender(selectedUser.displayName || selectedUser.name, "Unknown User")}
                                </h2>
                                <p className="text-gray-400 text-sm">{safeRender(selectedUser.email, 'No email registered')}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                        isUserOnline(selectedUser) 
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                        {isUserOnline(selectedUser) ? '🟢 Available (Online)' : '🔴 Unavailable (Offline)'}
                                    </span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 font-medium">
                                        Role: {selectedUser.role || 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* User Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Mobile / WhatsApp</span>
                                <span className="text-gray-100 font-mono font-semibold text-base flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-emerald-400" />
                                    {safeRender(selectedUser.whatsappNumber || selectedUser.phone || selectedUser.mobile, 'Not provided')}
                                </span>
                            </div>

                            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Blood Group</span>
                                <span className="text-gray-100 font-semibold text-base flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-red-400" />
                                    {normalizeBloodGroup(selectedUser.bloodGroup)}
                                </span>
                            </div>

                            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Age & Gender</span>
                                <span className="text-gray-100 font-medium text-base">
                                    {selectedUser.age ? `${safeRender(selectedUser.age)} yrs` : 'Age N/A'} • {safeRender(selectedUser.gender, 'Gender N/A')}
                                </span>
                            </div>

                            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Weight</span>
                                <span className="text-gray-100 font-medium text-base">
                                    {selectedUser.weight ? `${safeRender(selectedUser.weight)} kg` : 'Weight N/A'}
                                </span>
                            </div>

                            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Lives Saved</span>
                                <span className="text-emerald-400 font-bold text-base flex items-center gap-1.5">
                                    <Activity className="h-4 w-4" />
                                    {selectedUser.livesSaved || 0} lives
                                </span>
                            </div>

                            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Donor Availability</span>
                                <span className={`font-semibold text-sm ${selectedUser.isAvailable ? 'text-emerald-400' : 'text-gray-400'}`}>
                                    {selectedUser.isAvailable ? 'Available for Donation' : 'Unavailable'}
                                </span>
                            </div>

                            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 md:col-span-2">
                                <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Location / Address</span>
                                <span className="text-gray-200 text-sm flex items-start gap-1.5">
                                    <MapPin className="h-4 w-4 text-red-400 flex-none mt-0.5" />
                                    {typeof selectedUser.location === 'object'
                                        ? selectedUser.location?.address || `${selectedUser.location?.city || ''}, ${selectedUser.location?.state || ''}`
                                        : (selectedUser.location || 'Location not updated')}
                                </span>
                            </div>

                            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Last Donated Date</span>
                                <span className="text-gray-200 text-sm">
                                    {formatTimestamp(selectedUser.lastDonated)}
                                </span>
                            </div>

                            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Roll No / Student ID</span>
                                <span className="text-gray-200 text-sm font-mono">
                                    {safeRender(selectedUser.rollNo, 'Not linked')}
                                </span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-4 border-t border-gray-800 flex flex-wrap gap-3 justify-end">
                            {(selectedUser.whatsappNumber || selectedUser.phone) && (
                                <a
                                    href={`https://wa.me/${String(selectedUser.whatsappNumber || selectedUser.phone).replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors shadow"
                                >
                                    <Phone className="h-4 w-4" /> WhatsApp User
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setReportUserModal(selectedUser);
                                    setSelectedUser(null);
                                }}
                                className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Flag className="h-4 w-4" /> Report Incorrect Details
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-sm transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: Donation Transaction Detail */}
            {selectedDonation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
                    <div className="bg-gray-900 border border-gray-800 text-white rounded-3xl max-w-xl w-full shadow-2xl p-6 sm:p-8 space-y-6 relative">
                        
                        <button 
                            type="button"
                            onClick={() => setSelectedDonation(null)}
                            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full transition-colors select-none cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                            <div className="p-3 bg-emerald-950 text-emerald-400 rounded-2xl border border-emerald-800">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Donation Record Summary</h2>
                                <p className="text-xs text-gray-400">Transaction ID: {selectedDonation.id}</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
                                <span className="text-gray-400">Required Blood Group:</span>
                                <span className="font-black text-lg text-red-400 bg-red-950 px-3 py-1 rounded-xl border border-red-800">
                                    {normalizeBloodGroup(selectedDonation.bloodGroup)}
                                </span>
                            </div>

                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Patient / Recipient:</span>
                                    <strong className="text-white">{safeRender(selectedDonation.patientName, 'Anonymous')}</strong>
                                </div>
                                {selectedDonation.donorName && (
                                    <div className="flex justify-between border-t border-gray-800/60 pt-2">
                                        <span className="text-gray-400">Verified Donor:</span>
                                        <strong className="text-emerald-400">{safeRender(selectedDonation.donorName)}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-2">
                                {selectedDonation.hospitalName && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Hospital:</span>
                                        <strong className="text-white">{safeRender(selectedDonation.hospitalName)}</strong>
                                    </div>
                                )}
                                {selectedDonation.locationName && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Location:</span>
                                        <strong className="text-white">{safeRender(selectedDonation.locationName)}</strong>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Completion Time:</span>
                                    <strong className="text-gray-300">{formatTimestamp(selectedDonation.completedAt || selectedDonation.createdAt)}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-800 flex justify-end">
                            <Button 
                                type="button"
                                onClick={() => setSelectedDonation(null)} 
                                className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-5 py-2.5 rounded-xl select-none cursor-pointer"
                            >
                                Close Summary
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: Report Incorrect Details Modal */}
            {reportUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none">
                    <div className="bg-gray-900 border border-gray-800 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
                        <div className="flex items-center gap-3 text-red-400">
                            <AlertTriangle className="h-6 w-6" />
                            <h3 className="text-lg font-bold text-white">Report Incorrect Details</h3>
                        </div>

                        <p className="text-sm text-gray-300">
                            Flag incorrect profile information for <span className="font-bold text-white">{safeRender(reportUserModal.displayName || reportUserModal.name, 'User')}</span>.
                        </p>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reason / Details</label>
                            <textarea
                                rows={3}
                                className="w-full p-3 rounded-xl bg-gray-950 border border-gray-800 text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="Specify what details are incorrect (e.g. invalid phone number, wrong blood group)..."
                                value={reportReason}
                                onChange={e => setReportReason(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setReportUserModal(null);
                                    setReportReason('');
                                }}
                                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitReport}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow transition-colors cursor-pointer"
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
