import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { HeartPulse, ShieldCheck, MapPin, Activity, Clock } from 'lucide-react';
import DemoModal from '../components/DemoModal';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { calculateDonationEligibility } from '../lib/utils';
import CountdownTimer from '../components/CountdownTimer';


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

    const getDestination = () => {
        if (!currentUser) return "/auth";
        if (userRole === 'admin') return "/admin";
        if (userRole === 'donor') return "/donor-dashboard";
        if (userRole === 'patient') return "/patient-dashboard";
        return "/role-selection";
    };

    const destination = getDestination();

    return (
        <div className="flex flex-col gap-16 pb-16 relative">
            {/* Hero Section */}
            <section className="text-center space-y-8 pt-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium text-sm border border-red-100 dark:border-red-900/30"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Live: Emergency Blood Network Active
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white"
                >
                    {userRole === 'admin' ? "Admin Console" : "Your blood can"} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900">
                        {userRole === 'admin' ? "Manage LifeLink Network" : "save a life today."}
                    </span>
                </motion.h1>

                {currentUser && userRole !== 'admin' && !calculateDonationEligibility(currentUser?.lastDonated, currentUser?.gender).eligible && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-gray-200 dark:shadow-none border-2 border-red-100 dark:border-red-900/30"
                    >
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full shadow-inner border border-red-100 dark:border-red-900/30">
                            <Clock className="h-8 w-8 text-red-600 animate-pulse" />
                        </div>
                        <div className="flex-1 text-center md:text-left text-gray-900 dark:text-gray-100">
                            <h3 className="font-bold text-2xl mb-1 tracking-tight">Recovery Period Active</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4 text-base font-medium">
                                Your safety is priority. You will be eligible to save lives again in:
                            </p>
                            <div className="flex justify-center md:justify-start">
                                <CountdownTimer
                                    targetDate={calculateDonationEligibility(currentUser?.lastDonated, currentUser?.gender).nextDate}
                                    variant="critical"
                                    size="lg"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
                >
                    LifeLink connects donors and patients in real-time during emergencies.
                    Smart matching, ethical tracking, and instant coordination.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link to={destination}>
                        <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                            {currentUser ? 'Go to Dashboard' : 'Find Blood Now'}
                        </Button>
                    </Link>
                    {!currentUser && (
                        <Link to="/auth">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8">
                                Register as Donor
                            </Button>
                        </Link>
                    )}
                </motion.div>


            </section>

            <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />


        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }) {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
    );
}
