export type NetworkStatus = 'online' | 'limited' | 'offline';

export type ScreenId = 
  | 'dashboard' 
  | 'connect' 
  | 'navigate' 
  | 'safe' 
  | 'save' 
  | 'pay' 
  | 'share' 
  | 'settings';

export interface LocationAttachment {
  placeId?: string;
  title: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance?: string;
  bearing?: string;
  category?: string;
  isEmergencySos?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'peer';
  senderName?: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'queued_offline' | 'failed';
  channel: 'mesh' | 'cellular' | 'satellite_relay';
  locationAttachment?: LocationAttachment;
  isEmergencyAlert?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  role: string;
  avatarSeed: string;
  online: boolean;
  distance?: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
  isGroup?: boolean;
  membersCount?: number;
  connectionType?: 'BLE Mesh' | 'Wi-Fi Direct' | 'LoRa Gateway' | 'Cellular';
}

export interface NearbyPeer {
  id: string;
  name: string;
  deviceType: 'Phone' | 'Relay Node' | 'Base Station' | 'Field Tablet';
  distance: string;
  signalStrength: number; // 0 to 100
  meshHops: number;
  status: 'paired' | 'available' | 'syncing';
  lastSeen: string;
}

export interface SavedPlace {
  id: string;
  title: string;
  category: 'Home' | 'College' | 'Work' | 'Family' | 'Shelter' | 'Water' | 'Medical' | 'Rendezvous' | 'Camp' | 'Custom';
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  distance: string;
  bearing: string;
  offlineCached: boolean;
  notes: string;
  isFavorite?: boolean;
  estimatedTime?: string;
}

export interface SharedLocationSession {
  id: string;
  source: 'connect' | 'safe' | 'link';
  title: string;
  contactName?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  isEmergency?: boolean;
  emergencyDetails?: {
    bloodType?: string;
    callsign?: string;
    notes?: string;
  };
  isLive: boolean;
  status: 'live' | 'last_known' | 'unavailable';
  timestamp: string;
  durationMinutes?: number;
  accuracyMeters?: number;
}

export interface ActiveLiveShareSession {
  id: string;
  targetContactName: string;
  startedAt: string;
  expiresAt: string;
  durationMinutes: number;
  lastCoordinates: { lat: number; lng: number };
  accuracyMeters: number;
  isTransmitting: boolean;
}

export interface OfflineMapPack {
  id: string;
  regionName: string;
  sizeMb: number;
  isDownloaded: boolean;
  downloadProgress?: number;
  lastUpdated: string;
  tilesCount: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  priority: number;
  alertViaMesh: boolean;
  alertViaSms: boolean;
}

export interface SosEvent {
  id: string;
  triggeredAt: string;
  status: 'active' | 'cancelled' | 'resolved';
  latitude: number;
  longitude: number;
  broadcastChannel: string;
  contactsNotified: string[];
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'request';
  amount: number;
  recipientOrSender: string;
  recipientAddress: string;
  timestamp: string;
  status: 'completed' | 'queued_offline' | 'pending';
  note?: string;
  voucherCode?: string;
}

export interface SharedFile {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  direction: 'sent' | 'received';
  peerName: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'queued' | 'cancelled' | 'failed';
  progress: number;
  dataUrl?: string;
  checksum: string;
  content?: string;
}

export interface ActivityItem {
  id: string;
  module: 'connect' | 'navigate' | 'safe' | 'pay' | 'share' | 'system';
  title: string;
  description: string;
  timestamp: string;
  networkContext: NetworkStatus;
}

export interface UserProfile {
  callsign: string;
  displayName: string;
  nodeId: string;
  emergencyBloodType: string;
  medicalNotes: string;
  meshRelayEnabled: boolean;
  batterySaverMode: boolean;
}
