import React, { useCallback, useEffect, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '1', action: 'Switch to Status Overview' },
    { key: '2', action: 'Switch to Telemetry Charts' },
    { key: '3', action: 'Switch to Comms & Ground' },
    { key: '4', action: 'Switch to Timeline & Logs' },
    { key: '5', action: 'Switch to 3D Spatial Lab' },
    { key: 'Space', action: 'Toggle simulation pause/resume' },
    { key: 'Ctrl+Z', action: 'Undo last command' },
    { key: '?', action: 'Show this help dialog' },
    { key: 'Esc', action: 'Close dialog' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[var(--color-accent)]">
            <Keyboard className="w-5 h-5" />
            <h2 className="text-sm font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close help dialog"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border-subtle)]/50 last:border-0">
              <span className="text-xs text-[var(--color-text-primary)]/80">{s.action}</span>
              <kbd className="px-2 py-0.5 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[10px] font-mono text-[var(--color-accent)]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-1.5 rounded bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/50 text-[var(--color-accent)] text-xs font-bold hover:bg-[var(--color-accent)]/25 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
