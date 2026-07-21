import { useState, useEffect, useCallback } from 'react';
import { getThreatFeedApi } from '../services/threatFeedService.js';
import {
  Radio, Search, RefreshCw, Clock, ArrowUpRight, ShieldAlert,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const ThreatFeed = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filter & Pagination states
  const [searchVal, setSearchVal] = useState('');
  const [categoryVal, setCategoryVal] = useState('');
  const [severityVal, setSeverityVal] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFeed = useCallback(async (refresh = false) => {
    if (refresh) setSyncing(true);
    else setLoading(true);

    try {
      const response = await getThreatFeedApi({
        page,
        limit: 8,
        search: searchVal,
        category: categoryVal,
        severity: severityVal,
        refresh: refresh ? 'true' : 'false'
      });

      if (response.success) {
        setReports(response.data.reports);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCount(response.data.pagination.totalCount);

        if (refresh) {
          toast.success('Threat intelligence pulses synchronized with AlienVault OTX.');
        }
      }
    } catch (error) {
      toast.error('Failed to retrieve threat intelligence feeds.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [page, searchVal, categoryVal, severityVal]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Sync button handler
  const handleSyncClick = () => {
    setPage(1);
    fetchFeed(true);
  };

  // Helper to extract CVE or indicators from title for investigation
  const extractCVE = (title) => {
    const match = title.match(/CVE-\d{4}-\d{4,}/i);
    return match ? match[0] : null;
  };

  // Badges Styling
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      default: return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    }
  };

  const getCategoryStyle = (category) => {
    switch (category) {
      case 'ransomware': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'zero-day': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'phishing': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'advisory': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <span>Threat Intelligence Feed</span>
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            MONITOR REALTIME GLOBAL CYBER THREAT CAMPAIGNS & ADVISORIES
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/40 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hidden md:block">
            Reports Loaded: <span className="font-bold text-sky-400">{totalCount}</span>
          </div>
          <button
            onClick={handleSyncClick}
            disabled={syncing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition duration-150 cursor-pointer disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{syncing ? 'Syncing OTX Pulses...' : 'Sync OTX Pulses'}</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-900 flex flex-col md:flex-row gap-4 items-center glow-blue">

        {/* Search */}
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search bulletins by title, CVE, or description terms..."
            value={searchVal}
            onChange={(e) => { setSearchVal(e.target.value); setPage(1); }}
            className="w-full bg-slate-950/80 border border-slate-800 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-sky-500 text-slate-200 placeholder-slate-700"
          />
        </div>

        {/* Category select */}
        <div className="w-full md:w-48">
          <select
            value={categoryVal}
            onChange={(e) => { setCategoryVal(e.target.value); setPage(1); }}
            className="w-full bg-slate-950/80 border border-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:border-sky-500 text-slate-200 cursor-pointer appearance-none"
          >
            <option value="">All Categories</option>
            <option value="malware">Malware</option>
            <option value="ransomware">Ransomware</option>
            <option value="zero-day">Zero-Day</option>
            <option value="advisory">Advisory</option>
            <option value="phishing">Phishing</option>
          </select>
        </div>

        {/* Severity select */}
        <div className="w-full md:w-48">
          <select
            value={severityVal}
            onChange={(e) => { setSeverityVal(e.target.value); setPage(1); }}
            className="w-full bg-slate-950/80 border border-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:border-sky-500 text-slate-200 cursor-pointer appearance-none"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

      </div>

      {/* Advisory Feed Card List */}
      <div className="space-y-6">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <p className="text-xs font-mono text-slate-500">Loading Threat Intelligence Pulses...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="glass-card rounded-2xl p-20 border border-slate-900 flex flex-col items-center justify-center gap-4 text-center glow-blue">
            <AlertCircle className="w-10 h-10 text-slate-600 animate-bounce" />
            <div>
              <p className="text-sm font-semibold text-slate-400">Threat Feed Empty</p>
              <p className="text-xs text-slate-600 mt-1">No advisories match query parameter filters.</p>
            </div>
            <button
              onClick={handleSyncClick}
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/20 text-sky-400 px-5 py-2 rounded-xl text-xs font-bold transition duration-150 mt-2"
            >
              Sync Live Pulses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reports.map((report) => {
              const cveMatch = extractCVE(report.title);
              return (
                <div
                  key={report._id}
                  className="glass-card rounded-2xl p-6 border border-slate-900 relative glow-blue flex flex-col justify-between gap-6 hover:border-slate-800/80 transition duration-300"
                >

                  {/* Top Header Card row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${getCategoryStyle(report.category)}`}>
                        {report.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${getSeverityStyle(report.severity)}`}>
                        {report.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-slate-600" />
                        <span>Source: {report.source}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>{new Date(report.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Description Content */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-display font-extrabold text-slate-100 leading-snug">
                      {report.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-5xl">
                      {report.description}
                    </p>
                  </div>

                  {/* Card Action footer */}
                  {cveMatch && (
                    <div className="flex justify-between items-center pt-3 border-t border-slate-900/60 mt-2">
                      <span className="text-[10px] font-mono text-slate-500">
                        CVE matched: <span className="text-purple-400 font-bold">{cveMatch}</span>
                      </span>
                      <Link
                        to={`/investigate?query=${encodeURIComponent(cveMatch)}&type=cve`}
                        className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-purple-500/20 text-[10px] text-purple-400 font-mono font-bold px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer"
                      >
                        <span>Investigate vulnerability indicators</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Pagination Footer */}
      {!loading && reports.length > 0 && (
        <div className="glass-card border border-slate-900 rounded-2xl px-6 py-4 flex items-center justify-between font-mono text-[10px] text-slate-500 glow-blue">
          <span>
            Page <span className="font-bold text-slate-300">{page}</span> of <span className="font-bold text-slate-300">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition duration-150 text-slate-300 font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition duration-150 text-slate-300 font-semibold"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ThreatFeed;
