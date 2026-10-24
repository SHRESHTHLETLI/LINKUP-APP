import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Upload, Trash2, CheckCircle2, ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';

export const LogoUploaderModal: React.FC = () => {
  const { isLogoModalOpen, setIsLogoModalOpen, approvedLogoUrl, setApprovedLogo, logActivity } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isLogoModalOpen) return null;

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (SVG, PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5 MB. Please select an optimized logo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setApprovedLogo(result);
        logActivity('system', 'Approved Logo Updated', `Loaded verified brand asset "${file.name}".`);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#0e172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Brand Asset Management</h2>
          </div>
          <button
            onClick={() => setIsLogoModalOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-cyan-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Mandatory Brand Requirement
            </div>
            <p className="leading-relaxed text-slate-400">
              Per LINKUP brand governance, AI regeneration, redrawing, or approximations are strictly prohibited.
              If the original approved LINKUP logo is on your machine, select it below to mount it in all brand locations.
            </p>
          </div>

          {/* Current Logo Preview */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Logo Status
            </label>
            <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 flex items-center justify-between">
              {approvedLogoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-900 border border-slate-700/60 rounded-lg flex items-center justify-center min-w-28 max-w-40 h-14">
                    <img src={approvedLogoUrl} alt="Active Approved Logo" className="max-h-10 max-w-full object-contain" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Approved Asset Active
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Persisted in local browser storage</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-amber-300">Awaiting Approved Asset</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Displaying standard typographic wordmark</p>
                  </div>
                </div>
              )}

              {approvedLogoUrl && approvedLogoUrl !== '/assets/aistudio/image_8048039e.png' ? (
                <button
                  onClick={() => setApprovedLogo('/assets/aistudio/image_8048039e.png')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors border border-cyan-500/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Official Logo</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-slate-700/70 hover:border-slate-600 bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-200">
                Click to browse or drag and drop your logo file
              </p>
              <p className="text-[11px] text-slate-500">
                Supports SVG, PNG, JPG, WebP (Max 5 MB)
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-lg">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setIsLogoModalOpen(false)}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
