import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, X, CheckCircle, ChevronDown, Heart, Droplets, Activity, UserCheck, Pill, Wine, Baby } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const sectionIcons = {
    0: UserCheck,
    1: Activity,
    2: Droplets,
    3: Pill,
    4: Wine,
    5: Baby,
    6: Heart,
};

const sectionColors = {
    0: { accent: '#dc2626', bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.15)' },
    1: { accent: '#2563eb', bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.15)' },
    2: { accent: '#dc2626', bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.15)' },
    3: { accent: '#d97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.15)' },
    4: { accent: '#7c3aed', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.15)' },
    5: { accent: '#ec4899', bg: 'rgba(236,72,153,0.06)', border: 'rgba(236,72,153,0.15)' },
    6: { accent: '#16a34a', bg: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.15)' },
};

export function DonorDeclarationModal({ isOpen, onClose, onConfirm, isSubmitting }) {
    const { currentUser } = useAuth();
    const [checkedItems, setCheckedItems] = useState({});
    const [canSubmit, setCanSubmit] = useState(false);
    const [expandedSection, setExpandedSection] = useState(0);
    const [preferredList, setPreferredList] = useState('confirmed'); // 'confirmed' (Reserved) or 'reserve' (Emergency)

    useEffect(() => {
        if (isOpen) {
            setCheckedItems({});
            setExpandedSection(0);
        }
    }, [isOpen]);

    const isFemale = currentUser?.gender === 'Female';

    const sections = [
        {
            title: "Basic Eligibility",
            subtitle: "Mandatory requirements",
            items: [
                { id: 'age', label: "I am 18 years or older" },
                { id: 'weight', label: "My weight is 50 kg or more" },
                { id: 'healthy', label: "I feel healthy today" }
            ]
        },
        {
            title: "Current Health",
            subtitle: "How are you feeling?",
            items: [
                { id: 'no_symptoms', label: "No fever, cold, cough, or infection" },
                { id: 'hemoglobin', label: "No low hemoglobin / anemia" },
                { id: 'chronic_disease', label: "No heart, kidney disease, or cancer" },
                { id: 'epilepsy', label: "No recent fits / epilepsy" }
            ]
        },
        {
            title: "Blood Safety",
            subtitle: "Blood-borne disease screening",
            items: [
                { id: 'hiv', label: "Never had HIV / AIDS" },
                { id: 'hepatitis', label: "Never had Hepatitis B or C" },
                { id: 'syphilis', label: "Never had Syphilis" },
                { id: 'malaria', label: "No Malaria in the last 3 months" }
            ]
        },
        {
            title: "Medical History",
            subtitle: "Recent procedures & treatments",
            items: [
                { id: 'surgery', label: "No surgery in the last 6 months" },
                { id: 'blood_loss', label: "No major blood loss or accident recently" },
                { id: 'vaccination', label: "No vaccination in the last 14–28 days" },
                { id: 'tattoo', label: "No tattoo / piercing in the last 6 months" }
            ]
        },
        {
            title: "Lifestyle",
            subtitle: "Recent substance intake",
            items: [
                { id: 'alcohol', label: "No alcohol in the last 24 hours" },
                { id: 'drugs', label: "I do not use injectable drugs" }
            ]
        }
    ];

    if (isFemale) {
        sections.push({
            title: "Female Health",
            subtitle: "Additional screening",
            items: [
                { id: 'pregnant', label: "I am not pregnant" },
                { id: 'breastfeeding', label: "I am not breastfeeding" },
                { id: 'menstruation', label: "No heavy menstruation today" }
            ]
        });
    }

    sections.push({
        title: "Previous Donation",
        subtitle: "Donation cooldown check",
        items: [{
            id: 'prev_donation',
            label: isFemale
                ? "I have not donated blood in the last 4 months"
                : "I have not donated blood in the last 3 months"
        }]
    });

    const allIds = sections.flatMap(s => s.items.map(i => i.id));
    const isAllSelected = allIds.length > 0 && allIds.every(id => checkedItems[id]);
    const completedCount = allIds.filter(id => checkedItems[id]).length;
    const progress = allIds.length > 0 ? (completedCount / allIds.length) * 100 : 0;

    useEffect(() => {
        setCanSubmit(allIds.every(id => checkedItems[id]));
    }, [checkedItems]);

    const handleCheck = (id) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setCheckedItems({});
        } else {
            const newChecked = {};
            allIds.forEach(id => { newChecked[id] = true; });
            setCheckedItems(newChecked);
        }
    };

    const getSectionProgress = (section) => {
        const total = section.items.length;
        const done = section.items.filter(i => checkedItems[i.id]).length;
        return { total, done, complete: done === total };
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>

                <motion.div
                    initial={{ scale: 0.92, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.92, y: 20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="w-full max-w-lg flex flex-col max-h-[90vh] rounded-3xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.98)", boxShadow: "0 32px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(220,38,38,0.08)" }}>

                    {/* Header */}
                    <div className="relative px-6 pt-6 pb-4 shrink-0" style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.04) 0%, rgba(212,160,23,0.04) 100%)" }}>
                        <button onClick={onClose}
                            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                style={{ background: "linear-gradient(135deg, #dc2626, #d4a017)", boxShadow: "0 4px 12px rgba(220,38,38,0.25)" }}>
                                <ShieldCheck size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>Donor Self-Declaration</h2>
                                <p className="text-xs text-slate-400">Please confirm your eligibility to donate safely</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span style={{ color: progress >= 100 ? '#16a34a' : '#94a3b8' }}>
                                    {progress >= 100 ? '✓ All confirmed' : `${completedCount} of ${allIds.length} confirmed`}
                                </span>
                                <span style={{ color: progress >= 100 ? '#16a34a' : '#d97706' }}>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(148,163,184,0.12)" }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    style={{ background: progress >= 100 ? "#16a34a" : "linear-gradient(90deg, #dc2626, #d4a017)" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Warning Banner */}
                    <div className="mx-5 mt-3 mb-1 flex items-start gap-2.5 rounded-2xl px-4 py-3"
                        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                            <strong>Important:</strong> False information puts both you and the patient at risk. Please answer truthfully.
                        </p>
                    </div>

                    {/* Select All */}
                    <div className="mx-5 mt-3 mb-1 flex justify-end">
                        <button onClick={handleSelectAll}
                            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:shadow-sm"
                            style={{
                                background: isAllSelected ? "rgba(22,163,74,0.08)" : "rgba(148,163,184,0.08)",
                                border: `1px solid ${isAllSelected ? "rgba(22,163,74,0.2)" : "rgba(148,163,184,0.15)"}`,
                                color: isAllSelected ? "#16a34a" : "#64748b"
                            }}>
                            {isAllSelected ? <CheckCircle size={13} /> : <div className="h-3.5 w-3.5 rounded border border-slate-300" />}
                            {isAllSelected ? 'All Selected' : 'Select All'}
                        </button>
                    </div>

                    {/* Sections - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2" style={{ scrollbarWidth: "thin" }}>
                        {sections.map((section, idx) => {
                            const { done, total, complete } = getSectionProgress(section);
                            const isExpanded = expandedSection === idx;
                            const colors = sectionColors[idx] || sectionColors[0];
                            const SectionIcon = sectionIcons[idx] || ShieldCheck;

                            return (
                                <div key={idx} className="rounded-2xl overflow-hidden transition-all"
                                    style={{
                                        border: `1px solid ${complete ? 'rgba(22,163,74,0.2)' : isExpanded ? colors.border : 'rgba(148,163,184,0.1)'}`,
                                        background: complete ? 'rgba(22,163,74,0.03)' : 'transparent'
                                    }}>

                                    {/* Section Header */}
                                    <button onClick={() => setExpandedSection(isExpanded ? -1 : idx)}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-left transition-all hover:bg-slate-50/50">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                                            style={{ background: complete ? 'rgba(22,163,74,0.1)' : colors.bg }}>
                                            {complete
                                                ? <CheckCircle size={16} className="text-green-600" />
                                                : <SectionIcon size={16} style={{ color: colors.accent }} />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-800">{section.title}</span>
                                                <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
                                                    style={{
                                                        background: complete ? 'rgba(22,163,74,0.1)' : 'rgba(148,163,184,0.08)',
                                                        color: complete ? '#16a34a' : '#94a3b8'
                                                    }}>
                                                    {done}/{total}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{section.subtitle}</p>
                                        </div>
                                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                            <ChevronDown size={16} className="text-slate-300" />
                                        </motion.div>
                                    </button>

                                    {/* Section Items */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                                className="overflow-hidden">
                                                <div className="px-4 pb-3 space-y-1.5">
                                                    {section.items.map(item => {
                                                        const checked = !!checkedItems[item.id];
                                                        return (
                                                            <label key={item.id}
                                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all"
                                                                style={{
                                                                    background: checked ? 'rgba(22,163,74,0.05)' : 'rgba(248,250,252,0.6)',
                                                                    border: `1px solid ${checked ? 'rgba(22,163,74,0.15)' : 'rgba(148,163,184,0.1)'}`,
                                                                }}>
                                                                {/* Custom Checkbox */}
                                                                <div className="shrink-0">
                                                                    <motion.div
                                                                        className="flex h-5 w-5 items-center justify-center rounded-lg transition-all"
                                                                        style={{
                                                                            background: checked ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'white',
                                                                            border: checked ? 'none' : '2px solid rgba(148,163,184,0.3)',
                                                                            boxShadow: checked ? '0 2px 6px rgba(22,163,74,0.25)' : 'none'
                                                                        }}
                                                                        whileTap={{ scale: 0.85 }}>
                                                                        {checked && (
                                                                            <motion.svg
                                                                                initial={{ scale: 0, opacity: 0 }}
                                                                                animate={{ scale: 1, opacity: 1 }}
                                                                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                                                                width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                            </motion.svg>
                                                                        )}
                                                                    </motion.div>
                                                                    <input type="checkbox" className="sr-only"
                                                                        checked={checked}
                                                                        onChange={() => handleCheck(item.id)} />
                                                                </div>
                                                                <span className={`text-[13px] leading-tight transition-colors ${checked ? 'text-green-700 font-medium' : 'text-slate-600'}`}>
                                                                    {item.label}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 px-6 py-4 flex flex-col gap-3"
                        style={{ background: "rgba(248,250,252,0.8)", borderTop: "1px solid rgba(148,163,184,0.1)" }}>

                        <div className="mb-2">
                            <p className="text-xs font-bold text-slate-700 mb-2">Preferred Donation List:</p>
                            <div className="flex gap-3">
                                <label className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold cursor-pointer transition-all ${preferredList === 'confirmed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-500 border-slate-200'} border`}
                                    onClick={() => setPreferredList('confirmed')}>
                                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${preferredList === 'confirmed' ? 'border-red-500' : 'border-slate-300'}`}>
                                        {preferredList === 'confirmed' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                    </div>
                                    Reserved List (Primary)
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold cursor-pointer transition-all ${preferredList === 'reserve' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-500 border-slate-200'} border`}
                                    onClick={() => setPreferredList('reserve')}>
                                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${preferredList === 'reserve' ? 'border-amber-500' : 'border-slate-300'}`}>
                                        {preferredList === 'reserve' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                    </div>
                                    Emergency List (Standby)
                                </label>
                            </div>
                        </div>

                        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                            By confirming, I certify that all the above declared information is true and accurate to the best of my knowledge.
                        </p>

                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                onClick={onClose}
                                className="flex-1 rounded-2xl py-3.5 text-sm font-bold text-slate-500 transition-all hover:text-red-500 hover:bg-red-50"
                                style={{ border: "1px solid rgba(148,163,184,0.2)" }}>
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={(canSubmit && !isSubmitting) ? { scale: 1.02, boxShadow: "0 8px 24px rgba(220,38,38,0.3)" } : {}}
                                whileTap={(canSubmit && !isSubmitting) ? { scale: 0.97 } : {}}
                                onClick={() => onConfirm(preferredList)}
                                disabled={!canSubmit || isSubmitting}
                                className={`flex-[2] flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all ${(!canSubmit || isSubmitting) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                style={{
                                    background: canSubmit ? "linear-gradient(135deg, #dc2626, #d4a017)" : "#cbd5e1",
                                    boxShadow: (canSubmit && !isSubmitting) ? "0 4px 16px rgba(220,38,38,0.2)" : "none"
                                }}>
                                <ShieldCheck size={16} />
                                {isSubmitting ? 'Processing...' : canSubmit ? 'Confirm & Proceed' : `Complete All Items (${completedCount}/${allIds.length})`}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
