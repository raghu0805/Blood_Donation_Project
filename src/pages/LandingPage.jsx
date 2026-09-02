import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Button } from '../components/Button';
import { HeartPulse, ShieldCheck, MapPin, Activity, Clock, AlertCircle, XCircle, Phone, CheckCircle, Megaphone, Database, Plus, Droplets, Zap, Bell, Heart, ChevronRight } from 'lucide-react';
import DemoModal from '../components/DemoModal';
import LandingNavbar from '../components/LandingNavbar';
import { motion, useInView, animate } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { calculateDonationEligibility, ALL_BLOOD_GROUPS, BLOOD_COMPATIBILITY_INFO } from '../lib/utils';
import CountdownTimer from '../components/CountdownTimer';
import { useMCP } from '../contexts/MCPContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, query, where, getDocs, onSnapshot, doc, serverTimestamp, setDoc, deleteDoc, increment } from 'firebase/firestore';
import { Card } from '../components/Card';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.13 } } };

function useCountUp(target, duration = 2, inView) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, { duration, ease: "easeOut", onUpdate: (v) => setValue(Math.floor(v)) });
    return controls.stop;
  }, [inView, target, duration]);
  return value;
}

function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 5 + 2,
    color: i % 3 === 0 ? "#d4a017" : "#dc2626",
    duration: Math.random() * 8 + 6, delay: Math.random() * 4,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color, opacity: 0.18 }}
          animate={{ y: [0, -40, 0], x: [0, Math.random() * 20 - 10, 0], opacity: [0.1, 0.35, 0.1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 55% at 50% 60%, rgba(220,38,38,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 75% 25%, rgba(212,160,23,0.07) 0%, transparent 60%)" }} />
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-28 pb-16" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>
      <Particles />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex-1">
          <motion.div variants={fadeUp} custom={0} className="mb-6 inline-flex items-center gap-2.5 rounded-full px-4 py-2" style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(220,38,38,0.2)", boxShadow: "0 4px 20px rgba(220,38,38,0.08)" }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-sm font-medium tracking-wide text-red-600">Live: Emergency Blood Network Active</span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="mb-6 text-5xl font-black leading-none tracking-tight text-gray-900 md:text-6xl lg:text-7xl" style={{ fontFamily: "var(--font-heading)" }}>
            DONATE<br />
            <span style={{ background: "linear-gradient(135deg, #d4a017 0%, #dc2626 55%, #d4a017 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              YOUR BLOOD
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="mb-10 max-w-md text-lg leading-relaxed text-slate-500">
            Connect with donors, track supply, and save lives in real-time.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-col gap-4 sm:flex-row">
            <motion.button whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(220,38,38,0.35)" }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/role-selection")}
              className="flex items-center gap-2.5 rounded-2xl bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-500">
              <Droplets size={18} /> Donate Blood
            </motion.button>
            <motion.button whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(212,160,23,0.25)" }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/role-selection")}
              className="flex items-center gap-2.5 rounded-2xl border-2 border-amber-400 px-8 py-4 text-base font-semibold text-amber-600 transition-colors hover:bg-amber-50"
              style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
              <Heart size={18} /> Join Now
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="flex-1 w-full">
          <div className="w-full overflow-hidden rounded-[2.5rem] shadow-2xl" style={{ aspectRatio: "4/3", border: "1.5px solid rgba(220,38,38,0.12)" }}>
            <img src="/blood.png" alt="Donate Your Blood" className="h-full w-full object-cover" />
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28" style={{ background: "linear-gradient(to top, #fff5f5, transparent)" }} />
    </section>
  );
}

function StatItem({ value, suffix = "", label, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const count = useCountUp(value, 1.8, inView);
  return (
    <motion.div ref={ref} variants={fadeUp} custom={delay} className="flex flex-col items-center">
      <span className="text-4xl font-bold md:text-5xl" style={{ fontFamily: "var(--font-heading)", background: "linear-gradient(135deg, #d4a017, #dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        {count}{suffix}
      </span>
      <span className="mt-1.5 text-sm font-medium tracking-wider text-slate-400 uppercase">{label}</span>
    </motion.div>
  );
}

function StatsBar() {
  const stats = [
    { value: 500, suffix: "+", label: "Active Donors" },
    { value: 1200, suffix: "+", label: "Lives Saved" },
    { value: 12, suffix: "", label: "Cities Covered" },
    { value: 5, suffix: " Min", label: "Avg Response" },
  ];
  return (
    <section className="py-14" style={{ background: "rgba(255,255,255,0.9)", borderTop: "1px solid rgba(148,163,184,0.15)", borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
        className="mx-auto grid max-w-5xl grid-cols-2 gap-10 px-6 md:grid-cols-4">
        {stats.map((s, i) => <StatItem key={s.label} {...s} delay={i} />)}
      </motion.div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", title: "Register & Verify", desc: "Create your profile, verify your identity, and set your blood group. Takes less than 2 minutes." },
    { num: "02", title: "Request or Offer Blood", desc: "Post an emergency request or browse real-time donor availability near you." },
    { num: "03", title: "Connect & Save a Life", desc: "Get instantly matched and coordinated with verified donors or recipients." },
  ];
  return (
    <section className="py-24 px-6" style={{ background: "linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)" }}>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="mx-auto max-w-5xl">
        <motion.div variants={fadeUp} className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-gray-900 md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>How LifeLink Works</h2>
          <p className="mt-4 text-slate-500">Three simple steps between life and hope.</p>
        </motion.div>
        <div className="relative flex flex-col gap-12 md:flex-row md:gap-0">
          <div className="absolute top-10 left-0 right-0 hidden border-t-2 border-dashed border-amber-300/60 md:block" style={{ zIndex: 0 }} />
          {steps.map((step, i) => (
            <motion.div key={step.num} variants={fadeUp} custom={i} className="relative z-10 flex flex-1 flex-col items-center text-center md:px-8">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg"
                style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(212,160,23,0.35)", boxShadow: "0 8px 32px rgba(212,160,23,0.12)" }}>
                <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", background: "linear-gradient(135deg, #d4a017, #dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{step.num}</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function FeatureCard({ icon: Icon, iconColor, title, desc, delay }) {
  return (
    <motion.div variants={fadeUp} custom={delay}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(212,160,23,0.15)" }}
      className="rounded-3xl p-8 transition-all duration-300"
      style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${iconColor}15`, border: `1px solid ${iconColor}30` }}>
        <Icon size={22} style={{ color: iconColor }} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
    </motion.div>
  );
}

function Features() {
  const cards = [
    { icon: MapPin, iconColor: "#dc2626", title: "Real-Time Tracking", desc: "Watch your donor or recipient move on a live map. Full transparency from request to delivery." },
    { icon: ShieldCheck, iconColor: "#d4a017", title: "Verified Donors", desc: "Every donor is ID-verified and health-screened. You can trust who shows up." },
    { icon: Bell, iconColor: "#dc2626", title: "Emergency Alerts", desc: "Instant push alerts to nearby donors the moment a critical request is posted." },
  ];
  return (
    <section className="py-24 px-6" style={{ background: "linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)" }}>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="mx-auto max-w-5xl">
        <motion.div variants={fadeUp} className="mb-14 text-center">
          <h2 className="text-4xl font-bold text-gray-900 md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>Why Choose LifeLink?</h2>
          <p className="mt-4 text-slate-500">Engineered for emergencies. Built for humanity.</p>
        </motion.div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => <FeatureCard key={c.title} {...c} delay={i} />)}
        </div>
      </motion.div>
    </section>
  );
}

const bloodInfo = BLOOD_COMPATIBILITY_INFO;

function BloodFinder() {
  const [selected, setSelected] = useState("O-");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    { id: "All", label: `All Types (${ALL_BLOOD_GROUPS.length})` },
    { id: "Standard", label: "Standard Types (8)" },
    { id: "Subgroups", label: "Subgroups (8)" },
    { id: "Rare Phenotypes", label: "Rare Phenotypes (3)" }
  ];

  const filteredGroups = ALL_BLOOD_GROUPS.filter((g) => {
    if (activeCategory === "All") return true;
    return bloodInfo[g]?.category === activeCategory;
  });

  const info = selected ? bloodInfo[selected] : null;

  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: "linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)" }}>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="mx-auto max-w-4xl text-center">
        <motion.div variants={fadeUp} className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>Blood Type Compatibility</h2>
          <p className="mt-4 text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
            Select your blood group to see who you can give to and receive from. Supports all 19 standard blood types, subgroups, and rare phenotypes.
          </p>
        </motion.div>

        {/* Category Filter Chips */}
        <motion.div variants={fadeUp} custom={1} className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white/80 text-slate-600 hover:bg-red-50 border border-slate-200/80"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Blood Group Selection Buttons */}
        <motion.div variants={fadeUp} custom={2} className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-3xl mx-auto">
          {filteredGroups.map((g) => {
            const isSelected = selected === g;
            return (
              <motion.button key={g} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                onClick={() => setSelected(isSelected ? null : g)}
                className="rounded-2xl px-3.5 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200"
                style={isSelected ? {
                  background: "linear-gradient(135deg, #dc2626, #d4a017)",
                  color: "#fff",
                  boxShadow: "0 8px 24px rgba(220,38,38,0.3)",
                  border: "1.5px solid transparent",
                } : {
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(10px)",
                  border: "1.5px solid rgba(148,163,184,0.25)",
                  color: "#374151",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}>
                {g}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Selected Blood Group Details Card */}
        <motion.div animate={{ opacity: info ? 1 : 0, y: info ? 0 : 12 }} transition={{ duration: 0.35 }} className="mt-8">
          {info && (
            <div className="rounded-3xl p-5 sm:p-7 text-left" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(220,38,38,0.15)", boxShadow: "0 12px 40px rgba(220,38,38,0.08)" }}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-red-100/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 shadow-md" style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)" }}>
                    <Droplets size={22} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-gray-900">{selected}</span>
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-red-700 uppercase tracking-wider">
                        {info.category}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-500">— {info.label}</span>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-xs text-slate-400 font-semibold block">LifeLink Compatibility Engine</span>
                  <span className="text-[11px] font-bold text-emerald-600">Verified Medical Matching</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl p-4 sm:p-5" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-600">Can Donate To</p>
                    <span className="text-[10px] font-extrabold text-red-500 bg-red-100/80 px-2 py-0.5 rounded-full">
                      {info.canGiveTo.length} Matches
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {info.canGiveTo.map((g) => (
                      <span key={g} className="rounded-xl px-3 py-1 text-xs sm:text-sm font-bold text-white shadow-xs" style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}>{g}</span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl p-4 sm:p-5" style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.18)" }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Can Receive From</p>
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      {info.canReceiveFrom.length} Matches
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {info.canReceiveFrom.map((g) => (
                      <span key={g} className="rounded-xl px-3 py-1 text-xs sm:text-sm font-bold shadow-xs" style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)", color: "#1a1a1a" }}>{g}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}

function Trust() {
  return (
    <section className="py-20 px-6" style={{ background: "linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)" }}>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="mx-auto max-w-3xl text-center">
        <motion.p variants={fadeUp} className="mb-10 text-sm font-semibold tracking-[0.2em] text-slate-400 uppercase">Trusted & Backed By</motion.p>
        <motion.div variants={fadeUp} custom={1} className="flex flex-col items-center justify-center gap-10 sm:flex-row sm:gap-16">
          {[{ code: "PEC", label: "Panimalar Engineering College", color: "#dc2626" }, { code: "YRC", label: "Youth Red Cross", color: "#d4a017" }].map((org) => (
            <div key={org.code} className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl text-3xl font-bold shadow-lg"
                style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(148,163,184,0.2)", color: org.color, boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}>
                {org.code}
              </div>
              <span className="text-sm text-slate-500">{org.label}</span>
            </div>
          ))}
        </motion.div>
        <motion.p variants={fadeUp} custom={2} className="mt-10 text-sm italic text-slate-400">Official blood donation initiative of Panimalar Engineering College</motion.p>
      </motion.div>
    </section>
  );
}

function CTABanner() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden py-24 px-6" style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 40%, #b45309 75%, #d97706 100%)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "200px 200px" }} />
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.h2 variants={fadeUp} className="text-4xl font-bold leading-tight text-white md:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
          Every second counts.<br />Be someone's lifeline.
        </motion.h2>
        <motion.p variants={fadeUp} custom={1} className="mt-5 text-base text-red-100/80">A single donation can save up to 3 lives. Join LifeLink and make it count.</motion.p>
        <motion.div variants={fadeUp} custom={2} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <motion.button onClick={() => navigate("/role-selection")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2.5 rounded-2xl bg-white px-8 py-4 text-base font-bold text-red-700 shadow-xl transition-colors hover:bg-red-50">
            <Droplets size={18} /> Donate Blood Now
          </motion.button>
          <motion.button onClick={() => navigate("/role-selection")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2.5 rounded-2xl px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            style={{ border: "2px solid rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}>
            <ChevronRight size={18} /> Request Blood
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}

function LandingFooter() {
  const navigate = useNavigate();
  return (
    <>
      {/* Mini CTA Strip */}
      <div className="px-6 py-10 text-center" style={{ background: "linear-gradient(90deg, #fff5f5 0%, #ffffff 50%, #fff5f5 100%)", borderTop: "1px solid rgba(220,38,38,0.08)" }}>
        <p className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-heading)" }}>Ready to make a difference?</p>
        <p className="text-slate-500 mb-6 text-sm">Join thousands of donors saving lives across India every day.</p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <motion.button onClick={() => navigate("/role-selection")} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 hover:bg-red-500 transition-colors">
            <Droplets size={16} /> Donate Blood
          </motion.button>
          <motion.button onClick={() => navigate("/role-selection")} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 rounded-2xl border-2 border-amber-400 px-6 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors">
            <Heart size={16} /> Request Blood
          </motion.button>
        </div>
      </div>

      {/* Main Footer */}
      <footer style={{ background: "#0f0505" }}>
        <div className="mx-auto max-w-6xl px-6 py-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-600">
                <Droplets size={17} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>LifeLink</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">Connecting blood donors and recipients in real time. Every second counts.</p>
            <div className="flex gap-3 mt-5">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-slate-400 hover:text-pink-400 transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>ig</a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>in</a>
              <a href="mailto:lifelink@pec.edu.in" className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>@</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Quick Links</p>
            <ul className="space-y-2.5">
              {["How It Works", "Find Blood", "Register as Donor", "Emergency Request", "About Us"].map((l) => (
                <li key={l}><a href={l === "About Us" ? "/about" : "#"} className="text-sm text-slate-400 hover:text-red-400 transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Contact</p>
            <ul className="space-y-2">
              <li className="text-sm text-slate-400">📧 lifelink@pec.edu.in</li>
              <li className="text-sm text-slate-400">📞 +91 98765 43210</li>
              <li className="text-sm text-slate-400">📍 Chennai, Tamil Nadu</li>
            </ul>
          </div>

          {/* Emergency */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Emergency</p>
            <div className="rounded-2xl p-4" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <p className="text-sm font-semibold text-red-400 mb-1">24/7 Helpline</p>
              <p className="text-2xl font-bold text-white">1800-BLOOD</p>
              <p className="text-xs text-slate-500 mt-1">Toll free · Always available</p>
            </div>
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">Official initiative of Panimalar Engineering College & Youth Red Cross.</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t px-6 py-5 flex flex-col items-center gap-1 text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-slate-600">© 2025 LifeLink. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default function LandingPage() {
    const { currentUser, userRole } = useAuth();
    const [showDemo, setShowDemo] = useState(false);

    useEffect(() => {
        const hasViewedIntro = sessionStorage.getItem('hasViewedIntro');
        if (!hasViewedIntro) {
            setShowDemo(true);
            sessionStorage.setItem('hasViewedIntro', 'true');
        }
    }, []);

    // Admin Features State
    const { broadcastRequest, completeRequest, acceptRequest, fulfillRequestByAdmin, updateUserProfile, verifyPickupCode } = useMCP();
    const toast = useToast(); // Added toast

    const [adminRequests, setAdminRequests] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]); // New state for patient requests
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestData, setRequestData] = useState({ bloodGroup: 'A+', urgency: 'Emergency' });
    const [activeTab, setActiveTab] = useState('responses'); // Default to responses
    const navigate = useNavigate();

    // Fetch Admin Requests (My Broadcasts)
    const fetchAdminRequests = async () => {
        try {
            const q = query(
                collection(db, "requests"),
                where("patientId", "==", currentUser.uid)
            );
            const snapshot = await getDocs(q);
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setAdminRequests(reqs);
        } catch (error) {
            console.error("Error fetching admin requests:", error);
        }
    };

    // Fetch Incoming Patient Requests
    const fetchIncomingRequests = async () => {
        try {
            // Fetch pending requests not made by me
            const q = query(
                collection(db, "requests"),
                where("status", "in", ["pending", "accepted", "ready_for_pickup"]) // Added ready_for_pickup
            );
            // Firestore limitation: != query. We filter client side for now or basic query
            const snapshot = await getDocs(q);
            let reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter out my own requests
            reqs = reqs.filter(r => r.patientId !== currentUser.uid);

            reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setIncomingRequests(reqs);
        } catch (error) {
            console.error("Error fetching incoming requests:", error);
        }
    };

    useEffect(() => {
        if (currentUser && userRole === 'admin') {
            if (activeTab === 'responses') fetchAdminRequests();
            if (activeTab === 'incoming') fetchIncomingRequests();
            // stock needs no fetch, it's in currentUser
        }
    }, [currentUser, userRole, activeTab]);

    const handleAdminBroadcast = async (e) => {
        e.preventDefault();
        try {
            await broadcastRequest({
                ...requestData,
                patientName: currentUser.displayName || "Blood Bank Center",
                requesterType: 'admin',
                location: null, // Don't hardcode coordinates
                isCenterRequest: true,
                centerId: currentUser.uid
            });
            toast.success("Emergency supply request broadcasted to network!");
            setShowRequestForm(false);
            fetchAdminRequests();
        } catch (error) {
            toast.error("Failed to broadcast: " + error.message);
        }
    };

    const handleAdminAccept = async (req) => {


        try {
            console.log("Attempting to fulfill request:", req.id, req.bloodGroup);
            await fulfillRequestByAdmin(req.id, req.bloodGroup);
            toast.success("All set! The stock has been reserved and the patient has been notified with their Pickup Code.");
            fetchIncomingRequests();
        } catch (error) {
            console.error("Fulfill failed:", error);
            toast.error("Oops! Something went wrong: " + error);
        }
    };

    const handleVerifyPickup = async (reqId, code) => {
        try {
            await verifyPickupCode(reqId, code);
            toast.success("Perfect match! Identity verified. You can now safely hand over the blood unit.");
            fetchIncomingRequests();
        } catch (error) {
            toast.error("Verification Mismatch: " + error);
        }
    };

    const handleAddStock = async (bloodGroup) => {
        try {
            console.log(`Adding stock for ${bloodGroup}...`);
            // Use nested object structure for setDoc with merge: true
            await updateUserProfile({
                bloodStock: {
                    [bloodGroup]: increment(1)
                }
            });
            console.log("Stock add signal sent.");
            // Optional: toast.success(`Added 1 unit of ${bloodGroup}`); 
        } catch (error) {
            console.error("Stock update error:", error);
            toast.error("Failed to update stock: " + error.message);
        }
    };



    // ADMIN VIEW - Redirect admin directly to real Admin Dashboard
    if (userRole === 'admin') {
        return <Navigate to="/admin-dashboard" replace />;
    } // End Admin View

    return (
        <div className="min-h-screen font-sans antialiased" style={{ background: "#ffffff" }}>
            <LandingNavbar 
                userName={currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : "User")} 
                showUser={!!currentUser} 
                activePath="/" 
            />
            <Hero />
            <StatsBar />
            <HowItWorks />
            <Features />
            <BloodFinder />
            <Trust />
            <CTABanner />
            <LandingFooter />
            <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
        </div>
    );
}

// Helper Component for Admin's Own Requests
function AdminRequestCard({ req, navigate, completeRequest, fetchAdminRequests }) {
    const toast = useToast();
    const statusClasses = req.status === 'accepted' ? 'bg-green-100 text-green-700' :
        req.status === 'completed' ? 'bg-blue-100 text-blue-700' :
        'bg-yellow-100 text-yellow-700';

    return (
        <Card className="p-5 border-l-4 border-l-red-500 relative hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded-full">
                        {req.urgency}
                    </span>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{req.bloodGroup}</h3>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${statusClasses}`}>
                    {req.status}
                </div>
            </div>

            <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
            </p>

            {['accepted', 'completed'].includes(req.status) ? (
                <div className={`p-4 rounded-lg border ${req.status === 'completed' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                    <p className={`text-xs font-semibold uppercase mb-1 ${req.status === 'completed' ? 'text-blue-800' : 'text-green-800'}`}>
                        {req.status === 'completed' ? 'Donation Completed By' : 'Accepted By'}
                    </p>
                    <p className="font-bold text-gray-900 text-lg">{req.donorName}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Phone className={`h-4 w-4 ${req.status === 'completed' ? 'text-blue-600' : 'text-green-600'}`} />
                        <a href={`tel:${req.donorPhone}`} className={`text-sm font-medium hover:underline ${req.status === 'completed' ? 'text-blue-700' : 'text-green-700'}`}>
                            {req.donorPhone || "No Phone Shared"}
                        </a>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button
                            onClick={() => navigate(`/chat/${req.id}`)}
                            className={`flex-1 text-xs text-white ${req.status === 'completed' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {req.status === 'completed' ? 'View Chat' : 'Message Donor'}
                        </Button>
                    </div>

                    {req.status === 'accepted' && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                            <Button
                                onClick={async () => {
                                    try {
                                        await completeRequest(req.id);
                                        toast.success("Stock Updated! Donation completed.");
                                        fetchAdminRequests();
                                    } catch (error) {
                                        toast.error("Failed to update stock: " + error.message);
                                    }
                                }}
                                className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                            >
                                Mark Completed & Add to Stock
                            </Button>
                            <div className="mt-2 text-xs text-green-600 flex gap-1 justify-center items-center">
                                <CheckCircle className="h-3 w-3" />
                                Donor is on the way
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-900 p-4 rounded-lg border border-dashed border-gray-800 text-center">
                    <div className="animate-pulse flex justify-center mb-2">
                        <div className="h-2 w-2 bg-gray-700 rounded-full mx-0.5"></div>
                        <div className="h-2 w-2 bg-gray-700 rounded-full mx-0.5 animation-delay-200"></div>
                        <div className="h-2 w-2 bg-gray-700 rounded-full mx-0.5 animation-delay-400"></div>
                    </div>
                    <span className="text-sm text-gray-500">Waiting for donors to respond...</span>
                </div>
            )}
        </Card>
    );
}

function IncomingPatientCard({ req, onAccept, onVerify }) {
    const [code, setCode] = useState("");

    return (
        <Card className="p-5 border-l-4 border-l-blue-500 relative hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${req.status === 'ready_for_pickup' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'
                        }`}>
                        {req.status === 'ready_for_pickup' ? 'Awaiting Pickup' : 'Patient Request'}
                    </span>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{req.bloodGroup}</h3>
                </div>
                <div className="px-2 py-1 rounded text-xs font-bold uppercase bg-yellow-100 text-yellow-700">
                    {req.urgency}
                </div>
            </div>
            <p className="font-medium text-lg">{req.patientName}</p>
            <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Unknown Location
            </p>

            {req.status === 'ready_for_pickup' ? (
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                    <p className="text-xs font-bold text-amber-800 mb-2">Verify Pickup Code</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="6-digit Code"
                            className="w-full px-2 py-1 text-sm border rounded"
                            value={code} // State should be controlled? Yes.
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                            onClick={() => onVerify(req.id, code)}
                        >
                            Verify
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    onClick={() => onAccept(req)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Fulfill / Supply Blood
                </Button>
            )}
        </Card>
    );
}


