# Usage Guide

## Getting Started

### Prerequisites

- Node.js (v18 or newer)

### Install and Run

```bash
npm install
npm run dev
```

Open your browser to the address shown in the terminal (usually http://localhost:3000).

## Navigation

The app has five main sections. Click the tabs in the header to switch between them.

### Status Overview

Shows all spacecraft subsystems in a health matrix. Each subsystem card shows:
- Current status (NOMINAL, WARNING, or CRITICAL)
- Temperature, bus voltage, and CPU load
- Status message

On the right side you can:
- View orbital parameters (altitude, velocity, inclination, etc.)
- Inject simulated faults to test your response

### Telemetry Charts

Historical charts pulled from IndexedDB. You can pick the time window:
- Last 5 minutes
- Last 15 minutes
- Last 30 minutes
- Last 60 minutes

Charts shown:
- Altitude and velocity over time
- Solar power and battery charge
- Hull temperature and CPU temperature

### Comms and Ground

Shows:
- Active ground station link status
- Signal strength (RSSI) and signal-to-noise ratio
- Packet loss and data rate
- Table of all ground stations with distance and pass status

You can send commands to the satellite:
1. Pick a command from the dropdown
2. Click "TRANSMIT COMMAND TO SATELLITE"

Available commands:
- Run diagnostics
- Realign solar panels
- Fire RCS thrusters
- Reset transponder
- Toggle heaters
- Capture image
- Enter safe mode

### Timeline and Logs

Shows mission events in a vertical timeline. You can filter by event type:
- All events
- Milestones
- Phase changes
- Anomalies
- Commands

Events are stored in IndexedDB and persist across page refreshes.

### 3D Spatial Lab

Two view modes:
- **Spacecraft CAD** - Click on satellite parts to inspect them
- **Global Orbit** - Watch the satellite orbit Earth with ground stations marked

Use your mouse to drag, rotate, and zoom the 3D view.

## Simulation Controls

### Speed

Use the speed buttons (1x, 2x, 5x, 10x) in the header to speed up or slow down the simulation.

### Audio

Click the speaker icon to mute or unmute the procedural audio engine.

### Fault Injection

On the Overview page, click the fault injection buttons to simulate problems:
- Inhibit Solar Bus - Reduces power generation
- Inject Thermal Drift - Raises hull temperature
- Drop Transponder - Kills the communications link
- Auto-Align Panels - Fixes solar panel alignment

Use the RESET button in the header to clear all injected faults.

### Text Terminal

The terminal at the bottom of the screen accepts text commands:
- `diagnostics` - Run system sweep
- `solar` or `panel` - Realign solar panels
- `thrust` or `burn` - Fire thrusters
- `radio` or `comms` - Reset transponder
- `safe` - Enter safe mode
- `clear` - Clear all faults

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.
