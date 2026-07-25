import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { CommandConsole } from './components/modules/CommandConsole';
import { ResizableLayout } from './components/ResizableLayout';
import { useMissionStore } from './store/useMissionStore';

export default function App() {
  const initWorker = useMissionStore((state) => state.initWorker);

  useEffect(() => {
    // Initialize Web Worker Telemetry Simulation Engine on app boot
    initWorker();
  }, [initWorker]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="flex-1 p-3 md:p-4 flex flex-col min-h-0 space-y-3">
        <ResizableLayout />
        <CommandConsole />
      </main>

      {/* Footer Credentials & Status Bar */}
      <footer className="bg-[#050811] border-t border-slate-900 px-4 py-2 text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1">
        <div>
          ASTRAEA-1 MISSION CONTROL SIMULATOR | BROWSER-NATIVE MULTITHREADED ARCHITECTURE
        </div>
        <div className="flex items-center gap-3">
          <span>WEB WORKER: <strong className="text-emerald-400">ONLINE (60Hz)</strong></span>
          <span>INDEXEDDB: <strong className="text-cyan-400">ACTIVE (DEXIE)</strong></span>
          <span>AUDIO ENGINE: <strong className="text-amber-400">SYNTHESIZED</strong></span>
        </div>
      </footer>
    </div>
  );
}
