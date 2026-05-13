import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';

import { MCPProvider } from './contexts/MCPContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster, toast } from 'react-hot-toast';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AboutUs from './pages/About';
import AuthPage from './pages/AuthPage';
import RoleSelection from './pages/RoleSelection';
import DonorDashboard from './pages/DonorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import ChatPage from './pages/ChatPage';
import TrackingPage from './pages/TrackingPage';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import NotificationsPage from './pages/NotificationsPage';

import { useAuth } from './contexts/AuthContext';

import { LoadingSpinner } from './components/LoadingSpinner';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles = [] }) {
    const { currentUser, userRole, loading, isRoleSwitching } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [redirecting, setRedirecting] = useState(false);

    // Profile Completion Enforcement
    const isProfileIncomplete = () => {
        if (!currentUser) return true;
        if (userRole === 'admin') {
            return !currentUser.displayName || !currentUser.whatsappNumber;
        }
        return !currentUser.age || !currentUser.weight || !currentUser.bloodGroup || !currentUser.whatsappNumber || !currentUser.gender;
    };

    const isAllowedPath = ['/profile', '/role-selection'].includes(location.pathname);
    const needsProfileRedirect = currentUser && !isAllowedPath && isProfileIncomplete();

    // Fire toast ONCE via useEffect, not during render
    useEffect(() => {
        if (needsProfileRedirect && !redirecting) {
            setRedirecting(true);
            toast.error("Action Required: Please complete your profile first.", { id: 'profile-incomplete' });
        }
    }, [needsProfileRedirect, redirecting]);

    // Reset redirect flag when profile becomes complete or path changes to allowed
    useEffect(() => {
        if (!needsProfileRedirect) {
            setRedirecting(false);
        }
    }, [needsProfileRedirect]);

    if (loading || isRoleSwitching) {
        return (
            <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-500 text-sm animate-pulse">
                    {isRoleSwitching ? "Switching your role..." : "Verifying access..."}
                </p>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/auth" />;
    }

    if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
        // If user has no role yet, go to selection
        if (!userRole) return <Navigate to="/role-selection" />;
        // Otherwise, redirect to their dashboard/home
        return <Navigate to="/" />;
    }

    if (needsProfileRedirect) {
        return <Navigate to="/profile" />;
    }

    return children;
}

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ThemeProvider>
                <AuthProvider>
                    <MCPProvider>
                        <Toaster 
                            position="top-center"
                            reverseOrder={false}
                            gutter={8}
                            toastOptions={{
                                duration: 3000,
                                style: {
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    color: '#1e293b',
                                    borderRadius: '20px',
                                    padding: '12px 24px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    maxWidth: '400px',
                                },
                                success: {
                                    iconTheme: {
                                        primary: '#10B981',
                                        secondary: '#fff',
                                    },
                                },
                                error: {
                                    iconTheme: {
                                        primary: '#EF4444',
                                        secondary: '#fff',
                                    },
                                    duration: 4000,
                                },
                            }}
                        />
                        <Routes>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<LandingPage />} />
                                <Route path="auth" element={<AuthPage />} />
                                <Route path="about" element={<AboutUs />} />
                                <Route path="role-selection" element={<RoleSelection />} />

                                <Route path="donor-dashboard" element={
                                    <ProtectedRoute>
                                        <DonorDashboard />
                                    </ProtectedRoute>
                                } />

                                <Route path="patient-dashboard" element={
                                    <ProtectedRoute>
                                        <PatientDashboard />
                                    </ProtectedRoute>
                                } />

                                <Route path="chat/:requestId" element={
                                    <ProtectedRoute>
                                        <ChatPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="track/:requestId" element={
                                    <ProtectedRoute>
                                        <TrackingPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="profile" element={
                                    <ProtectedRoute>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                } />

                                <Route path="notifications" element={
                                    <ProtectedRoute>
                                        <NotificationsPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="admin" element={
                                    <ProtectedRoute>
                                        <LandingPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="admin-dashboard" element={
                                    <ProtectedRoute>
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                } />
                            </Route>

                            <Route path="/admin-login" element={<AdminLoginPage />} />
                        </Routes>
                    </MCPProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;

