import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMCP } from '../contexts/MCPContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Button } from '../components/Button';
import { ArrowLeft, Navigation, MapPin } from 'lucide-react';
import L from 'leaflet';

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle map re-centering
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function TrackingPage() {
    const { requestId } = useParams();
    const { currentUser } = useAuth();
    const { updateLiveLocation } = useMCP();
    const navigate = useNavigate();
    const [requestData, setRequestData] = useState(null);
    const [myLocation, setMyLocation] = useState(null);
    const [sharingId, setSharingId] = useState(null);

    // 1. Fetch Request & Listen for Updates
    useEffect(() => {
        if (!requestId) return;
        const unsub = onSnapshot(doc(db, 'requests', requestId), (doc) => {
            if (doc.exists()) {
                setRequestData(doc.data());
            }
        });
        return () => unsub();
    }, [requestId]);

    // 2. Start Sharing My Location (if I choose to)
    // For simplicity, we auto-start sharing if I am the "Sharer" (Donor) mostly.
    // Or we provide a toggle.
    // The requirement: "whenever the donar click the location... live tracking will be shared"
    // Let's toggle it.
    useEffect(() => {
        if (!sharingId) return;

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setMyLocation([latitude, longitude]);
                updateLiveLocation(requestId, { lat: latitude, lng: longitude });
            },
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(id);
    }, [sharingId, requestId]);

    const handleToggleSharing = () => {
        if (sharingId) {
            setSharingId(null);
        } else {
            setSharingId(true); // Just a flag
        }
    };

    if (!requestData) return <div className="p-10 text-center">Loading Tracking...</div>;

    // Derived Locations
    const patientLocation = requestData.location ? [requestData.location.lat, requestData.location.lng] : null;
    const donorLiveLocation = requestData.liveLocation ? [requestData.liveLocation.lat, requestData.liveLocation.lng] : null;

    // Who am I?
    const isDonor = currentUser?.uid === requestData.donorId;
    const targetLocation = isDonor ? patientLocation : donorLiveLocation;
    const targetName = isDonor ? "Patient Location" : "Donor's Live Location";

    // Google Maps Navigation Link
    const handleNavigate = () => {
        if (!targetLocation) return;
        const [lat, lng] = targetLocation;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    return (
        <div className="h-[calc(100dvh-4rem)] flex flex-col relative">
            {/* Header Overlay */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
                <Button onClick={() => navigate(-1)} className="pointer-events-auto shadow-lg bg-white text-gray-800 hover:bg-gray-100 rounded-full h-10 w-10 p-0 flex items-center justify-center">
                    <ArrowLeft className="h-6 w-6" />
                </Button>

                <div className="pointer-events-auto space-y-2 flex flex-col items-end">
                    <Button
                        onClick={handleNavigate}
                        className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        disabled={!targetLocation}
                    >
                        <Navigation className="h-4 w-4" />
                        Navigate
                    </Button>

                    <Button
                        onClick={handleToggleSharing}
                        className={`shadow-lg flex items-center gap-2 ${sharingId ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                    >
                        <MapPin className="h-4 w-4" />
                        {sharingId ? 'Stop Sharing' : 'Share My Live Location'}
                    </Button>
                </div>
            </div>

            {/* Map */}
            <MapContainer center={patientLocation || [12.9716, 77.5946]} zoom={13} className="h-full w-full z-0">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Patient (Static) */}
                {patientLocation && (
                    <Marker position={patientLocation}>
                        <Popup>Patient Location</Popup>
                    </Marker>
                )}

                {/* Donor (Live) */}
                {donorLiveLocation && (
                    <Marker position={donorLiveLocation}>
                        <Popup>Donor (Live)</Popup>
                    </Marker>
                )}

                {/* Auto-center on live location if available */}
                <MapUpdater center={donorLiveLocation || patientLocation} />
            </MapContainer>
        </div>
    );
}
