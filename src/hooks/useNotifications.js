import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMCP } from '../contexts/MCPContext';
import { canDonate } from '../lib/utils';

/**
 * useNotifications — Centralized notification builder and state manager.
 * 
 * Provides:
 *   - allNotifications: Every possible notification (including stale/completed) for the full history page
 *   - activeNotifications: Filtered for the bell dropdown (time-bound, role-aware)
 *   - visibleNotifs: activeNotifications minus dismissed
 *   - unreadCount: Count of unread visible notifications
 *   - readIds, dismissedIds: State
 *   - markAsRead, markAllRead, dismissNotif, clearAll, restoreNotif: Actions
 */
export default function useNotifications() {
    const { currentUser, userRole } = useAuth();
    const { activeRequests, myRequests } = useMCP();

    const [dismissedIds, setDismissedIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('lifelink_dismissed_notifs') || '[]'); } catch { return []; }
    });
    const [readIds, setReadIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('lifelink_read_notifs') || '[]'); } catch { return []; }
    });

    // Build ALL notifications from live Firestore data
    const { allNotifications, activeNotifications } = useMemo(() => {
        const all = [];
        const now = Date.now();
        const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

        if (!currentUser) return { allNotifications: [], activeNotifications: [] };

        const myBlood = currentUser?.bloodGroup;

        // === DONOR NOTIFICATIONS: Matching blood requests ===
        if (myBlood && activeRequests) {
            activeRequests.forEach(req => {
                if (req.patientId === currentUser.uid) return;
                const confirmed = req.confirmedDonors || [];
                const reserve = req.reserveDonors || [];
                if (confirmed.some(d => d.donorId === currentUser.uid)) return;
                if (reserve.some(d => d.donorId === currentUser.uid)) return;
                if (req.donorId === currentUser.uid) return;
                if (!canDonate(myBlood, req.bloodGroup)) return;

                const createdAtMs = req.createdAt?.seconds ? req.createdAt.seconds * 1000 : 0;
                const isStale = createdAtMs > 0 && (now - createdAtMs) > STALE_THRESHOLD_MS;
                const isClosed = ['fulfilled', 'closed', 'completed'].includes(req.status);

                all.push({
                    id: `req_${req.id}`,
                    type: 'new_request',
                    iconType: 'alert',
                    iconColor: req.urgency === 'Emergency' ? '#dc2626' : req.urgency === 'Urgent' ? '#d97706' : '#64748b',
                    iconBg: req.urgency === 'Emergency' ? 'rgba(220,38,38,0.08)' : req.urgency === 'Urgent' ? 'rgba(245,158,11,0.08)' : 'rgba(148,163,184,0.08)',
                    title: `${req.urgency}: ${req.bloodGroup} blood needed`,
                    subtitle: `${req.patientName} · ${req.hospitalName || req.hospital || 'Nearby'} · ${req.unitsRequired || 1} unit${(req.unitsRequired || 1) > 1 ? 's' : ''}`,
                    time: createdAtMs ? getTimeAgo(createdAtMs) : 'Just now',
                    timestamp: req.createdAt?.seconds || 0,
                    actionPath: '/donor-dashboard',
                    actionLabel: 'View',
                    category: 'donor',
                    isStale,
                    isClosed,
                    requestId: req.id
                });
            });
        }

        // === PATIENT NOTIFICATIONS: Responses to my requests ===
        if (myRequests) {
            myRequests.forEach(req => {
                if (req.patientId !== currentUser.uid) return;

                const confirmed = req.confirmedDonors || [];
                const unitsReq = req.unitsRequired || 1;
                const isClosed = ['completed', 'closed'].includes(req.status);

                // Each confirmed donor
                confirmed.forEach(donor => {
                    all.push({
                        id: `accepted_${req.id}_${donor.donorId}`,
                        type: 'donor_accepted',
                        iconType: 'check',
                        iconColor: '#16a34a',
                        iconBg: 'rgba(34,197,94,0.08)',
                        title: `${donor.donorName || 'A donor'} accepted your request`,
                        subtitle: `${req.bloodGroup} · ${confirmed.length}/${unitsReq} confirmed`,
                        time: donor.acceptedAt ? getTimeAgo(new Date(donor.acceptedAt).getTime()) : 'Recently',
                        timestamp: donor.acceptedAt ? new Date(donor.acceptedAt).getTime() / 1000 : 0,
                        actionPath: `/chat/${req.id}`,
                        actionLabel: 'Chat',
                        category: 'patient',
                        isStale: false,
                        isClosed,
                        requestId: req.id
                    });
                });

                // Fulfilled
                if (req.status === 'fulfilled') {
                    all.push({
                        id: `fulfilled_${req.id}`,
                        type: 'fulfilled',
                        iconType: 'users',
                        iconColor: '#16a34a',
                        iconBg: 'rgba(34,197,94,0.08)',
                        title: `All ${unitsReq} donor slots filled!`,
                        subtitle: `${req.bloodGroup} request fully matched`,
                        time: req.updatedAt?.seconds ? getTimeAgo(req.updatedAt.seconds * 1000) : 'Now',
                        timestamp: req.updatedAt?.seconds || 0,
                        actionPath: '/patient-dashboard',
                        actionLabel: 'View',
                        category: 'patient',
                        isStale: false,
                        isClosed: false,
                        requestId: req.id
                    });
                }

                // Emergency escalation
                if (req.emergencyEscalation) {
                    all.push({
                        id: `emergency_${req.id}`,
                        type: 'emergency',
                        iconType: 'alert',
                        iconColor: '#dc2626',
                        iconBg: 'rgba(220,38,38,0.08)',
                        title: `⚠ Donors needed for ${req.bloodGroup} request`,
                        subtitle: `${confirmed.length}/${unitsReq} confirmed · No reserves left`,
                        time: 'Now',
                        timestamp: Date.now() / 1000,
                        actionPath: '/patient-dashboard',
                        actionLabel: 'View',
                        category: 'patient',
                        isStale: false,
                        isClosed: false,
                        requestId: req.id
                    });
                }

                // Ready for pickup
                if (req.status === 'ready_for_pickup' && req.pickupCode) {
                    all.push({
                        id: `pickup_${req.id}`,
                        type: 'pickup',
                        iconType: 'mappin',
                        iconColor: '#9333ea',
                        iconBg: 'rgba(147,51,234,0.08)',
                        title: `Blood reserved — ready for pickup`,
                        subtitle: `Code: ${req.pickupCode}`,
                        time: req.updatedAt?.seconds ? getTimeAgo(req.updatedAt.seconds * 1000) : 'Now',
                        timestamp: req.updatedAt?.seconds || 0,
                        actionPath: `/chat/${req.id}`,
                        actionLabel: 'Details',
                        category: 'patient',
                        isStale: false,
                        isClosed: false,
                        requestId: req.id
                    });
                }

                // Completed request
                if (req.status === 'completed') {
                    all.push({
                        id: `completed_${req.id}`,
                        type: 'completed',
                        iconType: 'check',
                        iconColor: '#7c3aed',
                        iconBg: 'rgba(124,58,237,0.08)',
                        title: `Request completed successfully`,
                        subtitle: `${req.bloodGroup} · ${unitsReq} unit${unitsReq > 1 ? 's' : ''} fulfilled`,
                        time: req.completedAt?.seconds ? getTimeAgo(req.completedAt.seconds * 1000) : req.updatedAt?.seconds ? getTimeAgo(req.updatedAt.seconds * 1000) : 'Done',
                        timestamp: req.completedAt?.seconds || req.updatedAt?.seconds || 0,
                        actionPath: '/patient-dashboard',
                        actionLabel: 'View',
                        category: 'patient',
                        isStale: false,
                        isClosed: true,
                        requestId: req.id
                    });
                }
            });
        }

        // Sort by most recent
        all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Active = non-stale, non-closed, role-appropriate
        const active = all.filter(n => {
            if (n.isStale) return false;
            if (n.isClosed && n.type !== 'completed') return false;
            if (n.category === 'donor' && userRole === 'patient') return false;
            return true;
        });

        return { allNotifications: all, activeNotifications: active };
    }, [currentUser, userRole, activeRequests, myRequests]);

    // Visible = active minus dismissed
    const visibleNotifs = activeNotifications.filter(n => !dismissedIds.includes(n.id));
    const unreadCount = visibleNotifs.filter(n => !readIds.includes(n.id)).length;

    // Dismissed notifications for history
    const dismissedNotifs = allNotifications.filter(n => dismissedIds.includes(n.id));

    const markAsRead = useCallback((id) => {
        setReadIds(prev => {
            if (prev.includes(id)) return prev;
            const updated = [...prev, id];
            localStorage.setItem('lifelink_read_notifs', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const markAllRead = useCallback(() => {
        setReadIds(prev => {
            const allIds = visibleNotifs.map(n => n.id);
            const updated = [...new Set([...prev, ...allIds])];
            localStorage.setItem('lifelink_read_notifs', JSON.stringify(updated));
            return updated;
        });
    }, [visibleNotifs]);

    const dismissNotif = useCallback((id) => {
        setDismissedIds(prev => {
            const updated = [...prev, id];
            localStorage.setItem('lifelink_dismissed_notifs', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearAll = useCallback(() => {
        const allIds = activeNotifications.map(n => n.id);
        setDismissedIds(allIds);
        localStorage.setItem('lifelink_dismissed_notifs', JSON.stringify(allIds));
    }, [activeNotifications]);

    const restoreNotif = useCallback((id) => {
        setDismissedIds(prev => {
            const updated = prev.filter(d => d !== id);
            localStorage.setItem('lifelink_dismissed_notifs', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const restoreAll = useCallback(() => {
        setDismissedIds([]);
        localStorage.setItem('lifelink_dismissed_notifs', JSON.stringify([]));
    }, []);

    return {
        allNotifications,
        activeNotifications,
        visibleNotifs,
        dismissedNotifs,
        unreadCount,
        readIds,
        dismissedIds,
        markAsRead,
        markAllRead,
        dismissNotif,
        clearAll,
        restoreNotif,
        restoreAll
    };
}

// Helper: human-readable time ago
function getTimeAgo(timestampMs) {
    const seconds = Math.floor((Date.now() - timestampMs) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestampMs).toLocaleDateString();
}
