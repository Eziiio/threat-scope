import { Shield, Terminal } from 'lucide-react';

export const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans cyber-grid flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-slate-800 text-center relative glow-blue flex flex-col items-center justify-center gap-6">
        
        {/* Animated Scanner Radar */}
        <div className="relative flex items-center justify-center w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-sky-500/10 border border-sky-500/30 animate-ping opacity-60"></div>
          <div className="absolute w-16 h-16 rounded-full bg-indigo-500/5 border border-indigo-500/20 animate-pulse"></div>
          <div className="relative p-4 bg-slate-900 rounded-xl border border-sky-500/30 text-sky-400">
            <Shield className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        {/* Loading text */}
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-display font-bold tracking-wider text-slate-200">
            SECURE HANDSHAKE
          </h3>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <Terminal className="w-3.5 h-3.5 animate-pulse" />
            <span>Establishing secure session link...</span>
          </div>
        </div>

        {/* Animated bar progress */}
        <div className="w-full bg-slate-950/60 h-1.5 rounded-full overflow-hidden border border-slate-900">
          <div className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 h-full w-2/3 rounded-full animate-[shimmer_1.5s_infinite] origin-left"></div>
        </div>
      </div>

      {/* Embedded CSS custom keyframes for shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SkeletonLoader;
