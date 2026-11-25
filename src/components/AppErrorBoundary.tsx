import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

/**
 * Catches uncaught render errors so a single broken page doesn't take down
 * the entire app. Logs to console + shows a friendly fallback with a
 * "Reload" button. Mount as the outermost wrapper inside <App>.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error("[ui] uncaught render error", err, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="max-w-md w-full p-6 space-y-4">
          <h1 className="text-xl font-semibold">VibeCare hit a snag</h1>
          <p className="text-sm text-muted-foreground">
            Something went wrong rendering this page. Reloading usually fixes it.
          </p>
          {this.state.message ? (
            <pre className="text-xs bg-muted/40 p-3 rounded overflow-auto">
              {this.state.message}
            </pre>
          ) : null}
          <Button onClick={this.handleReload} className="w-full">
            Reload
          </Button>
        </Card>
      </div>
    );
  }
}