import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  investigateIpApi, investigateDomainApi, investigateUrlApi, 
  investigateHashApi, bookmarkIocApi, downloadInvestigationPdfApi
} from '../services/investigationService.js';
import { 
  Shield, Globe, Key, Link2, MapPin, Database, Bookmark, AlertTriangle, 
  Activity, CheckCircle, ShieldAlert, AlertCircle, Clock, Loader2, Sparkles, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

// Define individual schemas
const ipSchema = z.object({ query: z.string().ip('Invalid IP format (must be IPv4 or IPv6)') });
const domainSchema = z.object({ query: z.string().min(1, 'Domain is required').regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format') });
const urlSchema = z.object({ query: z.string().url('Invalid URL format (include protocol like https://)') });
const hashSchema = z.object({ 
  query: z.string().min(1, 'File hash is required').custom(val => {
    const len = val.length;
    const isHex = /^[a-fA-F0-9]+$/.test(val);
    return isHex && (len === 32 || len === 40 || len === 64);
  }, 'Hash must be MD5 (32 chars), SHA-1 (40 chars), or SHA-256 (64 chars) hex string')
});

export const Investigate = () => {
  const [activeTab, setActiveTab] = useState('ip');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  
  // Bookmark Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookmarkTags, setBookmarkTags] = useState('');
  const [bookmarkNotes, setBookmarkNotes] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // PDF report downloader
  const handleDownloadPDF = async () => {
    if (!result?.id) {
      toast.error('Investigation session ID missing.');
      return;
    }
    setPdfDownloading(true);
    try {
      const data = await downloadInvestigationPdfApi(result.id);
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ThreatReport-${activeTab}-${currentQuery}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF report exported successfully.');
    } catch (err) {
      toast.error('Failed to export PDF report.');
    } finally {
      setPdfDownloading(false);
    }
  };

  // Setup tab configurations
  const tabs = {
    ip: { label: 'IP Address', icon: Globe, schema: ipSchema, placeholder: '8.8.8.8' },
    domain: { label: 'Domain Name', icon: Shield, schema: domainSchema, placeholder: 'malicious-domain.com' },
    url: { label: 'URL Address', icon: Link2, schema: urlSchema, placeholder: 'https://malicious-banking.ru/login' },
    hash: { label: 'File Hash', icon: Key, schema: hashSchema, placeholder: 'd41d8cd98f00b204e9800998ecf8427e' }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(tabs[activeTab].schema)
  });

  // Switch tabs handler
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setResult(null);
    reset();
  };

  // Submit scan handler
  const onSubmit = async (data, tabOverride) => {
    const currentTab = tabOverride || activeTab;
    setLoading(true);
    setResult(null);
    setCurrentQuery(data.query);
    try {
      let response;
      if (currentTab === 'ip') response = await investigateIpApi(data.query);
      else if (currentTab === 'domain') response = await investigateDomainApi(data.query);
      else if (currentTab === 'url') response = await investigateUrlApi(data.query);
      else if (currentTab === 'hash') response = await investigateHashApi(data.query);

      if (response.success) {
        setResult(response.data);
        toast.success('Investigation completed successfully.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lookup execution failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Trigger auto scan from search parameters on mount
  useEffect(() => {
    const query = searchParams.get('query');
    const type = searchParams.get('type');

    if (query && type && tabs[type]) {
      setActiveTab(type);
      reset({ query });
      setCurrentQuery(query);
      
      // Execute submit passing type override
      onSubmit({ query }, type);
      
      // Flush params so page reloads don't loop scans
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Bookmark submission handler
  const handleBookmarkSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ioc: currentQuery,
        type: activeTab,
        description: bookmarkNotes,
        tags: bookmarkTags.split(',').map(t => t.trim()).filter(t => t !== '')
      };
      const res = await bookmarkIocApi(payload);
      if (res.success) {
        toast.success('Indicator bookmarked successfully.');
        setModalOpen(false);
        setBookmarkTags('');
        setBookmarkNotes('');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save bookmark.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight text-slate-100">
          IOC Threat Scanner
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-1">
          PERFORM MULTI-SOURCE CYBER INTELLIGENCE LOOKUPS
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-900 pb-px">
        {Object.keys(tabs).map((tabKey) => {
          const TabIcon = tabs[tabKey].icon;
          return (
            <button
              key={tabKey}
              onClick={() => handleTabChange(tabKey)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-mono tracking-wider transition duration-150 cursor-pointer ${
                activeTab === tabKey
                  ? 'border-sky-500 text-sky-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tabs[tabKey].label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-900 glow-blue">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full relative">
            <input
              type="text"
              placeholder={`Enter indicator (e.g. ${tabs[activeTab].placeholder})`}
              {...register('query')}
              className={`w-full bg-slate-950/80 border ${
                errors.query ? 'border-rose-500/40 focus:border-rose-500' : 'border-slate-800 focus:border-sky-500'
              } text-sm px-4 py-3 rounded-xl focus:ring-1 focus:ring-sky-500/20 outline-none transition duration-200 text-slate-200 placeholder-slate-600`}
            />
            {errors.query && (
              <p className="text-[10px] font-mono text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.query.message}</span>
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold py-3 px-8 rounded-xl shadow-lg transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Scan Indicator</span>}
          </button>
        </form>
      </div>

      {/* Searching Loader Screen */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 select-none">
          <div className="relative flex items-center justify-center w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-sky-500/10 border border-sky-500/30 animate-ping"></div>
            <div className="relative p-4 bg-slate-900 rounded-xl border border-sky-500/30 text-sky-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          </div>
          <p className="text-xs font-mono text-slate-400 animate-pulse">Running CTI engine pipelines...</p>
        </div>
      )}

      {/* Result Display Grid */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          
          {/* Reputation summary panel */}
          <div className="glass-card rounded-2xl p-6 border border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl border ${
                result.virustotal?.malicious > 0 || result.abuse?.abuseConfidenceScore > 20
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {result.virustotal?.malicious > 0 || result.abuse?.abuseConfidenceScore > 20
                  ? <ShieldAlert className="w-8 h-8" />
                  : <CheckCircle className="w-8 h-8" />
                }
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">TELEMETRY CONCLUSION</span>
                <h3 className="text-xl font-display font-extrabold text-slate-100">
                  {result.virustotal?.malicious > 0 || result.abuse?.abuseConfidenceScore > 20
                    ? 'POTENTIALLY MALICIOUS INDICATOR'
                    : 'CLEAN INDICATOR / UNREPORTED'
                  }
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Scanned: <span className="font-mono text-slate-300 font-bold">{currentQuery}</span>
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={pdfDownloading}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-sky-500/20 hover:bg-slate-950/80 px-5 py-3 rounded-xl text-xs font-mono text-slate-200 transition duration-150 cursor-pointer disabled:opacity-50"
              >
                {pdfDownloading ? <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> : <Download className="w-4 h-4 text-sky-400" />}
                <span>{pdfDownloading ? 'Exporting PDF...' : 'Export PDF Report'}</span>
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-sky-500/20 hover:bg-slate-950/80 px-5 py-3 rounded-xl text-xs font-mono text-slate-200 transition duration-150 cursor-pointer"
              >
                <Bookmark className="w-4 h-4 text-sky-400" />
                <span>Save IOC to watchlist</span>
              </button>
            </div>
            
          </div>

          {/* Details Section Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* VT Analysis widget */}
            {result.virustotal && (
              <div className="bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2 border-b border-slate-900 pb-3">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>VirusTotal Engine Scan Summary</span>
                </h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Detection Ratio</p>
                    <p className="text-2xl font-display font-black text-slate-200">
                      {result.virustotal.malicious} <span className="text-sm text-slate-500">/ {result.virustotal.harmless + result.virustotal.malicious + result.virustotal.suspicious + result.virustotal.undetected} engines</span>
                    </p>
                  </div>
                  <div className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold ${
                    result.virustotal.malicious > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {result.virustotal.malicious > 0 ? 'SUSPICIOUS' : 'SAFE'}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                    <span className="text-[9px] font-mono text-slate-500 block">MALICIOUS</span>
                    <span className="text-sm font-mono font-bold text-rose-500">{result.virustotal.malicious}</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                    <span className="text-[9px] font-mono text-slate-500 block">SUSPICIOUS</span>
                    <span className="text-sm font-mono font-bold text-orange-500">{result.virustotal.suspicious}</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                    <span className="text-[9px] font-mono text-slate-500 block">UNDETECTED</span>
                    <span className="text-sm font-mono font-bold text-slate-400">{result.virustotal.undetected}</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                    <span className="text-[9px] font-mono text-slate-500 block">HARMLESS</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">{result.virustotal.harmless}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Geolocation widget (Only for IP) */}
            {activeTab === 'ip' && result.geolocation && (
              <div className="bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2 border-b border-slate-900 pb-3">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>IP Geolocation Parameters</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Coordinates</span>
                    <p className="text-xs font-semibold text-slate-300">
                      Lat: {result.geolocation.latitude}, Lon: {result.geolocation.longitude}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Country Link</span>
                    <p className="text-xs font-semibold text-slate-300">
                      {result.geolocation.countryName} ({result.geolocation.countryCode})
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">City & Region</span>
                    <p className="text-xs font-semibold text-slate-300">
                      {result.geolocation.city || 'N/A'}, {result.geolocation.regionName || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Carrier ISP</span>
                    <p className="text-xs font-semibold text-slate-300 truncate">
                      {result.geolocation.isp || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AbuseIPDB widget (Only for IP) */}
            {activeTab === 'ip' && result.abuse && (
              <div className="bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2 border-b border-slate-900 pb-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span>AbuseIPDB Threat Reputation</span>
                </h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Abuse Confidence Score</p>
                    <p className="text-3xl font-display font-extrabold text-slate-200">
                      {result.abuse.abuseConfidenceScore}%
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                    result.abuse.abuseConfidenceScore > 10 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {result.abuse.abuseConfidenceScore > 20 ? 'RISK HIGH' : 'RISK LOW'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-900/60">
                  <p>Total Reports: <span className="text-slate-200">{result.abuse.totalReports || 0}</span></p>
                  <p>Domain: <span className="text-slate-200">{result.abuse.domain || 'N/A'}</span></p>
                </div>
              </div>
            )}

            {/* OTX Pulses widget */}
            {result.otx && (
              <div className="lg:col-span-2 bg-[#0b0f19]/30 border border-slate-900 rounded-2xl p-6">
                <h3 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>AlienVault OTX Community Pulse Matches ({result.otx.pulseCount || 0})</span>
                </h3>

                {(!result.otx.pulses || result.otx.pulses.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No community pulse indicators mapped.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {result.otx.pulses.map((pulse, index) => (
                      <div key={index} className="p-3.5 bg-slate-950/20 border border-slate-900/60 rounded-xl hover:border-slate-800 transition duration-150">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-xs font-semibold text-slate-200 leading-tight">
                            {pulse.name}
                          </h4>
                          <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(pulse.created).toLocaleDateString([], {month: 'short', year: 'numeric'})}
                          </span>
                        </div>
                        {pulse.tags && pulse.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {pulse.tags.slice(0, 5).map((tag, tIdx) => (
                              <span key={tIdx} className="text-[8px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded border border-slate-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </motion.div>
      )}

      {/* Bookmark Save Indicator Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-[#000]/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0f19] border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative glow-blue"
            >
              <h3 className="text-lg font-display font-extrabold text-slate-100 flex items-center gap-2 mb-2">
                <Bookmark className="w-5 h-5 text-sky-400" />
                <span>Bookmark IOC to watchlist</span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mb-6 uppercase">
                Query: {currentQuery} ({activeTab})
              </p>

              <form onSubmit={handleBookmarkSubmit} className="space-y-4">
                
                {/* Notes Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 block uppercase">
                    Description Notes
                  </label>
                  <textarea
                    placeholder="Enter analyst investigation notes or context..."
                    value={bookmarkNotes}
                    onChange={(e) => setBookmarkNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950/80 border border-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:border-sky-500 text-slate-200 placeholder-slate-700 resize-none"
                    required
                  />
                </div>

                {/* Tags Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 block uppercase">
                    Investigation Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="malware, log4j, beacon"
                    value={bookmarkTags}
                    onChange={(e) => setBookmarkTags(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:border-sky-500 text-slate-200 placeholder-slate-700"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-900/60">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition duration-150 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{saving ? 'Saving...' : 'Confirm Save'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Investigate;
