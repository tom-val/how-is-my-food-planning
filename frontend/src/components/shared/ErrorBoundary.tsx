import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { Icon } from "../sage/Icon";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "var(--cream)",
          }}
        >
          <div className="fp-emptystate" style={{ maxWidth: 460 }}>
            <div className="fp-emptystate-mark">
              <Icon.Leaf />
            </div>
            <div className="fp-emptystate-title">Something went wrong</div>
            <div
              className="fp-emptystate-sub"
              style={{ display: "block", marginBottom: 18 }}
            >
              An unexpected error occurred. Please try reloading the page.
            </div>
            <button
              type="button"
              className="fp-btn fp-btn-primary"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              <Icon.Refresh />
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
