import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Check, 
  X, 
  Radio, 
  ShieldCheck, 
  Info,
  Smartphone,
  Server,
  Tablet,
  Download,
  Trash2,
  Eye,
  Layers,
  Send,
  CheckCircle2,
  Wifi,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { SharedFile } from '../../types';

interface StagedFile {
  name: string;
  size: number;
  type: string;
  checksum: string;
  content: string;
  source: 'preset' | 'uploaded';
}

const SAMPLE_PRESETS: StagedFile[] = [
  {
    name: 'Sector_4_Topographic_Elevation.kml',
    size: 1820000,
    type: 'application/vnd.google-earth.kml+xml',
    checksum: 'sha256:7f83b165c9284ba1',
    source: 'preset',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>LINKUP Offline Tactical Grid - Sector 4</name>
    <description>Topographic contours, elevation beacons, and water depots for off-grid navigation.</description>
    <Placemark>
      <name>Camp Echo Base Perimeter</name>
      <Point><coordinates>-122.4168,37.7782,120</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Natural Spring Gravity Water Station</name>
      <Point><coordinates>-122.4279,37.7801,85</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>High Elevation Sightline Repeater</name>
      <Point><coordinates>-122.4112,37.7692,240</coordinates></Point>
    </Placemark>
  </Document>
</kml>`,
  },
  {
    name: 'Field_Medical_Protocols_v3.txt',
    size: 420000,
    type: 'text/plain',
    checksum: 'sha256:3e2918a1f8c47b90',
    source: 'preset',
    content: `LINKUP OFFLINE FIELD MEDICAL PROTOCOL (REV 3.2)
==================================================
CONFIDENTIAL - EMERGENCY OFFLINE CACHE

1. RAPID TRIAGE ASSESSMENT (M.A.R.C.H. PROTOCOL):
  - Massive Hemorrhage: Apply combat tourniquet 2-3 inches above bleeding site.
  - Airway: Verify airway patency; recovery posture if unconscious.
  - Respiration: Occlusive dressing on open chest wounds.
  - Circulation: Assess radial pulse, capillary refill, and core hypothermia.
  - Head Injury & Hypothermia: Keep insulated from soil contact; warm sweet fluids if fully alert.

2. WATER PURIFICATION STANDARDS:
  - Rapid boil: 3 full minutes rolling boil.
  - Chemical backup: 4 drops 2% iodine solution per 1000ml water; wait 30 minutes.

3. EMERGENCY DISPATCH CHANNELS:
  - LoRa Mesh Broadcast: 433.175 MHz (P2P Packets)
  - Medical Beacon Relay: 868.100 MHz (Sub-GHz FHSS)
  
Issued by: Tactical Medical Advisory Node`,
  },
  {
    name: 'Mesh_Relay_Radio_Config.json',
    size: 18400,
    type: 'application/json',
    checksum: 'sha256:a192fc83b0e2714c',
    source: 'preset',
    content: JSON.stringify(
      {
        mesh_network: "LINKUP-OFFGRID-01",
        node_id: "LN-8492-AX",
        heartbeat_interval_sec: 15,
        hop_limit: 7,
        encryption: "AES-256-GCM-P2P",
        frequency_mhz: 433.175,
        bandwidth_khz: 125,
        spreading_factor: 7,
        power_dbm: 20,
        gateway_forwarding: true
      },
      null,
      2
    ),
  },
];

export const ShareScreen: React.FC = () => {
  const { 
    sharedFiles, 
    sendFile, 
    cancelTransfer, 
    clearCompletedTransfers, 
    deleteSharedFile,
    nearbyPeers,
    goBack 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'prepare' | 'outbox' | 'vault'>('prepare');
  const [stagedFile, setStagedFile] = useState<StagedFile | null>(SAMPLE_PRESETS[0]);
  const [selectedPeerId, setSelectedPeerId] = useState<string>(nearbyPeers[0]?.id || 'peer-1');
  const [transferProtocol, setTransferProtocol] = useState<'wifi_direct' | 'ble_mesh'>('wifi_direct');
  const [dragActive, setDragActive] = useState(false);
  const [justDispatched, setJustDispatched] = useState<string | null>(null);
  
  // Inspection / Preview Modal state
  const [inspectingFile, setInspectingFile] = useState<SharedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleCustomFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const textContent = typeof reader.result === 'string' ? reader.result : '';
      setStagedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        checksum: 'sha256:' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8),
        content: textContent || `Payload binary file: ${file.name} (${file.size} bytes).`,
        source: 'uploaded',
      });
      setJustDispatched(null);
    };
    if (file.type.startsWith('text/') || file.name.endsWith('.kml') || file.name.endsWith('.json') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsText(file.slice(0, 1024));
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleCustomFile(e.dataTransfer.files[0]);
    }
  };

  const handleInitiateTransfer = () => {
    if (!stagedFile) return;

    sendFile(
      {
        name: stagedFile.name,
        size: stagedFile.size,
        type: stagedFile.type,
        content: stagedFile.content,
      },
      selectedPeerId
    );

    const transferredName = stagedFile.name;
    setJustDispatched(transferredName);
    setActiveTab('outbox');
  };

  // Local file download implementation
  const handleDownloadFile = (file: SharedFile) => {
    const content = file.content || `Demonstration payload for ${file.name}\nExported from LINKUP offline share vault.\nTimestamp: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: file.mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sentFiles = sharedFiles.filter((f) => f.direction === 'sent');
  const receivedFiles = sharedFiles.filter((f) => f.direction === 'received');
  const selectedPeer = nearbyPeers.find((p) => p.id === selectedPeerId) || nearbyPeers[0];

  const getFileIcon = (mimeType: string, name: string) => {
    if (name.endsWith('.kml') || name.endsWith('.gpx')) return <Layers className="w-5 h-5 text-cyan-400" />;
    if (name.endsWith('.json') || name.endsWith('.xml')) return <FileCode className="w-5 h-5 text-amber-400" />;
    if (name.endsWith('.csv')) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    return <FileText className="w-5 h-5 text-violet-400" />;
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-16 sm:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">LINKUP Share</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30">
                P2P Radio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-speed peer-to-peer file sharing and document exchange without cellular or internet connectivity
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('prepare')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'prepare' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Prepare File</span>
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'outbox' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Outbox ({sentFiles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'vault' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Vault ({receivedFiles.length})</span>
          </button>
        </div>
      </div>

      {/* Demonstration Guide Banner */}
      <div className="px-4 py-3 rounded-xl bg-violet-950/20 border border-violet-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-violet-200">
        <div className="flex items-start sm:items-center gap-2.5">
          <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-relaxed">
            <strong>Demonstration Guide:</strong> Select a demonstration preset or drop your own file, inspect the file details, pick a nearby mesh peer, and initiate a simulated peer-to-peer dispatch. You can also inspect or download files locally.
          </span>
        </div>
        <span className="text-[10px] font-mono text-violet-400 bg-violet-900/40 px-2.5 py-1 rounded-md shrink-0 self-start sm:self-auto border border-violet-500/20">
          DEMO — SIMULATED TRANSFER
        </span>
      </div>

      {/* TAB 1: PREPARE & DISPATCH */}
      {activeTab === 'prepare' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Preset Selection & Custom Dropzone (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Demo Presets */}
            <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet-400" />
                    <span>Quick Demonstration Presets</span>
                  </h2>
                  <p className="text-xs text-slate-400">Click to instantly stage a sample tactical file for demonstration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {SAMPLE_PRESETS.map((preset) => {
                  const isSelected = stagedFile?.name === preset.name;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setStagedFile(preset);
                        setJustDispatched(null);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-violet-950/40 border-violet-500/80 shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/30'
                          : 'bg-[#080d1a] border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {getFileIcon(preset.type, preset.name)}
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-violet-400 ring-2 ring-violet-400/30" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white truncate" title={preset.name}>
                          {preset.name.replace('.txt', '').replace('.kml', '').replace('.json', '')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatBytes(preset.size)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom File Upload Dropzone */}
            <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Custom File Selection</h2>
                <p className="text-xs text-slate-400">Drop any document or image from your device to prepare for sharing</p>
              </div>

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 ${
                  dragActive
                    ? 'border-violet-400 bg-violet-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-[#080d1a]/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleCustomFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    Drop file here or click to browse
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Maps, PDFs, offline notes, voice recordings (simulated off-grid transport)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Staged File Details & Transfer Preparation (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-semibold text-white">Transfer Preparation</h2>
                  <p className="text-[11px] text-slate-400">Inspect payload & configure peer recipient</p>
                </div>
                {stagedFile && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Ready to Dispatch
                  </span>
                )}
              </div>

              {stagedFile ? (
                <div className="space-y-4">
                  {/* File Details Card */}
                  <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                          {getFileIcon(stagedFile.type, stagedFile.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate" title={stagedFile.name}>
                            {stagedFile.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-cyan-400">{formatBytes(stagedFile.size)}</span>
                            <span>·</span>
                            <span className="truncate max-w-[150px]">{stagedFile.type}</span>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          setStagedFile(null);
                          setJustDispatched(null);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        title="Remove prepared file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Detailed Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Payload Hash</div>
                        <div className="font-mono text-slate-300 truncate mt-0.5" title={stagedFile.checksum}>
                          {stagedFile.checksum}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Source</div>
                        <div className="text-slate-300 capitalize mt-0.5">
                          {stagedFile.source === 'preset' ? 'Demo Tactical Cache' : 'Local File Picker'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Recipient Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Target Nearby Recipient
                    </label>
                    <div className="space-y-1.5">
                      {nearbyPeers.map((peer) => {
                        const isSelected = selectedPeerId === peer.id;
                        return (
                          <button
                            key={peer.id}
                            type="button"
                            onClick={() => setSelectedPeerId(peer.id)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-violet-950/30 border-violet-500 text-white'
                                : 'bg-[#080d1a] border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                {peer.deviceType === 'Relay Node' ? (
                                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                                ) : peer.deviceType === 'Field Tablet' ? (
                                  <Tablet className="w-3.5 h-3.5 text-violet-400" />
                                ) : (
                                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-white">{peer.name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                  <span>{peer.distance}</span>
                                  <span>·</span>
                                  {peer.signalStrength > 0 ? (
                                    <span className="text-emerald-400">Nearby Connection Available</span>
                                  ) : (
                                    <span className="text-slate-500">Unavailable</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Radio Protocol Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Transport Radio Protocol
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTransferProtocol('wifi_direct')}
                        className={`p-2 rounded-xl border text-left transition-colors ${
                          transferProtocol === 'wifi_direct'
                            ? 'bg-cyan-950/30 border-cyan-500 text-white'
                            : 'bg-[#080d1a] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-300">
                          <Wifi className="w-3.5 h-3.5" />
                          <span>Wi-Fi Direct</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">High Speed · 15 MB/s</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferProtocol('ble_mesh')}
                        className={`p-2 rounded-xl border text-left transition-colors ${
                          transferProtocol === 'ble_mesh'
                            ? 'bg-violet-950/30 border-violet-500 text-white'
                            : 'bg-[#080d1a] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-medium text-violet-300">
                          <Radio className="w-3.5 h-3.5" />
                          <span>BLE 5.3 Mesh</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Long Range · Low Power</div>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={handleInitiateTransfer}
                      className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Initiate Transfer to {selectedPeer?.name.split(' ')[0]}</span>
                    </button>

                    <button
                      onClick={() => setStagedFile(null)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Staged File</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">No File Staged</div>
                    <div className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto">
                      Choose one of the quick presets on the left or drop a local file to prepare for transfer.
                    </div>
                  </div>
                  <button
                    onClick={() => setStagedFile(SAMPLE_PRESETS[0])}
                    className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-medium transition-colors"
                  >
                    Stage Sample File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OUTBOX & ACTIVE TRANSFERS */}
      {activeTab === 'outbox' && (
        <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white">Simulated Outbox Transfers ({sentFiles.length})</h2>
              <p className="text-xs text-slate-400">Live byte transmission progression over simulated off-grid links</p>
            </div>
            {sentFiles.length > 0 && (
              <button
                onClick={clearCompletedTransfers}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800"
              >
                Clear Completed
              </button>
            )}
          </div>

          {justDispatched && (
            <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/40 flex items-center justify-between text-xs text-violet-200">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-violet-400" />
                <span>Payload <strong>{justDispatched}</strong> initiated. Progress is updating below in real time.</span>
              </span>
              <button
                onClick={() => setJustDispatched(null)}
                className="text-violet-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {sentFiles.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-500">
                <Send className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-400">No outgoing transfers dispatched yet.</div>
              <button
                onClick={() => setActiveTab('prepare')}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
              >
                Prepare File for Dispatch
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sentFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 rounded-xl bg-[#080d1a] border border-slate-800/80 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        {getFileIcon(file.mimeType, file.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{file.name}</div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-mono text-cyan-400">{formatBytes(file.sizeBytes)}</span>
                          <span>·</span>
                          <span>Recipient: {file.peerName}</span>
                          <span>·</span>
                          <span className="font-mono text-slate-500">{file.checksum}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {file.status === 'in_progress' ? (
                        <button
                          onClick={() => cancelTransfer(file.id)}
                          className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors flex items-center gap-1"
                          title="Cancel simulated transfer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Abort</span>
                        </button>
                      ) : file.status === 'completed' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3" />
                            Delivered & Verified
                          </span>
                          <button
                            onClick={() => setInspectingFile(file)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                            title="Inspect file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {file.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {file.status === 'in_progress' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span className="text-violet-300 font-semibold">{file.progress}% Transmitted</span>
                        <span>Est. 3.4 MB/s · Wi-Fi Direct</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECEIVED FILE VAULT */}
      {activeTab === 'vault' && (
        <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white">Received File Vault ({receivedFiles.length})</h2>
              <p className="text-xs text-slate-400">Files received and cached in local encrypted device memory from mesh peers</p>
            </div>
            <span className="text-[11px] text-cyan-400 font-mono bg-cyan-950/30 border border-cyan-500/30 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              Ready for Offline Reading & Download
            </span>
          </div>

          <div className="space-y-3">
            {receivedFiles.map((file) => (
              <div
                key={file.id}
                className="p-4 rounded-xl bg-[#080d1a] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700/80 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
                    {getFileIcon(file.mimeType, file.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="font-mono text-cyan-400">{formatBytes(file.sizeBytes)}</span>
                      <span>·</span>
                      <span>From {file.peerName}</span>
                      <span>·</span>
                      <span>{file.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Inspect Payload Preview Button */}
                  <button
                    onClick={() => setInspectingFile(file)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                    title="View file payload details"
                  >
                    <Eye className="w-3.5 h-3.5 text-violet-400" />
                    <span>View</span>
                  </button>

                  {/* Real Local File Download Button */}
                  <button
                    onClick={() => handleDownloadFile(file)}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Download demonstration file to your device"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  {/* Delete from Vault */}
                  <button
                    onClick={() => deleteSharedFile(file.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete from local vault"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSPECT / PREVIEW FILE MODAL */}
      {inspectingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e172a] border border-slate-700 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {getFileIcon(inspectingFile.mimeType, inspectingFile.name)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                    {inspectingFile.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {formatBytes(inspectingFile.sizeBytes)} · {inspectingFile.peerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingFile(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: File Information & Payload Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#080d1a] border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Transmission Status</span>
                  <div className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cryptographically Verified</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Integrity Hash</span>
                  <div className="font-mono text-slate-300 truncate mt-0.5" title={inspectingFile.checksum}>
                    {inspectingFile.checksum}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Payload Preview
                </label>
                <pre className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                  {inspectingFile.content || 'Binary data packet payload stored in local buffer.'}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#080d1a] flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                SIMULATED OFFLINE FILE INSPECTOR
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadFile(inspectingFile)}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File Locally</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
