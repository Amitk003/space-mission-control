# Architecture

This document explains how the Astraea Mission Control Simulator is built.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite 6** - Build tool and dev server
- **Tailwind CSS v4** - Styling

## Project Structure

```
src/
  main.tsx              - Entry point
  App.tsx               - Root component
  index.css             - Global styles and Tailwind setup
  types/
    telemetry.ts        - All TypeScript types and interfaces
  store/
    useMissionStore.ts  - Zustand state management
  db/
    index.ts            - Dexie / IndexedDB setup and seed data
  workers/
    simulator.worker.ts - Web Worker running physics simulation at 60Hz
  audio/
    soundEngine.ts      - Web Audio API procedural sound engine
  components/
    Header.tsx          - Top navigation bar
    ResizableLayout.tsx - Main layout with split 3D viewport
    TickerRef.tsx       - Optimized telemetry display component
    3d/
      SpacecraftCanvas.tsx  - 3D viewport with render modes
      SpacecraftModel.tsx   - Interactive 3D spacecraft CAD model
      EarthOrbitScene.tsx   - Earth globe with orbit visualization
    modules/
      OverviewModule.tsx     - Dashboard with subsystem health matrix
      TelemetryModule.tsx    - Historical charts from IndexedDB
      CommsModule.tsx        - Ground station tracking and command console
      TimelineModule.tsx     - Mission event timeline from IndexedDB
      CommandConsole.tsx     - Text-based command terminal
```

## How It Works

### Simulation Engine

The spacecraft simulation runs inside a Web Worker (`simulator.worker.ts`). This keeps the main UI thread free for smooth rendering. The worker:

1. Runs a physics loop at 60Hz using `setTimeout` recursion
2. Calculates orbital mechanics using Keplerian equations
3. Simulates all subsystems (EPS, ADCS, COMMS, THERMAL, PROPULSION, PAYLOAD)
4. Sends telemetry frames to the main thread every tick
5. Batches history data to IndexedDB every 2 seconds

### Data Flow

```
Web Worker (60Hz physics)
  |  postMessage (TELEMETRY_UPDATE)
  v
Zustand Store (useMissionStore)
  |  React re-renders components
  |  Dexie bulkAdd (TELEMETRY_BATCH)
  v
IndexedDB (telemetry_logs, mission_events)
  |  useLiveQuery
  v
TelemetryModule, TimelineModule (charts and logs)
```

### State Management

All application state lives in a single Zustand store. Components subscribe to only the slices they need. The `TickerRef` component uses a direct subscription pattern to avoid re-rendering full component trees on every 60Hz telemetry update.

### 3D Visualization

Two view modes are available:
- **Spacecraft CAD** - Interactive 3D model of the satellite with clickable components
- **Global Orbit** - Earth globe with satellite position, ground stations, and orbit path

Both use React Three Fiber (R3F) with Drei helpers.

### Audio

The procedural audio engine uses the Web Audio API to synthesize sounds:
- Gentle ping for nominal status
- Triangle wave for warnings
- Detuned sawtooth for critical alarms
- Chirp for command execution

No audio files are needed. Everything is generated in the browser.

### Persistence

IndexedDB (via Dexie) stores:
- Telemetry logs for chart history
- Mission events for timeline

Data stays on your machine. Nothing is sent to any server.
