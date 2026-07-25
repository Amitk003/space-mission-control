import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../../store/useMissionStore';

/* ─── Fresnel Atmosphere Shader ─── */
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = 1.0 - dot(viewDir, vNormal);
    fresnel = pow(fresnel, 3.0) * 1.4;
    vec3 atmosphereColor = mix(vec3(0.1, 0.4, 0.8), vec3(0.3, 0.7, 1.0), fresnel);
    gl_FragColor = vec4(atmosphereColor, fresnel * 0.6);
  }
`;

/* ─── Night Side Glow Shader ─── */
const nightVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nightFragmentShader = `
  uniform sampler2D nightTexture;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 worldNormal = normalize(vNormal);
    float sunDot = dot(worldNormal, sunDirection);
    float nightFactor = smoothstep(-0.1, -0.3, sunDot);
    vec4 nightColor = texture2D(nightTexture, vUv);
    gl_FragColor = vec4(nightColor.rgb * nightFactor * 2.0, nightFactor * nightColor.r);
  }
`;

/* ─── Cloud Layer ─── */
const CloudLayer: React.FC<{ texture: THREE.Texture }> = ({ texture }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.012;
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[2.84, 64, 64]} />
      <meshPhongMaterial
        map={texture}
        transparent
        opacity={0.35}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

/* ─── Main Earth Component ─── */
const TexturedEarth: React.FC = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const nightRef = useRef<THREE.Mesh>(null);

  const [dayMap, nightMap, bumpMap] = useTexture([
    '/textures/earth_daymap.jpg',
    '/textures/earth_nightmap.jpg',
    '/textures/earth_normal.jpg',
  ]);

  // Configure textures
  useMemo(() => {
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;
  }, [dayMap, nightMap]);

  // Night side shader uniforms
  const nightUniforms = useMemo(
    () => ({
      nightTexture: { value: nightMap },
      sunDirection: { value: new THREE.Vector3(1, 0.5, 0.8).normalize() },
    }),
    [nightMap]
  );

  // Slow Earth rotation
  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.02;
    }
    if (nightRef.current) {
      nightRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group>
      {/* Day Side - Main Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2.8, 64, 64]} />
        <meshPhongMaterial
          color="#1a4a7a"
          map={dayMap}
          bumpMap={bumpMap}
          bumpScale={0.05}
          specular={new THREE.Color(0x333333)}
          shininess={15}
        />
      </mesh>

      {/* Night Side - City Lights */}
      <mesh ref={nightRef}>
        <sphereGeometry args={[2.805, 64, 64]} />
        <shaderMaterial
          vertexShader={nightVertexShader}
          fragmentShader={nightFragmentShader}
          uniforms={nightUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

/* ─── Ground Station Marker ─── */
const GroundStationMarker: React.FC<{
  lat: number;
  lon: number;
  name: string;
  inRange: boolean;
}> = ({ lat, lon, name, inRange }) => {
  const radius = 2.82;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const px = -(radius * Math.sin(phi) * Math.cos(theta));
  const py = radius * Math.cos(phi);
  const pz = radius * Math.sin(phi) * Math.sin(theta);

  return (
    <group position={[px, py, pz]}>
      {/* Station Pin */}
      <mesh>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={inRange ? '#10b981' : '#475569'} />
      </mesh>

      {/* Pulse ring for active stations */}
      {inRange && (
        <mesh>
          <ringGeometry args={[0.06, 0.1, 16]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Label for in-range stations */}
      {inRange && (
        <Html distanceFactor={15} center>
          <div className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500 text-[9px] font-mono text-emerald-300 font-bold whitespace-nowrap shadow-lg pointer-events-none">
            {name.split(' ')[0]} (LINK)
          </div>
        </Html>
      )}
    </group>
  );
};

/* ─── Atmosphere Shell ─── */
const Atmosphere: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={ref} scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[2.8, 64, 64]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

/* ─── Main Scene ─── */
export const EarthOrbitScene: React.FC = () => {
  const satelliteMarkerRef = useRef<THREE.Group>(null);
  const orbitRingRef = useRef<THREE.Mesh>(null);

  const { telemetry } = useMissionStore();

  const latDeg = telemetry?.orbit.lat || 0;
  const lonDeg = telemetry?.orbit.lon || 0;
  const groundStations = telemetry?.groundStations || [];
  const altitudeKm = telemetry?.orbit.altitudeKm || 408;

  // Load cloud texture
  const cloudTexture = useTexture('/textures/earth_clouds.jpg');

  // Orbit radius scales with altitude (normalized)
  const orbitRadius = 2.8 + (altitudeKm / 408) * 0.8;

  // Position satellite marker on orbit
  useFrame(() => {
    if (satelliteMarkerRef.current) {
      const phi = (90 - latDeg) * (Math.PI / 180);
      const theta = (lonDeg + 180) * (Math.PI / 180);

      satelliteMarkerRef.current.position.x = -(orbitRadius * Math.sin(phi) * Math.cos(theta));
      satelliteMarkerRef.current.position.y = orbitRadius * Math.cos(phi);
      satelliteMarkerRef.current.position.z = orbitRadius * Math.sin(phi) * Math.sin(theta);
    }
  });

  // Orbit ring tilt matching inclination
  const inclinationRad = (51.6 * Math.PI) / 180;

  return (
    <group>
      {/* Starfield Background */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0.1}
        fade
        speed={0.5}
      />

      {/* Earth with textures */}
      <TexturedEarth />

      {/* Cloud Layer */}
      <CloudLayer texture={cloudTexture} />

      {/* Atmosphere Glow */}
      <Atmosphere />

      {/* Ground Station Markers */}
      {groundStations.map((gs) => (
        <GroundStationMarker
          key={gs.id}
          lat={gs.lat}
          lon={gs.lon}
          name={gs.name}
          inRange={gs.inRange}
        />
      ))}

      {/* Orbit Trajectory Ring */}
      <mesh
        ref={orbitRingRef}
        rotation={[Math.PI / 2 - inclinationRad, 0.4, 0]}
      >
        <ringGeometry args={[orbitRadius - 0.01, orbitRadius + 0.01, 128]} />
        <meshBasicMaterial
          color="#00f0ff"
          side={THREE.DoubleSide}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Orbiting Satellite Marker */}
      <group ref={satelliteMarkerRef}>
        {/* Satellite body */}
        <mesh>
          <octahedronGeometry args={[0.12, 0]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>

        {/* Solar panel wings */}
        <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.02, 0.3, 0.15]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.02, 0.3, 0.15]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>

        {/* Glow */}
        <pointLight color="#00f0ff" intensity={2} distance={1.5} />

        {/* HUD Tag */}
        <Html distanceFactor={12} center position={[0, 0.4, 0]}>
          <div className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[10px] font-mono text-cyan-200 font-bold shadow-xl whitespace-nowrap pointer-events-none">
            ASTRAEA-1 ({altitudeKm.toFixed(0)} km)
          </div>
        </Html>
      </group>

      {/* Sun indicator (distant directional light source visible) */}
      <mesh position={[30, 10, 20]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#fffde0" />
      </mesh>
      <pointLight position={[30, 10, 20]} intensity={1.5} color="#fffde0" />
    </group>
  );
};
