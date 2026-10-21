import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { trackError } from '../lib/monitoring.js';
import { clearSessionCache } from '../utils/cache.js';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null, componentStack: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ componentStack: info.componentStack || "" });
    trackError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <main className="min-h-screen bg-qdca-bg flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[28px] p-8 text-center glass-shadow">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={28} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-sm font-medium text-gray-500 mb-6">
            Please refresh the page. If the issue continues, try again later.
          </p>
          {isDev && this.state.error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-red-500">Debug error</p>
              <p className="mt-2 break-words text-sm font-semibold text-red-700">
                {this.state.error.message || String(this.state.error)}
              </p>
              {this.state.componentStack && (
                <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-red-600">
                  {this.state.componentStack}
                </pre>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              try {
                if (window.location.pathname.includes("/dashboard")) {
                  clearSessionCache("qdca:dashboard:");
                  clearSessionCache("dashboard:");
                }
              } catch {
                // Ignore storage access failures and continue with reload.
              }
              window.location.reload();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-qdca-grad-start to-qdca-grad-end text-white text-base font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qdca-purple"
          >
            Refresh Page
          </button>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
