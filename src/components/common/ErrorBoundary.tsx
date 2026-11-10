import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertOctagon, RotateCcw, Home, Library } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Keep a non-invasive log in browser console for debugging
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#/';
  };

  handleGoRegistry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#/registry';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
              <AlertOctagon size={32} />
              <h1 className="text-2xl font-bold">Something went wrong</h1>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              The application encountered an unexpected display issue. Your saved data, patterns,
              and workspace sessions remain safely stored in your browser.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
              >
                <RotateCcw size={16} /> Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors text-sm"
              >
                <Home size={16} /> Return to Guide
              </button>
              <button
                onClick={this.handleGoRegistry}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors text-sm"
              >
                <Library size={16} /> Pattern Registry
              </button>
            </div>

            {this.state.error && (
              <details className="text-xs bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                <summary className="cursor-pointer font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Technical Details
                </summary>
                <pre className="font-mono whitespace-pre-wrap overflow-x-auto text-[11px]">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

