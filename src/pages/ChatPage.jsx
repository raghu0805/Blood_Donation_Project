import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMCP } from '../contexts/MCPContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Button } from '../components/Button';
import { Send, ArrowLeft, User, MapPin, Navigation, Info, Activity, AlertTriangle, Loader2 } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
    const { requestId } = useParams();
    const { currentUser } = useAuth();
    const { sendMessage, userLocation } = useMCP();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [requestDetails, setRequestDetails] = useState(null);
    const [showHeaderInfo, setShowHeaderInfo] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isSharingLocation, setIsSharingLocation] = useState(false);
    const messagesEndRef = useRef(null);

    // Fetch Request Details
    useEffect(() => {
        const fetchRequest = async () => {
            if (!requestId) return;
            try {
                const docRef = doc(db, 'requests', requestId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRequestDetails({ id: docSnap.id, ...docSnap.data() });
                } else {
                    toast.error("Request not found");

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
        if (e) e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const text = newMessage;
            setNewMessage(''); // Clear immediately for better UX
            await sendMessage(requestId, text);
        } catch (err) {
            console.error("Failed to send:", err);
            toast.error("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    const handleShareLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsSharingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                await sendMessage(requestId, "📍 Shared Location", {
                    type: 'location',
                    coords: { lat: latitude, lng: longitude }
                });
            } catch (err) {
                console.error("Error sharing location:", err);
                toast.error("Failed to share location.");
            } finally {
                setIsSharingLocation(false);
            }
        }, (error) => {
            console.error("Geolocation error:", error);
            toast.error("Unable to retrieve your location.");
            setIsSharingLocation(false);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    };

    const getOtherParticipantInfo = () => {
        if (!requestDetails) return { name: "Loading...", photoURL: null };
        const isPatient = currentUser.uid === requestDetails.patientId;
        const confirmed = requestDetails.confirmedDonors || [];
        
        if (isPatient) {
            if (confirmed.length > 1) {
                return { name: `${confirmed.length} Donors Pool`, photoURL: null };
            }
            if (confirmed.length === 1) {
                return { name: confirmed[0].donorName || "Donor", photoURL: confirmed[0].donorPhotoURL };
            }
            return { name: requestDetails.donorName || "Potential Donor", photoURL: requestDetails.donorPhotoURL };
        } else {
            return { name: requestDetails.patientName || "Patient", photoURL: requestDetails.patientPhotoURL };
        }
    };

    const otherUser = getOtherParticipantInfo();

    return (
        <div className="flex h-screen flex-col bg-slate-50 md:bg-transparent overflow-hidden">
            {/* Header */}
            <header className="relative z-20 flex-none border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-xl md:rounded-t-3xl md:mt-4 md:mx-4 md:shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full h-10 w-10 p-0 text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    
                    <div className="flex flex-1 items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl shadow-sm">
                            <UserAvatar photoURL={otherUser.photoURL} name={otherUser.name} />
                            {requestDetails?.status === 'ready_for_pickup' && (
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                            )}
                        </div>
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <h2 className="truncate text-base font-black text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                                {otherUser.name}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100/50">
                                    {requestDetails?.bloodGroup} Needed
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                    <Activity size={10} /> {requestDetails?.hospitalName || requestDetails?.hospital || "Emergency Site"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowHeaderInfo(!showHeaderInfo)}
                        className={`rounded-full h-10 w-10 p-0 transition-colors ${showHeaderInfo ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Info size={20} />
                    </Button>
                </div>

                {/* Collapsible Info Bar */}
                <AnimatePresence>
                    {showHeaderInfo && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/50">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Urgency Level</p>
                                    <p className={`text-xs font-bold flex items-center gap-1.5 ${requestDetails?.urgency === 'Emergency' ? 'text-red-600' : 'text-amber-600'}`}>
                                        <AlertTriangle size={12} /> {requestDetails?.urgency}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/50">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Status</p>
                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <div className={`h-2 w-2 rounded-full ${requestDetails?.status === 'completed' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
                                        {requestDetails?.status?.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth bg-[#f8fafc]/50">
                <div className="mx-auto max-w-2xl space-y-6">
                    <AnimatePresence mode="popLayout">
                        {messages.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-center opacity-60"
                            >
                                <div className="mb-4 h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                                    <Send size={40} />
                                </div>
                                <p className="text-sm font-bold text-slate-500">Secure Channel Established</p>
                                <p className="mt-1 text-xs text-slate-400 max-w-[200px]">Send a message to coordinate the life-saving donation.</p>
                            </motion.div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = msg.senderId === currentUser?.uid;
                                const showAvatar = !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId);
                                
                                return (
                                    <motion.div 
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        layout
                                        className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {!isMe && (
                                            <div className={`h-8 w-8 shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-opacity ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                                <UserAvatar name={msg.senderName} />
                                            </div>
                                        )}
                                        
                                        <div className={`flex max-w-[80%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div
                                                className={`relative overflow-hidden rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all hover:shadow-md ${isMe
                                                    ? 'bg-red-600 text-white selection:bg-red-300 selection:text-red-900'
                                                    : 'bg-white text-slate-800 border border-slate-200/60'
                                                    }`}
                                                style={isMe ? { 
                                                    background: "linear-gradient(135deg, #dc2626, #ef4444)", 
                                                    borderBottomRightRadius: "4px" 
                                                } : msg.system ? { 
                                                    background: "rgba(59,130,246,0.05)", 
                                                    border: "1px solid rgba(59,130,246,0.15)", 
                                                    borderRadius: "12px",
                                                    color: "#1e40af",
                                                    fontStyle: "italic"
                                                } : { 
                                                    borderBottomLeftRadius: "4px" 
                                                }}
                                            >
                                                {msg.type === 'location' && msg.coords ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-red-50 text-red-600'}`}>
                                                                <MapPin size={18} />
                                                            </div>
                                                            <span className="font-bold">Live Location Shared</span>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
                                                                window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${msg.coords.lat},${msg.coords.lng}`, '_blank');
                                                            }}
                                                            className={`flex items-center gap-2 w-full rounded-xl text-xs font-bold transition-all active:scale-95 ${isMe ? 'bg-white text-red-600 border-none' : 'bg-red-600 text-white'}`}
                                                        >
                                                            <Navigation size={12} />
                                                            Open Navigation
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                )}
                                                
                                                {/* Ambient Background Glow for My Messages */}
                                                {isMe && (
                                                    <div className="absolute -top-10 -right-10 h-20 w-20 bg-white/10 blur-2xl rounded-full" />
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </main>

            {/* Input Area */}
            <footer className="flex-none border-t border-slate-200/60 bg-white/80 p-4 backdrop-blur-xl md:rounded-b-3xl md:mb-4 md:mx-4 md:shadow-lg">
                <div className="mx-auto flex max-w-2xl gap-3">
                    <motion.button
                        whileHover={!isSharingLocation ? { scale: 1.05 } : {}}
                        whileTap={!isSharingLocation ? { scale: 0.95 } : {}}
                        onClick={handleShareLocation}
                        disabled={isSharingLocation}
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors shadow-sm ${isSharingLocation ? 'bg-red-50 text-red-500 cursor-not-allowed' : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
                        title="Share Location"
                    >
                        {isSharingLocation ? <Loader2 size={22} className="animate-spin" /> : <MapPin size={22} />}
                    </motion.button>
                    
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Coordinate help here..."
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 pr-14 text-sm text-slate-900 outline-none transition-all focus:border-red-400 focus:bg-white focus:shadow-md focus:shadow-red-500/5"
                        />
                        <div className="absolute right-1 top-1 bottom-1 p-1">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSend()}
                                disabled={!newMessage.trim() || isSending}
                                className={`flex h-full aspect-square items-center justify-center rounded-xl transition-all ${(newMessage.trim() && !isSending) ? 'bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-500' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
