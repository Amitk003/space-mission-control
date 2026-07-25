import Dexie, { type Table } from 'dexie';
import type { MissionEvent, TelemetryLogEntry } from '../types/telemetry';

export class MissionControlDatabase extends Dexie {
  telemetry_logs!: Table<TelemetryLogEntry, number>;
  mission_events!: Table<MissionEvent, number>;

  constructor() {
    super('AstraeaSpaceMissionControlDB');
    this.version(1).stores({
      telemetry_logs: '++id, timestamp, metSec, alertLevel',
      mission_events: '++id, timestamp, metSec, type, severity, subsystem',
    });
  }
}

export const db = new MissionControlDatabase();

// Pre-seed initial mission historical logs if empty
export async function seedInitialDatabase() {
  const eventCount = await db.mission_events.count();
  if (eventCount === 0) {
    const now = Date.now();
    const initialEvents: MissionEvent[] = [
      {
        timestamp: now - 3600000 * 4,
        metSec: 0,
        type: 'MILESTONE',
        severity: 'INFO',
        title: 'Launch Vehicle Separation',
        description: 'Spacecraft successfully separated from Upper Stage rocket. Primary bus power initialized.',
      },
      {
        timestamp: now - 3600000 * 3.8,
        metSec: 720,
        type: 'PHASE_CHANGE',
        severity: 'INFO',
        subsystem: 'EPS',
        title: 'Solar Array Deployment',
        description: 'Primary +X and -X Solar Array Wings deployed. Sun tracking loop locked at 1450W output.',
      },
      {
        timestamp: now - 3600000 * 3.2,
        metSec: 2880,
        type: 'PHASE_CHANGE',
        severity: 'INFO',
        subsystem: 'COMMS',
        title: 'Ground Station Acquisition',
        description: 'First telemetry downlink established with Svalbard Ground Station. Signal Strength: -72 dBm.',
      },
      {
        timestamp: now - 3600000 * 2.5,
        metSec: 5400,
        type: 'MILESTONE',
        severity: 'INFO',
        subsystem: 'ADCS',
        title: 'Star Tracker Fine Pointing Lock',
        description: 'ADCS achieved 3-axis stabilized fine pointing mode. Reaction wheels initialized at nominal 1200 RPM.',
      },
      {
        timestamp: now - 3600000 * 1.5,
        metSec: 9000,
        type: 'ANOMALY',
        severity: 'WARNING',
        subsystem: 'THERMAL',
        title: 'Eclipse Thermal Transient',
        description: 'Entered orbital eclipse. Hull shadeside temperature dropped to -98°C. Subsystem Heaters 1 & 2 engaged automatically.',
      },
      {
        timestamp: now - 3600000 * 0.5,
        metSec: 12600,
        type: 'COMMAND',
        severity: 'INFO',
        subsystem: 'PAYLOAD',
        title: 'Hyperspectral Camera Calibration',
        description: 'Automated optical test sequence executed. Data buffer loaded at 4.2 GB.',
      },
    ];

    await db.mission_events.bulkAdd(initialEvents);

    // Seed historical telemetry points for chart initial load
    const telemetryHistory: TelemetryLogEntry[] = [];
    const points = 60; // 60 minutes history
    for (let i = points; i >= 0; i--) {
      const t = now - i * 60000;
      const metSec = 14400 - i * 60;
      const phase = (metSec / 5500) * 2 * Math.PI;
      const inEclipse = Math.sin(phase) < -0.2;

      telemetryHistory.push({
        timestamp: t,
        metSec,
        altitudeKm: 408.7 + Math.sin(phase * 2) * 4.2,
        velocityKmS: 7.67 - Math.sin(phase * 2) * 0.08,
        solarPowerW: inEclipse ? 0 : 1420 + Math.sin(phase) * 60,
        batterySoCPct: inEclipse ? Math.max(68, 98 - (i % 30) * 1.1) : Math.min(100, 75 + (i % 30) * 1.2),
        rssiDbm: -78 + Math.cos(phase * 3) * 12,
        cpuTempC: 38.5 + Math.sin(phase) * 6,
        hullTempC: inEclipse ? -85 + Math.sin(phase) * 15 : 115 + Math.sin(phase) * 10,
        inEclipse,
        alertLevel: 'NOMINAL',
      });
    }

    await db.telemetry_logs.bulkAdd(telemetryHistory);
  }
}
