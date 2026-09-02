import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, getDocs, where } from "firebase/firestore";
import { toast } from "react-hot-toast";
import {
  Search, LogOut, RefreshCw, Users, Droplets, Heart, Activity,
  ChevronDown, X, MessageCircle, AlertTriangle, CheckCircle2, MapPin,
  Phone, Mail, Calendar, Weight, User, Eye, UserCheck, ChevronRight
} from "lucide-react";
import logo from "../assets/app logo.png";
import pecLogo from "../assets/pec logo.png";
import yrcLogo from "../assets/yrc logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] } }),
};

const STANDARD_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const normalizeBloodGroup = (bg) => {
  if (!bg || typeof bg !== "string") return "UNSPECIFIED";
  const s = bg.trim().toUpperCase().replace(/\s+/g, "");
  if (!s || s === "PENDING" || s === "NOTLINKED" || s === "N/A" || s === "UNKNOWN" || s === "?") return "UNSPECIFIED";

  if (s.includes("A1B+") || s === "AB+" || s.includes("ABPOS") || s.includes("AB+VE")) return "AB+";
  if (s.includes("A1B-") || s === "AB-" || s.includes("ABNEG") || s.includes("AB-VE")) return "AB-";
  if (s.includes("A1+") || s === "A+" || s.includes("APOS") || s.includes("A+VE")) return "A+";
  if (s.includes("A1-") || s === "A-" || s.includes("ANEG") || s.includes("A-VE")) return "A-";
  if (s === "B+" || s.includes("BPOS") || s.includes("B+VE")) return "B+";
  if (s === "B-" || s.includes("BNEG") || s.includes("B-VE")) return "B-";
  if (s === "O+" || s.includes("OPOS") || s.includes("O+VE") || s.includes("OPOSITIVE")) return "O+";
  if (s === "O-" || s.includes("ONEG") || s.includes("O-VE") || s.includes("ONEGATIVE")) return "O-";
  if (s.includes("OH") || s.includes("BOMBAY")) return "BOMBAY";

  return s;
};

const TABS = ["Registered User Directory", "Donation History", "Blood Distribution"];

const isUserOnline = (user) => {
  if (!user) return false;
  if (user.isOnline === true) return true;
  if (user.lastSeen) {
    const lastSeenTime = new Date(user.lastSeen).getTime();
    const now = Date.now();
    if (now - lastSeenTime < 5 * 60 * 1000) return true;
  }
  return false;
};

const formatTimestamp = (ts) => {
  if (!ts) return "N/A";
  if (typeof ts === "string") return ts;
  try {
    const dateObj = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    if (isNaN(dateObj.getTime())) return "N/A";
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "N/A";
  }
};

function UserDetailsModal({ user, onClose, onReport }) {
  if (!user) return null;
  const userName = user.displayName || user.name || "User";
  const online = isUserOnline(user);
  const mobile = user.whatsappNumber || user.phone || user.mobile || "N/A";
  const whatsapp = user.whatsappNumber || user.phone || user.mobile || "";
  const bg = normalizeBloodGroup(user.bloodGroup);
  const locationStr = typeof user.location === "object"
    ? user.location?.address || `${user.location?.city || ""}, ${user.location?.state || ""}`
    : (user.location || "N/A");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-amber-500 px-6 py-4 text-white rounded-t-3xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">User Profile</p>
            <h2 className="text-lg font-black">{userName}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-white/20 transition cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white" style={{ background: "linear-gradient(135deg,#dc2626,#d4a017)" }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-black text-slate-900 text-lg">{userName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {online ? "Online" : "Offline"}
                </span>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 capitalize">{user.role || "Donor"}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Email", value: user.email || "N/A", icon: Mail },
              { label: "Mobile", value: mobile, icon: Phone },
              { label: "WhatsApp", value: whatsapp || "N/A", icon: MessageCircle },
              { label: "Blood Group", value: bg, icon: Droplets },
              { label: "Age", value: user.age ? `${user.age} yrs` : "N/A", icon: User },
              { label: "Gender", value: user.gender || "N/A", icon: User },
              { label: "Weight", value: user.weight ? `${user.weight} kg` : "N/A", icon: Weight },
              { label: "Lives Saved", value: user.livesSaved ?? 0, icon: Heart },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} className="text-slate-400" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{String(value)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Donor Availability</p>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {user.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "Location / Address", value: locationStr, icon: MapPin },
              { label: "Last Donated", value: formatTimestamp(user.lastDonated), icon: Calendar },
              { label: "Roll No / Student ID", value: user.rollNo || "N/A", icon: User },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} className="text-slate-400" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-sm font-bold text-slate-900">{String(value)}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            {whatsapp && whatsapp !== "N/A" ? (
              <a href={`https://wa.me/${String(whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition">
                <MessageCircle size={16} /> WhatsApp
              </a>
            ) : null}
            <button onClick={() => onReport(user)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-700 hover:bg-red-100 transition cursor-pointer">
              <AlertTriangle size={16} /> Report
            </button>
            <button onClick={onClose}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
              <X size={16} /> Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ReportModal({ user, reason, setReason, onClose, onSubmit }) {
  if (!user) return null;
  const userName = user.displayName || user.name || "User";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-amber-500 px-6 py-4 text-white rounded-t-3xl">
          <h2 className="font-black">Report Incorrect Details</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-white/20 transition cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Reporting</p>
            <p className="font-black text-slate-900 mt-0.5">{userName}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason / Details</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
              placeholder="Describe the incorrect information..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-red-300 focus:bg-white resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
              Cancel
            </button>
            <button onClick={onSubmit}
              className="flex-1 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 py-3 text-sm font-bold text-white hover:brightness-105 transition cursor-pointer">
              Submit Report
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TransactionModal({ txn, onClose }) {
  if (!txn) return null;
  const bg = normalizeBloodGroup(txn.bloodGroup);
  const patient = txn.patientName || "Anonymous Patient";
  const donor = txn.donorName || "N/A";
  const hospital = txn.hospitalName || "N/A";
  const location = txn.locationName || "N/A";
  const units = txn.unitsNeeded || 1;
  const completedAt = formatTimestamp(txn.completedAt || txn.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-amber-500 px-6 py-4 text-white rounded-t-3xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Transaction Details</p>
            <h2 className="font-black">{txn.id}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-white/20 transition cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-3">
          {[
            { label: "Transaction ID", value: txn.id },
            { label: "Required Blood Group", value: bg },
            { label: "Patient / Recipient", value: patient },
            { label: "Verified Donor", value: donor },
            { label: "Hospital", value: hospital },
            { label: "Location", value: location },
            { label: "Units", value: `${units} unit(s)` },
            { label: "Completion Time", value: completedAt },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-bold text-slate-900">{value}</p>
            </div>
          ))}
          <button onClick={onClose}
            className="w-full mt-2 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Active tab: TABS[0] | TABS[1] | TABS[2]
  const [tab, setTab] = useState(TABS[0]);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [availFilter, setAvailFilter] = useState("");
  const [bgFilter, setBgFilter] = useState("");
  const [donationSearch, setDonationSearch] = useState("");
  const [donationBg, setDonationBg] = useState("");

  // Pagination for User Directory
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  // Modals
  const [userModal, setUserModal] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [txnModal, setTxnModal] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin-login");
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  const fetchAllData = async () => {
    if (loading) setLoading(true);
    setSyncing(true);
    try {
      // 1. Fetch registered users (excluding admin accounts)
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs
        .map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        .filter(u => {
          const role = String(u.role || "").toLowerCase();
          const email = String(u.email || "").toLowerCase();
          const name = String(u.displayName || u.name || "").toLowerCase();
          const id = String(u.id || "");
          const currentUid = String(currentUser?.uid || "");

          if (u.isAdmin === true || u.isAdmin === "true") return false;
          if (role.includes("admin")) return false;
          if (email.includes("admin")) return false;
          if (name.includes("admin") || name.includes("system")) return false;
          if (currentUid && id === currentUid) return false;
          return true;
        });

      usersList.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setUsers(usersList);

      // 2. Fetch completed donation requests across the platform
      const completedRequestsQuery = query(
        collection(db, "requests"),
        where("status", "==", "completed")
      );
      const requestsSnapshot = await getDocs(completedRequestsQuery);
      const requestsList = requestsSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        type: "request",
        ...docSnap.data()
      }));

      // Sort donation history by completion date descending
      requestsList.sort((a, b) => {
        const timeA = a.completedAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.completedAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setDonations(requestsList);
    } catch (error) {
      console.error("Error loading admin dashboard data:", error);
      toast.error("Failed to sync dashboard data.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleSubmitReport = () => {
    if (!reportModal) return;
    const name = reportModal.displayName || reportModal.name || "user";
    toast.success(`Report submitted for ${name}. Admin team flagged details.`);
    setReportModal(null);
    setReportReason("");
  };

  // Metrics summary
  const metricsData = useMemo(() => {
    const totalUsers = users.length;
    const totalDonors = users.filter(u => (u.role || "donor").toLowerCase() === "donor").length;
    const totalPatients = users.filter(u => String(u.role || "").toLowerCase() === "patient").length;
    const availableDonors = users.filter(u => u.isAvailable === true || isUserOnline(u)).length;
    const totalCompletedDonations = donations.length;

    const groupCounts = {};
    STANDARD_BLOOD_GROUPS.forEach(bg => { groupCounts[bg] = 0; });
    groupCounts["UNSPECIFIED"] = 0;

    users.forEach(u => {
      const norm = normalizeBloodGroup(u.bloodGroup);
      if (groupCounts[norm] !== undefined) {
        groupCounts[norm]++;
      } else {
        groupCounts[norm] = 1;
      }
    });

    const displayedGroups = [...STANDARD_BLOOD_GROUPS];
    if (groupCounts["UNSPECIFIED"] > 0) {
      displayedGroups.push("UNSPECIFIED");
    }
    Object.keys(groupCounts).forEach(g => {
      if (!displayedGroups.includes(g) && groupCounts[g] > 0) {
        displayedGroups.push(g);
      }
    });

    return {
      totalUsers,
      totalDonors,
      totalPatients,
      availableDonors,
      totalCompletedDonations,
      groupCounts,
      displayedGroups
    };
  }, [users, donations]);

  const METRICS = [
    { label: "Registered Donors & Patients", value: `${metricsData.totalUsers}`, sub: `${metricsData.totalDonors} Donors · ${metricsData.totalPatients} Patients`, icon: Users, color: "#dc2626" },
    { label: "Ready Donors", value: `${metricsData.availableDonors}`, sub: "Available right now", icon: Heart, color: "#16a34a" },
    { label: "Donations Completed", value: `${metricsData.totalCompletedDonations}`, sub: "Verified transactions", icon: CheckCircle2, color: "#d4a017" },
    { label: "Blood Categories", value: `${metricsData.displayedGroups.length}`, sub: "All groups covered", icon: Droplets, color: "#7c3aed" },
  ];

  const bloodDistData = useMemo(() => {
    const total = users.length || 1;
    return metricsData.displayedGroups.map(group => {
      const donorCount = metricsData.groupCounts[group] || 0;
      const pct = Math.round((donorCount / total) * 100);
      return { group, donors: donorCount, pct };
    });
  }, [metricsData, users.length]);

  // User directory filter
  const filteredUsers = useMemo(() => {
    let r = users;
    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter(u => {
        const name = (u.displayName || u.name || "").toLowerCase();
        const mobile = (u.whatsappNumber || u.phone || u.mobile || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const rollNo = (u.rollNo || "").toLowerCase();
        return name.includes(q) || mobile.includes(q) || email.includes(q) || rollNo.includes(q);
      });
    }

    if (roleFilter) {
      r = r.filter(u => (u.role || "donor").toLowerCase() === roleFilter.toLowerCase());
    }

    if (availFilter === "available") {
      r = r.filter(u => u.isAvailable === true || isUserOnline(u));
    } else if (availFilter === "unavailable") {
      r = r.filter(u => !u.isAvailable && !isUserOnline(u));
    }

    if (bgFilter) {
      r = r.filter(u => normalizeBloodGroup(u.bloodGroup) === bgFilter);
    }

    return r;
  }, [users, search, roleFilter, availFilter, bgFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PER_PAGE));
  const pagedUsers = useMemo(() => {
    return filteredUsers.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  }, [filteredUsers, page, PER_PAGE]);

  // Donation history filter
  const filteredDonations = useMemo(() => {
    let r = donations;
    const q = donationSearch.trim().toLowerCase();
    if (q) {
      r = r.filter(d => {
        const patient = (d.patientName || "").toLowerCase();
        const donor = (d.donorName || "").toLowerCase();
        const hospital = (d.hospitalName || "").toLowerCase();
        const id = (d.id || "").toLowerCase();
        return patient.includes(q) || donor.includes(q) || hospital.includes(q) || id.includes(q);
      });
    }
    if (donationBg) {
      r = r.filter(d => normalizeBloodGroup(d.bloodGroup) === donationBg);
    }
    return r;
  }, [donations, donationSearch, donationBg]);

  const handleSync = () => {
    fetchAllData();
  };

  const handleViewDonors = (group) => {
    setTab(TABS[0]);
    setBgFilter(group);
    setPage(1);
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#ffffff 0%,#fff5f5 50%,#fffbf0 100%)" }}>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 border-b border-red-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LifeLink" className="h-10 w-auto object-contain" />
            <div className="hidden h-6 w-px bg-slate-200 md:block" />
            <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-xl p-1" style={{ background: "#dc2626" }}>
                <img src={pecLogo} alt="PEC" className="h-9 w-auto object-contain" />
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <img src={yrcLogo} alt="YRC" className="h-9 w-auto object-contain" />
            </div>
            <div className="hidden md:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Executive Monitoring Console</p>
              <p className="text-sm font-black text-slate-900">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: "linear-gradient(135deg,#dc2626,#d4a017)" }}>
                {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-900">System Admin</p>
                <p className="text-[10px] text-slate-400">{currentUser?.email || "admin@lifelink.app"}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-red-200 hover:text-red-600 transition cursor-pointer">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">

        {/* DASHBOARD HEADER */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="flex flex-col gap-4 rounded-3xl border border-red-100 bg-white/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-500">LifeLink Admin</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">Admin Monitoring Directory</h1>
            <p className="mt-1 text-sm text-slate-500">Real-time overview of donors, patients, and blood distribution.</p>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-105 disabled:opacity-70 cursor-pointer"
            style={{ background: "linear-gradient(135deg,#dc2626,#d4a017)" }}>
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Data"}
          </button>
        </motion.div>

        {/* METRIC CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div key={m.label} variants={fadeUp} initial="hidden" animate="visible" custom={i + 1}
                className="rounded-3xl border border-red-100 bg-white/90 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${m.color}15` }}>
                    <Icon size={20} style={{ color: m.color }} />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">{m.value}</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{m.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{m.sub}</p>
              </motion.div>
            );
          })}
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-red-100 bg-white/80 p-2 shadow-sm">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${tab === t ? "text-white shadow-lg" : "text-slate-600 hover:bg-slate-100"}`}
              style={tab === t ? { background: "linear-gradient(135deg,#dc2626,#d4a017)" } : {}}>
              {t}
            </button>
          ))}
        </div>

        {/* TAB: REGISTERED USER DIRECTORY */}
        {tab === TABS[0] && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="rounded-3xl border border-red-100 bg-white/90 p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Directory</p>
                <h2 className="text-xl font-black text-slate-900">Registered User Directory</h2>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 self-start">{filteredUsers.length} users</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search name or mobile..."
                  className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-red-300 focus:bg-white w-52" />
              </div>
              <div className="relative">
                <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                  className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none focus:border-red-300 cursor-pointer">
                  <option value="">All Roles</option>
                  <option value="Donor">Donor</option>
                  <option value="Patient">Patient</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-3 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={availFilter} onChange={e => { setAvailFilter(e.target.value); setPage(1); }}
                  className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none focus:border-red-300 cursor-pointer">
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Blood group pills */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setBgFilter(""); setPage(1); }}
                className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${!bgFilter ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                style={!bgFilter ? { background: "linear-gradient(135deg,#dc2626,#d4a017)" } : {}}>All</button>
              {metricsData.displayedGroups.map(g => (
                <button key={g} onClick={() => { setBgFilter(g === bgFilter ? "" : g); setPage(1); }}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${bgFilter === g ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  style={bgFilter === g ? { background: "linear-gradient(135deg,#dc2626,#d4a017)" } : {}}>
                  {g}
                </button>
              ))}
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <RefreshCw size={30} className="animate-spin mb-3 text-red-500" />
                <p className="font-bold">Loading users...</p>
              </div>
            ) : pagedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Users size={40} className="mb-3 opacity-30" />
                <p className="font-bold">No users found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
                  <thead>
                    <tr className="text-left text-white" style={{ background: "linear-gradient(135deg,#dc2626,#d4a017)" }}>
                      <th className="px-4 py-3 font-bold">Name</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Mobile No.</th>
                      <th className="px-4 py-3 font-bold text-center">Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedUsers.map(u => {
                      const userName = u.displayName || u.name || "Unknown User";
                      const mobile = u.whatsappNumber || u.phone || u.mobile || "N/A";
                      const available = u.isAvailable || isUserOnline(u);
                      const bg = normalizeBloodGroup(u.bloodGroup);

                      return (
                        <tr key={u.id} className="hover:bg-red-50/40 transition">
                          <td className="px-4 py-3">
                            <button onClick={() => setUserModal(u)}
                              className="font-bold text-red-600 hover:underline text-left cursor-pointer">{userName}</button>
                            <p className="text-xs text-slate-400">{u.role || "Donor"} · {bg}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {available ? "Available" : "Unavailable"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{mobile}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => setReportModal(u)}
                              className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer">
                              <AlertTriangle size={12} /> Report
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer">Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer">Next</button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: DONATION HISTORY */}
        {tab === TABS[1] && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="rounded-3xl border border-red-100 bg-white/90 p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Records</p>
                <h2 className="text-xl font-black text-slate-900">Donation History</h2>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 self-start">{filteredDonations.length} completed</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input value={donationSearch} onChange={e => setDonationSearch(e.target.value)}
                  placeholder="Search patient, donor, ID..."
                  className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-red-300 focus:bg-white w-52" />
              </div>
              <div className="flex flex-wrap gap-2">
                {["", ...metricsData.displayedGroups].map(g => (
                  <button key={g || "all"} onClick={() => setDonationBg(g)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${donationBg === g ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    style={donationBg === g ? { background: "linear-gradient(135deg,#dc2626,#d4a017)" } : {}}>
                    {g || "All"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <RefreshCw size={30} className="animate-spin mb-3 text-red-500" />
                <p className="font-bold">Loading donation history...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Activity size={40} className="mb-3 opacity-30" />
                <p className="font-bold">No donation records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDonations.map(d => {
                  const bg = normalizeBloodGroup(d.bloodGroup);
                  const patient = d.patientName || "Anonymous Patient";
                  const donor = d.donorName || "Verified Donor";
                  const hospital = d.hospitalName || "N/A";
                  const location = d.locationName || "N/A";
                  const units = d.unitsNeeded || 1;
                  const completedAt = formatTimestamp(d.completedAt || d.createdAt);

                  return (
                    <div key={d.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#dc2626,#d4a017)" }}>{bg}</div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900">{d.id}</span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">Completed</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{completedAt} · {hospital}</p>
                          <p className="text-xs text-slate-500">{patient} ← {donor} · {units} unit(s) · {location}</p>
                        </div>
                      </div>
                      <button onClick={() => setTxnModal(d)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition self-end sm:self-center flex-shrink-0 cursor-pointer">
                        <Eye size={13} /> Transaction Details
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: BLOOD DISTRIBUTION */}
        {tab === TABS[2] && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="rounded-3xl border border-red-100 bg-white/90 p-5 shadow-sm space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Analytics</p>
              <h2 className="text-xl font-black text-slate-900">Blood Distribution</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {bloodDistData.map((b, i) => (
                <motion.div key={b.group} variants={fadeUp} initial="hidden" animate="visible" custom={i}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white"
                      style={{ background: "linear-gradient(135deg,#dc2626,#d4a017)" }}>{b.group}</div>
                    <span className="text-2xl font-black text-slate-900">{b.donors}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                      <span>% of network</span><span>{b.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(b.pct, 3)}%`, background: "linear-gradient(135deg,#dc2626,#d4a017)" }} />
                    </div>
                  </div>
                  <button onClick={() => handleViewDonors(b.group)}
                    className="w-full rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer">
                    View Donors
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {userModal && <UserDetailsModal user={userModal} onClose={() => setUserModal(null)} onReport={u => { setUserModal(null); setReportModal(u); }} />}
        {reportModal && <ReportModal user={reportModal} reason={reportReason} setReason={setReportReason} onClose={() => { setReportModal(null); setReportReason(""); }} onSubmit={handleSubmitReport} />}
        {txnModal && <TransactionModal txn={txnModal} onClose={() => setTxnModal(null)} />}
      </AnimatePresence>
    </div>
  );
}

