import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Clock, Route, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDistance } from '../lib/utils';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Hospital pin (red)
const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Donor location pin (blue)
const donorIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Fit map bounds to show both markers
function FitBounds({ hospitalPos, donorPos }) {
    const map = useMap();
    useEffect(() => {
        if (hospitalPos && donorPos) {
            const bounds = L.latLngBounds(
                [hospitalPos.lat, hospitalPos.lng],
                [donorPos.lat, donorPos.lng]
            );
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        } else if (hospitalPos) {
            map.setView([hospitalPos.lat, hospitalPos.lng], 15);
        }
    }, [hospitalPos, donorPos, map]);
    return null;
}

/**
 * LocationPreview — Read-only map for donors showing hospital location + distance
 * 
 * @param {object} hospitalLocation - { lat, lng } of the hospital
 * @param {string} hospitalName - Display name of the hospital
 * @param {object} donorLocation - { lat, lng } of the donor (from GPS)
 */
export default function LocationPreview({ hospitalLocation, hospitalName, donorLocation }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!hospitalLocation) return null;

    const distance = donorLocation
        ? calculateDistance(donorLocation.lat, donorLocation.lng, hospitalLocation.lat, hospitalLocation.lng)
        : null;

    // Estimate travel time (rough: 30km/h average in city traffic)
    const estimatedMinutes = distance ? Math.ceil((parseFloat(distance) / 30) * 60) : null;

    const handleNavigate = () => {
        if (donorLocation) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&origin=${donorLocation.lat},${donorLocation.lng}&destination=${hospitalLocation.lat},${hospitalLocation.lng}`,
                '_blank'
            );
        } else {
            window.open(
                `https://www.google.com/maps/search/?api=1&query=${hospitalLocation.lat},${hospitalLocation.lng}`,
                '_blank'
            );
        }
    };

    return (
        <div className="mt-3">
            {/* Distance Info Bar + Toggle */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all hover:shadow-sm"
                style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <MapPin size={14} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{hospitalName || 'Hospital'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            {distance && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                                    <Route size={9} /> {distance} km
                                </span>
                            )}
                            {estimatedMinutes && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                    <Clock size={9} /> ~{estimatedMinutes} min
                                </span>
                            )}
                            {!distance && (
                                <span className="text-[10px] text-slate-400 font-medium">Enable GPS for distance</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500">
                        {isExpanded ? <EyeOff size={10} /> : <Eye size={10} />}
                        {isExpanded ? 'Hide' : 'View'} Map
                    </span>
                </div>
            </button>

            {/* Expandable Map */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200" style={{ height: '180px' }}>
                            <MapContainer
                                center={[hospitalLocation.lat, hospitalLocation.lng]}
                                zoom={14}
                                scrollWheelZoom={false}
                                dragging={false}
                                style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
                                zoomControl={false}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <FitBounds hospitalPos={hospitalLocation} donorPos={donorLocation} />

                                {/* Hospital Marker */}
                                <Marker position={[hospitalLocation.lat, hospitalLocation.lng]} icon={hospitalIcon} />

                                {/* Donor Marker */}
                                {donorLocation && (
                                    <Marker position={[donorLocation.lat, donorLocation.lng]} icon={donorIcon} />
                                )}

                                {/* Distance Line */}
                                {donorLocation && (
                                    <Polyline
                                        positions={[
                                            [hospitalLocation.lat, hospitalLocation.lng],
                                            [donorLocation.lat, donorLocation.lng]
                                        ]}
                                        pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '8 4', opacity: 0.7 }}
                                    />
                                )}
                            </MapContainer>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-2 flex gap-2">
                            <button
                                type="button"
                                onClick={handleNavigate}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
                            >
                                <Navigation size={12} /> Get Directions
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
