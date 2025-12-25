import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMCP } from '../contexts/MCPContext';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Switch } from '@headlessui/react';
import { MapPin, Bell, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateDonationEligibility } from '../lib/utils';
import CountdownTimer from '../components/CountdownTimer';
import { DonorDeclarationModal } from '../components/DonorDeclarationModal';

export default function DonorDashboard() {
    const { currentUser } = useAuth();
    const { activeRequests, toggleDonorAvailability } = useMCP();
    const [isAvailable, setIsAvailable] = useState(currentUser?.isAvailable || false);
    const [showDeclaration, setShowDeclaration] = useState(false);
    const [pendingAvailability, setPendingAvailability] = useState(null); // specific target state

    const { eligible, message, percentage, daysRemaining, nextDate } = calculateDonationEligibility(currentUser?.lastDonated, currentUser?.gender);

    // Auto-activate availability if eligible (Logic kept, but requires manual re-verification effectively if session resets)
    useEffect(() => {
        const autoActivate = async () => {
            if (eligible && !isAvailable && currentUser?.isAvailable) {
                // If DB says available, sync local state
                setIsAvailable(true);
            }
        };
        autoActivate();
    }, [eligible, currentUser]);


    const handleToggle = async (val) => {
        if (!eligible && val) {
            alert(message);
            return;
        }

        if (val === true) {
            // Turning ON: Require Declaration
            setPendingAvailability(true);
            setShowDeclaration(true);
        } else {
            // Turning OFF: No declaration needed
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
                // setPendingAvailability(null); // Cleanup
            } catch (error) {
                console.error("Failed to update availability", error);
                setIsAvailable(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            <DonorDeclarationModal
                isOpen={showDeclaration}
                onClose={() => { setShowDeclaration(false); setPendingAvailability(null); }}
                onConfirm={handleDeclarationConfirm}
            />

            {/* Header Stat Card */}
            <Card className={`border-l-4 ${eligible ? 'border-l-red-600' : 'border-l-amber-500'}`}>
                <CardContent>
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Donor Status</h2>
                            <p className={`text-sm ${!eligible ? 'text-amber-600 dark:text-amber-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                {!eligible ? "Recovery Period Active" : (isAvailable ? "You are visible to nearby patients." : "You are currently offline.")}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${!eligible ? 'text-amber-600 dark:text-amber-500' : (isAvailable ? 'text-red-600 dark:text-red-500' : 'text-gray-400 dark:text-gray-500')}`}>
                                {!eligible ? <CountdownTimer targetDate={nextDate} /> : (isAvailable ? 'Available' : 'Unavailable')}
                            </span>

                            <div className={!eligible ? "opacity-50 cursor-not-allowed" : ""}>
                                <Switch
                                    checked={isAvailable && eligible}
                                    onChange={handleToggle}
                                    className={`${isAvailable && eligible ? 'bg-red-600 dark:bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
                                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                                >
                                    <span
                                        className={`${isAvailable && eligible ? 'translate-x-6' : 'translate-x-1'
                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </Switch>
                            </div>
                        </div>
                    </div>

                    {!eligible && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-amber-700 mb-1">
                                <span>Recovery Progress</span>
                                <span>{Math.round(percentage)}%</span>
                            </div>
                            <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
                                <motion.div
                                    className="bg-amber-500 h-2.5 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {message}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main Feed */}
                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className="h-5 w-5 text-red-600 dark:text-red-500" />
                        Active Requests Nearby
                    </h3>

                    <div className="space-y-4">
                        {activeRequests.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 italic">No active requests in your area.</p>
                        ) : (
                            activeRequests.map(req => (
                                <RequestCard key={req.id} request={req} />
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="font-bold border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white">Your Impact</CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Last Donation</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">
                                    {currentUser.lastDonated
                                        ? new Date(currentUser.lastDonated?.seconds ? currentUser.lastDonated.seconds * 1000 : currentUser.lastDonated).toLocaleDateString()
                                        : "Never"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Lives Saved</span>
                                <span className="font-medium text-red-600 dark:text-red-500">{currentUser.livesSaved || 0}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function RequestCard({ request }) {
    const { acceptRequest } = useMCP();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [showConsent, setShowConsent] = useState(false);
    const [accepting, setAccepting] = useState(false);

    const isAcceptedByMe = request.status === 'accepted' && request.donorId === currentUser?.uid;

    const handleAcceptClick = () => {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm hover:shadow-md transition-all ${isAcceptedByMe ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10' : 'border-red-100 dark:border-red-900/30'}`}
        >
            <DonorDeclarationModal
                isOpen={showConsent}
                onClose={() => setShowConsent(false)}
                onConfirm={confirmAccept}
            />

            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className={`inline-block px-2 py-1 text-xs font-bold rounded mb-2 ${isAcceptedByMe ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                        {isAcceptedByMe ? 'ACCEPTED' : request.urgency}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{request.patientName}</h4>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {request.distance || "Unknown distance"} away
                    </div>
                </div>
                <div className="h-12 w-12 bg-red-600 dark:bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-200 dark:shadow-none">
                    {request.bloodGroup}
                </div>
            </div>

            <div className="flex gap-3">
                {isAcceptedByMe ? (
                    <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                        onClick={() => navigate(`/chat/${request.id}`)}
                    >
                        Chat with Patient
                    </Button>
                ) : (
                    <Button className="flex-1" size="sm" onClick={handleAcceptClick}>Accept Request</Button>
                )}
                <Button variant="secondary" size="sm">View Details</Button>
            </div>
        </motion.div>
    );
}
