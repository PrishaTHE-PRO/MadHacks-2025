import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an external service here
    // For now we'll store the stack info so it can be shown in the UI
    this.setState({ error, errorInfo });
    // eslint-disable-next-line no-console
    console.error("Caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h1>Something went wrong</h1>
          <p>
            The application encountered an error during rendering. The full
            error and stack trace are shown below.
          </p>
          <div style={{ whiteSpace: "pre-wrap", background: "#111", color: "#fff", padding: 12, borderRadius: 8, overflow: "auto" }}>
            <strong>Error:</strong>
            <div style={{ marginTop: 8 }}>{this.state.error?.message}</div>
            <hr style={{ borderColor: "#333" }} />
            <strong>Stack:</strong>
            <div style={{ marginTop: 8 }}>{this.state.error?.stack}</div>
            {this.state.errorInfo?.componentStack && (
              <>
                <hr style={{ borderColor: "#333" }} />
                <strong>Component stack:</strong>
                <div style={{ marginTop: 8 }}>{this.state.errorInfo.componentStack}</div>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactNode;
  }
}
