import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Globe, Rotate3d } from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import { EarthOrbitScene } from './EarthOrbitScene';
import { SpacecraftModel } from './SpacecraftModel';

/* ─── Loading Fallback ─── */
const CanvasLoader: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono text-[var(--color-text-muted)]">Loading 3D scene...</span>
    </div>
  </div>
);

export const SpacecraftCanvas: React.FC = () => {
  const {
    spatialViewMode,
    setSpatialViewMode,
    selectedComponent,
    setSelectedComponent,
    telemetry,
    setIsOverUI,
    simSpeed,
  } = useMissionStore();

  const inEclipse = telemetry?.orbit.inEclipse || false;

  return (
    <div
      className="relative w-full h-full min-h-[360px] bg-[#020612] rounded-xl border border-[var(--color-accent)]/40 overflow-hidden flex flex-col group"
      onMouseEnter={() => setIsOverUI(true)}
      onMouseLeave={() => setIsOverUI(false)}
    >
      {/* Viewport Top Overlay HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-[var(--color-bg-base)]/80 p-1 rounded-lg border border-[var(--color-border-subtle)] backdrop-blur-md">
          <button
            onClick={() => setSpatialViewMode('SPACECRAFT')}
            aria-label="Switch to spacecraft CAD view"
            aria-pressed={spatialViewMode === 'SPACECRAFT'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
              spatialViewMode === 'SPACECRAFT'
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/50 font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>Spacecraft CAD</span>
          </button>
          <button
            onClick={() => setSpatialViewMode('GLOBAL_ORBIT')}
            aria-label="Switch to global orbit view"
            aria-pressed={spatialViewMode === 'GLOBAL_ORBIT'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
              spatialViewMode === 'GLOBAL_ORBIT'
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/50 font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Global Orbit</span>
          </button>
        </div>

        {/* Selected Component Indicator */}
        {selectedComponent && (
          <div className="flex items-center gap-2 bg-[var(--color-bg-card)]/90 border border-[var(--color-accent)]/80 px-3 py-1 rounded text-xs text-[var(--color-accent)] backdrop-blur-md">
            <span className="text-[var(--color-text-muted)]">FOCUS:</span>
            <span className="font-bold text-white">{selectedComponent.replace(/_/g, ' ')}</span>
            <button
              onClick={() => setSelectedComponent(null)}
              aria-label="Clear component selection"
              className="ml-1 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
            >
              X
            </button>
          </div>
        )}
      </div>

      {/* 3D WebGL Canvas */}
      <Suspense fallback={<CanvasLoader />}>
        <Canvas
          camera={{
            position: spatialViewMode === 'SPACECRAFT' ? [0, 2, 7] : [0, 4, 10],
            fov: 45,
          }}
          gl={{
            antialias: true,
            toneMapping: 3, // ACESFilmicToneMapping
            toneMappingExposure: 1.2,
          }}
        >
          {/* Space environment lighting - harsh single sun source */}
          <ambientLight intensity={inEclipse ? 0.05 : 0.15} />
          <directionalLight
            position={inEclipse ? [-10, -5, -10] : [8, 6, 10]}
            intensity={inEclipse ? 0.3 : 2.5}
            color={inEclipse ? '#4488cc' : '#ffffff'}

          />
          {/* Subtle fill from opposite side */}
          <directionalLight
            position={[-5, -3, -5]}
            intensity={0.08}
            color="#1e3a5f"
          />
          {/* Rim light for depth */}
          <pointLight position={[0, 8, -5]} intensity={0.4} color="#0ea5e9" distance={20} />

          {/* Scene content */}
          {spatialViewMode === 'SPACECRAFT' ? <SpacecraftModel /> : <EarthOrbitScene />}

          {/* Orbit controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2.0}
            maxDistance={30}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
      </Suspense>

      {/* Viewport Bottom Status Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-base)]/80 px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)]/80 backdrop-blur-md pointer-events-none">
        <div className="flex items-center gap-3">
          <span>
            Sun Vector:{' '}
            <strong className={`font-mono ${inEclipse ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
              {inEclipse ? 'Eclipse (Umbra)' : 'Direct Sunlight'}
            </strong>
          </span>
          <span className="hidden sm:inline">
            Gyro Mode:{' '}
            <strong className="text-[var(--color-accent)] font-mono">{telemetry?.adcs.mode || 'Fine Pointing'}</strong>
          </span>
          <span className="hidden sm:inline">
            Sim Speed:{' '}
            <strong className="text-[var(--color-warning)] font-mono">{simSpeed}x</strong>
          </span>
        </div>
        <div className="text-[var(--color-text-muted)]/70">Drag to rotate 3D view</div>
      </div>
    </div>
  );
};
