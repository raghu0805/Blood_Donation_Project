import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Shield, Lock } from 'lucide-react';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginWithEmail, assignRole, signupWithEmail, setIsRoleSwitching } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await loginWithEmail(email, password);

            // Prevent race conditions in ProtectedRoute
            setIsRoleSwitching(true);
            await assignRole('admin'); // Ensure role is enforced

            navigate('/admin');

            // Allow time for state to settle
            setTimeout(() => {
                setIsRoleSwitching(false);
            }, 1000);

        } catch (err) {
            setIsRoleSwitching(false); // Reset if error
            console.error("Login Error:", err);

            // Hackathon helper: specific auto-creation for the requested default admin
            if (email === 'admin@gmail.com' && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
                try {
                    console.log("Auto-creating default admin...");
                    // Using the signup function from context (valid here)
                    setIsRoleSwitching(true); // Ensure protection during auto-create too
                    await signupWithEmail(email, password, { role: 'admin', name: 'System Admin' });
                    navigate('/admin');
                    setTimeout(() => setIsRoleSwitching(false), 1000);
                    return;
                } catch (signupErr) {
                    setIsRoleSwitching(false);
                    console.error("Auto-creation failed:", signupErr);
                    setError('Failed to auto-create admin account.');
                }
            } else {
                setError('Failed to log in as admin. Check credentials.');
            }
        } finally {
            // Note: failing to authenticate throws error, caught above. 
            // Successful auth keeps loading true until redirect completes implicitly, 
            // but we can set it false here safely as local component state.
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-red-600 rounded-full">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-white mb-2">Admin Portal</h2>
                    <p className="text-gray-400 text-center mb-8">LifeLink Blood Bank Management</p>

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
                            {loading ? "Authenticating..." : "Access Dashboard"}
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
