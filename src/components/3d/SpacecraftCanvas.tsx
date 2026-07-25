import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Globe, Rotate3d } from 'lucide-react';
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
    simSpeed,
  } = useMissionStore();

  const inEclipse = telemetry?.orbit.inEclipse || false;

  return (
    <div
      className="relative w-full h-full min-h-[360px] bg-[#050811] rounded-xl border border-[var(--color-accent)]/40 overflow-hidden flex flex-col group"
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
          <div className="flex items-center gap-2 bg-[var(--color-bg-card)]/90 border border-[var(--color-accent)]/80 px-3 py-1 rounded text-xs text-[var(--color-accent)] backdrop-blur-md animate-fade-in">
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
      <Canvas
        camera={{
          position: spatialViewMode === 'SPACECRAFT' ? [0, 2, 7] : [0, 4, 10],
          fov: 45,
        }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={inEclipse ? 0.15 : 0.4} />
        <directionalLight
          position={inEclipse ? [-10, -5, -10] : [10, 10, 10]}
          intensity={inEclipse ? 0.2 : 2.2}
          color={inEclipse ? '#38bdf8' : '#ffffff'}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0284c7" />

        {spatialViewMode === 'SPACECRAFT' ? <SpacecraftModel /> : <EarthOrbitScene />}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2.5}
          maxDistance={25}
        />
      </Canvas>

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
