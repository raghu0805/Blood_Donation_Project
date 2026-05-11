import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Droplets, Heart, Bell, Menu, X, LogOut, Info, MapPin, Users, Clock, CheckCircle, AlertTriangle, MessageCircle } from "lucide-react";
import logo from '../assets/app logo.png';
import pecLogo from '../assets/pec logo.png';
import yrcLogo from '../assets/yrc logo.png';
import { useAuth } from '../contexts/AuthContext';
import { useMCP } from '../contexts/MCPContext';
import { canDonate } from '../lib/utils';
import UserAvatar from './UserAvatar';

export default function LandingNavbar({ activePath = "" }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lifelink_dismissed_notifs') || '[]'); } catch { return []; }
  });
  const notifRef = useRef(null);
  const { currentUser, logout, userRole, assignRole, setIsRoleSwitching } = useAuth();
  const { activeRequests, myRequests } = useMCP();

  const showUser = !!currentUser;
  const userName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : "User");

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Build notifications from live data
  const notifications = [];

  if (currentUser) {
    // === DONOR NOTIFICATIONS: New matching requests ===
    const myBlood = currentUser?.bloodGroup;
    if (myBlood && activeRequests) {
      activeRequests.forEach(req => {
        // Skip own requests
        if (req.patientId === currentUser.uid) return;
        // Skip if already accepted by me
        const confirmed = req.confirmedDonors || [];
        const reserve = req.reserveDonors || [];
        if (confirmed.some(d => d.donorId === currentUser.uid)) return;
        if (reserve.some(d => d.donorId === currentUser.uid)) return;
        if (req.donorId === currentUser.uid) return;
        // Skip fulfilled
        if (['fulfilled', 'closed', 'completed'].includes(req.status)) return;
        // Check blood compatibility
        if (!canDonate(myBlood, req.bloodGroup)) return;

        const timeAgo = req.createdAt?.seconds
          ? getTimeAgo(req.createdAt.seconds * 1000)
          : 'Just now';

        notifications.push({
          id: `req_${req.id}`,
          type: 'new_request',
          icon: AlertTriangle,
          iconColor: req.urgency === 'Emergency' ? '#dc2626' : req.urgency === 'Urgent' ? '#d97706' : '#64748b',
          iconBg: req.urgency === 'Emergency' ? 'rgba(220,38,38,0.08)' : req.urgency === 'Urgent' ? 'rgba(245,158,11,0.08)' : 'rgba(148,163,184,0.08)',
          title: `${req.urgency}: ${req.bloodGroup} blood needed`,
          subtitle: `${req.patientName} · ${req.hospital || req.hospitalName || 'Nearby'} · ${req.unitsRequired || 1} unit${(req.unitsRequired || 1) > 1 ? 's' : ''}`,
          time: timeAgo,
          action: () => { navigate('/donor-dashboard'); setNotifOpen(false); },
          actionLabel: 'View',
          timestamp: req.createdAt?.seconds || 0
        });
      });
    }

    // === PATIENT NOTIFICATIONS: Donors accepted my request ===
    if (myRequests) {
      myRequests.forEach(req => {
        if (req.patientId !== currentUser.uid) return;

        const confirmed = req.confirmedDonors || [];
        const unitsReq = req.unitsRequired || 1;

        // Notification for each confirmed donor
        confirmed.forEach(donor => {
          notifications.push({
            id: `accepted_${req.id}_${donor.donorId}`,
            type: 'donor_accepted',
            icon: CheckCircle,
            iconColor: '#16a34a',
            iconBg: 'rgba(34,197,94,0.08)',
            title: `${donor.donorName || 'A donor'} accepted your request`,
            subtitle: `${req.bloodGroup} · ${confirmed.length}/${unitsReq} confirmed`,
            time: donor.acceptedAt ? getTimeAgo(new Date(donor.acceptedAt).getTime()) : 'Recently',
            action: () => { navigate(`/chat/${req.id}`); setNotifOpen(false); },
            actionLabel: 'Chat',
            timestamp: donor.acceptedAt ? new Date(donor.acceptedAt).getTime() / 1000 : 0
          });
        });

        // Notification when request is fulfilled
        if (req.status === 'fulfilled') {
          notifications.push({
            id: `fulfilled_${req.id}`,
            type: 'fulfilled',
            icon: Users,
            iconColor: '#16a34a',
            iconBg: 'rgba(34,197,94,0.08)',
            title: `All ${unitsReq} donor slots filled!`,
            subtitle: `${req.bloodGroup} request fully matched`,
            time: req.updatedAt?.seconds ? getTimeAgo(req.updatedAt.seconds * 1000) : 'Now',
            action: () => { navigate('/patient-dashboard'); setNotifOpen(false); },
            actionLabel: 'View',
            timestamp: req.updatedAt?.seconds || 0
          });
        }

        // Emergency escalation
        if (req.emergencyEscalation) {
          notifications.push({
            id: `emergency_${req.id}`,
            type: 'emergency',
            icon: AlertTriangle,
            iconColor: '#dc2626',
            iconBg: 'rgba(220,38,38,0.08)',
            title: `⚠ Donors needed for ${req.bloodGroup} request`,
            subtitle: `${confirmed.length}/${unitsReq} confirmed · No reserves left`,
            time: 'Now',
            action: () => { navigate('/patient-dashboard'); setNotifOpen(false); },
            actionLabel: 'View',
            timestamp: Date.now() / 1000
          });
        }

        // Ready for pickup
        if (req.status === 'ready_for_pickup' && req.pickupCode) {
          notifications.push({
            id: `pickup_${req.id}`,
            type: 'pickup',
            icon: MapPin,
            iconColor: '#9333ea',
            iconBg: 'rgba(147,51,234,0.08)',
            title: `Blood reserved — ready for pickup`,
            subtitle: `Code: ${req.pickupCode}`,
            time: req.updatedAt?.seconds ? getTimeAgo(req.updatedAt.seconds * 1000) : 'Now',
            action: () => { navigate(`/chat/${req.id}`); setNotifOpen(false); },
            actionLabel: 'Details',
            timestamp: req.updatedAt?.seconds || 0
          });
        }
      });
    }
  }

  // Sort by most recent first
  notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Filter out dismissed
  const visibleNotifs = notifications.filter(n => !dismissedIds.includes(n.id));
  const notifCount = visibleNotifs.length;

  const dismissNotif = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('lifelink_dismissed_notifs', JSON.stringify(updated));
  };

  const clearAll = () => {
    const allIds = notifications.map(n => n.id);
    setDismissedIds(allIds);
    localStorage.setItem('lifelink_dismissed_notifs', JSON.stringify(allIds));
  };

  const handleLogout = async () => {
      await logout();
      navigate('/');
  };

  const handleRoleSwitch = async (role) => {
      if (role === userRole) {
          if (role === 'donor') navigate('/donor-dashboard');
          else navigate('/patient-dashboard');
          return;
      }
      setIsRoleSwitching(true);
      try {
          await assignRole(role);
          if (role === 'donor') navigate('/donor-dashboard');
          else navigate('/patient-dashboard');
          setTimeout(() => { setIsRoleSwitching(false); }, 500);
      } catch (error) {
          console.error("Role switch failed", error);
          setIsRoleSwitching(false);
      }
  };

  return (
    <>
      <header className="fixed top-0 z-50 w-full" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(220,38,38,0.08)", boxShadow: "0 2px 16px rgba(220,38,38,0.06)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 relative">

          {/* Left: Logos */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="LifeLink" className="h-10 w-auto object-contain cursor-pointer transition-transform hover:scale-105" onClick={() => { navigate("/"); setMenuOpen(false); }} />
            <div className="hidden h-6 w-px bg-slate-200 md:block" />
            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-xl px-2 py-0.5" style={{ background: "#dc2626" }}>
                <img src={pecLogo} alt="PEC" className="h-9 w-auto object-contain" />
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <img src={yrcLogo} alt="YRC" className="h-10 w-auto object-contain" />
            </div>
          </div>

          {/* Center: Nav links (desktop) */}
          {showUser ? (
            <nav className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 lg:flex">
                <button onClick={() => handleRoleSwitch('donor')}
                  className="flex items-center gap-1.5 text-sm font-semibold transition-colors select-none"
                  style={{ color: activePath === "/donor-dashboard" ? "#dc2626" : "#64748b" }}>
                  <Droplets size={14} /> Donate Blood
                </button>
                <button onClick={() => handleRoleSwitch('patient')}
                  className="flex items-center gap-1.5 text-sm font-semibold transition-colors select-none"
                  style={{ color: activePath === "/patient-dashboard" ? "#dc2626" : "#64748b" }}>
                  <Heart size={14} /> Request Blood
                </button>
            </nav>
          ) : (
             null
          )}

          {/* Right */}
          <div className="flex items-center gap-3">
            {showUser ? (
              <>
                {/* Notification Bell */}
                <div className="relative hidden sm:block" ref={notifRef}>
                  <button onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-1.5 rounded-xl hover:bg-red-50 transition-colors">
                    <Bell size={17} className={`transition-colors ${notifOpen ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`} />
                    {notifCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-white">
                        {notifCount > 9 ? '9+' : notifCount}
                      </motion.span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-10 w-80 sm:w-96 rounded-2xl overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(24px)", border: "1px solid rgba(220,38,38,0.1)", boxShadow: "0 16px 48px rgba(0,0,0,0.12)" }}>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                          <div className="flex items-center gap-2">
                            <Bell size={14} className="text-red-500" />
                            <span className="text-sm font-bold text-gray-900">Notifications</span>
                            {notifCount > 0 && (
                              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-600">
                                {notifCount}
                              </span>
                            )}
                          </div>
                          {notifCount > 0 && (
                            <button onClick={clearAll} className="text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors">
                              Clear all
                            </button>
                          )}
                        </div>

                        {/* Notification List */}
                        <div className="max-h-80 overflow-y-auto">
                          {visibleNotifs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(148,163,184,0.08)" }}>
                                <Bell size={20} className="text-slate-300" />
                              </div>
                              <p className="text-sm text-slate-400 font-medium">You're all caught up!</p>
                              <p className="text-xs text-slate-300">No new notifications</p>
                            </div>
                          ) : (
                            visibleNotifs.slice(0, 8).map((notif, idx) => {
                              const Icon = notif.icon;
                              return (
                                <motion.div
                                  key={notif.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.03 }}
                                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                  style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}
                                  onClick={notif.action}>
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
                                    style={{ background: notif.iconBg }}>
                                    <Icon size={16} style={{ color: notif.iconColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-gray-800 leading-tight">{notif.title}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{notif.subtitle}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Clock size={10} className="text-slate-300" />
                                      <span className="text-[10px] text-slate-300">{notif.time}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); dismissNotif(notif.id); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-slate-100 shrink-0 mt-1"
                                    title="Dismiss">
                                    <X size={12} className="text-slate-400" />
                                  </button>
                                </motion.div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer */}
                        {visibleNotifs.length > 0 && (
                          <div className="px-5 py-2.5" style={{ borderTop: "1px solid rgba(148,163,184,0.1)", background: "rgba(248,250,252,0.5)" }}>
                            <button onClick={() => { navigate(userRole === 'donor' ? '/donor-dashboard' : '/patient-dashboard'); setNotifOpen(false); }}
                              className="w-full text-center text-xs font-semibold text-red-500 hover:text-red-600 transition-colors py-1">
                              View all activity →
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 cursor-pointer hover:border-red-300 transition-colors" onClick={() => navigate("/profile")} style={{ background: "rgba(255,255,255,0.8)" }}>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white overflow-hidden">
                    <UserAvatar 
                      photoURL={currentUser?.photoURL} 
                      name={userName} 
                      textClassName="text-[10px]"
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{userName}</span>
                </div>
                <button onClick={handleLogout} className="hidden sm:flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors ml-1" title="Log Out">
                    <LogOut size={16} />
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/auth")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-red-300 hover:text-red-600">
                  Log In
                </motion.button>
                <motion.button whileHover={{ scale: 1.04, boxShadow: "0 6px 20px rgba(220,38,38,0.35)" }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/role-selection")}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 3px 12px rgba(220,38,38,0.25)" }}>
                  Join Now
                </motion.button>
              </div>
            )}

            {/* Hamburger */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl lg:hidden"
              style={{ background: menuOpen ? "rgba(220,38,38,0.08)" : "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.15)" }}>
              {menuOpen ? <X size={18} className="text-red-600" /> : <Menu size={18} className="text-slate-600" />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[70px] left-0 right-0 z-40 mx-4 rounded-3xl p-4 lg:hidden overflow-hidden"
            style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(24px)", border: "1px solid rgba(220,38,38,0.1)", boxShadow: "0 16px 48px rgba(220,38,38,0.1)" }}>

            {/* College logos */}
            <div className="mb-4 flex items-center justify-center gap-4 pb-4 md:hidden" style={{ borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
              <div className="rounded-xl px-1.5 py-0.5" style={{ background: "#dc2626" }}>
                <img src={pecLogo} alt="PEC" className="h-10 w-auto object-contain" />
              </div>
              <div className="h-5 w-px bg-slate-200" />
              <img src={yrcLogo} alt="YRC" className="h-10 w-auto object-contain" />
            </div>

            {/* Nav links */}
            <div className="flex flex-col gap-1 mb-4">
              {showUser ? (
                  <>
                    <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0 * 0.06 }}
                        onClick={() => { handleRoleSwitch('donor'); setMenuOpen(false); }}
                        className="flex items-center w-full gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors"
                        style={{ color: activePath === "/donor-dashboard" ? "#dc2626" : "#64748b", background: activePath === "/donor-dashboard" ? "rgba(220,38,38,0.06)" : "transparent" }}>
                        <Droplets size={16} /> Donate Blood
                    </motion.button>
                    <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 * 0.06 }}
                        onClick={() => { handleRoleSwitch('patient'); setMenuOpen(false); }}
                        className="flex items-center w-full gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors"
                        style={{ color: activePath === "/patient-dashboard" ? "#dc2626" : "#64748b", background: activePath === "/patient-dashboard" ? "rgba(220,38,38,0.06)" : "transparent" }}>
                        <Heart size={16} /> Request Blood
                    </motion.button>
                  </>
              ) : null}
            </div>

            {/* Mobile Notifications */}
            {showUser && notifCount > 0 && (
              <div className="mb-4 rounded-2xl p-3" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.1)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Bell size={13} className="text-red-500" />
                  <span className="text-xs font-bold text-gray-700">Notifications</span>
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-100 px-1 text-[9px] font-bold text-red-600">{notifCount}</span>
                </div>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {visibleNotifs.slice(0, 4).map(notif => {
                    const Icon = notif.icon;
                    return (
                      <div key={notif.id} onClick={() => { notif.action(); setMenuOpen(false); }}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                        style={{ border: "1px solid rgba(148,163,184,0.1)" }}>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: notif.iconBg }}>
                          <Icon size={13} style={{ color: notif.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-gray-800 truncate">{notif.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{notif.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User / Auth */}
            {showUser ? (
              <div className="flex flex-col gap-2 sm:hidden">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors" onClick={() => { navigate("/profile"); setMenuOpen(false); }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white overflow-hidden">
                        <UserAvatar 
                          photoURL={currentUser?.photoURL} 
                          name={userName} 
                          textClassName="text-xs"
                        />
                    </div>
                    <div>
                    <p className="text-sm font-bold text-gray-900">{userName}</p>
                    <p className="text-xs text-slate-400">View Profile</p>
                    </div>
                  </div>
                  <motion.button onClick={() => { handleLogout(); setMenuOpen(false); }} whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3 text-sm font-semibold text-red-600 transition-colors mt-2">
                    <LogOut size={16} /> Log Out
                  </motion.button>
              </div>
            ) : (
              <div className="flex gap-2 sm:hidden">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { navigate("/auth"); setMenuOpen(false); }}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-gray-600">
                  Log In
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { navigate("/role-selection"); setMenuOpen(false); }}
                  className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}>
                  Join Now
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
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
