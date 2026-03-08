import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    try {
      const report = {
        message: error.message,
        stack: error.stack?.slice(0, 2000),
        componentStack: errorInfo.componentStack?.slice(0, 2000),
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      // Log structured error for monitoring
      console.error("[ErrorReport]", JSON.stringify(report));

      // If a remote endpoint is configured, send the report
      const endpoint = import.meta.env.VITE_ERROR_REPORTING_URL as string | undefined;
      if (endpoint) {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(report),
        }).catch(() => {
          // Silently fail — don't create error loops
        });
      }
    } catch {
      // Never let error reporting break the app
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8" role="alert">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-mono font-bold text-destructive">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Your saved analyses are safe in your browser.
            </p>
            {this.state.error && (
              <pre className="text-xs text-muted-foreground bg-secondary p-3 rounded-lg overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" className="font-mono text-xs" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button variant="default" size="sm" className="font-mono text-xs" onClick={this.handleReload}>
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
