import React, { useState } from 'react';
import { ChevronRight, Terminal } from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';

export const CommandConsole: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  const { commandLogs, executeCommand, clearFaults } = useMissionStore();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.trim().toLowerCase();
    if (!clean) return;

    if (clean === 'help') {
      executeCommand('RUN_DIAGNOSTICS');
    } else if (clean.includes('diag')) {
      executeCommand('RUN_DIAGNOSTICS');
    } else if (clean.includes('panel') || clean.includes('solar')) {
      executeCommand('REALIGN_SOLAR_PANELS');
    } else if (clean.includes('thrust') || clean.includes('burn')) {
      executeCommand('EXECUTE_THRUSTER_BURST');
    } else if (clean.includes('radio') || clean.includes('comms')) {
      executeCommand('RESET_TRANSPONDER');
    } else if (clean.includes('safe')) {
      executeCommand('ENTER_SAFE_MODE');
    } else if (clean.includes('clear')) {
      clearFaults();
    } else {
      executeCommand('RUN_DIAGNOSTICS');
    }

    setInputVal('');
  };

  return (
    <div className="bg-[#050811] p-3 rounded-xl border border-cyan-900/40 space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
          <Terminal className="w-4 h-4" />
          <span>ASTRAEA-1 TELEMETRY BUS TERMINAL</span>
        </div>
        <span className="text-[10px]">BAUD RATE: 115200 bps</span>
      </div>

      <div className="h-[120px] overflow-y-auto space-y-1 text-[11px] pr-1" aria-live="polite" aria-atomic="false">
        <p className="text-slate-500">[SYSTEM] Operator Session Initialized. Socket ready.</p>
        {commandLogs.map((log) => (
          <p key={log.id} className="text-slate-300">
            <span className="text-cyan-400">T+{log.metSec}s &gt;</span>{' '}
            <strong className="text-amber-300">{log.command}:</strong> {log.response || 'Executed'}
          </p>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <ChevronRight className="w-4 h-4 text-cyan-400" />
        <label htmlFor="command-input" className="sr-only">Command input</label>
        <input
          id="command-input"
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type command..."
          className="flex-1 bg-transparent text-cyan-200 placeholder-slate-600 focus:outline-none text-xs"
        />
        <button
          type="submit"
          className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] font-bold hover:bg-cyan-900 cursor-pointer"
        >
          EXECUTE
        </button>
      </form>
    </div>
  );
};
