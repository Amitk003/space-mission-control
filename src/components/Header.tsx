import { useCallback, type ComponentType } from 'react';
import {
  Activity,
  Globe2,
  HardDrive,
  Layers,
  Radio,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useMissionStore, type ViewModule } from '../store/useMissionStore';
import { TickerRef } from './TickerRef';

const navItems: { id: ViewModule; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'OVERVIEW', label: 'Status Overview', icon: Layers },
  { id: 'TELEMETRY', label: 'Telemetry Charts', icon: Activity },
  { id: 'COMMS', label: 'Comms & Ground', icon: Radio },
  { id: 'TIMELINE', label: 'Timeline & Logs', icon: HardDrive },
  { id: '3D_LAB', label: '3D Spatial Lab', icon: Globe2 },
];

export const Header = () => {
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

  const handleClearFaults = useCallback(() => {
    if (window.confirm('Clear all injected faults?')) clearFaults();
  }, [clearFaults]);

  return (
    <header
      className="bg-[#0b0f19]/90 border-b border-[var(--color-accent)]/40 backdrop-blur-md px-3 md:px-4 py-2.5 text-[var(--color-text-primary)] sticky top-0 z-40"
      onMouseEnter={() => setIsOverUI(true)}
      onMouseLeave={() => setIsOverUI(false)}
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-3">
        {/* Brand & Orbit Telemetry */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <div
                role="status"
                aria-label={`Status: ${masterAlert}`}
                className={`w-3 h-3 rounded-full ${
                  masterAlert === 'NOMINAL'
                    ? 'bg-[var(--color-success)] shadow-[0_0_12px_var(--color-success)]'
                    : masterAlert === 'WARNING'
                    ? 'bg-[var(--color-warning)] shadow-[0_0_12px_var(--color-warning)]'
                    : 'bg-[var(--color-danger)] shadow-[0_0_16px_var(--color-danger)]'
                }`}
              />
              <span className={`ml-1.5 text-[10px] font-bold ${
                masterAlert === 'NOMINAL'
                  ? 'text-[var(--color-success)]'
                  : masterAlert === 'WARNING'
                  ? 'text-[var(--color-warning)]'
                  : 'text-[var(--color-danger)]'
              }`}>{masterAlert}</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                ASTRAEA-1 <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/50 text-[var(--color-accent)] font-mono">LEO SIM</span>
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] tracking-tight">
                SAT-ID: 2026-088A | NORAD: 58912
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-[var(--color-border-subtle)] hidden md:block" />

          {/* Mission Elapsed Time */}
          <div className="bg-[var(--color-bg-card)]/80 px-3 py-1 rounded border border-[var(--color-border-subtle)] flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">MET:</span>
            <TickerRef
              selector={(t) => {
                const totalSec = t.metSec;
                const hrs = Math.floor(totalSec / 3600);
                const mins = Math.floor((totalSec % 3600) / 60);
                const secs = totalSec % 60;
                return `T+${String(hrs).padStart(3, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
              }}
              className="text-xs text-[var(--color-accent)] font-bold font-mono"
              fallback="T+000:00:00"
            />
          </div>

          {/* Orbit Number */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[var(--color-text-primary)]/80 bg-[var(--color-bg-card)]/50 px-2.5 py-1 rounded border border-[var(--color-border-subtle)]">
            <span className="text-[var(--color-text-muted)]">Orbit:</span>
            <TickerRef
              selector={(t) => `#${t.orbit.orbitNumber}`}
              className="text-[var(--color-success)] font-semibold font-mono"
              fallback="#--"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[var(--color-bg-base)]/80 p-1 rounded-lg border border-[var(--color-border-subtle)]/80 w-full lg:w-auto overflow-x-auto [&::-webkit-scrollbar]:h-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                aria-label={`${item.label} tab`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-md text-xs tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/40 font-semibold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Controls: Speed, Audio, Fault Reset */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
          {/* Simulation Speed Switcher */}
          <div className="flex items-center bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded p-0.5">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                aria-label={`Set simulation speed to ${s}x`}
                aria-pressed={simSpeed === s}
                className={`px-2 py-1 text-xs rounded cursor-pointer transition-all active:scale-95 ${
                  simSpeed === s ? 'bg-[var(--color-accent)]/60 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleAudioMute}
            aria-label={isAudioMuted ? 'Unmute audio' : 'Mute audio'}
            title={isAudioMuted ? 'Click to unmute audio alerts' : 'Click to mute audio alerts'}
            className={`p-2 rounded border transition-colors cursor-pointer ${
              isAudioMuted
                ? 'bg-[var(--color-bg-card)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                : 'bg-[var(--color-accent)]/15 border-[var(--color-accent)]/50 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Clear Injected Faults */}
          <button
            onClick={handleClearFaults}
            aria-label="Reset telemetry fault overrides"
            title="Clear all injected faults and reset to nominal"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Faults</span>
          </button>
        </div>
      </div>
    </header>
  );
};
