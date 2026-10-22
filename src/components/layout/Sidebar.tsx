import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { 
  Home, 
  MessageSquare, 
  Compass, 
  ShieldAlert, 
  Wallet, 
  Share2, 
  Settings, 
  Wifi, 
  WifiOff, 
  Radio, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { ScreenId } from '../../types';

export const Sidebar: React.FC = () => {
  const { 
    currentScreen, 
    navigateTo, 
    isSosActive, 
    networkStatus, 
    setNetworkStatus,
    conversations,
    savedPlaces,
    balance,
    sharedFiles,
    profile
  } = useApp();

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const navItems: {
    id: ScreenId;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
    accentColor: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Home',
      description: 'Dashboard',
      icon: <Home className="w-4 h-4" />,
      accentColor: 'text-cyan-400',
    },
    {
      id: 'connect',
      label: 'Connect',
      description: 'Message people',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: totalUnread > 0 ? `${totalUnread}` : undefined,
      accentColor: 'text-blue-400',
    },
    {
      id: 'navigate',
      label: 'Navigate',
      description: 'Maps & locations',
      icon: <Compass className="w-4 h-4" />,
      badge: `${savedPlaces.length}`,
      accentColor: 'text-cyan-400',
    },
    {
      id: 'safe',
      label: 'Safe',
      description: 'SOS & emergency',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: isSosActive ? 'ACTIVE' : undefined,
      accentColor: 'text-rose-400',
    },
    {
      id: 'pay',
      label: 'Pay',
      description: 'Wallet & payments',
      icon: <Wallet className="w-4 h-4" />,
      badge: `$${balance.toFixed(0)}`,
      accentColor: 'text-emerald-400',
    },
    {
      id: 'share',
      label: 'Share',
      description: 'Transfer files',
      icon: <Share2 className="w-4 h-4" />,
      badge: `${sharedFiles.length}`,
      accentColor: 'text-violet-400',
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-[#080d1a] border-r border-slate-800/80 p-5 shrink-0 z-30 select-none">
      
      {/* 1. Brand Logo & Tagline */}
      <div className="pb-5 border-b border-slate-800/80">
        <div 
          onClick={() => navigateTo('dashboard')}
          className="cursor-pointer group flex flex-col gap-1.5"
          title="Return to Home Dashboard"
        >
          <BrandLogo size="md" />
          <p className="text-[11px] font-medium tracking-wide text-slate-400 group-hover:text-cyan-300 transition-colors">
            Stay Connected Beyond Boundaries
          </p>
        </div>
      </div>

      {/* 2. Persistent Safe / SOS Emergency Action Button */}
      <div className="my-4">
        <button
          onClick={() => navigateTo('safe')}
          className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all duration-200 active:scale-98 ${
            isSosActive
              ? 'bg-rose-600 border border-rose-400 text-white animate-pulse shadow-lg shadow-rose-950'
              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50'
          }`}
          title="LINKUP Safe: Emergency Beacon & Assistance"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isSosActive ? 'bg-white/20' : 'bg-rose-500/20'}`}>
              <ShieldAlert className={`w-4 h-4 ${isSosActive ? 'text-white' : 'text-rose-400'}`} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold tracking-wider">
                {isSosActive ? 'EMERGENCY SOS ACTIVE' : 'LINKUP SAFE · SOS'}
              </div>
              <div className="text-[10px] text-rose-300/80">
                {isSosActive ? 'Distress beacon broadcasting' : 'Instant emergency assistance'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </button>
      </div>

      {/* 3. Navigation Links */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 -mr-1">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
          Modules
        </div>

        {navItems.map((item) => {
          const isActive = currentScreen === item.id || (item.id === 'safe' && currentScreen === 'save');
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                isActive
                  ? 'bg-[#0e172a] text-white font-semibold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isActive ? item.accentColor : 'text-slate-400'}>
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-xs truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{item.description}</div>
                </div>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
                  item.id === 'safe' && isSosActive
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Compact Global Simulated Offline/Online State Controller */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <div className="p-3 rounded-2xl bg-[#0e172a] border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-300 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Simulated State
            </span>
            <span className="font-mono text-[10px] text-cyan-400">
              Demo Control
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 bg-[#080d1a] border border-slate-800 rounded-xl">
            <button
              onClick={() => setNetworkStatus('online')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                networkStatus === 'online'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setNetworkStatus('limited')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                networkStatus === 'limited'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mesh
            </button>
            <button
              onClick={() => setNetworkStatus('offline')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                networkStatus === 'offline'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Offline
            </button>
          </div>

          <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1.5">
            {networkStatus === 'online' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Wifi className="w-3 h-3 shrink-0" />
                Delivered & Cloud Synced
              </span>
            )}
            {networkStatus === 'limited' && (
              <span className="text-amber-400 flex items-center gap-1">
                <Radio className="w-3 h-3 shrink-0 animate-pulse" />
                Nearby Connection Available
              </span>
            )}
            {networkStatus === 'offline' && (
              <span className="text-rose-400 flex items-center gap-1">
                <WifiOff className="w-3 h-3 shrink-0" />
                Saved Locally · Pending Sync
              </span>
            )}
          </div>
        </div>

        {/* Settings Shortcut */}
        <button
          onClick={() => navigateTo('settings')}
          className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
            currentScreen === 'settings'
              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Settings & Brand</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {profile.callsign}
          </span>
        </button>
      </div>

    </aside>
  );
};
