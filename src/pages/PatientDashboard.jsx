import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMCP } from '../contexts/MCPContext';
import { Card, CardHeader, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Sparkles, MapPin, AlertCircle, Activity, CheckCircle } from 'lucide-react';

export default function PatientDashboard() {
    const { availableDonors, requestGeminiAnalysis, geminiAnalysis, broadcastRequest, myRequests, completeRequest } = useMCP();
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        bloodGroup: '',
        urgency: 'Emergency'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await broadcastRequest(formData);
            alert("Request broadcasted successfully!");
            setShowForm(false);
        } catch (err) {
            alert("Failed to broadcast request: " + err.message);
        }
    };

    const handleContact = (requestId) => {
        navigate(`/chat/${requestId}`);
    };

    const handleComplete = async (requestId) => {
        if (window.confirm("Confirm that you received the blood donation? This will update the donor's impact score.")) {
            try {
                await completeRequest(requestId);
            } catch (err) {
                alert("Error: " + err);
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find a Donor</h1>
                    <p className="text-gray-500 dark:text-gray-400">Create a request to alert nearby donors.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} size="lg" className="w-full sm:w-auto shadow-lg shadow-red-200">
                    {showForm ? 'Cancel Request' : 'New Emergency Request'}
                </Button>
            </div>

            {/* Request Form */}
            {showForm && (
                <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
                    <CardHeader>
                        <h3 className="font-bold text-red-900 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Emergency Request Details
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group Needed</label>
                                    <select
                                        value={formData.bloodGroup}
                                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Select...</option>
                                        <option value="A+">A+</option>
                                        <option value="O+">O+</option>
                                        <option value="B+">B+</option>
                                        <option value="AB+">AB+</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urgency</label>
                                    <select
                                        value={formData.urgency}
                                        onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="Emergency">Emergency</option>
                                        <option value="Scheduled">Scheduled</option>
                                    </select>
                                </div>
                            </div>
                            <Button type="button" onClick={handleSubmit} className="w-full">Broadcast Request</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* My Active Requests (Acknowledgement Loop) */}
            {myRequests && myRequests.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-red-600 dark:text-red-500" />
                        My Active Requests
                    </h3>
                    {myRequests.map(req => (
                        <Card key={req.id} className={`border-l-4 ${req.status === 'accepted' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/10 dark:border-green-900/50' : 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10 dark:border-l-amber-500/50'}`}>
                            <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4">
                                <div className="w-full sm:w-auto">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-gray-900 dark:text-white">{req.bloodGroup} Blood Needed</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.status === 'completed' ? 'bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
                                                req.status === 'ready_for_pickup' ? 'bg-purple-200 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' :
                                                    req.status === 'accepted' ? 'bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
                                                        'bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                                            }`}>
                                            {req.status === 'completed' && req.fulfillmentType === 'stock_supply' ? 'SUPPLIED BY BANK' :
                                                req.status === 'ready_for_pickup' ? 'READY FOR PICKUP' :
                                                    req.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        {req.status === 'accepted' ? `Accepted by: ${req.donorName || 'Unknown Donor'}` :
                                            req.status === 'ready_for_pickup' ? 'Blood Reserved. Please visit bank with pickup code.' :
                                                req.status === 'completed' ? (req.fulfillmentType === 'stock_supply' ? 'Fulfilled directly by Blood Bank Stock.' : 'Donation cycle completed successfully.') :
                                                    'Waiting for donors...'}
                                    </p>

                                    {/* Pickup Code Display */}
                                    {req.status === 'ready_for_pickup' && req.pickupCode && (
                                        <div className="mt-3 bg-white dark:bg-gray-800 p-3 rounded border-2 border-dashed border-purple-300 text-center">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pickup Verification Code</p>
                                            <p className="text-4xl font-mono font-bold text-purple-600 tracking-widest">{req.pickupCode}</p>
                                            <p className="text-xs text-gray-400 mt-1">Show this code at the blood bank counter.</p>
                                        </div>
                                    )}

                                </div>
                                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                                    {req.status === 'accepted' && (
                                        <>
                                            <Button
                                                size="sm"
                                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                                                onClick={() => handleContact(req.id)}
                                            >
                                                Contact
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                                                onClick={() => handleComplete(req.id)}
                                            >
                                                Received
                                            </Button>
                                        </>
                                    )}
                                    {(req.status === 'completed' || req.status === 'ready_for_pickup') && (
                                        <div className="text-right w-full">
                                            <span className={`font-bold text-sm px-3 py-1 rounded-full flex items-center justify-center sm:justify-end gap-1 ${req.status === 'ready_for_pickup' ? 'text-purple-600 bg-purple-100' : 'text-green-600 bg-green-100'
                                                }`}>
                                                <CheckCircle className="h-3 w-3" />
                                                {req.status === 'ready_for_pickup' ? 'Reserved' : req.fulfillmentType === 'stock_supply' ? 'Stock Supplied' : 'Completed'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            {req.status === 'completed' && <div className="h-1 bg-green-500 w-full" />}
                        </Card>
                    ))}
                </div>
            )}

            {/* Gemini Analysis Context */}
            {geminiAnalysis && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm">Gemini Analysis</h4>
                        <p className="text-blue-800 dark:text-blue-300 text-sm">{geminiAnalysis}</p>
                    </div>
                </div>
            )}

            {/* Donors List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">Matched Donors</h3>
                    <Button variant="ghost" size="sm" onClick={() => requestGeminiAnalysis({ donors: availableDonors })}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze Best Match
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableDonors.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">No active matched donors found nearby at the moment.</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try broadcasting a request to alert offline donors.</p>
                        </div>
                    ) : (
                        availableDonors.map(donor => (
                            <DonorCard key={donor.id} donor={donor} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function DonorCard({ donor }) {
    const { broadcastRequest } = useMCP();
    const donorName = donor.name || "Unknown Donor";
    const initial = donorName.charAt(0).toUpperCase();
    const distance = donor.distance ? `${donor.distance}` : "Unknown distance";
    const lastDonated = donor.lastDonated ? new Date(donor.lastDonated).toLocaleDateString() : "Never";

    const handleRequest = async () => {
        if (!window.confirm(`Send immediate request to ${donorName} for ${donor.bloodGroup} blood?`)) return;

        try {
            await broadcastRequest({
                bloodGroup: donor.bloodGroup,
                urgency: 'Emergency',
                specificDonorId: donor.id // Optional: could be used for highlighting
            });
            alert(`Request sent! ${donorName} has been notified.`);
        } catch (err) {
            alert("Failed to send request: " + err.message);
        }
    };

    return (
        <Card className="hover:border-red-200 dark:hover:border-red-900 transition-colors bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
            <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-500 dark:text-gray-300">
                    {initial}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">{donorName}</h4>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3 mr-1" />
                        {distance} • Last: {lastDonated}
                    </div>
                </div>
                <div className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded">
                    {donor.bloodGroup || "??"}
                </div>
            </div>
            <div className="px-4 pb-4">
                <Button variant="secondary" size="sm" className="w-full text-xs" onClick={handleRequest}>Request</Button>
            </div>
        </Card>
    );
}
