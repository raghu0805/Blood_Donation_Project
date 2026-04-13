import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { calculateDistance, calculateDonationEligibility } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, runTransaction, increment, setDoc, getDocs } from 'firebase/firestore';

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

    // Location Tracking Effect
    useEffect(() => {
        if (!currentUser) return;

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
                    // Default fallback
                    setUserLocation({ lat: 12.9716, lng: 77.5946 });
                }
            );
        }
    }, [currentUser]);

    // Real-time Firestore Listeners
    useEffect(() => {
        if (!userRole || !currentUser) return;

        let unsubscribeDonors;
        let unsubscribeActiveRequests;
        let unsubscribeMyRequests;

        // MULTI-ROLE ARCHITECTURE: Everyone can see donors and requests
        if (currentUser) {
            // 1. Listener: Active Potential Donors (Every user with a blood group)
            const qDonors = query(collection(db, 'users'));

            unsubscribeDonors = onSnapshot(qDonors, (snapshot) => {
                const donors = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        let distanceDisplay = "Unknown";
                        if (userLocation && data.location) {
                            const dist = calculateDistance(
                                userLocation.lat, userLocation.lng,
                                data.location.lat, data.location.lng
                            );
                            distanceDisplay = dist ? `${dist} km` : "Unknown";
                        } else {
                            const pseudoRandom = doc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                            const mockDist = (pseudoRandom % 100 / 10).toFixed(1);
                            distanceDisplay = `${Math.max(0.5, mockDist)} km (Est)`;
                        }

                        return { id: doc.id, ...data, distance: distanceDisplay };
                    })
                    .filter(d => {
                        if (d.id === currentUser.uid) return false;
                        if (!d.bloodGroup) return false;
                        const { eligible } = calculateDonationEligibility(d.lastDonated, d.gender);
                        return eligible;
                    });
                setAvailableDonors(donors);
            });

            // 2. Listener: All Active Requests (Available for every potential donor)
            const qActive = query(
                collection(db, 'requests'),
                where('status', 'in', ['pending', 'accepted'])
            );

            unsubscribeActiveRequests = onSnapshot(qActive, (snapshot) => {
                const requests = snapshot.docs.map(doc => {
                    const data = doc.data();
                    let distanceDisplay = "Unknown";
                    if (userLocation && data.location) {
                        const dist = calculateDistance(
                            userLocation.lat, userLocation.lng,
                            data.location.lat, data.location.lng
                        );
                        distanceDisplay = dist ? `${dist} km` : "Unknown";
                    }
                    return { id: doc.id, ...data, distance: distanceDisplay };
                });
                requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setActiveRequests(requests);
            });

            // 3. Listener: My Sent Requests
            const qMyReqs = query(
                collection(db, 'requests'),
                where('patientId', '==', currentUser.uid)
            );

            unsubscribeMyRequests = onSnapshot(qMyReqs, (snapshot) => {
                const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setMyRequests(reqs);
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
            let finalLocation = userLocation;

            // RACE CONDITION FIX: If location isn't ready, verify it explicitly
            if (!finalLocation && navigator.geolocation) {
                console.log("MCP: Location not ready, fetching explicitly...");
                try {
                    finalLocation = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => resolve({
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude
                            }),
                            (err) => reject(err),
                            { timeout: 10000 }
                        );
                    });
                    // Update state for future use
                    setUserLocation(finalLocation);
                } catch (err) {
                    console.warn("MCP: Explicit location fetch failed, using default", err);
                    alert("Warning: Could not fetch your precise location. Request will appear at the default location (Bangalore).\nPlease ensure Location Services are enabled for this specific site in your browser settings.");
                }
            }

            // Fallback
            if (!finalLocation) {
                finalLocation = { lat: 12.9716, lng: 77.5946 };
            } else {
                // Determine if this is a "real" location or the default fallback from state
                if (finalLocation.lat === 12.9716 && finalLocation.lng === 77.5946) {
                    // It is the default
                }
            }

            const docRef = await addDoc(collection(db, 'requests'), {
                ...requestData,
                patientId: currentUser.uid,
                patientName: currentUser.displayName || currentUser.name || "Anonymous Patient",
                patientEmail: currentUser.email,
                status: 'pending',
                createdAt: serverTimestamp(),
                location: requestData.location || finalLocation
            });
            
            console.log("MCP: Request broadcasted to Firestore", docRef.id);

            // 🟢 STEP 2: Trigger n8n Automation (WhatsApp/Twilio Alerts)
            try {
                // Fetch ALL donors from the 'donars' collection for n8n automation
                const donorsSnap = await getDocs(collection(db, 'donars'));
                
                // AUTO-HEAL: Fix eligibility dynamically if the timer (90/120 days) has passed
                const allDonors = donorsSnap.docs.map(d => {
                    const data = d.data();
                    const { eligible } = calculateDonationEligibility(data.lastDonated, data.gender);
                    
                    // If math says they are eligible now, but DB says false, we fix the DB!
                    if (eligible && data.eligibility === false) {
                        console.log(`MCP: Auto-healing eligibility for donor ${d.id}`);
                        
                        // Fire off background updates to fix the database docs
                        updateDoc(doc(db, 'donars', d.id), {
                            eligibility: true,
                            isAvailable: true,
                            updatedAt: serverTimestamp()
                        }).catch(err => console.error("Auto-heal donars err:", err));
                        
                        updateDoc(doc(db, 'users', d.id), {
                            isAvailable: true
                        }).catch(err => console.error("Auto-heal users err:", err));
                        
                        // Fix the local payload object so n8n gets the exact correct data right now
                        data.eligibility = true;
                        data.isAvailable = true;
                    }

                    return { id: d.id, ...data };
                });

                const n8nWebhookUrl = "https://n8n-zazi.onrender.com/webhook/blood-alert"; // 👈 PRODUCTION URL
                
                const alertPayload = {
                    requestId: docRef.id,
                    bloodGroup: requestData.bloodGroup,
                    urgency: requestData.urgency || "Emergency",
                    patientName: currentUser.displayName || currentUser.name || "Anonymous Patient",
                    patientContact: currentUser.whatsappNumber || "Not Shared",
                    location: requestData.location || finalLocation,
                    timestamp: new Date().toISOString(),
                    donorsPool: allDonors
                };

                // Trigger n8n with CORS bypass mode
                fetch(n8nWebhookUrl, {
                    method: 'POST',
                    mode: 'no-cors', // 👈 CORS BYPASS
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(alertPayload)
                })
                .then(() => console.log("MCP: Webhook trigger successfully sent to n8n"))
                .catch(err => console.error("MCP: N8N Webhook failed", err));
                
            } catch (webhookErr) {
                console.warn("MCP: External automation trigger error", webhookErr);
            }
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
                donorPhone: currentUser.whatsappNumber || "Not Shared",
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
                const donorUpdate = {
                    livesSaved: increment(1),
                    lastDonated: serverTimestamp(),
                    isAvailable: false // Auto-mark unavailable
                };
                transaction.update(donorRef, donorUpdate);

                // Update Shadow 'donars' collection for n8n
                const shadowDonorRef = doc(db, "donars", donorId);
                transaction.update(shadowDonorRef, {
                    lastDonated: serverTimestamp(),
                    isAvailable: false,
                    eligibility: false,
                    updatedAt: serverTimestamp()
                });

                // Update Patient Stats (Network Support)
                if (requestData.patientId) {
                    const patientRef = doc(db, "users", requestData.patientId);
                    
                    // Logic: If it's a regular patient, increment unitsReceived. 
                    // If it's another center (admin), they also track unitsReceived but usually they manage stock.
                    // We'll increment unitsReceived for all as a global 'support' stat.
                    
                    const updateData = {
                        unitsReceived: increment(1)
                    };

                    // If it's an admin/center, also update their blood stock
                    if (requestData.recipientRole === 'admin') {
                        const stockField = `bloodStock.${requestData.bloodGroup}`;
                        updateData[stockField] = increment(1);
                    }

                    transaction.update(patientRef, updateData);
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
                    donorPhone: currentUser.whatsappNumber || "Blood Bank",
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
            // 1. Update primary 'users' collection
            await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });

            // 2. Multi-role Sync: Every user is added to 'donars' registry for n8n/automation
            const fullData = { ...currentUser, ...data };
            const { eligible } = calculateDonationEligibility(fullData.lastDonated, fullData.gender);
            
            const donorEntry = {
                name: fullData.displayName || fullData.name || "Anonymous",
                bloodGroup: fullData.bloodGroup || "Unknown",
                phone: fullData.whatsappNumber || "Not Shared",
                isAvailable: fullData.isAvailable ?? true,
                eligibility: eligible,
                lastDonated: fullData.lastDonated || null,
                gender: fullData.gender || "Not Specified",
                age: fullData.age || null,
                weight: fullData.weight || null,
                rollNo: fullData.rollNo || "Not Specified",
                location: fullData.location || userLocation || null,
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, 'donars', currentUser.uid), donorEntry, { merge: true });
            console.log("MCP: Registry updated for multi-role user");

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
