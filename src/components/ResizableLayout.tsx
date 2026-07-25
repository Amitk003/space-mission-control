import React, { useCallback, useState } from 'react';
import { Sliders } from 'lucide-react';
import { SpacecraftCanvas } from './3d/SpacecraftCanvas';
import { CommsModule } from './modules/CommsModule';
import { OverviewModule } from './modules/OverviewModule';
import { TelemetryModule } from './modules/TelemetryModule';
import { TimelineModule } from './modules/TimelineModule';
import { ErrorBoundary } from './ErrorBoundary';
import { useMissionStore } from '../store/useMissionStore';

export const ResizableLayout: React.FC = () => {
  const { activeModule } = useMissionStore();
  const [splitRatio, setSplitRatio] = useState<number>(45);
  const [show3dInTab, setShow3dInTab] = useState<boolean>(true);

  const handleToggle3d = useCallback(() => setShow3dInTab((prev) => !prev), []);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3">
      <div className="flex items-center justify-between bg-[var(--color-bg-card)]/60 px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)] text-xs">
        <div className="flex items-center gap-2 text-[var(--color-text-primary)]/80">
          <Sliders className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <span>Display Layout</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle3d}
            className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer transition-colors ${
              show3dInTab
                ? 'bg-[var(--color-accent)]/15 border-[var(--color-accent)]/50 text-[var(--color-accent)] font-bold'
                : 'bg-[var(--color-bg-card)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]'
            }`}
          >
            {show3dInTab ? '3D Split: On' : '3D Split: Hidden'}
          </button>

          {show3dInTab && (
            <div className="hidden sm:flex items-center gap-1">
              {[30, 45, 60].map((r) => (
                <button
                  key={r}
                  onClick={() => setSplitRatio(r)}
                  className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                    splitRatio === r ? 'bg-[var(--color-accent)]/60 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {r}% 3D
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
        {(show3dInTab || activeModule === '3D_LAB') && (
          <div
            className={`w-full transition-all duration-300 flex flex-col min-h-[50vh] max-h-[70vh] lg:min-h-0 lg:max-h-none`}
            style={
              activeModule !== '3D_LAB' && show3dInTab
                ? { width: `${splitRatio}%` }
                : undefined
            }
          >
            <ErrorBoundary><SpacecraftCanvas /></ErrorBoundary>
          </div>
        )}

        {activeModule !== '3D_LAB' && (
          <div className="flex-1 min-w-0 overflow-y-auto space-y-4 pr-1">
            {activeModule === 'OVERVIEW' && <ErrorBoundary><OverviewModule /></ErrorBoundary>}
            {activeModule === 'TELEMETRY' && <ErrorBoundary><TelemetryModule /></ErrorBoundary>}
            {activeModule === 'COMMS' && <ErrorBoundary><CommsModule /></ErrorBoundary>}
            {activeModule === 'TIMELINE' && <ErrorBoundary><TimelineModule /></ErrorBoundary>}
          </div>
        )}
      </div>
    </div>
  );
};
