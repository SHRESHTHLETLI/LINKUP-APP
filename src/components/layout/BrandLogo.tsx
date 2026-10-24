import React from 'react';
import { useApp } from '../../context/AppContext';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  showText = true 
}) => {
  const { approvedLogoUrl, setIsLogoModalOpen } = useApp();
  const logoSrc = approvedLogoUrl || '/assets/aistudio/image_8048039e.png';

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9 sm:h-10 sm:w-10',
    lg: 'h-14 w-14 sm:h-16 sm:w-16',
    xl: 'h-24 w-24 sm:h-28 sm:w-28',
  };

  return (
    <div 
      onClick={() => setIsLogoModalOpen(true)}
      className="flex items-center gap-3 cursor-pointer group select-none"
      title="Approved LINKUP Brand Logo (Click to manage)"
    >
      <div className="relative shrink-0 flex items-center justify-center">
        <img 
          src={logoSrc} 
          alt="LINKUP Logo" 
          className={`${sizeClasses[size]} object-contain rounded-full drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-transform duration-300 group-hover:scale-105`} 
        />
      </div>

      {showText && size !== 'sm' && (
        <div className="flex flex-col">
          <div className="flex items-center font-black tracking-widest text-white text-base sm:text-lg font-mono leading-none">
            <span className="text-white">LINK</span>
            <span className="text-cyan-400">UP</span>
          </div>
          <span className="text-[9px] font-mono tracking-wider text-cyan-300/80 uppercase mt-0.5">
            Beyond Boundaries
          </span>
        </div>
      )}
    </div>
  );
};
