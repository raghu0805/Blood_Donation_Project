import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Send, Bell, Heart, MapPin, CheckCircle2, Phone, ShieldCheck, 
    Play, Pause, ChevronLeft, ChevronRight, Zap, Users, CheckCheck, 
    Clock, Sparkles, MessageSquare, Radio, Droplets 
} from 'lucide-react';
import { Button } from './Button';
import logo from '../assets/app logo.png';
import { ALL_BLOOD_GROUPS, BLOOD_COMPATIBILITY_INFO } from '../lib/utils';

const SCENES_DATA = [
    { id: 0, label: "Broadcast", icon: Radio },
    { id: 1, label: "WhatsApp Alert", icon: Bell },
    { id: 2, label: "Secure Chat", icon: MessageSquare },
    { id: 3, label: "Life Saved", icon: Heart }
];

export default function DemoModal({ isOpen, onClose }) {
    const [scene, setScene] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    const handleNext = useCallback(() => {
        setScene((prev) => {
            if (prev < SCENES_DATA.length - 1) {
                if (prev + 1 === SCENES_DATA.length - 1) {
                    setIsPlaying(false);
                }
                return prev + 1;
            } else {
                setIsPlaying(false);
                return prev;
            }
        });
    }, []);

    const handlePrev = useCallback(() => {
        setScene((prev) => (prev > 0 ? prev - 1 : 0));
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setScene(0);
            setIsPlaying(true);
            return;
        }

        if (!isPlaying) return;

        const timer = setInterval(() => {
            handleNext();
        }, 5500);

        return () => clearInterval(timer);
    }, [isOpen, isPlaying, handleNext]);

    if (!isOpen) return null;

    const scenes = [
        <SceneRequest key="s1" />,
        <SceneWhatsApp key="s2" />,
        <SceneResponse key="s3" />,
        <SceneSuccess key="s4" onClose={onClose} />
    ];

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-gradient-to-br from-white via-slate-50/90 to-red-50/40 text-slate-900 w-full max-w-5xl h-[92vh] sm:h-auto sm:max-h-[88vh] md:aspect-video rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(220,38,38,0.25)] relative flex flex-col border border-red-100/80 my-auto"
            >
                {/* Header & Controls Bar */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-red-100/60 relative z-30 bg-white/80 backdrop-blur-md shadow-xs">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <img src={logo} alt="LifeLink Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-red-200/80 shadow-xs shrink-0" />
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 border border-red-200/80">
                            <span className="relative flex h-2 w-2">
                                <span className={`absolute inline-flex h-full w-full rounded-full bg-red-500 ${isPlaying ? 'animate-ping opacity-75' : ''}`} />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-red-600 uppercase">
                                Live Interactive Demo
                            </span>
                        </div>
                        <span className="text-xs text-slate-500 font-semibold hidden xs:inline-block">
                            Step {scene + 1} of {SCENES_DATA.length}
                        </span>
                    </div>

                    {/* Interactive Playback Controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            title={isPlaying ? "Pause Demo" : "Play Demo"}
                            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-red-50 transition-all text-slate-700 hover:text-red-600 border border-slate-200 shadow-xs text-xs font-semibold flex items-center gap-1"
                        >
                            {isPlaying ? <Pause className="w-4 h-4 text-slate-700" /> : <Play className="w-4 h-4 text-red-600 fill-red-600" />}
                            <span className="hidden sm:inline text-[11px] font-bold">{isPlaying ? 'Pause' : 'Play'}</span>
                        </button>

                        <button
                            onClick={handlePrev}
                            title="Previous Step"
                            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-red-50 transition-all text-slate-700 hover:text-red-600 border border-slate-200 shadow-xs"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleNext}
                            title="Next Step"
                            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-red-50 transition-all text-slate-700 hover:text-red-600 border border-slate-200 shadow-xs"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="w-px h-5 bg-slate-200 mx-1" />

                        <button 
                            onClick={onClose}
                            aria-label="Close modal"
                            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-red-50 hover:border-red-200 transition-all text-slate-400 hover:text-red-600 border border-slate-200 shadow-xs"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Top Animated Progress Bar */}
                <div className="w-full h-1 bg-slate-100 relative z-20 overflow-hidden">
                    <motion.div
                        key={`${scene}-${isPlaying}`}
                        className="h-full bg-gradient-to-r from-amber-400 via-red-500 to-red-600"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: isPlaying ? 5.5 : 0, ease: "linear" }}
                    />
                </div>

                {/* Creative Background Ambient Glows */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                    <div className="absolute -top-[15%] -left-[10%] w-[55%] aspect-square rounded-full bg-red-400/15 blur-[110px]" />
                    <div className="absolute -bottom-[15%] -right-[10%] w-[55%] aspect-square rounded-full bg-amber-400/15 blur-[110px]" />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 relative z-10 overflow-y-auto min-h-0">
                    <div className="flex-1 w-full flex items-center justify-center py-2 sm:py-3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={scene}
                                initial={{ opacity: 0, y: 15, filter: 'blur(6px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -15, filter: 'blur(6px)' }}
                                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                                className="w-full flex items-center justify-center"
                            >
                                {scenes[scene]}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Interactive Stepper Navigation Display */}
                    <div className="w-full max-w-2xl px-2 sm:px-6 mt-2 sm:mt-4 mb-1">
                        <div className="flex justify-between relative">
                            {/* Connector Line */}
                            <div className="absolute top-4 sm:top-5 left-0 w-full h-0.5 bg-slate-200 -z-10" />
                            <motion.div 
                                className="absolute top-4 sm:top-5 left-0 h-0.5 bg-gradient-to-r from-amber-400 via-red-500 to-red-600 -z-10" 
                                initial={{ width: "0%" }}
                                animate={{ width: `${(scene / (SCENES_DATA.length - 1)) * 100}%` }}
                                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                            />
                            
                            {SCENES_DATA.map((item, i) => {
                                const IconComponent = item.icon;
                                const isActive = i === scene;
                                const isPassed = i < scene;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setScene(i);
                                            setIsPlaying(false);
                                        }}
                                        className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                                    >
                                        <motion.div 
                                            animate={{ 
                                                scale: isActive ? 1.15 : 1,
                                                backgroundColor: isActive ? '#dc2626' : isPassed ? '#ef4444' : '#ffffff',
                                                borderColor: isActive ? '#d4a017' : isPassed ? '#dc2626' : '#e2e8f0'
                                            }}
                                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all border shadow-sm ${
                                                isActive ? 'text-white shadow-red-500/30 ring-2 ring-amber-400/50' : isPassed ? 'text-white' : 'text-slate-400 hover:border-slate-300'
                                            }`}
                                        >
                                            {isPassed ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />}
                                        </motion.div>
                                        <span className={`text-[9px] sm:text-[11px] font-bold tracking-wider uppercase transition-colors ${
                                            isActive ? 'text-red-600' : isPassed ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'
                                        }`}>
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function SceneRequest() {
    const [selectedBlood, setSelectedBlood] = useState("B+");
    const info = BLOOD_COMPATIBILITY_INFO[selectedBlood] || BLOOD_COMPATIBILITY_INFO["A+"];

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-8 max-w-4xl w-full py-1 sm:py-0">
            <div className="relative group shrink-0">
                {/* Mock Phone Frame */}
                <div className="w-[180px] h-[310px] sm:w-[220px] sm:h-[380px] bg-slate-900 rounded-[2.2rem] sm:rounded-[2.6rem] border-4 border-slate-800 shadow-2xl overflow-hidden relative p-1.5 ring-4 ring-red-500/10">
                    {/* Notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-3.5 w-18 bg-black rounded-full z-30 flex items-center justify-between px-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                        <div className="w-1 h-1 rounded-full bg-blue-900/60" />
                    </div>

                    <div className="h-full w-full bg-slate-50 rounded-[1.8rem] sm:rounded-[2.1rem] overflow-hidden flex flex-col border border-slate-200 relative">
                        {/* Status Bar */}
                        <div className="pt-2 px-3 flex justify-between items-center text-[8px] text-slate-500 font-bold z-20">
                            <span>9:41 AM</span>
                            <div className="flex items-center gap-1">
                                <Radio className="w-2.5 h-2.5 text-red-600 animate-pulse" />
                                <span>5G</span>
                            </div>
                        </div>

                        {/* App Header */}
                        <div className="h-8 bg-gradient-to-r from-red-600 to-red-500 p-2 px-3 flex items-center justify-between mt-1 text-white shadow-xs">
                            <div className="flex items-center gap-1">
                                <img src={logo} alt="LifeLink" className="w-3.5 h-3.5 rounded-full bg-white p-0.5" />
                                <span className="text-[9px] font-black tracking-wide">LIFELINK SOS</span>
                            </div>
                            <span className="text-[7px] bg-white/25 text-white px-1.5 py-0.5 rounded font-bold">LIVE</span>
                        </div>

                        <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between">
                            <div className="relative my-1 w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto border border-red-200 shadow-xs">
                                <Heart className="text-red-600 fill-red-600 w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                                <div className="absolute inset-0 rounded-full border border-red-400/40 animate-ping" />
                            </div>

                            <div className="space-y-2">
                                <div className="p-2.5 rounded-xl border border-red-200 bg-red-50/70 space-y-1 text-left shadow-xs">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[8px] uppercase font-bold text-red-600 tracking-wider">Blood Need</p>
                                        <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-[7px] text-white font-black tracking-widest animate-pulse">EMERGENCY</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-base sm:text-lg font-black text-slate-900 truncate max-w-[120px]">{selectedBlood}</span>
                                        <span className="text-[9px] text-amber-600 font-bold">2 Units</span>
                                    </div>
                                    <p className="text-[8px] text-slate-500 font-medium italic truncate">{info?.label}</p>
                                    <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-600 border-t border-red-200/60 pt-1">
                                        <MapPin className="text-red-600 shrink-0 w-2.5 h-2.5" />
                                        <span className="truncate">City General Hospital</span>
                                    </div>
                                </div>

                                <div className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-[8px] font-semibold text-slate-700 shadow-2xs">
                                    <span>Nearby Donors:</span>
                                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                        <Users className="w-2.5 h-2.5" /> {info?.canReceiveFrom?.length * 8 + 12 || 48} Found
                                    </span>
                                </div>

                                <div className="h-7 w-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-[9px] sm:text-[10px] shadow-sm">
                                    Broadcasting SOS...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Animated Pulsing Radar */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] rounded-full border border-red-500/20 animate-ping -z-10 pointer-events-none" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 sm:space-y-3">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 border border-red-200 text-red-600 text-xs font-bold gap-1.5 shadow-2xs">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    STEP 1: REAL-TIME EMERGENCY ENGINE
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                    Smart Demand & <br/>
                    <span style={{ background: "linear-gradient(135deg, #d4a017 0%, #dc2626 55%, #d4a017 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                        Blood Type Compatibility
                    </span>
                </h2>

                {/* Interactive Blood Selector Pills Grid */}
                <div className="space-y-1.5 pt-1 text-left">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        BLOOD GROUP NEEDED
                    </p>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 max-h-[130px] overflow-y-auto p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80">
                        {ALL_BLOOD_GROUPS.map((g) => {
                            const isSelected = selectedBlood === g;
                            return (
                                <button
                                    key={g}
                                    onClick={() => setSelectedBlood(g)}
                                    className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                        isSelected
                                            ? "bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md scale-105"
                                            : "bg-white text-slate-700 hover:bg-red-50 border border-slate-200/80"
                                    }`}
                                >
                                    {g}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Live Compatibility Card */}
                {info && (
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-white/90 border border-red-100 shadow-xs text-left space-y-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Droplets className="w-3.5 h-3.5 text-red-600" />
                                <span className="text-xs font-black text-slate-900">{selectedBlood}</span>
                                <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">{info.category}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500">— {info.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="bg-red-50/70 p-2 rounded-xl border border-red-100">
                                <span className="font-bold text-red-700 block mb-0.5 uppercase text-[8px] tracking-wider">Can Donate To ({info.canGiveTo.length})</span>
                                <div className="flex flex-wrap gap-1 max-h-[45px] overflow-y-auto">
                                    {info.canGiveTo.map(g => (
                                        <span key={g} className="bg-red-600 text-white font-bold px-1.5 py-0.5 rounded text-[9px]">{g}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                                <span className="font-bold text-amber-800 block mb-0.5 uppercase text-[8px] tracking-wider">Can Receive From ({info.canReceiveFrom.length})</span>
                                <div className="flex flex-wrap gap-1 max-h-[45px] overflow-y-auto">
                                    {info.canReceiveFrom.map(g => (
                                        <span key={g} className="bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded text-[9px]">{g}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SceneWhatsApp() {
    return (
        <div className="flex flex-col md:flex-row-reverse items-center justify-center gap-5 md:gap-10 max-w-4xl w-full py-1 sm:py-0">
            <div className="relative group shrink-0">
                <div className="w-full max-w-[260px] sm:max-w-[300px] bg-[#075E54] rounded-[1.6rem] sm:rounded-[2rem] p-3.5 sm:p-4 shadow-2xl relative border border-emerald-600/30">
                    {/* WhatsApp Header */}
                    <div className="flex items-center gap-2.5 mb-2.5 pb-2 border-b border-emerald-600/40 text-white">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xs relative">
                            LL
                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-[#075E54]" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1">
                                <p className="text-white font-bold text-xs truncate">LifeLink Alerts</p>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 fill-emerald-300/30 shrink-0" />
                            </div>
                            <p className="text-emerald-100 text-[8px] font-medium">Official Emergency Channel</p>
                        </div>
                    </div>
                    
                    {/* WhatsApp Message Bubble */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-[#DCF8C6] text-gray-900 rounded-2xl rounded-tl-sm p-3 shadow-md relative space-y-2 border border-emerald-300/60"
                    >
                        <div className="flex items-start gap-2">
                            <div className="p-1.5 bg-red-600 rounded-lg text-white shrink-0 mt-0.5 shadow-2xs">
                                <Bell className="w-3.5 h-3.5 animate-bounce" />
                            </div>
                            <div className="space-y-0.5 text-left">
                                <p className="text-[10px] sm:text-[11px] font-bold text-red-600 tracking-wide">🚨 URGENT BLOOD ALERT</p>
                                <p className="text-[10px] leading-snug text-slate-800">
                                    Patient <span className="font-bold">Rahul</span> urgently needs <span className="text-red-600 font-black italic underline">A+ Blood</span> at City Hospital.
                                </p>
                            </div>
                        </div>

                        <div className="pt-1 border-t border-emerald-300/50 flex flex-col gap-1">
                            <button className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs text-center transition-colors">
                                ACCEPT & CONTACT PATIENT
                            </button>
                        </div>

                        <div className="flex justify-between items-center text-[8px] text-gray-500 pt-0.5">
                            <span className="font-semibold text-emerald-800">Delivered in 1.2s</span>
                            <div className="flex items-center gap-1">
                                <span>11:11 AM</span>
                                <CheckCheck className="w-3 h-3 text-blue-600" />
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-400/20 blur-xl rounded-full pointer-events-none" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 sm:space-y-3">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    STEP 2: WHATSAPP AUTOMATION
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                    Mass Reach via <br/>
                    <span className="text-[#25D366]">WhatsApp API</span>
                </h2>
                <p className="text-xs sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg mx-auto md:mx-0">
                    No searching manuals or phone lists. Compatible nearby donors automatically receive instant WhatsApp alerts with one-tap actions.
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                        <Clock className="w-3 h-3 text-emerald-600" /> 1.2s Instant Delivery
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Privacy Protected
                    </span>
                </div>
            </div>
        </div>
    );
}

function SceneResponse() {
    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-10 max-w-4xl w-full py-1 sm:py-0">
            <div className="relative shrink-0">
                <div className="w-[250px] h-[270px] sm:w-[280px] sm:h-[320px] bg-white rounded-[1.6rem] sm:rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
                    {/* Chat Header */}
                    <div className="p-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-red-600 to-amber-500 flex items-center justify-center text-white text-[10px] font-black">
                                DA
                            </div>
                            <div className="text-left">
                                <span className="text-xs font-bold text-slate-900 block leading-none">Arun (Donor)</span>
                                <span className="text-[8px] text-emerald-600 font-bold">📍 0.8 km away</span>
                            </div>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <Phone className="w-3 h-3" />
                        </div>
                    </div>

                    <div className="flex-1 p-3 space-y-2.5 overflow-y-auto bg-slate-50/50">
                        <div className="bg-slate-100 p-2.5 rounded-2xl rounded-tl-sm text-[10px] max-w-[85%] text-slate-800 border border-slate-200 text-left">
                            Patient in ICU Room 402 at City Hospital. Urgent A+ blood needed!
                        </div>
                        
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-r from-red-600 to-red-500 text-white p-2.5 rounded-2xl rounded-tr-sm text-[10px] max-w-[85%] ml-auto shadow-sm text-left"
                        >
                            I got the WhatsApp alert! I'm nearby and heading over now. ETA 12 mins.
                        </motion.div>

                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-1 px-2.5 rounded-xl text-[8px] font-bold w-fit mx-auto flex items-center gap-1 shadow-2xs"
                        >
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Lifesaver Donor
                        </motion.div>
                    </div>

                    <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-2">
                        <div className="flex-1 bg-slate-50 h-7 rounded-full border border-slate-200 px-3 flex items-center text-[9px] text-slate-400">
                            Type emergency message...
                        </div>
                        <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xs shrink-0">
                            <Send className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 sm:space-y-3">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold gap-1.5 shadow-2xs">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    STEP 3: SECURE CHAT & ETA
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                    Direct & Encrypted <br/>
                    <span style={{ background: "linear-gradient(135deg, #d4a017 0%, #dc2626 55%, #d4a017 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                        Donor Communication
                    </span>
                </h2>
                <p className="text-xs sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg mx-auto md:mx-0">
                    Donors and patients connect instantly through encrypted messaging with live distance estimation to coordinate arrival.
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                        <ShieldCheck className="w-3 h-3 text-blue-600" /> ID Verified
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                        <MapPin className="w-3 h-3 text-amber-500" /> Live ETA Tracking
                    </span>
                </div>
            </div>
        </div>
    );
}

function SceneSuccess({ onClose }) {
    return (
        <div className="text-center space-y-3 sm:space-y-5 max-w-2xl px-2 sm:px-4 py-1 sm:py-0">
            <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.9 }}
                className="relative inline-block"
            >
                <div className="absolute inset-0 bg-red-400/25 blur-3xl animate-pulse" />
                <div className="w-22 h-22 sm:w-28 sm:h-28 bg-gradient-to-br from-amber-400 via-red-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(220,38,38,0.35)] relative border-2 border-white">
                    <Heart className="w-10 h-10 sm:w-14 sm:h-14 text-white fill-white animate-pulse" />
                </div>
                <motion.div 
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-emerald-500 p-1.5 rounded-full shadow-md border-2 border-white"
                >
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </motion.div>
                <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 bg-amber-400 p-1.5 rounded-full shadow-md border-2 border-white">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
            </motion.div>

            <div className="space-y-1.5 sm:space-y-2">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                    Every Drop Counts, <br/>
                    <span style={{ background: "linear-gradient(135deg, #d4a017 0%, #dc2626 55%, #d4a017 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                        Every Life Matters!
                    </span>
                </h2>
                <p className="text-xs sm:text-base text-slate-600 font-medium leading-relaxed max-w-xl mx-auto">
                    By joining the <span className="text-red-600 font-bold">LifeLink</span> network, you become part of a real-time emergency response system that saves lives every day.
                </p>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto py-1">
                <div className="p-2 sm:p-3 rounded-2xl bg-white border border-slate-200/80 text-center shadow-xs">
                    <span className="text-base sm:text-xl font-black text-amber-600 block">500+</span>
                    <span className="text-[9px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Active Donors</span>
                </div>
                <div className="p-2 sm:p-3 rounded-2xl bg-white border border-slate-200/80 text-center shadow-xs">
                    <span className="text-base sm:text-xl font-black text-red-600 block">&lt; 5 Min</span>
                    <span className="text-[9px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Avg Response</span>
                </div>
                <div className="p-2 sm:p-3 rounded-2xl bg-white border border-slate-200/80 text-center shadow-xs">
                    <span className="text-base sm:text-xl font-black text-emerald-600 block">100%</span>
                    <span className="text-[9px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Verified ID</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 pt-1">
                <Button 
                    size="lg" 
                    onClick={onClose}
                    className="w-full sm:w-auto h-12 sm:h-13 px-8 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-500 text-white text-base sm:text-lg font-bold shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95"
                >
                    JOIN THE NETWORK NOW
                </Button>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <ShieldCheck className="text-emerald-600 w-4 h-4" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">100% FREE & VERIFIED</span>
                </div>
            </div>
        </div>
    );
}
