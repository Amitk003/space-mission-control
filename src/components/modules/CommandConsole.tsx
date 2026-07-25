import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Terminal } from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';

export const CommandConsole: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const debounceRef = useRef<number>(0);
  const { commandLogs, executeCommand, clearFaults } = useMissionStore();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.trim().toLowerCase();
    if (!clean) return;

    const now = Date.now();
    if (now - debounceRef.current < 500) return;
    debounceRef.current = now;

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
    <div className="bg-[var(--color-bg-base)] p-3 rounded-xl border border-[var(--color-border-default)] space-y-2 text-xs">
      <div className="flex items-center justify-between text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)] pb-2">
        <div className="flex items-center gap-1.5 font-bold text-[var(--color-accent)]">
          <Terminal className="w-4 h-4" />
          <span>Astraea-1 Telemetry Bus Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">Baud: 115200 bps</span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand terminal' : 'Collapse terminal'}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="h-[120px] overflow-y-auto space-y-1 text-xs pr-1 font-mono" aria-live="polite" aria-atomic="false">
            <p className="text-[var(--color-text-muted)]">[SYSTEM] Operator Session Initialized. Socket ready.</p>
            {commandLogs.map((log) => (
              <p key={log.id} className="text-[var(--color-text-primary)]/80">
                <span className="text-[var(--color-accent)]">T+{log.metSec}s &gt;</span>{' '}
                <strong className="text-[var(--color-warning)]">{log.command}:</strong> {log.response || 'Executed'}
              </p>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
            <ChevronRight className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
            <label htmlFor="command-input" className="sr-only">Command input</label>
            <input
              id="command-input"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type command..."
              className="flex-1 bg-transparent text-[var(--color-accent)] placeholder-[var(--color-text-muted)] focus:outline-none text-xs min-w-0"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/50 text-[var(--color-accent)] text-xs font-bold hover:bg-[var(--color-accent)]/25 cursor-pointer shrink-0"
            >
              Execute
            </button>
          </form>
        </>
      )}
    </div>
  );
};
