import React, { useCallback, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  BatteryCharging,
  Flame,
  Gauge,
  Radio,
  ShieldAlert,
  Sun,
  Zap,
} from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import type { SubsystemType } from '../../types/telemetry';
import { TickerRef } from '../TickerRef';
import { ToastContainer } from '../Toast';
import type { ToastMessage } from '../Toast';

export const OverviewModule: React.FC = () => {
  const { telemetry, injectFault, clearFaults, executeCommand } = useMissionStore();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleInjectFault = useCallback((subsystem: SubsystemType, severity: 'WARNING' | 'CRITICAL', label: string) => {
    if (!window.confirm(`Inject ${severity.toLowerCase()} fault in ${subsystem}? ${label}`)) return;
    injectFault(subsystem, severity);
    addToast('error', `${subsystem} fault injected (${severity})`);
  }, [injectFault, addToast]);

  const handleClearFaults = useCallback(() => {
    if (!window.confirm('Clear all injected faults?')) return;
    clearFaults();
    addToast('success', 'All faults cleared');
  }, [clearFaults, addToast]);

  const handleAutoAlign = useCallback(() => {
    executeCommand('REALIGN_SOLAR_PANELS');
    addToast('info', 'Solar panel auto-alignment initiated');
  }, [executeCommand, addToast]);

  const subsystems = telemetry?.subsystems;
  const masterAlert = telemetry?.masterAlertLevel || 'NOMINAL';

  const subList: { key: SubsystemType; name: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'EPS', name: 'Electrical Power (EPS)', icon: Zap },
    { key: 'ADCS', name: 'Attitude & Control (ADCS)', icon: Gauge },
    { key: 'COMMS', name: 'Communications (COMMS)', icon: Radio },
    { key: 'THERMAL', name: 'Thermal Control', icon: Flame },
    { key: 'PROPULSION', name: 'Monoprop Propulsion', icon: Activity },
    { key: 'PAYLOAD', name: 'Science Payload', icon: Sun },
  ];

  return (
    <div className="space-y-4">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Key Metric Tickers Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Altitude */}
        <div className="bg-[var(--color-bg-card)]/80 p-3.5 rounded-xl border border-[var(--color-border-subtle)] flex flex-col justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">Orbit Altitude</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.orbit.altitudeKm.toFixed(2)}
              className="text-lg font-bold font-mono text-[var(--color-accent)]"
              fallback="408.70"
            />
            <span className="text-xs text-[var(--color-text-muted)]">km</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] mt-1" title="Low Earth Orbit, approximately 408 km altitude">LEO Circular Orbit</span>
        </div>

        {/* Orbital Velocity */}
        <div className="bg-[var(--color-bg-card)]/80 p-3.5 rounded-xl border border-[var(--color-border-subtle)] flex flex-col justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">Velocity</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.orbit.velocityKmS.toFixed(3)}
              className="text-lg font-bold font-mono text-[var(--color-accent)]"
              fallback="7.670"
            />
            <span className="text-xs text-[var(--color-text-muted)]">km/s</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] mt-1" title="Ground speed in kilometers per hour">27,612 km/h Ground</span>
        </div>

        {/* Solar Power */}
        <div className="bg-[var(--color-bg-card)]/80 p-3.5 rounded-xl border border-[var(--color-border-subtle)] flex flex-col justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">Solar Array Bus</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.eps.solarArrayPowerW.toFixed(0)}
              className="text-lg font-bold font-mono text-[var(--color-warning)]"
              fallback="1440"
            />
            <span className="text-xs text-[var(--color-text-muted)]">W</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] mt-1" title="Dual Gallium Arsenide solar array wings">Dual GaAs Array Wings</span>
        </div>

        {/* Battery SoC */}
        <div className="bg-[var(--color-bg-card)]/80 p-3.5 rounded-xl border border-[var(--color-border-subtle)] flex flex-col justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">Battery Charge</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.eps.batterySoCPct.toFixed(1)}
              className="text-lg font-bold font-mono text-[var(--color-success)]"
              fallback="94.5"
            />
            <span className="text-xs text-[var(--color-text-muted)]">%</span>
          </div>
          <div className="w-full bg-[var(--color-border-subtle)] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-[var(--color-success)] h-full transition-all duration-300"
              style={{ width: `${telemetry?.eps.batterySoCPct || 90}%` }}
            />
          </div>
        </div>

        {/* Signal RSSI */}
        <div className="bg-[var(--color-bg-card)]/80 p-3.5 rounded-xl border border-[var(--color-border-subtle)] flex flex-col justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">Downlink RSSI</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.comms.rssiDbm.toFixed(1)}
              className="text-lg font-bold font-mono text-[var(--color-accent)]"
              fallback="-76.2"
            />
            <span className="text-xs text-[var(--color-text-muted)]">dBm</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] mt-1" title={telemetry?.comms.activeGroundStation || 'No ground station in range'}>
            {telemetry?.comms.activeGroundStation || 'No Ground Link'}
          </span>
        </div>

        {/* Hull Temperature */}
        <div className="bg-[var(--color-bg-card)]/80 p-3.5 rounded-xl border border-[var(--color-border-subtle)] flex flex-col justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">Hull Sunside Temp</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.thermal.hullSunsideTempC.toFixed(1)}
              className="text-lg font-bold font-mono text-[var(--color-danger)]"
              fallback="118.4"
            />
            <span className="text-xs text-[var(--color-text-muted)]">C</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] mt-1" title="Multi-Layer Insulation thermal shield">MLI Multi-Layer Shield</span>
        </div>
      </div>

      {/* Main Subsystem Health Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: 6 Subsystem Health Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Spacecraft Subsystem Health</span>
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">Real-Time Monitoring</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subList.map(({ key, name, icon: Icon }) => {
              const sub = subsystems ? subsystems[key] : null;
              const status = sub?.status || 'NOMINAL';

              return (
                <div
                  key={key}
                  className={`p-4 rounded-xl border transition-all ${
                    status === 'NOMINAL'
                      ? 'bg-[var(--color-bg-card)]/70 border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)]'
                      : status === 'WARNING'
                      ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/50'
                      : 'bg-[var(--color-danger)]/15 border-[var(--color-danger)]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-4 h-4 ${
                          status === 'NOMINAL'
                            ? 'text-[var(--color-accent)]'
                            : status === 'WARNING'
                            ? 'text-[var(--color-warning)]'
                            : 'text-[var(--color-danger)]'
                        }`}
                      />
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">{name}</span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        status === 'NOMINAL'
                          ? 'bg-[var(--color-success)]/20 border-[var(--color-success)]/60 text-[var(--color-success)]'
                          : status === 'WARNING'
                          ? 'bg-[var(--color-warning)]/20 border-[var(--color-warning)]/60 text-[var(--color-warning)]'
                          : 'bg-[var(--color-danger)]/25 border-[var(--color-danger)]/60 text-[var(--color-danger)]'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-text-primary)]/80 mb-2">
                    {sub?.message || 'Operational checks passed.'}
                  </p>

                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[var(--color-border-subtle)]/80 text-xs text-[var(--color-text-muted)]">
                    <div>
                      <span>TEMP:</span>{' '}
                      <strong className="text-[var(--color-text-primary)]">{sub ? `${sub.temperatureC}°C` : '--'}</strong>
                    </div>
                    <div>
                      <span>BUS:</span>{' '}
                      <strong className="text-[var(--color-text-primary)]">{sub ? `${sub.voltageV}V` : '--'}</strong>
                    </div>
                    <div>
                      <span>CPU:</span>{' '}
                      <strong className="text-[var(--color-text-primary)]">{sub ? `${sub.cpuLoadPct}%` : '--'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Orbital Mechanics & Fault Injection Bench */}
        <div className="space-y-4">
          {/* Orbital Mechanics Overview Card */}
          <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] space-y-3">
            <h3 className="text-xs font-bold text-[var(--color-accent)] flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Keplerian Orbital Parameters</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">Semi-Major Axis (a):</span>
                <span className="text-[var(--color-text-primary)] font-bold font-mono">{telemetry?.orbit.semiMajorAxisKm || 6778.14} km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">Eccentricity (e):</span>
                <span className="text-[var(--color-text-primary)] font-bold font-mono">{telemetry?.orbit.eccentricity || 0.00052}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">Inclination (i):</span>
                <span className="text-[var(--color-text-primary)] font-bold font-mono">{telemetry?.orbit.inclinationDeg || 51.6}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">True Anomaly (v):</span>
                <span className="text-[var(--color-accent)] font-bold font-mono">{telemetry?.orbit.trueAnomalyDeg || 142.8}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">Orbital Period (T):</span>
                <span className="text-[var(--color-text-primary)] font-bold font-mono">92.68 minutes</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--color-text-muted)]">Eclipse Status:</span>
                <span
                  className={`font-bold font-mono ${
                    telemetry?.orbit.inEclipse ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'
                  }`}
                >
                  {telemetry?.orbit.inEclipse ? 'Eclipse Phase' : 'Full Sunlight'}
                </span>
              </div>
            </div>
          </div>

          {/* Fault Injection Simulation Bench */}
          <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] space-y-3">
            <h3 className="text-xs font-bold text-[var(--color-warning)] flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-[var(--color-warning)]" />
              <span>Fault Injection Bench</span>
            </h3>

            <p className="text-xs text-[var(--color-text-muted)]">
              Test operator response by injecting subsystem faults.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleInjectFault('EPS', 'WARNING', 'Solar power output will be reduced.')}
                aria-label="Inject electrical power system fault"
                title="Reduces solar array power output to test EPS response"
                className="px-2.5 py-1.5 rounded bg-[var(--color-warning)]/15 hover:bg-[var(--color-warning)]/25 border border-[var(--color-warning)]/50 text-[var(--color-warning)] cursor-pointer transition-colors"
              >
                Inhibit Solar Bus
              </button>
              <button
                onClick={() => handleInjectFault('THERMAL', 'WARNING', 'Hull temperature will rise.')}
                aria-label="Inject thermal drift fault"
                title="Raises hull temperature to test thermal control"
                className="px-2.5 py-1.5 rounded bg-[var(--color-danger)]/15 hover:bg-[var(--color-danger)]/25 border border-[var(--color-danger)]/50 text-[var(--color-danger)] cursor-pointer transition-colors"
              >
                Inject Thermal Drift
              </button>
              <button
                onClick={() => handleInjectFault('COMMS', 'CRITICAL', 'Communications will be lost.')}
                aria-label="Drop transponder communications fault"
                title="Simulates complete communications loss"
                className="px-2.5 py-1.5 rounded bg-[var(--color-danger)]/15 hover:bg-[var(--color-danger)]/25 border border-[var(--color-danger)]/50 text-[var(--color-danger)] cursor-pointer transition-colors"
              >
                Drop Transponder
              </button>
              <button
                onClick={handleAutoAlign}
                aria-label="Auto-align solar panels"
                title="Automatically realign solar panels to optimal sun angle"
                className="px-2.5 py-1.5 rounded bg-[var(--color-accent)]/15 hover:bg-[var(--color-accent)]/25 border border-[var(--color-accent)]/50 text-[var(--color-accent)] cursor-pointer transition-colors"
              >
                Auto-Align Panels
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
