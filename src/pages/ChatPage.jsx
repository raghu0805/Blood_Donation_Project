import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMCP } from '../contexts/MCPContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Send, ArrowLeft, User, MapPin, Navigation } from 'lucide-react';

export default function ChatPage() {
    const { requestId } = useParams();
    const { currentUser } = useAuth();
    const { sendMessage } = useMCP();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [requestDetails, setRequestDetails] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch Request Details (Active Participant Info)
    useEffect(() => {
        const fetchRequest = async () => {
            if (!requestId) return;
            try {
                const docRef = doc(db, 'requests', requestId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRequestDetails({ id: docSnap.id, ...docSnap.data() });
                } else {
                    alert("Request not found");
                    navigate('/');
                }
            } catch (err) {
                console.error("Error fetching request details:", err);
            }
        };
        fetchRequest();
    }, [requestId, navigate]);

    // Listen for Real-Time Messages
    useEffect(() => {
        if (!requestId) return;

        const q = query(
            collection(db, 'requests', requestId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [requestId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendMessage(requestId, newMessage);
            setNewMessage('');
        } catch (err) {
            console.error("Failed to send:", err);
            alert("Failed to send message.");
        }
    };

    const handleShareLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                await sendMessage(requestId, "📍 Shared Location", {
                    type: 'location',
                    coords: { lat: latitude, lng: longitude }
                });
            } catch (err) {
                console.error("Error sharing location:", err);
                alert("Failed to share location.");
            }
        }, (error) => {
            console.error("Geolocation error:", error);
            alert("Unable to retrieve your location.");
        });
    };

    const getOtherParticipantName = () => {
        if (!requestDetails) return "Loading...";
        // If I am the patient, show Donor Name. If I am Donor, show Patient Name.
        // Fallback checks
        if (currentUser.uid === requestDetails.patientId) {
            return requestDetails.donorName || "Potential Donor";
        } else {
            return requestDetails.patientName || "Patient";
        }
    };

    return (
        <div className="max-w-2xl mx-auto h-[calc(100dvh-5rem)] md:h-[calc(100vh-6rem)] flex flex-col mt-4" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)", borderRadius: "10px" }}>
            {/* Header */}
            <Card className="mb-4 rounded-b-none border-b-0 flex-none z-10" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
                <div className="p-4 flex items-center gap-3 rounded-t-xl" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(220,38,38,0.1)", boxShadow: "0 4px 20px rgba(220,38,38,0.04)" }}>
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-bold text-gray-900">{getOtherParticipantName()}</h2>
                        <p className="text-xs text-gray-500">
                            {requestDetails?.bloodGroup} Request • {requestDetails?.urgency}
                        </p>
                    </div>

                </div>
            </Card>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 mx-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(148,163,184,0.15)", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)" }}>
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <p>No messages yet.</p>
                        <p className="text-sm">Start the conversation to coordinate.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUser?.uid;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm ${isMe
                                            ? 'text-white shadow-md'
                                            : 'text-gray-800 shadow-sm'
                                            }`}
                                        style={isMe ? { background: "linear-gradient(135deg, #dc2626, #ef4444)", borderBottomRightRadius: "4px" } : { background: "rgba(255,255,255,0.9)", border: "1px solid rgba(148,163,184,0.2)", borderBottomLeftRadius: "4px" }}
                                    >
                                    {msg.type === 'location' && msg.coords ? (
                                        <a
                                            href={`https://www.google.com/maps?q=${msg.coords.lat},${msg.coords.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-2 font-bold underline ${isMe ? 'text-white' : 'text-blue-600'}`}
                                        >
                                            <MapPin className="h-4 w-4" />
                                            Shared Location
                                        </a>
                                    ) : (
                                        <p>{msg.text}</p>
                                    )}
                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2 p-3 mx-2 mb-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(24px)", border: "1px solid rgba(220,38,38,0.1)", boxShadow: "0 8px 32px rgba(220,38,38,0.08)" }}>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleShareLocation}
                    title="Share Location"
                    className="rounded-lg aspect-square p-0 w-12 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50"
                >
                    <MapPin className="h-5 w-5" />
                </Button>
                <form onSubmit={handleSend} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-5 py-3 rounded-xl focus:outline-none transition-all text-gray-800"
                            style={{ background: "rgba(248,250,252,0.8)", border: "1px solid rgba(148,163,184,0.2)", outline: "none" }}
                        />
                        <Button type="submit" disabled={!newMessage.trim()} className="rounded-xl aspect-square p-0 w-12 flex items-center justify-center transition-transform hover:scale-105" style={{ background: newMessage.trim() ? "linear-gradient(135deg, #dc2626, #ef4444)" : "#e2e8f0", color: newMessage.trim() ? "#fff" : "#94a3b8", border: "none" }}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
