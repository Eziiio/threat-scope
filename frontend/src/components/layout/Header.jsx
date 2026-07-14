import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, ChevronDown, Activity } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll backend health in header
  useEffect(() => {
    const checkHealth = () => {
      fetch('/api/health')
        .then(res => setBackendOnline(res.ok))
        .catch(() => setBackendOnline(false));
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogoutClick = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-40 select-none">
      
      {/* Title */}
      <div>
        <h2 className="text-sm font-mono font-bold tracking-wider text-slate-500 uppercase">
          SOC Operational Control
        </h2>
      </div>

      {/* Stats/Telemetry and Profile Controls */}
      <div className="flex items-center gap-6">
        
        {/* Connection status badge */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-950/60 border border-slate-900 px-3.5 py-1.5 rounded-lg">
          <Activity className={`w-3.5 h-3.5 ${backendOnline ? 'text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
          <span className="text-[10px] font-mono tracking-wider text-slate-400">
            API Link: {backendOnline ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        {/* User drop down menu */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-900/40 p-1.5 px-3 rounded-xl transition duration-150 border border-transparent hover:border-slate-800/40"
          >
            <img
              src={user?.avatar}
              alt="Avatar"
              className="w-8 h-8 rounded-lg border border-sky-500/20"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
              <p className="text-[9px] font-mono text-slate-500 uppercase">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </div>

          {/* Dropdown Options */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-56 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl py-1.5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              
              <div className="px-4 py-2 border-b border-slate-900/80 mb-1">
                <p className="text-xs font-semibold text-slate-300 truncate">{user?.name}</p>
                <p className="text-[10px] font-mono text-slate-500 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 transition duration-150 text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-sky-400" />
                <span>Operator Profile</span>
              </button>

              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition duration-150 border-t border-slate-900/60 mt-1 text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Portal</span>
              </button>

            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
