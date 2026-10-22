import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { 
  Wifi, 
  WifiOff, 
  Radio, 
  Settings, 
  ShieldAlert, 
  ChevronDown 
} from 'lucide-react';
import { NetworkStatus, ScreenId } from '../../types';

export const Header: React.FC = () => {
  const { 
    networkStatus, 
    setNetworkStatus, 
    currentScreen, 
    navigateTo, 
    isSosActive 
  } = useApp();

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const navItems: { id: ScreenId; label: string }[] = [
    { id: 'dashboard', label: 'Home' },
    { id: 'connect', label: 'Connect' },
    { id: 'navigate', label: 'Navigate' },
    { id: 'safe', label: 'Safe' },
    { id: 'pay', label: 'Pay' },
    { id: 'share', label: 'Share' },
  ];

  const getStatusColor = (status: NetworkStatus) => {
    switch (status) {
      case 'online':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'limited':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'offline':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  const getStatusIcon = (status: NetworkStatus) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-3.5 h-3.5 text-emerald-400" />;
      case 'limited':
        return <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
      case 'offline':
        return <WifiOff className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const getStatusLabel = (status: NetworkStatus) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'limited':
        return 'Limited Mesh';
      case 'offline':
        return 'Offline';
    }
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 w-full bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Left: Brand Logo & Tagline */}
        <div className="flex items-center gap-3 md:gap-5 min-w-0">
          <div 
            onClick={() => navigateTo('dashboard')}
            className="cursor-pointer flex items-center gap-3 shrink-0"
          >
            <BrandLogo size="md" />
          </div>
          
          <div className="hidden xl:flex items-center border-l border-slate-800 pl-4">
            <span className="text-[11px] tracking-wide text-slate-400 font-medium">
              Stay Connected Beyond Boundaries
            </span>
          </div>
        </div>

        {/* Center: Five Primary Modules Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0e172a] border border-slate-800/80 p-1 rounded-xl">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id || (item.id === 'safe' && currentScreen === 'save');
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[36px] ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Persistent SOS Shortcut, Simulated Connectivity Status & Settings */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Persistent LINKUP Safe / SOS Shortcut on Every Main Screen */}
          <button
            onClick={() => navigateTo('safe')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
              isSosActive
                ? 'bg-rose-600 border border-rose-400 text-white animate-pulse shadow-lg shadow-rose-900/50'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 active:scale-95'
            }`}
            title="LINKUP Safe: SOS, Emergency Beacon & Assistance"
          >
            <ShieldAlert className={`w-4 h-4 ${isSosActive ? 'text-white' : 'text-rose-400'} shrink-0`} />
            <span className="tracking-wider">{isSosActive ? 'SOS ACTIVE' : 'SOS'}</span>
          </button>

          {/* Simulated Connection Mode Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl border transition-all min-h-[40px] ${getStatusColor(
                networkStatus
              )}`}
              title="Toggle simulated network state for demonstration"
            >
              {getStatusIcon(networkStatus)}
              <span className="hidden sm:inline text-[11px] font-medium text-slate-300">
                Simulated:
              </span>
              <span className="font-mono text-[11px] font-semibold">
                {getStatusLabel(networkStatus)}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
            </button>

            {isStatusDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsStatusDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 bg-[#0e172a] border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-fade-in">
                  <div className="px-3.5 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                    Simulated Network State
                  </div>
                  <div className="px-3.5 py-1 text-[11px] text-slate-400 leading-tight">
                    Switch app demo between cloud sync and offline mesh modes:
                  </div>
                  <div className="mt-1 space-y-0.5 px-1">
                    <button
                      onClick={() => {
                        setNetworkStatus('online');
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg hover:bg-slate-800/80 transition-colors ${
                        networkStatus === 'online' ? 'text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-300'
                      }`}
                    >
                      <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-medium">Online</div>
                        <div className="text-[10px] text-slate-400">Delivered & Cloud Synced</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setNetworkStatus('limited');
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg hover:bg-slate-800/80 transition-colors ${
                        networkStatus === 'limited' ? 'text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20' : 'text-slate-300'
                      }`}
                    >
                      <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                      <div>
                        <div className="font-medium">Limited Mesh</div>
                        <div className="text-[10px] text-slate-400">Nearby Connection Available</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setNetworkStatus('offline');
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg hover:bg-slate-800/80 transition-colors ${
                        networkStatus === 'offline' ? 'text-rose-300 font-semibold bg-rose-500/10 border border-rose-500/20' : 'text-slate-300'
                      }`}
                    >
                      <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div className="font-medium">Total Offline</div>
                        <div className="text-[10px] text-slate-400">Saved Locally · Pending Sync</div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings Control */}
          <button
            onClick={() => navigateTo('settings')}
            className={`p-2 rounded-xl border transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${
              currentScreen === 'settings'
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="App Settings & Demo Reset"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
};
