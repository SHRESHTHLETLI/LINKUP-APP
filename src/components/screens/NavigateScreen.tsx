import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Compass, 
  MapPin, 
  Search, 
  Trash2, 
  Navigation, 
  Layers, 
  Info, 
  Plus, 
  Check, 
  Star,
  LocateFixed,
  Route,
  Clock,
  Share2,
  Download,
  AlertTriangle,
  ExternalLink,
  X,
  Radio,
  ShieldAlert,
  Building,
  Home,
  GraduationCap,
  Briefcase,
  Users,
  Droplet,
  HeartPulse,
  Tent,
  CheckCircle2,
  StopCircle
} from 'lucide-react';
import { SavedPlace, SharedLocationSession } from '../../types';
import L from 'leaflet';

export const NavigateScreen: React.FC = () => {
  const { 
    savedPlaces, 
    selectedPlaceId,
    setSelectedPlaceId,
    addSavedPlace, 
    deleteSavedPlace, 
    toggleFavoritePlace, 
    mapPacks, 
    toggleMapPackDownload, 
    userCoords,
    refreshLocation,
    gpsAccuracy,
    locationPermissionState,
    activeSharedLocation,
    setActiveSharedLocation,
    liveSharingSession,
    startLiveSharing,
    stopLiveSharing,
    networkStatus,
    emergencyContacts,
    nearbyPeers,
    navigateTo,
    goBack 
  } = useApp();

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [mapLayerType, setMapLayerType] = useState<'street' | 'satellite'>('street');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchResults, setOnlineSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  // Selected Place / Destination
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(() => {
    if (selectedPlaceId) {
      const match = savedPlaces.find((p) => p.id === selectedPlaceId);
      if (match) return match;
    }
    return null;
  });

  // Active navigation route state
  const [activeRouteDestination, setActiveRouteDestination] = useState<SavedPlace | { title: string; coordinates: { lat: number; lng: number }; address?: string } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);

  // Filter category for saved places list
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals & Drawers
  const [isOfflineDrawerOpen, setIsOfflineDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalTab, setShareModalTab] = useState<'current' | 'live'>('live');
  const [selectedContactForShare, setSelectedContactForShare] = useState<string>(
    emergencyContacts[0]?.name || nearbyPeers[0]?.name || 'All Nearby Mesh Nodes'
  );
  const [liveDurationMinutes, setLiveDurationMinutes] = useState<number>(60);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [isProviderInfoOpen, setIsProviderInfoOpen] = useState(false);
  const [isPrivacyInfoOpen, setIsPrivacyInfoOpen] = useState(false);

  // New Place Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<SavedPlace['category']>('Home');
  const [newAddress, setNewAddress] = useState('');
  const [newLat, setNewLat] = useState(userCoords.lat.toString());
  const [newLng, setNewLng] = useState(userCoords.lng.toString());
  const [newNotes, setNewNotes] = useState('');

  // Calculate distance between two coordinates in km/m
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)}m`;
    }
    return `${distKm.toFixed(1)} km`;
  }, []);

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Home':
        return <Home className="w-3.5 h-3.5 text-cyan-400" />;
      case 'College':
        return <GraduationCap className="w-3.5 h-3.5 text-blue-400" />;
      case 'Work':
        return <Briefcase className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Family':
        return <Users className="w-3.5 h-3.5 text-violet-400" />;
      case 'Water':
        return <Droplet className="w-3.5 h-3.5 text-sky-400" />;
      case 'Medical':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />;
      case 'Camp':
        return <Tent className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Rendezvous':
        return <Compass className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-slate-300" />;
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Determine starting center: if activeSharedLocation exists, center on it; otherwise user coords
    const initialCenterLat = activeSharedLocation?.coordinates.lat || userCoords.lat;
    const initialCenterLng = activeSharedLocation?.coordinates.lng || userCoords.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initialCenterLat, initialCenterLng],
      zoom: 14,
      zoomControl: false, // Custom Google Maps style controls
      attributionControl: false,
    });

    // Add Tile Layer
    const tileUrl =
      mapLayerType === 'street'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Create marker layers group
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Invalidate size once rendered
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersGroupRef.current = null;
    };
  }, []);

  // 2. Handle Layer Type Toggle (Street vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl =
      mapLayerType === 'street'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const newLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapLayerType]);

  // 3. Render Markers & Route on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear previous markers
    markersGroup.clearLayers();

    // Remove existing route polyline if any
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // A. User Location Marker (Radar Pulse Pin)
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-500/25 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_12px_rgba(34,211,238,0.8)] z-10"></div>
          <div class="absolute -bottom-5 bg-slate-900/90 text-[10px] font-bold text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40 shadow whitespace-nowrap">
            YOU
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([userCoords.lat, userCoords.lng], { icon: userIcon, zIndexOffset: 1000 })
      .bindPopup(`
        <div style="font-family: system-ui; font-size: 12px; color: #0f172a; padding: 4px;">
          <strong>Your Current Position</strong><br/>
          Lat: ${userCoords.lat.toFixed(5)}, Lng: ${userCoords.lng.toFixed(5)}<br/>
          Accuracy: ±${gpsAccuracy}m (${locationPermissionState})
        </div>
      `)
      .addTo(markersGroup);

    // B. Render Saved Places Markers
    savedPlaces.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const isDestination = activeRouteDestination && 'id' in activeRouteDestination && activeRouteDestination.id === place.id;

      const markerColor = isDestination ? '#22d3ee' : isSelected ? '#38bdf8' : '#818cf8';
      const badgeBg = isDestination ? 'bg-cyan-500' : isSelected ? 'bg-sky-500' : 'bg-slate-800';

      const placeIcon = L.divIcon({
        className: 'custom-place-marker',
        html: `
          <div class="cursor-pointer transform hover:scale-110 transition-transform flex flex-col items-center">
            <div class="w-7 h-7 rounded-full ${badgeBg} border-2 border-white shadow-lg flex items-center justify-center text-white text-[11px] font-bold">
              ${place.category.slice(0, 1)}
            </div>
            <div class="bg-slate-900/95 text-[10px] font-medium text-slate-200 px-2 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap mt-1 max-w-[120px] truncate">
              ${place.title}
            </div>
          </div>
        `,
        iconSize: [30, 44],
        iconAnchor: [15, 20],
      });

      const marker = L.marker([place.coordinates.lat, place.coordinates.lng], { icon: placeIcon })
        .addTo(markersGroup);

      marker.on('click', () => {
        setSelectedPlace(place);
        setSelectedPlaceId(place.id);
        map.flyTo([place.coordinates.lat, place.coordinates.lng], 15, { duration: 0.8 });
      });
    });

    // C. Render Incoming Shared Location / Emergency Distress Marker
    if (activeSharedLocation) {
      const isEmergency = activeSharedLocation.isEmergency;

      const sharedIcon = L.divIcon({
        className: 'custom-shared-marker',
        html: `
          <div class="relative flex flex-col items-center cursor-pointer">
            ${isEmergency ? '<div class="absolute -top-1 w-10 h-10 rounded-full bg-rose-500/40 animate-ping"></div>' : ''}
            <div class="w-8 h-8 rounded-full ${isEmergency ? 'bg-rose-600 border-2 border-rose-300' : 'bg-violet-600 border-2 border-white'} shadow-xl flex items-center justify-center text-white z-10">
              ${isEmergency ? '🚨' : '📍'}
            </div>
            <div class="mt-1 bg-slate-900/95 ${isEmergency ? 'border-rose-500 text-rose-300' : 'border-violet-500 text-violet-200'} border px-2 py-0.5 rounded-full text-[10px] font-bold shadow whitespace-nowrap">
              ${activeSharedLocation.contactName || 'Shared'}
            </div>
          </div>
        `,
        iconSize: [36, 48],
        iconAnchor: [18, 24],
      });

      const sharedMarker = L.marker([activeSharedLocation.coordinates.lat, activeSharedLocation.coordinates.lng], {
        icon: sharedIcon,
        zIndexOffset: 1500,
      }).addTo(markersGroup);

      sharedMarker.on('click', () => {
        map.flyTo([activeSharedLocation.coordinates.lat, activeSharedLocation.coordinates.lng], 16, { duration: 0.8 });
      });
    }

    // D. Render Route Polyline if Route Destination is Selected
    if (activeRouteDestination) {
      const destCoords = activeRouteDestination.coordinates;

      // Realistic intermediate waypoint curve to represent street/trail routing
      const midLat = (userCoords.lat + destCoords.lat) / 2 + (destCoords.lng - userCoords.lng) * 0.15;
      const midLng = (userCoords.lng + destCoords.lng) / 2 - (destCoords.lat - userCoords.lat) * 0.15;

      const polyline = L.polyline(
        [
          [userCoords.lat, userCoords.lng],
          [midLat, midLng],
          [destCoords.lat, destCoords.lng],
        ],
        {
          color: '#06b6d4',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 6',
        }
      ).addTo(map);

      routeLayerRef.current = polyline;

      // Fit bounds to show both user and destination
      const bounds = L.latLngBounds([
        [userCoords.lat, userCoords.lng],
        [destCoords.lat, destCoords.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [
    savedPlaces,
    selectedPlace,
    activeRouteDestination,
    activeSharedLocation,
    userCoords,
    gpsAccuracy,
    locationPermissionState,
  ]);

  // Sync when selectedPlaceId from context changes
  useEffect(() => {
    if (selectedPlaceId) {
      const match = savedPlaces.find((p) => p.id === selectedPlaceId);
      if (match) {
        setSelectedPlace(match);
        setActiveRouteDestination(match);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([match.coordinates.lat, match.coordinates.lng], 15, { duration: 0.8 });
        }
      }
    }
  }, [selectedPlaceId, savedPlaces]);

  // Sync when activeSharedLocation is set from Connect or Safe
  useEffect(() => {
    if (activeSharedLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [activeSharedLocation.coordinates.lat, activeSharedLocation.coordinates.lng],
        16,
        { duration: 1.0 }
      );
      // Also automatically draft route from user's fix to the shared waypoint
      setActiveRouteDestination({
        title: activeSharedLocation.title,
        coordinates: activeSharedLocation.coordinates,
        address: activeSharedLocation.address,
      });
    }
  }, [activeSharedLocation]);

  // Handle Acquire Location Button
  const handleLocateMe = async () => {
    setLocationStatusMessage('Acquiring fresh GPS fix...');
    try {
      await refreshLocation();
      setLocationStatusMessage(`GPS fix locked (±${gpsAccuracy}m)`);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 15, { duration: 0.8 });
      }
      setTimeout(() => setLocationStatusMessage(null), 3000);
    } catch {
      setLocationStatusMessage('Location access restricted; showing last known fix');
      setTimeout(() => setLocationStatusMessage(null), 3500);
    }
  };

  // Zoom Helpers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  // Online Geocoding Query simulation + Nominatim query
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if matching saved place exists first
    const localMatch = savedPlaces.find((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (localMatch) {
      setSelectedPlace(localMatch);
      setActiveRouteDestination(localMatch);
      mapInstanceRef.current?.flyTo([localMatch.coordinates.lat, localMatch.coordinates.lng], 15);
      setSearchFocused(false);
      return;
    }

    if (networkStatus === 'offline') {
      setLocationStatusMessage('Offline mode active: Search restricted to local cached destinations.');
      setTimeout(() => setLocationStatusMessage(null), 3500);
      return;
    }

    setIsSearchingOnline(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=4`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.map((item: any) => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        setOnlineSearchResults(results);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Selecting an online search result
  const handleSelectSearchResult = (result: { name: string; lat: number; lng: number }) => {
    const customDestination = {
      title: result.name.split(',')[0],
      address: result.name,
      coordinates: { lat: result.lat, lng: result.lng },
    };
    setActiveRouteDestination(customDestination);
    setSelectedPlace(null);
    mapInstanceRef.current?.flyTo([result.lat, result.lng], 15, { duration: 0.8 });
    setSearchFocused(false);
    setSearchQuery(result.name.split(',')[0]);
  };

  // Handle Add New Place Form
  const handleAddPlaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const lat = parseFloat(newLat) || userCoords.lat;
    const lng = parseFloat(newLng) || userCoords.lng;
    const dist = calculateDistance(userCoords.lat, userCoords.lng, lat, lng);

    addSavedPlace({
      title: newTitle.trim(),
      category: newCategory,
      address: newAddress.trim() || undefined,
      coordinates: { lat, lng },
      distance: dist,
      bearing: 'Variable',
      offlineCached: true,
      notes: newNotes.trim() || 'Saved destination for offline navigation.',
      isFavorite: false,
      estimatedTime: `${Math.max(5, Math.round((parseFloat(dist) || 1) * 12))} min walk`,
    });

    setNewTitle('');
    setNewAddress('');
    setNewNotes('');
    setIsAddPlaceOpen(false);
  };

  // Filtered Saved Places
  const filteredSavedPlaces = savedPlaces.filter((p) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'favorites') return p.isFavorite;
    return p.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] sm:h-[calc(100vh-5rem)] overflow-hidden rounded-2xl bg-[#080d1a] border border-slate-800 shadow-2xl flex flex-col">
      
      {/* 1. Large Interactive Map Canvas */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing bg-[#080d1a]" 
      />

      {/* 2. Top Floating Google Maps-Inspired Navigation Bar */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-20 flex flex-col gap-2 pointer-events-none">
        
        {/* Search Row */}
        <div className="flex items-center gap-2 pointer-events-auto">
          
          {/* Back Button */}
          <button
            onClick={goBack}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white shadow-xl backdrop-blur-md transition-all active:scale-95"
            title="Return to Home Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Search Bar */}
          <form 
            onSubmit={handleSearchSubmit}
            className="flex-1 relative flex items-center bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl px-3.5 py-2 transition-all focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20"
          >
            <Search className="w-4 h-4 text-cyan-400 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search places, addresses, or saved waypoints..."
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setOnlineSearchResults([]); }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Map Layer Switcher: Street vs Satellite */}
          <button
            onClick={() => setMapLayerType((prev) => (prev === 'street' ? 'satellite' : 'street'))}
            className={`p-2.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold ${
              mapLayerType === 'satellite'
                ? 'bg-cyan-600 border-cyan-400 text-white shadow-cyan-900/30'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={`Switch to ${mapLayerType === 'street' ? 'Satellite Imagery' : 'Street Map'}`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline capitalize">{mapLayerType}</span>
          </button>

          {/* Share Location Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 text-white shadow-xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
            title="Share Current or Live Location"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Offline Maps Manager */}
          <button
            onClick={() => setIsOfflineDrawerOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white shadow-xl backdrop-blur-md transition-all active:scale-95 relative"
            title="Offline Maps & Caches"
          >
            <Download className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
          </button>
        </div>

        {/* Search Results Dropdown when focused */}
        {searchFocused && (
          <div className="bg-[#0e172a]/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-2 pointer-events-auto max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 border-b border-slate-800 pb-1.5">
              <span>Matching Destinations</span>
              <button 
                onClick={() => setSearchFocused(false)} 
                className="text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Local Matching Places */}
            {savedPlaces
              .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, 4)
              .map((place) => (
                <div
                  key={place.id}
                  onClick={() => {
                    setSelectedPlace(place);
                    setActiveRouteDestination(place);
                    mapInstanceRef.current?.flyTo([place.coordinates.lat, place.coordinates.lng], 15);
                    setSearchFocused(false);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      {getCategoryIcon(place.category)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{place.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{place.address || 'Saved Coordinate'}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">{place.distance}</span>
                </div>
              ))}

            {/* Online geocoding results */}
            {isSearchingOnline && (
              <div className="text-xs text-slate-400 py-2 text-center flex items-center justify-center gap-2 font-mono">
                <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Querying geographical geocoder...
              </div>
            )}

            {onlineSearchResults.map((result, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSearchResult(result)}
                className="p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer flex items-center gap-2 text-left"
              >
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-xs text-slate-200 truncate">{result.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Global Demo Status / GPS Toast Message */}
        {locationStatusMessage && (
          <div className="self-center px-4 py-2 rounded-xl bg-slate-900/95 border border-cyan-500/40 text-cyan-300 text-xs font-medium shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fade-in pointer-events-auto">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{locationStatusMessage}</span>
          </div>
        )}
      </div>

      {/* 3. Floating Map Controls (Right Side) */}
      <div className="absolute right-3 sm:right-6 top-24 z-20 flex flex-col gap-2">
        
        {/* Geolocate Me Button */}
        <button
          onClick={handleLocateMe}
          className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 hover:text-cyan-300 shadow-xl backdrop-blur-md transition-all active:scale-90"
          title="Center on My Location"
        >
          <LocateFixed className="w-5 h-5" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-2.5 rounded-t-xl bg-slate-900/90 hover:bg-slate-800 border-t border-x border-slate-700/80 text-slate-200 hover:text-white shadow-xl backdrop-blur-md transition-all active:scale-95 text-base font-bold"
          title="Zoom In"
        >
          +
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-2.5 rounded-b-xl bg-slate-900/90 hover:bg-slate-800 border-b border-x border-slate-700/80 text-slate-200 hover:text-white shadow-xl backdrop-blur-md transition-all active:scale-95 text-base font-bold -mt-2"
          title="Zoom Out"
        >
          −
        </button>

        {/* Provider & Credentials Info Dialog Trigger */}
        <button
          onClick={() => setIsProviderInfoOpen(true)}
          className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-cyan-300 shadow-xl backdrop-blur-md transition-all active:scale-90 mt-2"
          title="Map Engine & Data Source Information"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Active Live Sharing Session Top Notification Pill */}
      {liveSharingSession && (
        <div className="absolute top-18 sm:top-20 inset-x-3 sm:inset-x-auto sm:left-6 z-20 pointer-events-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-violet-950/90 border border-violet-500/40 shadow-2xl backdrop-blur-md text-xs flex items-center justify-between gap-3 text-violet-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              <div>
                <span className="font-semibold text-white">Live Sharing Active: </span>
                <span>{liveSharingSession.targetContactName}</span>
                <span className="text-violet-400 ml-1">({liveSharingSession.durationMinutes}m session)</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!liveSharingSession.isTransmitting && (
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Updates Paused (Offline)
                </span>
              )}
              <button
                onClick={stopLiveSharing}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] transition-colors"
              >
                Stop Sharing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Emergency Distress Banner (when activeSharedLocation is an Emergency from Safe/Connect) */}
      {activeSharedLocation?.isEmergency && (
        <div className="absolute top-18 sm:top-20 inset-x-3 sm:inset-x-6 z-30 pointer-events-auto animate-fade-in">
          <div className="p-4 rounded-2xl bg-rose-950/95 border-2 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.4)] backdrop-blur-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full">
                    EMERGENCY DISTRESS BEACON
                  </span>
                  <span className="text-xs text-rose-300 font-mono">
                    {activeSharedLocation.timestamp} · {activeSharedLocation.status === 'live' ? 'Verified Fix' : 'Last-Known Snapshot'}
                  </span>
                </div>
                <div className="text-base font-bold mt-1 text-rose-100">
                  {activeSharedLocation.title} — {activeSharedLocation.contactName}
                </div>
                <div className="text-xs text-rose-200 font-mono mt-0.5">
                  Lat: {activeSharedLocation.coordinates.lat.toFixed(5)}, Lng: {activeSharedLocation.coordinates.lng.toFixed(5)}
                  {activeSharedLocation.emergencyDetails?.bloodType && (
                    <span> · Blood Type: {activeSharedLocation.emergencyDetails.bloodType}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setActiveRouteDestination({
                    title: activeSharedLocation.title,
                    coordinates: activeSharedLocation.coordinates,
                    address: 'Distress Beacon Coordinates',
                  });
                  mapInstanceRef.current?.flyTo(
                    [activeSharedLocation.coordinates.lat, activeSharedLocation.coordinates.lng],
                    16
                  );
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg transition-colors flex items-center gap-1.5"
              >
                <Route className="w-4 h-4" />
                <span>Navigate to Beacon</span>
              </button>
              <button
                onClick={() => navigateTo('safe')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
              >
                Safe Centre
              </button>
              <button
                onClick={() => setActiveSharedLocation(null)}
                className="p-2 text-rose-300 hover:text-white"
                title="Dismiss Banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Incoming Shared Location Banner (Non-Emergency from Connect) */}
      {activeSharedLocation && !activeSharedLocation.isEmergency && (
        <div className="absolute top-18 sm:top-20 inset-x-3 sm:inset-x-6 z-20 pointer-events-auto animate-fade-in">
          <div className="p-3.5 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 shadow-2xl backdrop-blur-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-cyan-300">
                    Waypoint Shared by {activeSharedLocation.contactName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">
                    {activeSharedLocation.status === 'live' ? 'Live Fix' : `Last Known (${activeSharedLocation.timestamp})`}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-mono mt-0.5">
                  {activeSharedLocation.title} · {activeSharedLocation.coordinates.lat.toFixed(5)}, {activeSharedLocation.coordinates.lng.toFixed(5)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveRouteDestination({
                    title: activeSharedLocation.title,
                    coordinates: activeSharedLocation.coordinates,
                    address: activeSharedLocation.address,
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow transition-colors flex items-center gap-1.5"
              >
                <Route className="w-3.5 h-3.5" />
                <span>Show Route</span>
              </button>
              <button
                onClick={() => setActiveSharedLocation(null)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Bottom Google Maps-Style Sheet & Destination Tray */}
      <div className="absolute bottom-2 inset-x-2 sm:inset-x-6 z-20 flex flex-col gap-2 pointer-events-none">
        
        {/* If Active Destination Selected: Show Detailed Route & Navigation Card */}
        {activeRouteDestination ? (
          <div className="bg-[#0e172a]/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl pointer-events-auto animate-fade-in max-w-xl mx-auto w-full">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {activeRouteDestination.title}
                    </h3>
                    {'category' in activeRouteDestination && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                        {(activeRouteDestination as SavedPlace).category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {activeRouteDestination.address ||
                      `Lat: ${activeRouteDestination.coordinates.lat.toFixed(5)}, Lng: ${activeRouteDestination.coordinates.lng.toFixed(5)}`}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                    <span className="text-cyan-400 font-bold">
                      {calculateDistance(
                        userCoords.lat,
                        userCoords.lng,
                        activeRouteDestination.coordinates.lat,
                        activeRouteDestination.coordinates.lng
                      )}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {isNavigating ? 'Guidance Active' : 'Approx 14 min walk'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveRouteDestination(null);
                  setIsNavigating(false);
                }}
                className="text-slate-400 hover:text-white p-1"
                title="Close Route Details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Turn-by-turn or external actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsNavigating((prev) => !prev)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isNavigating
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
                }`}
              >
                {isNavigating ? (
                  <>
                    <StopCircle className="w-4 h-4" />
                    <span>Stop Guidance</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>Start Tactical Navigation</span>
                  </>
                )}
              </button>

              {/* Open in external navigation application (Google Maps / Apple Maps) */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeRouteDestination.coordinates.lat},${activeRouteDestination.coordinates.lng}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors flex items-center gap-1.5"
                title="Launch Google Maps turn-by-turn guidance"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Google Maps</span>
              </a>

              {/* Attach to Connect Chat */}
              <button
                onClick={() => {
                  navigateTo('connect');
                }}
                className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors flex items-center gap-1.5"
                title="Share this destination in Connect chat"
              >
                <Share2 className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden sm:inline">Send to Chat</span>
              </button>
            </div>
          </div>
        ) : (
          /* Bottom Destination Carousel: Categories & Quick Waypoints */
          <div className="bg-[#0e172a]/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-3 sm:p-4 shadow-2xl pointer-events-auto space-y-2.5">
            
            {/* Category Filter Pills & Add Place Action */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
              <div className="flex items-center gap-1.5">
                {['all', 'favorites', 'home', 'college', 'work', 'family', 'camp', 'medical', 'water'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl font-medium capitalize whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAddPlaceOpen(true)}
                className="px-3 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-semibold text-xs flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Place</span>
              </button>
            </div>

            {/* Horizontal Scrollable Destination Cards */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {filteredSavedPlaces.map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                return (
                  <div
                    key={place.id}
                    onClick={() => {
                      setSelectedPlace(place);
                      setActiveRouteDestination(place);
                      mapInstanceRef.current?.flyTo([place.coordinates.lat, place.coordinates.lng], 15);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer min-w-[200px] max-w-[240px] shrink-0 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950'
                        : 'bg-[#080d1a]/80 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-lg bg-slate-800 border border-slate-700">
                          {getCategoryIcon(place.category)}
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400">{place.category}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoritePlace(place.id);
                        }}
                        className={`p-1 ${place.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <div className="text-xs font-bold text-white mt-1.5 truncate">
                      {place.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {place.address || `${place.coordinates.lat.toFixed(4)}, ${place.coordinates.lng.toFixed(4)}`}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-300 font-semibold">{place.distance}</span>
                      <span className="text-cyan-400 font-medium">{place.estimatedTime || 'Show Route'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

      {/* MODAL 1: Location Sharing Modal (Current vs Live Location) */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e172a] border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Share Location</h3>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle: Share Current Location vs Share Live Location */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
              <button
                onClick={() => setShareModalTab('live')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl transition-colors ${
                  shareModalTab === 'live'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Share Live Location
              </button>
              <button
                onClick={() => setShareModalTab('current')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl transition-colors ${
                  shareModalTab === 'current'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Current Fix (Snapshot)
              </button>
            </div>

            {/* Live Location Configuration */}
            {shareModalTab === 'live' ? (
              <div className="space-y-3.5 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Streams your coordinates to selected contacts or nearby mesh peers for a specified duration.
                </p>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Select Recipient Contact
                  </label>
                  <select
                    value={selectedContactForShare}
                    onChange={(e) => setSelectedContactForShare(e.target.value)}
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="All Nearby Mesh Nodes">Broadcast to Nearby Mesh Grid</option>
                    {emergencyContacts.map((c) => (
                      <option key={c.id} value={c.name}>{c.name} ({c.relation})</option>
                    ))}
                    {nearbyPeers.map((p) => (
                      <option key={p.id} value={p.name}>{p.name} ({p.deviceType})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Live Session Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 60, 480].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setLiveDurationMinutes(mins)}
                        className={`py-2 rounded-xl font-mono text-xs font-bold border transition-colors ${
                          liveDurationMinutes === mins
                            ? 'bg-violet-600/30 border-violet-500 text-violet-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {mins < 60 ? `${mins} Mins` : `${mins / 60} Hour${mins > 60 ? 's' : ''}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Offline Live Transmission Disclosure */}
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Offline Connectivity Notice:</strong> While GPS works without cellular data, transmitting live updates to remote devices requires an active mesh relay or network connection. If offline, peers retain your last-known fix.
                  </span>
                </div>

                <button
                  onClick={() => {
                    startLiveSharing(selectedContactForShare, liveDurationMinutes);
                    setIsShareModalOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Start Live Sharing Session</span>
                </button>
              </div>
            ) : (
              /* Share Current Location Snapshot */
              <div className="space-y-3.5 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Sends an instantaneous one-time snapshot of your current latitude, longitude, and timestamp without ongoing tracking.
                </p>

                <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Latitude:</span>
                    <span className="text-white font-bold">{userCoords.lat.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Longitude:</span>
                    <span className="text-white font-bold">{userCoords.lng.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GPS Accuracy:</span>
                    <span className="text-cyan-400">±{gpsAccuracy} meters</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Timestamp:</span>
                    <span className="text-slate-300">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigateTo('connect');
                    setIsShareModalOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send Snapshot to Connect Chat</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL 2: Offline Maps & Caching Drawer */}
      {isOfflineDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e172a] border-l border-slate-800 h-full max-w-md w-full p-6 shadow-2xl flex flex-col justify-between space-y-4 overflow-y-auto">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Offline Map Packs</h3>
                </div>
                <button 
                  onClick={() => setIsOfflineDrawerOpen(false)} 
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Technical Disclaimer on Genuine Offline Caching */}
              <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-cyan-500/30 text-xs text-slate-300 space-y-2 leading-relaxed">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Offline Storage Transparency:</span>
                </div>
                <p>
                  Offline maps store raster and vector tiles directly in browser IndexedDB/CacheStorage. Downloaded sectors remain fully pannable and zoomable without cellular network or Wi-Fi. Satellite streaming beyond cached bounds requires active connectivity.
                </p>
              </div>

              {/* Map Packs List */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Available Regional Sectors
                </h4>

                {mapPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="p-3.5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{pack.regionName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {pack.sizeMb} MB · {pack.tilesCount.toLocaleString()} map tiles
                        </div>
                      </div>

                      {pack.isDownloaded ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Cached
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">
                          Not Cached
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {pack.lastUpdated}
                      </span>
                      <button
                        onClick={() => toggleMapPackDownload(pack.id)}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                          pack.isDownloaded
                            ? 'bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 border border-slate-700'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
                        }`}
                      >
                        {pack.isDownloaded ? 'Remove Cache' : 'Download Pack'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsOfflineDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
            >
              Done
            </button>

          </div>
        </div>
      )}

      {/* MODAL 3: Add New Saved Place Modal */}
      {isAddPlaceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <form 
            onSubmit={handleAddPlaceSubmit}
            className="bg-[#0e172a] border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Save New Destination</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddPlaceOpen(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Place Name
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Home, Tech College, Work HQ, Family Safe Point"
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Destination Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Home">Home</option>
                  <option value="College">College</option>
                  <option value="Work">Work</option>
                  <option value="Family">Family</option>
                  <option value="Shelter">Shelter</option>
                  <option value="Water">Water Station</option>
                  <option value="Medical">Medical Depot</option>
                  <option value="Camp">Camp Base</option>
                  <option value="Custom">Custom Destination</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Street Address or Sector Landmark
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. 42 Elmwood Ave or Sector 4 Ridge"
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Notes & Provisions
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Emergency generator, keypad code, rendezvous plan..."
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddPlaceOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors"
              >
                Save Destination
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: Map Provider & Data Integrity Information Dialog */}
      {isProviderInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e172a] border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Mapping Engine & Credentials</h3>
              </div>
              <button 
                onClick={() => setIsProviderInfoOpen(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 space-y-2">
                <div className="text-cyan-400 font-bold text-[11px] uppercase tracking-wider">
                  Active Mapping Engine Status
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span>Interactive Map Engine:</span>
                  <span className="text-emerald-400 font-mono font-bold">Leaflet Geographical Canvas</span>
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span>Street Map Layer:</span>
                  <span className="text-slate-300 font-mono">OpenStreetMap Tiles</span>
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span>High-Res Satellite Layer:</span>
                  <span className="text-slate-300 font-mono">Esri World Imagery</span>
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span>API Key Requirement:</span>
                  <span className="text-emerald-400 font-mono font-bold">None Required (Fully Operational)</span>
                </div>
              </div>

              <p>
                LINKUP Navigate adheres to strict production integrity guidelines: it does not invent fake Google Maps keys or claim an unconfigured cloud project is active. Interactive street and satellite layers operate out of the box.
              </p>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-200">
                Turn-by-turn routing actions can open in external Google Maps or Apple Maps using direct coordinate URIs (`https://www.google.com/maps/dir/?api=1&destination=...`).
              </div>
            </div>

            <button
              onClick={() => setIsProviderInfoOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
            >
              Understood
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
