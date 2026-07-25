# Astraea Space Mission Control Simulator

A production-grade spacecraft operations center that runs in your browser. No servers. No cloud. No installs. Just a URL and you are mission control.

https://astraea-space-mission-control-simul.vercel.app

---

## Why this matters

Most space mission simulators are either expensive desktop software, stripped-down educational toys, or require backend infrastructure. Astraea is different. It is a full mission control experience built for the browser with real physics, real-time 3D, and professional-grade monitoring - all running locally on your machine at 60 frames per second.

## Extraordinary features

**Procedural 3D Earth.** A fully procedural planet rendered entirely in shader code. Continents, oceans, ice caps, and atmospheric glow are generated on the GPU using FBM noise. No texture files needed, no loading screens, infinite visual fidelity. The Earth responds to eclipse conditions in real time - when the spacecraft passes into shadow, the planet darkens with a cold blue tint, matching the telemetry state exactly.

**Detailed interactive spacecraft.** A high-fidelity 3D model with gold MLI foil (PBR clearcoat), dual solar arrays with cell grid lines, parabolic high-gain antenna with feed horn struts, RCS thruster clusters, payload optics bay with lens glow, star tracker assembly, and reaction wheel covers. Click any component to inspect it - the selected part highlights and its name appears in the HUD.

**Live telemetry at 60 Hz.** The orbital simulation runs in a dedicated Web Worker using real Keplerian equations. Altitude, velocity, inclination, orbital position, eclipse timing, ground station passes - all calculated live with sub-second precision. The worker posts updates 60 times per second, and the UI renders with React 19's concurrent features for zero jank.

**Eclipse-aware rendering.** When the spacecraft enters Earth's umbra, the scene dims. The 3D directional light shifts position and color, solar panel materials darken, and the procedural Earth shader reduces its ambient and diffuse lighting while applying a deep blue-gray tint. The HUD status bar shows "Eclipse (Umbra)" - the entire scene reacts as one system.

**Procedural cloud layer.** A second FBM noise shader generates cloud patterns over the Earth. Not a static texture - real procedural noise that wraps the planet with visible cloud bands, rotating at a slightly different rate than the surface. Atmospheric Fresnel glow completes the view.

**Global ground station network.** A worldwide network of tracking stations is rendered as 3D markers on the Earth. Active stations pulse with green rings and display "LINK" labels. The comms panel shows pass schedules, signal strength, and link status for each station in real time.

**Command console with full undo.** Send commands to the spacecraft from the console. Every command is recorded in a history stack with full undo support (Ctrl+Z). The worker stores state snapshots so undo actually rewinds the simulation state, not just the UI.

**Fault injection and alarm system.** Inject realistic spacecraft faults - power degradation, thermal anomalies, ACS errors, RF link loss. The system responds with visual alerts, status changes across all modules, procedural audio cues, and toast notifications. Clear faults with a single click.

**Procedural audio engine.** No audio files. The Web Audio API generates real-time tones, sweeps, and alarm sounds procedurally. Connection tones, warning beeps, critical alarms - all synthesized on the fly based on telemetry state.

**Full accessibility compliance.** WCAG 2.1 compliant. ARIA labels, roles, and live regions throughout. Focus-visible indicators on every interactive element. Skip navigation link. Screen reader announcements for status changes. High-contrast mode toggle. Keyboard navigation for every feature. Reduced motion support.

## Technology

| Layer | What powers it |
|-------|---------------|
| Simulation | Web Worker at 60 Hz with Keplerian orbital mechanics |
| 3D rendering | React Three Fiber (Three.js), custom GLSL shaders |
| State management | Zustand with Immer middleware |
| Persistence | IndexedDB via Dexie (telemetry history, event logs) |
| Audio | Web Audio API - procedural synthesis, zero audio files |
| Charts | Recharts with ResponsiveContainer |
| UI framework | React 19 with TypeScript |
| Styling | Tailwind CSS v4 with CSS custom properties |
| Build tool | Vite 6 |
| Icons | Lucide React |

## What you can do

- Monitor live orbital telemetry: altitude, velocity, inclination, orbital position, eclipse state
- Explore a fully detailed 3D spacecraft - click any component
- View the Earth from orbit with procedural continents, clouds, and atmosphere
- Track ground stations worldwide with pass predictions
- Send commands and undo them with Ctrl+Z
- Inject faults and watch the spacecraft respond
- Browse historical telemetry charts with selectable time windows
- Search and filter the event timeline
- Adjust simulation speed from 1x to 10x
- Toggle high-contrast mode for better readability
- Export command logs as JSON
- Use keyboard shortcuts for every major action
- Collapse the console when you need more screen space

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

Output goes to `dist/`. Deployable to any static host - Vercel, Netlify, Cloudflare Pages, or a simple HTTP server.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| 1-5 | Switch modules |
| Space | Cycle simulation speed |
| Ctrl+Z | Undo last command |
| ? | Open help |

## Project structure

```
src/
├── components/       # React components
│   ├── 3d/          # Three.js scene, spacecraft model, Earth shaders
│   └── modules/     # Overview, Telemetry, Comms, Timeline panels
├── store/           # Zustand store with worker communication
├── workers/         # Simulation worker, undo state snapshots
├── types/           # Shared TypeScript types
└── lib/             # Utilities, audio engine, IndexedDB helpers
```

Documentation is in the [docs](docs/) folder.

---

Built with React 19, TypeScript, Three.js, and the Web Platform. No cloud services, no backend, no telemetry - just a spacecraft in your browser.
