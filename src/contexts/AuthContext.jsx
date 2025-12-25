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
                const userRef = doc(db, "users", user.uid);
                unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();

                        // Only update if we are NOT in the middle of a deliberate role switch
                        // This prevents race conditions where DB update comes before we navigate
                        if (!isRoleSwitching) {
                            setUserRole(userData.role);
                        }

                        setCurrentUser({ ...user, ...userData });
                    } else {
                        // New user logic or fallback
                        setCurrentUser(user);
                        setUserRole(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Auth: Error listening to user profile", error);
                    setLoading(false);
                });
            } else {
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
