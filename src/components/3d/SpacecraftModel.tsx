import { useRef, useMemo, useCallback, type MouseEvent } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../../store/useMissionStore';

/* ─── MLI Gold Foil Material ─── */
const useMLIMaterial = (selected: boolean) => {
  return useMemo(() => {
    if (selected) {
      return new THREE.MeshPhysicalMaterial({
        color: '#00f0ff',
        metalness: 0.9,
        roughness: 0.1,
        emissive: '#00f0ff',
        emissiveIntensity: 0.3,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: '#c9a84c',
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.2,
    });
  }, [selected]);
};

/* ─── Solar Panel Material ─── */
const useSolarMaterial = (selected: boolean, inEclipse: boolean) => {
  return useMemo(() => {
    if (selected) {
      return new THREE.MeshPhysicalMaterial({
        color: '#00f0ff',
        metalness: 0.9,
        roughness: 0.05,
        emissive: '#00f0ff',
        emissiveIntensity: 0.3,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: inEclipse ? '#0a1628' : '#1a3a5c',
      metalness: 0.95,
      roughness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05,
      envMapIntensity: 2.0,
    });
  }, [selected, inEclipse]);
};

/* ─── Main Spacecraft Component ─── */
export const SpacecraftModel = () => {
  const groupRef = useRef<THREE.Group>(null);
  const antennaRef = useRef<THREE.Group>(null);

  const { selectedComponent, setSelectedComponent, telemetry } = useMissionStore();

  const isEclipse = telemetry?.orbit.inEclipse || false;
  const isSlewing = telemetry?.adcs.mode === 'SLEWING';

  const mliMat = useMLIMaterial(selectedComponent === 'MAIN_BUS');
  const solarMat1 = useSolarMaterial(selectedComponent === 'SOLAR_ARRAY_1', isEclipse);
  const solarMat2 = useSolarMaterial(selectedComponent === 'SOLAR_ARRAY_2', isEclipse);

  // Rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (isSlewing ? 0.8 : 0.15);
    }
    if (antennaRef.current) {
      antennaRef.current.rotation.z = Math.sin(Date.now() * 0.001) * 0.08;
    }
  });

  const handleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    const component = (e.currentTarget as HTMLElement).dataset.component;
    if (component) setSelectedComponent(component);
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ═══════════════════════════════════════════════════════════
          MAIN BUS - Multi-layer insulated spacecraft body
         ═══════════════════════════════════════════════════════════ */}
      <group onClick={handleClick} data-component="MAIN_BUS">
        {/* Primary bus structure */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.6, 1.6, 2.0]} />
          <primitive object={mliMat} attach="material" />
        </mesh>

        {/* Structural reinforcement ribs */}
        {[[-0.81, 0, 0], [0.81, 0, 0], [0, -0.81, 0], [0, 0.81, 0]].map((pos, i) => (
          <mesh key={`rib-${i}`} position={pos as [number, number, number]}>
            <boxGeometry args={i < 2 ? [0.04, 1.64, 2.04] : [1.64, 0.04, 2.04]} />
            <meshStandardMaterial color="#8b7332" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* Corner edge highlights */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.62, 1.62, 2.02)]} />
          <lineBasicMaterial color="#00f0ff" transparent opacity={0.4} />
        </lineSegments>
      </group>

      {/* ═══════════════════════════════════════════════════════════
          SOLAR ARRAY WINGS - Dual deployable panels
         ═══════════════════════════════════════════════════════════ */}
      {/* Left Wing */}
      <group position={[-3.0, 0, 0]} onClick={handleClick} data-component="SOLAR_ARRAY_1">
        {/* Solar panel surface */}
        <mesh>
          <boxGeometry args={[3.8, 1.2, 0.04]} />
          <primitive object={solarMat1} attach="material" />
        </mesh>
        {/* Panel cell grid lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`cell-l-${i}`} position={[-1.5 + i * 0.42, 0, 0.021]}>
            <boxGeometry args={[0.01, 1.18, 0.002]} />
            <meshBasicMaterial color="#0d4f8a" transparent opacity={0.6} />
          </mesh>
        ))}
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={`cell-lh-${i}`} position={[0, -0.4 + i * 0.4, 0.021]}>
            <boxGeometry args={[3.78, 0.01, 0.002]} />
            <meshBasicMaterial color="#0d4f8a" transparent opacity={0.6} />
          </mesh>
        ))}
        {/* Deployable boom */}
        <mesh position={[2.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Hinge joint */}
        <mesh position={[1.7, 0, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
      </group>

      {/* Right Wing */}
      <group position={[3.0, 0, 0]} onClick={handleClick} data-component="SOLAR_ARRAY_2">
        <mesh>
          <boxGeometry args={[3.8, 1.2, 0.04]} />
          <primitive object={solarMat2} attach="material" />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`cell-r-${i}`} position={[-1.5 + i * 0.42, 0, 0.021]}>
            <boxGeometry args={[0.01, 1.18, 0.002]} />
            <meshBasicMaterial color="#0d4f8a" transparent opacity={0.6} />
          </mesh>
        ))}
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={`cell-rh-${i}`} position={[0, -0.4 + i * 0.4, 0.021]}>
            <boxGeometry args={[3.78, 0.01, 0.002]} />
            <meshBasicMaterial color="#0d4f8a" transparent opacity={0.6} />
          </mesh>
        ))}
        <mesh position={[-2.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[-1.7, 0, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════
          HIGH-GAIN PARABOLIC ANTENNA
         ═══════════════════════════════════════════════════════════ */}
      <group ref={antennaRef} position={[0, 1.2, 0]} onClick={handleClick} data-component="HIGH_GAIN_ANTENNA">
        {/* Dish reflector */}
        <mesh rotation={[-Math.PI / 3, 0, 0]}>
          <cylinderGeometry args={[1.0, 0.15, 0.25, 32]} />
          <meshPhysicalMaterial
            color={selectedComponent === 'HIGH_GAIN_ANTENNA' ? '#00f0ff' : '#e8e8e8'}
            metalness={0.6}
            roughness={0.25}
            clearcoat={0.5}
          />
        </mesh>
        {/* Feed horn support struts */}
        {[0, Math.PI * 0.66, Math.PI * 1.33].map((angle, i) => (
          <mesh
            key={`strut-${i}`}
            position={[
              Math.cos(angle) * 0.3,
              0.35,
              Math.sin(angle) * 0.3,
            ]}
            rotation={[0.3, angle, 0]}
          >
            <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
        ))}
        {/* Feed horn */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 0.15, 12]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* LNB receiver */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.6} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════
          RCS THRUSTER CLUSTERS (4x corners)
         ═══════════════════════════════════════════════════════════ */}
      {[
        [-0.8, -0.8, 1.05],
        [0.8, -0.8, 1.05],
        [-0.8, -0.8, -1.05],
        [0.8, -0.8, -1.05],
      ].map((pos, idx) => (
        <group key={`rcs-${idx}`} position={pos as [number, number, number]} onClick={handleClick} data-component="RCS_THRUSTERS">
          {/* Nozzle bell */}
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.08, 0.2, 12]} />
            <meshStandardMaterial
              color={selectedComponent === 'RCS_THRUSTERS' ? '#ff2a5f' : '#1e293b'}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Thruster housing */}
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.14, 0.08, 0.14]} />
            <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Mounting bracket */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.85} />
          </mesh>
        </group>
      ))}

      {/* ═══════════════════════════════════════════════════════════
          PAYLOAD OPTICS BAY - Earth observation camera
         ═══════════════════════════════════════════════════════════ */}
      <group position={[0, -1.0, 0]} onClick={handleClick} data-component="PAYLOAD_OPTICS">
        {/* Telescope barrel */}
        <mesh rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 0.7, 24]} />
          <meshPhysicalMaterial
            color={selectedComponent === 'PAYLOAD_OPTICS' ? '#00f0ff' : '#0f172a'}
            metalness={0.9}
            roughness={0.08}
            clearcoat={0.6}
          />
        </mesh>
        {/* Baffle / sun shade */}
        <mesh position={[0, -0.35, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.52, 0.5, 0.1, 24, 1, true]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* Lens glass */}
        <mesh position={[0, -0.41, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.38, 32]} />
          <meshPhysicalMaterial
            color="#00f0ff"
            emissive="#00f0ff"
            emissiveIntensity={0.4}
            transparent
            opacity={0.7}
            metalness={0.1}
            roughness={0.0}
            clearcoat={1.0}
          />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════
          STAR TRACKER ASSEMBLY
         ═══════════════════════════════════════════════════════════ */}
      <group position={[0, 0, -1.1]} onClick={handleClick} data-component="STAR_TRACKER">
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.35, 16]} />
          <meshPhysicalMaterial
            color={selectedComponent === 'STAR_TRACKER' ? '#00f0ff' : '#1e293b'}
            metalness={0.85}
            roughness={0.12}
          />
        </mesh>
        {/* Baffle tube */}
        <mesh position={[0, 0.25, -0.15]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.25, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════
          REACTION WHEEL COVERS (visible on +Y face)
         ═══════════════════════════════════════════════════════════ */}
      {[
        [0.3, 0.82, 0.3],
        [-0.3, 0.82, 0.3],
        [0.3, 0.82, -0.3],
      ].map((pos, i) => (
        <mesh key={`rw-${i}`} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.12, 0.12, 0.06, 16]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════════════════════════
          3D ANNOTATION LABELS
         ═══════════════════════════════════════════════════════════ */}
      <Html position={[-3.0, 0.8, 0]} center distanceFactor={12}>
        <button
          onClick={() => setSelectedComponent('SOLAR_ARRAY_1')}
          className="px-2 py-0.5 rounded bg-slate-900/90 border border-cyan-500/80 text-[10px] font-mono text-cyan-300 backdrop-blur-sm whitespace-nowrap shadow-lg hover:bg-cyan-950 cursor-pointer pointer-events-auto"
        >
          SOLAR WING (-X)
        </button>
      </Html>

      <Html position={[0, 1.8, 0]} center distanceFactor={12}>
        <button
          onClick={() => setSelectedComponent('HIGH_GAIN_ANTENNA')}
          className="px-2 py-0.5 rounded bg-slate-900/90 border border-cyan-500/80 text-[10px] font-mono text-cyan-300 backdrop-blur-sm whitespace-nowrap shadow-lg hover:bg-cyan-950 cursor-pointer pointer-events-auto"
        >
          HIGH-GAIN DISH
        </button>
      </Html>

      <Html position={[0, -1.5, 0]} center distanceFactor={12}>
        <button
          onClick={() => setSelectedComponent('PAYLOAD_OPTICS')}
          className="px-2 py-0.5 rounded bg-slate-900/90 border border-emerald-500/80 text-[10px] font-mono text-emerald-300 backdrop-blur-sm whitespace-nowrap shadow-lg hover:bg-emerald-950 cursor-pointer pointer-events-auto"
        >
          HYPERSPECTRAL CAM
        </button>
      </Html>

      <Html position={[0.9, -0.9, 1.3]} center distanceFactor={12}>
        <button
          onClick={() => setSelectedComponent('RCS_THRUSTERS')}
          className="px-2 py-0.5 rounded bg-slate-900/90 border border-rose-500/80 text-[10px] font-mono text-rose-300 backdrop-blur-sm whitespace-nowrap shadow-lg hover:bg-rose-950 cursor-pointer pointer-events-auto"
        >
          RCS THRUSTERS
        </button>
      </Html>
    </group>
  );
};
