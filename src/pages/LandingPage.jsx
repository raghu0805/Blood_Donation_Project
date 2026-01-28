import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { HeartPulse, ShieldCheck, MapPin, Activity, Clock, AlertCircle, XCircle, Phone, CheckCircle, Megaphone, Database, Plus } from 'lucide-react';
import DemoModal from '../components/DemoModal';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { calculateDonationEligibility } from '../lib/utils';
import CountdownTimer from '../components/CountdownTimer';
import { useMCP } from '../contexts/MCPContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, query, where, getDocs, onSnapshot, doc, serverTimestamp, setDoc, deleteDoc, increment } from 'firebase/firestore';
import { Card } from '../components/Card';



export default function LandingPage() {
    const { currentUser, userRole } = useAuth();
    const [showDemo, setShowDemo] = useState(false);

    useEffect(() => {
        const hasViewedIntro = sessionStorage.getItem('hasViewedIntro');
        if (!hasViewedIntro) {
            setShowDemo(true);
            sessionStorage.setItem('hasViewedIntro', 'true');
        }
    }, []);

    // Admin Features State
    const { broadcastRequest, completeRequest, acceptRequest, fulfillRequestByAdmin, updateUserProfile, verifyPickupCode } = useMCP();
    const toast = useToast(); // Added toast

    const [adminRequests, setAdminRequests] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]); // New state for patient requests
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestData, setRequestData] = useState({ bloodGroup: 'A+', urgency: 'Emergency' });
    const [activeTab, setActiveTab] = useState('responses'); // Default to responses
    const navigate = useNavigate();

    // Fetch Admin Requests (My Broadcasts)
    const fetchAdminRequests = async () => {
        try {
            const q = query(
                collection(db, "requests"),
                where("patientId", "==", currentUser.uid)
            );
            const snapshot = await getDocs(q);
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setAdminRequests(reqs);
        } catch (error) {
            console.error("Error fetching admin requests:", error);
        }
    };

    // Fetch Incoming Patient Requests
    const fetchIncomingRequests = async () => {
        try {
            // Fetch pending requests not made by me
            const q = query(
                collection(db, "requests"),
                where("status", "in", ["pending", "accepted", "ready_for_pickup"]) // Added ready_for_pickup
            );
            // Firestore limitation: != query. We filter client side for now or basic query
            const snapshot = await getDocs(q);
            let reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter out my own requests
            reqs = reqs.filter(r => r.patientId !== currentUser.uid);

            reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setIncomingRequests(reqs);
        } catch (error) {
            console.error("Error fetching incoming requests:", error);
        }
    };

    useEffect(() => {
        if (currentUser && userRole === 'admin') {
            if (activeTab === 'responses') fetchAdminRequests();
            if (activeTab === 'incoming') fetchIncomingRequests();
            // stock needs no fetch, it's in currentUser
        }
    }, [currentUser, userRole, activeTab]);

    const handleAdminBroadcast = async (e) => {
        e.preventDefault();
        try {
            await broadcastRequest({
                ...requestData,
                patientName: currentUser.displayName || "Blood Bank Center",
                requesterType: 'admin',
                location: { lat: 12.9716, lng: 77.5946 },
                isCenterRequest: true,
                centerId: currentUser.uid
            });
            toast.success("Emergency supply request broadcasted to network!");
            setShowRequestForm(false);
            fetchAdminRequests();
        } catch (error) {
            toast.error("Failed to broadcast: " + error.message);
        }
    };

    const handleAdminAccept = async (req) => {


        try {
            console.log("Attempting to fulfill request:", req.id, req.bloodGroup);
            await fulfillRequestByAdmin(req.id, req.bloodGroup);
            toast.success("All set! The stock has been reserved and the patient has been notified with their Pickup Code.");
            fetchIncomingRequests();
        } catch (error) {
            console.error("Fulfill failed:", error);
            toast.error("Oops! Something went wrong: " + error);
        }
    };

    const handleVerifyPickup = async (reqId, code) => {
        try {
            await verifyPickupCode(reqId, code);
            toast.success("Perfect match! Identity verified. You can now safely hand over the blood unit.");
            fetchIncomingRequests();
        } catch (error) {
            toast.error("Verification Mismatch: " + error);
        }
    };

    const handleAddStock = async (bloodGroup) => {
        try {
            console.log(`Adding stock for ${bloodGroup}...`);
            // Use nested object structure for setDoc with merge: true
            await updateUserProfile({
                bloodStock: {
                    [bloodGroup]: increment(1)
                }
            });
            console.log("Stock add signal sent.");
            // Optional: toast.success(`Added 1 unit of ${bloodGroup}`); 
        } catch (error) {
            console.error("Stock update error:", error);
            toast.error("Failed to update stock: " + error.message);
        }
    };

    const getDestination = () => {
        if (!currentUser) return "/auth";
        if (userRole === 'admin') return "/admin-dashboard";
        if (userRole === 'donor') return "/donor-dashboard";
        if (userRole === 'patient') return "/patient-dashboard";
        return "/role-selection";
    };

    const destination = getDestination();

    // ADMIN VIEW
    if (userRole === 'admin') {
        return (
            <div className="space-y-8 pb-16 relative min-h-screen">
                <section className="text-center space-y-6 pt-6 md:pt-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium text-sm border border-red-100 dark:border-red-900/30"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Live: Emergency Blood Network Active
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
                        Admin Operations Console
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Manage network emergencies and blood supply requests.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 px-4 flex-wrap">
                        <Button
                            onClick={() => { setShowRequestForm(true); }}
                            size="lg"
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                        >
                            <Megaphone className="h-5 w-5" />
                            Broadcast Request
                        </Button>

                        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800 shadow-sm">
                            <button
                                onClick={() => setActiveTab('responses')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'responses' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'}`}
                            >
                                <Activity className="h-4 w-4" />
                                My Broadcasts
                            </button>
                            <button
                                onClick={() => setActiveTab('incoming')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'incoming' ? 'bg-red-900/20 text-red-400 shadow-sm' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'}`}
                            >
                                <HeartPulse className="h-4 w-4" />
                                Patient Requests
                            </button>
                            <button
                                onClick={() => setActiveTab('stock')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'stock' ? 'bg-blue-900/20 text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'}`}
                            >
                                <Database className="h-4 w-4" />
                                Blood Stock
                            </button>
                        </div>

                        <Link to="/admin-dashboard">
                            <Button variant="outline" size="lg" className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" />
                                Verify Donors
                            </Button>
                        </Link>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4" id="responses-section">
                    <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-2">
                        {activeTab === 'responses' ? 'Active Broadcasts & Responses' : activeTab === 'incoming' ? 'Incoming Patient Requests' : 'Blood Stock Inventory'}
                    </h2>

                    {activeTab === 'responses' ? (
                        adminRequests.length === 0 ? (
                            <div className="text-center py-12 bg-gray-900 rounded-xl border-2 border-dashed border-gray-800">
                                <p className="text-gray-500">No active emergency broadcasts. Network is stable.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {adminRequests.map(req => (
                                    <AdminRequestCard key={req.id} req={req} navigate={navigate} completeRequest={completeRequest} fetchAdminRequests={fetchAdminRequests} />
                                ))}
                            </div>
                        )
                    ) : activeTab === 'incoming' ? (
                        incomingRequests.length === 0 ? (
                            <div className="text-center py-12 bg-gray-900 rounded-xl border-2 border-dashed border-gray-800">
                                <p className="text-gray-500">No pending patient requests found.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {incomingRequests.map(req => (
                                    <IncomingPatientCard
                                        key={req.id}
                                        req={req}
                                        onAccept={handleAdminAccept}
                                        onVerify={handleVerifyPickup}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        activeTab === 'stock' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Blood Stock Inventory</h3>
                                    <div className="text-sm text-gray-500">Live updates</div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                                        <Card key={group} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-colors">
                                            <div className="p-4 flex flex-col items-center text-center">
                                                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm mb-2">
                                                    {group}
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                                    {currentUser?.bloodStock?.[group] || 0}
                                                </h3>
                                                <span className="text-xs text-gray-500 mb-3">units available</span>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="w-full text-xs h-8"
                                                    onClick={() => handleAddStock(group)}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                            </div>
                        )
                    )}
                </div>

                {/* Admin Request Modal */}
                {showRequestForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
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
        );
    } // End Admin View

    return (
        <div className="flex flex-col gap-8 md:gap-16 pb-16 relative">

            {/* Hero Section */}
            <section className="text-center space-y-6 md:space-y-8 pt-6 md:pt-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium text-sm border border-red-100 dark:border-red-900/30"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Live: Emergency Blood Network Active
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-7xl font-extrabold tracking-tight text-white dark:text-white px-2"
                >
                    {userRole === 'admin' ? "Admin Console" : "Your blood can"} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900">
                        {userRole === 'admin' ? "Manage LifeLink Network" : "save a life today."}
                    </span>
                </motion.h1>

                {currentUser && userRole !== 'admin' && !calculateDonationEligibility(currentUser?.lastDonated, currentUser?.gender).eligible && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-gray-200 dark:shadow-none border-2 border-red-100 dark:border-red-900/30"
                    >
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full shadow-inner border border-red-100 dark:border-red-900/30">
                            <Clock className="h-8 w-8 text-red-600 animate-pulse" />
                        </div>
                        <div className="flex-1 text-center md:text-left text-gray-900 dark:text-gray-100">
                            <h3 className="font-bold text-2xl mb-1 tracking-tight">Recovery Period Active</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4 text-base font-medium">
                                Your safety is priority. You will be eligible to save lives again in:
                            </p>
                            <div className="flex justify-center md:justify-start">
                                <CountdownTimer
                                    targetDate={calculateDonationEligibility(currentUser?.lastDonated, currentUser?.gender).nextDate}
                                    variant="critical"
                                    size="lg"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
                >
                    LifeLink connects donors and patients in real-time during emergencies.
                    Smart matching, ethical tracking, and instant coordination.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link to={destination}>
                        <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                            {currentUser ? 'Go to Dashboard' : 'Find Blood Now'}
                        </Button>
                    </Link>
                    {!currentUser && (
                        <Link to="/auth">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8">
                                Register as Donor
                            </Button>
                        </Link>
                    )}
                </motion.div>


            </section>

            <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />


        </div>
    );
}

// Helper Component for Admin's Own Requests
function AdminRequestCard({ req, navigate, completeRequest, fetchAdminRequests }) {
    const toast = useToast();
    return (
        <Card className="p-5 border-l-4 border-l-red-500 relative hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded-full">
                        {req.urgency}
                    </span>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{req.bloodGroup}</h3>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    req.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                    {req.status}
                </div>
            </div>

            <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
            </p>

            {['accepted', 'completed'].includes(req.status) ? (
                <div className={`p-4 rounded-lg border ${req.status === 'completed' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                    <p className={`text-xs font-semibold uppercase mb-1 ${req.status === 'completed' ? 'text-blue-800' : 'text-green-800'}`}>
                        {req.status === 'completed' ? 'Donation Completed By' : 'Accepted By'}
                    </p>
                    <p className="font-bold text-gray-900 text-lg">{req.donorName}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Phone className={`h-4 w-4 ${req.status === 'completed' ? 'text-blue-600' : 'text-green-600'}`} />
                        <a href={`tel:${req.donorPhone}`} className={`text-sm font-medium hover:underline ${req.status === 'completed' ? 'text-blue-700' : 'text-green-700'}`}>
                            {req.donorPhone || "No Phone Shared"}
                        </a>
                    </div>

                    <div className="flex gap-2 mt-4">
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
                                    // Removed confirm for smoother flow, relying on explicit button action
                                    try {
                                        await completeRequest(req.id);
                                        toast.success("Stock Updated! Donation completed.");
                                        fetchAdminRequests();
                                    } catch (error) {
                                        toast.error("Failed to update stock: " + error.message);
                                    }
                                }}
                                className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                            >
                                Mark Completed & Add to Stock
                            </Button>
                            <div className="mt-2 text-xs text-green-600 flex gap-1 justify-center items-center">
                                <CheckCircle className="h-3 w-3" />
                                Donor is on the way
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-900 p-4 rounded-lg border border-dashed border-gray-800 text-center">
                    <div className="animate-pulse flex justify-center mb-2">
                        <div className="h-2 w-2 bg-gray-700 rounded-full mx-0.5"></div>
                        <div className="h-2 w-2 bg-gray-700 rounded-full mx-0.5 animation-delay-200"></div>
                        <div className="h-2 w-2 bg-gray-700 rounded-full mx-0.5 animation-delay-400"></div>
                    </div>
                    <span className="text-sm text-gray-500">Waiting for donors to respond...</span>
                </div>
            )}
        </Card>
    );
}

function IncomingPatientCard({ req, onAccept, onVerify }) {
    const [code, setCode] = useState("");

    return (
        <Card className="p-5 border-l-4 border-l-blue-500 relative hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${req.status === 'ready_for_pickup' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'
                        }`}>
                        {req.status === 'ready_for_pickup' ? 'Awaiting Pickup' : 'Patient Request'}
                    </span>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{req.bloodGroup}</h3>
                </div>
                <div className="px-2 py-1 rounded text-xs font-bold uppercase bg-yellow-100 text-yellow-700">
                    {req.urgency}
                </div>
            </div>
            <p className="font-medium text-lg">{req.patientName}</p>
            <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Unknown Location
            </p>

            {req.status === 'ready_for_pickup' ? (
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                    <p className="text-xs font-bold text-amber-800 mb-2">Verify Pickup Code</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="6-digit Code"
                            className="w-full px-2 py-1 text-sm border rounded"
                            value={code} // State should be controlled? Yes.
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                            onClick={() => onVerify(req.id, code)}
                        >
                            Verify
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    onClick={() => onAccept(req)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Fulfill / Supply Blood
                </Button>
            )}
        </Card>
    );
}

function FeatureCard({ icon: Icon, title, desc }) {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
    );
}
