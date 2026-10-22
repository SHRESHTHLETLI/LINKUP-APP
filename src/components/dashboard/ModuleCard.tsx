import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  subtitle?: string;
  description: string;
  icon: React.ReactNode;
  accent: 'blue' | 'cyan' | 'rose' | 'emerald' | 'violet';
  badge?: string;
  badgeLabel?: string;
  onClick: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  accent,
  badge,
  badgeLabel,
  onClick,
}) => {
  const getAccentStyles = () => {
    switch (accent) {
      case 'blue':
        return {
          border: 'border-blue-500/20 hover:border-blue-500/60',
          iconBg: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
          btnBg: 'bg-blue-600/90 hover:bg-blue-500 text-white shadow-blue-900/30',
          glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]',
          badgeText: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        };
      case 'cyan':
        return {
          border: 'border-cyan-500/20 hover:border-cyan-500/60',
          iconBg: 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20',
          btnBg: 'bg-cyan-600/90 hover:bg-cyan-500 text-white shadow-cyan-900/30',
          glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
          badgeText: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        };
      case 'rose':
        return {
          border: 'border-rose-500/20 hover:border-rose-500/60',
          iconBg: 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20',
          btnBg: 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-rose-900/30',
          glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]',
          badgeText: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        };
      case 'emerald':
        return {
          border: 'border-emerald-500/20 hover:border-emerald-500/60',
          iconBg: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
          btnBg: 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-emerald-900/30',
          glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
          badgeText: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        };
      case 'violet':
        return {
          border: 'border-violet-500/20 hover:border-violet-500/60',
          iconBg: 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20',
          btnBg: 'bg-violet-600/90 hover:bg-violet-500 text-white shadow-violet-900/30',
          glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
          badgeText: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <div
      onClick={onClick}
      className={`group relative text-left w-full p-5 sm:p-6 rounded-2xl bg-[#0e172a] border ${styles.border} ${styles.glow} transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden min-h-[190px] shadow-lg`}
    >
      <div>
        {/* Top Header: Icon & Badge */}
        <div className="flex items-start justify-between w-full mb-3">
          <div className={`p-3 rounded-xl ${styles.iconBg} transition-colors flex items-center justify-center`}>
            {icon}
          </div>
          
          {badge && (
            <span className={`text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${styles.badgeText}`}>
              {badge} {badgeLabel && <span className="opacity-70 text-[10px]">· {badgeLabel}</span>}
            </span>
          )}
        </div>

        {/* Title & One-line Description */}
        {subtitle && (
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-0.5">
            {subtitle}
          </div>
        )}
        <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-300 font-medium leading-relaxed mt-1">
          {description}
        </p>
      </div>

      {/* Card Footer: Explicit Working Open Button */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-400 transition-colors">
          Offline Enabled
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow transition-all min-h-[40px] active:scale-95 ${styles.btnBg}`}
        >
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
