import React from 'react';
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

export const OverviewModule: React.FC = () => {
  const { telemetry, injectFault, clearFaults, executeCommand } = useMissionStore();

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
      {/* Key Metric Tickers Bar (Utilizing direct useRef bypass) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Altitude */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 tracking-wider">Orbit Altitude</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.orbit.altitudeKm.toFixed(2)}
              className="text-lg font-bold font-mono text-cyan-300"
              fallback="408.70"
            />
            <span className="text-xs text-slate-400">km</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">LEO Circular Orbit</span>
        </div>

        {/* Orbital Velocity */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 tracking-wider">Velocity</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.orbit.velocityKmS.toFixed(3)}
              className="text-lg font-bold font-mono text-cyan-300"
              fallback="7.670"
            />
            <span className="text-xs text-slate-400">km/s</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">27,612 km/h Ground</span>
        </div>

        {/* Solar Power */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 tracking-wider">Solar Array Bus</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.eps.solarArrayPowerW.toFixed(0)}
              className="text-lg font-bold font-mono text-amber-300"
              fallback="1440"
            />
            <span className="text-xs text-slate-400">W</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Dual GaAs Array Wings</span>
        </div>

        {/* Battery SoC */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 tracking-wider">Battery Charge</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.eps.batterySoCPct.toFixed(1)}
              className="text-lg font-bold font-mono text-emerald-400"
              fallback="94.5"
            />
            <span className="text-xs text-slate-400">%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{ width: `${telemetry?.eps.batterySoCPct || 90}%` }}
            />
          </div>
        </div>

        {/* Signal RSSI */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 tracking-wider">Downlink RSSI</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.comms.rssiDbm.toFixed(1)}
              className="text-lg font-bold font-mono text-cyan-300"
              fallback="-76.2"
            />
            <span className="text-xs text-slate-400">dBm</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            {telemetry?.comms.activeGroundStation || 'No Ground Link'}
          </span>
        </div>

        {/* Hull Temperature */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 tracking-wider">Hull Sunside Temp</span>
          <div className="flex items-baseline gap-1 mt-1">
            <TickerRef
              selector={(t) => t.thermal.hullSunsideTempC.toFixed(1)}
              className="text-lg font-bold font-mono text-rose-400"
              fallback="118.4"
            />
            <span className="text-xs text-slate-400">C</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">MLI Multi-Layer Shield</span>
        </div>
      </div>

      {/* Main Subsystem Health Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: 6 Subsystem Health Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Spacecraft Subsystem Health</span>
            </h2>
            <span className="text-xs text-slate-400">Real-Time Monitoring</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subList.map(({ key, name, icon: Icon }) => {
              const sub = subsystems ? subsystems[key] : null;
              const status = sub?.status || 'NOMINAL';

              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-xl border transition-all ${
                    status === 'NOMINAL'
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      : status === 'WARNING'
                      ? 'bg-amber-950/30 border-amber-800/80'
                      : 'bg-rose-950/40 border-rose-800/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-4 h-4 ${
                          status === 'NOMINAL'
                            ? 'text-cyan-400'
                            : status === 'WARNING'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-200">{name}</span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        status === 'NOMINAL'
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                          : status === 'WARNING'
                          ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                          : 'bg-rose-950/90 border-rose-800 text-rose-300'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2">
                    {sub?.message || 'Operational checks passed.'}
                  </p>

                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <div>
                      <span>TEMP:</span>{' '}
                      <strong className="text-slate-200">{sub ? `${sub.temperatureC}°C` : '--'}</strong>
                    </div>
                    <div>
                      <span>BUS:</span>{' '}
                      <strong className="text-slate-200">{sub ? `${sub.voltageV}V` : '--'}</strong>
                    </div>
                    <div>
                      <span>CPU:</span>{' '}
                      <strong className="text-slate-200">{sub ? `${sub.cpuLoadPct}%` : '--'}</strong>
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
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 tracking-wide flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Keplerian Orbital Parameters</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Semi-Major Axis (a):</span>
                <span className="text-slate-200 font-bold font-mono">{telemetry?.orbit.semiMajorAxisKm || 6778.14} km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Eccentricity (e):</span>
                <span className="text-slate-200 font-bold font-mono">{telemetry?.orbit.eccentricity || 0.00052}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Inclination (i):</span>
                <span className="text-slate-200 font-bold font-mono">{telemetry?.orbit.inclinationDeg || 51.6}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">True Anomaly (v):</span>
                <span className="text-cyan-300 font-bold font-mono">{telemetry?.orbit.trueAnomalyDeg || 142.8}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Orbital Period (T):</span>
                <span className="text-slate-200 font-bold font-mono">92.68 minutes</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Eclipse Status:</span>
                <span
                  className={`font-bold font-mono ${
                    telemetry?.orbit.inEclipse ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {telemetry?.orbit.inEclipse ? 'Eclipse Phase' : 'Full Sunlight'}
                </span>
              </div>
            </div>
          </div>

          {/* Fault Injection Simulation Bench */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 tracking-wide flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>Fault Injection Bench</span>
            </h3>

            <p className="text-xs text-slate-400">
              Test operator response by injecting subsystem faults.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => injectFault('EPS', 'WARNING')}
                aria-label="Inject electrical power system fault"
                className="px-2.5 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 text-amber-300 cursor-pointer transition-colors"
              >
                Inhibit Solar Bus
              </button>
              <button
                onClick={() => injectFault('THERMAL', 'WARNING')}
                aria-label="Inject thermal drift fault"
                className="px-2.5 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 cursor-pointer transition-colors"
              >
                Inject Thermal Drift
              </button>
              <button
                onClick={() => injectFault('COMMS', 'CRITICAL')}
                aria-label="Drop transponder communications fault"
                className="px-2.5 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 cursor-pointer transition-colors"
              >
                Drop Transponder
              </button>
              <button
                onClick={() => executeCommand('REALIGN_SOLAR_PANELS')}
                aria-label="Auto-align solar panels"
                className="px-2.5 py-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 cursor-pointer transition-colors"
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
