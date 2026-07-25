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
  const lastUpdateRef = useRef<number>(0);
  const cachedValueRef = useRef<string>(fallback);
  const selectorRef = useRef(selector);
  const formatRef = useRef(format);

  selectorRef.current = selector;
  formatRef.current = format;

  useEffect(() => {
    const unsubscribe = useMissionStore.subscribe((state) => {
      if (!spanRef.current) return;
      const now = Date.now();
      if (now - lastUpdateRef.current < 100) return;
      lastUpdateRef.current = now;

      const telemetry = state.telemetry;
      if (telemetry) {
        try {
          const rawVal = selectorRef.current(telemetry);
          const formatted = formatRef.current(rawVal);
          if (formatted !== cachedValueRef.current) {
            cachedValueRef.current = formatted;
            spanRef.current.textContent = formatted;
          }
        } catch {
          spanRef.current.textContent = fallback;
        }
      } else {
        spanRef.current.textContent = fallback;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fallback]);

  return <span ref={spanRef} className={`font-mono transition-colors ${className}`}>{fallback}</span>;
};
