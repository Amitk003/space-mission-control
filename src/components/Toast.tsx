import React, { useCallback, useEffect, useState } from 'react';
import { AlertOctagon, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none" style={{ right: 'max(1rem, env(safe-area-inset-right, 1rem))' }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertOctagon,
  error: AlertOctagon,
};

const colorMap = {
  info: 'border-[var(--color-accent)]/70 bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
  success: 'border-[var(--color-success)]/70 bg-[var(--color-success)]/15 text-[var(--color-success)]',
  warning: 'border-[var(--color-warning)]/70 bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  error: 'border-[var(--color-danger)]/70 bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = iconMap[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2 px-3 py-2 rounded-lg border backdrop-blur-md text-xs font-medium shadow-lg ${colorMap[toast.type]} ${exiting ? 'toast-exit' : 'toast-enter'}`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 200); }}
        className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
