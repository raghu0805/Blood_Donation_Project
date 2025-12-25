import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { ThemeToggle } from './ThemeToggle';
import { HeartPulse, LogOut, Menu, X } from 'lucide-react';

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
                                <span className="text-xl font-bold bg-clip-text text-white gradient-to-r from-red-600 to-red-900">
                                    LifeLink
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-4">
                            <ThemeToggle />
                            {currentUser ? (
                                <>
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

                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {currentUser ? (
                                <>
                                    <div className="flex items-center px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                                        <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold border border-red-200 mr-3">
                                            {currentUser.photoURL ? (
                                                <img src={currentUser.photoURL} alt="Profile" className="h-full w-full object-cover rounded-full" />
                                            ) : (
                                                currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'
                                            )}
                                        </div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {currentUser.displayName || currentUser.email}
                                        </div>
                                    </div>

                                    {currentUser.role !== 'admin' && (
                                        <>
                                            <button
                                                onClick={() => { handleRoleSwitch('donor'); setIsMobileMenuOpen(false); }}
                                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                Donate Blood
                                            </button>
                                            <button
                                                onClick={() => { handleRoleSwitch('patient'); setIsMobileMenuOpen(false); }}
                                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                Request Blood
                                            </button>
                                        </>
                                    )}
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-800 mt-1"
                                    >
                                        My Profile
                                    </Link>
                                    <button
                                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1"
                                    >
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-2 p-2">
                                    <Link
                                        to="/auth"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700"
                                    >
                                        Join Now
                                    </Link>
                                    <Link
                                        to="/auth"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block w-full text-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Log In
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}
