import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.js';
import { User, Shield, Calendar, Mail, Key, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans cyber-grid flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <div className="glass-card rounded-2xl p-8 border border-slate-800 relative glow-blue shadow-2xl">
          
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-850 pb-8 mb-8 text-center sm:text-left">
            <div className="relative">
              <img
                src={user?.avatar || 'https://ui-avatars.com/api/?name=SOC+Operator&background=0EA5E9&color=fff'}
                alt="Operator Avatar"
                className="w-24 h-24 rounded-2xl border-2 border-sky-500/20 shadow-lg"
              />
              <span className={`absolute -bottom-2 -right-2 p-2 bg-slate-900 border border-slate-800 rounded-xl ${
                user?.role === 'admin' ? 'text-rose-400' : 'text-sky-400'
              }`}>
                <Shield className="w-5 h-5" />
              </span>
            </div>
            <div>
              <span className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md mb-2 ${
                user?.role === 'admin' 
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                  : 'bg-sky-500/10 border border-sky-500/20 text-sky-400'
              }`}>
                {user?.role === 'admin' ? 'SOC Administrator' : 'Security Analyst'}
              </span>
              <h1 className="text-3xl font-display font-extrabold text-slate-100">
                {user?.name || 'SOC Operator'}
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
                Security Clearance Level
              </span>
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-semibold font-display text-slate-200">
                  {user?.role === 'admin' ? 'Level 5 (Admin Control)' : 'Level 2 (Read/Write Analyst)'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
                Operator Enlistment Date
              </span>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold font-display text-slate-200">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* System logs mock */}
          <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-5 font-mono text-[10px] text-slate-400 mb-8 max-h-40 overflow-y-auto">
            <div className="text-slate-500 border-b border-slate-900 pb-2 mb-3 flex items-center justify-between">
              <span className="font-bold">OPERATOR SECURITY AUDIT TRAIL</span>
              <span className="text-[8px] px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">ACTIVE SESSION</span>
            </div>
            <p className="text-emerald-500 mb-1">[ OK ] Handshake completed. JWT signature validated successfully.</p>
            <p className="text-sky-500 mb-1">[ INFO ] Session opened by operator {user?.email} from localhost.</p>
            <p className="text-slate-500">[ INFO ] Access level set to: {user?.role?.toUpperCase()}.</p>
          </div>

          {/* Logout Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs font-mono text-slate-500 hover:text-sky-400 transition duration-150 cursor-pointer"
            >
              ← Return to SOC Terminal
            </button>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 px-6 py-3 rounded-xl font-bold transition duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>De-authenticate operator session</span>
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
