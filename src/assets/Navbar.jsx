import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { Heart, Droplets, Shield, Globe, Users, Star } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const patrons = [
  { name: "Dr. P. Chinnadurai", role: "Secretary", qual: "M.A., Ph.D", img: "/src/assets/chinnadurai.jpg.jpeg" },
  { name: "Dr. C. Sakthi Kumar", role: "Director", qual: "M.E., Ph.D", img: "/src/assets/sakthikuma.jpeg" },
  { name: "Mrs. C. Vijayarajeswari", role: "Director", qual: "", img: "/src/assets/vijaya.jpeg" },
  { name: "Dr. Saranya Sree Sakthi Kumar", role: "Director", qual: "", img: "/src/assets/saranya.jpeg" },
  { name: "Dr. S. Prasanna Devi", role: "Chief Academic Officer", qual: "", img: "/src/assets/cao.png" },
  { name: "Dr. K. Mani", role: "Principal", qual: "", img: "/src/assets/mani.png" },
];

const yrcPrinciples = [
  { icon: Shield, label: "Impartiality" },
  { icon: Globe, label: "Neutrality" },
  { icon: Star, label: "Independence" },
  { icon: Users, label: "Voluntary Service" },
  { icon: Droplets, label: "Unity" },
  { icon: Globe, label: "Universality" },
];

const allMembers = [
  { name: "Dr. Alvin Kalicharan", role: "Mentor", img: "/src/assets/alvin.jpg", desc: "Expert mentor guiding the LifeLink initiative with industry insight.", linkedin: "#", mail: "mailto:alvin@pec.edu.in", github: "#" },
  { name: "Arivumathy S", role: "Team Lead", img: "/src/assets/arivumathy.jpeg", desc: "Leading the team with vision, coordination and strategic direction.", linkedin: "#", mail: "mailto:arivumathy@pec.edu.in", github: "#" },
  { name: "Raghu R", role: "Lead Developer", img: "/src/assets/raghu.jpeg", objPos: "center 20%", desc: "Architecting the core systems and backend logic of LifeLink.", linkedin: "#", mail: "mailto:raghu@pec.edu.in", github: "#" },
  { name: "Prasanna R", role: "Lead Developer", img: "/src/assets/prassana.jpeg", objPos: "center center", zoom: "150%", desc: "Building robust features and seamless system integrations.", linkedin: "#", mail: "mailto:prasanna@pec.edu.in", github: "#" },
  { name: "Fathima Safana A", role: "UI/UX Design", img: "/src/assets/safana.jpeg", objPos: "center 30%", desc: "Crafting the visual identity and user experience of LifeLink.", linkedin: "#", mail: "mailto:safana@pec.edu.in", github: "#" },
  { name: "Reneeshwaran S", role: "Workflow", img: "/src/assets/reneeshwaran.jpeg", desc: "Managing project flow, documentation and timely delivery.", linkedin: "#", mail: "mailto:reneeshwaran@pec.edu.in", github: "#" },
];

function PatronCard({ name, role, qual, img, i }) {
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const color = i % 2 === 0 ? "#dc2626" : "#d4a017";
  const color2 = i % 2 === 0 ? "#d4a017" : "#dc2626";

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10, scale: 1.03, rotateY: 3 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden rounded-3xl p-5 text-center cursor-pointer"
      style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", border: `1px solid ${hovered ? color + "55" : "rgba(148,163,184,0.12)"}`, boxShadow: hovered ? `0 20px 48px ${color}25, 0 4px 16px rgba(0,0,0,0.06)` : "0 4px 20px rgba(0,0,0,0.04)", transition: "border 0.3s, box-shadow 0.4s", transformStyle: "preserve-3d" }}>

      {/* Spotlight radial glow following mouse */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
        style={{ opacity: hovered ? 1 : 0, background: `radial-gradient(circle 100px at ${mouse.x}% ${mouse.y}%, ${color}28 0%, transparent 70%)` }} />

      {/* Shimmer sweep on enter */}
      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={hovered ? { x: "200%", opacity: [0, 0.4, 0] } : { x: "-100%", opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0 -skew-x-12"
        style={{ background: `linear-gradient(90deg, transparent, ${color}22, transparent)`, width: "60%" }} />

      {/* Top accent line */}
      <motion.div
        animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 left-0 right-0 h-0.5 rounded-full origin-left"
        style={{ background: `linear-gradient(90deg, ${color}, ${color2})` }} />

      {/* Photo */}
      <div className="relative mx-auto mb-3 h-20 w-20">
        <motion.div
          animate={{ scale: hovered ? 1.08 : 1, boxShadow: hovered ? `0 12px 32px ${color}44` : "0 4px 12px rgba(0,0,0,0.1)" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="h-20 w-20 overflow-hidden rounded-full"
          style={{ border: `2.5px solid ${hovered ? color : "rgba(148,163,184,0.2)"}`, transition: "border 0.3s" }}>
          <img src={img} alt={name} className="h-full w-full object-cover"
            onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          <div className="hidden h-full w-full items-center justify-center text-xl font-black text-white"
            style={{ background: `linear-gradient(135deg, ${color}, ${color2})` }}>
            {name.charAt(0)}
          </div>
        </motion.div>

        {/* Glow ring */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1.3 : 0.8 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 rounded-full -z-10"
          style={{ background: `radial-gradient(circle, ${color}44 0%, transparent 70%)`, filter: "blur(10px)" }} />
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 + 0.2 }}
        className="text-xs font-bold text-gray-900 leading-tight">{name}</motion.p>

      {qual && <p className="mt-0.5 text-[10px] text-slate-400">{qual}</p>}

      <motion.span
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1 + 0.3, type: "spring", stiffness: 300 }}
        animate={{ boxShadow: hovered ? `0 4px 16px ${color}44` : "none" }}
        className="mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold transition-all"
        style={{ background: hovered ? `linear-gradient(135deg, ${color}, ${color2})` : `${color}14`, color: hovered ? "#fff" : color, transition: "background 0.3s, color 0.3s" }}>
        {role}
      </motion.span>
    </motion.div>
  );
}

function TeamCard({ name, role, desc, linkedin, mail, github, img, objPos = "center center", zoom = "100%", i }) {
  const isEven = i % 2 === 0;
  const color1 = isEven ? "#dc2626" : "#d4a017";
  const color2 = isEven ? "#d4a017" : "#dc2626";

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="group relative overflow-hidden rounded-3xl p-6 text-center cursor-pointer"
      style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(220,38,38,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>

      {/* Animated gradient bg - always subtle, stronger on hover */}
      <motion.div className="absolute inset-0 rounded-3xl"
        animate={{ opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
        style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }} />

      {/* Glow border on hover */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"
        style={{ boxShadow: `inset 0 0 0 1.5px ${color1}88, 0 0 40px ${color1}30` }} />

      {/* Floating particles */}
      {[...Array(3)].map((_, j) => (
        <motion.div key={j}
          className="absolute rounded-full opacity-0 group-hover:opacity-100"
          style={{ width: 4, height: 4, background: color1, left: `${20 + j * 30}%`, top: `${10 + j * 20}%` }}
          animate={{ y: [0, -20, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: j * 0.4, ease: "easeInOut" }} />
      ))}

      {/* Avatar with always-spinning conic ring */}
      <div className="relative mx-auto mb-4 h-16 w-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-1.5 rounded-full"
          style={{ background: `conic-gradient(${color1} 0deg, transparent 120deg, ${color2} 180deg, transparent 300deg)` }} />
        <div className="absolute -inset-1.5 rounded-full" style={{ background: "white", margin: 2 }} />
        <motion.div
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
          className="relative flex h-16 w-16 items-center justify-center rounded-full text-xl font-black text-white z-10"
          style={{ background: `linear-gradient(135deg, ${color1}, ${color2})`, boxShadow: `0 8px 24px ${color1}55` }}>
          {img ? (
            <img src={img} alt={name} className="h-full w-full rounded-full object-cover" style={{ objectPosition: objPos || "center center", transform: `scale(${zoom === "100%" ? 1 : 1.5})`, transformOrigin: objPos || "center" }} />
          ) : (
            name.charAt(0)
          )}
        </motion.div>
      </div>

      {/* Name with slide-up on view */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.12 + 0.2 }}
        className="relative text-sm font-bold text-gray-900">{name}</motion.p>

      {/* Role badge with pop animation */}
      <motion.span
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.12 + 0.3, type: "spring", stiffness: 300 }}
        className="relative mt-1.5 inline-block rounded-full px-3 py-1 text-xs font-bold"
        style={{ background: `${color1}18`, color: color1 }}>
        {role}
      </motion.span>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: i * 0.12 + 0.4 }}
        className="relative mt-2 text-xs leading-relaxed text-slate-400">{desc}</motion.p>

      {/* Social links with stagger */}
      <div className="relative mt-3 flex items-center justify-center gap-2">
        {[
          { href: linkedin, label: "in", hoverColor: "#3b82f6" },
          { href: mail, label: "@", hoverColor: "#dc2626" },
          { href: github, label: "gh", hoverColor: "#111827" },
        ].map(({ href, label }, j) => (
          <motion.a key={label} href={href} target={label !== "@" ? "_blank" : undefined} rel="noreferrer"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 + 0.5 + j * 0.08 }}
            whileHover={{ scale: 1.2, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-[10px] font-bold text-slate-400 transition-colors"
            style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.15)" }}>
            {label}
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}

export default function AboutUs() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute top-1/2 -right-20 h-80 w-80 rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(212,160,23,0.35) 0%, transparent 70%)", filter: "blur(50px)" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-28 pb-20">

        {/* Hero */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="mb-16 text-center">
          <motion.p variants={fadeUp} custom={0} className="mb-3 text-xs font-bold uppercase tracking-widest text-red-400">About Us</motion.p>
          <motion.h1 variants={fadeUp} custom={1} className="text-5xl font-black text-gray-900 md:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
            Our{" "}
            <span style={{ background: "linear-gradient(135deg, #d4a017, #dc2626, #d4a017)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Mission</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
            LifeLink is an emergency blood donation platform built to connect donors and recipients in real time — reducing response time, saving lives, and building a community of hope.
          </motion.p>
        </motion.div>

        {/* Mission Cards */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: Droplets, color: "#dc2626", title: "Real-Time Matching", desc: "Connect donors and recipients instantly based on blood type, location, and urgency." },
            { icon: Heart, color: "#d4a017", title: "Save Lives", desc: "Every second counts. Our platform cuts emergency response to under 5 minutes." },
            { icon: Shield, color: "#dc2626", title: "Verified & Safe", desc: "All donors are ID-verified and health-screened for a trustworthy network." },
          ].map(({ icon: Icon, color, title, desc }, i) => (
            <motion.div key={title} variants={fadeUp} custom={i}
              whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(220,38,38,0.1)" }}
              className="rounded-3xl p-6 transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(148,163,184,0.15)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <h3 className="mb-2 text-base font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* PEC Section */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-16">
          <motion.div variants={fadeUp} className="mb-8 flex items-center gap-4">
            <div className="rounded-2xl px-2 py-1" style={{ background: "#dc2626" }}>
              <img src="/src/assets/college logo.jpeg" alt="PEC" className="h-16 w-auto object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-400">Institution</p>
              <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>Panimalar Engineering College</h2>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="rounded-3xl p-6"
            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(220,38,38,0.1)", boxShadow: "0 4px 24px rgba(220,38,38,0.04)" }}>
            <p className="text-sm leading-relaxed text-slate-600">
              Panimalar Engineering College governed by JAISAKTHI Educational Trust aims at imparting quality engineering and management education for the aspiring youth. The College is accredited by the National Board of Accreditation (NBA), New Delhi, approved by AICTE and recognized by UGC with 12(B) & 2(f) status. Located near Poonamallee, Chennai, the college is well connected covering Chennai, Kancheepuram and Thiruvallur districts. The Trust started Panimalar Engineering College in the year 2000 in accordance with the general policy of the Government of Tamil Nadu — emphasizing high priority to meet the demand for trained engineers for various industrial and development projects across India.
            </p>
          </motion.div>
        </motion.div>

        {/* YRC Section */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-16">
          <motion.div variants={fadeUp} className="mb-8 flex items-center gap-4">
            <img src="/src/assets/yrc logo.png" alt="YRC" className="h-16 w-auto object-contain" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Organization</p>
              <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>Youth Red Cross</h2>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="rounded-3xl p-6 mb-6"
            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(212,160,23,0.15)", boxShadow: "0 4px 24px rgba(212,160,23,0.04)" }}>
            <p className="text-sm leading-relaxed text-slate-600">
              The Red Cross is an international humanitarian organization that is nonpartisan and committed to helping people. With the three goals of enhancing health, preventing disease, and reducing suffering, the Red Cross Society was founded in India by an act of the Indian legislature in 1920. One of the most active groups in this society is the Youth Red Cross.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">YRC Principles</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {yrcPrinciples.map(({ icon: Icon, label }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -3, boxShadow: "0 12px 28px rgba(212,160,23,0.15)" }}
                  className="flex items-center gap-2.5 rounded-2xl px-4 py-3 transition-all"
                  style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(212,160,23,0.15)" }}>
                  <Icon size={14} style={{ color: "#d4a017" }} />
                  <span className="text-xs font-bold text-gray-700">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Patrons */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-16">
          <motion.div variants={fadeUp} className="mb-8">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-500">Leadership</p>
            <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>Our Patrons</h2>
          </motion.div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {patrons.map(({ name, role, qual, img }, i) => (
              <PatronCard key={name} name={name} role={role} qual={qual} img={img} i={i} />
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-400">The Team</p>
            <h2 className="text-3xl font-black text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>
              Built with{" "}
              <span style={{ background: "linear-gradient(135deg, #d4a017, #dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>♥</span>
              {" "}by
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {allMembers.map(({ name, role, desc, linkedin, mail, github, img, objPos }, i) => (
              <TeamCard key={name} name={name} role={role} desc={desc} linkedin={linkedin} mail={mail} github={github} img={img} objPos={objPos} i={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
