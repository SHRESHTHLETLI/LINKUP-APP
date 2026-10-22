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
  Info, 
  Clock, 
  ShieldCheck, 
  XCircle,
  Heart,
  FileText,
  UserCheck,
  Compass,
  MapPin
} from 'lucide-react';
import { EmergencyContact } from '../../types';

export const SafeScreen: React.FC = () => {
  const { 
    emergencyContacts, 
    addEmergencyContact, 
    deleteEmergencyContact, 
    isSosActive, 
    sosCountdown, 
    startSosCountdown, 
    cancelSosCountdown, 
    triggerSosImmediately, 
    deactivateSos,
    sosHistory,
    isSirenAudible,
    toggleSirenAudio,
    lastCheckIn,
    performSafetyCheckIn,
    profile,
    updateProfile,
    networkStatus,
    userCoords,
    openInNavigate,
    goBack 
  } = useApp();

  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [checkInFeedback, setCheckInFeedback] = useState<string | null>(null);

  // Edit medical notes state
  const [bloodType, setBloodType] = useState(profile.emergencyBloodType);
  const [medicalNotes, setMedicalNotes] = useState(profile.medicalNotes);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    addEmergencyContact({
      name: contactName.trim(),
      phone: contactPhone.trim(),
      relation: contactRelation.trim() || 'Trusted Contact',
      priority: emergencyContacts.length + 1,
      alertViaMesh: true,
      alertViaSms: true,
    });

    setContactName('');
    setContactPhone('');
    setContactRelation('');
    setIsAddingContact(false);
  };

  const handleCheckIn = () => {
    const timestamp = performSafetyCheckIn();
    setCheckInFeedback(`Safety Check-in logged at ${timestamp}`);
    setTimeout(() => setCheckInFeedback(null), 3500);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      emergencyBloodType: bloodType,
      medicalNotes,
    });
    setIsEditingInfo(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-16 sm:pb-8">
      {/* 1. Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">LINKUP Safe</h1>
            <p className="text-xs text-slate-400">Personal safety tools, emergency assistance, and trusted contacts</p>
          </div>
        </div>

        {isSosActive && (
          <button
            onClick={deactivateSos}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-900/40 animate-pulse transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Active SOS</span>
          </button>
        )}
      </div>

      {/* 2. Short Module Explanation & Demonstration Notice */}
      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-rose-300 font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>About LINKUP Safe</span>
          <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full ml-auto">
            SIMULATED DEMO ONLY — DOES NOT CALL 911
          </span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
          LINKUP Safe coordinates emergency assistance and periodic check-ins without cellular reception. This is an interactive product demonstration: pressing the emergency button or initiating a demo incident will <strong>not</strong> contact real emergency services, send actual cellular SMS messages, or alert external authorities.
        </p>
      </div>

      {/* Emergency Assistance Demo Hero Card */}
      <div className="bg-[#0e172a] border border-rose-500/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="max-w-md w-full space-y-6">
          
          {/* State 1: Active 5-second Countdown */}
          {sosCountdown !== null ? (
            <div className="space-y-5 animate-scale-up">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-rose-600 border-4 border-rose-400 flex items-center justify-center mx-auto text-3xl sm:text-4xl font-extrabold text-white animate-pulse">
                {sosCountdown}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Initiating Demo Incident in {sosCountdown}s</h2>
                <p className="text-xs text-rose-300 mt-1">
                  Simulating distress dispatch to {emergencyContacts.length} trusted contacts.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={cancelSosCountdown}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Cancel / False Alarm
                </button>
                <button
                  onClick={triggerSosImmediately}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                >
                  Confirm Immediately
                </button>
              </div>
            </div>
          ) : isSosActive ? (
            /* State 2: Confirmed Demo Incident Active */
            <div className="space-y-4 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 animate-pulse">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                  Demo Incident Broadcast Active
                </span>
                <h2 className="text-xl font-bold text-white mt-2">SIMULATED DISTRESS BEACON TRANSMITTING</h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Broadcasting demonstration distress packet to your {emergencyContacts.length} trusted contacts on simulated local mesh relay.
                </p>
              </div>

              {/* Information That Would Be Shared Panel */}
              <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 text-left text-xs space-y-2 text-slate-300">
                <div className="font-semibold text-rose-300 text-[11px] uppercase tracking-wider">
                  Data Shared in this Demo Incident:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-500">Callsign:</span> {profile.callsign}</div>
                  <div><span className="text-slate-500">Blood Type:</span> {profile.emergencyBloodType}</div>
                  <div><span className="text-slate-500">Status:</span> {networkStatus === 'online' ? 'Delivered (Cloud & Sat)' : 'Saved Locally · Pending Sync'}</div>
                  <div><span className="text-slate-500">Time:</span> {new Date().toLocaleTimeString()}</div>
                </div>
                <div className="text-[11px] pt-1 border-t border-slate-800 text-slate-400">
                  <span className="text-slate-500">Medical Notes:</span> {profile.medicalNotes || 'None specified'}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={toggleSirenAudio}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-colors ${
                    isSirenAudible
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {isSirenAudible ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isSirenAudible ? 'Mute Siren' : 'Test Acoustic Siren'}</span>
                </button>
                <button
                  onClick={() => openInNavigate({
                    title: 'Distress Beacon Incident Fix',
                    coordinates: { lat: userCoords.lat, lng: userCoords.lng },
                    address: 'Sector 4 Distress Origin Fix',
                    contactName: `${profile.callsign} [Distress Node]`,
                    isEmergency: true,
                    emergencyDetails: {
                      bloodType: profile.emergencyBloodType,
                      callsign: profile.callsign,
                      notes: profile.medicalNotes,
                    },
                    isLive: false,
                    status: networkStatus === 'offline' ? 'last_known' : 'live',
                    timestamp: new Date().toLocaleTimeString(),
                    source: 'safe',
                  })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow transition-colors"
                >
                  <Compass className="w-4 h-4" />
                  <span>View Incident in LINKUP Navigate</span>
                </button>
                <button
                  onClick={deactivateSos}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700"
                >
                  Deactivate Demo & Mark Safe
                </button>
              </div>
            </div>
          ) : (
            /* State 3: Standby SOS Button */
            <div className="space-y-4">
              <button
                onClick={startSosCountdown}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-rose-600/90 hover:bg-rose-500 border-4 border-rose-500/50 hover:border-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.35)] flex flex-col items-center justify-center mx-auto transition-all active:scale-95 group cursor-pointer"
              >
                <ShieldAlert className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
                <span className="text-xs font-extrabold tracking-wider text-white mt-1">EMERGENCY SOS</span>
              </button>
              <div>
                <h2 className="text-base font-bold text-white">Initiate Demo Emergency Incident</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Triggers an interactive 5-second confirmation countdown before simulating an emergency alert.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Two Columns: Quick Check-in & Emergency Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Safety Check-in Workflow */}
        <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Periodic Safety Check-In</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">Standby</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mt-3">
              Confirm your safety with a single tap. Records a verified timestamp in your local device log to demonstrate welfare check-ins during off-grid operations.
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Last Recorded Check-In:</span>
                <span className="font-mono text-emerald-400 font-medium">
                  {lastCheckIn || 'No check-in recorded yet'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Status Broadcast:</span>
                <span className="text-slate-200">Safe / Operational</span>
              </div>
            </div>

            {checkInFeedback && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{checkInFeedback}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckIn}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>I'm OK — Confirm Safety Check-In</span>
          </button>
        </div>

        {/* Emergency Information Panel */}
        <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-white">Emergency Information Panel</h3>
              </div>
              <button
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {isEditingInfo ? 'Cancel' : 'Edit Info'}
              </button>
            </div>

            {isEditingInfo ? (
              <form onSubmit={handleSaveInfo} className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Blood Type</label>
                  <input
                    type="text"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Medical & Allergy Notes</label>
                  <textarea
                    rows={2}
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg"
                >
                  Save Information
                </button>
              </form>
            ) : (
              <div className="space-y-3 pt-2 text-xs">
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Medical information stored securely in local device storage, prepared for display during emergency incidents.
                </p>

                <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Callsign:</span>
                    <span className="text-white font-medium">{profile.callsign}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emergency Blood Type:</span>
                    <span className="font-mono text-cyan-400 font-semibold">{profile.emergencyBloodType || 'O-Negative'}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Medical & Allergy Notes:</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {profile.medicalNotes || 'No allergies recorded. Penicillin safe.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-1">
            Data remains entirely on device and is never uploaded to remote servers.
          </div>
        </div>

      </div>

      {/* Trusted Contacts Management */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">Trusted Emergency Contacts ({emergencyContacts.length})</h2>
            <p className="text-xs text-slate-400">Fictional sample contacts configured for distress broadcasts</p>
          </div>
          <button
            onClick={() => setIsAddingContact(!isAddingContact)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>

        {/* Add Contact Form */}
        {isAddingContact && (
          <form onSubmit={handleAddContact} className="p-4 rounded-xl bg-[#080d1a] border border-rose-500/30 space-y-4">
            <h3 className="text-xs font-semibold uppercase text-rose-300">New Trusted Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full bg-[#0e172a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-[#0e172a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Relationship</label>
                <input
                  type="text"
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  placeholder="Family / Medical Lead"
                  className="w-full bg-[#0e172a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingContact(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg"
              >
                Save Contact
              </button>
            </div>
          </form>
        )}

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {emergencyContacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="font-semibold text-xs text-white">{contact.name}</div>
                  <button
                    onClick={() => deleteEmergencyContact(contact.id)}
                    className="text-slate-500 hover:text-rose-400 p-0.5"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{contact.relation}</div>
                <div className="text-xs font-mono text-slate-300 mt-2 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-cyan-400" />
                  <span>{contact.phone}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Priority #{contact.priority}</span>
                <span className="text-cyan-400 font-medium">Demo Relay Contact</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
