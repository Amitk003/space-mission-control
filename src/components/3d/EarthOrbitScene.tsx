import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../../store/useMissionStore';

export const EarthOrbitScene: React.FC = () => {
  const earthGroupRef = useRef<THREE.Group>(null);
  const satelliteMarkerRef = useRef<THREE.Group>(null);

  const { telemetry } = useMissionStore();

  const latDeg = telemetry?.orbit.lat || 0;
  const lonDeg = telemetry?.orbit.lon || 0;
  const groundStations = telemetry?.groundStations || [];

  // Slowly rotate Earth
  useFrame((_, delta) => {
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * 0.03;
    }

    // Position satellite marker on orbit sphere
    if (satelliteMarkerRef.current) {
      const radius = 3.6; // Earth radius (2.8) + altitude
      const phi = (90 - latDeg) * (Math.PI / 180);
      const theta = (lonDeg + 180) * (Math.PI / 180);

      satelliteMarkerRef.current.position.x = -(radius * Math.sin(phi) * Math.cos(theta));
      satelliteMarkerRef.current.position.y = radius * Math.cos(phi);
      satelliteMarkerRef.current.position.z = radius * Math.sin(phi) * Math.sin(theta);
    }
  });

  return (
    <group>
      {/* 3D Earth Globe */}
      <group ref={earthGroupRef}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2.8, 64, 64]} />
          <meshStandardMaterial
            color="#0f2b48"
            roughness={0.6}
            metalness={0.1}
            wireframe={false}
          />
        </mesh>

        {/* Atmosphere Halo Outer Glow */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2.92, 32, 32]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.12} side={THREE.BackSide} />
        </mesh>

        {/* Ground Station Pins on Earth Surface */}
        {groundStations.map((gs) => {
          const phi = (90 - gs.lat) * (Math.PI / 180);
          const theta = (gs.lon + 180) * (Math.PI / 180);
          const r = 2.82;

          const px = -(r * Math.sin(phi) * Math.cos(theta));
          const py = r * Math.cos(phi);
          const pz = r * Math.sin(phi) * Math.sin(theta);

          return (
            <group key={gs.id} position={[px, py, pz]}>
              <mesh>
                <sphereGeometry args={[0.06, 12, 12]} />
                <meshBasicMaterial color={gs.inRange ? '#10b981' : '#64748b'} />
              </mesh>
              {gs.inRange && (
                <Html distanceFactor={15} center>
                  <div className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500 text-[9px] font-mono text-emerald-300 font-bold whitespace-nowrap animate-pulse">
                    {gs.name.split(' ')[0]} (LINK)
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      {/* Orbit Trajectory Path Ring */}
      <mesh rotation={[0.9, 0.4, 0]}>
        <ringGeometry args={[3.58, 3.62, 128]} />
        <meshBasicMaterial color="#00f0ff" side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>

      {/* Orbiting Satellite 3D Marker */}
      <group ref={satelliteMarkerRef}>
        <mesh>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        <pointLight color="#00f0ff" intensity={3} distance={2} />

        {/* Satellite HUD Tag */}
        <Html distanceFactor={12} center position={[0, 0.4, 0]}>
          <div className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[10px] font-mono text-cyan-200 font-bold shadow-xl whitespace-nowrap">
            ASTRAEA-1 (ALT: {telemetry?.orbit.altitudeKm || 408} km)
          </div>
        </Html>
      </group>
    </group>
  );
};
