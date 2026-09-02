import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import LoadingOverlay from '../components/LoadingOverlay';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { currentUser, loginWithEmail, assignRole, signupWithEmail, setIsRoleSwitching, logout } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      setIsRoleSwitching(true);

      // Force sign out existing session first if needed
      if (currentUser) {
        await logout();
      }

      let userCred;
      try {
        userCred = await loginWithEmail(trimmedEmail, trimmedPassword);
      } catch (loginErr) {
        // If admin account doesn't exist yet, attempt auto-creation
        console.log("Login failed, attempting auto-creation...", loginErr);
        try {
          userCred = await signupWithEmail(trimmedEmail, trimmedPassword, {
            role: 'admin',
            displayName: 'System Admin',
            whatsappNumber: '1234567890'
          });
        } catch (signupErr) {
          if (signupErr.code === 'auth/email-already-in-use') {
            throw new Error('Incorrect password for this admin email. Please check your credentials.');
          }
          throw signupErr;
        }
      }

      const authenticatedUid = userCred?.user?.uid || auth.currentUser?.uid;
      if (authenticatedUid) {
        // Explicitly set admin user document in Firestore to prevent race conditions
        await setDoc(doc(db, "users", authenticatedUid), {
          email: trimmedEmail,
          role: 'admin',
          displayName: 'System Admin',
          whatsappNumber: '1234567890',
          isAvailable: false
        }, { merge: true });

        await assignRole('admin', authenticatedUid);
      }

      navigate('/admin-dashboard', { replace: true });
      setTimeout(() => {
        setIsRoleSwitching(false);
      }, 500);

    } catch (err) {
      setIsRoleSwitching(false);
      console.error("Admin Login Error:", err);
      setError(err.message || 'Failed to log in as admin. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>

      <LoadingOverlay isLoading={loading} message="Authenticating..." subMessage="Verifying admin credentials" />

      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute -bottom-32 -right-32 h-72 w-72 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(212,160,23,0.3) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <motion.div initial="hidden" animate="visible" className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <motion.div variants={fadeUp} custom={0} className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl shadow-lg"
            style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)", boxShadow: "0 8px 32px rgba(220,38,38,0.2)" }}>
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Admin Portal</h1>
          <p className="mt-1 text-sm text-slate-500">LifeLink Control Center</p>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp} custom={1} className="rounded-3xl p-8"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(220,38,38,0.15)", boxShadow: "0 8px 32px rgba(220,38,38,0.08)" }}>

          {/* Quick Auto-fill button */}
          <div className="mb-5 flex items-center justify-between rounded-2xl px-3.5 py-2.5" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}>
            <span className="text-[11px] font-semibold text-slate-500">Default Admin Account</span>
            <button
              type="button"
              onClick={() => { setEmail('admin@lifelink.org'); setPassword('admin123'); }}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
            >
              Auto-fill
            </button>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Admin Email</label>
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-500"
                style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(220,38,38,0.15)" }}>
                <Mail size={15} className="text-red-600 shrink-0" />
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder="admin@lifelink.org" required
                  className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Password</label>
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-red-500"
                style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(220,38,38,0.15)" }}>
                <Lock size={15} className="text-red-600 shrink-0" />
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"} placeholder="••••••••" required
                  className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-slate-400" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-500 hover:text-red-600 transition-colors cursor-pointer">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl px-4 py-2.5 text-xs font-semibold text-red-600"
                style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
                {error}
              </motion.p>
            )}

            <motion.button type="submit"
              whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(220,38,38,0.25)" }}
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)", boxShadow: "0 4px 20px rgba(220,38,38,0.2)" }}>
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                : <><ShieldCheck size={15} /> Access Dashboard</>}
            </motion.button>
          </form>
        </motion.div>

        <motion.p variants={fadeUp} custom={2} className="mt-6 text-center text-xs text-slate-600">
          Restricted access · LifeLink Admin v1.0
        </motion.p>
      </motion.div>
    </div>
  );
}
