import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Settings, 
  Upload, 
  RefreshCw, 
  Trash2, 
  HardDrive, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Radio, 
  Download,
  Smartphone,
  ExternalLink
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { 
    networkStatus, 
    setNetworkStatus, 
    approvedLogoUrl, 
    setIsLogoModalOpen, 
    resetAllData, 
    mapPacks,
    goBack 
  } = useApp();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetData = () => {
    resetAllData();
  };

  const totalMapMb = mapPacks.filter((p) => p.isDownloaded).reduce((a, b) => a + b.sizeMb, 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-16 sm:pb-8 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-xs text-slate-400">Offline runtime, brand assets, and local cache management</p>
          </div>
        </div>
      </div>

      {/* Brand Governance Section */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-white">Brand Logo Asset Governance</h2>
            <p className="text-xs text-slate-400">Manage the approved LINKUP logo asset</p>
          </div>
          <button
            onClick={() => setIsLogoModalOpen(true)}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Manage Logo</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div>
            <span className="font-semibold text-white block">Status:</span>
            <span className="text-slate-400">
              {approvedLogoUrl ? 'Approved official logo mounted' : 'Typographic wordmark active (Awaiting approved asset)'}
            </span>
          </div>
          <span className="font-mono text-cyan-400 text-[11px]">
            {approvedLogoUrl ? 'Verified' : 'Pending Upload'}
          </span>
        </div>
      </div>

      {/* Network Override Simulation */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Simulated Network Conditions</h2>
          <p className="text-xs text-slate-400">Test how the application behaves in remote disconnected environments</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setNetworkStatus('online')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              networkStatus === 'online'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                : 'bg-[#080d1a] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-4 h-4 text-emerald-400 mb-2" />
            <div className="text-xs font-semibold">Online Mode</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cellular & Cloud active</div>
          </button>

          <button
            onClick={() => setNetworkStatus('limited')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              networkStatus === 'limited'
                ? 'bg-amber-500/10 border-amber-500/50 text-white'
                : 'bg-[#080d1a] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-400 mb-2" />
            <div className="text-xs font-semibold">Limited Mesh</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Peer relay hops only</div>
          </button>

          <button
            onClick={() => setNetworkStatus('offline')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              networkStatus === 'offline'
                ? 'bg-rose-500/10 border-rose-500/50 text-white'
                : 'bg-[#080d1a] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <WifiOff className="w-4 h-4 text-rose-400 mb-2" />
            <div className="text-xs font-semibold">Total Offline</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Zero network, local queues</div>
          </button>
        </div>
      </div>

      {/* Local Storage & Cache */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Device Cache Footprint</h2>
          <p className="text-xs text-slate-400">Offline vectors, cryptographic keys, and application state</p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-300 p-2.5 rounded-lg bg-[#080d1a]">
            <span>Cached Map Sectors:</span>
            <span className="font-mono text-cyan-400">{totalMapMb.toFixed(1)} MB</span>
          </div>
          <div className="flex justify-between text-slate-300 p-2.5 rounded-lg bg-[#080d1a]">
            <span>PWA Shell & Asset Cache:</span>
            <span className="font-mono text-emerald-400">Active (Service Worker)</span>
          </div>
          <div className="flex justify-between text-slate-300 p-2.5 rounded-lg bg-[#080d1a]">
            <span>Browser LocalStorage Quota:</span>
            <span className="font-mono text-slate-400">&lt; 1 MB utilized</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-rose-950/40 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Demo Data & Reload</span>
          </button>
        </div>
      </div>

      {/* App Specifications */}
      <div className="p-4 rounded-2xl bg-[#080d1a] border border-slate-800/80 text-xs text-slate-500 space-y-1">
        <div className="text-slate-300 font-semibold">LINKUP Demonstration Platform</div>
        <div className="text-slate-400">Stay Connected Beyond Boundaries</div>
      </div>
    </div>
  );
};
