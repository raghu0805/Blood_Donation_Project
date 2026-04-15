import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { HeartPulse, LogOut, Menu, X, Activity, Linkedin, Instagram, Mail } from 'lucide-react';
import logo from '../assets/app logo.png';
import pecLogo from '../assets/pec logo.png';
import yrcLogo from '../assets/yrc logo.png';
import LandingNavbar from './LandingNavbar';


export default function Layout() {
    const { currentUser, logout, userRole, assignRole, setIsRoleSwitching } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const isFullScreenPublicRoute = location.pathname === '/' && userRole !== 'admin';
    const isDonorDashboard = location.pathname === '/donor-dashboard';
    const isProfilePage = location.pathname === '/profile' && userRole !== 'admin';
    const isRoleSelection = location.pathname === '/role-selection' && userRole !== 'admin';
    const isPatientDashboard = location.pathname === '/patient-dashboard';
    const isAboutPage = location.pathname === '/about';
    const isLayoutSuppressed = isFullScreenPublicRoute || isDonorDashboard || isProfilePage || isRoleSelection || isPatientDashboard || isAboutPage;
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleRoleSwitch = async (role) => {
        // If already in the role, just navigate there
        if (role === userRole) {
            if (role === 'donor') navigate('/donor-dashboard');
            else navigate('/patient-dashboard');
            return;
        }

        setIsRoleSwitching(true);
        try {
            await assignRole(role);

            // Navigate immediately
            if (role === 'donor') navigate('/donor-dashboard');
            else navigate('/patient-dashboard');

            // Slight delay to allow the new route's ProtectedRoute to mount and verify
            // before we turn off the 'switching' flag.
            setTimeout(() => {
                setIsRoleSwitching(false);
            }, 500);
        } catch (error) {
            console.error("Role switch failed", error);
            setIsRoleSwitching(false);
        }
    };

    return (
        <div className="min-h-screen font-sans text-gray-900 transition-colors duration-200" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff5f5 50%, #fffbf0 100%)" }}>
            {/* Navigation - Premium Bright */}
            {!isLayoutSuppressed && (
                <LandingNavbar activePath={location.pathname} />
            )}

            {/* Main Content */}
            <main className={isLayoutSuppressed ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
                <Outlet />
            </main>

            {/* Footer */}
            {!isLayoutSuppressed && (
            <footer className="py-8 mt-auto" style={{ background: "rgba(255,255,255,0.7)", borderTop: "1px solid rgba(220,38,38,0.08)" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6">
                        <a
                            href="https://www.linkedin.com/company/yrc-pec/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-500 transition-colors p-2 hover:bg-slate-100 rounded-full"
                            title="LinkedIn"
                        >
                            <Linkedin className="h-5 w-5" />
                        </a>
                        <a
                            href="https://www.instagram.com/panimalar_yrc?igsh=YWlleW5zandyZ3lq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-pink-500 transition-colors p-2 hover:bg-slate-100 rounded-full"
                            title="Instagram"
                        >
                            <Instagram className="h-5 w-5" />
                        </a>
                        <a
                            href="mailto:yrc@panimalar.ac.in"
                            className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-slate-100 rounded-full"
                            title="Email Us"
                        >
                            <Mail className="h-5 w-5" />
                        </a>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">
                        &copy; {new Date().getFullYear()} YRC Panimalar Engineering College
                    </p>
                </div>
            </footer>
            )}
        </div>
    );
}
