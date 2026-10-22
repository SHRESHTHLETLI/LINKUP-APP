import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showUploadHint?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showUploadHint = true }) => {
  const { approvedLogoUrl, setApprovedLogo, setIsLogoModalOpen } = useApp();
  const [assetChecked, setAssetChecked] = useState(false);

  // Check if an approved logo file already exists in /public (linkup-logo.svg or linkup-logo.png)
  useEffect(() => {
    if (!approvedLogoUrl && !assetChecked) {
      setAssetChecked(true);
      const testPaths = ['/linkup-logo.svg', '/linkup-logo.png'];
      const checkNext = async (idx: number) => {
        if (idx >= testPaths.length) return;
        try {
          const res = await fetch(testPaths[idx], { method: 'HEAD' });
          if (res.ok) {
            setApprovedLogo(testPaths[idx]);
          } else {
            checkNext(idx + 1);
          }
        } catch {
          checkNext(idx + 1);
        }
      };
      checkNext(0);
    }
  }, [approvedLogoUrl, assetChecked, setApprovedLogo]);

  const heightClass = size === 'sm' ? 'h-6' : size === 'lg' ? 'h-10' : 'h-8';

  if (approvedLogoUrl) {
    return (
      <div 
        onClick={() => setIsLogoModalOpen(true)}
        className="flex items-center gap-2 cursor-pointer group"
        title="Approved LINKUP Logo (Click to manage)"
      >
        <img 
          src={approvedLogoUrl} 
          alt="LINKUP Logo" 
          className={`${heightClass} w-auto object-contain transition-transform group-hover:scale-105`} 
        />
      </div>
    );
  }

  // Exact typographic brand fallback with honest upload request
  return (
    <div 
      onClick={() => setIsLogoModalOpen(true)}
      className="flex items-center gap-2.5 cursor-pointer group"
      title="Click to upload the approved LINKUP logo asset"
    >
      <div className="flex items-center font-black tracking-widest text-white text-lg sm:text-xl font-mono">
        <span className="text-white">LINK</span>
        <span className="text-cyan-400">UP</span>
      </div>

      {showUploadHint && (
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400/80 hover:text-cyan-300 transition-colors bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">
          <Upload className="w-3 h-3" />
          <span>Upload Logo</span>
        </span>
      )}
    </div>
  );
};
