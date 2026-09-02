import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Bell, AlertTriangle, CheckCircle, Users, MapPin, MessageCircle,
    Clock, ArrowLeft, Trash2, RotateCcw, BellOff, X
} from "lucide-react";
import useNotifications from "../hooks/useNotifications";

const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
    }),
};

// Icon resolver — maps iconType strings from hook to actual Lucide icons
const iconMap = {
    alert: AlertTriangle,
    check: CheckCircle,
    users: Users,
    mappin: MapPin,
    message: MessageCircle
};

export default function NotificationsPage() {
    const navigate = useNavigate();
    const {
        visibleNotifs,
        readIds,
        dismissedIds,
        markAsRead,
        markAllRead,
        dismissNotif,
        clearAll,
        unreadCount
    } = useNotifications();

    const renderNotifCard = (notif, idx) => {
        const Icon = iconMap[notif.iconType] || AlertTriangle;
        const isRead = readIds.includes(notif.id);

        return (
            <motion.div
                key={notif.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={idx}
                className={`flex items-start gap-4 px-5 py-4 rounded-2xl transition-all cursor-pointer group ${
                    isRead
                        ? 'bg-white hover:bg-slate-50/80 border-slate-200/60'
                        : 'bg-white hover:bg-red-50/30 border-red-200/80'
                }`}
                style={{
                    border: isRead ? '1px solid rgba(148,163,184,0.15)' : '1px solid rgba(220,38,38,0.15)',
                    borderLeft: isRead ? '1px solid rgba(148,163,184,0.15)' : '4px solid #dc2626',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
                onClick={() => {
                    markAsRead(notif.id);
                    if (notif.actionPath) navigate(notif.actionPath);
                }}
            >
                {/* Icon */}
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isRead ? 'opacity-60' : ''}`}
                    style={{ background: notif.iconBg }}
                >
                    <Icon size={18} style={{ color: notif.iconColor }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${isRead ? 'font-medium text-gray-600' : 'font-semibold text-gray-900'}`}>
                        {notif.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {notif.subtitle}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                            <Clock size={11} className="text-slate-300" />
                            <span className="text-[11px] text-slate-300">{notif.time}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            notif.type === 'new_request' ? 'bg-orange-50 text-orange-600'
                                : notif.type === 'donor_accepted' ? 'bg-green-50 text-green-600'
                                    : notif.type === 'donor_withdrawn' ? 'bg-amber-50 text-amber-700'
                                        : notif.type === 'chat_message' ? 'bg-blue-50 text-blue-600'
                                            : notif.type === 'fulfilled' ? 'bg-emerald-50 text-emerald-600'
                                                : notif.type === 'emergency' ? 'bg-red-50 text-red-600'
                                                    : notif.type === 'completed' ? 'bg-purple-50 text-purple-600'
                                                        : 'bg-slate-50 text-slate-500'
                        }`}>
                            {notif.type === 'new_request' ? 'Request'
                                : notif.type === 'donor_accepted' ? 'Accepted'
                                    : notif.type === 'donor_withdrawn' ? 'Withdrawn'
                                        : notif.type === 'chat_message' ? 'Message'
                                            : notif.type === 'fulfilled' ? 'Fulfilled'
                                                : notif.type === 'emergency' ? 'Emergency'
                                                    : notif.type === 'completed' ? 'Completed'
                                                        : notif.type === 'pickup' ? 'Pickup'
                                                            : notif.type}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); dismissNotif(notif.id); }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                        title="Dismiss"
                    >
                        <X size={14} className="text-slate-400 hover:text-red-500" />
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: "linear-gradient(135deg, #fef2f2 0%, #fff7ed 30%, #f8fafc 100%)" }}>
            <div className="mx-auto max-w-2xl px-4 sm:px-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors mb-4 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back
                    </button>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 12px rgba(220,38,38,0.25)" }}>
                                <Bell size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} · {visibleNotifs.length} total
                                </p>
                            </div>
                        </div>

                        {/* Header Actions */}
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                            {visibleNotifs.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={12} /> Clear all
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Common Single Notifications List */}
                {visibleNotifs.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 gap-4"
                    >
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: "rgba(148,163,184,0.06)" }}>
                            <BellOff size={36} className="text-slate-200" />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-semibold text-slate-400">
                                You're all caught up!
                            </p>
                            <p className="text-xs text-slate-300 mt-1">
                                New blood requests, donor responses, and messages will appear here
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {visibleNotifs.map((n, i) => renderNotifCard(n, i))}
                    </div>
                )}

            </div>
        </div>
    );
}
