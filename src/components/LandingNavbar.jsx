import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Droplets, Heart, Bell, Menu, X, LogOut, Info } from "lucide-react";
import logo from '../assets/app logo.png';
import pecLogo from '../assets/pec logo.png';
import yrcLogo from '../assets/yrc logo.png';
import { useAuth } from '../contexts/AuthContext';

export default function LandingNavbar({ activePath = "" }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, logout, userRole, assignRole, setIsRoleSwitching } = useAuth();
  
  const showUser = !!currentUser;
  const userName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : "User");

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
                <div className="relative cursor-pointer hidden sm:block" onClick={() => handleRoleSwitch('donor')}>
                  <Bell size={17} className="text-slate-400 hover:text-red-500 transition-colors" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">!</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 cursor-pointer hover:border-red-300 transition-colors" onClick={() => navigate("/profile")} style={{ background: "rgba(255,255,255,0.8)" }}>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)" }}>
                    {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="Avatar" className="h-full w-full object-cover" /> : userName.charAt(0).toUpperCase()}
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

            {/* User / Auth */}
            {showUser ? (
              <div className="flex flex-col gap-2 sm:hidden">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors" onClick={() => { navigate("/profile"); setMenuOpen(false); }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)" }}>
                        {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="Avatar" className="h-full w-full object-cover" /> : userName.charAt(0).toUpperCase()}
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
