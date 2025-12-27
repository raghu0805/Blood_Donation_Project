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
        <div className="max-w-2xl mx-auto h-[calc(100dvh-5rem)] md:h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <Card className="mb-4 rounded-b-none border-b-0 flex-none z-10">
                <div className="p-4 flex items-center gap-3 shadow-sm bg-white rounded-t-xl">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg border border-gray-200 shadow-inner mb-4">
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
                                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe
                                        ? 'bg-red-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                                        }`}
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
            <div className="flex gap-2 p-2 bg-white rounded-xl border border-gray-200 shadow-lg">
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
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                    />
                    <Button type="submit" disabled={!newMessage.trim()} className="rounded-lg aspect-square p-0 w-12 flex items-center justify-center">
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
