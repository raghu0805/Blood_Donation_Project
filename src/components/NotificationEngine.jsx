import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Bell, CheckCircle, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';

/**
 * NotificationEngine — Real-Time In-App Message Engine
 * 
 * Automatically monitors live notifications from useNotifications hook.
 * On first mount, marks existing notifications as seen to prevent historical toast spam.
 * On real-time updates, triggers formal toast alerts with quick action navigation for:
 *   1. New blood requests matching a donor's blood group
 *   2. Donor accepting a patient's request
 *   3. Donor withdrawing from a patient's request
 */
export default function NotificationEngine() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { activeNotifications, seenToastIds, markToastSeen } = useNotifications();
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (!currentUser) return;
        if (!activeNotifications || activeNotifications.length === 0) {
            isInitialMount.current = false;
            return;
        }

        // On first mount with loaded notifications, register existing IDs as seen
        if (isInitialMount.current) {
            activeNotifications.forEach(n => {
                if (!seenToastIds.includes(n.id)) {
                    markToastSeen(n.id);
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

                // Render custom formal toast
                toast.custom((t) => (
                    <div
                        className={`${
                            t.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-md w-full bg-white/95 backdrop-blur-md shadow-xl rounded-2xl pointer-events-auto flex flex-col p-4 border border-slate-200/80 hover:shadow-2xl transition-all cursor-pointer`}
                        style={{ borderLeft: `4px solid ${accentColor}` }}
                        onClick={() => {
                            toast.dismiss(t.id);
                            if (n.actionPath) navigate(n.actionPath);
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style={{ background: `${accentColor}15` }}
                            >
                                <IconComponent size={18} style={{ color: accentColor }} />
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
                                <div className="flex items-center gap-1 mt-2 text-xs font-bold text-red-600 hover:text-red-700">
                                    <span>View in App</span>
                                    <ArrowRight size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                ), { duration: 6000, id: `toast_${n.id}` });
            }
        });
    }, [activeNotifications, seenToastIds, markToastSeen, currentUser, navigate]);

    return null;
}
