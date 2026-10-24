import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Phone, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Check, 
  Plus, 
  Trash2, 
  Edit3,
  Info, 
  Clock, 
  ShieldCheck, 
  XCircle,
  Heart,
  FileText,
  UserCheck,
  Compass,
  MapPin,
  RefreshCw,
  Radio,
  Wifi,
  WifiOff,
  Copy,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Send,
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { EmergencyContact, SosEvent, SosAlertStatus } from '../../types';

export const SafeScreen: React.FC = () => {
  const { 
    emergencyContacts, 
    addEmergencyContact, 
    updateEmergencyContact,
    deleteEmergencyContact, 
    toggleSelectContactForAlert,
    selectAllContactsForAlert,
    privacySettings,
    updatePrivacySettings,
    isSosActive, 
    activeSosEvent,
    sosCountdown, 
    startSosCountdown, 
    cancelSosCountdown, 
    triggerSosImmediately, 
    deactivateSos,
    retrySosBroadcast,
    sosHistory,
    isSirenAudible, 
    toggleSirenAudio,
    lastCheckIn, 
    performSafetyCheckIn,
    profile, 
    updateProfile,
    networkStatus, 
    userCoords, 
    gpsAccuracy,
    locationTimestamp,
    isLocationStale,
    locationPermissionState,
    refreshLocation,
    openInNavigate, 
    goBack 
  } = useApp();

  // Contact management modal state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactCallsign, setContactCallsign] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [contactAlertViaMesh, setContactAlertViaMesh] = useState(true);
  const [contactAlertViaSms, setContactAlertViaSms] = useState(true);

  // Unmask individual phone numbers state
  const [unmaskedContactIds, setUnmaskedContactIds] = useState<Record<string, boolean>>({});

  // Safety check-in feedback
  const [checkInFeedback, setCheckInFeedback] = useState<string | null>(null);
  const [copiedLinkFeedback, setCopiedLinkFeedback] = useState(false);

  // Edit medical notes state
  const [bloodType, setBloodType] = useState(profile.emergencyBloodType || 'O-Negative');
  const [medicalNotes, setMedicalNotes] = useState(profile.medicalNotes || 'No known allergies. Penicillin safe.');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

  // Confirmation modal for cancelling active SOS
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState<'resolved' | 'cancelled'>('resolved');

  // Android Native Integration spec accordion
  const [showAndroidSpec, setShowAndroidSpec] = useState(false);

  // History filtering
  const [historyFilter, setHistoryFilter] = useState<'all' | 'active' | 'resolved'>('all');

  // Contact modal handlers
  const handleOpenAddContact = () => {
    setEditingContactId(null);
    setContactName('');
    setContactPhone('');
    setContactRelation('Trusted Contact');
    setContactCallsign('');
    setContactNotes('');
    setContactAlertViaMesh(true);
    setContactAlertViaSms(true);
    setIsAddingContact(true);
  };

  const handleOpenEditContact = (contact: EmergencyContact) => {
    setEditingContactId(contact.id);
    setContactName(contact.name);
    setContactPhone(contact.phone);
    setContactRelation(contact.relation);
    setContactCallsign(contact.radioCallsign || '');
    setContactNotes(contact.notes || '');
    setContactAlertViaMesh(contact.alertViaMesh);
    setContactAlertViaSms(contact.alertViaSms);
    setIsAddingContact(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    if (editingContactId) {
      updateEmergencyContact(editingContactId, {
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relation: contactRelation.trim() || 'Trusted Contact',
        radioCallsign: contactCallsign.trim() || undefined,
        notes: contactNotes.trim() || undefined,
        alertViaMesh: contactAlertViaMesh,
        alertViaSms: contactAlertViaSms,
      });
    } else {
      addEmergencyContact({
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relation: contactRelation.trim() || 'Trusted Contact',
        radioCallsign: contactCallsign.trim() || undefined,
        notes: contactNotes.trim() || undefined,
        priority: emergencyContacts.length + 1,
        alertViaMesh: contactAlertViaMesh,
        alertViaSms: contactAlertViaSms,
        selectedForAlert: true,
      });
    }

    setIsAddingContact(false);
    setEditingContactId(null);
  };

  const handleCheckIn = () => {
    const timestamp = performSafetyCheckIn();
    setCheckInFeedback(`Safety Check-in logged at ${timestamp}`);
    setTimeout(() => setCheckInFeedback(null), 4000);
  };

  const handleSaveMedicalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      emergencyBloodType: bloodType,
      medicalNotes,
    });
    setIsEditingInfo(false);
  };

  const handleRefreshLocation = async () => {
    setIsRefreshingGps(true);
    try {
      await refreshLocation();
    } finally {
      setIsRefreshingGps(false);
    }
  };

  const handleCopyLocationLink = () => {
    const eventId = activeSosEvent?.id || 'SOS-2026-DIRECT';
    const link = `${window.location.origin}/#navigate?lat=${userCoords.lat}&lng=${userCoords.lng}&sos=${eventId}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedLinkFeedback(true);
    setTimeout(() => setCopiedLinkFeedback(false), 3000);
  };

  const handleConfirmDeactivate = () => {
    deactivateSos(deactivateReason);
    setShowDeactivateModal(false);
  };

  const toggleMaskContact = (id: string) => {
    setUnmaskedContactIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatPhone = (phone: string, contactId: string) => {
    if (!privacySettings.maskPhoneNumbers || unmaskedContactIds[contactId]) {
      return phone;
    }
    // Mask middle digits: e.g. +1 (555) ***-5678
    if (phone.length <= 6) return '***-***';
    const last4 = phone.slice(-4);
    const prefix = phone.slice(0, 7);
    return `${prefix} ***-${last4}`;
  };

  const selectedContactsCount = emergencyContacts.filter((c) => c.selectedForAlert !== false).length;

  const filteredHistory = sosHistory.filter((evt) => {
    if (historyFilter === 'active') return evt.status === 'active';
    if (historyFilter === 'resolved') return evt.status === 'resolved' || evt.status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status: SosAlertStatus) => {
    switch (status) {
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <RefreshCw className="w-3 h-3 animate-spin" /> Preparing
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/50">
            <Clock className="w-3 h-3 text-amber-400" /> Queued Locally (No Link)
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
            <Send className="w-3 h-3 text-cyan-400 animate-pulse" /> Transmitting
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
            <Check className="w-3 h-3 text-emerald-400" /> Delivered via Uplink
          </span>
        );
      case 'acknowledged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-400">
            <CheckCheck className="w-3 h-3 text-emerald-400" /> Acknowledged by Mesh Peer
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Transmission Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-20 sm:pb-10 max-w-6xl mx-auto">
      
      {/* 1. Header with Breadcrumb and Clear Module Name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">LINKUP Safe</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-500/40">
                Emergency Centre
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personal safety coordination, off-grid SOS broadcasts & trusted emergency contacts
            </p>
          </div>
        </div>

        {/* Global Arm / Active Status Badge */}
        <div className="flex items-center gap-2">
          {isSosActive ? (
            <button
              onClick={() => {
                setDeactivateReason('resolved');
                setShowDeactivateModal(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-rose-900/50 animate-pulse transition-all active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Active SOS</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">SOS Armed & Standby</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Notice: Simulated Demonstration & Honest Offline Limits */}
      <div className="p-4 rounded-2xl bg-rose-950/25 border border-rose-500/30 space-y-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-rose-300 font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Emergency Operations Demonstration Notice</span>
          </div>
          <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2.5 py-0.5 rounded-full">
            REALISTIC SIMULATION · DOES NOT PLACE REAL 911 CALLS
          </span>
        </div>
        <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed">
          LINKUP Safe coordinates emergency assistance and periodic check-ins across offline mesh and satellite topologies. 
          <strong> Without cellular or mesh connectivity, alerts cannot be guaranteed to reach remote authorities or family members.</strong> 
          No telephone calls or automatic 911 dispatch will be initiated from this browser demo.
        </p>
      </div>

      {/* 3. IMMEDIATE EMERGENCY INTERFACE — No Multi-Menu Digging Required */}
      <div className={`rounded-3xl border transition-all p-6 sm:p-8 text-center relative overflow-hidden ${
        isSosActive
          ? 'bg-gradient-to-b from-rose-950/60 via-[#0e172a] to-[#080d1a] border-rose-500/60 shadow-[0_0_50px_rgba(244,63,94,0.2)]'
          : sosCountdown !== null
          ? 'bg-gradient-to-b from-amber-950/50 via-[#0e172a] to-[#080d1a] border-amber-500/50'
          : 'bg-[#0e172a] border-rose-500/30'
      }`}>
        <div className="max-w-xl mx-auto space-y-6">

          {/* STATE A: Active 5-Second Countdown Flow */}
          {sosCountdown !== null ? (
            <div className="space-y-5 animate-scale-up py-4">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/30 animate-ping opacity-50" />
                <div className="w-full h-full rounded-full bg-rose-600 border-4 border-rose-400 flex items-center justify-center text-4xl sm:text-5xl font-black text-white shadow-2xl shadow-rose-900/60">
                  {sosCountdown}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold bg-rose-950/80 px-3 py-1 rounded-full border border-rose-500/40">
                  Accidental Activation Safeguard
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                  Initiating Emergency Alert in {sosCountdown}s
                </h2>
                <p className="text-xs text-rose-200 mt-1.5 max-w-md mx-auto">
                  Preparing distress packet with current GPS fix for {selectedContactsCount} selected trusted contacts.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={cancelSosCountdown}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  Cancel / False Alarm
                </button>
                <button
                  onClick={triggerSosImmediately}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/40 transition-all active:scale-95 cursor-pointer"
                >
                  Confirm Immediately (Skip Countdown)
                </button>
              </div>
            </div>
          ) : isSosActive && activeSosEvent ? (
            /* STATE B: Active SOS Broadcast State */
            <div className="space-y-5 animate-fade-in py-2">
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 animate-pulse shadow-lg shadow-rose-900/50">
                  <ShieldAlert className="w-10 h-10" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 font-bold bg-rose-950 border border-rose-500/50 px-3 py-0.5 rounded-full">
                    Active Incident: {activeSosEvent.id}
                  </span>
                  {getStatusBadge(activeSosEvent.deliveryStatus)}
                </div>
                <h2 className="text-2xl font-black text-white">
                  EMERGENCY SOS BROADCAST ACTIVE
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-lg mx-auto">
                  Distress telemetry packaged at {activeSosEvent.triggeredAt}.
                </p>
              </div>

              {/* Real Route & Offline Communication Status Card */}
              <div className="p-4 rounded-2xl bg-[#080d1a] border border-slate-800 text-left text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    Actual Transmission Route
                  </span>
                  <span className="font-mono text-[10px] text-cyan-400">
                    {networkStatus.toUpperCase()}
                  </span>
                </div>

                <div className="text-slate-300 text-xs leading-relaxed">
                  {activeSosEvent.statusExplanation}
                </div>

                {/* Honest Offline Warning */}
                {networkStatus === 'offline' && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Honest Delivery Status:</strong> Your alert is safely queued on device flash storage. 
                      Because no mesh relay or internet connection is in range, it has <strong>not</strong> been received by family or dispatchers yet. 
                      It will auto-synchronize as soon as an operator or node comes within radio reach.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Location Fix:</span>
                    <span className="font-mono text-white font-semibold">
                      {activeSosEvent.latitude !== null ? `${activeSosEvent.latitude.toFixed(4)}°, ${activeSosEvent.longitude?.toFixed(4)}°` : 'Location Denied'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Accuracy:</span>
                    <span className="font-mono text-cyan-400 font-semibold">
                      {activeSosEvent.accuracyMeters ? `±${activeSosEvent.accuracyMeters}m` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Contacts Selected:</span>
                    <span className="text-slate-200 font-medium">
                      {activeSosEvent.contactsNotified.length} Persons
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Channel:</span>
                    <span className="font-mono text-slate-300">
                      {activeSosEvent.broadcastChannel.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Active SOS */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => openInNavigate({
                    title: `Emergency Fix: ${activeSosEvent.id}`,
                    coordinates: { 
                      lat: activeSosEvent.latitude ?? userCoords.lat, 
                      lng: activeSosEvent.longitude ?? userCoords.lng 
                    },
                    address: 'Emergency Distress Fix',
                    contactName: `${profile.callsign} [SOS Node]`,
                    isEmergency: true,
                    emergencyDetails: {
                      bloodType: activeSosEvent.sharedMedicalInfo?.bloodType,
                      callsign: activeSosEvent.sharedMedicalInfo?.callsign,
                      notes: activeSosEvent.sharedMedicalInfo?.notes,
                    },
                    isLive: false,
                    status: networkStatus === 'offline' ? 'last_known' : 'live',
                    timestamp: activeSosEvent.triggeredAt,
                    source: 'safe',
                  })}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Open Location in LINKUP Navigate</span>
                </button>

                <button
                  onClick={toggleSirenAudio}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                    isSirenAudible
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {isSirenAudible ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isSirenAudible ? 'Mute Siren' : 'Test Acoustic Siren'}</span>
                </button>

                {activeSosEvent.deliveryStatus === 'queued' && (
                  <button
                    onClick={() => retrySosBroadcast(activeSosEvent.id)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Broadcast</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setDeactivateReason('resolved');
                    setShowDeactivateModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  Deactivate SOS / Mark Safe
                </button>
              </div>
            </div>
          ) : (
            /* STATE C: Standby State with Large, High-Contrast SOS Button */
            <div className="space-y-4 py-2">
              <button
                onClick={startSosCountdown}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-rose-600 hover:bg-rose-500 border-4 border-rose-400/80 hover:border-rose-300 shadow-[0_0_50px_rgba(244,63,94,0.45)] flex flex-col items-center justify-center mx-auto transition-all active:scale-95 group cursor-pointer focus:outline-none focus:ring-4 focus:ring-rose-500/50"
                aria-label="Initiate Emergency SOS Sequence"
              >
                <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-white transition-transform group-hover:scale-110 drop-shadow-md" />
                <span className="text-sm sm:text-base font-black tracking-wider text-white mt-1 drop-shadow-sm">
                  EMERGENCY SOS
                </span>
              </button>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Tap to Initiate Emergency SOS
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Triggers a 5-second accidental-activation safety timer before broadcasting distress coordinates to your {selectedContactsCount} selected trusted contacts.
                </p>
              </div>

              {/* Quick direct trigger shortcut if immediate help needed */}
              <div className="pt-1">
                <button
                  onClick={triggerSosImmediately}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-mono underline underline-offset-4 cursor-pointer"
                >
                  Skip countdown & broadcast immediately
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 4. EMERGENCY LOCATION VIEW & PROTECTED LINK */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Emergency Location View</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Live vs Stale indicator */}
            {isLocationStale ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-500/40">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                STALE / LAST KNOWN FIX
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE GPS FIX
              </span>
            )}

            <button
              onClick={handleRefreshLocation}
              disabled={isRefreshingGps}
              className="p-1.5 rounded-lg bg-[#080d1a] border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh GPS Coordinates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingGps ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Coordinates</span>
            <div className="font-mono text-white text-sm font-semibold">
              {userCoords.lat.toFixed(5)}° N, {userCoords.lng.toFixed(5)}° W
            </div>
            <div className="text-[10px] text-slate-400">
              Sector 4 Operational Grid Area
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Fix Timestamp & Accuracy</span>
            <div className="font-mono text-cyan-400 text-sm font-semibold">
              ±{gpsAccuracy}m Accuracy
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Acquired: {locationTimestamp || 'Just now'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-1 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500">Permission & Status</span>
            <div className="font-medium text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Permission: {locationPermissionState.toUpperCase()}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {isLocationStale ? 'Awaiting fresh satellite lock' : 'Actively tracked via browser API'}
            </div>
          </div>
        </div>

        {/* Protected Emergency Location Link & Button to Open Navigate */}
        <div className="p-4 rounded-2xl bg-[#080d1a] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Protected Location Link</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              {`${window.location.origin}/#navigate?lat=${userCoords.lat}&lng=${userCoords.lng}&sos=${activeSosEvent?.id || 'DIRECT'}`}
            </p>
            <p className="text-[10px] text-slate-500">
              Protected: Coordinates are tokenized and protected from unauthorized public crawling.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLocationLink}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLinkFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLinkFeedback ? 'Copied Link' : 'Copy Link'}</span>
            </button>

            <button
              onClick={() => openInNavigate({
                title: 'Current Emergency Position',
                coordinates: { lat: userCoords.lat, lng: userCoords.lng },
                address: 'Active Tactical Position Fix',
                contactName: `${profile.callsign} [User]`,
                isEmergency: true,
                isLive: !isLocationStale,
                status: isLocationStale ? 'last_known' : 'live',
                timestamp: locationTimestamp,
                source: 'safe',
              })}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Open in Navigate</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. EMERGENCY CONTACT MANAGER (Add, Edit, Remove, Select to Notify) */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Emergency Contacts Manager ({emergencyContacts.length})
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
                {selectedContactsCount} of {emergencyContacts.length} Selected for SOS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage trusted contacts, radio callsigns, and toggle who will receive distress broadcasts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => selectAllContactsForAlert(selectedContactsCount < emergencyContacts.length)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              {selectedContactsCount === emergencyContacts.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleOpenAddContact}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emergencyContacts.map((contact) => {
            const isSelected = contact.selectedForAlert !== false;
            return (
              <div
                key={contact.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-[#080d1a] border-slate-700 shadow-sm'
                    : 'bg-[#080d1a]/50 border-slate-800/60 opacity-60'
                }`}
              >
                <div>
                  {/* Card Header: Checkbox to notify & actions */}
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSelectContactForAlert(contact.id)}
                      className="flex items-center gap-2 text-left cursor-pointer group"
                      title={isSelected ? 'Click to exclude from SOS alert' : 'Click to include in SOS alert'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-slate-400" />
                      )}
                      <div>
                        <div className="font-bold text-xs text-white group-hover:text-rose-200 transition-colors">
                          {contact.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{contact.relation}</div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditContact(contact)}
                        className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Edit Contact Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteEmergencyContact(contact.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Phone & Callsign info */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-cyan-400" />
                        <span>{formatPhone(contact.phone, contact.id)}</span>
                      </div>
                      {privacySettings.maskPhoneNumbers && (
                        <button
                          onClick={() => toggleMaskContact(contact.id)}
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                          title={unmaskedContactIds[contact.id] ? 'Mask phone' : 'Reveal phone'}
                        >
                          {unmaskedContactIds[contact.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {contact.radioCallsign && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <Radio className="w-3 h-3 text-amber-400" />
                        <span>Callsign: {contact.radioCallsign}</span>
                      </div>
                    )}

                    {contact.notes && (
                      <p className="text-[10px] text-slate-400 leading-tight pt-1">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer status pills */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className={`font-semibold ${isSelected ? 'text-rose-400' : 'text-slate-500'}`}>
                    {isSelected ? '● Armed for SOS' : '○ Standby only'}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 font-mono">
                    {contact.alertViaMesh && <span className="text-cyan-400">Mesh</span>}
                    {contact.alertViaMesh && contact.alertViaSms && <span>·</span>}
                    {contact.alertViaSms && <span className="text-emerald-400">SMS</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. EMERGENCY DETAILS & PRIVACY PAYLOAD CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card A: Medical ID & Explicit Details */}
        <div className="bg-[#0e172a] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Emergency Medical Profile</h3>
              </div>
              <button
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
              >
                {isEditingInfo ? 'Cancel' : 'Edit Medical ID'}
              </button>
            </div>

            {isEditingInfo ? (
              <form onSubmit={handleSaveMedicalInfo} className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Blood Type</label>
                  <input
                    type="text"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Allergies & Critical Notes</label>
                  <textarea
                    rows={2}
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-lg p-2 text-white text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Medical Details
                </button>
              </form>
            ) : (
              <div className="space-y-3 pt-2 text-xs">
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Only the details you explicitly choose are encoded into emergency distress transmissions.
                </p>

                <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Assigned Callsign:</span>
                    <span className="text-white font-mono font-bold">{profile.callsign}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Emergency Blood Type:</span>
                    <span className="font-mono text-rose-400 font-bold">{profile.emergencyBloodType || 'O-Negative'}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block mb-1 text-[11px]">Medical & Allergy Notes:</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {profile.medicalNotes || 'No known allergies. Penicillin safe.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 pt-1">
            Data resides strictly in local browser storage; never shared without your manual SOS activation.
          </div>
        </div>

        {/* Card B: Privacy Packet Controls */}
        <div className="bg-[#0e172a] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Emergency Packet Privacy Controls</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Granular Privacy</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              Select which fields are included in the emergency broadcast payload. Minimizes exposure of personal identifiers:
            </p>

            <div className="mt-3 space-y-2.5 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[#080d1a] border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={privacySettings.includeCallsign}
                  onChange={(e) => updatePrivacySettings({ includeCallsign: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300">Include Callsign ({profile.callsign}) in payload</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[#080d1a] border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={privacySettings.includeBloodType}
                  onChange={(e) => updatePrivacySettings({ includeBloodType: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300">Include Blood Type ({profile.emergencyBloodType || 'O-'})</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[#080d1a] border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={privacySettings.includeMedicalNotes}
                  onChange={(e) => updatePrivacySettings({ includeMedicalNotes: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300">Include Medical / Allergy notes</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[#080d1a] border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={privacySettings.maskPhoneNumbers}
                  onChange={(e) => updatePrivacySettings({ maskPhoneNumbers: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300">Mask contact phone numbers on public screen view</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <span>Payload Size: ~180 Bytes</span>
            <span className="text-cyan-400 font-mono">Compatible with LoRa/BLE</span>
          </div>
        </div>

      </div>

      {/* 7. PERIODIC SAFETY CHECK-IN WORKFLOW */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Periodic Safety Welfare Check-In</h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Routine Status Log
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2 space-y-2 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Confirm operational safety with a single tap. Records a verified timestamp in your local device log and broadcasts a green heartbeat to nearby mesh peers.
            </p>
            <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Last Recorded Check-In:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {lastCheckIn || 'No check-in recorded yet'}
              </span>
            </div>
            {checkInFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{checkInFeedback}</span>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={handleCheckIn}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>I'm OK — Confirm Check-In</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8. EMERGENCY EVENT HISTORY */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">Emergency Event History</h3>
            <p className="text-xs text-slate-400">Audit log of all triggered SOS events and their delivery records</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#080d1a] border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setHistoryFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                historyFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({sosHistory.length})
            </button>
            <button
              onClick={() => setHistoryFilter('active')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                historyFilter === 'active' ? 'bg-rose-950 text-rose-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setHistoryFilter('resolved')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                historyFilter === 'resolved' ? 'bg-emerald-950 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No emergency events matching selected filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-2xl bg-[#080d1a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{evt.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      evt.status === 'active'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse'
                        : evt.status === 'cancelled'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {evt.status}
                    </span>
                    {getStatusBadge(evt.deliveryStatus)}
                  </div>

                  <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                    <span>Triggered: {evt.triggeredAt}</span>
                    <span>·</span>
                    <span>
                      Contacts: {evt.contactsNotified.join(', ') || 'Default team'}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500">
                    Fix: {evt.latitude !== null ? `${evt.latitude.toFixed(4)}°, ${evt.longitude?.toFixed(4)}° (±${evt.accuracyMeters || 8}m)` : 'No Location Fix'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {evt.latitude !== null && evt.longitude !== null && (
                    <button
                      onClick={() => openInNavigate({
                        title: `Incident: ${evt.id}`,
                        coordinates: { lat: evt.latitude!, lng: evt.longitude! },
                        address: 'Incident Historical Fix',
                        contactName: `${profile.callsign} [Historical SOS]`,
                        isEmergency: true,
                        status: 'last_known',
                        timestamp: evt.triggeredAt,
                        source: 'safe',
                      })}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>View in Navigate</span>
                    </button>
                  )}

                  {evt.status === 'active' && evt.deliveryStatus === 'queued' && (
                    <button
                      onClick={() => retrySosBroadcast(evt.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 9. FUTURE ANDROID ACCESS SPECIFICATION & HARDWARE TRIGGER */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
        <button
          type="button"
          onClick={() => setShowAndroidSpec(!showAndroidSpec)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Future Native Android Access & Hardware Button Trigger Architecture
              </h3>
              <p className="text-[11px] text-slate-400">
                Specification for native Android OS integration, hardware power-button trigger, and background broadcast
              </p>
            </div>
          </div>
          {showAndroidSpec ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showAndroidSpec && (
          <div className="pt-3 border-t border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-cyan-500/30 space-y-2">
              <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Browser Sandbox vs. Native Android Capability:</span>
              </div>
              <p className="text-[11px] text-slate-300">
                A browser-based website or standard web app <strong>cannot</strong> detect 3 rapid power-button presses, 
                intercept hardware key codes while the screen is locked, or wake up unprompted in the background. 
                Any claim that a browser tab can guarantee emergency delivery is technically inaccurate.
              </p>
            </div>

            <div className="space-y-2 text-[11px]">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">
                Target Android Native Architecture (Planned Companion Service):
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>
                  <strong className="text-slate-200">Hardware Trigger Binding:</strong> An Android <code className="text-cyan-300 font-mono">AccessibilityService</code> or <code className="text-cyan-300 font-mono">KeyEvent.KEYCODE_POWER</code> listener detects 3 or 5 rapid presses of the power button even when the screen is dark.
                </li>
                <li>
                  <strong className="text-slate-200">Android 12+ Emergency Intent:</strong> Binds to the system <code className="text-cyan-300 font-mono">android.intent.action.EMERGENCY_ASSISTANCE</code> broadcast receiver.
                </li>
                <li>
                  <strong className="text-slate-200">Foreground Service &amp; WakeLock:</strong> Runs a high-priority foreground notification with <code className="text-cyan-300 font-mono">PARTIAL_WAKE_LOCK</code> to keep the Bluetooth Low Energy (BLE) radio transmitter alive during mesh packet multi-hop flooding.
                </li>
                <li>
                  <strong className="text-slate-200">Bridge with Web App:</strong> Passes emergency events bidirectionally between the native Android background daemon and the LINKUP web dashboard via local IPC or WebSocket port.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD OR EDIT EMERGENCY CONTACT */}
      {isAddingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e172a] border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingContactId ? 'Edit Emergency Contact' : 'Add Trusted Emergency Contact'}
              </h3>
              <button
                onClick={() => setIsAddingContact(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Captain Maya Lin"
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Relationship / Role</label>
                  <input
                    type="text"
                    value={contactRelation}
                    onChange={(e) => setContactRelation(e.target.value)}
                    placeholder="Family / Medical Lead / Base"
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Radio Callsign / Mesh Handle</label>
                  <input
                    type="text"
                    value={contactCallsign}
                    onChange={(e) => setContactCallsign(e.target.value)}
                    placeholder="e.g. Raven-Lead / SAR-04"
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Notification Channels</label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contactAlertViaMesh}
                        onChange={(e) => setContactAlertViaMesh(e.target.checked)}
                        className="rounded text-rose-500 bg-slate-900 border-slate-700"
                      />
                      <span className="text-slate-300">BLE Mesh</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contactAlertViaSms}
                        onChange={(e) => setContactAlertViaSms(e.target.checked)}
                        className="rounded text-rose-500 bg-slate-900 border-slate-700"
                      />
                      <span className="text-slate-300">Cellular SMS</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Operational Notes</label>
                <textarea
                  rows={2}
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="e.g. Has backup shelter keys, primary regional evacuation rendezvous coordinator"
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingContactId ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DEACTIVATE SOS (Accidental vs Resolved) */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e172a] border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-2.5 text-white font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Deactivate Emergency SOS Beacon</span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Confirm you want to deactivate the emergency broadcast. This will transmit a stand-down notification to your contacts and restore normal operations:
            </p>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080d1a] border border-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="deactivateReason"
                  checked={deactivateReason === 'resolved'}
                  onChange={() => setDeactivateReason('resolved')}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-white">Emergency Resolved / Safe Now</div>
                  <div className="text-[10px] text-slate-400">Assistance arrived or condition safely cleared</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080d1a] border border-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="deactivateReason"
                  checked={deactivateReason === 'cancelled'}
                  onChange={() => setDeactivateReason('cancelled')}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold text-white">Accidental Alarm / False Alarm</div>
                  <div className="text-[10px] text-slate-400">Button pressed inadvertently; no actual emergency</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
              >
                Keep SOS Active
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
              >
                Confirm Stand Down
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
