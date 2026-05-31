import { useState } from "react";
import { toast } from 'react-hot-toast';

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Bell, ChevronRight, Search, AlertCircle, Clock, CheckCircle, X, User, Heart, Droplets, Sparkles, MessageCircle, Users, Minus, Plus, ShieldCheck, ArrowUpCircle, ArrowDownCircle, Activity } from "lucide-react";
import LandingNavbar from "../components/LandingNavbar";
import VerificationModal from "../components/VerificationModal";
import { useAuth } from '../contexts/AuthContext';
import { useMCP } from '../contexts/MCPContext';
import { getRequestStatusInfo, ALL_BLOOD_GROUPS } from '../lib/utils';
import { LoadingSpinner } from "../components/LoadingSpinner";
import LoadingOverlay from '../components/LoadingOverlay';
import ConfirmModal from "../components/ConfirmModal";
import LocationPicker from "../components/LocationPicker";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const statusStyle = {
  pending:  { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#d97706", label: "Pending", icon: Clock },
  partially_fulfilled: { bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.2)", text: "#2563eb", label: "Partially Fulfilled", icon: Users },
  fulfilled: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#16a34a", label: "Fulfilled", icon: ShieldCheck },
  matched:  { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  text: "#16a34a", label: "Matched", icon: CheckCircle },
  rejected: { bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.2)",  text: "#dc2626", label: "No Match", icon: X },
  accepted: { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  text: "#16a34a", label: "Accepted", icon: CheckCircle },
  completed: { bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)", text: "#7c3aed", label: "Completed", icon: CheckCircle },
  closed: { bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", text: "#64748b", label: "Closed", icon: X },
  ready_for_pickup: { bg: "rgba(147,51,234,0.08)", border: "rgba(147,51,234,0.2)", text: "#9333ea", label: "Reserved", icon: CheckCircle }
};

function RequestForm({ onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({ bloodGroup: "B+", urgency: "Emergency", hospital: "", notes: "", unitsRequired: 1, reserveRequired: 2, location: null });

  const handleLocationConfirm = (locationData) => {
    if (locationData) {
      setForm(prev => ({
        ...prev,
        hospital: locationData.hospitalName,
        location: { lat: locationData.lat, lng: locationData.lng }
      }));
    } else {
      setForm(prev => ({ ...prev, hospital: '', location: null }));
    }
  };

  const handleSubmitClick = () => {
    if (submitting) return;
    if (!form.location || !form.hospital) {
      toast.error("Please select a hospital location on the map before submitting.");
      return;
    }
    onSubmit(form);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-black text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                Initialize Request
              </h3>
            </div>
          </div><button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Blood Group Needed</label>
            <div className="flex flex-wrap gap-2">
              {ALL_BLOOD_GROUPS.map((g) => (
                <button key={g} onClick={() => setForm({ ...form, bloodGroup: g })}
                  className="rounded-xl px-4 py-2 text-sm font-bold transition-all"
                  style={form.bloodGroup === g ? { background: "linear-gradient(135deg, #dc2626, #d4a017)", color: "#fff" } : { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#374151" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Urgency</label>
            <div className="flex gap-2">
              {["Emergency", "Urgent", "Moderate"].map((u) => (
                <button key={u} onClick={() => setForm({ ...form, urgency: u })}
                  className="flex-1 rounded-xl py-2 text-xs font-bold transition-all"
                  style={form.urgency === u ? { background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "#fff" } : { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#374151" }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Units Required</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm({ ...form, unitsRequired: Math.max(1, form.unitsRequired - 1) })}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                  <Minus size={16} />
                </button>
                <div className="flex h-12 w-16 items-center justify-center rounded-2xl text-xl font-black text-gray-900"
                  style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                  {form.unitsRequired}
                </div>
                <button type="button" onClick={() => setForm({ ...form, unitsRequired: Math.min(10, form.unitsRequired + 1) })}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Emergency Donors</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm({ ...form, reserveRequired: Math.max(0, form.reserveRequired - 1) })}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                  <Minus size={16} />
                </button>
                <div className="flex h-12 w-16 items-center justify-center rounded-2xl text-xl font-black text-gray-900"
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  {form.reserveRequired}
                </div>
                <button type="button" onClick={() => setForm({ ...form, reserveRequired: Math.min(10, form.reserveRequired + 1) })}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ===== NEW: Interactive Location Picker ===== */}
          <LocationPicker onLocationConfirm={handleLocationConfirm} />

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Additional Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional patient details..."
              rows={2} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-400 resize-none"
              style={{ background: "#f8fafc" }} />
          </div>
          <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onTap={handleSubmitClick}
            disabled={submitting || !form.location}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)", boxShadow: "0 8px 24px rgba(220,38,38,0.25)" }}>
            <AlertCircle size={16} /> {submitting ? "Processing..." : (!form.location ? "Select Location First" : "Submit Emergency Request")}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const { availableDonors = [], broadcastRequest, myRequests = [], completeRequest, requestGeminiAnalysis, geminiAnalysis, moveDonorToPool, isLoadingMy } = useMCP();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [requestedDonors, setRequestedDonors] = useState([]);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [expandedReqId, setExpandedReqId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingDonor, setIsProcessingDonor] = useState(null); // stores donorId being processed
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
  
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "User";

  const handleSubmit = async (form) => {
    if (!form.hospital || form.hospital.trim() === "") {
        toast.error("Please provide a hospital name or location.");

        return;
    }
    
    if (!form.location) {
        setConfirmState({
            isOpen: true,
            title: "Location Confirmation",
            message: "You haven't confirmed precise map coordinates. Donors will have to manually search for the hospital name you provided. Do you want to proceed without a map marker?",
            variant: "warning",
            onConfirm: async () => {
                try {
                    await broadcastRequest(form);
                    setShowForm(false);
                } catch (err) {
                    toast.error("Failed to broadcast request: " + err.message);
                }
            }
        });
        return;
    }

    setSubmitting(true);
    try {
        await broadcastRequest(form);
        setShowForm(false);
    } catch (err) {
        toast.error("Failed to broadcast request: " + err.message);
    } finally {
        setSubmitting(false);
    }
  };

  const handleRequestSpecificDonor = async (donor) => {
    if (requestedDonors.includes(donor.id)) return;
    
    setConfirmState({
        isOpen: true,
        title: "Send Direct Request",
        message: `Send immediate request to ${donor.name} for ${donor.bloodGroup} blood?`,
        variant: "info",
        confirmText: "Send Request",
        onConfirm: async () => {
            setIsProcessingDonor(donor.id);
            try {
                await broadcastRequest({
                    bloodGroup: donor.bloodGroup,
                    urgency: 'Emergency',
                    specificDonorId: donor.id 
                });
                setRequestedDonors([...requestedDonors, donor.id]);
                toast.success(`Request sent! ${donor.name} has been notified.`);
            } catch (err) {
                toast.error("Failed to send request: " + err.message);
            } finally {
                setIsProcessingDonor(null);
            }
        }
    });
  };

  const handleComplete = async (requestId, donorId = null) => {
      try {
          await completeRequest(requestId, donorId);
      } catch (err) {
          toast.error("Error: " + err);

      }
  };

  const handleMoveDonor = async (requestId, donorId, targetPool) => {
      if (isProcessingDonor === donorId) return;
      setIsProcessingDonor(donorId);
      try {
          await moveDonorToPool(requestId, donorId, targetPool);
          toast.success(`Donor moved to ${targetPool} successfully.`);
      } catch (err) {
          toast.error("Failed to move donor: " + err.message);
      } finally {
          setIsProcessingDonor(null);
      }
  };

  const handleGeminiAnalysis = async () => {
      if (isAnalyzing) return;
      setIsAnalyzing(true);
      try {
          await requestGeminiAnalysis({ donors: availableDonors });
      } catch (err) {
          toast.error("AI Analysis failed: " + err.message);
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>
      <LoadingOverlay isLoading={submitting} message="Broadcasting Request..." subMessage="Finding nearby donors for you" />
      <LandingNavbar activePath="/patient-dashboard" />

      <AnimatePresence>{showForm && <RequestForm onClose={() => setShowForm(false)} onSubmit={handleSubmit} submitting={submitting} />}</AnimatePresence>

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">

        <motion.div initial="hidden" animate="visible" className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="mb-4 inline-flex items-center gap-2.5 rounded-full px-4 py-2"
            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-red-600">Live Terminal</span>
          </motion.div>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.h1 variants={fadeUp} custom={1} className="text-5xl font-black text-gray-900 md:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
                FIND LIFE-<br />
                <span style={{ background: "linear-gradient(135deg, #d4a017 0%, #dc2626 55%, #d4a017 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  SAVING BLOOD
                </span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="mt-3 text-slate-500">
                Welcome, {userName.split(" ")[0]}. Let's find the right donor fast.
              </motion.p>
            </div>
            <motion.button type="button" variants={fadeUp} custom={3}
              whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(220,38,38,0.25)" }} whileTap={{ scale: 0.97 }}
              onTap={() => setShowForm(true)}
              className="flex items-center gap-2.5 self-start rounded-2xl bg-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-500 md:self-auto">
              <AlertCircle size={16} /> Initialize Request
            </motion.button>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
          <div className="flex flex-col gap-6">

            <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="rounded-3xl p-6"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Manage Help</p>
                  <p className="mt-0.5 text-lg font-bold text-gray-900">Current Requests</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-red-600" style={{ background: "rgba(220,38,38,0.08)" }}>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  {myRequests.filter(r => r.status !== 'completed').length} Live
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Active Broadcasts</p>
                {isLoadingMy ? (
                  <div className="py-12">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <AnimatePresence>
                    {myRequests.filter(r => r.status !== 'completed').map((req, i) => {
                    const s = statusStyle[req.status] || statusStyle.pending;
                    const StatusIcon = s.icon;
                    const confirmed = req.confirmedDonors || [];
                    const reserve = req.reserveDonors || [];
                    const unitsReq = req.unitsRequired || 1;
                    const unitsFul = req.unitsFulfilled || 0;
                    const poolProgress = Math.min(100, (confirmed.length / unitsReq) * 100);
                    return (
                      <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl font-black text-white shrink-0"
                              style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)" }}>
                              {req.bloodGroup}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 line-clamp-1">{req.bloodGroup} Blood — {unitsReq} Unit{unitsReq > 1 ? 's' : ''} Needed</p>
                              <div className="flex items-start gap-2 mt-1.5 min-w-0">
                                <MapPin size={11} className="text-slate-400 shrink-0 mt-0.5" />
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                                  <span className="text-xs text-slate-500 leading-tight truncate max-w-[150px] sm:max-w-xs">
                                    {req.hospitalName || req.hospital || "General Area"}
                                  </span>
                                  <span className="text-slate-300 hidden sm:inline">·</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0 bg-white/50 px-1.5 py-0.5 rounded-md border border-slate-200/50">
                                    {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                                  </span>
                                </div>
                              </div>
                              {req.status === 'ready_for_pickup' && req.pickupCode && (
                                  <p className="text-xs font-bold text-purple-600 mt-1">Pickup Code: {req.pickupCode}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                             <span className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold" style={{ color: s.text, background: `${s.border}50` }}>
                               <StatusIcon size={12} /> {s.label}
                             </span>
                          </div>
                        </div>

                        {unitsReq > 0 && (
                          <div className="space-y-1.5 mt-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              <span>Donor Pool: {confirmed.length}/{unitsReq} confirmed{reserve.length > 0 ? ` · ${reserve.length} reserve` : ''}</span>
                              <span>{unitsFul}/{unitsReq} received</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${poolProgress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                style={{ background: poolProgress >= 100 ? "#16a34a" : "linear-gradient(90deg, #2563eb, #3b82f6)" }} />
                            </div>
                          </div>
                        )}

                        <AnimatePresence>
                            {expandedReqId === req.id && (confirmed.length > 0 || reserve.length > 0) && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="mt-3 p-3 rounded-xl bg-white/60 border border-slate-200/60 space-y-3">
                                        
                                        {confirmed.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Reserved Donors (Primary) ({confirmed.length}/{unitsReq})</p>
                                                <div className="space-y-1.5">
                                                    {confirmed.map(d => (
                                                        <div key={d.donorId} className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100/50">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold shrink-0">
                                                                    {d.donorName?.charAt(0)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-gray-800 truncate">{d.donorName} <span className="text-[9px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded-full border border-slate-200">Score: {d.priority || 0}</span></p>
                                                                    <p className="text-[10px] text-slate-500 truncate">{d.status === 'completed' ? 'Donation Completed' : 'Pending Donation'}</p>
                                                                </div>
                                                            </div>
                                                            {d.status !== 'completed' && (
                                                                <button 
                                                                    disabled={isProcessingDonor === d.donorId}
                                                                    onClick={() => handleMoveDonor(req.id, d.donorId, 'reserve')}
                                                                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-amber-600 transition-colors bg-white px-2 py-1 rounded border border-slate-200 shadow-sm hover:shadow shrink-0 disabled:opacity-50">
                                                                    <ArrowDownCircle size={12} /> {isProcessingDonor === d.donorId ? "..." : "Move"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {reserve.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 mt-3">Emergency Donors (Standby) ({reserve.length})</p>
                                                <div className="space-y-1.5">
                                                    {reserve.map(d => (
                                                        <div key={d.donorId} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100/50">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-slate-600 text-[10px] font-bold shrink-0">
                                                                    {d.donorName?.charAt(0)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-gray-800 truncate">{d.donorName} <span className="text-[9px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded-full border border-slate-200">Score: {d.priority || 0}</span></p>
                                                                    <p className="text-[10px] text-slate-500 truncate">Standby Donor</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                disabled={isProcessingDonor === d.donorId}
                                                                onClick={() => handleMoveDonor(req.id, d.donorId, 'confirmed')}
                                                                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors bg-white px-2 py-1 rounded border border-blue-100 shadow-sm hover:shadow shrink-0 disabled:opacity-50">
                                                                <ArrowUpCircle size={12} /> {isProcessingDonor === d.donorId ? "..." : "Move"}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {['accepted', 'partially_fulfilled', 'fulfilled', 'ready_for_pickup'].includes(req.status) && (
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                            <div className="flex flex-wrap gap-2">
                                <motion.button type="button" whileTap={{ scale: 0.95 }} onTap={() => navigate(`/chat/${req.id}`)}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-white bg-green-600 shadow flex items-center gap-1.5 transition-colors hover:bg-green-700">
                                  <MessageCircle size={12} /> Chat
                                </motion.button>
                                {confirmed.filter(d => d.status === 'active').map(d => (
                                  <motion.button type="button" key={d.donorId} whileTap={{ scale: 0.95 }} onTap={() => setVerifyTarget({ req, donor: d })}
                                    className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-white shadow transition-colors flex items-center gap-1.5"
                                    style={{ background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}>
                                    <ShieldCheck size={12} /> Verify {d.donorName?.split(' ')[0] || 'Donor'}
                                  </motion.button>
                                ))}
                            </div>
                            {(confirmed.length > 0 || reserve.length > 0) && (
                                <motion.button type="button" whileTap={{ scale: 0.95 }} onTap={() => setExpandedReqId(expandedReqId === req.id ? null : req.id)} 
                                    className="ml-auto shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-sm">
                                    <Users size={12} /> {expandedReqId === req.id ? "Hide Donors" : "Manage Donors"}
                                </motion.button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                )}
                {!isLoadingMy && myRequests.filter(r => r.status !== 'completed').length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Search size={32} className="text-slate-200" />
                    <p className="text-sm text-slate-400 font-medium">No live broadcasts found.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Completed Requests Section */}
            {myRequests.some(r => r.status === 'completed') && (
              <motion.div 
                variants={fadeUp} 
                custom={3} 
                initial="hidden" 
                animate="visible" 
                className="mt-6 rounded-3xl p-8"
                style={{ 
                  background: "rgba(255,255,255,0.9)", 
                  backdropFilter: "blur(20px)", 
                  border: "1.5px solid rgba(34,197,94,0.15)", 
                  boxShadow: "0 20px 40px rgba(34,197,94,0.05)" 
                }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 border border-green-100 shadow-sm">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-0.5">Success Stories</p>
                      <p className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>Completed Requests</p>
                    </div>
                  </div>
                  <span className="rounded-xl px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-100">
                    {myRequests.filter(r => r.status === 'completed').length} Total
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myRequests.filter(r => r.status === 'completed').map((req, i) => (
                    <motion.div 
                      key={req.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative flex items-center gap-4 rounded-2xl bg-slate-50/50 p-5 border border-slate-100 hover:border-green-200 transition-all hover:shadow-md hover:bg-white"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 font-black shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        {req.bloodGroup}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">Life Saved Successfully</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-slate-100">
                             <Activity size={10} /> {req.hospitalName || "Hospital"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Completed</p>
                        <p className="text-[11px] font-black text-slate-700">
                          {req.completedAt?.seconds ? new Date(req.completedAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="rounded-3xl p-6"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Matching</p>
                  <p className="mt-0.5 text-lg font-bold text-gray-900">Matched Donors</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        disabled={isAnalyzing || availableDonors.length === 0}
                        onClick={handleGeminiAnalysis} 
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors disabled:opacity-50">
                        <Sparkles size={12} /> {isAnalyzing ? "Analyzing..." : "Auto-match"}
                    </button>
                    <span className="rounded-xl px-2.5 py-1 text-xs font-bold text-amber-600" style={{ background: "rgba(212,160,23,0.1)" }}>
                    {availableDonors.length} Found
                    </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {availableDonors.map((donor, i) => (
                  <motion.div key={donor.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl p-4"
                    style={{ background: "rgba(248,250,252,0.8)", border: "1px solid rgba(148,163,184,0.15)" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-red-500"
                        style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.1), rgba(212,160,23,0.1))", border: "1px solid rgba(220,38,38,0.15)" }}>
                        {donor.name?.charAt(0) || <User size={18} />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-gray-900 truncate">{donor.name || "Donor"}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 min-w-0">
                          <span className="text-xs font-bold text-red-500 shrink-0">{donor.bloodGroup || "??"}</span>
                          <span className="text-slate-300">·</span>
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-400 truncate">{donor.distance || "Nearby"}</span>
                          </div>
                          <span className="text-slate-300 hidden sm:inline">·</span>
                          <span className="text-xs text-slate-400 shrink-0">{donor.lastDonated ? new Date(donor.lastDonated).toLocaleDateString() : "Ready"}</span>
                        </div>
                      </div>
                    </div>
                    <motion.button type="button"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onTap={() => handleRequestSpecificDonor(donor)}
                      disabled={requestedDonors.includes(donor.id) || isProcessingDonor === donor.id}
                      className="flex items-center justify-center shrink-0 w-full sm:w-auto gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-80"
                      style={requestedDonors.includes(donor.id)
                        ? { background: "rgba(34,197,94,0.15)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)" }
                        : { background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 12px rgba(220,38,38,0.25)" }}>
                      {requestedDonors.includes(donor.id) ? <><CheckCircle size={12} /> Requested</> : isProcessingDonor === donor.id ? "..." : <><Bell size={12} /> Request</>}
                    </motion.button>
                  </motion.div>
                ))}
                {availableDonors.length === 0 && (
                   <p className="text-xs text-gray-400 italic py-2">No active offline donors in your radius.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {verifyTarget && (
        <VerificationModal 
            isOpen={!!verifyTarget} 
            onClose={() => setVerifyTarget(null)}
            role="patient"
            request={verifyTarget.req}
            targetDonor={verifyTarget.donor}
            onVerifySuccess={(donorId) => handleComplete(verifyTarget.req.id, donorId)}
        />
      )}

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmText={confirmState.confirmText}
      />
    </div>
  );
}
