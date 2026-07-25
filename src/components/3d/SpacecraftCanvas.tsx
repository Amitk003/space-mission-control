import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Globe, Maximize2, Minimize2, Rotate3d } from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import { EarthOrbitScene } from './EarthOrbitScene';
import { SpacecraftModel } from './SpacecraftModel';

export const SpacecraftCanvas: React.FC = () => {
  const {
    spatialViewMode,
    setSpatialViewMode,
    selectedComponent,
    setSelectedComponent,
    telemetry,
    setIsOverUI,
  } = useMissionStore();

  const inEclipse = telemetry?.orbit.inEclipse || false;

  return (
    <div
      className="relative w-full h-full min-h-[360px] bg-[#050811] rounded-xl border border-cyan-900/40 overflow-hidden flex flex-col group"
      onMouseEnter={() => setIsOverUI(true)}
      onMouseLeave={() => setIsOverUI(false)}
    >
      {/* Viewport Top Overlay HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800 backdrop-blur-md">
          <button
            onClick={() => setSpatialViewMode('SPACECRAFT')}
            aria-label="Switch to spacecraft CAD view"
            aria-pressed={spatialViewMode === 'SPACECRAFT'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              spatialViewMode === 'SPACECRAFT'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>SPACECRAFT CAD</span>
          </button>
          <button
            onClick={() => setSpatialViewMode('GLOBAL_ORBIT')}
            aria-label="Switch to global orbit view"
            aria-pressed={spatialViewMode === 'GLOBAL_ORBIT'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              spatialViewMode === 'GLOBAL_ORBIT'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>GLOBAL ORBIT</span>
          </button>
        </div>

        {/* Selected Component Indicator */}
        {selectedComponent && (
          <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/80 px-3 py-1 rounded text-xs font-mono text-cyan-300 backdrop-blur-md animate-fade-in">
            <span className="text-slate-400">FOCUS:</span>
            <span className="font-bold text-white">{selectedComponent.replace(/_/g, ' ')}</span>
            <button
              onClick={() => setSelectedComponent(null)}
              aria-label="Clear component selection"
              className="ml-1 text-slate-400 hover:text-white cursor-pointer"
            >
              X
            </button>
          </div>
        )}
      </div>

      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{
          position: spatialViewMode === 'SPACECRAFT' ? [0, 2, 7] : [0, 4, 10],
          fov: 45,
        }}
        gl={{ antialias: true }}
      >
        {/* Lights */}
        <ambientLight intensity={inEclipse ? 0.15 : 0.4} />
        <directionalLight
          position={inEclipse ? [-10, -5, -10] : [10, 10, 10]}
          intensity={inEclipse ? 0.2 : 2.2}
          color={inEclipse ? '#38bdf8' : '#ffffff'}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0284c7" />

        {/* Scene Objects */}
        {spatialViewMode === 'SPACECRAFT' ? <SpacecraftModel /> : <EarthOrbitScene />}

        {/* Orbit Controls for User Rotation & Zoom */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2.5}
          maxDistance={25}
        />
      </Canvas>

      {/* Viewport Bottom Status Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80 backdrop-blur-md pointer-events-none">
        <div className="flex items-center gap-3">
          <span>
            SUN VECTOR:{' '}
            <strong className={inEclipse ? 'text-amber-400' : 'text-emerald-400'}>
              {inEclipse ? 'ECLIPSE (UMBRA)' : 'DIRECT SUNLIGHT'}
            </strong>
          </span>
          <span className="hidden sm:inline">
            GYRO MODE:{' '}
            <strong className="text-cyan-300">{telemetry?.adcs.mode || 'FINE_POINTING'}</strong>
          </span>
        </div>
        <div>INTERACTIVE 3D VIEW | DRAG TO ROTATE</div>
      </div>
    </div>
  );
};
