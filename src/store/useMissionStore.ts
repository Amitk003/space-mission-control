import { create } from 'zustand';
import { audioEngine } from '../audio/soundEngine';
import { db, seedInitialDatabase } from '../db';
import type {
  CommandLog,
  CommandType,
  MainToWorkerMessage,
  MissionEvent,
  SubsystemType,
  TelemetryFrame,
  WorkerToMainMessage,
} from '../types/telemetry';

export type ViewModule = 'OVERVIEW' | 'TELEMETRY' | 'COMMS' | 'TIMELINE' | '3D_LAB';
export type SpatialViewMode = 'SPACECRAFT' | 'GLOBAL_ORBIT';

export interface MissionStoreState {
  activeModule: ViewModule;
  spatialViewMode: SpatialViewMode;
  selectedComponent: string | null;
  isOverUI: boolean;

  isSimulating: boolean;
  simSpeed: number;

  isAudioMuted: boolean;
  audioVolume: number;

  telemetry: TelemetryFrame | null;

  commandLogs: CommandLog[];

  latestEvents: MissionEvent[];

  highContrast: boolean;

  setActiveModule: (module: ViewModule) => void;
  setSpatialViewMode: (mode: SpatialViewMode) => void;
  setSelectedComponent: (componentId: string | null) => void;
  setIsOverUI: (isOver: boolean) => void;
  setSimSpeed: (speed: number) => void;
  toggleAudioMute: () => void;
  setAudioVolume: (vol: number) => void;
  toggleHighContrast: () => void;

  initWorker: () => void;
  executeCommand: (command: CommandType, args?: Record<string, unknown>) => void;
  undoLastCommand: () => void;
  injectFault: (subsystem: SubsystemType, severity: 'WARNING' | 'CRITICAL') => void;
  clearFaults: () => void;
}

let workerInstance: Worker | null = null;
let commandHistory: { command: CommandType; args?: Record<string, unknown> }[] = [];

export const useMissionStore = create<MissionStoreState>((set, get) => ({
  activeModule: 'OVERVIEW',
  spatialViewMode: 'SPACECRAFT',
  selectedComponent: null,
  isOverUI: false,

  isSimulating: false,
  simSpeed: 1.0,

  isAudioMuted: false,
  audioVolume: 0.3,

  telemetry: null,
  commandLogs: [
    {
      id: 'CMD-INIT-001',
      timestamp: Date.now() - 3600000,
      metSec: 10800,
      command: 'RUN_DIAGNOSTICS',
      status: 'SUCCESS',
      response: 'Initial boot diagnostics complete. Telemetry link verified.',
    },
  ],
  latestEvents: [],
  highContrast: false,

  setActiveModule: (module) => set({ activeModule: module }),
  setSpatialViewMode: (mode) => set({ spatialViewMode: mode }),
  setSelectedComponent: (componentId) => set({ selectedComponent: componentId }),
  setIsOverUI: (isOver) => set({ isOverUI: isOver }),

  setSimSpeed: (speed) => {
    set({ simSpeed: speed });
    if (workerInstance) {
      const msg: MainToWorkerMessage = { type: 'SET_SIM_SPEED', speed };
      workerInstance.postMessage(msg);
    }
  },

  toggleAudioMute: () => {
    const nextMuted = !get().isAudioMuted;
    audioEngine.setMuted(nextMuted);
    set({ isAudioMuted: nextMuted });
  },

  setAudioVolume: (vol) => {
    audioEngine.setVolume(vol);
    set({ audioVolume: vol });
  },

  toggleHighContrast: () => {
    const next = !get().highContrast;
    document.documentElement.setAttribute('data-high-contrast', next ? 'true' : 'false');
    set({ highContrast: next });
  },

  initWorker: async () => {
    if (workerInstance) return;

    await seedInitialDatabase();

    workerInstance = new Worker(new URL('../workers/simulator.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerInstance.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'TELEMETRY_UPDATE': {
          const frame = msg.payload;
          set({ telemetry: frame, isSimulating: true });

          if (frame.masterAlertLevel === 'NOMINAL') {
            audioEngine.playNominalPing();
          } else if (frame.masterAlertLevel === 'WARNING') {
            audioEngine.playWarningAlert();
          } else if (frame.masterAlertLevel === 'CRITICAL') {
            audioEngine.playCriticalAlarm();
          }
          break;
        }

        case 'TELEMETRY_BATCH': {
          db.telemetry_logs.bulkAdd(msg.payload).catch(() => {});
          break;
        }

        case 'EVENT_LOGGED': {
          const ev = msg.payload;
          db.mission_events.add(ev).catch(() => {});
          set((state) => ({
            latestEvents: [ev, ...state.latestEvents].slice(0, 50),
          }));
          break;
        }

        case 'COMMAND_RESPONSE': {
          const responseLog = msg.payload;
          set((state) => ({
            commandLogs: [
              responseLog,
              ...state.commandLogs.filter((c) => c.id !== responseLog.id),
            ].slice(0, 30),
          }));
          break;
        }
      }
    };

    const startMsg: MainToWorkerMessage = { type: 'START_SIMULATION' };
    workerInstance.postMessage(startMsg);
  },

  executeCommand: (command, args) => {
    audioEngine.playCommandSound();
    commandHistory.push({ command, args });
    if (commandHistory.length > 30) commandHistory.shift();
    if (workerInstance) {
      const msg: MainToWorkerMessage = {
        type: 'EXECUTE_COMMAND',
        command,
        args,
      };
      workerInstance.postMessage(msg);
    }
  },

  undoLastCommand: () => {
    const last = commandHistory.pop();
    if (!last) return;
    if (workerInstance) {
      const msg: MainToWorkerMessage = {
        type: 'EXECUTE_COMMAND',
        command: 'RUN_DIAGNOSTICS',
        args: { undo: last.command },
      };
      workerInstance.postMessage(msg);
    }
  },

  injectFault: (subsystem, severity) => {
    audioEngine.playCommandSound();
    if (workerInstance) {
      const msg: MainToWorkerMessage = {
        type: 'INJECT_FAULT',
        subsystem,
        severity,
      };
      workerInstance.postMessage(msg);
    }
  },

  clearFaults: () => {
    audioEngine.playCommandSound();
    if (workerInstance) {
      const msg: MainToWorkerMessage = { type: 'CLEAR_FAULTS' };
      workerInstance.postMessage(msg);
    }
  },
}));
