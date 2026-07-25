import type {
  CommandLog,
  CommandType,
  GroundStation,
  MainToWorkerMessage,
  MissionEvent,
  SubsystemType,
  TelemetryFrame,
  TelemetryLogEntry,
  WorkerToMainMessage,
} from '../types/telemetry';

// Earth Gravitational Parameter (km^3/s^2)
const MU = 398600.4418;
// Mean Earth Radius (km)
const EARTH_RADIUS_KM = 6371.0;

// Ground Station database
const INITIAL_GROUND_STATIONS: Omit<GroundStation, 'inRange' | 'distanceKm' | 'elevationDeg' | 'azimuthDeg' | 'nextPassSec'>[] = [
  { id: 'SVALBARD', name: 'Svalbard Satellite Station', lat: 78.23, lon: 15.39, elevationM: 500, minElevationDeg: 8 },
  { id: 'GOLDSTONE', name: 'Goldstone Deep Space Complex', lat: 35.42, lon: -116.88, elevationM: 1000, minElevationDeg: 10 },
  { id: 'MADRID', name: 'Madrid Deep Space Comms Facility', lat: 40.43, lon: -4.25, elevationM: 800, minElevationDeg: 10 },
  { id: 'CANBERRA', name: 'Canberra Deep Space Comms Complex', lat: -35.40, lon: 148.98, elevationM: 650, minElevationDeg: 10 },
  { id: 'WHITE_SANDS', name: 'White Sands Ground Terminal', lat: 32.38, lon: -106.47, elevationM: 1400, minElevationDeg: 5 },
  { id: 'HARTEBEESTHOEK', name: 'Hartebeesthoek Radio Astronomy Obs', lat: -25.88, lon: 27.70, elevationM: 1415, minElevationDeg: 10 },
];

class SpacecraftSimulator {
  private isRunning: boolean = false;
  private simSpeed: number = 1.0;
  private timerId: number | null = null;

  // Orbit State
  private metSec: number = 14400; // 4 hours elapsed initial
  private semiMajorAxisKm: number = 6778.14; // ~407.14 km altitude
  private eccentricity: number = 0.00052;
  private inclinationRad: number = (51.6 * Math.PI) / 180.0;
  private trueAnomalyRad: number = 0.5; // initial position
  private orbitNumber: number = 142;

  // Subsystem states
  private batterySoCPct: number = 94.5;
  private fuelMassKg: number = 42.8;
  private fuelTankPressurePsi: number = 320;
  private cameraBufferGb: number = 4.2;
  private imagesCaptured: number = 128;
  private heater1Active: boolean = false;
  private heater2Active: boolean = false;
  private arrayStatus: 'TRACKING' | 'LOCKED' | 'STOWED' = 'TRACKING';
  private adcsMode: 'FINE_POINTING' | 'SLEWING' | 'SAFE_MODE' | 'DETUMBLING' = 'FINE_POINTING';

  // Active injected faults
  private faults: Map<SubsystemType, 'WARNING' | 'CRITICAL'> = new Map();

  // Telemetry history buffer for batch indexing
  private historyBuffer: TelemetryLogEntry[] = [];
  private lastBatchTime: number = Date.now();

  // Undo history
  private undoStack: { command: string; snapshot: Record<string, unknown> }[] = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'START_SIMULATION':
          this.start();
          break;
        case 'PAUSE_SIMULATION':
          this.pause();
          break;
        case 'SET_SIM_SPEED':
          this.simSpeed = msg.speed;
          break;
        case 'EXECUTE_COMMAND':
          this.handleCommand(msg.command, msg.args);
          break;
        case 'UNDO_LAST_COMMAND':
          this.handleUndo();
          break;
        case 'INJECT_FAULT':
          this.faults.set(msg.subsystem, msg.severity);
          this.logEvent('ANOMALY', msg.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING', msg.subsystem,
            `Fault Injected in ${msg.subsystem}`, `Telemetry anomaly artificially induced on ${msg.subsystem} subsystem.`);
          break;
        case 'CLEAR_FAULTS':
          this.faults.clear();
          this.logEvent('SYSTEM', 'INFO', undefined, 'Subsystem Faults Cleared', 'All fault injection overrides have been cleared.');
          break;
      }
    };
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Simulation tick loop (~60Hz execution rate, step calculated by dt)
    let lastTime = performance.now();
    const tick = () => {
      if (!this.isRunning) return;
      const now = performance.now();
      const dtSec = Math.min((now - lastTime) / 1000.0, 0.1) * this.simSpeed;
      lastTime = now;

      this.step(dtSec);

      // Recursive timeout for precise execution
      this.timerId = self.setTimeout(tick, 16) as unknown as number;
    };

    tick();
  }

  public pause() {
    this.isRunning = false;
    if (this.timerId !== null) {
      self.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private saveSnapshot(cmd: string) {
    this.undoStack.push({
      command: cmd,
      snapshot: {
        fuelMassKg: this.fuelMassKg,
        fuelTankPressurePsi: this.fuelTankPressurePsi,
        arrayStatus: this.arrayStatus,
        adcsMode: this.adcsMode,
        heater1Active: this.heater1Active,
        heater2Active: this.heater2Active,
        cameraBufferGb: this.cameraBufferGb,
        imagesCaptured: this.imagesCaptured,
        faults: new Map(this.faults),
      },
    });
    if (this.undoStack.length > 10) this.undoStack.shift();
  }

  private handleUndo() {
    const entry = this.undoStack.pop();
    if (!entry) {
      this.postCommandResponse('UNDO', 'FAILED', 'Nothing to undo.');
      return;
    }
    const s = entry.snapshot;
    this.fuelMassKg = s.fuelMassKg as number;
    this.fuelTankPressurePsi = s.fuelTankPressurePsi as number;
    this.arrayStatus = s.arrayStatus as 'TRACKING' | 'LOCKED' | 'STOWED';
    this.adcsMode = s.adcsMode as 'FINE_POINTING' | 'SLEWING' | 'SAFE_MODE' | 'DETUMBLING';
    this.heater1Active = s.heater1Active as boolean;
    this.heater2Active = s.heater2Active as boolean;
    this.cameraBufferGb = s.cameraBufferGb as number;
    this.imagesCaptured = s.imagesCaptured as number;
    this.faults = new Map(s.faults as Map<SubsystemType, 'WARNING' | 'CRITICAL'>);
    this.postCommandResponse('UNDO', 'SUCCESS', `Undone: ${entry.command}`);
    this.logEvent('COMMAND', 'INFO', undefined, `Undo: ${entry.command}`, `Previous state restored for ${entry.command}.`);
  }

  private postCommandResponse(cmd: CommandType, status: 'SUCCESS' | 'FAILED' | 'EXECUTING', response: string) {
    const log: CommandLog = {
      id: `CMD-${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now(),
      metSec: Math.floor(this.metSec),
      command: cmd,
      status,
      response,
    };
    const msg: WorkerToMainMessage = { type: 'COMMAND_RESPONSE', payload: log };
    self.postMessage(msg);
  }

  private handleCommand(cmd: CommandType, _args?: Record<string, unknown>) {
    const log: CommandLog = {
      id: `CMD-${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now(),
      metSec: Math.floor(this.metSec),
      command: cmd,
      status: 'EXECUTING',
    };

    if (cmd !== 'RUN_DIAGNOSTICS') this.saveSnapshot(cmd);

    switch (cmd) {
      case 'REALIGN_SOLAR_PANELS':
        this.arrayStatus = 'TRACKING';
        this.faults.delete('EPS');
        log.status = 'SUCCESS';
        log.response = 'Solar Array Drive Mechanism locked onto primary vector (+X / +Sun). Output restored.';
        this.logEvent('COMMAND', 'INFO', 'EPS', 'Solar Array Realigned', 'Panels successfully tracking Sun vector.');
        break;

      case 'EXECUTE_THRUSTER_BURST':
        if (this.fuelMassKg > 0.5) {
          this.fuelMassKg -= 0.15;
          this.fuelTankPressurePsi -= 0.8;
          log.status = 'SUCCESS';
          log.response = '0.15 kg monopropellant consumed. Delta-V increment +0.85 m/s applied.';
          this.logEvent('COMMAND', 'INFO', 'PROPULSION', 'RCS Thruster Burst Complete', '0.15kg fuel spent for orbit adjustment.');
        } else {
          log.status = 'FAILED';
          log.response = 'Insufficient propellant mass for requested RCS burn.';
        }
        break;

      case 'RESET_TRANSPONDER':
        this.faults.delete('COMMS');
        log.status = 'SUCCESS';
        log.response = 'S-Band / X-Band Transponder power cycled. RF output power nominal at +43 dBm.';
        this.logEvent('COMMAND', 'INFO', 'COMMS', 'Transponder Reset', 'Radio frequency subsystem rebooted successfully.');
        break;

      case 'RUN_DIAGNOSTICS':
        log.status = 'SUCCESS';
        log.response = 'All 48 diagnostic buses report normal telemetry impedance. Zero hardware failures.';
        this.logEvent('COMMAND', 'INFO', undefined, 'Full Diagnostics Sweep', 'Routine self-test passed with 100% integrity score.');
        break;

      case 'TOGGLE_HEATER':
        this.heater1Active = !this.heater1Active;
        this.heater2Active = !this.heater2Active;
        log.status = 'SUCCESS';
        log.response = `Thermal Heaters switched to ${this.heater1Active ? 'ACTIVE' : 'STANDBY'} state.`;
        this.logEvent('COMMAND', 'INFO', 'THERMAL', 'Thermal Control Override', `Subsystem heaters ${this.heater1Active ? 'enabled' : 'disabled'}.`);
        break;

      case 'TRIGGER_PAYLOAD_CAPTURE':
        if (this.cameraBufferGb < 15.0) {
          this.cameraBufferGb += 0.85;
          this.imagesCaptured += 1;
          log.status = 'SUCCESS';
          log.response = 'High-resolution multispectral image acquired. 850 MB loaded into solid-state buffer.';
          this.logEvent('COMMAND', 'INFO', 'PAYLOAD', 'Earth Observation Capture', 'Image captured and buffered.');
        } else {
          log.status = 'FAILED';
          log.response = 'Data buffer at capacity. Initiate ground downlink to clear memory.';
        }
        break;

      case 'ENTER_SAFE_MODE':
        this.adcsMode = 'SAFE_MODE';
        this.logEvent('COMMAND', 'WARNING', 'ADCS', 'Safe Mode Entered', 'Spacecraft placed in low-power sun-pointing safe mode.');
        log.status = 'SUCCESS';
        log.response = 'Spacecraft switched to Sun-Pointed Safe Mode. Non-essential payloads turned off.';
        break;

      case 'INJECT_ANOMALY':
        this.faults.set('THERMAL', 'WARNING');
        this.logEvent('ANOMALY', 'WARNING', 'THERMAL', 'Thermal Drift Detected', 'Simulated heat leak injected into main bus.');
        log.status = 'SUCCESS';
        log.response = 'Thermal anomaly injected for testing procedure.';
        break;
    }

    const responseMsg: WorkerToMainMessage = {
      type: 'COMMAND_RESPONSE',
      payload: log,
    };
    self.postMessage(responseMsg);
  }

  private step(dtSec: number) {
    this.metSec += dtSec;

    // Keplerian Mean Motion n = sqrt(MU / a^3)
    const n = Math.sqrt(MU / Math.pow(this.semiMajorAxisKm, 3));
    this.trueAnomalyRad += n * dtSec;

    if (this.trueAnomalyRad >= 2 * Math.PI) {
      this.trueAnomalyRad -= 2 * Math.PI;
      this.orbitNumber += 1;
      this.logEvent('MILESTONE', 'INFO', undefined, `Orbit #${this.orbitNumber} Completed`, `Spacecraft completed orbit revolution #${this.orbitNumber}.`);
    }

    // Radial distance r = a(1 - e^2) / (1 + e*cos(nu))
    const rKm = (this.semiMajorAxisKm * (1 - this.eccentricity * this.eccentricity)) / (1 + this.eccentricity * Math.cos(this.trueAnomalyRad));
    const altitudeKm = rKm - EARTH_RADIUS_KM;

    // Orbital speed v = sqrt(MU * (2/r - 1/a))
    const velocityKmS = Math.sqrt(MU * (2 / rKm - 1 / this.semiMajorAxisKm));

    // Latitude & Longitude ground track
    // Lat = asin(sin(i) * sin(nu))
    const latRad = Math.asin(Math.sin(this.inclinationRad) * Math.sin(this.trueAnomalyRad));
    const latDeg = (latRad * 180) / Math.PI;

    // Longitude incorporates Earth rotation (~0.00417 deg/sec)
    const earthRotationRad = 0.00007292115 * this.metSec;
    const lonRad = Math.atan2(Math.cos(this.inclinationRad) * Math.sin(this.trueAnomalyRad), Math.cos(this.trueAnomalyRad)) - earthRotationRad;
    let lonDeg = ((lonRad * 180) / Math.PI) % 360;
    if (lonDeg > 180) lonDeg -= 360;
    if (lonDeg < -180) lonDeg += 360;

    // Eclipse Calculation: When behind Earth relative to Sun vector
    const eclipseCondition = Math.sin(this.trueAnomalyRad) < -0.15;
    const inEclipse = eclipseCondition;
    const eclipseProgressPct = inEclipse ? Math.min(100, Math.max(0, ((Math.sin(this.trueAnomalyRad) + 0.15) / -0.85) * 100)) : 0;

    // Thermal Simulation
    let sunsideTempC = inEclipse ? -85 + Math.sin(this.metSec * 0.02) * 12 : 118 + Math.cos(this.metSec * 0.01) * 8;
    let shadesideTempC = inEclipse ? -108 + Math.sin(this.metSec * 0.03) * 6 : -45 + Math.sin(this.metSec * 0.01) * 10;

    if (this.faults.get('THERMAL') === 'WARNING') sunsideTempC += 28.5;
    if (this.faults.get('THERMAL') === 'CRITICAL') sunsideTempC += 58.0;

    // EPS Simulation
    let solarPowerW = 0;
    if (!inEclipse && this.arrayStatus === 'TRACKING') {
      solarPowerW = 1440 + Math.sin(this.metSec * 0.05) * 35;
    } else if (!inEclipse && this.arrayStatus === 'LOCKED') {
      solarPowerW = 980;
    }

    if (this.faults.get('EPS') === 'WARNING') solarPowerW *= 0.6;
    if (this.faults.get('EPS') === 'CRITICAL') solarPowerW *= 0.1;

    // Battery charge/discharge dynamics
    const totalLoadW = 420 + (this.heater1Active ? 150 : 0) + (this.heater2Active ? 150 : 0) + (this.cameraBufferGb > 10 ? 80 : 0);
    const netPowerW = solarPowerW - totalLoadW;

    if (netPowerW > 0) {
      this.batterySoCPct = Math.min(100.0, this.batterySoCPct + (netPowerW / 3600.0) * dtSec * 0.08);
    } else {
      this.batterySoCPct = Math.max(15.0, this.batterySoCPct + (netPowerW / 3600.0) * dtSec * 0.12);
    }

    // ADCS Simulation
    const noise = Math.sin(this.metSec * 1.5) * 0.08;
    const rollDeg = (this.adcsMode === 'SLEWING' ? 12.4 : 0.15) + noise;
    const pitchDeg = (this.adcsMode === 'SLEWING' ? -8.2 : -0.08) + noise;
    const yawDeg = 0.05 + noise;

    // COMMS & Ground Station Tracking
    const groundStations: GroundStation[] = INITIAL_GROUND_STATIONS.map((gs) => {
      // Haversine distance on Earth surface
      const dLat = ((latDeg - gs.lat) * Math.PI) / 180;
      const dLon = ((lonDeg - gs.lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((gs.lat * Math.PI) / 180) * Math.cos((latDeg * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = EARTH_RADIUS_KM * c;

      // Approximate elevation angle
      const elevDeg = Math.max(0, 90 - (distKm / (EARTH_RADIUS_KM + altitudeKm)) * (180 / Math.PI) * 1.5);
      const inRange = elevDeg >= gs.minElevationDeg;

      // Estimate time to next pass
      const nextPassSec = inRange ? 0 : Math.floor(Math.abs(distKm * 2.5) % 3600);

      return {
        ...gs,
        inRange,
        distanceKm: Math.round(distKm),
        elevationDeg: Number(elevDeg.toFixed(1)),
        azimuthDeg: Math.round((Math.atan2(dLon, dLat) * 180) / Math.PI + 180),
        nextPassSec,
      };
    });

    const activeGs = groundStations.find((gs) => gs.inRange) || null;
    let rssiDbm = -110;
    let snRdB = 2.0;

    if (activeGs) {
      rssiDbm = -72 - (activeGs.distanceKm / 2000) * 12 + activeGs.elevationDeg * 0.25;
      snRdB = Math.max(4.0, 24.0 - (activeGs.distanceKm / 1500) * 6);
    }

    if (this.faults.get('COMMS') === 'CRITICAL') {
      rssiDbm = -125;
      snRdB = 0.5;
    }

    // Aggregate Subsystem Health Statuses
    const subsystems: Record<SubsystemType, { status: 'NOMINAL' | 'WARNING' | 'CRITICAL' | 'STANDBY'; temperatureC: number; voltageV: number; currentA: number; cpuLoadPct: number; message: string }> = {
      EPS: {
        status: this.faults.get('EPS') || (this.batterySoCPct < 25 ? 'CRITICAL' : this.batterySoCPct < 45 ? 'WARNING' : 'NOMINAL'),
        temperatureC: Number((32.5 + (100 - this.batterySoCPct) * 0.1).toFixed(1)),
        voltageV: Number((27.8 + (this.batterySoCPct / 100) * 0.8).toFixed(1)),
        currentA: Number((totalLoadW / 28.2).toFixed(1)),
        cpuLoadPct: 18,
        message: this.batterySoCPct < 25 ? 'Low Battery Critical State' : 'Power Generation & Bus Nominal',
      },
      ADCS: {
        status: this.faults.get('ADCS') || (this.adcsMode === 'SAFE_MODE' ? 'WARNING' : 'NOMINAL'),
        temperatureC: 28.4,
        voltageV: 28.0,
        currentA: 2.4,
        cpuLoadPct: 34,
        message: `Mode: ${this.adcsMode}. Star Tracker locked.`,
      },
      COMMS: {
        status: this.faults.get('COMMS') || (activeGs ? 'NOMINAL' : 'STANDBY'),
        temperatureC: 36.2,
        voltageV: 28.1,
        currentA: 3.8,
        cpuLoadPct: 28,
        message: activeGs ? `Linked: ${activeGs.name} (${rssiDbm.toFixed(0)} dBm)` : 'Out of Ground Station LOS Range',
      },
      THERMAL: {
        status: this.faults.get('THERMAL') || (sunsideTempC > 140 ? 'CRITICAL' : sunsideTempC > 130 ? 'WARNING' : 'NOMINAL'),
        temperatureC: Number(sunsideTempC.toFixed(1)),
        voltageV: 28.0,
        currentA: this.heater1Active ? 5.2 : 0.8,
        cpuLoadPct: 12,
        message: sunsideTempC > 130 ? 'High Thermal Gradient Warning' : 'Active Thermal Control Nominal',
      },
      PROPULSION: {
        status: this.faults.get('PROPULSION') || (this.fuelMassKg < 5.0 ? 'WARNING' : 'NOMINAL'),
        temperatureC: 22.1,
        voltageV: 28.0,
        currentA: 0.4,
        cpuLoadPct: 8,
        message: `${this.fuelMassKg.toFixed(1)} kg Monopropellant remaining`,
      },
      PAYLOAD: {
        status: this.faults.get('PAYLOAD') || (this.cameraBufferGb > 14.0 ? 'WARNING' : 'NOMINAL'),
        temperatureC: 19.8,
        voltageV: 28.2,
        currentA: 1.8,
        cpuLoadPct: 42,
        message: `${this.cameraBufferGb.toFixed(1)} GB / 15.0 GB Solid State Buffer`,
      },
    };

    // Calculate Master Alert Level
    let masterAlertLevel: 'NOMINAL' | 'WARNING' | 'CRITICAL' = 'NOMINAL';
    for (const sub of Object.values(subsystems)) {
      if (sub.status === 'CRITICAL') {
        masterAlertLevel = 'CRITICAL';
        break;
      }
      if (sub.status === 'WARNING') {
        masterAlertLevel = 'WARNING';
      }
    }

    // Construct full Telemetry Frame
    const frame: TelemetryFrame = {
      timestamp: Date.now(),
      metSec: Math.floor(this.metSec),
      orbit: {
        semiMajorAxisKm: Number(this.semiMajorAxisKm.toFixed(2)),
        eccentricity: Number(this.eccentricity.toFixed(5)),
        inclinationDeg: 51.6,
        trueAnomalyDeg: Number(((this.trueAnomalyRad * 180) / Math.PI).toFixed(2)),
        altitudeKm: Number(altitudeKm.toFixed(2)),
        velocityKmS: Number(velocityKmS.toFixed(3)),
        lat: Number(latDeg.toFixed(4)),
        lon: Number(lonDeg.toFixed(4)),
        orbitalPeriodMin: 92.68,
        inEclipse,
        eclipseProgressPct: Number(eclipseProgressPct.toFixed(1)),
        orbitNumber: this.orbitNumber,
      },
      eps: {
        solarArrayPowerW: Number(solarPowerW.toFixed(1)),
        batterySoCPct: Number(this.batterySoCPct.toFixed(1)),
        batteryVoltageV: Number((27.8 + (this.batterySoCPct / 100) * 0.8).toFixed(2)),
        busVoltageV: 28.2,
        totalLoadW: Number(totalLoadW.toFixed(1)),
        batteryTempC: Number((22.0 + (100 - this.batterySoCPct) * 0.08).toFixed(1)),
        arrayStatus: this.arrayStatus,
      },
      adcs: {
        rollDeg: Number(rollDeg.toFixed(3)),
        pitchDeg: Number(pitchDeg.toFixed(3)),
        yawDeg: Number(yawDeg.toFixed(3)),
        rollRateDegS: Number((noise * 0.1).toFixed(3)),
        pitchRateDegS: Number((noise * 0.1).toFixed(3)),
        yawRateDegS: Number((noise * 0.1).toFixed(3)),
        wheelRpm1: 1850 + Math.round(noise * 120),
        wheelRpm2: 1820 - Math.round(noise * 120),
        wheelRpm3: 1890 + Math.round(noise * 80),
        starTrackerLock: true,
        mode: this.adcsMode,
      },
      comms: {
        downlinkFrequencyMhz: 2245.0,
        uplinkFrequencyMhz: 2065.0,
        rssiDbm: Number(rssiDbm.toFixed(1)),
        snRdB: Number(snRdB.toFixed(1)),
        packetLossPct: activeGs ? Number(Math.max(0, 0.2 + (15 - snRdB) * 0.08).toFixed(2)) : 100,
        dataRateKbps: activeGs ? 2048 : 0,
        activeGroundStation: activeGs ? activeGs.name : null,
        transponderStatus: this.faults.get('COMMS') ? 'DEGRADED' : 'ACTIVE',
      },
      thermal: {
        hullSunsideTempC: Number(sunsideTempC.toFixed(1)),
        hullShadesideTempC: Number(shadesideTempC.toFixed(1)),
        batteryTempC: 22.4,
        payloadTempC: 19.8,
        cpuTempC: Number((38.5 + (totalLoadW / 500) * 8).toFixed(1)),
        heater1Active: this.heater1Active,
        heater2Active: this.heater2Active,
      },
      propulsion: {
        fuelTankPressurePsi: Number(this.fuelTankPressurePsi.toFixed(1)),
        fuelMassKg: Number(this.fuelMassKg.toFixed(2)),
        fuelPct: Number(((this.fuelMassKg / 50.0) * 100).toFixed(1)),
        thrusterTempC: 18.2,
        deltaVRemainingMS: Number((this.fuelMassKg * 42.5).toFixed(1)),
      },
      payload: {
        cameraStatus: 'STANDBY',
        dataBufferGb: Number(this.cameraBufferGb.toFixed(2)),
        maxBufferGb: 15.0,
        imagesCaptured: this.imagesCaptured,
        sensorHealthPct: 99.4,
      },
      subsystems,
      groundStations,
      masterAlertLevel,
    };

    // Post live telemetry frame to main thread
    const msg: WorkerToMainMessage = {
      type: 'TELEMETRY_UPDATE',
      payload: frame,
    };
    self.postMessage(msg);

    // Accumulate log entry into time-series buffer (batched every 2s)
    this.historyBuffer.push({
      timestamp: frame.timestamp,
      metSec: frame.metSec,
      altitudeKm: frame.orbit.altitudeKm,
      velocityKmS: frame.orbit.velocityKmS,
      solarPowerW: frame.eps.solarArrayPowerW,
      batterySoCPct: frame.eps.batterySoCPct,
      rssiDbm: frame.comms.rssiDbm,
      cpuTempC: frame.thermal.cpuTempC,
      hullTempC: frame.thermal.hullSunsideTempC,
      inEclipse: frame.orbit.inEclipse,
      alertLevel: frame.masterAlertLevel,
    });

    const now = Date.now();
    if (now - this.lastBatchTime >= 2000 && this.historyBuffer.length > 0) {
      const batchMsg: WorkerToMainMessage = {
        type: 'TELEMETRY_BATCH',
        payload: [...this.historyBuffer],
      };
      self.postMessage(batchMsg);
      this.historyBuffer = [];
      this.lastBatchTime = now;
    }
  }

  private logEvent(
    type: MissionEvent['type'],
    severity: MissionEvent['severity'],
    subsystem: SubsystemType | undefined,
    title: string,
    description: string
  ) {
    const event: MissionEvent = {
      timestamp: Date.now(),
      metSec: Math.floor(this.metSec),
      type,
      severity,
      subsystem,
      title,
      description,
    };

    const msg: WorkerToMainMessage = {
      type: 'EVENT_LOGGED',
      payload: event,
    };
    self.postMessage(msg);
  }
}

// Instantiate worker simulation
new SpacecraftSimulator();
