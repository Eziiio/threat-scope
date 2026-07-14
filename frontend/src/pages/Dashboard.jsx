import { useState, useEffect } from 'react';
import { getDashboardStatsApi } from '../services/dashboardService.js';
import DashboardSkeleton from '../components/DashboardSkeleton.jsx';
import { 
  Shield, AlertTriangle, Search, Bookmark, 
  Terminal, ShieldAlert, Zap, Clock, ChevronRight, RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const data = await getDashboardStatsApi();
      if (data.success) {
        setStats(data.data);
        if (showToast) toast.success('Dashboard metrics updated.');
      }
    } catch (error) {
      toast.error('Failed to load SOC stats telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const { stats: counts, recentReports, activeAlerts, charts } = stats || {};

  // Custom Colors for severity/charts
  const SEVERITY_COLORS = {
    LOW: '#0ea5e9',      // Sky Blue
    MEDIUM: '#eab308',   // Yellow
    HIGH: '#f97316',     // Orange
    CRITICAL: '#ef4444'  // Red
  };

  const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'];

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <span>SOC Control Center</span>
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            REAL-TIME SECURITY ORCHESTRATION & CYBER FEEDS
          </p>
        </div>
        <div>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-950/80 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 transition duration-150 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Console'}</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Investigations */}
        <div className="bg-[#0b0f19]/40 border border-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-32 hover:border-sky-500/20 transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Scans</span>
            <Search className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-extrabold text-slate-100">{counts?.totalInvestigations}</h2>
            <p className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              CTI queries compiled
            </p>
          </div>
        </div>

        {/* KPI 2: Active Alerts */}
        <div className="bg-[#0b0f19]/40 border border-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-32 hover:border-rose-500/20 transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Alerts</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-extrabold text-slate-100">{counts?.highSeverityAlerts}</h2>
            <p className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${counts?.highSeverityAlerts > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`}></span>
              High/Critical status
            </p>
          </div>
        </div>

        {/* KPI 3: Critical CVEs */}
        <div className="bg-[#0b0f19]/40 border border-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-32 hover:border-purple-500/20 transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Critical Vulns</span>
            <ShieldAlert className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-extrabold text-slate-100">{counts?.criticalCVEs}</h2>
            <p className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              Seeded NVD advisories
            </p>
          </div>
        </div>

        {/* KPI 4: Saved IOCs */}
        <div className="bg-[#0b0f19]/40 border border-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-32 hover:border-emerald-500/20 transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Saved Indicators</span>
            <Bookmark className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-extrabold text-slate-100">{counts?.savedIOCsCount}</h2>
            <p className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              IOC monitoring database
            </p>
          </div>
        </div>

      </div>

      {/* Grid: Trends and Severity Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (6 Months) */}
        <div className="lg:col-span-2 bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6">
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <span>Investigation Activity Trend</span>
          </h3>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthlyTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" strokeWidth={1} tickLine={false} />
                <YAxis stroke="#475569" strokeWidth={1} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', color: '#f3f4f6' }}
                  labelStyle={{ fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="investigations" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#areaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Pie Chart */}
        <div className="bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6">
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase mb-6 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Alert Severity Distribution</span>
          </h3>
          <div className="h-72 w-full text-xs relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.severityDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts?.severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#334155'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', color: '#f3f4f6' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Grid: Categories, Sources, and Bookmarks distributions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Category Bar Chart */}
        <div className="bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6">
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase mb-4 block">
            Threat Bulletins by Category
          </h3>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.categoryDistribution}>
                <XAxis dataKey="name" stroke="#475569" strokeWidth={1} tickLine={false} />
                <YAxis stroke="#475569" strokeWidth={1} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid #1e293b' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Bar Chart */}
        <div className="bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6">
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase mb-4 block">
            CTI API Lookup Sources
          </h3>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.topSources}>
                <XAxis dataKey="name" stroke="#475569" strokeWidth={1} tickLine={false} />
                <YAxis stroke="#475569" strokeWidth={1} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid #1e293b' }} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* IOC Donut Chart */}
        <div className="bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6">
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase mb-4 block">
            Saved IOC Indicators Type
          </h3>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.iocDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts?.iocDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid #1e293b' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Grid: Bottom Feed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table 1: Recent Active Alerts */}
        <div className="bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase mb-6 flex items-center justify-between">
              <span>Active Security Alerts</span>
              <span className="text-[10px] text-rose-400 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded">REALTIME</span>
            </h3>
            
            {activeAlerts?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No active alerts logs recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900/60 text-slate-500 font-mono pb-2">
                      <th className="py-2">Incident Alert</th>
                      <th>Severity</th>
                      <th className="text-right">Detected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40">
                    {activeAlerts?.map((alert) => (
                      <tr key={alert._id} className="hover:bg-slate-900/20">
                        <td className="py-3 font-semibold text-slate-200">{alert.title}</td>
                        <td className="py-3">
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            alert.severity === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            alert.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            alert.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-400 font-mono flex items-center justify-end gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(alert.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Table 2: Recent Threat Bulletins */}
        <div className="bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase mb-6 flex items-center justify-between">
              <span>Threat Intelligence Bulletins</span>
              <Link to="/threat-feed" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
                <span>All Feeds</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </h3>

            {recentReports?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No threat bulletins loaded.</p>
            ) : (
              <div className="space-y-4">
                {recentReports?.map((report) => (
                  <div key={report._id} className="flex items-start justify-between gap-4 p-3 bg-slate-950/20 border border-slate-900/60 rounded-xl hover:border-slate-800 transition duration-150">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-900 text-slate-500 border border-slate-800 rounded">
                        {report.category}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-200 leading-tight">
                        {report.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {report.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end justify-between h-full gap-2">
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        report.severity === 'critical' ? 'bg-rose-500/10 text-rose-400' :
                        report.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                        report.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-sky-500/10 text-sky-400'
                      }`}>
                        {report.severity}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(report.publishedAt).toLocaleDateString([], {month:'short', day:'numeric'})}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
