import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, Flame, LineChart as ChartIcon, Zap } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { db } from '../../db';

export const TelemetryModule: React.FC = () => {
  const [timeWindowMin, setTimeWindowMin] = useState<number>(15);

  const logs = useLiveQuery(async () => {
    const cutoff = Date.now() - timeWindowMin * 60 * 1000;
    const records = await db.telemetry_logs
      .where('timestamp')
      .above(cutoff)
      .limit(200)
      .toArray();

    return records.map((r) => {
      const d = new Date(r.timestamp);
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      return {
        ...r,
        timeStr,
      };
    });
  }, [timeWindowMin]);

  const chartData = logs;
  const isLoading = logs === undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--color-bg-card)]/80 p-3 rounded-xl border border-[var(--color-border-subtle)] animate-pulse h-12" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] animate-pulse h-[300px]" />
          <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] animate-pulse h-[300px]" />
          <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] animate-pulse h-[260px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[var(--color-bg-card)]/80 p-3 rounded-xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-text-muted)] text-xs">No telemetry data available for the selected time window.</p>
          <div className="flex items-center gap-1.5 bg-[var(--color-bg-base)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
            {[5, 15, 30, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setTimeWindowMin(mins)}
                aria-label={`Show last ${mins} minutes`}
                className={`px-2.5 py-1 text-xs rounded cursor-pointer transition-colors ${
                  timeWindowMin === mins
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/50 font-bold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Last {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-[var(--color-bg-card)]/80 p-3 rounded-xl border border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
          <ChartIcon className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="font-bold">Telemetry Analytics (IndexedDB Archive)</span>
        </div>

        <div className="flex items-center gap-1.5 bg-[var(--color-bg-base)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
          {[5, 15, 30, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => setTimeWindowMin(mins)}
              aria-label={`Show last ${mins} minutes`}
              className={`px-2.5 py-1 text-xs rounded cursor-pointer transition-colors ${
                timeWindowMin === mins
                  ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/50 font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Last {mins}m
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Altitude & Velocity vs Time */}
        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] space-y-3 min-w-0">
          <h3 className="text-xs font-bold text-[var(--color-accent)] flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Orbital Kinematics (Altitude and Velocity)</span>
          </h3>

          <div className="h-[220px] w-full text-xs overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeStr" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" domain={[400, 420]} stroke="#38bdf8" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[7.5, 7.8]} stroke="#10b981" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="altitudeKm"
                  name="Altitude (km)"
                  stroke="#38bdf8"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="velocityKmS"
                  name="Velocity (km/s)"
                  stroke="#10b981"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Solar Power & Battery SoC Area Chart */}
        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] space-y-3 min-w-0">
          <h3 className="text-xs font-bold text-[var(--color-warning)] flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[var(--color-warning)]" />
            <span>Power Generation and Battery Profile</span>
          </h3>

          <div className="h-[220px] w-full text-xs overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeStr" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" domain={[0, 1600]} stroke="#f59e0b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[50, 100]} stroke="#34d399" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="solarPowerW"
                  name="Solar Array (W)"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="batterySoCPct"
                  name="Battery SoC (%)"
                  stroke="#34d399"
                  fill="#34d399"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Thermal Profile */}
        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] space-y-3 lg:col-span-2 min-w-0">
          <h3 className="text-xs font-bold text-[var(--color-danger)] flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[var(--color-danger)]" />
            <span>Thermal Profile (Hull vs CPU Temp)</span>
          </h3>

          <div className="h-[220px] w-full text-xs overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeStr" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[-100, 150]} stroke="#f43f5e" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="hullTempC"
                  name="Hull Sunside (°C)"
                  stroke="#f43f5e"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="cpuTempC"
                  name="Core CPU Temp (°C)"
                  stroke="#38bdf8"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
