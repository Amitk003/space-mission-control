import React, { useCallback, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Globe2,
  Radio,
  Send,
  Terminal,
  Wifi,
  Zap,
} from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import type { CommandType } from '../../types/telemetry';

export const CommsModule: React.FC = () => {
  const { telemetry, executeCommand, commandLogs } = useMissionStore();
  const [selectedCmd, setSelectedCmd] = useState<CommandType>('RUN_DIAGNOSTICS');

  const comms = telemetry?.comms;
  const groundStations = telemetry?.groundStations || [];

  const availableCommands: { type: CommandType; label: string; desc: string }[] = [
    { type: 'RUN_DIAGNOSTICS', label: 'Full System Diagnostics Sweep', desc: 'Perform thorough self-test across all 48 diagnostic buses.' },
    { type: 'REALIGN_SOLAR_PANELS', label: 'Realign Solar Array Drive', desc: 'Lock drive motor onto optimal +Sun vector.' },
    { type: 'EXECUTE_THRUSTER_BURST', label: 'Execute RCS Thruster Pulse', desc: 'Consume 0.15kg monopropellant for trajectory correction.' },
    { type: 'RESET_TRANSPONDER', label: 'Cycle S-Band Transponder', desc: 'Reboot radio frequency power amplifier.' },
    { type: 'TOGGLE_HEATER', label: 'Toggle Subsystem Heaters', desc: 'Switch thermal heaters between Active and Standby.' },
    { type: 'TRIGGER_PAYLOAD_CAPTURE', label: 'Earth Observation Image Capture', desc: 'Acquire high-resolution multispectral image frame.' },
    { type: 'ENTER_SAFE_MODE', label: 'Place Spacecraft in Safe Mode', desc: 'Enter low-power sun-pointing emergency configuration.' },
  ];

  const handleTransmit = useCallback(() => {
    if (selectedCmd === 'ENTER_SAFE_MODE' && !window.confirm('Enter Safe Mode? Non-essential systems will power down.')) return;
    if (selectedCmd === 'EXECUTE_THRUSTER_BURST' && !window.confirm('Fire thrusters? This consumes propellant.')) return;
    executeCommand(selectedCmd);
  }, [selectedCmd, executeCommand]);

  return (
    <div className="space-y-4">
      {/* RF Downlink / Uplink Status Header Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/50 text-[var(--color-accent)]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-muted)] block">Active Link</span>
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              {comms?.activeGroundStation || 'Searching...'}
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/50 text-[var(--color-accent)]">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-muted)] block">Signal RSSI / SNR</span>
            <span className="text-xs font-bold font-mono text-[var(--color-accent)]">
              {comms?.rssiDbm.toFixed(1) || '-110'} dBm / {comms?.snRdB.toFixed(1) || '0'} dB
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/50 text-[var(--color-accent)]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-muted)] block">Packet Loss Rate</span>
            <span className="text-xs font-bold font-mono text-[var(--color-success)]">
              {comms?.packetLossPct.toFixed(2) || '0.00'} %
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/50 text-[var(--color-accent)]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-muted)] block">Downlink Data Rate</span>
            <span className="text-xs font-bold font-mono text-[var(--color-warning)]">
              {comms?.dataRateKbps || 0} Kbps (S-Band)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Global Ground Stations Matrix */}
        <div className="lg:col-span-2 bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] space-y-3">
          <h3 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Globe2 className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Ground Station Tracking</span>
          </h3>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-bg-base)] text-[var(--color-text-muted)] text-xs border-b border-[var(--color-border-subtle)]">
                <tr>
                  <th scope="col" className="py-2 px-3">Station Name</th>
                  <th scope="col" className="py-2 px-3">Location</th>
                  <th scope="col" className="py-2 px-3">Distance</th>
                  <th scope="col" className="py-2 px-3">Elevation / Azimuth</th>
                  <th scope="col" className="py-2 px-3">Pass Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]/80">
                {groundStations.map((gs) => (
                  <tr
                    key={gs.id}
                    className={`transition-colors ${
                      gs.inRange ? 'bg-[var(--color-success)]/10 font-semibold' : 'hover:bg-[var(--color-bg-card)]'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            gs.inRange ? 'bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]' : 'bg-[var(--color-border-default)]'
                          }`}
                        />
                        <span className="text-[var(--color-text-primary)]">{gs.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text-muted)]">
                      {gs.lat > 0 ? `${gs.lat}°N` : `${Math.abs(gs.lat)}°S`},{' '}
                      {gs.lon > 0 ? `${gs.lon}°E` : `${Math.abs(gs.lon)}°W`}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-accent)] font-mono" title="Distance from spacecraft to ground station">{gs.distanceKm.toLocaleString()} km</td>
                    <td className="py-2.5 px-3 text-[var(--color-text-primary)]/80">
                      {gs.elevationDeg}° / {gs.azimuthDeg}°
                    </td>
                    <td className="py-2.5 px-3">
                      {gs.inRange ? (
                        <span className="px-2 py-0.5 rounded bg-[var(--color-success)]/15 border border-[var(--color-success)]/50 text-[var(--color-success)] text-[10px] font-bold">
                          ACTIVE LINK
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)] text-[11px]">Next: in {gs.nextPassSec}s</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {groundStations.map((gs) => (
              <div
                key={gs.id}
                className={`p-3 rounded-lg border ${
                  gs.inRange
                    ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/40'
                    : 'bg-[var(--color-bg-base)] border-[var(--color-border-subtle)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${gs.inRange ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border-default)]'}`} />
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">{gs.name}</span>
                  </div>
                  {gs.inRange ? (
                    <span className="px-1.5 py-0.5 rounded bg-[var(--color-success)]/15 border border-[var(--color-success)]/50 text-[var(--color-success)] text-[10px] font-bold">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--color-text-muted)]">Next: {gs.nextPassSec}s</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-[var(--color-text-muted)]">
                  <span>{gs.lat > 0 ? `${gs.lat}°N` : `${Math.abs(gs.lat)}°S`}, {gs.lon > 0 ? `${gs.lon}°E` : `${Math.abs(gs.lon)}°W`}</span>
                  <span className="text-right font-mono text-[var(--color-accent)]" title="Distance from spacecraft">{gs.distanceKm.toLocaleString()} km</span>
                  <span>Elev: {gs.elevationDeg}° / Azim: {gs.azimuthDeg}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Manual Command Console */}
        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] space-y-4">
          <h3 className="text-xs font-bold text-[var(--color-accent)] flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Command Transmission Console</span>
          </h3>

          <div className="space-y-2">
            <label htmlFor="command-select" className="text-xs text-[var(--color-text-muted)] block">Select Command:</label>
            <select
              id="command-select"
              value={selectedCmd}
              onChange={(e) => setSelectedCmd(e.target.value as CommandType)}
              className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
            >
              {availableCommands.map((c) => (
                <option key={c.type} value={c.type}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--color-text-muted)] italic">
              {availableCommands.find((c) => c.type === selectedCmd)?.desc}
            </p>
          </div>

          <button
            onClick={handleTransmit}
            className="w-full py-2 px-3 rounded bg-[var(--color-accent)]/15 hover:bg-[var(--color-accent)]/25 border border-[var(--color-accent)]/60 text-[var(--color-accent)] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmit Command to Satellite</span>
          </button>

          {/* Recent Commands Execution Audit */}
          <div className="space-y-2 pt-3 border-t border-[var(--color-border-subtle)]" aria-live="polite" aria-atomic="true">
            <span className="text-xs text-[var(--color-text-muted)] block">Recent Command Log:</span>
            <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 text-xs">
              {commandLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/80 space-y-0.5">
                    <div className="flex items-center justify-between text-[var(--color-text-primary)]/80">
                      <span className="font-bold text-[var(--color-accent)]">{log.command}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                            : log.status === 'EXECUTING'
                            ? 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
                            : 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    {log.response && <p className="text-[var(--color-text-muted)] text-xs">{log.response}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
