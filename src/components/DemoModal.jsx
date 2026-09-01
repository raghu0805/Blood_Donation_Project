import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Send, Bell, Heart, MapPin, CheckCircle2, Phone, ShieldCheck, 
    Play, Pause, ChevronLeft, ChevronRight, Zap, Users, CheckCheck, 
    Clock, Sparkles, MessageSquare, Radio 
} from 'lucide-react';
import { Button } from './Button';

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
        setScene((prev) => (prev < SCENES_DATA.length - 1 ? prev + 1 : 0));
    }, []);

    const handlePrev = useCallback(() => {
        setScene((prev) => (prev > 0 ? prev - 1 : SCENES_DATA.length - 1));
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#0a0f1c] text-white w-full max-w-5xl h-[90vh] sm:h-auto sm:max-h-[88vh] md:aspect-video rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-[0_0_60px_-15px_rgba(230,0,38,0.4)] relative flex flex-col border border-white/10 my-auto"
            >
                {/* Header & Controls Bar */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/5 relative z-30 bg-slate-950/40 backdrop-blur-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                            <span className="relative flex h-2 w-2">
                                <span className={`absolute inline-flex h-full w-full rounded-full bg-red-500 ${isPlaying ? 'animate-ping opacity-75' : ''}`} />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-red-400 uppercase">
                                Interactive Demo
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium hidden xs:inline-block">
                            Step {scene + 1} of {SCENES_DATA.length}
                        </span>
                    </div>

                    {/* Interactive Playback Controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-all text-slate-300 hover:text-amber-400 border border-white/10 text-xs font-semibold flex items-center gap-1"
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-amber-400 fill-amber-400" />}
                            <span className="hidden sm:inline text-[11px]">{isPlaying ? 'Pause' : 'Play'}</span>
                        </button>

                        <button
                            onClick={handlePrev}
                            title="Previous Step"
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-all text-slate-300 hover:text-white border border-white/10"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleNext}
                            title="Next Step"
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-all text-slate-300 hover:text-white border border-white/10"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="w-px h-5 bg-slate-800 mx-1" />

                        <button 
                            onClick={onClose}
                            aria-label="Close modal"
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 hover:border-red-500/30 transition-all text-slate-300 hover:text-red-400 border border-white/10"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Top Animated Progress Bar */}
                <div className="w-full h-1 bg-slate-900 relative z-20 overflow-hidden">
                    <motion.div
                        key={`${scene}-${isPlaying}`}
                        className="h-full bg-gradient-to-r from-amber-400 via-red-500 to-red-600"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: isPlaying ? 5.5 : 0, ease: "linear" }}
                    />
                </div>

                {/* Creative Background Ambient Glows */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25 sm:opacity-40">
                    <div className="absolute -top-[15%] -left-[10%] w-[55%] aspect-square rounded-full bg-red-600/30 blur-[110px]" />
                    <div className="absolute -bottom-[15%] -right-[10%] w-[55%] aspect-square rounded-full bg-amber-500/25 blur-[110px]" />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 relative z-10 overflow-y-auto min-h-0">
                    <div className="flex-1 w-full flex items-center justify-center py-2 sm:py-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={scene}
                                initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                                className="w-full flex items-center justify-center"
                            >
                                {scenes[scene]}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Interactive Stepper Navigation Display */}
                    <div className="w-full max-w-2xl px-2 sm:px-6 mt-3 sm:mt-5 mb-1">
                        <div className="flex justify-between relative">
                            {/* Connector Line */}
                            <div className="absolute top-4 sm:top-5 left-0 w-full h-0.5 bg-slate-800 -z-10" />
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
                                                backgroundColor: isActive ? '#dc2626' : isPassed ? '#991b1b' : '#1e293b',
                                                borderColor: isActive ? '#f59e0b' : isPassed ? '#ef4444' : 'rgba(255,255,255,0.1)'
                                            }}
                                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all border shadow-lg ${
                                                isActive ? 'text-white shadow-red-600/40 ring-2 ring-amber-400/50' : isPassed ? 'text-white' : 'text-slate-400 hover:border-slate-600'
                                            }`}
                                        >
                                            {isPassed ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />}
                                        </motion.div>
                                        <span className={`text-[9px] sm:text-[11px] font-semibold tracking-wider uppercase transition-colors ${
                                            isActive ? 'text-amber-400 font-bold' : isPassed ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'
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
    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 max-w-4xl w-full py-2 sm:py-0">
            <div className="relative group shrink-0">
                {/* Mock Phone Frame */}
                <div className="w-[200px] h-[340px] sm:w-[230px] sm:h-[400px] bg-slate-950 rounded-[2.4rem] sm:rounded-[2.8rem] border-4 border-slate-800 shadow-2xl overflow-hidden relative p-1.5 ring-4 ring-red-500/20">
                    {/* Dynamic Island Notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-20 bg-black rounded-full z-30 flex items-center justify-between px-2">
                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                    </div>

                    <div className="h-full w-full bg-[#0d1322] rounded-[2rem] sm:rounded-[2.3rem] overflow-hidden flex flex-col border border-white/5 relative">
                        {/* Status Bar */}
                        <div className="pt-2 px-4 flex justify-between items-center text-[9px] text-slate-400 font-semibold z-20">
                            <span>9:41 AM</span>
                            <div className="flex items-center gap-1">
                                <Radio className="w-2.5 h-2.5 text-red-500 animate-pulse" />
                                <span>5G</span>
                            </div>
                        </div>

                        {/* App Header */}
                        <div className="h-9 bg-gradient-to-r from-red-700 to-red-600 p-2 px-3 flex items-center justify-between mt-1">
                            <span className="text-[10px] font-black text-white tracking-wide">LIFELINK SOS</span>
                            <span className="text-[8px] bg-white/20 text-white px-1.5 py-0.5 rounded font-bold">LIVE</span>
                        </div>

                        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                            <div className="relative my-1 w-11 h-11 sm:w-13 sm:h-13 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                                <Heart className="text-red-500 fill-red-500 w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                                <div className="absolute inset-0 rounded-full border border-red-500/40 animate-ping" />
                            </div>

                            <div className="space-y-2 sm:space-y-2.5">
                                <div className="p-2.5 rounded-xl border border-red-500/30 bg-red-950/40 space-y-1.5 backdrop-blur-sm">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[8px] sm:text-[9px] uppercase font-bold text-red-400 tracking-wider">Emergency Need</p>
                                        <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-[7px] sm:text-[8px] text-white font-black tracking-widest animate-pulse">CRITICAL</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">A+</span>
                                        <span className="text-[10px] text-amber-400 font-bold">2 Units</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-slate-300 border-t border-red-500/20 pt-1">
                                        <MapPin className="text-red-400 shrink-0 w-3 h-3" />
                                        <span className="truncate">City General Hospital</span>
                                    </div>
                                </div>

                                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[9px]">
                                    <span className="text-slate-400">Nearby Matching:</span>
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <Users className="w-2.5 h-2.5" /> 48 Donors
                                    </span>
                                </div>

                                <div className="h-7 sm:h-8 w-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shadow-lg shadow-red-900/40">
                                    Broadcasting SOS...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Animated Pulsing Radar */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] sm:w-[270px] sm:h-[270px] rounded-full border border-red-500/20 animate-ping -z-10 pointer-events-none" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 sm:space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    STEP 1: REAL-TIME EMERGENCY ENGINE
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                    Smart Demand <br/>
                    <span className="bg-gradient-to-r from-amber-400 via-red-500 to-red-500 bg-clip-text text-transparent">
                        Broadcast Engine
                    </span>
                </h2>
                <p className="text-xs sm:text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-lg mx-auto md:mx-0">
                    When an emergency request is created, our system instantly captures patient blood type, GPS coordinates, and urgency level to initiate a targeted broadcast.
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-red-400" /> Geo-Fenced Radius
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Heart className="w-3 h-3 text-amber-400" /> Compatible Match
                    </span>
                </div>
            </div>
        </div>
    );
}

function SceneWhatsApp() {
    return (
        <div className="flex flex-col md:flex-row-reverse items-center justify-center gap-6 md:gap-10 max-w-4xl w-full py-2 sm:py-0">
            <div className="relative group shrink-0">
                <div className="w-full max-w-[270px] sm:max-w-[320px] bg-[#111b21] rounded-[1.8rem] sm:rounded-[2rem] p-3.5 sm:p-4 shadow-2xl relative border border-emerald-500/30">
                    {/* WhatsApp Dark Header */}
                    <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-800">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs relative">
                            LL
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111b21]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <p className="text-white font-bold text-xs sm:text-sm truncate">LifeLink Alerts</p>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 shrink-0" />
                            </div>
                            <p className="text-emerald-400 text-[9px] sm:text-[10px] font-medium">Official WhatsApp Bot</p>
                        </div>
                    </div>
                    
                    {/* WhatsApp Message Bubble */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-[#005c4b] text-emerald-50 rounded-2xl rounded-tl-sm p-3 sm:p-4 shadow-md relative space-y-2 border border-emerald-400/20"
                    >
                        <div className="flex items-start gap-2">
                            <div className="p-1.5 bg-red-600 rounded-lg text-white shrink-0 mt-0.5 shadow">
                                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
                            </div>
                            <div className="space-y-1 text-left">
                                <p className="text-[11px] sm:text-xs font-bold text-amber-300 tracking-wide">🚨 URGENT BLOOD ALERT</p>
                                <p className="text-[10px] sm:text-[11px] leading-snug text-slate-100">
                                    Patient <span className="font-bold text-white">Rahul</span> needs <span className="text-amber-300 font-black italic underline">A+ Blood</span> at City Hospital.
                                </p>
                            </div>
                        </div>

                        <div className="pt-1.5 border-t border-emerald-400/20 flex flex-col gap-1.5">
                            <button className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] sm:text-[11px] shadow text-center transition-colors">
                                ACCEPT & CONTACT PATIENT
                            </button>
                        </div>

                        <div className="flex justify-between items-center text-[8px] text-emerald-200/70 pt-0.5">
                            <span className="font-medium">Delivered in 1.2s</span>
                            <div className="flex items-center gap-1">
                                <span>11:11 AM</span>
                                <CheckCheck className="w-3 h-3 text-cyan-300" />
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/15 blur-2xl rounded-full pointer-events-none" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 sm:space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    STEP 2: WHATSAPP AUTOMATION
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                    Mass Reach via <br/>
                    <span className="text-[#25D366]">WhatsApp API</span>
                </h2>
                <p className="text-xs sm:text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-lg mx-auto md:mx-0">
                    No manual contact calling. Nearby registered donors receive instant WhatsApp notifications with a direct one-tap response button.
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-emerald-400" /> 1.2s Delivery
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Privacy Shielded
                    </span>
                </div>
            </div>
        </div>
    );
}

function SceneResponse() {
    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 max-w-4xl w-full py-2 sm:py-0">
            <div className="relative shrink-0">
                <div className="w-[260px] h-[280px] sm:w-[290px] sm:h-[330px] bg-slate-900 rounded-[1.8rem] sm:rounded-[2rem] shadow-2xl overflow-hidden border border-slate-700/60 flex flex-col">
                    {/* Chat Header */}
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-red-600 to-amber-500 flex items-center justify-center text-white text-[10px] font-black">
                                DA
                            </div>
                            <div>
                                <span className="text-xs font-bold text-white block leading-none">Arun (Donor)</span>
                                <span className="text-[8px] text-emerald-400 font-semibold">📍 0.8 km away</span>
                            </div>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                    </div>

                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                        <div className="bg-slate-800 p-2.5 rounded-2xl rounded-tl-sm text-[10px] sm:text-[11px] max-w-[85%] text-slate-200 border border-slate-700/50">
                            Patient in ICU Room 402 at City Hospital. Urgent A+ blood needed!
                        </div>
                        
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white p-2.5 rounded-2xl rounded-tr-sm text-[10px] sm:text-[11px] max-w-[85%] ml-auto shadow-md"
                        >
                            I got the WhatsApp alert! I'm nearby and heading over now. ETA 12 mins.
                        </motion.div>

                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-1.5 px-3 rounded-xl text-[9px] font-bold w-fit mx-auto flex items-center gap-1.5 shadow-sm"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Lifesaver Donor
                        </motion.div>
                    </div>

                    <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                        <div className="flex-1 bg-slate-900 h-7 rounded-full border border-slate-800 px-3 flex items-center text-[9px] text-slate-500">
                            Type emergency message...
                        </div>
                        <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shrink-0">
                            <Send className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 sm:space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    STEP 3: SECURE CHAT & ETA
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                    Direct & Encrypted <br/>
                    <span className="bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
                        Donor Communication
                    </span>
                </h2>
                <p className="text-xs sm:text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-lg mx-auto md:mx-0">
                    Donors and patients connect instantly through encrypted messaging with live distance estimation to coordinate seamless hospital arrival.
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-blue-400" /> ID Verified
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-amber-400" /> Live ETA Tracking
                    </span>
                </div>
            </div>
        </div>
    );
}

function SceneSuccess({ onClose }) {
    return (
        <div className="text-center space-y-4 sm:space-y-6 max-w-2xl px-2 sm:px-4 py-2 sm:py-0">
            <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.9 }}
                className="relative inline-block"
            >
                <div className="absolute inset-0 bg-red-500/30 blur-3xl animate-pulse" />
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-400 via-red-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.5)] relative border border-white/20">
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-white fill-white animate-pulse" />
                </div>
                <motion.div 
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-emerald-500 p-1.5 sm:p-2 rounded-full shadow-lg border-2 sm:border-4 border-slate-900"
                >
                    <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </motion.div>
                <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 bg-amber-500 p-1.5 sm:p-2 rounded-full shadow-lg border-2 sm:border-4 border-slate-900">
                    <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
            </motion.div>

            <div className="space-y-2 sm:space-y-3">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                    Every Drop Counts, <br/>
                    <span className="bg-gradient-to-r from-amber-400 via-red-500 to-red-500 bg-clip-text text-transparent">
                        Every Life Matters!
                    </span>
                </h2>
                <p className="text-xs sm:text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-xl mx-auto">
                    By joining the <span className="text-amber-400 font-bold">LifeLink</span> network, you become part of a real-time emergency response system that saves lives every day.
                </p>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto py-1">
                <div className="p-2 sm:p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-base sm:text-xl font-black text-amber-400 block">500+</span>
                    <span className="text-[9px] sm:text-xs text-slate-400 font-medium">Active Donors</span>
                </div>
                <div className="p-2 sm:p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-base sm:text-xl font-black text-red-400 block">&lt; 5 Min</span>
                    <span className="text-[9px] sm:text-xs text-slate-400 font-medium">Avg Match Time</span>
                </div>
                <div className="p-2 sm:p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-base sm:text-xl font-black text-emerald-400 block">100%</span>
                    <span className="text-[9px] sm:text-xs text-slate-400 font-medium">Verified Identity</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-1">
                <Button 
                    size="lg" 
                    onClick={onClose}
                    className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-500 text-white text-base sm:text-lg font-bold shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] transition-all hover:scale-105 active:scale-95"
                >
                    JOIN THE NETWORK NOW
                </Button>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800">
                    <ShieldCheck className="text-emerald-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">100% FREE & VERIFIED</span>
                </div>
            </div>
        </div>
    );
}
