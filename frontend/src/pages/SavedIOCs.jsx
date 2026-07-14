import { useState, useEffect, useCallback } from 'react';
import { getSavedIOCsApi, deleteSavedIOCApi } from '../services/savedIOCService.js';
import { 
  Bookmark, Search, Trash2, Shield, Globe, Key, Link2, Copy, 
  ChevronLeft, ChevronRight, Loader2, ArrowUpRight, Check, AlertCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const SavedIOCs = () => {
  const [iocs, setIocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  
  // Filter & Pagination states
  const [searchVal, setSearchVal] = useState('');
  const [typeVal, setTypeVal] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSavedIOCsApi({
        page,
        limit: 10,
        search: searchVal,
        type: typeVal
      });
      if (response.success) {
        setIocs(response.data.iocs);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCount(response.data.pagination.totalCount);
      }
    } catch (error) {
      toast.error('Failed to retrieve saved watchlist indicators.');
    } finally {
      setLoading(false);
    }
  }, [page, searchVal, typeVal]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Copy to clipboard helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete indicator handler
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this indicator from your watchlist?')) {
      try {
        const res = await deleteSavedIOCApi(id);
        if (res.success) {
          toast.success('Indicator removed successfully.');
          fetchWatchlist();
        }
      } catch (err) {
        toast.error('Failed to remove indicator.');
      }
    }
  };

  // Switch type badges styling
  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case 'ip': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'domain': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'url': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'hash': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ip': return Globe;
      case 'domain': return Shield;
      case 'url': return Link2;
      case 'hash': return Key;
      default: return Bookmark;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <span>Indicator Watchlist</span>
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            MONITOR BOOKMARKED TELEMETRY & THREAT SIGNATURES
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono text-slate-400">
          Total Mapped: <span className="font-bold text-sky-400">{totalCount}</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-900 flex flex-col sm:flex-row gap-4 items-center glow-blue">
        
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search indicator or description notes..."
            value={searchVal}
            onChange={(e) => { setSearchVal(e.target.value); setPage(1); }}
            className="w-full bg-slate-950/80 border border-slate-800 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-sky-500 text-slate-200 placeholder-slate-700"
          />
        </div>

        {/* Type select */}
        <div className="w-full sm:w-48">
          <select
            value={typeVal}
            onChange={(e) => { setTypeVal(e.target.value); setPage(1); }}
            className="w-full bg-slate-950/80 border border-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:border-sky-500 text-slate-200 cursor-pointer appearance-none"
          >
            <option value="">All Type Classes</option>
            <option value="ip">IP Addresses</option>
            <option value="domain">Domain Names</option>
            <option value="url">URLs</option>
            <option value="hash">File Hashes</option>
          </select>
        </div>

      </div>

      {/* Main Table view */}
      <div className="glass-card rounded-2xl border border-slate-900 overflow-hidden relative glow-blue">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <p className="text-xs font-mono text-slate-500">Loading Watchlist Entries...</p>
          </div>
        ) : iocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-400">Watchlist Empty</p>
              <p className="text-xs text-slate-600 mt-1">No indicators match selected query bounds.</p>
            </div>
            <Link
              to="/investigate"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold transition duration-150 mt-2"
            >
              Go Scan Indicators
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-mono">
                  <th className="px-6 py-4">Indicator Value</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Analyst Notes</th>
                  <th className="px-6 py-4">Monitoring Tags</th>
                  <th className="px-6 py-4">Saved Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 font-sans">
                {iocs.map((item) => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <tr key={item._id} className="hover:bg-slate-900/10">
                      
                      {/* Indicator String */}
                      <td className="px-6 py-4 font-mono font-bold text-slate-200">
                        <div className="flex items-center gap-2 max-w-[280px] sm:max-w-xs md:max-w-md truncate">
                          <span className="truncate">{item.ioc}</span>
                          <button
                            onClick={() => handleCopy(item.ioc, item._id)}
                            className="text-slate-500 hover:text-slate-300 transition duration-150 cursor-pointer"
                          >
                            {copiedId === item._id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${getTypeBadgeStyle(item.type)}`}>
                          <TypeIcon className="w-3 h-3" />
                          <span>{item.type}</span>
                        </span>
                      </td>

                      {/* Notes description */}
                      <td className="px-6 py-4 text-slate-400 max-w-[240px] truncate">
                        {item.description || <span className="text-slate-700 italic">No notes</span>}
                      </td>

                      {/* Tags pills */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="text-[8px] font-mono px-1.5 py-0.5 bg-slate-950/80 border border-slate-900 text-slate-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length === 0 && <span className="text-slate-700 italic">None</span>}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-500 font-mono">
                        {new Date(item.createdAt).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/investigate?query=${encodeURIComponent(item.ioc)}&type=${item.type}`}
                            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-950 border border-slate-800 hover:border-sky-500/20 text-[10px] text-sky-400 font-mono font-bold px-2.5 py-1.5 rounded-lg transition duration-150 cursor-pointer"
                          >
                            <span>Investigate</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 border border-slate-800 hover:border-rose-500/20 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition duration-150 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer Pagination controls */}
        {!loading && iocs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-900 flex items-center justify-between font-mono text-[10px] text-slate-500 bg-slate-950/10">
            <span>
              Page <span className="font-bold text-slate-300">{page}</span> of <span className="font-bold text-slate-300">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center gap-1 bg-slate-900 hover:bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition duration-150 text-slate-300"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="flex items-center gap-1 bg-slate-900 hover:bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition duration-150 text-slate-300"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default SavedIOCs;
