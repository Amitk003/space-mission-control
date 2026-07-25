import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
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

/* ─── Ocean/Continent Earth Shader ─── */
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const noiseFuncs = `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }
`;

const earthFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  uniform float inEclipse;

  ${noiseFuncs}

  void main() {
    vec2 uv = vUv * 8.0;
    float continent = fbm(uv + vec2(2.0, 1.0));
    float landMask = smoothstep(0.42, 0.52, continent);

    vec3 deepOcean = vec3(0.01, 0.05, 0.15);
    vec3 shallowOcean = vec3(0.02, 0.12, 0.25);
    vec3 ocean = mix(deepOcean, shallowOcean, fbm(uv * 2.0) * 0.5);

    vec3 forest = vec3(0.05, 0.18, 0.05);
    vec3 desert = vec3(0.25, 0.2, 0.1);
    vec3 mountain = vec3(0.15, 0.12, 0.08);
    float landType = fbm(uv * 3.0 + vec2(5.0, 3.0));
    vec3 land = mix(forest, mix(desert, mountain, landType), landType);

    float lat = abs(vUv.y - 0.5) * 2.0;
    float ice = smoothstep(0.75, 0.9, lat);
    vec3 iceColor = vec3(0.7, 0.75, 0.8);

    float eclipseFactor = 1.0 - inEclipse * 0.85;
    vec3 eclipseTint = mix(vec3(1.0), vec3(0.05, 0.08, 0.2), inEclipse * 0.7);

    vec3 baseColor = mix(ocean, land, landMask);
    baseColor = mix(baseColor, iceColor, ice);
    baseColor *= eclipseTint;

    vec3 lightDir = normalize(vec3(1.0, 0.5, 0.8));
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    float ambient = mix(0.15, 0.04, inEclipse);

    vec3 viewDir = normalize(-vPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = pow(max(dot(vNormal, halfDir), 0.0), 32.0) * (1.0 - landMask) * 0.4 * eclipseFactor;

    vec3 finalColor = baseColor * (ambient + diffuse * 0.85 * eclipseFactor) + vec3(specular);

    float edgeFade = 1.0 - abs(dot(viewDir, vNormal));
    finalColor = mix(finalColor, vec3(0.1, 0.3, 0.6), edgeFade * 0.2);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/* ─── Cloud Shader ─── */
const cloudVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cloudFragmentShader = `
  varying vec2 vUv;

  ${noiseFuncs}

  void main() {
    vec2 uv = vUv * 10.0;
    float clouds = fbm(uv + vec2(1.3, 7.5));
    float cloudMask = smoothstep(0.32, 0.58, clouds);
    float alpha = cloudMask * 0.45;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vec3(0.92, 0.94, 1.0), alpha);
  }
`;

/* ─── Procedural Earth ─── */
const ProceduralEarth = ({ inEclipse = false }: { inEclipse?: boolean }) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    inEclipse: { value: inEclipse ? 1.0 : 0.0 },
  }), [inEclipse]);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.02;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[2.8, 64, 64]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.83, 64, 64]} />
        <shaderMaterial
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

/* ─── Ground Station Marker ─── */
const GroundStationMarker = ({ lat, lon, name, inRange }: {
  lat: number;
  lon: number;
  name: string;
  inRange: boolean;
}) => {
  const radius = 2.82;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const px = -(radius * Math.sin(phi) * Math.cos(theta));
  const py = radius * Math.cos(phi);
  const pz = radius * Math.sin(phi) * Math.sin(theta);

  return (
    <group position={[px, py, pz]}>
      <mesh>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={inRange ? '#10b981' : '#475569'} />
      </mesh>
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
const Atmosphere = () => {
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
export const EarthOrbitScene = () => {
  const satelliteMarkerRef = useRef<THREE.Group>(null);

  const { telemetry } = useMissionStore();

  const latDeg = telemetry?.orbit.lat || 0;
  const lonDeg = telemetry?.orbit.lon || 0;
  const groundStations = telemetry?.groundStations || [];
  const altitudeKm = telemetry?.orbit.altitudeKm || 408;
  const inEclipse = telemetry?.orbit.inEclipse || false;

  const orbitRadius = 2.8 + (altitudeKm / 408) * 0.8;
  const inclinationRad = (51.6 * Math.PI) / 180;

  useFrame(() => {
    if (satelliteMarkerRef.current) {
      const phi = (90 - latDeg) * (Math.PI / 180);
      const theta = (lonDeg + 180) * (Math.PI / 180);
      satelliteMarkerRef.current.position.x = -(orbitRadius * Math.sin(phi) * Math.cos(theta));
      satelliteMarkerRef.current.position.y = orbitRadius * Math.cos(phi);
      satelliteMarkerRef.current.position.z = orbitRadius * Math.sin(phi) * Math.sin(theta);
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.1} fade speed={0.5} />

      <ProceduralEarth inEclipse={inEclipse} />

      <Atmosphere />

      {groundStations.map((gs) => (
        <GroundStationMarker key={gs.id} lat={gs.lat} lon={gs.lon} name={gs.name} inRange={gs.inRange} />
      ))}

      <mesh rotation={[Math.PI / 2 - inclinationRad, 0.4, 0]}>
        <ringGeometry args={[orbitRadius - 0.01, orbitRadius + 0.01, 128]} />
        <meshBasicMaterial color="#00f0ff" side={THREE.DoubleSide} transparent opacity={0.35} />
      </mesh>

      <group ref={satelliteMarkerRef}>
        <mesh>
          <octahedronGeometry args={[0.12, 0]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.02, 0.3, 0.15]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.02, 0.3, 0.15]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <pointLight color="#00f0ff" intensity={2} distance={1.5} />
        <Html distanceFactor={12} center position={[0, 0.4, 0]}>
          <div className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[10px] font-mono text-cyan-200 font-bold shadow-xl whitespace-nowrap pointer-events-none">
            ASTRAEA-1 ({altitudeKm.toFixed(0)} km)
          </div>
        </Html>
      </group>

      <mesh position={[30, 10, 20]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#fffde0" />
      </mesh>
      <pointLight position={[30, 10, 20]} intensity={1.5} color="#fffde0" />
    </group>
  );
};
