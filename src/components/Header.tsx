import React from 'react';
import {
  Activity,
  AlertTriangle,
  Globe2,
  HardDrive,
  Layers,
  Radio,
  RotateCcw,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useMissionStore, type ViewModule } from '../store/useMissionStore';
import { TickerRef } from './TickerRef';

export const Header: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    telemetry,
    isAudioMuted,
    toggleAudioMute,
    simSpeed,
    setSimSpeed,
    clearFaults,
    setIsOverUI,
  } = useMissionStore();

  const masterAlert = telemetry?.masterAlertLevel || 'NOMINAL';

  const navItems: { id: ViewModule; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'OVERVIEW', label: 'STATUS OVERVIEW', icon: Layers },
    { id: 'TELEMETRY', label: 'TELEMETRY CHARTS', icon: Activity },
    { id: 'COMMS', label: 'COMMS & GROUND', icon: Radio },
    { id: 'TIMELINE', label: 'TIMELINE & LOGS', icon: HardDrive },
    { id: '3D_LAB', label: '3D SPATIAL LAB', icon: Globe2 },
  ];

  return (
    <header
      className="bg-[#0b0f19]/90 border-b border-cyan-900/40 backdrop-blur-md px-4 py-2.5 text-slate-200 select-none sticky top-0 z-40"
      onMouseEnter={() => setIsOverUI(true)}
      onMouseLeave={() => setIsOverUI(false)}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Orbit Telemetry */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <div
                className={`w-3 h-3 rounded-full ${
                  masterAlert === 'NOMINAL'
                    ? 'bg-emerald-400 shadow-[0_0_12px_#10b981]'
                    : masterAlert === 'WARNING'
                    ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-ping'
                    : 'bg-rose-500 shadow-[0_0_16px_#f43f5e] animate-bounce'
                }`}
              />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wider font-mono text-cyan-400 flex items-center gap-1.5">
                ASTRAEA-1 <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">LEO SIM</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">
                SAT-ID: 2026-088A | NORAD: 58912
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          {/* Mission Elapsed Time */}
          <div className="bg-slate-900/80 px-3 py-1 rounded border border-slate-800 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">MET:</span>
            <TickerRef
              selector={(t) => {
                const totalSec = t.metSec;
                const hrs = Math.floor(totalSec / 3600);
                const mins = Math.floor((totalSec % 3600) / 60);
                const secs = totalSec % 60;
                return `T+${String(hrs).padStart(3, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
              }}
              className="text-xs text-cyan-300 font-bold"
              fallback="T+000:00:00"
            />
          </div>

          {/* Orbit Number */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/50 px-2.5 py-1 rounded border border-slate-800 font-mono">
            <span className="text-slate-400">ORBIT:</span>
            <TickerRef
              selector={(t) => `#${t.orbit.orbitNumber}`}
              className="text-emerald-400 font-semibold"
              fallback="#--"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 w-full md:w-auto overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Controls: Speed, Audio, Fault Reset */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Master Alert Status Badge */}
          <div
            className={`px-2.5 py-1 rounded border text-[11px] font-mono font-bold flex items-center gap-1.5 ${
              masterAlert === 'NOMINAL'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : masterAlert === 'WARNING'
                ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                : 'bg-rose-950/90 border-rose-800 text-rose-300 animate-pulse'
            }`}
          >
            {masterAlert === 'NOMINAL' ? (
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            ) : masterAlert === 'WARNING' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>{masterAlert}</span>
          </div>

          {/* Simulation Speed Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                  simSpeed === s ? 'bg-cyan-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleAudioMute}
            className={`p-1.5 rounded border transition-colors cursor-pointer ${
              isAudioMuted
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                : 'bg-cyan-950/60 border-cyan-800 text-cyan-400 hover:bg-cyan-900/80'
            }`}
            title={isAudioMuted ? 'Unmute Procedural Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Clear Injected Faults */}
          <button
            onClick={clearFaults}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded cursor-pointer transition-colors"
            title="Reset telemetry fault overrides"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </div>
    </header>
  );
};
