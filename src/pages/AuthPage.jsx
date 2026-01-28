import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { HeartPulse, Mail, Lock, User, Calendar, Droplets } from 'lucide-react';

import { BackButton } from '../components/BackButton';

export default function AuthPage() {
    const { loginWithGoogle, signupWithEmail, loginWithEmail } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        bloodGroup: '',
        lastDonated: '',
        rollNo: ''
    });

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            // Google login might be a signup or login. 
            // We'll rely on the AuthContext thinking or we can try to fetch here if we want immediate redirect on existing users.
            // For now, let's defer to the standard flow or role selection since Google auth is tricky with new accounts.
            // But if we want to support Admin Google Login (unlikely for now but possible):
            navigate('/role-selection');
        } catch (error) {
            console.error("Login Failed", error);
            alert("Login Failed: " + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                const cred = await loginWithEmail(formData.email, formData.password);

                // Fetch user role immediately to decide redirection
                const userDoc = await getDoc(doc(db, "users", cred.user.uid));

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const role = userData.role;

                    if (role === 'admin') {
                        navigate('/admin'); // Admin Landing Page
                    } else if (role === 'donor') {
                        navigate('/donor-dashboard');
                    } else if (role === 'patient') {
                        navigate('/patient-dashboard');
                    } else {
                        navigate('/role-selection');
                    }
                } else {
                    navigate('/role-selection');
                }

            } else {
                // Check for unique Roll No
                if (formData.rollNo) {
                    const q = query(collection(db, "users"), where("rollNo", "==", formData.rollNo));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        alert("Roll No already exists. Please use a different Roll No.");
                        setIsLoading(false);
                        return;
                    }
                }

                const role = formData.bloodGroup ? 'donor' : 'patient';
                await signupWithEmail(formData.email, formData.password, {
                    name: formData.name,
                    bloodGroup: formData.bloodGroup,
                    lastDonated: formData.lastDonated || null,
                    role: role,
                    rollNo: formData.rollNo
                });

                // Navigate based on the just-created role
                if (role === 'donor') navigate('/donor-dashboard');
                else navigate('/patient-dashboard');
            }
        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors relative">
            <div className="absolute top-4 left-4">
                <BackButton to="/" />
            </div>
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-red-600">
                <CardHeader className="text-center space-y-4 pt-8">
                    <div className="mx-auto h-16 w-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center shadow-inner">
                        <HeartPulse className="h-10 w-10 text-red-600 dark:text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">LifeLink</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {isLogin ? "Welcome back, hero." : "Join the network using tech for good."}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Signup Fields */}
                        {!isLogin && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm border p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Droplets className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <select
                                                className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm border p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                value={formData.bloodGroup}
                                                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                            >
                                                <option value="">Select...</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last Donated (Optional)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="date"
                                                className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm border p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                value={formData.lastDonated}
                                                onChange={(e) => setFormData({ ...formData, lastDonated: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Common Fields */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Roll No</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"

                                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm border p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Roll No"
                                    value={formData.rollNo}
                                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Common Fields */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm border p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm border p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full flex justify-center" size="lg" disabled={isLoading}>
                            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <Button variant="secondary" onClick={handleGoogleLogin} className="w-full flex items-center gap-2 justify-center">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
