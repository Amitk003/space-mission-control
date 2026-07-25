import React, { useEffect, useRef } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import type { TelemetryFrame } from '../types/telemetry';

interface TickerRefProps {
  selector: (telemetry: TelemetryFrame) => string | number;
  format?: (value: string | number) => string;
  className?: string;
  fallback?: string;
}

export const TickerRef: React.FC<TickerRefProps> = ({
  selector,
  format = (val) => String(val),
  className = '',
  fallback = '--',
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Direct manual subscription to Zustand store
    const unsubscribe = useMissionStore.subscribe((state) => {
      if (spanRef.current) {
        const telemetry = state.telemetry;
        if (telemetry) {
          try {
            const rawVal = selector(telemetry);
            spanRef.current.textContent = format(rawVal);
          } catch {
            spanRef.current.textContent = fallback;
          }
        } else {
          spanRef.current.textContent = fallback;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selector, format, fallback]);

  return <span ref={spanRef} className={`font-mono transition-colors ${className}`}>{fallback}</span>;
};
