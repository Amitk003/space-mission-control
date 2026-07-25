import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="bg-[var(--color-bg-card)]/80 p-6 rounded-xl border border-[var(--color-danger)]/80 text-center">
          <p className="text-[var(--color-danger)] text-sm font-mono font-bold mb-2">MODULE ERROR</p>
          <p className="text-[var(--color-text-muted)] text-xs font-mono">
            {this.state.error?.message || 'Something went wrong'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-3 py-1 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] text-xs font-mono hover:bg-[var(--color-bg-elevated)] cursor-pointer"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
