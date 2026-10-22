import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  MessageSquare, 
  Compass, 
  ShieldAlert, 
  Wallet, 
  Share2 
} from 'lucide-react';
import { ScreenId } from '../../types';

export const BottomNav: React.FC = () => {
  const { currentScreen, navigateTo } = useApp();

  const navItems: { id: ScreenId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'connect', label: 'Connect', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'navigate', label: 'Navigate', icon: <Compass className="w-4 h-4" /> },
    { id: 'safe', label: 'Safe', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'pay', label: 'Pay', icon: <Wallet className="w-4 h-4" /> },
    { id: 'share', label: 'Share', icon: <Share2 className="w-4 h-4" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d1a]/95 backdrop-blur-md border-t border-slate-800/90 px-2 py-1 flex items-center justify-around safe-bottom">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id || (item.id === 'safe' && currentScreen === 'save');
        const isSafe = item.id === 'safe';

        return (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl transition-all active:scale-95 ${
              isSafe
                ? isActive
                  ? 'text-rose-300 font-bold bg-rose-500/20 border border-rose-500/40 shadow-sm shadow-rose-950'
                  : 'text-rose-400/90 hover:text-rose-300 bg-rose-500/5'
                : isActive 
                  ? 'text-cyan-300 font-bold bg-cyan-950/50 border border-cyan-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {item.icon}
              {isSafe && (
                <span className="absolute -top-1 -right-2 text-[8px] font-black font-mono px-1 py-0.2 bg-rose-600 text-white rounded-full">
                  SOS
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
