import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { calculateDistance, calculateDonationEligibility, calculateDonorPriority } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, runTransaction, increment, setDoc, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';

const MCPContext = createContext({});

export function useMCP() {
    return useContext(MCPContext);
}

export function MCPProvider({ children }) {
    const { currentUser, userRole } = useAuth();
    const [availableDonors, setAvailableDonors] = useState([]);
    const [activeRequests, setActiveRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
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
                    setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                    setLocationError(null);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLocationError("Location access denied. Using default.");
                    setUserLocation({ lat: 12.9716, lng: 77.5946 });
                }
            );
        }
    }, [currentUser]);

    // Real-time Firestore Listeners
    useEffect(() => {
        if (!userRole || !currentUser) return;
        let unsubscribeDonors, unsubscribeActiveRequests, unsubscribeMyRequests;

        if (currentUser) {
            const qDonors = query(collection(db, 'users'));
            unsubscribeDonors = onSnapshot(qDonors, (snapshot) => {
                const donors = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        let distanceDisplay = "Unknown";
                        if (userLocation && data.location) {
                            const dist = calculateDistance(userLocation.lat, userLocation.lng, data.location.lat, data.location.lng);
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

            // Enhanced: Listen for all active request statuses including new pool states
            const qActive = query(
                collection(db, 'requests'),
                where('status', 'in', ['pending', 'accepted', 'partially_fulfilled', 'fulfilled'])
            );
            unsubscribeActiveRequests = onSnapshot(qActive, (snapshot) => {
                const requests = snapshot.docs.map(doc => {
                    const data = doc.data();
                    let distanceDisplay = "Unknown";
                    if (userLocation && data.location) {
                        const dist = calculateDistance(userLocation.lat, userLocation.lng, data.location.lat, data.location.lng);
                        distanceDisplay = dist ? `${dist} km` : "Unknown";
                    }
                    return { id: doc.id, ...data, distance: distanceDisplay };
                });
                requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setActiveRequests(requests);
            });

            const qMyReqs = query(collection(db, 'requests'), where('patientId', '==', currentUser.uid));
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

    const findMatches = (bloodGroup, urgency) => {
        return availableDonors.filter(d => (d.bloodGroup === bloodGroup || bloodGroup === 'Any'));
    };

    const requestGeminiAnalysis = async (contextData) => {
        const donors = contextData.donors || [];
        let analysis = "";
        if (donors.length > 0) {
            const bestMatch = donors[0];
            analysis = `Gemini: Based on proximity and blood group compatibility, ${bestMatch.displayName || bestMatch.name || 'a nearby donor'} is your best match (${bestMatch.distance || 'nearby'}).`;
        } else {
            analysis = "Gemini: searching for nearby donors with compatible blood types. No immediate matches found in the network yet.";
        }
        setGeminiAnalysis(analysis);
        return analysis;
    };

    const startTracking = (sessionId) => {
        setActiveTrackingSession({
            id: sessionId, status: 'active', eta: '12 mins',
            donorLocation: { lat: 12.9716, lng: 77.5946 },
            path: [[12.9716, 77.5946], [12.9800, 77.6000]]
        });
    };

    // === ENHANCED: Broadcast Request with Units Required ===
    const broadcastRequest = async (requestData) => {
        try {
            let finalLocation = userLocation;
            if (!finalLocation && navigator.geolocation) {
                try {
                    finalLocation = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                            (err) => reject(err), { timeout: 10000 }
                        );
                    });
                    setUserLocation(finalLocation);
                } catch (err) {
                    console.warn("MCP: Explicit location fetch failed", err);
                }
            }
            if (!finalLocation) finalLocation = { lat: 12.9716, lng: 77.5946 };

            const unitsRequired = parseInt(requestData.unitsRequired) || 1;

            const docRef = await addDoc(collection(db, 'requests'), {
                ...requestData,
                patientId: currentUser.uid,
                patientName: currentUser.displayName || currentUser.name || "Anonymous Patient",
                patientEmail: currentUser.email,
                status: 'pending',
                unitsRequired: unitsRequired,
                unitsFulfilled: 0,
                confirmedDonors: [],
                reserveDonors: [],
                donorHistory: [],
                maxConfirmedSlots: unitsRequired,
                autoPromoteEnabled: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                closedAt: null,
                location: requestData.location || finalLocation
            });

            console.log("MCP: Request broadcasted to Firestore", docRef.id);

            // n8n Automation trigger
            try {
                const donorsSnap = await getDocs(collection(db, 'donars'));
                const allDonors = donorsSnap.docs.map(d => {
                    const data = d.data();
                    const { eligible } = calculateDonationEligibility(data.lastDonated, data.gender);
                    if (eligible && data.eligibility === false) {
                        updateDoc(doc(db, 'donars', d.id), { eligibility: true, isAvailable: true, updatedAt: serverTimestamp() }).catch(console.error);
                        updateDoc(doc(db, 'users', d.id), { isAvailable: true }).catch(console.error);
                        data.eligibility = true;
                        data.isAvailable = true;
                    }
                    return { id: d.id, ...data };
                });

                const n8nWebhookUrl = "https://n8n-zazi.onrender.com/webhook/blood-alert";
                fetch(n8nWebhookUrl, {
                    method: 'POST', mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requestId: docRef.id, bloodGroup: requestData.bloodGroup,
                        urgency: requestData.urgency || "Emergency", unitsRequired,
                        patientName: currentUser.displayName || currentUser.name || "Anonymous Patient",
                        patientContact: currentUser.whatsappNumber || "Not Shared",
                        location: requestData.location || finalLocation,
                        timestamp: new Date().toISOString(), donorsPool: allDonors
                    })
                }).catch(console.error);
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
            await updateDoc(doc(db, 'users', currentUser.uid), { isAvailable, lastActive: serverTimestamp() });
        } catch (error) {
            console.error("MCP: Error updating availability", error);
            throw error;
        }
    };

    // === ENHANCED: Accept Request with Multi-Donor Pool & Race-Condition Safety ===
    const acceptRequest = async (requestId) => {
        if (!currentUser) return;
        try {
            await runTransaction(db, async (transaction) => {
                const requestRef = doc(db, 'requests', requestId);
                const requestDoc = await transaction.get(requestRef);
                if (!requestDoc.exists()) throw new Error("Request does not exist!");

                const data = requestDoc.data();

                // Guard: prevent accepting closed/completed requests
                if (['closed', 'completed'].includes(data.status)) {
                    throw new Error("This request is no longer accepting donors.");
                }

                const confirmed = data.confirmedDonors || [];
                const reserve = data.reserveDonors || [];
                const maxSlots = data.maxConfirmedSlots || data.unitsRequired || 1;

                // Guard: prevent duplicate donor assignment
                const alreadyConfirmed = confirmed.some(d => d.donorId === currentUser.uid);
                const alreadyReserve = reserve.some(d => d.donorId === currentUser.uid);
                if (alreadyConfirmed || alreadyReserve) {
                    throw new Error("You have already responded to this request.");
                }

                // Calculate priority score
                const donorData = currentUser;
                const priority = calculateDonorPriority(
                    { location: donorData.location, isAvailable: true, lastDonated: donorData.lastDonated },
                    data.location, userLocation
                );

                const patientCode = "P" + Math.floor(1000 + Math.random() * 9000);
                const donorCode = "D" + Math.floor(1000 + Math.random() * 9000);

                const donorEntry = {
                    donorId: currentUser.uid,
                    donorName: currentUser.displayName || currentUser.email,
                    donorPhone: currentUser.whatsappNumber || "Not Shared",
                    status: 'active',
                    acceptedAt: new Date().toISOString(),
                    priority: priority,
                    patientCode: patientCode,
                    donorCode: donorCode
                };

                const historyEntry = {
                    donorId: currentUser.uid,
                    donorName: currentUser.displayName || currentUser.email,
                    action: 'accepted',
                    timestamp: new Date().toISOString()
                };

                // Combine all current donors with the new one
                const allDonors = [...confirmed, ...reserve, donorEntry];

                // Sort ALL by priority (descending)
                allDonors.sort((a, b) => (b.priority || 0) - (a.priority || 0));

                // Re-allocate pools dynamically based on priority
                const newConfirmed = [];
                const newReserve = [];

                for (let i = 0; i < allDonors.length; i++) {
                    const d = allDonors[i];
                    if (i < maxSlots) {
                        d.poolType = 'confirmed';
                        newConfirmed.push(d);
                    } else {
                        d.poolType = 'reserve';
                        newReserve.push(d);
                    }
                }

                // Determine where the current user ended up for their history record
                const userPoolType = newConfirmed.some(d => d.donorId === currentUser.uid) ? 'confirmed' : 'reserve';
                historyEntry.poolType = userPoolType;

                let newStatus = data.status;
                if (newConfirmed.length >= maxSlots) {
                    newStatus = 'fulfilled';
                } else {
                    newStatus = 'partially_fulfilled';
                }

                let updateData = {
                    confirmedDonors: newConfirmed,
                    reserveDonors: newReserve,
                    status: newStatus,
                    updatedAt: serverTimestamp(),
                    consentGiven: true,
                    consentTimestamp: serverTimestamp()
                };

                updateData.donorHistory = [...(data.donorHistory || []), historyEntry];

                // Backward compat: also set donorId for single-donor chat support
                if (newConfirmed.length > 0 && newConfirmed[0].donorId === currentUser.uid) {
                    updateData.donorId = currentUser.uid;
                    updateData.donorName = currentUser.displayName || currentUser.email;
                    updateData.donorPhone = currentUser.whatsappNumber || "Not Shared";
                    updateData.acceptedAt = serverTimestamp();
                }

                transaction.update(requestRef, updateData);

                // Update donor's consent record
                transaction.update(doc(db, 'users', currentUser.uid), {
                    lastConsentAgreedAt: serverTimestamp()
                });
            });

            // Send system message about joining
            await sendMessage(requestId, `🩸 ${currentUser.displayName || 'A donor'} has joined this request.`, { type: 'system', system: true });
            console.log("MCP: Request accepted with pool management");
        } catch (error) {
            console.error("MCP: Error accepting request", error);
            throw error;
        }
    };

    // === NEW: Cancel Donor from Request with Auto-Promotion ===
    const cancelDonorFromRequest = async (requestId) => {
        if (!currentUser) return;
        try {
            await runTransaction(db, async (transaction) => {
                const requestRef = doc(db, 'requests', requestId);
                const requestDoc = await transaction.get(requestRef);
                if (!requestDoc.exists()) throw new Error("Request not found!");

                const data = requestDoc.data();
                let confirmed = [...(data.confirmedDonors || [])];
                let reserve = [...(data.reserveDonors || [])];
                const history = [...(data.donorHistory || [])];
                const maxSlots = data.maxConfirmedSlots || data.unitsRequired || 1;

                // Remove from confirmed pool
                const wasConfirmed = confirmed.some(d => d.donorId === currentUser.uid);
                confirmed = confirmed.filter(d => d.donorId !== currentUser.uid);
                // Also remove from reserve if they were there
                reserve = reserve.filter(d => d.donorId !== currentUser.uid);

                history.push({
                    donorId: currentUser.uid,
                    donorName: currentUser.displayName || currentUser.email,
                    action: 'cancelled',
                    poolType: wasConfirmed ? 'confirmed' : 'reserve',
                    timestamp: new Date().toISOString()
                });

                // Auto-promote from reserve if a confirmed slot opened
                let promotedDonor = null;
                if (wasConfirmed && reserve.length > 0 && data.autoPromoteEnabled !== false) {
                    // Sort reserve by priority (desc) and promote the best
                    reserve.sort((a, b) => (b.priority || 0) - (a.priority || 0));
                    promotedDonor = reserve.shift();
                    promotedDonor.poolType = 'confirmed';
                    promotedDonor.status = 'active';
                    confirmed.push(promotedDonor);

                    history.push({
                        donorId: promotedDonor.donorId,
                        donorName: promotedDonor.donorName,
                        action: 'promoted_from_reserve',
                        poolType: 'confirmed',
                        timestamp: new Date().toISOString()
                    });
                }

                // Recalculate status
                let newStatus;
                if (confirmed.length >= maxSlots) {
                    newStatus = 'fulfilled';
                } else if (confirmed.length > 0) {
                    newStatus = 'partially_fulfilled';
                } else {
                    newStatus = 'pending';
                }

                // Emergency escalation: confirmed below required AND no reserves left
                let emergencyEscalation = false;
                if (confirmed.length < maxSlots && reserve.length === 0 && confirmed.length > 0) {
                    emergencyEscalation = true;
                }

                transaction.update(requestRef, {
                    confirmedDonors: confirmed,
                    reserveDonors: reserve,
                    donorHistory: history,
                    status: newStatus,
                    emergencyEscalation,
                    updatedAt: serverTimestamp()
                });
            });

            await sendMessage(requestId, `⚠️ ${currentUser.displayName || 'A donor'} has withdrawn from this request.`, { type: 'system', system: true });
            console.log("MCP: Donor cancelled with auto-promotion");
        } catch (error) {
            console.error("MCP: Error cancelling donor", error);
            throw error;
        }
    };

    // === NEW: Move Donor Between Pools (Patient Management) ===
    const moveDonorToPool = async (requestId, donorId, targetPool) => {
        if (!currentUser) return;
        try {
            await runTransaction(db, async (transaction) => {
                const requestRef = doc(db, 'requests', requestId);
                const requestDoc = await transaction.get(requestRef);
                if (!requestDoc.exists()) throw new Error("Request not found!");

                const data = requestDoc.data();
                let confirmed = [...(data.confirmedDonors || [])];
                let reserve = [...(data.reserveDonors || [])];
                const history = [...(data.donorHistory || [])];
                const maxSlots = data.maxConfirmedSlots || data.unitsRequired || 1;

                // Find donor
                let donor = confirmed.find(d => d.donorId === donorId);
                let currentPool = 'confirmed';

                if (!donor) {
                    donor = reserve.find(d => d.donorId === donorId);
                    currentPool = 'reserve';
                }

                if (!donor) throw new Error("Donor not found in any pool.");
                if (currentPool === targetPool) return; // No change needed

                // Remove from current pool
                if (currentPool === 'confirmed') {
                    confirmed = confirmed.filter(d => d.donorId !== donorId);
                } else {
                    reserve = reserve.filter(d => d.donorId !== donorId);
                }

                // Add to target pool
                donor.poolType = targetPool;
                if (targetPool === 'confirmed') {
                    // If confirmed is full, demote the lowest priority confirmed donor
                    if (confirmed.length >= maxSlots) {
                        // Sort confirmed by priority ascending (lowest first)
                        confirmed.sort((a, b) => (a.priority || 0) - (b.priority || 0));
                        const demotedDonor = confirmed.shift();
                        demotedDonor.poolType = 'reserve';
                        reserve.push(demotedDonor);

                        history.push({
                            donorId: demotedDonor.donorId,
                            donorName: demotedDonor.donorName,
                            action: 'demoted_to_reserve',
                            poolType: 'reserve',
                            timestamp: new Date().toISOString()
                        });
                    }
                    confirmed.push(donor);
                } else {
                    reserve.push(donor);
                }

                history.push({
                    donorId: donor.donorId,
                    donorName: donor.donorName,
                    action: targetPool === 'confirmed' ? 'promoted_to_confirmed_manually' : 'demoted_to_reserve_manually',
                    poolType: targetPool,
                    timestamp: new Date().toISOString()
                });

                // Recalculate status
                let newStatus;
                if (confirmed.length >= maxSlots) {
                    newStatus = 'fulfilled';
                } else if (confirmed.length > 0) {
                    newStatus = 'partially_fulfilled';
                } else {
                    newStatus = 'pending';
                }

                transaction.update(requestRef, {
                    confirmedDonors: confirmed,
                    reserveDonors: reserve,
                    donorHistory: history,
                    status: newStatus,
                    updatedAt: serverTimestamp()
                });
            });

            console.log("MCP: Donor manually moved to " + targetPool);
        } catch (error) {
            console.error("MCP: Error moving donor", error);
            throw error;
        }
    };


    const sendMessage = async (requestId, messageText, extraData = {}) => {
        if (!currentUser) return;
        try {
            const messagesRef = collection(db, 'requests', requestId, 'messages');
            await addDoc(messagesRef, {
                text: messageText,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.name || currentUser.email,
                createdAt: serverTimestamp(),
                type: extraData.type || 'text',
                ...extraData
            });
        } catch (error) {
            console.error("MCP: Error sending message", error);
            throw error;
        }
    };

    // === ENHANCED: Complete Request — Per-Donor Completion ===
    const completeRequest = async (requestId, donorId = null) => {
        if (!currentUser) return;
        try {
            await runTransaction(db, async (transaction) => {
                const requestRef = doc(db, "requests", requestId);
                const requestDoc = await transaction.get(requestRef);
                if (!requestDoc.exists()) throw "Request does not exist!";

                const requestData = requestDoc.data();
                const confirmed = requestData.confirmedDonors || [];
                const unitsRequired = requestData.unitsRequired || 1;
                let unitsFulfilled = requestData.unitsFulfilled || 0;

                // If donorId specified, mark that specific donor as completed
                const targetDonorId = donorId || requestData.donorId;
                if (!targetDonorId) throw "No donor linked to this request!";

                // Update the confirmed donor's status
                const updatedConfirmed = confirmed.map(d => {
                    if (d.donorId === targetDonorId && d.status !== 'completed') {
                        return { ...d, status: 'completed' };
                    }
                    return d;
                });

                unitsFulfilled += 1;
                const allDone = unitsFulfilled >= unitsRequired;

                // Update Request
                const updateData = {
                    confirmedDonors: updatedConfirmed,
                    unitsFulfilled: unitsFulfilled,
                    status: allDone ? 'completed' : requestData.status,
                    updatedAt: serverTimestamp()
                };
                if (allDone) updateData.completedAt = serverTimestamp();
                transaction.update(requestRef, updateData);

                // Create Donation History Record for donor
                const donorRef = doc(db, "users", targetDonorId);
                const historyRef = doc(db, "users", targetDonorId, "donations", requestId);
                transaction.set(historyRef, {
                    requestId, patientName: requestData.patientName || "Unknown Patient",
                    bloodGroup: requestData.bloodGroup, location: requestData.location || null,
                    completedAt: serverTimestamp(), status: 'completed'
                });

                // Update Donor Stats
                transaction.update(donorRef, {
                    livesSaved: increment(1), lastDonated: serverTimestamp(), isAvailable: false
                });

                // Update Shadow 'donars' collection
                const shadowDonorRef = doc(db, "donars", targetDonorId);
                transaction.update(shadowDonorRef, {
                    lastDonated: serverTimestamp(), isAvailable: false,
                    eligibility: false, updatedAt: serverTimestamp()
                });

                // Update Patient Stats
                if (requestData.patientId) {
                    const patientRef = doc(db, "users", requestData.patientId);
                    const patientUpdate = { unitsReceived: increment(1) };
                    if (requestData.recipientRole === 'admin') {
                        patientUpdate[`bloodStock.${requestData.bloodGroup}`] = increment(1);
                    }
                    transaction.update(patientRef, patientUpdate);
                }
            });
            console.log("MCP: Donor completion recorded");
        } catch (error) {
            console.error("MCP: Error completing request", error);
            throw error;
        }
    };

    const updateLiveLocation = async (requestId, coords) => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, 'requests', requestId), {
                liveLocation: { lat: coords.lat, lng: coords.lng, updatedAt: serverTimestamp(), sharerId: currentUser.uid }
            });
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
                if (currentStock <= 0) throw `Insufficient stock for ${bloodGroup}!`;
                if (requestDoc.data().status === 'completed') throw "Request already completed!";
                const stockField = `bloodStock.${bloodGroup}`;
                transaction.update(adminRef, { [stockField]: increment(-1) });
                transaction.update(requestRef, {
                    status: 'ready_for_pickup', pickupCode, updatedAt: serverTimestamp(),
                    donorId: currentUser.uid, donorName: currentUser.displayName || "Blood Bank Admin",
                    donorPhone: currentUser.whatsappNumber || "Blood Bank", fulfillmentType: 'stock_supply'
                });
            });
            await sendMessage(requestId, `Great news! We have reserved the blood for your request. Your Secure Pickup Code is: ${pickupCode}. Please show this code at the Blood Bank counter to collect it.`, { type: 'system', system: true, pickupCode });
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
                if (data.pickupCode !== inputCode) throw "Invalid Pickup Code!";
                transaction.update(requestRef, { status: 'completed', completedAt: serverTimestamp(), verifiedBy: currentUser.uid });
                transaction.update(adminRef, { livesSaved: increment(1) });
            });
            await sendMessage(requestId, `Handover Complete! The pickup verification was successful.`, { type: 'system', system: true });
        } catch (error) {
            console.error("MCP: Verification Error", error);
            throw error;
        }
    };

    const updateUserProfile = async (data) => {
        if (!currentUser) return;
        try {
            await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
            const fullData = { ...currentUser, ...data };
            const { eligible } = calculateDonationEligibility(fullData.lastDonated, fullData.gender);
            const donorEntry = {
                name: fullData.displayName || fullData.name || "Anonymous",
                bloodGroup: fullData.bloodGroup || "Unknown",
                phone: fullData.whatsappNumber || "Not Shared",
                isAvailable: fullData.isAvailable ?? true, eligibility: eligible,
                lastDonated: fullData.lastDonated || null, gender: fullData.gender || "Not Specified",
                age: fullData.age || null, weight: fullData.weight || null,
                rollNo: fullData.rollNo || "Not Specified",
                location: fullData.location || userLocation || null, updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, 'donars', currentUser.uid), donorEntry, { merge: true });
        } catch (error) {
            console.error("MCP: Error updating profile", error);
            throw error;
        }
    };

    const value = {
        availableDonors, activeRequests, myRequests, geminiAnalysis, activeTrackingSession,
        findMatches, requestGeminiAnalysis, startTracking,
        broadcastRequest, toggleDonorAvailability, acceptRequest,
        cancelDonorFromRequest, moveDonorToPool, sendMessage, completeRequest,
        fulfillRequestByAdmin, verifyPickupCode, updateLiveLocation, updateUserProfile
    };

    return (
        <MCPContext.Provider value={value}>
            {children}
        </MCPContext.Provider>
    );
}
