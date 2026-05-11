import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function calculateDonationEligibility(lastDonated, gender) {
    if (!lastDonated) return { eligible: true, message: null, percentage: 100, daysRemaining: 0 };

    const lastDonatedDate = new Date(lastDonated.seconds ? lastDonated.seconds * 1000 : lastDonated);
    const today = new Date();
    const diffTime = Math.abs(today - lastDonatedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const cooldownDays = (gender && gender.toLowerCase() === 'female') ? 120 : 90;

    if (diffDays < cooldownDays) {
        const daysRemaining = cooldownDays - diffDays;
        const percentage = Math.min(100, (diffDays / cooldownDays) * 100);
        return {
            eligible: false,
            message: `You can donate again in ${daysRemaining} days.`,
            percentage: percentage,
            daysRemaining: daysRemaining,
            nextDate: new Date(lastDonatedDate.getTime() + (cooldownDays * 24 * 60 * 60 * 1000))
        };
    }
    return { eligible: true, message: null, percentage: 100, daysRemaining: 0 };
}

// Utility to compress image to Base64 (Max 300px)
export const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;

                // Don't upscale if the image is already smaller than MAX_WIDTH
                const scaleSize = Math.min(1, MAX_WIDTH / img.width);

                canvas.width = img.width * scaleSize;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Returns a base64 string
                // Force JPEG and 0.7 quality for much smaller strings
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            }
            img.onerror = (err) => reject(err);
        }
        reader.onerror = (err) => reject(err);
    });
};

// Haversine Formula for distance in km
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d.toFixed(1);
};


function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

export const canDonate = (donorBlood, patientBlood) => {
    if (!donorBlood || !patientBlood) return false;

    // MEDICAL COMPATIBILITY (Universal Donor Logic)
    // Uncomment this block if you want to allow medically compatible donations (e.g. O+ -> A+)
    /*
    const cleanDonor = donorBlood.trim().toUpperCase();
    const cleanPatient = patientBlood.trim().toUpperCase();

    const compatibility = {
        'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        'O+': ['O+', 'A+', 'B+', 'AB+'],
        'A-': ['A-', 'A+', 'AB-', 'AB+'],
        'A+': ['A+', 'AB+'],
        'B-': ['B-', 'B+', 'AB-', 'AB+'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB-', 'AB+'],
        'AB+': ['AB+']
    };

    return compatibility[cleanDonor]?.includes(cleanPatient) || false;
    */

    // STRICT MATCHING (User Preference: Requested vs Donated must match)
    return donorBlood === patientBlood;
};

// Donor Priority Scoring for Pool Placement
// Higher score = higher priority for confirmed pool
export const calculateDonorPriority = (donor, requestLocation, userLocation) => {
    let score = 0;

    // 1. Distance Score (max 40 points) — closer = better
    if (userLocation && donor.location) {
        const dist = parseFloat(calculateDistance(
            userLocation.lat, userLocation.lng,
            donor.location.lat, donor.location.lng
        ));
        if (!isNaN(dist)) {
            score += Math.max(0, 40 - dist * 2);
        }
    } else if (requestLocation && donor.location) {
        const dist = parseFloat(calculateDistance(
            requestLocation.lat, requestLocation.lng,
            donor.location.lat, donor.location.lng
        ));
        if (!isNaN(dist)) {
            score += Math.max(0, 40 - dist * 2);
        }
    }

    // 2. Availability Score (max 20 points)
    if (donor.isAvailable !== false) {
        score += 20;
    }

    // 3. Last Donation Date Score (max 20 points) — longer ago = better
    if (donor.lastDonated) {
        const lastDate = new Date(donor.lastDonated.seconds ? donor.lastDonated.seconds * 1000 : donor.lastDonated);
        const daysSince = Math.ceil((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        score += Math.min(20, Math.floor(daysSince / 5));
    } else {
        // Never donated = fully rested, max score
        score += 20;
    }

    // 4. Response Time Score (max 20 points) — this is applied at accept-time
    // Default full score; caller can adjust based on actual response delay
    score += 20;

    return Math.round(score);
};

// Format donor pool status for display
export const getRequestStatusInfo = (status) => {
    const statusMap = {
        pending: { label: "Pending", color: "#d97706", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
        partially_fulfilled: { label: "Partially Fulfilled", color: "#2563eb", bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.2)" },
        fulfilled: { label: "Fulfilled", color: "#16a34a", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
        closed: { label: "Closed", color: "#64748b", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" },
        completed: { label: "Completed", color: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)" },
        accepted: { label: "Accepted", color: "#16a34a", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
        ready_for_pickup: { label: "Reserved", color: "#9333ea", bg: "rgba(147,51,234,0.08)", border: "rgba(147,51,234,0.2)" }
    };
    return statusMap[status] || statusMap.pending;
};
