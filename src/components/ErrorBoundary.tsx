import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="bg-card rounded-xl border border-border shadow-card p-8 max-w-md w-full text-center">
            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                className="flex-1 gradient-primary border-0 text-primary-foreground"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
              >
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

export default ErrorBoundary;
