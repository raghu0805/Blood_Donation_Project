import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Bell, AlertTriangle, CheckCircle, Users, MapPin, MessageCircle,
    Clock, ArrowLeft, Trash2, RotateCcw, Filter, BellOff, X
} from "lucide-react";
import useNotifications from "../hooks/useNotifications";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
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

// Filter tabs configuration
const FILTER_TABS = [
    { key: 'all', label: 'All' },
    { key: 'new_request', label: 'Requests' },
    { key: 'donor_accepted', label: 'Accepted' },
    { key: 'fulfilled', label: 'Fulfilled' },
    { key: 'emergency', label: 'Emergency' },
    { key: 'completed', label: 'Completed' },
];

export default function NotificationsPage() {
    const navigate = useNavigate();
    const {
        allNotifications,
        visibleNotifs,
        dismissedNotifs,
        readIds,
        dismissedIds,
        markAsRead,
        markAllRead,
        dismissNotif,
        clearAll,
        restoreNotif,
        restoreAll,
        unreadCount
    } = useNotifications();

    const [activeTab, setActiveTab] = useState('active');     // 'active' | 'cleared' | 'all'
    const [filterType, setFilterType] = useState('all');       // Filter by notification type

    // Determine which notifications to display based on tab
    const getDisplayNotifications = () => {
        let list;
        switch (activeTab) {
            case 'cleared':
                list = dismissedNotifs;
                break;
            case 'all':
                list = allNotifications;
                break;
            case 'active':
            default:
                list = visibleNotifs;
                break;
        }

        // Apply type filter
        if (filterType !== 'all') {
            list = list.filter(n => n.type === filterType);
        }

        return list;
    };

    const displayNotifs = getDisplayNotifications();

    // Group notifications by time period
    const groupByTime = (notifs) => {
        const now = Date.now();
        const groups = {
            today: [],
            yesterday: [],
            thisWeek: [],
            older: []
        };

        notifs.forEach(n => {
            const ts = (n.timestamp || 0) * 1000;
            const diff = now - ts;
            const dayMs = 24 * 60 * 60 * 1000;

            if (diff < dayMs) {
                groups.today.push(n);
            } else if (diff < 2 * dayMs) {
                groups.yesterday.push(n);
            } else if (diff < 7 * dayMs) {
                groups.thisWeek.push(n);
            } else {
                groups.older.push(n);
            }
        });

        return groups;
    };

    const groups = groupByTime(displayNotifs);

    const renderNotifCard = (notif, idx) => {
        const Icon = iconMap[notif.iconType] || AlertTriangle;
        const isRead = readIds.includes(notif.id);
        const isDismissed = dismissedIds.includes(notif.id);

        return (
            <motion.div
                key={notif.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={idx}
                className={`flex items-start gap-4 px-5 py-4 rounded-2xl transition-all cursor-pointer group ${
                    isDismissed
                        ? 'opacity-60 bg-slate-50/50'
                        : isRead
                            ? 'bg-white hover:bg-slate-50/80'
                            : 'bg-white hover:bg-red-50/30'
                }`}
                style={{
                    border: isDismissed
                        ? '1px solid rgba(148,163,184,0.1)'
                        : isRead
                            ? '1px solid rgba(148,163,184,0.12)'
                            : '1px solid rgba(220,38,38,0.12)',
                    borderLeft: isDismissed
                        ? '1px solid rgba(148,163,184,0.1)'
                        : isRead
                            ? '1px solid rgba(148,163,184,0.12)'
                            : '4px solid #dc2626',
                    boxShadow: isDismissed
                        ? 'none'
                        : '0 1px 3px rgba(0,0,0,0.04)'
                }}
                onClick={() => {
                    if (!isDismissed) {
                        markAsRead(notif.id);
                        navigate(notif.actionPath);
                    }
                }}
            >
                {/* Icon */}
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isDismissed ? 'opacity-40' : isRead ? 'opacity-60' : ''}`}
                    style={{ background: notif.iconBg }}
                >
                    <Icon size={18} style={{ color: notif.iconColor }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${
                        isDismissed ? 'font-normal text-slate-400 line-through'
                            : isRead ? 'font-medium text-gray-600'
                                : 'font-semibold text-gray-900'
                    }`}>
                        {notif.title}
                    </p>
                    <p className={`text-xs mt-1 ${isDismissed ? 'text-slate-300' : 'text-slate-400'}`}>
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
                                    : notif.type === 'fulfilled' ? 'bg-emerald-50 text-emerald-600'
                                        : notif.type === 'emergency' ? 'bg-red-50 text-red-600'
                                            : notif.type === 'completed' ? 'bg-purple-50 text-purple-600'
                                                : 'bg-slate-50 text-slate-500'
                        }`}>
                            {notif.type === 'new_request' ? 'Request'
                                : notif.type === 'donor_accepted' ? 'Accepted'
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
                    {isDismissed ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); restoreNotif(notif.id); }}
                            className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                            title="Restore"
                        >
                            <RotateCcw size={14} className="text-green-500" />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); dismissNotif(notif.id); }}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                            title="Dismiss"
                        >
                            <X size={14} className="text-slate-400 hover:text-red-500" />
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    const renderGroup = (title, notifs, startIdx = 0) => {
        if (notifs.length === 0) return null;
        return (
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-3 px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                    <span className="text-[10px] text-slate-300 font-medium">{notifs.length} notification{notifs.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col gap-2">
                    {notifs.map((n, i) => renderNotifCard(n, startIdx + i))}
                </div>
            </div>
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
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} · {allNotifications.length} total
                                </p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* View Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex items-center gap-1 p-1 rounded-2xl mb-4"
                    style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(148,163,184,0.12)", backdropFilter: "blur(8px)" }}
                >
                    {[
                        { key: 'active', label: 'Active', count: visibleNotifs.length },
                        { key: 'cleared', label: 'Cleared', count: dismissedNotifs.length },
                        { key: 'all', label: 'All History', count: allNotifications.length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                activeTab === tab.key
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                                    activeTab === tab.key ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </motion.div>

                {/* Type Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar"
                >
                    <Filter size={12} className="text-slate-300 shrink-0" />
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterType(tab.key)}
                            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                                filterType === tab.key
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'bg-white text-slate-500 hover:text-red-600 border border-slate-100 hover:border-red-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* Bulk action for cleared tab */}
                {activeTab === 'cleared' && dismissedNotifs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between mb-4 px-4 py-3 rounded-2xl bg-green-50/50 border border-green-100"
                    >
                        <span className="text-xs text-green-700 font-medium">
                            {dismissedNotifs.length} cleared notification{dismissedNotifs.length > 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={restoreAll}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-green-600 hover:text-green-700 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
                        >
                            <RotateCcw size={12} /> Restore all
                        </button>
                    </motion.div>
                )}

                {activeTab === 'active' && visibleNotifs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-end mb-4"
                    >
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-red-500 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={11} /> Clear all
                        </button>
                    </motion.div>
                )}

                {/* Notification List */}
                {displayNotifs.length === 0 ? (
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
                                {activeTab === 'cleared'
                                    ? 'No cleared notifications'
                                    : activeTab === 'all'
                                        ? 'No notifications yet'
                                        : 'You\'re all caught up!'}
                            </p>
                            <p className="text-xs text-slate-300 mt-1">
                                {activeTab === 'cleared'
                                    ? 'Cleared notifications will appear here'
                                    : activeTab === 'all'
                                        ? 'Notifications from requests and donors will show here'
                                        : 'New blood requests and donor responses will appear here'}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <div>
                        {renderGroup('Today', groups.today, 0)}
                        {renderGroup('Yesterday', groups.yesterday, groups.today.length)}
                        {renderGroup('This Week', groups.thisWeek, groups.today.length + groups.yesterday.length)}
                        {renderGroup('Older', groups.older, groups.today.length + groups.yesterday.length + groups.thisWeek.length)}
                    </div>
                )}

            </div>
        </div>
    );
}
