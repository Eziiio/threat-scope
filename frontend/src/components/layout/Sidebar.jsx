import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Search, Bookmark, Radio, User, ChevronLeft, Menu } from 'lucide-react';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: 'SOC Dashboard', path: '/dashboard', icon: Shield },
    { name: 'IOC Investigation', path: '/investigate', icon: Search },
    { name: 'Saved IOCs', path: '/saved-iocs', icon: Bookmark },
    { name: 'Threat Feed', path: '/threat-feed', icon: Radio },
    { name: 'Operator Profile', path: '/profile', icon: User }
  ];

  return (
    <aside
      className={`bg-[#0b0f19] border-r border-slate-900 min-h-screen transition-all duration-300 flex flex-col justify-between relative select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Upper section */}
      <div>
        {/* Brand header */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-900/60 overflow-hidden">
          <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20 text-sky-400 flex-shrink-0 animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          {!collapsed && (
            <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent truncate">
              ThreatScope
            </span>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="mt-6 px-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition duration-150 relative group cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/5 text-sky-400 border border-sky-500/10'
                      : 'text-slate-400 hover:bg-slate-950/40 hover:text-slate-200 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    
                    {/* Glowing Left Border Indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-sky-500 rounded-r-full shadow-[0_0_10px_#0ea5e9]"></span>
                    )}

                    {/* Collapsed Tooltip */}
                    {collapsed && (
                      <span className="absolute left-24 px-3 py-1.5 bg-[#030712] border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 shadow-xl whitespace-nowrap z-50">
                        {item.name}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Minimize Toggle button at bottom */}
      <div className="p-4 border-t border-slate-900/60">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-3 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-900 hover:border-slate-800 p-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition duration-150 cursor-pointer"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs font-mono tracking-wider">Collapse Menu</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
