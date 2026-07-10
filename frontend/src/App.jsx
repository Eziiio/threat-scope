import { useState, useEffect } from 'react';
import { Shield, Radio, Terminal, Server, AlertTriangle, CheckCircle, Database } from 'lucide-react';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Check backend health status
    fetch('/api/health')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setBackendStatus('online');
        } else {
          setBackendStatus('degraded');
        }
      })
      .catch(err => {
        setBackendStatus('offline');
        setErrorMsg(err.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans cyber-grid flex flex-col items-center justify-center p-6">
      {/* Container */}
      <div className="w-full max-w-4xl glass-card rounded-2xl p-8 border border-slate-800 relative scanner-effect glow-blue">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800/80 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Shield className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                ThreatScope
              </h1>
              <p className="text-sm text-slate-400 font-mono">
                Cyber Threat Intelligence Platform v1.0.0
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                backendStatus === 'online' ? 'bg-emerald-400' : backendStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                backendStatus === 'online' ? 'bg-emerald-500' : backendStatus === 'checking' ? 'bg-amber-500' : 'bg-rose-500'
              }`}></span>
            </span>
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-300">
              API Status: {backendStatus}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1 */}
          <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Environment</span>
              <Terminal className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold font-display mb-1 text-slate-200">Vite + React 19</h3>
              <p className="text-xs text-slate-400">Scaffolded with Vite dev server and ES modules.</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Styling</span>
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold font-display mb-1 text-slate-200">Tailwind CSS v4</h3>
              <p className="text-xs text-slate-400">Next-gen css compiler engine with fast HMR.</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Database</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold font-display mb-1 text-slate-200">MongoDB Atlas</h3>
              <p className="text-xs text-slate-400">Mongoose layer initialized and ready to write schemas.</p>
            </div>
          </div>
        </div>

        {/* Database Status Alert */}
        {backendStatus === 'online' ? (
          <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold font-mono">CONNECTION SUCCESS:</span> Handshake established with Express and database models are active.
            </div>
          </div>
        ) : backendStatus === 'checking' ? (
          <div className="bg-amber-500/5 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center gap-3">
            <Server className="w-5 h-5 flex-shrink-0 animate-bounce" />
            <div className="text-sm">
              <span className="font-semibold font-mono">ESTABLISHING HANDSHAKE:</span> Connecting to the backend dev server...
            </div>
          </div>
        ) : (
          <div className="bg-rose-500/5 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold font-mono">CONNECTION FAILURE:</span> Backend is currently unreachable. Make sure the backend server is running. {errorMsg && `(${errorMsg})`}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-500 font-mono border-t border-slate-800/40 pt-4">
          Press 'Continue to the next phase' when you are ready to configure JWT authentication models.
        </div>
      </div>
    </div>
  );
}

export default App;
