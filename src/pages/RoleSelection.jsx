import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Bell, Search, Droplets, Heart, Loader2 } from "lucide-react";
import LandingNavbar from "../components/LandingNavbar";
import { useAuth } from '../contexts/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function RoleSelection() {
  const { currentUser, assignRole } = useAuth();
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "User";
  const navigate = useNavigate();
  const [isSelecting, setIsSelecting] = useState(false);

  const selectRole = async (role) => {
      if (isSelecting) return;
      setIsSelecting(true);
      try {
          await assignRole(role);
          if (role === 'donor') navigate('/donor-dashboard');
          else navigate('/patient-dashboard');
      } catch (error) {
          console.error("Failed to assign role", error);
      } finally {
          setIsSelecting(false);
      }
  };

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>
      <LandingNavbar activePath="/role-selection" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pt-28 pb-16">

        {/* Back button */}
        <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
          onClick={() => navigate(-1)}
          className="absolute top-24 left-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-red-600">
          <ArrowLeft size={16} /> Back
        </motion.button>

        {/* Heading */}
        <motion.div initial="hidden" animate="visible" className="mb-14 text-center">
          <motion.p variants={fadeUp} custom={0} className="mb-3 text-sm font-semibold uppercase tracking-widest text-red-400">
            Role Selection
          </motion.p>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl font-black text-gray-900 md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
            How do you want<br />
            <span style={{ background: "linear-gradient(135deg, #d4a017 0%, #dc2626 55%, #d4a017 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              to help?
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="mt-4 text-slate-500">
            Choose your role — you can always switch later.
          </motion.p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          {/* Donor Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            whileHover={!isSelecting ? { y: -6, boxShadow: "0 24px 48px rgba(220,38,38,0.18)" } : {}}
            className={`group relative overflow-hidden rounded-3xl p-8 transition-all duration-300 ${isSelecting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(220,38,38,0.15)", boxShadow: "0 8px 32px rgba(220,38,38,0.08)" }}>

            {/* Background glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)" }} />

            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 8px 24px rgba(220,38,38,0.3)" }}>
              <Droplets size={28} className="text-white" />
            </div>

            <h2 className="mb-3 text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>I want to be a Donor</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              Register your availability and get notified instantly when someone nearby needs your blood type.
            </p>

            <ul className="mb-8 space-y-2.5">
              {["Register blood group & location", "Get emergency alerts nearby", "Track your donation history"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <Bell size={11} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <motion.button whileHover={!isSelecting ? { scale: 1.03 } : {}} whileTap={!isSelecting ? { scale: 0.97 } : {}}
              onClick={() => selectRole('donor')}
              disabled={isSelecting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-base font-bold text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600">
              {isSelecting ? <Loader2 size={18} className="animate-spin" /> : <><Droplets size={18} className="mr-1" /> Become a Donor <ChevronRight size={18} /></>}
            </motion.button>
          </motion.div>

          {/* Receiver Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            whileHover={!isSelecting ? { y: -6, boxShadow: "0 24px 48px rgba(212,160,23,0.18)" } : {}}
            className={`group relative overflow-hidden rounded-3xl p-8 transition-all duration-300 ${isSelecting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(212,160,23,0.2)", boxShadow: "0 8px 32px rgba(212,160,23,0.08)" }}>

            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)" }} />

            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)", boxShadow: "0 8px 24px rgba(212,160,23,0.3)" }}>
              <Heart size={28} className="text-white" />
            </div>

            <h2 className="mb-3 text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>I need Blood</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              Post an emergency blood request and get matched with verified donors in your area within minutes.
            </p>

            <ul className="mb-8 space-y-2.5">
              {["Submit patient & blood type details", "Get matched with nearby donors", "Real-time status tracking"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Search size={11} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <motion.button whileHover={!isSelecting ? { scale: 1.03 } : {}} whileTap={!isSelecting ? { scale: 0.97 } : {}}
              onClick={() => selectRole('patient')}
              disabled={isSelecting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-colors disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)", boxShadow: "0 8px 24px rgba(212,160,23,0.3)" }}>
              {isSelecting ? <Loader2 size={18} className="animate-spin" /> : <><Heart size={18} className="mr-1" /> Request Blood <ChevronRight size={18} /></>}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
