import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { CommandConsole } from './components/modules/CommandConsole';
import { ResizableLayout } from './components/ResizableLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useMissionStore } from './store/useMissionStore';

export default function App() {
  const initWorker = useMissionStore((state) => state.initWorker);
  const setActiveModule = useMissionStore((state) => state.setActiveModule);
  const setSimSpeed = useMissionStore((state) => state.setSimSpeed);

  useEffect(() => {
    initWorker();
  }, [initWorker]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mods: Record<string, any> = { '1': 'OVERVIEW', '2': 'TELEMETRY', '3': 'COMMS', '4': 'TIMELINE', '5': '3D_LAB' };
      if (e.key >= '1' && e.key <= '5') {
        setActiveModule(mods[e.key] as any);
      }
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        setSimSpeed(useMissionStore.getState().simSpeed === 0 ? 1 : 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveModule, setSimSpeed]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="flex-1 p-3 md:p-4 flex flex-col min-h-0 space-y-3">
        <ResizableLayout />
        <ErrorBoundary><CommandConsole /></ErrorBoundary>
      </main>

      {/* Footer Credentials & Status Bar */}
      <footer className="bg-[#050811] border-t border-slate-900 px-4 py-2 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1">
        <div>
          Astraea-1 Mission Control Simulator
        </div>
        <div className="flex items-center gap-3">
          <span>Web Worker: <strong className="text-emerald-400 font-mono">Online (60Hz)</strong></span>
          <span>IndexedDB: <strong className="text-cyan-400 font-mono">Active</strong></span>
          <span>Audio: <strong className="text-amber-400 font-mono">Synthesized</strong></span>
        </div>
      </footer>
    </div>
  );
}
