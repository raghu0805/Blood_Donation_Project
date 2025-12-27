import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { User, Activity } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BackButton } from '../components/BackButton';

export default function RoleSelection() {
    const { assignRole } = useAuth();
    const navigate = useNavigate();
    const [isSelecting, setIsSelecting] = useState(false);

    const selectRole = async (role) => {
        if (isSelecting) return;
        setIsSelecting(true);
        try {
            await assignRole(role);
            // Force navigate based on selection
            if (role === 'donor') navigate('/donor-dashboard');
            else navigate('/patient-dashboard');
        } catch (error) {
            console.error("Failed to assign role", error);
            setIsSelecting(false);
        }
    };

    return (
        <div className="space-y-8 py-8 relative">
            <div className="absolute top-0 left-0">
                <BackButton to="/" />
            </div>
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">How do you want to help?</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Select your primary role using LifeLink.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <RoleCard
                    icon={User}
                    title="I want to be a Donor"
                    desc="Register your availability and get notified when someone nearby needs help."
                    onClick={() => selectRole('donor')}
                    disabled={isSelecting}
                />
                <RoleCard
                    icon={Activity}
                    title="I need Blood"
                    desc="Request blood for yourself or a patient during an emergency."
                    onClick={() => selectRole('patient')}
                    disabled={isSelecting}
                />
            </div>
            {isSelecting && (
                <div className="flex justify-center mt-4">
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <LoadingSpinner size="sm" /> Setting up your dashboard...
                    </p>
                </div>
            )}
        </div>
    );
}

function RoleCard({ icon: Icon, title, desc, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`text-left w-full h-full transition-all ${disabled ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
        >
            <Card className={`p-8 h-full transition-all group ${!disabled && 'hover:border-red-500 hover:shadow-lg cursor-pointer'}`}>
                <div className={`h-16 w-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 ${!disabled && 'group-hover:bg-red-600 dark:group-hover:bg-red-600'} transition-colors`}>
                    <Icon className={`h-8 w-8 text-red-600 dark:text-red-500 ${!disabled && 'group-hover:text-white'} transition-colors`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{desc}</p>
            </Card>
        </button>
    );
}
