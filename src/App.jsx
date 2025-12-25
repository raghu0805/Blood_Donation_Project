import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import { MCPProvider } from './contexts/MCPContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import RoleSelection from './pages/RoleSelection';
import DonorDashboard from './pages/DonorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import ChatPage from './pages/ChatPage';
import TrackingPage from './pages/TrackingPage';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';

import { useAuth } from './contexts/AuthContext';

import { LoadingSpinner } from './components/LoadingSpinner';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles = [] }) {
    const { currentUser, userRole, loading, isRoleSwitching } = useAuth();

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

    return children;
}

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <MCPProvider>
                        <Routes>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<LandingPage />} />
                                <Route path="auth" element={<AuthPage />} />
                                <Route path="role-selection" element={<RoleSelection />} />

                                <Route path="donor-dashboard" element={
                                    <ProtectedRoute allowedRoles={['donor']}>
                                        <DonorDashboard />
                                    </ProtectedRoute>
                                } />

                                <Route path="patient-dashboard" element={
                                    <ProtectedRoute allowedRoles={['patient']}>
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
                            </Route>

                            <Route path="/admin-login" element={<AdminLoginPage />} />
                            <Route path="/admin" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </MCPProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
