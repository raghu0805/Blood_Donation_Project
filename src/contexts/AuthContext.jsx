import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext({});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null); // 'donor' | 'patient' | null
    const [isRoleSwitching, setIsRoleSwitching] = useState(false);

    useEffect(() => {
        let unsubscribeSnapshot = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }

            if (user) {
                // Real-time listener for user profile
                console.log("Auth: User authenticated, fetching profile...", user.uid);
                const userRef = doc(db, "users", user.uid);
                unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        console.log("Auth: Snapshot update", userData?.bloodStock);

                        // Specific override for the hardcoded admin or admin role
                        const isAdminUser = user.email === 'admin@gmail.com' || userData.role === 'admin';
                        if (isAdminUser) {
                            userData.isVerified = true;
                        }

                        // Only update if we are NOT in the middle of a deliberate role switch
                        // This prevents race conditions where DB update comes before we navigate
                        if (!isRoleSwitching) {
                            setUserRole(userData.role);
                        }

                        setCurrentUser({ ...user, ...userData, isVerified: isAdminUser || userData.isVerified });
                    } else {
                        console.log("Auth: Profile missing in DB. Attempting self-healing...");
                        // 1. Set temporary user state so app doesn't crash or logout
                        const isAdminUser = user.email === 'admin@gmail.com';
                        setCurrentUser({ ...user, isVerified: isAdminUser });
                        setUserRole(null);

                        // 2. Automatically create the missing document
                        try {
                            await setDoc(userRef, {
                                email: user.email,
                                createdAt: new Date().toISOString(),
                                role: null, // Will force redirection to RoleSelection
                                isAvailable: true
                            });
                            console.log("Auth: Self-healing successful. User profile recreated.");
                        } catch (createErr) {
                            console.error("Auth: Failed to recreate user profile", createErr);
                            // If this fails (e.g. permission), we already set currentUser above, 
                            // so user is logged in but might be restricted.
                        }
                    }
                    setLoading(false);
                }, async (error) => {
                    console.error("Auth: Error listening to user profile", error);

                    // FALLBACK: Even if DB fails, keep user logged in with basic auth info
                    console.warn("Auth: Falling back to basic auth user due to DB error.");
                    setCurrentUser({ ...user, isVerified: false, role: null });

                    // ATTEMPT RECOVERY: If permission error (likely due to missing doc + strict rules)
                    // Try to blindly Create/Write the document
                    if (error.code === 'permission-denied') {
                        console.log("Auth: Permission denied reading profile. Attempting to create it directly...");
                        try {
                            await setDoc(userRef, {
                                email: user.email,
                                createdAt: new Date().toISOString(),
                                role: null,
                                isAvailable: true
                            });
                            console.log("Auth: Self-healing request sent (Blind Write).");
                        } catch (writeErr) {
                            console.error("Auth: Blind write also failed.", writeErr);
                        }
                    }

                    setLoading(false);
                });
            } else {
                console.log("Auth: No user detected");
                setCurrentUser(null);
                setUserRole(null);
                setLoading(false);
            }
        });

        return () => {
            if (unsubscribeSnapshot) unsubscribeSnapshot();
            unsubscribeAuth();
        };
    }, [isRoleSwitching]); // Add dependency to respect the flag

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const signupWithEmail = async (email, password, additionalData) => {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;

        // Save additional details to Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            ...additionalData,
            createdAt: new Date().toISOString()
        });

        // Update local state immediately for better UX
        setUserRole(additionalData.role || null);
        setCurrentUser({ ...user, ...additionalData });
    };

    const loginWithEmail = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => signOut(auth);

    const assignRole = async (role) => {
        if (!currentUser) return;

        // This function is still useful for initial assignment
        // For switching, we rely on Layout handling the 'switching' state mostly
        await setDoc(doc(db, "users", currentUser.uid), {
            email: currentUser.email,
            role: role,
            isAvailable: role === 'donor' ? true : false, // Default availability
            createdAt: new Date().toISOString()
        }, { merge: true });

        setUserRole(role);
        setCurrentUser(prev => ({ ...prev, role }));
    };

    const value = {
        currentUser,
        userRole,
        loading,
        isRoleSwitching,     // <--- New
        setIsRoleSwitching,  // <--- New
        loginWithGoogle,
        signupWithEmail,
        loginWithEmail,
        logout,
        assignRole
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
