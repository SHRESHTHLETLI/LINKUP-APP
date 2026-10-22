import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../layout/BrandLogo';
import { ModuleCard } from './ModuleCard';
import { 
  MessageSquare, 
  Compass, 
  ShieldAlert, 
  Wallet, 
  Share2,
  Wifi,
  WifiOff,
  Radio,
  ChevronRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    navigateTo, 
    conversations, 
    savedPlaces, 
    balance, 
    sharedFiles, 
    isSosActive,
    networkStatus,
    setNetworkStatus
  } = useApp();

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-20 sm:pb-8">
      
      {/* 1. Clean Mobile-App Dashboard Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e172a] via-[#0b132b] to-[#080d1a] border border-slate-800/80 p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Approved Logo & Exact Tagline */}
          <div className="space-y-2">
            <BrandLogo size="lg" />
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-cyan-300/90 font-mono">
              Stay Connected Beyond Boundaries
            </p>
          </div>

          {/* Compact Global Simulated Connectivity Status */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#080d1a] border border-slate-800 shrink-0 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium">
              {networkStatus === 'online' && (
                <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Online</span>
                </span>
              )}
              {networkStatus === 'limited' && (
                <span className="text-amber-400 flex items-center gap-1.5 font-semibold">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Limited Mesh</span>
                </span>
              )}
              {networkStatus === 'offline' && (
                <span className="text-rose-400 flex items-center gap-1.5 font-semibold">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 border-l border-slate-800 pl-2 pr-1">
              <button
                onClick={() => setNetworkStatus('online')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                  networkStatus === 'online'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simulate Online (Cloud & satellite sync)"
              >
                Online
              </button>
              <button
                onClick={() => setNetworkStatus('limited')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                  networkStatus === 'limited'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simulate Limited Mesh (Nearby connection available)"
              >
                Mesh
              </button>
              <button
                onClick={() => setNetworkStatus('offline')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                  networkStatus === 'offline'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simulate Offline (Saved locally · pending sync)"
              >
                Offline
              </button>
            </div>
          </div>

        </div>

        {/* If SOS active, high priority alert banner */}
        {isSosActive && (
          <div 
            onClick={() => navigateTo('safe')}
            className="mt-4 p-3 rounded-2xl bg-rose-600 border border-rose-400 text-white flex items-center justify-between cursor-pointer animate-pulse shadow-lg shadow-rose-950"
          >
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <ShieldAlert className="w-5 h-5 text-white" />
              <span>EMERGENCY SOS BROADCAST ACTIVE — Tap to open Safe centre</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </section>

      {/* 2. Five Attractive, Clearly Distinguishable Module Cards */}
      <section aria-label="LINKUP Core Modules" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Connect — Message people. */}
          <ModuleCard
            title="Connect"
            subtitle="LINKUP Connect"
            description="Message people."
            accent="blue"
            icon={<MessageSquare className="w-6 h-6" />}
            badge={totalUnreadMessages > 0 ? `${totalUnreadMessages} New` : `${conversations.length} Active`}
            badgeLabel="Threads"
            onClick={() => navigateTo('connect')}
          />

          {/* Card 2: Navigate — Explore maps and share locations. */}
          <ModuleCard
            title="Navigate"
            subtitle="LINKUP Navigate"
            description="Explore maps and share locations."
            accent="cyan"
            icon={<Compass className="w-6 h-6" />}
            badge={`${savedPlaces.length}`}
            badgeLabel="Saved Places"
            onClick={() => navigateTo('navigate')}
          />

          {/* Card 3: Safe — SOS and emergency contacts. */}
          <ModuleCard
            title="Safe"
            subtitle="LINKUP Safe"
            description="SOS and emergency contacts."
            accent="rose"
            icon={<ShieldAlert className="w-6 h-6" />}
            badge={isSosActive ? "ALERT ACTIVE" : "SOS Armed"}
            badgeLabel="Safety"
            onClick={() => navigateTo('safe')}
          />

          {/* Card 4: Pay — Send, receive and track demo payments. */}
          <ModuleCard
            title="Pay"
            subtitle="LINKUP Pay"
            description="Send, receive and track demo payments."
            accent="emerald"
            icon={<Wallet className="w-6 h-6" />}
            badge={`$${balance.toFixed(2)}`}
            badgeLabel="Demo Balance"
            onClick={() => navigateTo('pay')}
          />

          {/* Card 5: Share — Transfer files. */}
          <ModuleCard
            title="Share"
            subtitle="LINKUP Share"
            description="Transfer files."
            accent="violet"
            icon={<Share2 className="w-6 h-6" />}
            badge={`${sharedFiles.length}`}
            badgeLabel="Transfers"
            onClick={() => navigateTo('share')}
          />

        </div>
      </section>

    </div>
  );
};
