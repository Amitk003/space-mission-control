import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Clock,
  HardDrive,
} from 'lucide-react';
import { db } from '../../db';

export const TimelineModule: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

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
        <div className="bg-[var(--color-bg-card)]/80 p-3.5 rounded-xl border border-[var(--color-border-subtle)] animate-pulse h-12" />
        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] animate-pulse h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--color-bg-card)]/80 p-3.5 rounded-xl border border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
          <HardDrive className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="font-bold">Mission Timeline and Event Logs</span>
        </div>

        <div className="flex items-center gap-1 bg-[var(--color-bg-base)] p-1 rounded-lg border border-[var(--color-border-subtle)] text-xs">
          {['ALL', 'MILESTONE', 'PHASE_CHANGE', 'ANOMALY', 'COMMAND'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              aria-label={`Filter by ${filter.replace(/_/g, ' ')}`}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                typeFilter === filter
                  ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/50 font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {filter.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {(!eventList || eventList.length === 0) ? (
        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)] text-center">
          <p className="text-[var(--color-text-muted)] text-xs">No mission events recorded yet.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-bg-card)]/80 p-4 rounded-xl border border-[var(--color-border-subtle)]">
          <div className="relative border-l-2 border-[var(--color-accent)]/60 ml-4 pl-6 space-y-6 max-h-[600px] overflow-y-auto">
            {eventList.map((ev, index) => {
              const date = new Date(ev.timestamp);
              const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

              return (
                <div key={ev.id || index} className="relative group">
                  <div
                    className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-[var(--color-bg-base)] flex items-center justify-center ${
                      ev.severity === 'CRITICAL'
                        ? 'border-[var(--color-danger)] text-[var(--color-danger)] shadow-[0_0_10px_var(--color-danger)]'
                        : ev.severity === 'WARNING'
                        ? 'border-[var(--color-warning)] text-[var(--color-warning)] shadow-[0_0_8px_var(--color-warning)]'
                        : 'border-[var(--color-accent)] text-[var(--color-accent)]'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--color-text-primary)]">{ev.title}</span>
                        {ev.subsystem && (
                          <span className="px-1.5 py-0.2 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 text-xs">
                            {ev.subsystem}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[var(--color-text-muted)] text-[11px]">
                        <span>MET: T+{Math.floor(ev.metSec / 3600)}h</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeStr}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-text-primary)]/80">{ev.description}</p>
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
