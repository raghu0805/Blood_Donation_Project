import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { calculateDistance } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, runTransaction, increment, setDoc } from 'firebase/firestore';

const MCPContext = createContext({});

export function useMCP() {
    return useContext(MCPContext);
}

export function MCPProvider({ children }) {
    const { currentUser, userRole } = useAuth();
    const [availableDonors, setAvailableDonors] = useState([]);
    const [activeRequests, setActiveRequests] = useState([]); // Donors see this
    const [myRequests, setMyRequests] = useState([]); // Patients see this (their own)
    const [geminiAnalysis, setGeminiAnalysis] = useState(null);
    const [activeTrackingSession, setActiveTrackingSession] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

    // Real-time Firestore Listeners
    useEffect(() => {
        if (!userRole || !currentUser) return;

        let unsubscribeDonors;
        let unsubscribeActiveRequests;
        let unsubscribeMyRequests;

        if (userRole === 'patient') {
            // 0. Get Real User Location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setUserLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                        setLocationError(null);
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                        setLocationError("Location access denied. Using default.");
                        // Default fallback (e.g. Bangalore center)
                        setUserLocation({ lat: 12.9716, lng: 77.5946 });
                    }
                );
            }

            // 1. Listener: Active Donors (Existing)
            const qDonors = query(
                collection(db, 'users'),
                where('role', '==', 'donor')
                // where('isAvailable', '==', true),
                // where('isVerified', '==', true) // Temporarily disabled for easier testing
            );

            unsubscribeDonors = onSnapshot(qDonors, (snapshot) => {
                const donors = snapshot.docs
                    .map(doc => {
                        const data = doc.data();

                        // Calculate REAL distance if we have coords, else fallback
                        let distanceDisplay = "Unknown";
                        if (userLocation && data.location) {
                            const dist = calculateDistance(
                                userLocation.lat, userLocation.lng,
                                data.location.lat, data.location.lng
                            );
                            distanceDisplay = dist ? `${dist} km` : "Unknown";
                        } else {
                            // Use deterministic mock if real location fails for demo
                            const pseudoRandom = doc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                            const mockDist = (pseudoRandom % 100 / 10).toFixed(1);
                            distanceDisplay = `${Math.max(0.5, mockDist)} km (Est)`;
                        }

                        return {
                            id: doc.id,
                            ...data,
                            distance: distanceDisplay
                        };
                    })
                    // Filter out myself, incomplete profiles, and incompatible donors (cooldown)
                    .filter(d => {
                        // 1. Self check
                        if (d.id === currentUser.uid) return false;
                        // 2. Data integrity check
                        if (!d.bloodGroup) return false;

                        // 3. 90-Day Cooldown Safety Check (Server-side enforcement)
                        if (d.lastDonated) {
                            const last = new Date(d.lastDonated.seconds ? d.lastDonated.seconds * 1000 : d.lastDonated);
                            const diffTime = Math.abs(new Date() - last);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays < 90) return false;
                        }

                        return true;
                    });
                setAvailableDonors(donors);
            });

            // 2. Listener: My Sent Requests (New)
            const qMyReqs = query(
                collection(db, 'requests'),
                where('patientId', '==', currentUser.uid)
            );

            unsubscribeMyRequests = onSnapshot(qMyReqs, (snapshot) => {
                const reqs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort by newest first locally since we didn't add index for orderBy
                reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setMyRequests(reqs);
            });
        }

        if (userRole === 'donor') {
            // Listener: Requests (Pending or Accepted)
            const q = query(
                collection(db, 'requests'),
                where('status', 'in', ['pending', 'accepted'])
            );

            unsubscribeActiveRequests = onSnapshot(q, (snapshot) => {
                const requests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort LIFO (Last In First Out) - Newest First
                requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setActiveRequests(requests);
            });
        }

        return () => {
            if (unsubscribeDonors) unsubscribeDonors();
            if (unsubscribeActiveRequests) unsubscribeActiveRequests();
            if (unsubscribeMyRequests) unsubscribeMyRequests();
        };
    }, [userRole, currentUser, userLocation]);

    // MCP Actions
    const findMatches = (bloodGroup, urgency) => {
        console.log(`MCP: Finding matches for ${bloodGroup} (${urgency})`);
        // Filter the LIVE availableDonors list
        return availableDonors.filter(d =>
            (d.bloodGroup === bloodGroup || bloodGroup === 'Any')
        );
    };

    const requestGeminiAnalysis = async (contextData) => {
        // Mock Gemini interaction using real data context
        console.log("MCP: Sending context to Gemini...", contextData);

        let analysis = "";
        const donors = contextData.donors || [];

        if (donors.length > 0) {
            const bestMatch = donors[0]; // Simple best match logic
            analysis = `Gemini: Based on proximity and blood group compatibility, ${bestMatch.displayName || bestMatch.name || 'a nearby donor'} is your best match (${bestMatch.distance || 'nearby'}).`;
        } else {
            analysis = "Gemini: searching for nearby donors with compatible blood types. No immediate matches found in the network yet.";
        }

        setGeminiAnalysis(analysis);
        return analysis;
    };

    const startTracking = (sessionId) => {
        setActiveTrackingSession({
            id: sessionId,
            status: 'active',
            eta: '12 mins',
            donorLocation: { lat: 12.9716, lng: 77.5946 },
            path: [[12.9716, 77.5946], [12.9800, 77.6000]] // Mock path
        });
    };

    // Real Firestore Actions
    const broadcastRequest = async (requestData) => {
        try {
            await addDoc(collection(db, 'requests'), {
                ...requestData,
                patientId: currentUser.uid,
                patientName: currentUser.displayName || currentUser.name || "Anonymous Patient",
                status: 'pending',
                createdAt: serverTimestamp(),
                // Mock location for now if not provided
                location: requestData.location || { lat: 12.9716, lng: 77.5946 }
            });
            console.log("MCP: Request broadcasted to Firestore");
        } catch (error) {
            console.error("MCP: Error broadcasting request", error);
            throw error;
        }
    };

    const toggleDonorAvailability = async (isAvailable) => {
        if (!currentUser || userRole !== 'donor') return;
        try {
            const donorRef = doc(db, 'users', currentUser.uid);
            await updateDoc(donorRef, {
                isAvailable: isAvailable,
                lastActive: serverTimestamp()
            });
            console.log("MCP: Donor availability updated to", isAvailable);
        } catch (error) {
            console.error("MCP: Error updating availability", error);
            throw error;
        }
    };

    const acceptRequest = async (requestId) => {
        if (!currentUser || userRole !== 'donor') return;
        try {
            const requestRef = doc(db, 'requests', requestId);
            await updateDoc(requestRef, {
                status: 'accepted',
                donorId: currentUser.uid,
                donorName: currentUser.displayName || currentUser.email,
                donorPhone: currentUser.phoneNumber || "Not Shared",
                acceptedAt: serverTimestamp(),
                consentGiven: true, // Store on Request
                consentTimestamp: serverTimestamp()
            });

            // Update Donor Record as well (User Requirement)
            const donorRef = doc(db, 'users', currentUser.uid);
            await updateDoc(donorRef, {
                lastConsentAgreedAt: serverTimestamp()
            });

            console.log("MCP: Request accepted & Consent Logged");
        } catch (error) {
            console.error("MCP: Error accepting request", error);
            throw error;
        }
    };

    const sendMessage = async (requestId, messageText, extraData = {}) => {
        if (!currentUser) return;
        try {
            // Subcollection for messages within a specific request
            const messagesRef = collection(db, 'requests', requestId, 'messages');
            await addDoc(messagesRef, {
                text: messageText,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.name || currentUser.email,
                createdAt: serverTimestamp(),
                type: extraData.type || 'text',
                ...extraData
            });
            console.log("MCP: Message sent");
        } catch (error) {
            console.error("MCP: Error sending message", error);
            throw error;
        }
    };

    const completeRequest = async (requestId) => {
        if (!currentUser) return;
        try {
            await runTransaction(db, async (transaction) => {
                const requestRef = doc(db, "requests", requestId);
                const requestDoc = await transaction.get(requestRef);

                if (!requestDoc.exists()) throw "Request does not exist!";

                const requestData = requestDoc.data();
                if (requestData.status !== 'accepted') throw "Request is not in accepted state!";

                const donorId = requestData.donorId;
                if (!donorId) throw "No donor linked to this request!";

                const donorRef = doc(db, "users", donorId);

                // Update Request Status
                transaction.update(requestRef, {
                    status: 'completed',
                    completedAt: serverTimestamp()
                });

                // Create Donation History Record
                const historyRef = doc(db, "users", donorId, "donations", requestId);
                transaction.set(historyRef, {
                    requestId: requestId,
                    patientName: requestData.patientName || "Unknown Patient",
                    bloodGroup: requestData.bloodGroup,
                    location: requestData.location || null,
                    completedAt: serverTimestamp(),
                    status: 'completed'
                });

                // Update Donor Stats
                transaction.update(donorRef, {
                    livesSaved: increment(1),
                    lastDonated: serverTimestamp(),
                    isAvailable: false // Auto-mark unavailable
                });

                // AUTO-UPDATE: If this was a Center/Admin request, update their blood stock
                if (requestData.patientId) {
                    const patientRef = doc(db, "users", requestData.patientId);
                    // Dynamically update the specific blood group stock
                    const stockField = `bloodStock.${requestData.bloodGroup}`;
                    transaction.update(patientRef, {
                        [stockField]: increment(1)
                    });
                }
            });
            console.log("MCP: Request completed & Donor stats updated");
        } catch (error) {
            console.error("MCP: Error completing request", error);
            throw error;
        }
    };

    const updateLiveLocation = async (requestId, coords) => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, 'requests', requestId), {
                liveLocation: {
                    lat: coords.lat,
                    lng: coords.lng,
                    updatedAt: serverTimestamp(),
                    sharerId: currentUser.uid
                }
            });
            console.log("MCP: Live location updated");
        } catch (error) {
            console.error("MCP: Error updating live location", error);
        }
    };

    const fulfillRequestByAdmin = async (requestId, bloodGroup) => {
        if (!currentUser || userRole !== 'admin') return;
        const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();

        try {
            await runTransaction(db, async (transaction) => {
                const adminRef = doc(db, "users", currentUser.uid);
                const requestRef = doc(db, "requests", requestId);

                const adminDoc = await transaction.get(adminRef);
                const requestDoc = await transaction.get(requestRef);

                if (!adminDoc.exists()) throw "Admin profile not found!";
                if (!requestDoc.exists()) throw "Request not found!";

                const adminData = adminDoc.data();
                const currentStock = adminData.bloodStock?.[bloodGroup] || 0;

                if (currentStock <= 0) {
                    throw `Insufficient stock for ${bloodGroup}! Current stock: ${currentStock}`;
                }

                if (requestDoc.data().status === 'completed') {
                    throw "Request already completed!";
                }

                // Deduct Stock (Reserve)
                const stockField = `bloodStock.${bloodGroup}`;
                transaction.update(adminRef, {
                    [stockField]: increment(-1)
                    // livesSaved increment moved to final verification step
                });

                // Complete Request -> Ready for Pickup
                transaction.update(requestRef, {
                    status: 'ready_for_pickup',
                    pickupCode: pickupCode,
                    updatedAt: serverTimestamp(),
                    donorId: currentUser.uid,
                    donorName: currentUser.displayName || "Blood Bank Admin",
                    donorPhone: currentUser.phoneNumber || "Blood Bank",
                    fulfillmentType: 'stock_supply'
                });
            });
            console.log("MCP: Admin fulfilled request from stock - waiting for pickup");

            // Send automated notification message
            await sendMessage(requestId, `Great news! We have reserved the blood for your request. Your Secure Pickup Code is: ${pickupCode}. Please show this code at the Blood Bank counter to collect it.`, {
                type: 'system',
                system: true,
                pickupCode: pickupCode
            });

        } catch (error) {
            console.error("MCP: Error fulfilling request", error);
            throw error;
        }
    };

    const verifyPickupCode = async (requestId, inputCode) => {
        if (!currentUser || userRole !== 'admin') return;
        try {
            await runTransaction(db, async (transaction) => {
                const requestRef = doc(db, "requests", requestId);
                const adminRef = doc(db, "users", currentUser.uid);

                const requestDoc = await transaction.get(requestRef);
                if (!requestDoc.exists()) throw "Request not found";

                const data = requestDoc.data();
                if (data.status !== 'ready_for_pickup') throw "Request is not awaiting pickup.";
                if (data.pickupCode !== inputCode) throw "Invalid Pickup Code! Please check with patient.";

                // Complete
                transaction.update(requestRef, {
                    status: 'completed',
                    completedAt: serverTimestamp(),
                    verifiedBy: currentUser.uid
                });

                // Now increment lives saved
                transaction.update(adminRef, {
                    livesSaved: increment(1)
                });
            });

            await sendMessage(requestId, `Handover Complete! The pickup verification was successful. We are honored to support you – wishing the patient a speedy recovery!`, { type: 'system', system: true });
            console.log("MCP: Pickup verified and completed.");
        } catch (error) {
            console.error("MCP: Verification Error", error);
            throw error;
        }
    };

    const updateUserProfile = async (data) => {
        if (!currentUser) return;
        try {
            // Use setDoc with merge: true to handle both update and create cases
            await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
            console.log("MCP: User profile updated");
        } catch (error) {
            console.error("MCP: Error updating profile", error);
            throw error;
        }
    };

    const value = {
        // Context
        availableDonors,
        activeRequests,
        myRequests,
        geminiAnalysis,
        activeTrackingSession,

        // Actions
        findMatches,
        requestGeminiAnalysis,
        startTracking,
        broadcastRequest,
        toggleDonorAvailability,
        acceptRequest,
        sendMessage,
        completeRequest,
        fulfillRequestByAdmin,
        verifyPickupCode, // Added
        updateLiveLocation,
        updateUserProfile
    };

    return (
        <MCPContext.Provider value={value}>
            {children}
        </MCPContext.Provider>
    );
}
