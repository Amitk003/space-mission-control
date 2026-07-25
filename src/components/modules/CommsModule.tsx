import React, { useState } from 'react';
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

  return (
    <div className="space-y-4">
      {/* RF Downlink / Uplink Status Header Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">ACTIVE LINK</span>
            <span className="text-xs font-bold font-mono text-slate-200">
              {comms?.activeGroundStation || 'LOS RANGE SEARCHING'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">SIGNAL RSSI / SNR</span>
            <span className="text-xs font-bold font-mono text-cyan-300">
              {comms?.rssiDbm.toFixed(1) || '-110'} dBm / {comms?.snRdB.toFixed(1) || '0'} dB
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">PACKET LOSS RATE</span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {comms?.packetLossPct.toFixed(2) || '0.00'} %
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">DOWNLINK DATA RATE</span>
            <span className="text-xs font-bold font-mono text-amber-300">
              {comms?.dataRateKbps || 0} Kbps (S-Band)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Global Ground Stations Matrix */}
        <div className="lg:col-span-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-1.5">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            <span>GLOBAL DEEP SPACE GROUND STATION TRACKING MATRIX</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th scope="col" className="py-2 px-3">Station Name</th>
                  <th scope="col" className="py-2 px-3">Location</th>
                  <th scope="col" className="py-2 px-3">Distance</th>
                  <th scope="col" className="py-2 px-3">Elev / Azim</th>
                  <th scope="col" className="py-2 px-3">Pass Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {groundStations.map((gs) => (
                  <tr
                    key={gs.id}
                    className={`transition-colors ${
                      gs.inRange ? 'bg-emerald-950/30 font-semibold' : 'hover:bg-slate-900'
                    }`}
                  >
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          gs.inRange ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'
                        }`}
                      />
                      <span className="text-slate-200">{gs.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {gs.lat > 0 ? `${gs.lat}°N` : `${Math.abs(gs.lat)}°S`},{' '}
                      {gs.lon > 0 ? `${gs.lon}°E` : `${Math.abs(gs.lon)}°W`}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300">{gs.distanceKm.toLocaleString()} km</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {gs.elevationDeg}° / {gs.azimuthDeg}°
                    </td>
                    <td className="py-2.5 px-3">
                      {gs.inRange ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
                          ACTIVE LINK
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Next: in {gs.nextPassSec}s</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Interactive Manual Command Console */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>COMMAND TRANSMISSION CONSOLE</span>
          </h3>

          <div className="space-y-2">
            <label htmlFor="command-select" className="text-[10px] font-mono text-slate-400 block">SELECT COMMAND PROCEDURE:</label>
            <select
              id="command-select"
              value={selectedCmd}
              onChange={(e) => setSelectedCmd(e.target.value as CommandType)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {availableCommands.map((c) => (
                <option key={c.type} value={c.type}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 font-mono italic">
              {availableCommands.find((c) => c.type === selectedCmd)?.desc}
            </p>
          </div>

          <button
            onClick={() => executeCommand(selectedCmd)}
            className="w-full py-2 px-3 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>TRANSMIT COMMAND TO SATELLITE</span>
          </button>

          {/* Recent Commands Execution Audit */}
          <div className="space-y-2 pt-3 border-t border-slate-800" aria-live="polite" aria-atomic="true">
            <span className="text-[10px] font-mono text-slate-400 block">RECENT COMMAND AUDIT TRAIL:</span>
            <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
              {commandLogs.map((log) => (
                <div key={log.id} className="p-2 rounded bg-slate-950 border border-slate-800/80 space-y-0.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-bold text-cyan-300">{log.command}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400'
                          : log.status === 'EXECUTING'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-rose-950 text-rose-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  {log.response && <p className="text-slate-400 text-[10px]">{log.response}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
