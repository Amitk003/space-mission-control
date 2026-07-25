import React, { useState } from 'react';
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
  const [splitRatio, setSplitRatio] = useState<number>(45); // percentage for 3D View
  const [show3dInTab, setShow3dInTab] = useState<boolean>(true);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3">
      {/* Module Layout Bar with Split Ratio Controls */}
      <div className="flex items-center justify-between bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Display Layout:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShow3dInTab(!show3dInTab)}
            className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer transition-colors ${
              show3dInTab
                ? 'bg-cyan-950 border-cyan-800 text-cyan-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400'
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
                    splitRatio === r ? 'bg-cyan-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}% 3D
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Resizable Body Container */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
        {/* Left Side: 3D Spatial Canvas Viewport (if split enabled or active module is 3D_LAB) */}
        {(show3dInTab || activeModule === '3D_LAB') && (
          <div
            className={`w-full ${
              activeModule === '3D_LAB' ? 'lg:w-full' : 'lg:w-[45%]'
            } transition-all duration-300 flex flex-col min-h-[50vh] lg:min-h-0`}
            style={
              activeModule !== '3D_LAB' && show3dInTab
                ? { width: `${splitRatio}%` }
                : undefined
            }
          >
            <ErrorBoundary><SpacecraftCanvas /></ErrorBoundary>
          </div>
        )}

        {/* Right Side: Primary Active Dashboard Module */}
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
