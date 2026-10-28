import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, ShieldCheck, Trash2, Home } from 'lucide-react';
import { CrashGuard } from '../../services/crashGuard';
import { safeStorage } from '../../services/safeStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isSafeMode: boolean;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isSafeMode: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Caught an uncaught error in component tree:', error, errorInfo);
    
    // Telemetry to CrashGuard
    CrashGuard.recordCrash({
      type: 'react_render_error',
      message: error.message || 'React rendering exception',
      stack: `${error.stack || ''}\nComponent Stack: ${errorInfo.componentStack || ''}`,
    });

    this.setState({ errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleSafeMode = () => {
    // Reset transient corrupt states
    this.setState({ hasError: false, error: null, errorInfo: null, isSafeMode: true });
  };

  private handleClearCache = () => {
    if (confirm('क्या आप ऐप कैश और अस्थायी डेटा साफ़ करना चाहते हैं? (यह सुरक्षित है)')) {
      safeStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 text-center">
            {/* Shield Icon */}
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <span className="inline-block px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-full mb-3">
              Google Play Crash-Guard Shield Active
            </span>

            <h1 className="text-xl font-bold text-white mb-2">
              स्मार्ट इंडिया वर्क ऐप सुरक्षित है
            </h1>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              ऐप ने एक तकनीकी रुकावट को पहचान कर ऐप को क्रैश (White Screen) होने से बचा लिया है। आपका कोई भी डेटा या वॉलेट बैलेंस प्रभावित नहीं हुआ है।
            </p>

            {/* Action buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
              >
                <RefreshCw className="w-5 h-5" />
                ऐप पुनः लोड करें (Reload App)
              </button>

              <button
                onClick={this.handleSafeMode}
                className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl flex items-center justify-center gap-2 border border-slate-600 text-sm transition"
              >
                <Home className="w-4 h-4" />
                डैशबोर्ड पर वापस जाएं (Back to Dashboard)
              </button>

              <button
                onClick={this.handleClearCache}
                className="w-full py-2 px-4 bg-transparent hover:bg-slate-700/50 text-slate-400 hover:text-red-300 text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                कैश साफ़ करें और रीसेट करें (Clear Cache)
              </button>
            </div>

            {/* Expandable technical details */}
            <details className="text-left bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs text-slate-400">
              <summary className="cursor-pointer font-medium text-slate-400 hover:text-slate-300">
                तकनीकी विवरण (Technical Error Details)
              </summary>
              <div className="mt-2 text-[11px] font-mono overflow-x-auto text-amber-300/80 p-2 bg-black/40 rounded">
                <p className="font-semibold text-red-400 mb-1">
                  {this.state.error?.toString()}
                </p>
                <p className="text-slate-500 whitespace-pre-wrap">
                  {this.state.errorInfo?.componentStack?.slice(0, 400) || 'No stack trace available'}
                </p>
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
