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
