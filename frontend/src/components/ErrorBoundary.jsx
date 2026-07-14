import { Component } from 'react';
import { AlertOctagon, RefreshCw, Terminal } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Error Boundary caught crash]', error, errorInfo);
  }

  handleReset = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans cyber-grid flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-2xl glass-card rounded-2xl p-8 border border-rose-500/20 text-left relative glow-red">
            
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-rose-500/20 pb-6 mb-6">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-500">
                <AlertOctagon className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-extrabold text-rose-500">
                  SYSTEM KERNEL PANIC
                </h1>
                <p className="text-xs font-mono text-slate-400">
                  CRITICAL: React thread crashed. Context execution halted.
                </p>
              </div>
            </div>

            {/* Error Diagnostics Code Panel */}
            <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-5 font-mono text-xs text-rose-400 mb-8 overflow-x-auto shadow-inner">
              <div className="flex items-center gap-2 text-slate-500 border-b border-slate-900 pb-2 mb-3">
                <Terminal className="w-3.5 h-3.5" />
                <span>DIAGNOSTIC CRASH DUMP LOG</span>
              </div>
              <p className="font-bold mb-1 text-slate-200">
                Error: {this.state.error?.message || 'Unknown Execution Error'}
              </p>
              <pre className="text-[10px] leading-relaxed text-slate-500 max-h-40 overflow-y-auto">
                {this.state.error?.stack || 'No execution stack available.'}
              </pre>
            </div>

            {/* Action button */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <span className="text-xs font-mono text-slate-500">
                Ensure network sockets are open and reload browser.
              </span>
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 px-6 py-2.5 rounded-xl font-medium transition duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recover Kernel & Restart App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
