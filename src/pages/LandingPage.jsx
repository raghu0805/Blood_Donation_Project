import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate, AnimatePresence } from "framer-motion";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Zap, MapPin, ShieldCheck, Bell, Heart, ChevronRight, Droplets, Clock, Phone, CheckCircle, Sparkles } from "lucide-react";
import LandingNavbar from "../components/LandingNavbar";
import DemoModal from "../components/DemoModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { calculateDonationEligibility, ALL_BLOOD_GROUPS } from "../lib/utils";
import { useMCP } from "../contexts/MCPContext";
import { db } from "../lib/firebase";
import { collection, addDoc, updateDoc, query, where, getDocs, onSnapshot, doc, serverTimestamp, setDoc, deleteDoc, increment } from "firebase/firestore";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

import pecLogo from "../assets/college logo copy.jpeg";
import yrcLogo from "../assets/yrc logo.png";
import appLogo from "../assets/app logo copy.png";

import slide1 from "../assets/WhatsApp Image 2026-08-31 at 12.13.29 PM.jpeg";
import slide2 from "../assets/WhatsApp Image 2026-08-31 at 12.13.29 PM (1).jpeg";
import slide3 from "../assets/WhatsApp Image 2026-09-01 at 8.11.41 AM (1).jpeg";
import slide4 from "../assets/WhatsApp Image 2026-09-01 at 8.11.41 AM (2).jpeg";
import slide5 from "../assets/WhatsApp Image 2026-09-01 at 8.11.39 AM.jpeg";
import slide6 from "../assets/WhatsApp Image 2026-09-01 at 8.11.39 AM (1).jpeg";
import slide7 from "../assets/WhatsApp Image 2026-09-01 at 8.11.40 AM.jpeg";
import slide8 from "../assets/WhatsApp Image 2026-09-01 at 8.11.40 AM (1).jpeg";
import slide9 from "../assets/WhatsApp Image 2026-09-01 at 8.11.40 AM (2).jpeg";
import slide10 from "../assets/WhatsApp Image 2026-09-01 at 8.11.41 AM.jpeg";
import slide11 from "../assets/WhatsApp Image 2026-09-01 at 8.13.41 AM.jpeg";

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

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const slides = [
    { src: slide1,  alt: "Save Lives" },
    { src: slide2,  alt: "Be a Hero" },
    { src: slide3,  alt: "Every Drop Counts" },
    { src: slide4,  alt: "Join LifeLink" },
    { src: slide5,  alt: "Real-Time Matching" },
    { src: slide6,  alt: "Verified Donors" },
    { src: slide7,  alt: "Emergency Response" },
    { src: slide8,  alt: "Community of Hope" },
    { src: slide9,  alt: "One Donation" },
    { src: slide10, alt: "Multiple Lives", pad: false },
    { src: slide11, alt: "Be a Hero",     pad: true  },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-[2.5rem] shadow-2xl" style={{ aspectRatio: "4/3", border: "1.5px solid rgba(220,38,38,0.12)" }}>
      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0">
          {slides[current].src ? (
            slides[current].pad ? (
              <img src={slides[current].src} alt={slides[current].alt} className="h-full w-full object-cover object-top" />
            ) : (
              <img src={slides[current].src} alt={slides[current].alt} className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ background: "linear-gradient(135deg, #fee2e2, #fef3c7)" }}>
              <div className="text-center">
                <Droplets size={48} className="mx-auto text-red-300 mb-2" />
                <p className="text-sm font-medium text-slate-400">{slides[current].alt}</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 flex-wrap px-4">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{ width: i === current ? 20 : 6, height: 6, background: i === current ? "#dc2626" : "rgba(255,255,255,0.6)" }} />
        ))}
      </div>
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-28 pb-16 flex items-center" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>
      <Particles />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center w-full">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex-1">
          <motion.h1 variants={fadeUp} custom={0} className="mb-6 text-5xl font-black leading-none tracking-tight text-gray-900 md:text-6xl lg:text-7xl" style={{ fontFamily: "var(--font-heading)" }}>
            DONATE<br />
            <span style={{ background: "linear-gradient(135deg, #d4a017 0%, #dc2626 55%, #d4a017 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              YOUR BLOOD
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={1} className="mb-10 max-w-md text-lg leading-relaxed text-slate-500">
            Connect with donors, track supply, and save lives in real-time.
          </motion.p>

          <motion.div variants={fadeUp} custom={2} className="flex flex-col gap-4 sm:flex-row">
            <motion.button whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(220,38,38,0.35)" }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/role-selection")}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-500">
              <Droplets size={18} /> Donate Blood
            </motion.button>
            <motion.button whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(212,160,23,0.25)" }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/role-selection")}
              className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-amber-400 px-8 py-4 text-base font-semibold text-amber-600 transition-colors hover:bg-amber-50"
              style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
              <Heart size={18} /> Join Now
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="flex-1 w-full">
          {/* Glow ring behind the box */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2.5rem] opacity-60 blur-2xl pointer-events-none"
              style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.35) 0%, rgba(212,160,23,0.25) 100%)" }} />
            <div className="absolute -inset-1 rounded-[2rem] opacity-40 pointer-events-none"
              style={{ boxShadow: "0 0 40px 8px rgba(220,38,38,0.2), 0 0 80px 16px rgba(212,160,23,0.1)" }} />
            <HeroSlider />
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
  const [donorCount, setDonorCount] = useState(0);
  const [livesSavedCount, setLivesSavedCount] = useState(0);

  useEffect(() => {
    // 1. Real-time subscription to active donors / users
    const usersQuery = query(collection(db, "users"));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const activeDonors = snapshot.docs.filter((docSnap) => {
        const data = docSnap.data();
        const role = String(data.role || "").toLowerCase();
        const name = String(data.displayName || data.name || "").toLowerCase();
        const email = String(data.email || "").toLowerCase();
        if (data.isAdmin || role.includes("admin") || email.includes("admin") || name.includes("admin")) return false;
        return true;
      });
      setDonorCount(activeDonors.length);
    }, (error) => {
      console.error("Error listening to active donors:", error);
    });

    // 2. Real-time subscription to completed blood requests (Lives Saved)
    const requestsQuery = query(collection(db, "requests"), where("status", "==", "completed"));
    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      setLivesSavedCount(snapshot.size);
    }, (error) => {
      console.error("Error listening to completed requests:", error);
    });

    return () => {
      unsubUsers();
      unsubRequests();
    };
  }, []);

  const stats = [
    { value: donorCount, suffix: donorCount > 0 ? "+" : "", label: "Active Donors" },
    { value: livesSavedCount, suffix: livesSavedCount > 0 ? "+" : "", label: "Lives Saved" },
  ];

  return (
    <section className="py-12" style={{ background: "rgba(255,255,255,0.9)", borderTop: "1px solid rgba(148,163,184,0.15)", borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
      <div className="mx-auto flex flex-col items-center max-w-4xl px-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live Real-Time Data
        </div>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          className="flex justify-center gap-16 sm:gap-24 w-full">
          {stats.map((s, i) => <StatItem key={s.label} {...s} delay={i} />)}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", title: "Register & Verify", desc: "Create your profile, verify your identity, and set your blood group." },
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
  const isSmartMatching = title === "Smart Matching";

  return (
    <motion.div variants={fadeUp} custom={delay}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(212,160,23,0.15)" }}
      className="rounded-3xl p-8 transition-all duration-300"
      style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(148,163,184,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
      <motion.div
        className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        animate={isSmartMatching ? { rotate: 360 } : {}}
        transition={isSmartMatching ? { duration: 3, repeat: Infinity, ease: "linear" } : {}}
        style={{ background: `${iconColor}15`, border: `1px solid ${iconColor}30` }}>
        <Icon size={22} style={{ color: iconColor }} />
      </motion.div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
    </motion.div>
  );
}

function Features() {
  const cards = [
    { icon: Zap, iconColor: "#d4a017", title: "Smart Matching", desc: "We match blood types, location, and urgency in milliseconds for the fastest possible connection." },
    { icon: MapPin, iconColor: "#dc2626", title: "Real-Time Tracking", desc: "Full transparency from request to delivery." },
    { icon: ShieldCheck, iconColor: "#d4a017", title: "Verified Donors", desc: "Every donor is verified and health-screened. You can trust who shows up." },
    { icon: Bell, iconColor: "#dc2626", title: "Emergency Alerts", desc: "Instant push alerts to nearby donors the moment a critical request is posted." },
  ];
  return (
    <section className="py-24 px-6" style={{ background: "linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)" }}>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="mx-auto max-w-5xl">
        <motion.div variants={fadeUp} className="mb-14 text-center">
          <h2 className="text-4xl font-bold text-gray-900 md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>Why Choose LifeLink?</h2>
          <p className="mt-4 text-slate-500">Engineered for emergencies. Built for humanity.</p>
        </motion.div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => <FeatureCard key={c.title} {...c} delay={i} />)}
        </div>
      </motion.div>
    </section>
  );
}

// All 19 Blood Groups Definition
const bloodInfo = {
  "O-": { label: "Universal Donor", category: "Standard", canGiveTo: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], canReceiveFrom: ["O-"] },
  "O+": { label: "Most Common Type", category: "Standard", canGiveTo: ["O+", "A+", "B+", "AB+"], canReceiveFrom: ["O-", "O+"] },
  "A-": { label: "Rare Type", category: "Standard", canGiveTo: ["A-", "A+", "AB-", "AB+"], canReceiveFrom: ["O-", "A-"] },
  "A+": { label: "High Demand Type", category: "Standard", canGiveTo: ["A+", "AB+"], canReceiveFrom: ["O-", "O+", "A-", "A+"] },
  "B-": { label: "Rare Type", category: "Standard", canGiveTo: ["B-", "B+", "AB-", "AB+"], canReceiveFrom: ["O-", "B-"] },
  "B+": { label: "High Demand Type", category: "Standard", canGiveTo: ["B+", "AB+"], canReceiveFrom: ["O-", "O+", "B-", "B+"] },
  "AB-": { label: "Rare Type", category: "Standard", canGiveTo: ["AB-", "AB+"], canReceiveFrom: ["O-", "A-", "B-", "AB-"] },
  "AB+": { label: "Universal Recipient", category: "Standard", canGiveTo: ["AB+"], canReceiveFrom: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] },

  "A1+": { label: "A Subgroup (A+ Compatible)", category: "Subgroups", canGiveTo: ["A1+", "A+", "A1B+", "AB+"], canReceiveFrom: ["A1+", "A1-", "A2+", "A2-", "O+", "O-"] },
  "A1-": { label: "A Subgroup (Rh Negative)", category: "Subgroups", canGiveTo: ["A1+", "A1-", "A+", "A-", "A1B+", "A1B-", "AB+", "AB-"], canReceiveFrom: ["A1-", "A2-", "O-"] },
  "A2+": { label: "A Subgroup (A+ Compatible)", category: "Subgroups", canGiveTo: ["A1+", "A2+", "A+", "A1B+", "A2B+", "AB+"], canReceiveFrom: ["A2+", "A2-", "O+", "O-"] },
  "A2-": { label: "A Subgroup (Rh Negative)", category: "Subgroups", canGiveTo: ["A1+", "A1-", "A2+", "A2-", "A+", "A-", "A1B+", "A1B-", "A2B+", "A2B-", "AB+", "AB-"], canReceiveFrom: ["A2-", "O-"] },
  "A1B+": { label: "Rare AB Subgroup", category: "Subgroups", canGiveTo: ["A1B+", "AB+"], canReceiveFrom: ["A1+", "A1-", "A2+", "A2-", "B+", "B-", "O+", "O-", "A1B+", "A1B-", "A2B+", "A2B-", "AB+", "AB-"] },
  "A1B-": { label: "Very Rare AB Subgroup", category: "Subgroups", canGiveTo: ["A1B+", "A1B-", "AB+", "AB-"], canReceiveFrom: ["A1-", "A2-", "B-", "O-", "A1B-", "A2B-", "AB-"] },
  "A2B+": { label: "Rare AB Subgroup", category: "Subgroups", canGiveTo: ["A1B+", "A2B+", "AB+"], canReceiveFrom: ["A2+", "A2-", "B+", "B-", "O+", "O-", "A2B+", "A2B-"] },
  "A2B-": { label: "Very Rare AB Subgroup", category: "Subgroups", canGiveTo: ["A1B+", "A1B-", "A2B+", "A2B-", "AB+", "AB-"], canReceiveFrom: ["A2-", "B-", "O-", "A2B-"] },

  "Bombay Blood Group": { label: "Extremely Rare (hh Antigen)", category: "Rare Phenotypes", canGiveTo: ["Bombay", "O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], canReceiveFrom: ["Bombay Blood Group"] },
  "INRA": { label: "Ultra-Rare Indian Phenotype", category: "Rare Phenotypes", canGiveTo: ["INRA", "Compatible Rare Donors"], canReceiveFrom: ["INRA"] },
  "Rh-null": { label: "Golden Blood (Universal Rh)", category: "Rare Phenotypes", canGiveTo: ["Rh-null", "All Rh Negative / Positive Types"], canReceiveFrom: ["Rh-null"] }
};

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
          <div className="inline-flex items-center gap-2 rounded-full bg-red-100/80 px-4 py-1.5 text-xs font-bold text-red-600 mb-4">
            <Sparkles size={14} /> Medical Compatibility Matrix
          </div>
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
                className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-all duration-200 ${isActive
                    ? "bg-slate-900 text-white shadow-md scale-105"
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
                className="rounded-2xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200"
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
            <div className="rounded-3xl p-6 sm:p-8 text-left" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(220,38,38,0.15)", boxShadow: "0 12px 40px rgba(220,38,38,0.08)" }}>
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
    <section className="py-24 px-6" style={{ background: "linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)" }}>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="mx-auto max-w-4xl text-center">
        <motion.p variants={fadeUp} className="mb-12 text-base font-semibold tracking-[0.2em] text-slate-500 uppercase">Trusted & Backed By</motion.p>
        <motion.div variants={fadeUp} custom={1} className="flex flex-col items-center justify-center gap-16 sm:flex-row sm:gap-20">
          {[
            {
              code: "PEC",
              label: "Panimalar Engineering College",
              color: "#dc2626",
              logo: pecLogo,
            },
            {
              code: "YRC",
              label: "Youth Red Cross",
              color: "#d4a017",
              logo: yrcLogo,
            },
          ].map((org) => (
            <div key={org.code} className="flex flex-col items-center gap-4">
              <img src={org.logo} alt={`${org.code} logo`} className="h-28 w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
              <span className="text-base font-medium text-slate-600">{org.label}</span>
            </div>
          ))}
        </motion.div>
        <motion.p variants={fadeUp} custom={2} className="mt-12 text-base italic text-slate-500">Official blood donation initiative of Panimalar Engineering College</motion.p>
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

function Footer() {
  return (
    <>
      {/* Main Footer */}
      <footer style={{ background: "#0f0505" }}>
        <div className="mx-auto max-w-7xl px-10 py-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand - spans 2 cols */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <img src={appLogo} alt="LifeLink" className="h-24 w-auto object-contain" />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">Connecting blood donors and recipients in real time.<br />Every second counts.</p>
            <div className="flex gap-3 mt-5">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-slate-400 hover:text-pink-400 transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>ig</a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>in</a>
              <a href="mailto:hello@lifelink.app" className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>@</a>
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
              <li className="text-sm text-slate-400">📧 hello@lifelink.app</li>
              <li className="text-sm text-slate-400">📞 +91 98765 43210</li>
              <li className="text-sm text-slate-400">📍 Chennai, Tamil Nadu</li>
            </ul>
          </div>

          {/* Quote */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Our Purpose</p>
            <div className="rounded-2xl p-4" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)" }}>
              <p className="text-sm italic leading-relaxed text-slate-300">
                "You don't need to be a doctor to save lives — just roll up your sleeve."
              </p>
              <p className="mt-3 text-xs font-bold text-amber-400">Every blood donor is a hero. </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t px-10 py-5 flex items-center justify-center text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-slate-600">© 2026 LifeLink. All rights reserved.</p>
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

  // Admin View check
  if (userRole === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }

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
      <Footer />
      <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </div>
  );
}

// Helper Component for Admin's Own Requests (Kept for compatibility)
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
              value={code}
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
