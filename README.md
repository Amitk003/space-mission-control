# Astraea Space Mission Control Simulator

A browser-based space mission control center that runs entirely on your machine. No servers. No cloud. No setup.

## What is this?

This is a real-time spacecraft simulation and mission control dashboard. You get:

- A live telemetry feed updating 60 times per second
- 3D interactive satellite model you can click and inspect
- Orbital mechanics engine with Keplerian physics
- Ground station tracking across the globe
- Historical charts and event logs saved in your browser
- Procedural audio that tells you what is happening
- Command console to control the spacecraft

Everything runs in your browser. All data stays on your computer.

## Why use this?

**No setup required.** Just open the page and mission control is running.

**Real physics.** The orbital simulation uses real Keplerian equations. Altitude, velocity, inclination, eclipse timing - all calculated live.

**Fully interactive.** Click any part of the 3D satellite to inspect it. Send commands. Inject faults. Watch how the spacecraft responds.

**Beautiful dark theme.** Designed for long monitoring sessions. No eye strain.

**Built with modern tools.** React 19, TypeScript, Vite, Tailwind CSS, Three.js, Web Workers, IndexedDB, Web Audio API.

## How to run

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Quick tour

1. Watch live telemetry update on the status overview
2. Switch to the 3D view and spin the spacecraft around
3. Open the telemetry charts to see data history
4. Send a command from the comms panel
5. Inject a fault and watch the alarms trigger

## What is inside

| Feature | How it works |
|---------|-------------|
| Simulation engine | Web Worker running at 60Hz |
| 3D graphics | React Three Fiber (Three.js) |
| Audio | Web Audio API (no files needed) |
| Data storage | IndexedDB via Dexie |
| State management | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Styling | Tailwind CSS v4 |

Read the full docs in the [docs](docs/) folder.

## Build for production

```bash
npm run build
```

The output goes to the `dist/` folder. You can serve it with any static file server.
