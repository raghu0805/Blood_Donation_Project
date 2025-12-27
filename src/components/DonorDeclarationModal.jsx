import { useState, useEffect } from 'react';
import { Button } from './Button';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function DonorDeclarationModal({ isOpen, onClose, onConfirm }) {
    const { currentUser } = useAuth();
    const [checkedItems, setCheckedItems] = useState({});
    const [canSubmit, setCanSubmit] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCheckedItems({});
        }
    }, [isOpen]);

    const isFemale = currentUser?.gender === 'Female';

    // Checklist Data
    const sections = [
        {
            title: "Basic Eligibility (MANDATORY)",
            items: [
                { id: 'age', label: "I am 18 years or older" },
                { id: 'weight', label: "My weight is 50 kg or more" },
                { id: 'healthy', label: "I feel healthy today" }
            ]
        },
        {
            title: "Current Health Status",
            items: [
                { id: 'no_symptoms', label: "I do not have fever, cold, cough, or infection" },
                { id: 'hemoglobin', label: "I do not have low hemoglobin / anemia" },
                { id: 'chronic_disease', label: "I do not have heart, kidney disease, or cancer" },
                { id: 'epilepsy', label: "I have not had fits / epilepsy recently" }
            ]
        },
        {
            title: "Blood-Borne Diseases",
            items: [
                { id: 'hiv', label: "I have never had HIV / AIDS" },
                { id: 'hepatitis', label: "I have never had Hepatitis B or C" },
                { id: 'syphilis', label: "I have never had Syphilis" },
                { id: 'malaria', label: "I have not had Malaria in the last 3 months" }
            ]
        },
        {
            title: "Medical History",
            items: [
                { id: 'surgery', label: "I have not undergone surgery in the last 6 months" },
                { id: 'blood_loss', label: "I have not had major blood loss or accident recently" },
                { id: 'vaccination', label: "I have not taken any vaccination in the last 14–28 days" },
                { id: 'tattoo', label: "I have not done tattoo / piercing in the last 6 months" }
            ]
        },
        {
            title: "Lifestyle Safety",
            items: [
                { id: 'alcohol', label: "I have not consumed alcohol in the last 24 hours" },
                { id: 'drugs', label: "I do not use injectable drugs" }
            ]
        }
    ];

    // Gender Specific Section
    if (isFemale) {
        sections.push({
            title: "For Female Donors",
            items: [
                { id: 'pregnant', label: "I am not pregnant" },
                { id: 'breastfeeding', label: "I am not breastfeeding" },
                { id: 'menstruation', label: "I am not having heavy menstruation today" }
            ]
        });
    }

    // Previous Donation Section (Dynamic based on gender)
    const prevDonationItem = {
        id: 'prev_donation',
        label: isFemale
            ? "I have not donated blood in the last 4 months"
            : "I have not donated blood in the last 3 months"
    };

    sections.push({
        title: "Previous Blood Donation",
        items: [prevDonationItem]
    });


    // Flatten all IDs for easy access
    const allIds = sections.flatMap(s => s.items.map(i => i.id));
    const isAllSelected = allIds.length > 0 && allIds.every(id => checkedItems[id]);

    // Validation Logic
    useEffect(() => {
        const allChecked = allIds.every(id => checkedItems[id]);
        setCanSubmit(allChecked);
    }, [checkedItems, sections]);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-red-600" />
                            Donor Self-Declaration
                        </h2>
                        <p className="text-sm text-gray-500">Please confirm your eligibility to donate safely.</p>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
                        <AlertTriangle className="h-5 w-5 flex-none" />
                        <p>
                            <strong>Important:</strong> Providing false information puts both you and the patient at risk.
                            Please answer truthfully.
                        </p>
                    </div>

                    {/* Select All Checkbox */}
                    <div className="flex justify-end border-b border-gray-100 pb-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
                            <input
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-600"
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                            />
                            <span className="font-bold text-gray-800">Select All</span>
                        </label>
                    </div>

                    <div className="space-y-6">
                        {sections.map((section, idx) => (
                            <div key={idx}>
                                <h3 className="font-semibold text-gray-900 mb-3 border-b pb-1">{section.title}</h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {section.items.map(item => (
                                        <label key={item.id} className="relative flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                                            <div className="flex items-center h-5">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                                                    checked={!!checkedItems[item.id]}
                                                    onChange={() => handleCheck(item.id)}
                                                />
                                            </div>
                                            <div className="text-sm text-gray-700 leading-tight">
                                                {item.label}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer - Sticky */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="text-xs text-gray-500 text-center sm:text-left">
                        By confirming, I certify that the above declared information is true.
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
                            Cancel
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={!canSubmit}
                            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100"
                        >
                            Confirm & Proceed
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
