export type SubsystemType = 'EPS' | 'ADCS' | 'COMMS' | 'THERMAL' | 'PROPULSION' | 'PAYLOAD';

export type SubsystemStatus = 'NOMINAL' | 'WARNING' | 'CRITICAL' | 'STANDBY';

export interface GroundStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevationM: number;
  minElevationDeg: number;
  inRange: boolean;
  distanceKm: number;
  elevationDeg: number;
  azimuthDeg: number;
  nextPassSec: number;
}

export interface SubsystemHealth {
  status: SubsystemStatus;
  temperatureC: number;
  voltageV: number;
  currentA: number;
  cpuLoadPct: number;
  message: string;
}

export interface OrbitTelemetry {
  semiMajorAxisKm: number;
  eccentricity: number;
  inclinationDeg: number;
  trueAnomalyDeg: number;
  altitudeKm: number;
  velocityKmS: number;
  lat: number;
  lon: number;
  orbitalPeriodMin: number;
  inEclipse: boolean;
  eclipseProgressPct: number;
  orbitNumber: number;
}

export interface EPSTelemetry {
  solarArrayPowerW: number;
  batterySoCPct: number;
  batteryVoltageV: number;
  busVoltageV: number;
  totalLoadW: number;
  batteryTempC: number;
  arrayStatus: 'TRACKING' | 'LOCKED' | 'STOWED';
}

export interface ADCSTelemetry {
  rollDeg: number;
  pitchDeg: number;
  yawDeg: number;
  rollRateDegS: number;
  pitchRateDegS: number;
  yawRateDegS: number;
  wheelRpm1: number;
  wheelRpm2: number;
  wheelRpm3: number;
  starTrackerLock: boolean;
  mode: 'FINE_POINTING' | 'SLEWING' | 'SAFE_MODE' | 'DETUMBLING';
}

export interface COMMSTelemetry {
  downlinkFrequencyMhz: number;
  uplinkFrequencyMhz: number;
  rssiDbm: number;
  snRdB: number;
  packetLossPct: number;
  dataRateKbps: number;
  activeGroundStation: string | null;
  transponderStatus: 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
}

export interface ThermalTelemetry {
  hullSunsideTempC: number;
  hullShadesideTempC: number;
  batteryTempC: number;
  payloadTempC: number;
  cpuTempC: number;
  heater1Active: boolean;
  heater2Active: boolean;
}

export interface PropulsionTelemetry {
  fuelTankPressurePsi: number;
  fuelMassKg: number;
  fuelPct: number;
  thrusterTempC: number;
  deltaVRemainingMS: number;
}

export interface PayloadTelemetry {
  cameraStatus: 'STANDBY' | 'CAPTURING' | 'PROCESSING' | 'CALIBRATING';
  dataBufferGb: number;
  maxBufferGb: number;
  imagesCaptured: number;
  sensorHealthPct: number;
}

export interface TelemetryFrame {
  timestamp: number;
  metSec: number;
  orbit: OrbitTelemetry;
  eps: EPSTelemetry;
  adcs: ADCSTelemetry;
  comms: COMMSTelemetry;
  thermal: ThermalTelemetry;
  propulsion: PropulsionTelemetry;
  payload: PayloadTelemetry;
  subsystems: Record<SubsystemType, SubsystemHealth>;
  groundStations: GroundStation[];
  masterAlertLevel: 'NOMINAL' | 'WARNING' | 'CRITICAL';
}

export interface MissionEvent {
  id?: number;
  timestamp: number;
  metSec: number;
  type: 'MILESTONE' | 'ANOMALY' | 'COMMAND' | 'PHASE_CHANGE' | 'SYSTEM';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  subsystem?: SubsystemType;
  title: string;
  description: string;
}

export interface TelemetryLogEntry {
  id?: number;
  timestamp: number;
  metSec: number;
  altitudeKm: number;
  velocityKmS: number;
  solarPowerW: number;
  batterySoCPct: number;
  rssiDbm: number;
  cpuTempC: number;
  hullTempC: number;
  inEclipse: boolean;
  alertLevel: 'NOMINAL' | 'WARNING' | 'CRITICAL';
}

export type CommandType =
  | 'REALIGN_SOLAR_PANELS'
  | 'EXECUTE_THRUSTER_BURST'
  | 'RESET_TRANSPONDER'
  | 'RUN_DIAGNOSTICS'
  | 'TOGGLE_HEATER'
  | 'TRIGGER_PAYLOAD_CAPTURE'
  | 'ENTER_SAFE_MODE'
  | 'INJECT_ANOMALY'
  | 'UNDO';

export interface CommandLog {
  id: string;
  timestamp: number;
  metSec: number;
  command: CommandType;
  status: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED';
  response?: string;
}

export type WorkerToMainMessage =
  | { type: 'TELEMETRY_UPDATE'; payload: TelemetryFrame }
  | { type: 'TELEMETRY_BATCH'; payload: TelemetryLogEntry[] }
  | { type: 'EVENT_LOGGED'; payload: MissionEvent }
  | { type: 'COMMAND_RESPONSE'; payload: CommandLog };

export type MainToWorkerMessage =
  | { type: 'START_SIMULATION' }
  | { type: 'PAUSE_SIMULATION' }
  | { type: 'SET_SIM_SPEED'; speed: number }
  | { type: 'EXECUTE_COMMAND'; command: CommandType; args?: Record<string, unknown> }
  | { type: 'INJECT_FAULT'; subsystem: SubsystemType; severity: 'WARNING' | 'CRITICAL' }
  | { type: 'CLEAR_FAULTS' }
  | { type: 'UNDO_LAST_COMMAND' };
