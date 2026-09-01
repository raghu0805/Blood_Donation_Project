import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, Users, ArrowRight, MessageCircle, X } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';

/**
 * NotificationEngine — Real-Time In-App Message Engine
 * 
 * Monitors live notifications and triggers interactive swipeable toast alerts.
 * Features:
 *   - Instant event detection for requests, acceptances, withdrawals, and messages
 *   - Swipe-to-dismiss gesture (drag left or right to skip)
 *   - 5-Second Auto-Dismiss timer with smooth slide-out
 */
export default function NotificationEngine() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { activeNotifications, seenToastIds, markToastSeen } = useNotifications();
    const isInitialMount = useRef(true);
    const bootTimeRef = useRef(Date.now() / 1000);

    useEffect(() => {
        if (!currentUser) return;
        if (!activeNotifications || activeNotifications.length === 0) {
            isInitialMount.current = false;
            return;
        }

        // On boot, mark notifications created BEFORE app startup as seen
        if (isInitialMount.current) {
            activeNotifications.forEach(n => {
                // If created before boot time (over 30s ago), mark as seen
                const itemTime = n.timestamp || 0;
                if (itemTime < (bootTimeRef.current - 30)) {
                    if (!seenToastIds.includes(n.id)) {
                        markToastSeen(n.id);
                    }
                }
            });
            isInitialMount.current = false;
            return;
        }

        // Process newly arrived notifications in real-time
        activeNotifications.forEach(n => {
            if (!seenToastIds.includes(n.id)) {
                markToastSeen(n.id);

                // Formal Toast Message Builders based on Notification Type
                let toastTitle = "";
                let toastMessage = "";
                let accentColor = "#dc2626";
                let IconComponent = Bell;

                if (n.type === 'new_request') {
                    toastTitle = "Blood Request Alert";
                    toastMessage = `${n.title}. Please check your notification bar to respond.`;
                    accentColor = "#dc2626";
                    IconComponent = AlertTriangle;
                } else if (n.type === 'donor_accepted') {
                    toastTitle = "Donor Acceptance Received";
                    toastMessage = `${n.title}. Go to the Requests section to view details and contact donor.`;
                    accentColor = "#16a34a";
                    IconComponent = CheckCircle;
                } else if (n.type === 'donor_withdrawn') {
                    toastTitle = "Donor Status Update";
                    toastMessage = `${n.title}. Go to the Requests section to review status.`;
                    accentColor = "#d97706";
                    IconComponent = AlertTriangle;
                } else if (n.type === 'chat_message') {
                    toastTitle = "New Message Received";
                    toastMessage = `${n.title}: ${n.subtitle}`;
                    accentColor = "#2563eb";
                    IconComponent = MessageCircle;
                } else if (n.type === 'fulfilled') {
                    toastTitle = "Request Fulfilled";
                    toastMessage = n.title;
                    accentColor = "#16a34a";
                    IconComponent = Users;
                } else {
                    toastTitle = "System Notification";
                    toastMessage = n.title;
                    accentColor = "#2563eb";
                    IconComponent = Bell;
                }

                // Render custom interactive swipeable 5-second toast
                toast.custom((t) => (
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 300 }}
                        dragElastic={0.2}
                        onDragEnd={(e, info) => {
                            if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 400) {
                                toast.dismiss(t.id);
                            }
                        }}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 300, transition: { duration: 0.2 } }}
                        className={`${
                            t.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-md w-full bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-4 border border-slate-200/80 hover:shadow-2xl transition-all cursor-grab active:cursor-grabbing select-none relative group`}
                        style={{ borderLeft: `5px solid ${accentColor}` }}
                        onClick={() => {
                            toast.dismiss(t.id);
                            if (n.actionPath) navigate(n.actionPath);
                        }}
                    >
                        {/* Swipe Hint Indicator */}
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors" />

                        <div className="flex items-start gap-3 pt-1">
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                style={{ background: `${accentColor}15` }}
                            >
                                <IconComponent size={20} style={{ color: accentColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                        {toastTitle}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-medium">Just now</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">
                                    {toastMessage}
                                </p>
                                <div className="flex items-center justify-between mt-2.5">
                                    <div className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700">
                                        <span>View in App</span>
                                        <ArrowRight size={12} />
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium">Swipe → to skip</span>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast.dismiss(t.id);
                                }}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                                title="Dismiss"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </motion.div>
                ), { duration: 5000, id: `toast_${n.id}` });
            }
        });
    }, [activeNotifications, seenToastIds, markToastSeen, currentUser, navigate]);

    return null;
}
