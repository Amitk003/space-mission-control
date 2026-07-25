import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, HelpCircle, Moon, Sun } from 'lucide-react';
import { Header } from './components/Header';
import { CommandConsole } from './components/modules/CommandConsole';
import { ResizableLayout } from './components/ResizableLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HelpModal } from './components/HelpModal';
import { useMissionStore } from './store/useMissionStore';

export default function App() {
  const initWorker = useMissionStore((state) => state.initWorker);
  const setActiveModule = useMissionStore((state) => state.setActiveModule);
  const setSimSpeed = useMissionStore((state) => state.setSimSpeed);
  const undoLastCommand = useMissionStore((state) => state.undoLastCommand);
  const toggleHighContrast = useMissionStore((state) => state.toggleHighContrast);
  const highContrast = useMissionStore((state) => state.highContrast);
  const commandLogs = useMissionStore((state) => state.commandLogs);

  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    initWorker();
  }, [initWorker]);

  const mods = useMemo(() => ({ '1': 'OVERVIEW', '2': 'TELEMETRY', '3': 'COMMS', '4': 'TIMELINE', '5': '3D_LAB' }), []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key >= '1' && e.key <= '5') {
      setActiveModule(mods[e.key] as any);
    }
    if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      setSimSpeed(useMissionStore.getState().simSpeed === 0 ? 1 : 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undoLastCommand();
    }
    if (e.key === '?' || (e.key === '/' && e.target === document.body)) {
      e.preventDefault();
      setHelpOpen((prev) => !prev);
    }
  }, [setActiveModule, setSimSpeed, mods, undoLastCommand]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleExport = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      commandLogs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astraea-mission-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [commandLogs]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col font-sans selection:bg-[var(--color-accent)] selection:text-black">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="flex-1 p-2 md:p-4 flex flex-col min-h-0 space-y-3">
        <ResizableLayout />
        <ErrorBoundary><CommandConsole /></ErrorBoundary>
      </main>

      <footer className="sticky bottom-0 bg-[#050811] border-t border-[var(--color-border-subtle)] px-3 md:px-4 py-2 text-xs text-[var(--color-text-muted)] flex flex-col sm:flex-row items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <span>Astraea-1 Mission Control Simulator</span>
          <button
            onClick={() => setHelpOpen(true)}
            aria-label="Open keyboard shortcuts help"
            title="Keyboard shortcuts (?)"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleHighContrast}
            aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
            title={highContrast ? 'High contrast mode enabled' : 'Enable high contrast mode'}
            className={`flex items-center gap-1 cursor-pointer ${
              highContrast ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {highContrast ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            <span>Contrast</span>
          </button>
          <button
            onClick={handleExport}
            aria-label="Export mission data as JSON"
            title="Download mission data as JSON file"
            className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
          <span>Worker: <strong className="text-[var(--color-success)] font-mono">Online</strong></span>
          <span>DB: <strong className="text-[var(--color-accent)] font-mono">Active</strong></span>
          <span>Audio: <strong className="text-[var(--color-warning)] font-mono">Synth</strong></span>
        </div>
      </footer>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
