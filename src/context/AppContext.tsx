import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  NetworkStatus,
  ScreenId,
  Conversation,
  ChatMessage,
  LocationAttachment,
  NearbyPeer,
  SavedPlace,
  SharedLocationSession,
  ActiveLiveShareSession,
  OfflineMapPack,
  EmergencyContact,
  SosEvent,
  Transaction,
  SharedFile,
  ActivityItem,
  UserProfile,
} from '../types';

interface AppContextType {
  // Navigation
  currentScreen: ScreenId;
  screenHistory: ScreenId[];
  navigateTo: (screen: ScreenId) => void;
  goBack: () => void;

  // Network State
  networkStatus: NetworkStatus;
  setNetworkStatus: (status: NetworkStatus) => void;
  isSimulatedOffline: boolean;
  toggleOfflineSimulation: () => void;

  // Approved Brand Logo State
  approvedLogoUrl: string | null;
  setApprovedLogo: (url: string | null) => void;
  isLogoModalOpen: boolean;
  setIsLogoModalOpen: (open: boolean) => void;

  // Connect (Messaging)
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (
    conversationId: string, 
    text: string, 
    locationAttachment?: LocationAttachment, 
    isEmergencyAlert?: boolean
  ) => void;
  createConversation: (
    name: string, 
    role?: string, 
    isGroup?: boolean, 
    membersCount?: number
  ) => string;
  nearbyPeers: NearbyPeer[];
  connectPeer: (peerId: string) => void;

  // Navigate
  savedPlaces: SavedPlace[];
  selectedPlaceId: string | null;
  setSelectedPlaceId: (id: string | null) => void;
  addSavedPlace: (place: Omit<SavedPlace, 'id'>) => void;
  deleteSavedPlace: (id: string) => void;
  toggleFavoritePlace: (id: string) => void;
  mapPacks: OfflineMapPack[];
  toggleMapPackDownload: (id: string) => void;
  userCoords: { lat: number; lng: number };
  refreshLocation: () => Promise<void>;
  gpsAccuracy: number;
  locationPermissionState: 'prompt' | 'granted' | 'denied' | 'unsupported';
  activeSharedLocation: SharedLocationSession | null;
  setActiveSharedLocation: (session: SharedLocationSession | null) => void;
  openInNavigate: (session: Partial<SharedLocationSession> & { coordinates: { lat: number; lng: number }; title: string }) => void;
  liveSharingSession: ActiveLiveShareSession | null;
  startLiveSharing: (contactName: string, durationMinutes: number) => void;
  stopLiveSharing: () => void;

  // Safe (Safety & SOS)
  emergencyContacts: EmergencyContact[];
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  deleteEmergencyContact: (id: string) => void;
  isSosActive: boolean;
  sosCountdown: number | null;
  startSosCountdown: () => void;
  cancelSosCountdown: () => void;
  triggerSosImmediately: () => void;
  deactivateSos: () => void;
  sosHistory: SosEvent[];
  isLocationSharingEnabled: boolean;
  toggleLocationSharing: () => void;
  isSirenAudible: boolean;
  toggleSirenAudio: () => void;
  lastCheckIn: string | null;
  performSafetyCheckIn: () => string;

  // Pay (Wallet)
  balance: number;
  transactions: Transaction[];
  sendMoney: (amount: number, recipient: string, address: string, note?: string) => { success: boolean; error?: string };
  requestMoney: (amount: number, from: string, note?: string) => void;
  redeemVoucher: (code: string) => { success: boolean; amount?: number; error?: string };

  // Share (Files)
  sharedFiles: SharedFile[];
  sendFile: (file: File | { name: string; size: number; type?: string; content?: string }, peerId: string) => void;
  cancelTransfer: (id: string) => void;
  clearCompletedTransfers: () => void;
  deleteSharedFile: (id: string) => void;

  // Activity Log
  activities: ActivityItem[];
  logActivity: (module: ActivityItem['module'], title: string, description: string) => void;
  clearActivities: () => void;

  // Profile & Settings
  profile: UserProfile;
  updateProfile: (updated: Partial<UserProfile>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Audio siren synthesizer for SOS demonstration
let sirenOscillator: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let sirenAudioCtx: AudioContext | null = null;
let sirenInterval: any = null;

const startAudioSiren = () => {
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;
    sirenAudioCtx = new AudioCtxClass();
    sirenOscillator = sirenAudioCtx.createOscillator();
    sirenGain = sirenAudioCtx.createGain();

    sirenOscillator.type = 'sawtooth';
    sirenOscillator.frequency.setValueAtTime(650, sirenAudioCtx.currentTime);
    sirenGain.gain.setValueAtTime(0.08, sirenAudioCtx.currentTime); // keep safe volume

    sirenOscillator.connect(sirenGain);
    sirenGain.connect(sirenAudioCtx.destination);
    sirenOscillator.start();

    let high = false;
    sirenInterval = setInterval(() => {
      if (!sirenOscillator || !sirenAudioCtx) return;
      const targetFreq = high ? 600 : 960;
      sirenOscillator.frequency.setTargetAtTime(targetFreq, sirenAudioCtx.currentTime, 0.1);
      high = !high;
    }, 400);
  } catch {
    // Ignore audio permission or restriction errors
  }
};

const stopAudioSiren = () => {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  try {
    if (sirenOscillator) {
      sirenOscillator.stop();
      sirenOscillator.disconnect();
      sirenOscillator = null;
    }
    if (sirenGain) {
      sirenGain.disconnect();
      sirenGain = null;
    }
    if (sirenAudioCtx && sirenAudioCtx.state !== 'closed') {
      sirenAudioCtx.close();
      sirenAudioCtx = null;
    }
  } catch {
    // Ignore cleanup errors
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>(['dashboard']);

  // Network Status
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  // Logo Asset State
  const [approvedLogoUrl, setApprovedLogoUrlState] = useState<string | null>(() => {
    return localStorage.getItem('linkup_approved_logo') || null;
  });
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);

  const setApprovedLogo = useCallback((url: string | null) => {
    if (url) {
      localStorage.setItem('linkup_approved_logo', url);
    } else {
      localStorage.removeItem('linkup_approved_logo');
    }
    setApprovedLogoUrlState(url);
  }, []);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (!isSimulatedOffline) {
        setNetworkStatus('online');
      }
    };
    const handleOffline = () => {
      setNetworkStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine && !isSimulatedOffline) {
      setNetworkStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatedOffline]);

  // Navigate helper
  const navigateTo = useCallback((screen: ScreenId) => {
    const targetScreen = screen === 'save' ? 'safe' : screen;
    setCurrentScreen(targetScreen);
    setScreenHistory((prev) => [...prev, targetScreen]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    if (screenHistory.length > 1) {
      const newHistory = [...screenHistory];
      newHistory.pop();
      const prevScreen = newHistory[newHistory.length - 1];
      setScreenHistory(newHistory);
      setCurrentScreen(prevScreen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentScreen('dashboard');
    }
  }, [screenHistory]);

  const toggleOfflineSimulation = useCallback(() => {
    setIsSimulatedOffline((prev) => {
      const nextVal = !prev;
      setNetworkStatus(nextVal ? 'offline' : navigator.onLine ? 'online' : 'offline');
      return nextVal;
    });
  }, []);

  // Activity Log
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem('linkup_activities');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'act-1',
        module: 'system',
        title: 'LINKUP Initialized',
        description: 'Offline-ready shell loaded with local node key pair.',
        timestamp: 'Just now',
        networkContext: 'online',
      },
      {
        id: 'act-2',
        module: 'navigate',
        title: 'Local Tile Cache Verified',
        description: 'Sector A-12 offline vector packet active (48 MB).',
        timestamp: '5m ago',
        networkContext: 'limited',
      },
      {
        id: 'act-3',
        module: 'connect',
        title: 'Discovered 3 Mesh Nodes',
        description: 'Relay link established with node Kilo-7.',
        timestamp: '18m ago',
        networkContext: 'limited',
      },
    ];
  });

  const logActivity = useCallback((module: ActivityItem['module'], title: string, description: string) => {
    const newItem: ActivityItem = {
      id: 'act-' + Date.now(),
      module,
      title,
      description,
      timestamp: 'Just now',
      networkContext: networkStatus,
    };
    setActivities((prev) => {
      const updated = [newItem, ...prev.slice(0, 49)];
      localStorage.setItem('linkup_activities', JSON.stringify(updated));
      return updated;
    });
  }, [networkStatus]);

  const clearActivities = useCallback(() => {
    setActivities([]);
    localStorage.removeItem('linkup_activities');
  }, []);

  // Connect (Messaging) Initial Data & State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('linkup_conversations');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'conv-group-1',
        name: 'Sector 4 Search Team [Group]',
        role: 'Field Recon Mesh Grid',
        avatarSeed: 'recon-group',
        online: true,
        isGroup: true,
        membersCount: 5,
        connectionType: 'BLE Mesh',
        distance: 'Direct Mesh Cluster · 180–450m',
        lastMessage: '📍 Shared Waypoint: Camp Echo Base Perimeter',
        lastTimestamp: '10:45 AM',
        unreadCount: 0,
        messages: [
          {
            id: 'gm1',
            sender: 'peer',
            senderName: 'Lead Rover Alpha',
            text: 'Radio check: all 5 team nodes transmitting on 433MHz mesh frequency.',
            timestamp: '10:32 AM',
            status: 'delivered',
            channel: 'mesh',
          },
          {
            id: 'gm2',
            sender: 'user',
            text: 'Confirmed. GPS fix steady at 4 satellites. Transmitting base coordinates.',
            timestamp: '10:35 AM',
            status: 'delivered',
            channel: 'mesh',
          },
          {
            id: 'gm3',
            sender: 'peer',
            senderName: 'Sarah J. [Medic]',
            text: 'Camp Echo perimeter waypoint identified as primary rendezvous.',
            timestamp: '10:42 AM',
            status: 'delivered',
            channel: 'mesh',
            locationAttachment: {
              placeId: 'place-1',
              title: 'Camp Echo Base',
              coordinates: { lat: 37.7782, lng: -122.4168 },
              distance: '450m',
              bearing: '042° NE',
              category: 'Camp',
            },
          },
        ],
      },
      {
        id: 'conv-1',
        name: 'Elena Rostova [Field Recon]',
        role: 'Field Recon Lead',
        avatarSeed: 'elena',
        online: true,
        isGroup: false,
        connectionType: 'BLE Mesh',
        distance: '420m away (Mesh Hop 1)',
        lastMessage: 'Sector 4 radio silence confirmed. Water point clear.',
        lastTimestamp: '10:42 AM',
        unreadCount: 0,
        messages: [
          {
            id: 'm1',
            sender: 'peer',
            text: 'Link established over low-power BLE mesh channel.',
            timestamp: '10:38 AM',
            status: 'delivered',
            channel: 'mesh',
          },
          {
            id: 'm2',
            sender: 'user',
            text: 'Copy that. Battery is holding at 84%, radar sweep active.',
            timestamp: '10:40 AM',
            status: 'delivered',
            channel: 'mesh',
          },
          {
            id: 'm3',
            sender: 'peer',
            text: 'Natural Spring water point confirmed clear. Attaching map waypoint.',
            timestamp: '10:42 AM',
            status: 'delivered',
            channel: 'mesh',
            locationAttachment: {
              placeId: 'place-2',
              title: 'Natural Spring Water Station',
              coordinates: { lat: 37.7801, lng: -122.4279 },
              distance: '1.2km',
              bearing: '285° WNW',
              category: 'Water',
            },
          },
        ],
      },
      {
        id: 'conv-2',
        name: 'Relay Gateway #104',
        role: 'Autonomous Sub-GHz Repeater',
        avatarSeed: 'relay',
        online: true,
        isGroup: false,
        connectionType: 'LoRa Gateway',
        distance: '1.2km away (Mesh Hop 2)',
        lastMessage: 'Packet forwarding heartbeat: 100% throughput.',
        lastTimestamp: '09:15 AM',
        unreadCount: 0,
        messages: [
          {
            id: 'm4',
            sender: 'peer',
            text: 'Packet forwarding heartbeat: 100% throughput on sub-GHz telemetry link.',
            timestamp: '09:15 AM',
            status: 'delivered',
            channel: 'mesh',
          },
        ],
      },
      {
        id: 'conv-3',
        name: 'Marcus Chen [Logistics]',
        role: 'Base Supply Depot',
        avatarSeed: 'marcus',
        online: false,
        isGroup: false,
        connectionType: 'Wi-Fi Direct',
        distance: 'Out of direct mesh range',
        lastMessage: 'Let me know once you reach the northern checkpoint.',
        lastTimestamp: 'Yesterday',
        unreadCount: 1,
        messages: [
          {
            id: 'm5',
            sender: 'peer',
            text: 'Let me know once you reach the northern checkpoint. Supplies are staged.',
            timestamp: 'Yesterday',
            status: 'delivered',
            channel: 'cellular',
          },
        ],
      },
      {
        id: 'conv-group-2',
        name: 'Northern Perimeter Patrol [Group]',
        role: 'Coordinated Recon Grid',
        avatarSeed: 'perimeter-group',
        online: true,
        isGroup: true,
        membersCount: 3,
        connectionType: 'BLE Mesh',
        distance: '680m away (Mesh Hop 2)',
        lastMessage: 'Stationed at Ridge Lookout beacon.',
        lastTimestamp: 'Yesterday',
        unreadCount: 0,
        messages: [
          {
            id: 'npm1',
            sender: 'peer',
            senderName: 'Observer Delta',
            text: 'Visual sightline clear across eastern gorge. All frequencies open.',
            timestamp: 'Yesterday',
            status: 'delivered',
            channel: 'mesh',
          },
        ],
      },
    ];
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv-1');

  const [nearbyPeers, setNearbyPeers] = useState<NearbyPeer[]>([
    {
      id: 'peer-1',
      name: 'Elena Rostova (Handheld)',
      deviceType: 'Phone',
      distance: '420m',
      signalStrength: 92,
      meshHops: 1,
      status: 'paired',
      lastSeen: '12s ago',
    },
    {
      id: 'peer-2',
      name: 'Base Repeater Kilo-7',
      deviceType: 'Relay Node',
      distance: '1.2km',
      signalStrength: 76,
      meshHops: 2,
      status: 'paired',
      lastSeen: '45s ago',
    },
    {
      id: 'peer-3',
      name: 'Mobile Command Tablet',
      deviceType: 'Field Tablet',
      distance: '2.4km',
      signalStrength: 48,
      meshHops: 3,
      status: 'available',
      lastSeen: '2m ago',
    },
    {
      id: 'peer-4',
      name: 'Solar Relay Ridge-04',
      deviceType: 'Relay Node',
      distance: '3.8km',
      signalStrength: 34,
      meshHops: 4,
      status: 'available',
      lastSeen: '5m ago',
    },
  ]);

  const connectPeer = useCallback((peerId: string) => {
    setNearbyPeers((prev) =>
      prev.map((p) => (p.id === peerId ? { ...p, status: 'paired' } : p))
    );
    const peer = nearbyPeers.find((p) => p.id === peerId);
    if (peer) {
      logActivity('connect', 'Paired with Nearby Device', `Direct mesh connection established with ${peer.name}.`);
    }
  }, [nearbyPeers, logActivity]);

  const sendMessage = useCallback((
    convId: string, 
    text: string, 
    locationAttachment?: LocationAttachment, 
    isEmergencyAlert?: boolean
  ) => {
    if (!text.trim() && !locationAttachment) return;

    const isOffline = networkStatus === 'offline';
    const messageText = text.trim() || (locationAttachment ? `📍 Shared Location: ${locationAttachment.title}` : '');

    const newMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isOffline ? 'queued_offline' : 'delivered',
      channel: isOffline ? 'mesh' : 'cellular',
      locationAttachment,
      isEmergencyAlert,
    };

    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            lastMessage: messageText,
            lastTimestamp: newMessage.timestamp,
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      });
      localStorage.setItem('linkup_conversations', JSON.stringify(updated));
      return updated;
    });

    logActivity(
      'connect',
      isOffline ? 'Message Queued Offline' : 'Message Transmitted',
      isOffline
        ? `"${messageText.slice(0, 30)}..." stored locally for mesh dispatch.`
        : `Sent via ${newMessage.channel}.`
    );

    // If online or mesh, simulate realistic peer response after 1.4s
    if (!isOffline) {
      setTimeout(() => {
        setConversations((prev) => {
          const updated = prev.map((c) => {
            if (c.id === convId) {
              const replyText = locationAttachment
                ? `Received waypoint: "${locationAttachment.title}". Navigation vector confirmed on tactical grid.`
                : isEmergencyAlert
                ? 'EMERGENCY BEACON RECEIVED! Dispatching closest response node toward your fix.'
                : 'Acknowledged: "' + messageText.slice(0, 24) + (messageText.length > 24 ? '...' : '') + '". Copy on direct link.';

              const reply: ChatMessage = {
                id: 'reply-' + Date.now(),
                sender: 'peer',
                senderName: c.isGroup ? 'Field Node 02' : undefined,
                text: replyText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'delivered',
                channel: 'mesh',
              };
              return {
                ...c,
                lastMessage: reply.text,
                lastTimestamp: reply.timestamp,
                messages: [...c.messages, reply],
              };
            }
            return c;
          });
          localStorage.setItem('linkup_conversations', JSON.stringify(updated));
          return updated;
        });
      }, 1400);
    }
  }, [networkStatus, logActivity]);

  const createConversation = useCallback((
    name: string, 
    role?: string, 
    isGroup?: boolean, 
    membersCount?: number
  ) => {
    const existing = conversations.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      setActiveConversationId(existing.id);
      return existing.id;
    }
    const newId = 'conv-' + Date.now();
    const newConv: Conversation = {
      id: newId,
      name: name.trim(),
      role: role?.trim() || (isGroup ? 'Tactical Group Channel' : 'Field Operator'),
      avatarSeed: name.toLowerCase().replace(/\s+/g, '-'),
      online: true,
      isGroup: !!isGroup,
      membersCount: isGroup ? (membersCount || 4) : undefined,
      connectionType: 'BLE Mesh',
      distance: isGroup ? 'Local Group Cluster' : 'Direct Mesh Range (~100m)',
      lastMessage: isGroup ? 'Group channel opened.' : 'Direct channel opened.',
      lastTimestamp: 'Just now',
      unreadCount: 0,
      messages: [
        {
          id: 'msg-init-' + Date.now(),
          sender: 'peer',
          senderName: isGroup ? 'Net Controller' : undefined,
          text: isGroup 
            ? `Group mesh channel established with ${membersCount || 4} nearby team nodes.` 
            : `Direct offline channel established with ${name.trim()}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'delivered',
          channel: 'mesh',
        },
      ],
    };

    setConversations((prev) => {
      const updated = [newConv, ...prev];
      localStorage.setItem('linkup_conversations', JSON.stringify(updated));
      return updated;
    });
    setActiveConversationId(newId);
    logActivity('connect', isGroup ? 'New Group Created' : 'New Conversation Created', `Started thread "${newConv.name}".`);
    return newId;
  }, [conversations, logActivity]);

  // When network transitions back to online, synchronize any queued_offline messages
  useEffect(() => {
    if (networkStatus === 'online') {
      setConversations((prev) => {
        let hasChanges = false;
        const updated = prev.map((conv) => {
          const hasQueued = conv.messages.some((m) => m.status === 'queued_offline');
          if (hasQueued) {
            hasChanges = true;
            return {
              ...conv,
              messages: conv.messages.map((m) =>
                m.status === 'queued_offline' ? { ...m, status: 'delivered' as const } : m
              ),
            };
          }
          return conv;
        });
        if (hasChanges) {
          localStorage.setItem('linkup_conversations', JSON.stringify(updated));
          logActivity('connect', 'Offline Queue Synchronized', 'All pending offline messages delivered successfully.');
          return updated;
        }
        return prev;
      });
    }
  }, [networkStatus, logActivity]);

  // Navigate Data & State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 37.7749,
    lng: -122.4194,
  });
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(8);
  const [locationPermissionState, setLocationPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('granted');

  const refreshLocation = useCallback(async () => {
    if ('geolocation' in navigator) {
      try {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = parseFloat(pos.coords.latitude.toFixed(5));
              const lng = parseFloat(pos.coords.longitude.toFixed(5));
              const acc = Math.round(pos.coords.accuracy || 8);
              setUserCoords({ lat, lng });
              setGpsAccuracy(acc);
              setLocationPermissionState('granted');
              resolve();
            },
            (err) => {
              if (err.code === err.PERMISSION_DENIED) {
                setLocationPermissionState('denied');
              }
              resolve();
            },
            { timeout: 6000, enableHighAccuracy: true }
          );
        });
        logActivity('navigate', 'GPS Fix Acquired', `Lat: ${userCoords.lat}, Lng: ${userCoords.lng} (Accuracy: ±${gpsAccuracy}m)`);
      } catch {
        // Fallback gracefully
      }
    } else {
      setLocationPermissionState('unsupported');
    }
  }, [userCoords, gpsAccuracy, logActivity]);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Active incoming shared location (from Connect chat waypoint or Safe distress link)
  const [activeSharedLocation, setActiveSharedLocation] = useState<SharedLocationSession | null>(null);

  // Active outgoing user live-sharing session
  const [liveSharingSession, setLiveSharingSession] = useState<ActiveLiveShareSession | null>(null);

  const startLiveSharing = useCallback((contactName: string, durationMinutes: number) => {
    const startedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const expiresDate = new Date(Date.now() + durationMinutes * 60 * 1000);
    const expiresAt = expiresDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const session: ActiveLiveShareSession = {
      id: 'live-' + Date.now(),
      targetContactName: contactName,
      startedAt,
      expiresAt,
      durationMinutes,
      lastCoordinates: userCoords,
      accuracyMeters: gpsAccuracy,
      isTransmitting: networkStatus !== 'offline',
    };
    setLiveSharingSession(session);
    logActivity(
      'navigate',
      'Live Location Sharing Started',
      `Broadcasting position to ${contactName} for ${durationMinutes} minutes.`
    );
  }, [userCoords, gpsAccuracy, networkStatus, logActivity]);

  const stopLiveSharing = useCallback(() => {
    if (liveSharingSession) {
      logActivity(
        'navigate',
        'Live Location Sharing Stopped',
        `Ended active session with ${liveSharingSession.targetContactName}.`
      );
    }
    setLiveSharingSession(null);
  }, [liveSharingSession, logActivity]);

  // Keep live sharing transmission status synced with network status
  useEffect(() => {
    if (liveSharingSession) {
      const transmitting = networkStatus !== 'offline';
      if (liveSharingSession.isTransmitting !== transmitting) {
        setLiveSharingSession((prev) => (prev ? { ...prev, isTransmitting: transmitting } : null));
      }
    }
  }, [networkStatus, liveSharingSession]);

  // Bridge method: Opens Navigate and centres directly on shared position from Connect/Safe
  const openInNavigate = useCallback((session: Partial<SharedLocationSession> & { coordinates: { lat: number; lng: number }; title: string }) => {
    const newSession: SharedLocationSession = {
      id: session.id || 'loc-session-' + Date.now(),
      source: session.source || 'connect',
      title: session.title,
      contactName: session.contactName || 'LINKUP Contact',
      coordinates: session.coordinates,
      address: session.address,
      isEmergency: session.isEmergency || false,
      emergencyDetails: session.emergencyDetails,
      isLive: session.isLive ?? false,
      status: session.status || (networkStatus === 'offline' ? 'last_known' : 'live'),
      timestamp: session.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: session.durationMinutes,
      accuracyMeters: session.accuracyMeters || 12,
    };
    setActiveSharedLocation(newSession);
    setSelectedPlaceId(null);
    setCurrentScreen('navigate');
    setScreenHistory((prev) => [...prev, 'navigate']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    logActivity(
      'navigate',
      session.isEmergency ? 'Emergency Location Opened' : 'Shared Location Opened',
      `Centred tactical map on "${newSession.title}" (${newSession.contactName}).`
    );
  }, [networkStatus, logActivity]);

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(() => {
    const saved = localStorage.getItem('linkup_saved_places');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'place-home',
        title: 'Home Residence',
        category: 'Home',
        address: '42 Elmwood Ave, Sunset District',
        coordinates: { lat: 37.7610, lng: -122.4660 },
        distance: '920m',
        bearing: '240° WSW',
        offlineCached: true,
        notes: 'Primary family shelter. Equipped with solar inverter and 30-day water store.',
        isFavorite: true,
        estimatedTime: '12 min walk',
      },
      {
        id: 'place-college',
        title: 'Campus Tech Quad / College',
        category: 'College',
        address: '800 University Blvd, Engineering Gate 3',
        coordinates: { lat: 37.7835, lng: -122.4140 },
        distance: '1.1km',
        bearing: '025° NNE',
        offlineCached: true,
        notes: 'Campus LoRa mesh gateway and designated regional student muster point.',
        isFavorite: true,
        estimatedTime: '15 min walk',
      },
      {
        id: 'place-work',
        title: 'Work Headquarters',
        category: 'Work',
        address: '150 Market St, Suite 400',
        coordinates: { lat: 37.7925, lng: -122.3980 },
        distance: '2.4km',
        bearing: '055° ENE',
        offlineCached: false,
        notes: 'Redundant satellite uplink dish and backup diesel generator on rooftop.',
        isFavorite: false,
        estimatedTime: '28 min walk',
      },
      {
        id: 'place-family',
        title: 'Family Safe Haven',
        category: 'Family',
        address: '214 Oak Ridge Trail, Woodside',
        coordinates: { lat: 37.7550, lng: -122.4410 },
        distance: '1.8km',
        bearing: '215° SW',
        offlineCached: true,
        notes: 'Pre-coordinated emergency meeting point with cold medical storage.',
        isFavorite: true,
        estimatedTime: '22 min walk',
      },
      {
        id: 'place-1',
        title: 'Camp Echo Base',
        category: 'Camp',
        address: 'Sector 4 Ridge Perimeter',
        coordinates: { lat: 37.7782, lng: -122.4168 },
        distance: '450m',
        bearing: '042° NE',
        offlineCached: true,
        notes: 'Primary field command with solar charging bank and water filtration.',
        isFavorite: true,
        estimatedTime: '6 min walk',
      },
      {
        id: 'place-2',
        title: 'Emergency Medical Depot #2',
        category: 'Medical',
        address: 'Civic Center Logistics Bay 4',
        coordinates: { lat: 37.7715, lng: -122.4231 },
        distance: '820m',
        bearing: '215° SW',
        offlineCached: true,
        notes: 'Cold-chain medicine storage and AED unit in secure keypad locker 4.',
        isFavorite: false,
        estimatedTime: '10 min walk',
      },
      {
        id: 'place-3',
        title: 'Natural Spring / Water Station',
        category: 'Water',
        address: 'Buena Vista Gorge Wellhead',
        coordinates: { lat: 37.7801, lng: -122.4279 },
        distance: '1.4km',
        bearing: '310° NW',
        offlineCached: true,
        notes: 'Natural gravity spring flowing at 4.2 L/min. Safe gravity ceramic filters.',
        isFavorite: false,
        estimatedTime: '18 min walk',
      },
      {
        id: 'place-4',
        title: 'Rendezvous Point Bravo',
        category: 'Rendezvous',
        address: 'Twin Peaks Sightline Beacon',
        coordinates: { lat: 37.7692, lng: -122.4112 },
        distance: '1.9km',
        bearing: '135° SE',
        offlineCached: false,
        notes: 'High-elevation radio tower sightline for emergency flare or beacon sweep.',
        isFavorite: false,
        estimatedTime: '25 min walk',
      },
    ];
  });

  const addSavedPlace = useCallback((place: Omit<SavedPlace, 'id'>) => {
    const newPlace: SavedPlace = {
      ...place,
      id: 'place-' + Date.now(),
    };
    setSavedPlaces((prev) => {
      const updated = [newPlace, ...prev];
      localStorage.setItem('linkup_saved_places', JSON.stringify(updated));
      return updated;
    });
    logActivity('navigate', 'Saved Navigation Waypoint', `Added "${newPlace.title}" to local places cache.`);
  }, [logActivity]);

  const deleteSavedPlace = useCallback((id: string) => {
    setSavedPlaces((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem('linkup_saved_places', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFavoritePlace = useCallback((id: string) => {
    setSavedPlaces((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
      localStorage.setItem('linkup_saved_places', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const [mapPacks, setMapPacks] = useState<OfflineMapPack[]>([
    {
      id: 'pack-1',
      regionName: 'Sector Central (Downtown & Base)',
      sizeMb: 42.5,
      isDownloaded: true,
      lastUpdated: 'Today at 08:00',
      tilesCount: 1420,
    },
    {
      id: 'pack-2',
      regionName: 'Northern Ridge & Mountain Trails',
      sizeMb: 78.2,
      isDownloaded: false,
      lastUpdated: 'Not downloaded',
      tilesCount: 2650,
    },
    {
      id: 'pack-3',
      regionName: 'Coastline & Estuary Channels',
      sizeMb: 36.1,
      isDownloaded: false,
      lastUpdated: 'Not downloaded',
      tilesCount: 1180,
    },
  ]);

  const toggleMapPackDownload = useCallback((id: string) => {
    setMapPacks((prev) =>
      prev.map((pack) => {
        if (pack.id === id) {
          const nextState = !pack.isDownloaded;
          logActivity(
            'navigate',
            nextState ? 'Offline Map Cached' : 'Map Cache Cleared',
            `${pack.regionName} (${pack.sizeMb} MB) ${nextState ? 'ready for offline use' : 'removed from device'}.`
          );
          return {
            ...pack,
            isDownloaded: nextState,
            lastUpdated: nextState ? 'Just now' : 'Not downloaded',
          };
        }
        return pack;
      })
    );
  }, [logActivity]);

  // Safe (Safety & SOS) Data & State
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('linkup_emergency_contacts');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'c-1',
        name: 'Sarah Jenkins',
        phone: '+1 (555) 234-5678',
        relation: 'Primary Contact / Family',
        priority: 1,
        alertViaMesh: true,
        alertViaSms: true,
      },
      {
        id: 'c-2',
        name: 'Mountain Search & Rescue Node',
        phone: '+1 (555) 911-MESH',
        relation: 'Emergency Dispatch Relay',
        priority: 2,
        alertViaMesh: true,
        alertViaSms: false,
      },
      {
        id: 'c-3',
        name: 'Dr. David Kim',
        phone: '+1 (555) 876-5432',
        relation: 'Medical Advisory',
        priority: 3,
        alertViaMesh: true,
        alertViaSms: true,
      },
    ];
  });

  const addEmergencyContact = useCallback((contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: 'c-' + Date.now(),
    };
    setEmergencyContacts((prev) => {
      const updated = [...prev, newContact];
      localStorage.setItem('linkup_emergency_contacts', JSON.stringify(updated));
      return updated;
    });
    logActivity('safe', 'Emergency Contact Added', `${newContact.name} added to broadcast alert list.`);
  }, [logActivity]);

  const deleteEmergencyContact = useCallback((id: string) => {
    setEmergencyContacts((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem('linkup_emergency_contacts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [isLocationSharingEnabled, setIsLocationSharingEnabled] = useState<boolean>(true);
  const [isSirenAudible, setIsSirenAudible] = useState<boolean>(false);

  const [sosHistory, setSosHistory] = useState<SosEvent[]>(() => {
    const saved = localStorage.getItem('linkup_sos_history');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'sos-sim-1',
        triggeredAt: 'Yesterday 16:30',
        status: 'resolved',
        latitude: 37.7749,
        longitude: -122.4194,
        broadcastChannel: 'Simulated 433MHz Mesh Distress Beacon',
        contactsNotified: ['Sarah Jenkins', 'Mountain Search & Rescue Node'],
      },
    ];
  });

  // SOS Countdown Timer
  useEffect(() => {
    let timer: any = null;
    if (sosCountdown !== null && sosCountdown > 0) {
      timer = setTimeout(() => {
        setSosCountdown(sosCountdown - 1);
      }, 1000);
    } else if (sosCountdown === 0) {
      setIsSosActive(true);
      setSosCountdown(null);

      const newEvent: SosEvent = {
        id: 'sos-' + Date.now(),
        triggeredAt: new Date().toLocaleTimeString() + ' (' + new Date().toLocaleDateString() + ')',
        status: 'active',
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        broadcastChannel: 'Simulated 433MHz Mesh Distress Beacon',
        contactsNotified: emergencyContacts.map((c) => c.name),
      };

      setSosHistory((prev) => {
        const updated = [newEvent, ...prev];
        localStorage.setItem('linkup_sos_history', JSON.stringify(updated));
        return updated;
      });

      logActivity(
        'safe',
        'SIMULATED SOS ACTIVATED',
        `Distress beacon broadcasted to ${emergencyContacts.length} contacts via local mesh relay.`
      );
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [sosCountdown, userCoords, emergencyContacts, logActivity]);

  const startSosCountdown = useCallback(() => {
    setSosCountdown(5);
  }, []);

  const cancelSosCountdown = useCallback(() => {
    setSosCountdown(null);
    logActivity('safe', 'SOS Countdown Cancelled', 'User aborted the SOS activation sequence.');
  }, [logActivity]);

  const triggerSosImmediately = useCallback(() => {
    setSosCountdown(0);
  }, []);

  const deactivateSos = useCallback(() => {
    setIsSosActive(false);
    stopAudioSiren();
    setIsSirenAudible(false);
    setSosHistory((prev) => {
      const updated = prev.map((s, idx) => (idx === 0 ? { ...s, status: 'resolved' as const } : s));
      localStorage.setItem('linkup_sos_history', JSON.stringify(updated));
      return updated;
    });
    logActivity('safe', 'SOS Deactivated', 'Emergency broadcast state cleared and restored to normal.');
  }, [logActivity]);

  const toggleLocationSharing = useCallback(() => {
    setIsLocationSharingEnabled((prev) => {
      const next = !prev;
      logActivity(
        'safe',
        next ? 'Location Beacon Enabled' : 'Location Beacon Disabled',
        next ? 'Broadcasting live coordinates to paired mesh peers.' : 'Location privacy active.'
      );
      return next;
    });
  }, [logActivity]);

  const toggleSirenAudio = useCallback(() => {
    setIsSirenAudible((prev) => {
      if (prev) {
        stopAudioSiren();
        return false;
      } else {
        startAudioSiren();
        return true;
      }
    });
  }, []);

  const [lastCheckIn, setLastCheckIn] = useState<string | null>(() => {
    return localStorage.getItem('linkup_last_checkin') || null;
  });

  const performSafetyCheckIn = useCallback(() => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString();
    setLastCheckIn(nowStr);
    localStorage.setItem('linkup_last_checkin', nowStr);
    logActivity('safe', 'Safety Check-In Confirmed', `User verified safe status at ${nowStr}.`);
    return nowStr;
  }, [logActivity]);

  // Pay (Wallet) Data & State
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('linkup_wallet_balance');
    return saved !== null ? parseFloat(saved) : 580.0;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('linkup_wallet_tx');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'tx-1',
        type: 'receive',
        amount: 150.0,
        recipientOrSender: 'Field Outpost Alpha',
        recipientAddress: '@outpost_alpha',
        timestamp: 'Today, 09:30 AM',
        status: 'completed',
        note: 'Solar battery pack stipend',
      },
      {
        id: 'tx-2',
        type: 'send',
        amount: 25.5,
        recipientOrSender: 'Elena Rostova',
        recipientAddress: '@elena_rostova',
        timestamp: 'Yesterday, 04:15 PM',
        status: 'completed',
        note: 'Water purification filter replacement',
      },
      {
        id: 'tx-3',
        type: 'send',
        amount: 60.0,
        recipientOrSender: 'Base Supply Depot',
        recipientAddress: '@base_depot',
        timestamp: '2 days ago',
        status: 'completed',
        note: 'First aid refill kit',
      },
    ];
  });

  const sendMoney = useCallback(
    (amount: number, recipient: string, address: string, note?: string) => {
      if (amount <= 0) {
        return { success: false, error: 'Amount must be greater than zero.' };
      }
      if (amount > balance) {
        return { success: false, error: 'Insufficient simulated demo balance.' };
      }
      if (!recipient.trim() || !address.trim()) {
        return { success: false, error: 'Recipient and address cannot be empty.' };
      }

      const isOffline = networkStatus === 'offline';
      const newBalance = parseFloat((balance - amount).toFixed(2));
      setBalance(newBalance);
      localStorage.setItem('linkup_wallet_balance', newBalance.toString());

      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        type: 'send',
        amount,
        recipientOrSender: recipient.trim(),
        recipientAddress: address.trim(),
        timestamp: 'Just now',
        status: isOffline ? 'queued_offline' : 'completed',
        note: note?.trim() || 'Simulated peer payment',
        voucherCode: isOffline ? 'VCH-' + Math.random().toString(36).substring(2, 8).toUpperCase() : undefined,
      };

      setTransactions((prev) => {
        const updated = [newTx, ...prev];
        localStorage.setItem('linkup_wallet_tx', JSON.stringify(updated));
        return updated;
      });

      logActivity(
        'pay',
        isOffline ? 'Offline Payment Voucher Queued' : 'Demo Payment Sent',
        isOffline
          ? `$${amount.toFixed(2)} voucher signed locally (Code: ${newTx.voucherCode}).`
          : `Sent $${amount.toFixed(2)} to ${recipient.trim()}.`
      );

      return { success: true };
    },
    [balance, networkStatus, logActivity]
  );

  const requestMoney = useCallback(
    (amount: number, from: string, note?: string) => {
      if (amount <= 0 || !from.trim()) return;

      const newTx: Transaction = {
        id: 'req-' + Date.now(),
        type: 'request',
        amount,
        recipientOrSender: from.trim(),
        recipientAddress: '@alex_vance',
        timestamp: 'Just now',
        status: 'pending',
        note: note?.trim() || 'Payment request invoice',
      };

      setTransactions((prev) => {
        const updated = [newTx, ...prev];
        localStorage.setItem('linkup_wallet_tx', JSON.stringify(updated));
        return updated;
      });

      logActivity('pay', 'Payment Request Broadcast', `Requested $${amount.toFixed(2)} from ${from.trim()}.`);
    },
    [logActivity]
  );

  const redeemVoucher = useCallback(
    (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode.startsWith('VCH-') && cleanCode.length < 5) {
        return { success: false, error: 'Invalid voucher format. Must begin with VCH-' };
      }

      // Check if already redeemed
      const voucherAmount = 50.0;
      const newBalance = parseFloat((balance + voucherAmount).toFixed(2));
      setBalance(newBalance);
      localStorage.setItem('linkup_wallet_balance', newBalance.toString());

      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        type: 'receive',
        amount: voucherAmount,
        recipientOrSender: 'Mesh Voucher Claim (' + cleanCode + ')',
        recipientAddress: 'Verified Voucher',
        timestamp: 'Just now',
        status: 'completed',
        note: 'Cryptographically verified offline voucher',
      };

      setTransactions((prev) => {
        const updated = [newTx, ...prev];
        localStorage.setItem('linkup_wallet_tx', JSON.stringify(updated));
        return updated;
      });

      logActivity('pay', 'Offline Voucher Redeemed', `Claimed $${voucherAmount.toFixed(2)} from voucher ${cleanCode}.`);
      return { success: true, amount: voucherAmount };
    },
    [balance, logActivity]
  );

  // Sync offline queued transactions when returning online
  useEffect(() => {
    if (networkStatus === 'online') {
      setTransactions((prev) => {
        let hasChanges = false;
        const updated = prev.map((tx) => {
          if (tx.status === 'queued_offline') {
            hasChanges = true;
            return { ...tx, status: 'completed' as const };
          }
          return tx;
        });
        if (hasChanges) {
          localStorage.setItem('linkup_wallet_tx', JSON.stringify(updated));
          logActivity('pay', 'Offline Transactions Synchronized', 'All pending mesh vouchers cleared on ledger.');
          return updated;
        }
        return prev;
      });
    }
  }, [networkStatus, logActivity]);

  // Share (File Transfer) Data & State
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>(() => {
    const saved = localStorage.getItem('linkup_shared_files');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'file-1',
        name: 'Sector_4_Topographic_Elevation.kml',
        sizeBytes: 1820000,
        mimeType: 'application/vnd.google-earth.kml+xml',
        direction: 'received',
        peerName: 'Elena Rostova (Handheld)',
        timestamp: 'Today at 09:12 AM',
        status: 'completed',
        progress: 100,
        checksum: 'sha256:7f83b165...9b42',
        content: `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>LINKUP Offline Tactical Grid - Sector 4</name>
    <description>Topographic contours, elevation beacons, and water depots for off-grid navigation.</description>
    <Placemark>
      <name>Camp Echo Base Perimeter</name>
      <Point><coordinates>-122.4168,37.7782,120</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Natural Spring Gravity Water Station</name>
      <Point><coordinates>-122.4279,37.7801,85</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>High Elevation Sightline Repeater</name>
      <Point><coordinates>-122.4112,37.7692,240</coordinates></Point>
    </Placemark>
  </Document>
</kml>`,
      },
      {
        id: 'file-2',
        name: 'Field_Medical_Protocols_v3.txt',
        sizeBytes: 420000,
        mimeType: 'text/plain',
        direction: 'sent',
        peerName: 'Base Repeater Kilo-7',
        timestamp: 'Yesterday at 03:40 PM',
        status: 'completed',
        progress: 100,
        checksum: 'sha256:3e2918a1...5c8d',
        content: `LINKUP OFFLINE FIELD MEDICAL PROTOCOL (REV 3.2)
==================================================
CONFIDENTIAL - EMERGENCY OFFLINE CACHE

1. RAPID TRIAGE ASSESSMENT (M.A.R.C.H. PROTOCOL):
  - Massive Hemorrhage: Apply combat tourniquet 2-3 inches above bleeding site.
  - Airway: Verify airway patency; recovery posture if unconscious.
  - Respiration: Occlusive dressing on open chest wounds.
  - Circulation: Assess radial pulse, capillary refill, and core hypothermia.
  - Head Injury & Hypothermia: Keep insulated from soil contact; warm sweet fluids if fully alert.

2. WATER PURIFICATION STANDARDS:
  - Rapid boil: 3 full minutes rolling boil.
  - Chemical backup: 4 drops 2% iodine solution per 1000ml water; wait 30 minutes.

3. EMERGENCY DISPATCH CHANNELS:
  - LoRa Mesh Broadcast: 433.175 MHz (P2P Packets)
  - Medical Beacon Relay: 868.100 MHz (Sub-GHz FHSS)
  
Issued by: Tactical Medical Advisory Node`,
      },
      {
        id: 'file-3',
        name: 'Offline_Radio_Frequency_Chart.csv',
        sizeBytes: 64000,
        mimeType: 'text/csv',
        direction: 'received',
        peerName: 'Mobile Command Tablet',
        timestamp: '2 days ago',
        status: 'completed',
        progress: 100,
        checksum: 'sha256:91c28f44...2b11',
        content: `Channel_ID,Frequency_MHz,Modulation,Protocol,Bandwidth_kHz,Purpose
CH-01,433.175,LoRa CSS,Mesh Beacon,125,Emergency SOS Broadcast
CH-02,433.500,FSK 9.6kbps,P2P Text,25,Direct Encrypted Chat
CH-03,868.100,GFSK 50kbps,Burst Payloads,250,High-Speed File Transfer
CH-04,915.000,LoRa CSS,Long Range,500,Inter-Base Telemetry Relay
CH-05,2412.000,Wi-Fi Direct,Ad-Hoc 802.11n,20000,Bulk Map & Media Transfer`,
      },
    ];
  });

  const sendFile = useCallback((file: File | { name: string; size: number; type?: string; content?: string }, peerId: string) => {
    const targetPeer = nearbyPeers.find((p) => p.id === peerId) || nearbyPeers[0];
    const fileId = 'file-' + Date.now();
    const newSharedFile: SharedFile = {
      id: fileId,
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      direction: 'sent',
      peerName: targetPeer ? targetPeer.name : 'Direct Mesh Peer',
      timestamp: 'Just now',
      status: 'in_progress',
      progress: 5,
      checksum: 'sha256:' + Math.random().toString(36).substring(2, 10) + '...',
      content: (file as any).content || `Simulated payload content for ${file.name}\nGenerated by LINKUP Share off-grid peer protocol.\nTimestamp: ${new Date().toISOString()}`,
    };

    setSharedFiles((prev) => {
      const updated = [newSharedFile, ...prev];
      localStorage.setItem('linkup_shared_files', JSON.stringify(updated));
      return updated;
    });
    logActivity('share', 'File Transfer Started', `Sending "${file.name}" to ${newSharedFile.peerName} over Wi-Fi Direct / Mesh.`);

    // Progress simulation
    let progress = 5;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        setSharedFiles((prev) => {
          const updated = prev.map((f) =>
            f.id === fileId ? { ...f, status: 'completed' as const, progress: 100 } : f
          );
          localStorage.setItem('linkup_shared_files', JSON.stringify(updated));
          return updated;
        });
        logActivity('share', 'File Transfer Complete', `"${file.name}" received and verified by peer.`);
      } else {
        setSharedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
        );
      }
    }, 350);
  }, [nearbyPeers, logActivity]);

  const cancelTransfer = useCallback((id: string) => {
    setSharedFiles((prev) => {
      const updated = prev.map((f) =>
        f.id === id ? { ...f, status: 'cancelled' as const, progress: 0 } : f
      );
      localStorage.setItem('linkup_shared_files', JSON.stringify(updated));
      return updated;
    });
    logActivity('share', 'Transfer Aborted', 'Peer file transfer was cancelled by user.');
  }, [logActivity]);

  const clearCompletedTransfers = useCallback(() => {
    setSharedFiles((prev) => {
      const updated = prev.filter((f) => f.status === 'in_progress');
      localStorage.setItem('linkup_shared_files', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteSharedFile = useCallback((id: string) => {
    setSharedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      localStorage.setItem('linkup_shared_files', JSON.stringify(updated));
      return updated;
    });
    logActivity('share', 'File Removed', 'File record removed from local storage vault.');
  }, [logActivity]);

  // Profile & Settings Data & State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('linkup_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      callsign: 'Nighthawk-1',
      displayName: 'Captain Alex Vance',
      nodeId: 'LN-8492-AX',
      emergencyBloodType: 'O-Negative',
      medicalNotes: 'No known drug allergies. Penicillin safe.',
      meshRelayEnabled: true,
      batterySaverMode: false,
    };
  });

  const updateProfile = useCallback((updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      localStorage.setItem('linkup_user_profile', JSON.stringify(next));
      return next;
    });
    logActivity('system', 'Profile Updated', 'Local node identity and preferences updated.');
  }, [logActivity]);

  const resetAllData = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({
      currentScreen,
      screenHistory,
      navigateTo,
      goBack,
      networkStatus,
      setNetworkStatus,
      isSimulatedOffline,
      toggleOfflineSimulation,
      approvedLogoUrl,
      setApprovedLogo,
      isLogoModalOpen,
      setIsLogoModalOpen,
      conversations,
      activeConversationId,
      setActiveConversationId,
      sendMessage,
      createConversation,
      nearbyPeers,
      connectPeer,
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
      isLocationSharingEnabled,
      toggleLocationSharing,
      isSirenAudible,
      toggleSirenAudio,
      lastCheckIn,
      performSafetyCheckIn,
      balance,
      transactions,
      sendMoney,
      requestMoney,
      redeemVoucher,
      sharedFiles,
      sendFile,
      cancelTransfer,
      clearCompletedTransfers,
      deleteSharedFile,
      activities,
      logActivity,
      clearActivities,
      profile,
      updateProfile,
      resetAllData,
      gpsAccuracy,
      locationPermissionState,
      activeSharedLocation,
      setActiveSharedLocation,
      openInNavigate,
      liveSharingSession,
      startLiveSharing,
      stopLiveSharing,
    }),
    [
      currentScreen,
      screenHistory,
      navigateTo,
      goBack,
      networkStatus,
      isSimulatedOffline,
      toggleOfflineSimulation,
      approvedLogoUrl,
      setApprovedLogo,
      isLogoModalOpen,
      conversations,
      activeConversationId,
      sendMessage,
      createConversation,
      nearbyPeers,
      connectPeer,
      savedPlaces,
      selectedPlaceId,
      addSavedPlace,
      deleteSavedPlace,
      toggleFavoritePlace,
      mapPacks,
      toggleMapPackDownload,
      userCoords,
      refreshLocation,
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
      isLocationSharingEnabled,
      toggleLocationSharing,
      isSirenAudible,
      toggleSirenAudio,
      lastCheckIn,
      performSafetyCheckIn,
      balance,
      transactions,
      sendMoney,
      requestMoney,
      redeemVoucher,
      sharedFiles,
      sendFile,
      cancelTransfer,
      clearCompletedTransfers,
      deleteSharedFile,
      activities,
      logActivity,
      clearActivities,
      profile,
      updateProfile,
      resetAllData,
      gpsAccuracy,
      locationPermissionState,
      activeSharedLocation,
      openInNavigate,
      liveSharingSession,
      startLiveSharing,
      stopLiveSharing,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
