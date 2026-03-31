import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-danger">Something went wrong</h2>
          <p className="mt-2 text-white/60">Please refresh the page to continue.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
