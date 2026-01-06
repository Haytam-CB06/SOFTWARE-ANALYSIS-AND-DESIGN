import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
  errorStack?: string;
};

/**
 * Prevents a full blank white screen on runtime crashes.
 * Shows a minimal error panel so you can still reload.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any): State {
    return {
      hasError: true,
      errorMessage: String(error?.message || error),
    };
  }

  componentDidCatch(error: any, info: any) {
    // Keep console output for dev debugging
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Unhandled UI error:', error, info);
    this.setState({
      errorStack: String(info?.componentStack || ''),
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
          <div className="text-lg font-semibold">Something went wrong</div>
          <div className="mt-2 text-sm opacity-80">
            The app crashed while rendering this page. Refresh to recover.
          </div>

          {this.state.errorMessage && (
            <pre className="mt-4 whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">
              {this.state.errorMessage}
            </pre>
          )}
          {this.state.errorStack && (
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">
              {this.state.errorStack}
            </pre>
          )}

          <div className="mt-4 flex gap-2">
            <button
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button
              className="rounded-md border px-3 py-2 text-sm"
              onClick={() => this.setState({ hasError: false })}
            >
              Try to continue
            </button>
          </div>
        </div>
      </div>
    );
  }
}
