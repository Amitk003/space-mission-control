import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { db } from '../../db';
import type { MissionEvent } from '../../types/telemetry';

export const TimelineModule: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Query IndexedDB for mission events
  const events = useLiveQuery(async () => {
    let query = db.mission_events.orderBy('timestamp').reverse();
    const records = await query.toArray();

    if (typeFilter !== 'ALL') {
      return records.filter((r) => r.type === typeFilter);
    }
    return records;
  }, [typeFilter]);

  const eventList = events;
  const isLoading = events === undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 animate-pulse h-12" />
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 animate-pulse h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-200">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span className="font-bold">MISSION PHASE TIMELINE & HISTORICAL LOGS (INDEXEDDB TIME-SERIES)</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {['ALL', 'MILESTONE', 'PHASE_CHANGE', 'ANOMALY', 'COMMAND'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              aria-label={`Filter by ${filter.replace(/_/g, ' ')}`}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                typeFilter === filter
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {(!eventList || eventList.length === 0) ? (
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center">
          <p className="text-slate-400 text-xs font-mono">No mission events recorded yet.</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="relative border-l-2 border-cyan-900/60 ml-4 pl-6 space-y-6">
          {eventList.map((ev, index) => {
            const date = new Date(ev.timestamp);
            const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

            return (
              <div key={ev.id || index} className="relative group">
                {/* Timeline Node Bullet */}
                <div
                  className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center ${
                    ev.severity === 'CRITICAL'
                      ? 'border-rose-500 text-rose-500 shadow-[0_0_10px_#f43f5e]'
                      : ev.severity === 'WARNING'
                      ? 'border-amber-400 text-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'border-cyan-400 text-cyan-400'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>

                {/* Event Card */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{ev.title}</span>
                      {ev.subsystem && (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                          {ev.subsystem}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>MET: T+{Math.floor(ev.metSec / 3600)}h</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {timeStr}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-mono">{ev.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};
