import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Send, 
  Radio, 
  ArrowLeft, 
  Check, 
  CheckCheck, 
  Clock, 
  WifiOff, 
  Smartphone, 
  Server, 
  Tablet, 
  Signal, 
  Info,
  ShieldCheck, 
  Plus, 
  UserCheck, 
  ExternalLink,
  MapPin,
  Compass,
  AlertTriangle,
  Users,
  User,
  X,
  Share2,
  Navigation
} from 'lucide-react';
import { Conversation, ChatMessage, NearbyPeer, LocationAttachment } from '../../types';

export const ConnectScreen: React.FC = () => {
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversationId, 
    sendMessage, 
    createConversation,
    networkStatus,
    nearbyPeers,
    connectPeer,
    savedPlaces,
    setSelectedPlaceId,
    navigateTo,
    isSosActive,
    userCoords,
    openInNavigate,
    goBack 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'mesh'>('chats');
  const [chatFilter, setChatFilter] = useState<'all' | 'direct' | 'group'>('all');
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);
  
  // New conversation modal
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatRole, setNewChatRole] = useState('');
  const [newChatIsGroup, setNewChatIsGroup] = useState(false);
  const [newChatMemberCount, setNewChatMemberCount] = useState(4);

  // Location attachment drawer
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [stagedLocation, setStagedLocation] = useState<LocationAttachment | null>(null);

  // Mesh pairing
  const [selectedPeerForPairing, setSelectedPeerForPairing] = useState<NearbyPeer | null>(null);
  const [pairingState, setPairingState] = useState<'idle' | 'handshake' | 'paired'>('idle');

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (chatFilter === 'direct') return !c.isGroup;
    if (chatFilter === 'group') return !!c.isGroup;
    return true;
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !stagedLocation) return;
    if (!activeConv) return;

    sendMessage(
      activeConv.id, 
      inputText, 
      stagedLocation || undefined
    );
    setInputText('');
    setStagedLocation(null);
    setIsLocationPickerOpen(false);
  };

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatName.trim()) return;

    const convId = createConversation(
      newChatName.trim(), 
      newChatRole.trim() || (newChatIsGroup ? 'Tactical Group Net' : 'Field Operator'),
      newChatIsGroup,
      newChatIsGroup ? newChatMemberCount : undefined
    );
    setNewChatName('');
    setNewChatRole('');
    setNewChatIsGroup(false);
    setIsNewChatModalOpen(false);
    setActiveConversationId(convId);
    setMobileShowChat(true);
  };

  const handleAttachLocation = (place: { id?: string; title: string; coordinates: { lat: number; lng: number }; distance?: string; bearing?: string; category?: string }) => {
    setStagedLocation({
      placeId: place.id,
      title: place.title,
      coordinates: place.coordinates,
      distance: place.distance,
      bearing: place.bearing,
      category: place.category,
    });
    setIsLocationPickerOpen(false);
  };

  const handleAttachLiveCoordinates = () => {
    setStagedLocation({
      title: 'Current Live GPS Fix',
      coordinates: userCoords,
      distance: '0m',
      bearing: 'Origin Fix',
      category: 'Custom',
    });
    setIsLocationPickerOpen(false);
  };

  const openLocationInNavigate = (attachment: LocationAttachment, contactName?: string, isEmergency?: boolean) => {
    if (attachment.placeId) {
      setSelectedPlaceId(attachment.placeId);
    }
    openInNavigate({
      id: attachment.placeId || 'loc-' + Date.now(),
      title: attachment.title,
      coordinates: attachment.coordinates,
      address: attachment.bearing ? `${attachment.distance || ''} (${attachment.bearing})` : undefined,
      contactName: contactName || activeConv?.name || 'Radio Contact',
      isEmergency: isEmergency || attachment.isEmergencySos || false,
      isLive: false,
      status: networkStatus === 'offline' ? 'last_known' : 'live',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: isEmergency ? 'safe' : 'connect',
    });
  };

  const startPairingSimulation = (peer: NearbyPeer) => {
    setSelectedPeerForPairing(peer);
    setPairingState('handshake');
    setTimeout(() => {
      connectPeer(peer.id);
      setPairingState('paired');
    }, 1200);
  };

  const openChatWithPeer = (peer: NearbyPeer) => {
    const convId = createConversation(peer.name, peer.deviceType + ' Node');
    setActiveTab('chats');
    setActiveConversationId(convId);
    setMobileShowChat(true);
    setSelectedPeerForPairing(null);
    setPairingState('idle');
  };

  const quickMessageSuggestions = [
    "Radio check: signal clear on direct link.",
    "Reached northern perimeter landmark.",
    "Battery holding at 82%, GPS locked.",
    "Requesting checkpoint confirmation."
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-16 sm:pb-8">
      
      {/* 1. Header with Breadcrumb & Technical Range Disclosure */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">LINKUP Connect</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                P2P Messaging
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Decentralized peer chats, tactical group nets, and off-grid location sharing
            </p>
          </div>
        </div>

        {/* Tab Switcher: Chats vs Nearby Devices */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'chats'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chats ({conversations.length})
          </button>
          <button
            onClick={() => setActiveTab('mesh')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'mesh'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Nearby Devices ({nearbyPeers.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Realistic Range & Connection Status Banner */}
      <div className="p-3.5 rounded-2xl bg-[#0e172a] border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="font-semibold text-white">Radio Range Note: </span>
            <span className="text-slate-400">
              Standard smartphones operate over local Bluetooth/Wi-Fi mesh hops (~50–150m). ~10 km long-range communication is a future target via dedicated sub-GHz / LoRa relay nodes.
            </span>
          </div>
        </div>

        {/* Real-time Connection State Pill */}
        <div className="shrink-0 flex items-center gap-2 font-mono text-[11px]">
          {networkStatus === 'online' && (
            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Online (Cloud Synced)
            </span>
          )}
          {networkStatus === 'limited' && (
            <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Nearby Connection Available (Mesh Active)
            </span>
          )}
          {networkStatus === 'offline' && (
            <span className="text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5" />
              Saved Locally (Pending Sync)
            </span>
          )}
        </div>
      </div>

      {/* 3. Emergency SOS Alert Banner if LINKUP Safe is Active */}
      {isSosActive && (
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs flex items-center justify-between gap-3 text-rose-200 animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-white">EMERGENCY DISTRESS BEACON BROADCAST ACTIVE: </span>
              <span>Transmitting alert packet across all paired mesh nodes and channels.</span>
            </div>
          </div>
          <button
            onClick={() => navigateTo('safe')}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg shrink-0 transition-colors shadow"
          >
            Open Safe Centre
          </button>
        </div>
      )}

      {/* 4. MAIN MESSAGING LAYOUT */}
      {activeTab === 'chats' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl border border-slate-800 bg-[#0e172a] overflow-hidden min-h-[580px] shadow-xl">
          
          {/* LEFT COLUMN: Conversation & Contact List (5 cols on lg) */}
          <div className={`lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#080d1a]/50 ${mobileShowChat ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* Search Input & Filter Tabs */}
            <div className="p-3.5 border-b border-slate-800 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contacts, roles, or messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0e172a] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
                />
              </div>

              {/* Filter Tabs: All, Direct, Groups */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setChatFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    chatFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800'
                  }`}
                >
                  All ({conversations.length})
                </button>
                <button
                  onClick={() => setChatFilter('direct')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    chatFilter === 'direct'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800'
                  }`}
                >
                  Direct (1:1)
                </button>
                <button
                  onClick={() => setChatFilter('group')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    chatFilter === 'group'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800'
                  }`}
                >
                  Groups ({conversations.filter(c => c.isGroup).length})
                </button>
              </div>
            </div>

            {/* Conversation List Scroll Area */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-xs text-slate-500">
                  <p>No conversations matched your filter.</p>
                  <button
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Start a new conversation
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === activeConv?.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setMobileShowChat(true);
                      }}
                      className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 ${
                        isSelected ? 'bg-blue-950/30 border-l-2 border-blue-500' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Avatar / Group Badge */}
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center font-bold text-sm ${
                          conv.isGroup
                            ? 'bg-violet-950/40 border-violet-500/40 text-violet-300'
                            : 'bg-slate-800 border-slate-700/80 text-white'
                        }`}>
                          {conv.isGroup ? <Users className="w-5 h-5" /> : conv.name.charAt(0)}
                        </div>
                        {conv.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#0e172a] rounded-full" title="Node Online" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className={`text-xs font-bold truncate flex items-center gap-1.5 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            <span>{conv.name}</span>
                            {conv.isGroup && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                {conv.membersCount || 4} nodes
                              </span>
                            )}
                          </h3>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                            {conv.lastTimestamp}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="truncate">{conv.role}</span>
                          <span>·</span>
                          <span className="text-cyan-400 font-mono text-[10px] shrink-0">{conv.connectionType || 'BLE Mesh'}</span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-1 mt-1 leading-relaxed">
                          {conv.lastMessage}
                        </p>
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-cyan-500 text-black font-bold text-[10px] flex items-center justify-center shrink-0 self-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Bar in Left Column */}
            <div className="p-3 bg-[#080d1a] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">{conversations.length} demo channels</span>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Channel</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Chat Interface (7 cols on lg) */}
          <div className={`lg:col-span-7 flex flex-col bg-[#0b132b]/40 ${mobileShowChat ? 'flex' : 'hidden lg:flex'}`}>
            {activeConv ? (
              <>
                {/* Active Chat Header */}
                <div className="p-3.5 border-b border-slate-800 bg-[#0e172a] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setMobileShowChat(false)}
                      className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      title="Back to conversation list"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                      {activeConv.isGroup ? <Users className="w-4 h-4 text-violet-400" /> : activeConv.name.charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white truncate">{activeConv.name}</h2>
                        {activeConv.isGroup ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                            {activeConv.membersCount || 4} Members
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Paired Node
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {activeConv.role} · <span className="font-mono text-cyan-400">{activeConv.distance || 'BLE Mesh ~100m'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Header Actions: Quick Location Attach trigger */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setIsLocationPickerOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors"
                      title="Share a LINKUP Navigate location in this chat"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Attach Location</span>
                    </button>
                  </div>
                </div>

                {/* Message List Scroll View */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[520px]">
                  {activeConv.messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 p-8 space-y-2">
                      <Radio className="w-8 h-8 text-slate-600" />
                      <p>No messages in this thread yet. Send a radio check below.</p>
                    </div>
                  ) : (
                    activeConv.messages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                        >
                          {/* Sender name for group chats */}
                          {activeConv.isGroup && !isUser && msg.senderName && (
                            <span className="text-[10px] font-semibold text-violet-300 px-1 mb-1">
                              {msg.senderName}
                            </span>
                          )}

                          <div
                            className={`max-w-[90%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isUser
                                ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-950'
                                : 'bg-[#0e172a] border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                            }`}
                          >
                            <p>{msg.text}</p>

                            {/* Location Attachment Card if attached */}
                            {msg.locationAttachment && (
                              <div className="mt-2.5 p-3 rounded-xl bg-[#080d1a] border border-cyan-500/30 text-left space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs">
                                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span>{msg.locationAttachment.title}</span>
                                  </div>
                                  {msg.locationAttachment.category && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                                      {msg.locationAttachment.category}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] font-mono text-slate-400">
                                  Coordinates: {msg.locationAttachment.coordinates.lat.toFixed(4)}°, {msg.locationAttachment.coordinates.lng.toFixed(4)}°
                                  {msg.locationAttachment.distance && (
                                    <span> · {msg.locationAttachment.distance} ({msg.locationAttachment.bearing})</span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => openLocationInNavigate(msg.locationAttachment!, msg.senderName || activeConv?.name, false)}
                                  className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                  <span>Open in LINKUP Navigate</span>
                                </button>
                              </div>
                            )}

                            {/* Emergency SOS card if message is distress alert */}
                            {msg.isEmergencyAlert && (
                              <div className="mt-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-left space-y-2 text-rose-200">
                                <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs">
                                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                  <span>Emergency Distress Beacon</span>
                                </div>
                                <p className="text-[11px]">
                                  Distress coordinates broadcasting on 433MHz mesh frequency.
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openLocationInNavigate({
                                      title: 'Distress Beacon Coordinates',
                                      coordinates: { lat: 37.7782, lng: -122.4168 },
                                      isEmergencySos: true,
                                      category: 'Emergency'
                                    }, msg.senderName || activeConv?.name, true)}
                                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                                  >
                                    <Compass className="w-3.5 h-3.5" />
                                    <span>Tactical Map</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => navigateTo('safe')}
                                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                                  >
                                    Safe Centre
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Message Footer: Timestamp and Delivery Status */}
                          <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-500 font-mono">
                            <span>{msg.timestamp}</span>
                            {isUser && (
                              <>
                                <span>·</span>
                                {msg.status === 'delivered' ? (
                                  <span className="flex items-center gap-1 text-cyan-400">
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    <span>Delivered</span>
                                  </span>
                                ) : msg.status === 'queued_offline' ? (
                                  <span className="flex items-center gap-1 text-amber-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Saved locally · Pending delivery</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Sent</span>
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Staged Location Attachment Preview in Composer */}
                {stagedLocation && (
                  <div className="px-4 py-2 bg-[#080d1a] border-t border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span>Attached: <strong>{stagedLocation.title}</strong> ({stagedLocation.coordinates.lat.toFixed(4)}, {stagedLocation.coordinates.lng.toFixed(4)})</span>
                    </div>
                    <button
                      onClick={() => setStagedLocation(null)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Remove location attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Quick Message Suggestions */}
                <div className="px-4 py-2 bg-[#080d1a]/80 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[10px] text-slate-500 font-medium shrink-0">Quick Pings:</span>
                  {quickMessageSuggestions.map((text, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] truncate shrink-0 border border-slate-700/60 transition-colors"
                    >
                      {text}
                    </button>
                  ))}
                </div>

                {/* Offline Warning Notice if in Simulated Offline Mode */}
                {networkStatus === 'offline' && (
                  <div className="px-4 py-2 bg-rose-950/20 border-t border-rose-500/20 flex items-center justify-between text-[11px] text-rose-300">
                    <div className="flex items-center gap-2">
                      <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Offline mode active: Messages will be saved locally until network synchronization returns.</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">Nearby Mesh Available</span>
                  </div>
                )}

                {/* Chat Composer Form */}
                <form
                  onSubmit={handleSend}
                  className="p-3 bg-[#0e172a] border-t border-slate-800 flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setIsLocationPickerOpen(true)}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      stagedLocation 
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Attach a waypoint or location from LINKUP Navigate"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      networkStatus === 'offline'
                        ? "Type message (will be saved locally)..."
                        : "Type message to peer on mesh link..."
                    }
                    className="flex-1 bg-[#080d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() && !stagedLocation}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                Select a conversation from the left to start messaging.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* TAB 2: NEARBY PEERS & DEVICE LIST */
        <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Discovered Nearby Devices</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated local radio and Bluetooth beacons discovered within peer range
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono bg-cyan-950/40 border border-cyan-500/20 px-3 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Scanning 433MHz & BLE 5.3</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyPeers.map((peer) => {
              const isSelected = selectedPeerForPairing?.id === peer.id;
              return (
                <div
                  key={peer.id}
                  className={`p-4 rounded-xl bg-[#080d1a] border transition-all flex flex-col justify-between space-y-4 ${
                    isSelected ? 'border-cyan-500/60 bg-cyan-950/10' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        {peer.deviceType === 'Relay Node' ? (
                          <Server className="w-5 h-5 text-cyan-400" />
                        ) : peer.deviceType === 'Field Tablet' ? (
                          <Tablet className="w-5 h-5 text-violet-400" />
                        ) : (
                          <Smartphone className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{peer.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{peer.deviceType}</span>
                          <span>·</span>
                          <span>{peer.distance}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-mono text-cyan-400">
                        <Signal className="w-3.5 h-3.5" />
                        <span>{peer.signalStrength}%</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Hop {peer.meshHops}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {peer.signalStrength > 0 ? (
                        <span className="text-emerald-400 font-medium">Nearby Connection Available</span>
                      ) : (
                        <span className="text-slate-500">Unavailable</span>
                      )}
                    </div>

                    {peer.status === 'paired' ? (
                      <button
                        onClick={() => openChatWithPeer(peer)}
                        className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-medium rounded-lg border border-cyan-500/30 transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Open Channel</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startPairingSimulation(peer)}
                        disabled={isSelected && pairingState === 'handshake'}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {isSelected && pairingState === 'handshake' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            <span>Pairing...</span>
                          </>
                        ) : (
                          <span>Connect Demo Device</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LOCATION PICKER MODAL / DRAWER */}
      {isLocationPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0e172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Attach Location to Message</h3>
              </div>
              <button
                onClick={() => setIsLocationPickerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto text-xs">
              <p className="text-slate-400">
                Select a waypoint from your offline tactical catalog or broadcast your current GPS fix. Recipients can open this link directly in LINKUP Navigate.
              </p>

              {/* Current GPS Coordinates Option */}
              <div 
                onClick={handleAttachLiveCoordinates}
                className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/40 hover:border-cyan-400 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Current Live GPS Coordinates</div>
                    <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                      {userCoords.lat.toFixed(5)}° N, {userCoords.lng.toFixed(5)}° W
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-cyan-400">Attach Fix</span>
              </div>

              {/* Saved Destinations List */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Saved Destinations ({savedPlaces.length})
                </span>

                <div className="space-y-2">
                  {savedPlaces.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => handleAttachLocation(place)}
                      className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-white">{place.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {place.category} · {place.distance} · {place.bearing}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-cyan-400 font-medium hover:underline">
                        Select
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsLocationPickerOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CONVERSATION / GROUP MODAL */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0e172a] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create New Channel</h3>
              <button onClick={() => setIsNewChatModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChat} className="space-y-3.5 text-xs">
              {/* Channel Type Toggle: 1-to-1 vs Group */}
              <div>
                <label className="text-slate-300 block mb-1.5 font-medium">Channel Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewChatIsGroup(false)}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                      !newChatIsGroup
                        ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                        : 'bg-[#080d1a] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Direct (1:1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewChatIsGroup(true)}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                      newChatIsGroup
                        ? 'bg-violet-600 text-white border-violet-500 font-semibold'
                        : 'bg-[#080d1a] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Group Net</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  {newChatIsGroup ? 'Group Net Name' : 'Node / Contact Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newChatIsGroup ? 'e.g. Ridge Recon Alpha [Group]' : 'e.g. Liam T. [Scout]'}
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Operational Role / Sector</label>
                <input
                  type="text"
                  placeholder="e.g. Mountain Relay, Medical Evac Grid"
                  value={newChatRole}
                  onChange={(e) => setNewChatRole(e.target.value)}
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {newChatIsGroup && (
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Initial Member Nodes</label>
                  <select
                    value={newChatMemberCount}
                    onChange={(e) => setNewChatMemberCount(parseInt(e.target.value))}
                    className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={3}>3 Member Nodes</option>
                    <option value={4}>4 Member Nodes</option>
                    <option value={5}>5 Member Nodes</option>
                    <option value={8}>8 Member Nodes</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
