import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { ThemeToggle } from './ThemeToggle';
import { HeartPulse, LogOut, Menu, X, Activity } from 'lucide-react';

export default function Layout() {
    const { currentUser, logout, userRole, assignRole, setIsRoleSwitching } = useAuth();
    const navigate = useNavigate();
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
            {/* Navigation */}
            <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center gap-2">
                                <div className="bg-red-50 p-2 rounded-lg">
                                    <HeartPulse className="h-6 w-6 text-red-600" />
                                </div>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                    LifeLink
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-4">
                            <ThemeToggle />
                            {currentUser ? (
                                <>
                                    {currentUser.role === 'admin' && (
                                        <>
                                            <Link to="/admin-dashboard">
                                                <Button variant="ghost" size="sm" className="mr-2">
                                                    Dashboard
                                                </Button>
                                            </Link>
                                            <Link to="/admin">
                                                <Button variant="ghost" size="sm" className="mr-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                    Donate Blood
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                    {currentUser.role !== 'admin' && (
                                        <>
                                            <Button variant="ghost" size="sm" onClick={() => handleRoleSwitch('donor')}>
                                                Donate Blood
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleRoleSwitch('patient')}>
                                                Request Blood
                                            </Button>
                                            <span className="h-6 w-px bg-gray-300 mx-2"></span>
                                        </>
                                    )}
                                    <button onClick={() => navigate('/profile')} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded-lg transition-colors group" title="My Profile">
                                        <div className="h-8 w-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/50 overflow-hidden">
                                            {currentUser.photoURL ? (
                                                <img src={currentUser.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                currentUser.displayName ? currentUser.displayName[0].toUpperCase() : (currentUser.email ? currentUser.email[0].toUpperCase() : 'U')
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block group-hover:text-red-700 dark:group-hover:text-red-400">
                                            {currentUser.displayName || currentUser.email.split('@')[0]}
                                        </span>
                                    </button>
                                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <LogOut className="h-4 w-4 mr-2" />
                                    </Button>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    <Link to="/auth">
                                        <Button variant="ghost" size="sm">Log In</Button>
                                    </Link>
                                    <Link to="/auth">
                                        <Button variant="primary" size="sm">Join Now</Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center gap-2 md:hidden">
                            <ThemeToggle />
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed inset-0 top-16 z-40 bg-white dark:bg-gray-900 md:hidden overflow-y-auto"
                        >
                            <div className="px-4 py-6 space-y-6">
                                {currentUser ? (
                                    <>
                                        <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold border border-red-200 mr-4 text-lg">
                                                {currentUser.photoURL ? (
                                                    <img src={currentUser.photoURL} alt="Profile" className="h-full w-full object-cover rounded-full" />
                                                ) : (
                                                    currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white text-lg">
                                                    {currentUser.displayName || currentUser.email.split('@')[0]}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {userRole === 'admin' ? 'Administrator' : userRole === 'donor' ? 'Active Donor' : 'Patient Account'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {currentUser.role !== 'admin' && (
                                                <>
                                                    <button
                                                        onClick={() => { handleRoleSwitch('donor'); setIsMobileMenuOpen(false); }}
                                                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 active:scale-98 transition-transform"
                                                    >
                                                        <span className="font-bold text-gray-700 dark:text-gray-200">Donate Blood</span>
                                                        <HeartPulse className="h-5 w-5 text-red-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => { handleRoleSwitch('patient'); setIsMobileMenuOpen(false); }}
                                                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 active:scale-98 transition-transform"
                                                    >
                                                        <span className="font-bold text-gray-700 dark:text-gray-200">Request Blood</span>
                                                        <Activity className="h-5 w-5 text-blue-500" />
                                                    </button>
                                                </>
                                            )}
                                            <Link
                                                to="/profile"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block w-full text-left p-4 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent"
                                            >
                                                My Profile
                                            </Link>
                                            <button
                                                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                                className="w-full text-left p-4 rounded-xl font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 active:bg-red-100 transition-colors"
                                            >
                                                Log Out
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4 pt-10">
                                        <div className="text-center mb-8">
                                            <HeartPulse className="h-16 w-16 text-red-600 mx-auto mb-4" />
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">LifeLink</h3>
                                            <p className="text-gray-500">Emergency Blood Network</p>
                                        </div>
                                        <Link
                                            to="/auth"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block w-full py-4 rounded-xl text-center text-lg font-bold text-white bg-red-600 shadow-lg shadow-red-200"
                                        >
                                            Join Now
                                        </Link>
                                        <Link
                                            to="/auth"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block w-full py-4 rounded-xl text-center text-lg font-bold text-gray-700 dark:text-white bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700"
                                        >
                                            Log In
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}
