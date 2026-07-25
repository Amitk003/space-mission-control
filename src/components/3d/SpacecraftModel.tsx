import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../../store/useMissionStore';

export const SpacecraftModel: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const antennaRef = useRef<THREE.Group>(null);
  const solarWingsRef = useRef<THREE.Group>(null);

  const { selectedComponent, setSelectedComponent, telemetry } = useMissionStore();

  const isEclipse = telemetry?.orbit.inEclipse || false;
  const isSlewing = telemetry?.adcs.mode === 'SLEWING';

  // Slow continuous rotation or oscillation
  useFrame((_, delta) => {
    if (groupRef.current) {
      if (isSlewing) {
        groupRef.current.rotation.y += delta * 0.8;
      } else {
        groupRef.current.rotation.y += delta * 0.15;
      }
    }
    if (antennaRef.current) {
      antennaRef.current.rotation.z = Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Central Satellite Main Bus */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent('MAIN_BUS');
        }}
        position={[0, 0, 0]}
      >
        <boxGeometry args={[1.8, 1.8, 2.2]} />
        <meshStandardMaterial
          color={selectedComponent === 'MAIN_BUS' ? '#00f0ff' : '#d4af37'}
          metalness={0.8}
          roughness={0.2}
          wireframe={selectedComponent === 'MAIN_BUS'}
        />
      </mesh>

      {/* Main Bus Structural Framing Highlights */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.82, 1.82, 2.22)]} />
        <lineBasicMaterial color="#00f0ff" linewidth={1.5} />
      </lineSegments>

      {/* Solar Array Wings (+X and -X) */}
      <group ref={solarWingsRef}>
        {/* Left Solar Wing */}
        <group
          position={[-3.2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('SOLAR_ARRAY_1');
          }}
        >
          <mesh>
            <boxGeometry args={[4.2, 1.4, 0.08]} />
            <meshStandardMaterial
              color={selectedComponent === 'SOLAR_ARRAY_1' ? '#00f0ff' : isEclipse ? '#1e293b' : '#0284c7'}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Solar Array Mounting Boom */}
          <mesh position={[2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.8, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
        </group>

        {/* Right Solar Wing */}
        <group
          position={[3.2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('SOLAR_ARRAY_2');
          }}
        >
          <mesh>
            <boxGeometry args={[4.2, 1.4, 0.08]} />
            <meshStandardMaterial
              color={selectedComponent === 'SOLAR_ARRAY_2' ? '#00f0ff' : isEclipse ? '#1e293b' : '#0284c7'}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[-2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.8, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
        </group>
      </group>

      {/* High-Gain Parabolic Dish Antenna */}
      <group
        ref={antennaRef}
        position={[0, 1.4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent('HIGH_GAIN_ANTENNA');
        }}
      >
        <mesh rotation={[-Math.PI / 3, 0, 0]}>
          <cylinderGeometry args={[1.1, 0.2, 0.3, 24]} />
          <meshStandardMaterial
            color={selectedComponent === 'HIGH_GAIN_ANTENNA' ? '#00f0ff' : '#f8fafc'}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        {/* Antenna Feed Horn */}
        <mesh position={[0, 0.4, 0.3]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 12]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* RCS Thruster Pods (4 corners) */}
      {[
        [-0.9, -0.9, 1.1],
        [0.9, -0.9, 1.1],
        [-0.9, -0.9, -1.1],
        [0.9, -0.9, -1.1],
      ].map((pos, idx) => (
        <group
          key={idx}
          position={pos as [number, number, number]}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent('RCS_THRUSTERS');
          }}
        >
          <mesh>
            <coneGeometry args={[0.15, 0.35, 12]} />
            <meshStandardMaterial
              color={selectedComponent === 'RCS_THRUSTERS' ? '#ff2a5f' : '#475569'}
              metalness={0.8}
            />
          </mesh>
        </group>
      ))}

      {/* Payload Optics Bay (Earth Observation Camera) */}
      <group
        position={[0, -1.1, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent('PAYLOAD_OPTICS');
        }}
      >
        <mesh rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.55, 0.8, 24]} />
          <meshStandardMaterial
            color={selectedComponent === 'PAYLOAD_OPTICS' ? '#00f0ff' : '#0f172a'}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Lens Glass Glow */}
        <mesh position={[0, -0.41, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 24]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
      </group>

      {/* Star Tracker Assembly */}
      <group
        position={[0, 0, -1.2]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent('STAR_TRACKER');
        }}
      >
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.4, 16]} />
          <meshStandardMaterial color={selectedComponent === 'STAR_TRACKER' ? '#00f0ff' : '#334155'} />
        </mesh>
      </group>

      {/* 3D Spatial Hotspot Annotations / HTML Overlays */}
      <Html position={[-3.2, 0.9, 0]} center distanceFactor={12}>
        <button
          onClick={() => setSelectedComponent('SOLAR_ARRAY_1')}
          className="px-2 py-0.5 rounded bg-slate-900/90 border border-cyan-500/80 text-[10px] font-mono text-cyan-300 backdrop-blur-sm whitespace-nowrap shadow-lg hover:bg-cyan-950 cursor-pointer"
        >
          SOLAR WING (-X)
        </button>
      </Html>

      <Html position={[0, 1.9, 0]} center distanceFactor={12}>
        <button
          onClick={() => setSelectedComponent('HIGH_GAIN_ANTENNA')}
          className="px-2 py-0.5 rounded bg-slate-900/90 border border-cyan-500/80 text-[10px] font-mono text-cyan-300 backdrop-blur-sm whitespace-nowrap shadow-lg hover:bg-cyan-950 cursor-pointer"
        >
          HIGH-GAIN DISH
        </button>
      </Html>

      <Html position={[0, -1.6, 0]} center distanceFactor={12}>
        <button
          onClick={() => setSelectedComponent('PAYLOAD_OPTICS')}
          className="px-2 py-0.5 rounded bg-slate-900/90 border border-emerald-500/80 text-[10px] font-mono text-emerald-300 backdrop-blur-sm whitespace-nowrap shadow-lg hover:bg-emerald-950 cursor-pointer"
        >
          HYPERSPECTRAL CAM
        </button>
      </Html>
    </group>
  );
};
