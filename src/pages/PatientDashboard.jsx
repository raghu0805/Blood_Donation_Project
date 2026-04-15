import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Bell, ChevronRight, Search, AlertCircle, Clock, CheckCircle, X, User, Heart, Droplets, Sparkles, MessageCircle } from "lucide-react";
import LandingNavbar from "../components/LandingNavbar";
import { useAuth } from '../contexts/AuthContext';
import { useMCP } from '../contexts/MCPContext';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const statusStyle = {
  pending:  { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#d97706", label: "Pending", icon: Clock },
  matched:  { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  text: "#16a34a", label: "Matched", icon: CheckCircle },
  rejected: { bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.2)",  text: "#dc2626", label: "No Match", icon: X },
  accepted: { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  text: "#16a34a", label: "Accepted", icon: CheckCircle },
  completed: { bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.2)", text: "#2563eb", label: "Completed", icon: CheckCircle },
  ready_for_pickup: { bg: "rgba(147,51,234,0.08)", border: "rgba(147,51,234,0.2)", text: "#9333ea", label: "Reserved", icon: CheckCircle }
};

function RequestForm({ onClose, onSubmit }) {
  const [form, setForm] = useState({ bloodGroup: "B+", urgency: "Emergency", hospital: "", notes: "" });
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>Initialize Request</h3>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Blood Group Needed</label>
            <div className="flex flex-wrap gap-2">
              {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((g) => (
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
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Hospital / Location</label>
            <input value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })}
              placeholder="e.g. Panimalar Medical Center"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-400"
              style={{ background: "#f8fafc" }} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Additional Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Patient details, units needed..."
              rows={2} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-400 resize-none"
              style={{ background: "#f8fafc" }} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => { onSubmit(form); }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)", boxShadow: "0 8px 24px rgba(220,38,38,0.25)" }}>
            <AlertCircle size={16} /> Submit Emergency Request
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const { availableDonors = [], broadcastRequest, myRequests = [], completeRequest, requestGeminiAnalysis, geminiAnalysis } = useMCP();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [requestedDonors, setRequestedDonors] = useState([]);
  
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "User";

  const handleSubmit = async (form) => {
    try {
        await broadcastRequest(form);
        setShowForm(false);
    } catch (err) {
        alert("Failed to broadcast request: " + err.message);
    }
  };

  const handleRequestSpecificDonor = async (donor) => {
    if (!window.confirm(`Send immediate request to ${donor.name} for ${donor.bloodGroup} blood?`)) return;
    try {
        await broadcastRequest({
            bloodGroup: donor.bloodGroup,
            urgency: 'Emergency',
            specificDonorId: donor.id 
        });
        setRequestedDonors([...requestedDonors, donor.id]);
        alert(`Request sent! ${donor.name} has been notified.`);
    } catch (err) {
        alert("Failed to send request: " + err.message);
    }
  };

  const handleComplete = async (requestId) => {
      if (window.confirm("Confirm that you received the blood donation? This will update the donor's impact score.")) {
          try {
              await completeRequest(requestId);
          } catch (err) {
              alert("Error: " + err);
          }
      }
  };

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>
      <LandingNavbar activePath="/patient-dashboard" />

      <AnimatePresence>{showForm && <RequestForm onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}</AnimatePresence>

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">

        {/* Hero */}
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
            <motion.button variants={fadeUp} custom={3}
              whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(220,38,38,0.25)" }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2.5 self-start rounded-2xl bg-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-500 md:self-auto">
              <AlertCircle size={16} /> Initialize Request
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">

            {/* Active Requests */}
            <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="rounded-3xl p-6"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Your Requests</p>
                  <p className="mt-0.5 text-lg font-bold text-gray-900">Active Requests</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-red-600" style={{ background: "rgba(220,38,38,0.08)" }}>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  {myRequests.filter(r => r.status !== 'completed').length} Active
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {myRequests.map((req, i) => {
                    const s = statusStyle[req.status] || statusStyle.pending;
                    const StatusIcon = s.icon;
                    return (
                      <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl font-black text-white shrink-0"
                            style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)" }}>
                            {req.bloodGroup}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{req.bloodGroup} Blood Needed</p>
                            <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-none">
                              <MapPin size={11} className="text-slate-400 shrink-0" />
                              <span className="text-xs text-slate-400 truncate">{req.hospitalName || req.hospital || "General Area"}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs text-slate-400 shrink-0">
                                {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                              </span>
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

                           {/* Interactive Controls for Accepted or Pickup Status */}
                           {(req.status === 'accepted' || req.status === 'ready_for_pickup') && (
                             <div className="flex gap-2">
                                {req.status === 'accepted' && (
                                   <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(`/chat/${req.id}`)}
                                     className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-white bg-green-600 shadow flex items-center gap-1.5 transition-colors hover:bg-green-700">
                                     <MessageCircle size={12} /> Chat
                                   </motion.button>
                                )}
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleComplete(req.id)}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-white shadow transition-colors"
                                  style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)", border: "1px solid rgba(255,255,255,0.2)"}}>
                                  Received
                                </motion.button>
                             </div>
                           )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {myRequests.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Search size={32} className="text-slate-200" />
                    <p className="text-sm text-slate-400">No active requests. Click "Initialize Request" to start.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Matched Donors */}
            <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="rounded-3xl p-6"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Matching</p>
                  <p className="mt-0.5 text-lg font-bold text-gray-900">Matched Donors</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => requestGeminiAnalysis({ donors: availableDonors })} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                        <Sparkles size={12} /> Auto-match
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
                        <div className="flex items-center gap-2 mt-0.5 truncate text-ellipsis">
                          <span className="text-xs font-bold text-red-500">{donor.bloodGroup || "??"}</span>
                          <span className="text-slate-300">·</span>
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-400">{donor.distance || "Nearby"}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-400 shrink-0">{donor.lastDonated ? new Date(donor.lastDonated).toLocaleDateString() : "Ready"}</span>
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleRequestSpecificDonor(donor)}
                      disabled={requestedDonors.includes(donor.id)}
                      className="flex items-center justify-center shrink-0 w-full sm:w-auto gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-80"
                      style={requestedDonors.includes(donor.id)
                        ? { background: "rgba(34,197,94,0.15)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)" }
                        : { background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 12px rgba(220,38,38,0.25)" }}>
                      {requestedDonors.includes(donor.id) ? <><CheckCircle size={12} /> Requested</> : <><Bell size={12} /> Request</>}
                    </motion.button>
                  </motion.div>
                ))}
                {availableDonors.length === 0 && (
                   <p className="text-xs text-gray-400 italic py-2">No active offline donors in your radius.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">

            {/* Request Stats */}
            <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="rounded-3xl p-6"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(212,160,23,0.2)", boxShadow: "0 4px 24px rgba(212,160,23,0.08)" }}>
              <p className="mb-4 text-sm font-bold text-gray-900">Request Overview</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Active Requests", value: myRequests.filter(r => r.status !== 'completed').length, color: "#dc2626" },
                  { label: "Donors Available", value: availableDonors.length, color: "#d4a017" },
                  { label: "Avg Response", value: "< 5 min", color: "#22c55e" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl px-4 py-3"
                    style={{ background: "rgba(248,250,252,0.8)", border: "1px solid rgba(148,163,184,0.12)" }}>
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-bold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Context Map if Any */}
            {geminiAnalysis && (
                <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible" className="rounded-3xl p-6"
                    style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(99,102,241,0.05))", border: "1.5px solid rgba(59,130,246,0.2)", boxShadow: "0 4px 24px rgba(59,130,246,0.1)" }}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500 flex items-center gap-1"><Sparkles size={12} /> Gemini Strategy</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{geminiAnalysis}</p>
                </motion.div>
            )}

            {/* Quick Helper Tips */}
            <motion.div variants={fadeUp} custom={6} initial="hidden" animate="visible" className="rounded-3xl p-6 flex-1"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
              <p className="mb-4 text-sm font-bold text-gray-900">While You Wait</p>
              <div className="flex flex-col gap-2.5">
                {["Keep your phone nearby for donor calls", "Confirm hospital address is correct", "Have patient ID ready"].map((tip) => (
                  <div key={tip} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold">✓</span>
                    <span className="text-xs text-slate-500">{tip}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
