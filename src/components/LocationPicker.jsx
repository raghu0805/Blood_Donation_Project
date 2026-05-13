import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Crosshair, CheckCircle, Loader2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix default marker icon issue in Leaflet + Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom hospital pin icon
const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Inner map event handler - Allows pin placement via click
function MapClickHandler({ onLocationSelect }) {
    useMapEvents({
        click: (e) => {
            onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
    });
    return null;
}

// Recenter map when position changes
function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo([position.lat, position.lng], 17, { duration: 1.2 });
        }
    }, [position, map]);
    return null;
}

// Debounce hook for search
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

/**
 * LocationPicker — Interactive hospital search + map selection for patients
 * 
 * @param {function} onLocationConfirm - Called with { lat, lng, hospitalName, fullAddress }
 * @param {object} initialLocation - Optional initial location { lat, lng }
 * @param {string} initialHospital - Optional initial hospital name
 */
export default function LocationPicker({ onLocationConfirm, initialLocation = null, initialHospital = '' }) {
    const [searchQuery, setSearchQuery] = useState(initialHospital);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(initialLocation);
    const [confirmedAddress, setConfirmedAddress] = useState('');
    const [hospitalName, setHospitalName] = useState(initialHospital);
    const [isGPSLoading, setIsGPSLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState(initialLocation || { lat: 13.0827, lng: 80.2707 }); // Default: Chennai
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const debouncedQuery = useDebounce(searchQuery, 400);

    // Live search as user types (with debounce)
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }
        searchHospitals(debouncedQuery);
    }, [debouncedQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchHospitals = async (queryText) => {
        setIsSearching(true);
        try {
            // Smart query: add "hospital" if not present for better results
            let enrichedQuery = queryText;
            const medicalKeywords = ['hospital', 'clinic', 'medical', 'health', 'nursing', 'care', 'lab', 'diagnostic'];
            const hasKeyword = medicalKeywords.some(kw => queryText.toLowerCase().includes(kw));
            if (!hasKeyword) {
                enrichedQuery += ' hospital';
            }

            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enrichedQuery)}&limit=6&addressdetails=1&extratags=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();

            if (data && data.length > 0) {
                const results = data.map(item => ({
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    name: item.display_name.split(',')[0],
                    fullAddress: item.display_name,
                    type: item.type,
                    importance: item.importance
                }));
                setSearchResults(results);
                setShowResults(true);
            } else {
                setSearchResults([]);
                setShowResults(true);
            }
        } catch (err) {
            console.error('Hospital search failed:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (result) => {
        setSelectedLocation({ lat: result.lat, lng: result.lng });
        setMapCenter({ lat: result.lat, lng: result.lng });
        setHospitalName(result.name);
        setConfirmedAddress(result.fullAddress);
        setSearchQuery(result.name);
        setShowResults(false);

        // Immediately notify parent
        onLocationConfirm({
            lat: result.lat,
            lng: result.lng,
            hospitalName: result.name,
            fullAddress: result.fullAddress
        });
    };

    const handleMapClick = useCallback(async (coords) => {
        setSelectedLocation(coords);

        // Reverse geocode the clicked point
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            if (data && data.display_name) {
                const name = data.address?.hospital || data.address?.amenity || data.display_name.split(',')[0];
                setHospitalName(name);
                setConfirmedAddress(data.display_name);
                setSearchQuery(name);
                onLocationConfirm({
                    lat: coords.lat,
                    lng: coords.lng,
                    hospitalName: name,
                    fullAddress: data.display_name
                });
            }
        } catch (err) {
            console.error('Reverse geocoding failed:', err);
            // Still use the coords even if reverse geocode fails
            setHospitalName('Selected Location');
            onLocationConfirm({
                lat: coords.lat,
                lng: coords.lng,
                hospitalName: 'Selected Location',
                fullAddress: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
            });
        }
    }, [onLocationConfirm]);

    const handleUseGPS = async () => {
        if (!navigator.geolocation) return;
        setIsGPSLoading(true);
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true, timeout: 15000, maximumAge: 0
                });
            });
            const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
            setSelectedLocation(coords);
            setMapCenter(coords);

            // Reverse geocode GPS location
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            if (data && data.display_name) {
                const name = data.address?.hospital || data.address?.amenity || data.display_name.split(',')[0];
                setHospitalName(name);
                setConfirmedAddress(data.display_name);
                setSearchQuery(name);
                onLocationConfirm({
                    lat: coords.lat, lng: coords.lng,
                    hospitalName: name, fullAddress: data.display_name
                });
            }
        } catch (err) {
            console.error('GPS failed:', err);
        } finally {
            setIsGPSLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div ref={searchRef} className="relative">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Hospital / Clinic Location
                </label>
                <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (!e.target.value) {
                                setSelectedLocation(null);
                                setHospitalName('');
                                setConfirmedAddress('');
                                onLocationConfirm(null);
                            }
                        }}
                        placeholder="Search hospital, clinic, blood bank..."
                        className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-20 text-sm text-gray-800 outline-none transition-all focus:border-red-400 focus:shadow-md focus:shadow-red-500/5"
                        style={{ background: '#f8fafc' }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
                        {isSearching && <Loader2 size={14} className="animate-spin text-slate-400" />}
                        <button
                            type="button"
                            onClick={handleUseGPS}
                            disabled={isGPSLoading}
                            className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1.5 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50"
                            title="Use my current GPS location"
                        >
                            {isGPSLoading ? <Loader2 size={10} className="animate-spin" /> : <Crosshair size={10} />}
                            GPS
                        </button>
                    </div>
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {showResults && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
                        >
                            {searchResults.length > 0 ? (
                                searchResults.map((result, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => selectSearchResult(result)}
                                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-red-50 border-b border-slate-50 last:border-0"
                                    >
                                        <MapPin size={14} className="mt-0.5 shrink-0 text-red-500" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{result.name}</p>
                                            <p className="text-[11px] text-slate-400 truncate">{result.fullAddress}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-4 text-center">
                                    <AlertTriangle size={16} className="mx-auto mb-1 text-amber-400" />
                                    <p className="text-xs text-slate-500">No results found. Try adding city name.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Interactive Map */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200" style={{ height: '200px' }}>
                <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={selectedLocation ? 17 : 12}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationSelect={handleMapClick} />
                    <RecenterMap position={selectedLocation || mapCenter} />
                    {selectedLocation && (
                        <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={hospitalIcon} />
                    )}
                </MapContainer>

                {/* Map overlay hint */}
                {!selectedLocation && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center"
                         style={{ background: 'rgba(255,255,255,0.5)' }}>
                        <div className="rounded-2xl bg-white/90 px-4 py-2.5 shadow-lg border border-slate-200/60 text-center">
                            <MapPin size={20} className="mx-auto mb-1 text-red-500" />
                            <p className="text-xs font-bold text-slate-700">Search or tap to place pin</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmed Location Badge */}
            {selectedLocation && hospitalName && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 rounded-2xl p-3"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
                >
                    <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-600" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-green-800">{hospitalName}</p>
                        <p className="text-[10px] text-green-600/70 truncate">{confirmedAddress}</p>
                        <p className="mt-1 text-[10px] font-mono text-green-500">
                            📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedLocation(null);
                            setHospitalName('');
                            setConfirmedAddress('');
                            setSearchQuery('');
                            onLocationConfirm(null);
                        }}
                        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-red-500 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </motion.div>
            )}
        </div>
    );
}
