import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import LoadingOverlay from '../components/LoadingOverlay';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser, loginWithEmail, assignRole, signupWithEmail, setIsRoleSwitching, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (trimmedPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        try {
            setIsRoleSwitching(true);

            // Force sign out existing session first if needed
            if (currentUser) {
                await logout();
            }

            let userCred;
            try {
                userCred = await loginWithEmail(trimmedEmail, trimmedPassword);
            } catch (loginErr) {
                // If admin account doesn't exist yet, attempt auto-creation
                console.log("Login failed, attempting auto-creation...", loginErr);
                try {
                    userCred = await signupWithEmail(trimmedEmail, trimmedPassword, { 
                        role: 'admin', 
                        displayName: 'System Admin',
                        whatsappNumber: '1234567890' 
                    });
                } catch (signupErr) {
                    if (signupErr.code === 'auth/email-already-in-use') {
                        throw new Error('Incorrect password for this admin email. Please check your credentials.');
                    }
                    throw signupErr;
                }
            }

            const authenticatedUid = userCred?.user?.uid || auth.currentUser?.uid;
            if (authenticatedUid) {
                // Explicitly set admin user document in Firestore to prevent race conditions
                await setDoc(doc(db, "users", authenticatedUid), {
                    email: trimmedEmail,
                    role: 'admin',
                    displayName: 'System Admin',
                    whatsappNumber: '1234567890',
                    isAvailable: false
                }, { merge: true });

                await assignRole('admin', authenticatedUid);
            }

            navigate('/admin-dashboard', { replace: true });
            setTimeout(() => {
                setIsRoleSwitching(false);
            }, 500);

        } catch (err) {
            setIsRoleSwitching(false);
            console.error("Admin Login Error:", err);
            setError(err.message || 'Failed to log in as admin. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <LoadingOverlay isLoading={loading} message="Authenticating..." subMessage="Verifying admin credentials" />
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-red-600 rounded-full">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-white mb-2">Admin Portal</h2>
                    <p className="text-gray-400 text-center mb-6">LifeLink Blood Bank Management</p>

                    {/* Default Credentials Callout Box */}
                    <div className="bg-gray-900/90 border border-red-900/50 p-4 rounded-xl mb-6 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Default Credentials</span>
                            <button 
                                type="button" 
                                onClick={() => { setEmail('admin@lifelink.org'); setPassword('admin123'); }} 
                                className="text-xs font-bold text-white bg-red-600 hover:bg-red-500 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                                Auto-fill Defaults
                            </button>
                        </div>
                        <div className="text-xs text-gray-300 space-y-1 font-mono">
                            <p><span className="text-gray-500">Email:</span> admin@lifelink.org</p>
                            <p><span className="text-gray-500">Password:</span> admin123</p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Admin Email</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                    placeholder="admin@lifelink.org"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 font-semibold shadow-lg shadow-red-900/20"
                        >
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</> : "Access Dashboard"}
                        </Button>
                    </form>
                </div>
                <div className="bg-gray-900/50 p-4 text-center border-t border-gray-700">
                    <p className="text-xs text-gray-500">Restricted Access. Authorized Personnel Only.</p>
                </div>
            </div>
        </div>
    );
}
