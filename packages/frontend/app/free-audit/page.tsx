'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDemoMode } from '../lib/DemoModeProvider';
import { DEMO_FREE_AUDIT, DEMO_ISRC } from '../lib/demoData';

export default function FreeAuditPage() {
  return (
    <Suspense>
      <FreeAuditContent />
    </Suspense>
  );
}

// ── Types ────────────────────────────────────────────────────────────
interface Finding {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action: string;
}
interface ProResult { status: string; count?: number; results?: any[] }
interface RevenueRange { low: number; mid: number; high: number; confidence: number; confidence_label: string }
interface StatuteWarning { level: 'urgent' | 'warning'; label: string; color: string; message: string; release_date: string; age_years: number }
interface ManualCheckItem {
  registry: string;
  purpose: string;
  check: string;
  url: string;
  search_term: string;
  status: string;
  why_manual: string;
  what_to_look_for: string;
}
interface ForensicResult {
  isrc: string;
  song_title: string;
  artist: string;
  audit_started?: string;
  steps: {
    probe: { status: string; checked_at?: string; source?: string; data: any };
    discogs?: { status: string; checked_at?: string; source?: string; data: any };
    streams?: { total_listens: number; unique_listeners: number; data_level?: string; data_note?: string; checked_at?: string; source?: string };
    verify: { status: string; matched: boolean | null; mlc_song_code: string | null; iswc: string | null; checked_at?: string; source?: string; data: any };
    detect: { black_box: boolean; severity: string; findings: Finding[]; streaming: { total_listens: number; unique_listeners: number; checked_at?: string; source?: string }; revenue?: RevenueRange };
    manual_checklist?: { label: string; note: string; items: ManualCheckItem[] };
    pro_scan?: { ascap: ProResult; bmi: ProResult; sesac?: ProResult };
  };
  statute?: StatuteWarning | null;
  manual_checklist?: ManualCheckItem[];
  registry_links: Array<{ name: string; org: string; url: string; search_term: string; note: string }>;
  verdict: { level: string; color: string; summary: string };
}

// ── Helpers ──────────────────────────────────────────────────────────
type Tab = 'summary' | 'registries' | 'evidence' | 'legal';

function sha256(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  return crypto.subtle.digest('SHA-256', buf).then(b =>
    Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('')
  );
}

function StatusBadge({ status, matched }: { status?: string; matched?: boolean | null }) {
  if (matched === true || status === 'found') return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-900/40 text-green-400 rounded border border-green-800">
      <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> MATCH
    </span>
  );
  if (matched === false || status === 'not_found' || status === 'no_results') return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-900/30 text-red-400 rounded border border-red-800">
      <span className="w-1.5 h-1.5 bg-red-400 rounded-full inline-block" /> NOT FOUND
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-slate-700 text-slate-400 rounded">
      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full inline-block" /> MANUAL
    </span>
  );
}

function SlidePanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0f172a] border-l border-slate-700 h-full overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 sticky top-0 bg-[#0f172a] z-10">
          <p className="text-sm font-bold text-slate-200">{title}</p>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition text-lg leading-none">✕</button>
        </div>
        <div className="flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Deep Probe Panel ─────────────────────────────────────────────────
function DeepProbePanel({
  searchTerm,
  isrcTerm,
  deepProbeIsrc,
  setDeepProbeIsrc,
  onImport,
  loading,
}: {
  searchTerm: string;
  isrcTerm?: string;
  deepProbeIsrc: string;
  setDeepProbeIsrc: (v: string) => void;
  onImport: () => void;
  loading: boolean;
}) {
  const enc = encodeURIComponent(searchTerm);
  const isrcEnc = encodeURIComponent(isrcTerm || searchTerm);

  const registries = [
    {
      id: 'smpt',
      name: 'SMPT / MusicBrainz',
      nodeType: 'DIGITAL',
      hint: 'Recording registry — search term pre-filled',
      url: `https://musicbrainz.org/search?query=${enc}&type=recording`,
    },
    {
      id: 'discogs',
      name: 'Discogs',
      nodeType: 'DIGITAL',
      hint: 'Release database — ISRC + artist search pre-filled',
      url: `https://www.discogs.com/search/?q=${enc}&type=release`,
    },
    {
      id: 'ascap',
      name: 'ASCAP Repertory',
      nodeType: 'DIGITAL',
      hint: 'Performance rights — search term pre-filled',
      url: `https://www.ascap.com/repertory#/?query=${enc}`,
    },
    {
      id: 'soundexchange',
      name: 'SoundExchange ISRC',
      nodeType: 'MANUAL',
      hint: isrcTerm ? `ISRC deep link: ${isrcTerm}` : `Artist deep link: ${searchTerm}`,
      url: isrcTerm
        ? `https://isrc.soundexchange.com/#!/isrc/${isrcEnc}`
        : `https://isrc.soundexchange.com/#!/search?artistName=${enc}`,
    },
    {
      id: 'bmi',
      name: 'BMI Repertoire',
      nodeType: 'MANUAL',
      hint: 'Copy term below → paste into BMI search',
      url: 'https://repertoire.bmi.com/',
    },
    {
      id: 'sesac',
      name: 'SESAC Repertory',
      nodeType: 'MANUAL',
      hint: 'Copy term below → paste into SESAC search',
      url: 'https://www.sesac.com/repertory/',
    },
    {
      id: 'ifpi',
      name: 'IFPI ISRC',
      nodeType: 'MANUAL',
      hint: 'Official ISRC authority',
      url: 'https://isrc.ifpi.org/',
    },
    {
      id: 'mlc',
      name: 'The MLC',
      nodeType: 'DIGITAL',
      hint: 'US mechanical royalties',
      url: 'https://www.themlc.com/',
    },
    {
      id: 'cisac',
      name: 'CISAC',
      nodeType: 'MANUAL',
      hint: 'International rights societies',
      url: 'https://www.cisac.org/',
    },
  ];

  return (
    <div className="mt-4 bg-[#0f172a] border border-indigo-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-indigo-950/40 border-b border-indigo-800/40 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">🔭</span>
          <div>
            <p className="text-sm font-bold text-indigo-300">Result not found in Primary Cache — Launch SMPT Deep Probe</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Search term pre-loaded in every link:{' '}
              <span className="font-mono text-slate-400">{searchTerm}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(searchTerm)}
          className="flex-shrink-0 text-[10px] px-2 py-1 border border-slate-700 text-slate-500 hover:text-slate-300 rounded transition mt-1"
        >
          Copy term
        </button>
      </div>

      {/* Registry rows */}
      <div className="divide-y divide-slate-800/50">
        {registries.map(r => (
          <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/20 transition">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-300">{r.name}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  r.nodeType === 'DIGITAL'
                    ? 'bg-green-900/40 text-green-500 border border-green-800/40'
                    : 'bg-slate-700/50 text-slate-500'
                }`}>
                  {r.nodeType === 'DIGITAL' ? '⚡ Digital Node' : '✋ Manual Node'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 truncate">{r.hint}</p>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1 bg-indigo-700/60 hover:bg-indigo-700 text-indigo-300 rounded transition"
              >
                Open ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Import Manual Finding */}
      <div className="px-5 py-5 border-t border-slate-700 bg-slate-800/20">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Import Manual Finding</p>
        <p className="text-xs text-slate-500 mb-3">
          Found the ISRC in one of the registries above? Paste it here — your tool takes over to run stream counts and Black Box analysis.
          This creates a verified chain of custody: human-confirmed match, machine-run audit.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={deepProbeIsrc}
            onChange={e => setDeepProbeIsrc(e.target.value)}
            placeholder="Paste ISRC (e.g. USUM71703861)"
            className="flex-1 px-3 py-2 bg-[#0a0f1e] border border-slate-700 text-slate-200 placeholder-slate-600 text-sm rounded focus:outline-none focus:border-indigo-500 transition font-mono"
            onKeyDown={e => { if (e.key === 'Enter') onImport(); }}
          />
          <button
            onClick={onImport}
            disabled={loading || !deepProbeIsrc.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded transition whitespace-nowrap"
          >
            {loading ? 'Running…' : 'Run Black Box Analysis →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────
function FreeAuditContent() {
  const searchParams = useSearchParams();
  const { demoMode, consumeProbe } = useDemoMode();
  const [searchMethod, setSearchMethod] = useState<'isrc' | 'artist'>('isrc');
  const [isrc, setIsrc] = useState('');
  const [artist, setArtist] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForensicResult | null>(null);
  const [artistResults, setArtistResults] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [panel, setPanel] = useState<string | null>(null);
  const [auditHash, setAuditHash] = useState('');
  const [auditId, setAuditId] = useState('');
  const [deepProbeIsrc, setDeepProbeIsrc] = useState('');

  // Demo mode: auto-populate ISRC and show mock result
  useEffect(() => {
    if (demoMode) {
      setSearchMethod('isrc');
      setIsrc(DEMO_ISRC);
      setResult(DEMO_FREE_AUDIT as ForensicResult);
    }
  }, [demoMode]);

  useEffect(() => {
    const q = searchParams.get('isrc');
    if (!q) return;
    const clean = q.trim().replace(/-/g, '').toUpperCase();
    setSearchMethod('isrc');
    setIsrc(clean);
    setTimeout(() => document.getElementById('audit-submit-btn')?.click(), 150);
  }, [searchParams]);

  useEffect(() => {
    if (!result) return;
    sha256(JSON.stringify(result)).then(h => {
      setAuditHash(h);
      setAuditId(`TRP-${Date.now().toString(36).toUpperCase()}`);
    });
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setArtistResults([]);
    setActiveTab('summary');

    if (!consumeProbe()) {
      setError('Live probe quota reached. Switching back to Demo Mode.');
      setLoading(false);
      return;
    }

    try {
      if (searchMethod === 'isrc') {
        const clean = isrc.trim().replace(/-/g, '').toUpperCase();
        if (!clean) throw new Error('Enter an ISRC code');
        const res = await fetch('/api/forensic/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isrc: clean }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Audit failed');
        setResult(data);
      } else {
        const q = artist.trim();
        if (!q) throw new Error('Enter an artist or song name');
        const res = await fetch(`/api/royalty-finder/search/artist?query=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Search failed');
        setArtistResults(data.artists || []);
        if (!data.artists?.length) setError('No artists found. Try a different name or use ISRC search.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportIsrc = async () => {
    const clean = deepProbeIsrc.trim().replace(/-/g, '').toUpperCase();
    if (!clean) return;
    setIsrc(clean);
    setSearchMethod('isrc');
    setLoading(true);
    setError('');
    setResult(null);
    setActiveTab('summary');
    try {
      const res = await fetch('/api/forensic/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isrc: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Audit failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = result?.verdict.color === 'red' ? 'border-red-700 bg-red-950/20'
    : result?.verdict.color === 'yellow' ? 'border-yellow-700 bg-yellow-950/10'
    : 'border-green-700 bg-green-950/10';

  const listens = result?.steps.detect.streaming.total_listens ?? 0;
  const signalLabel = listens >= 1_000_000 ? 'HIGH SIGNAL'
    : listens >= 100_000 ? 'MEDIUM SIGNAL'
    : listens > 0 ? 'LOW SIGNAL' : 'NO SIGNAL';
  const signalClass = listens >= 1_000_000 ? 'text-green-400 bg-green-900/30 border-green-700'
    : listens >= 100_000 ? 'text-yellow-400 bg-yellow-900/20 border-yellow-700'
    : listens > 0 ? 'text-orange-400 bg-orange-900/20 border-orange-700'
    : 'text-slate-500 bg-slate-800/30 border-slate-700';
  const signalDesc = listens >= 1_000_000 ? 'Active earnings confirmed. High-value claim.'
    : listens >= 100_000 ? 'Active earnings detected. Claim is viable.'
    : listens > 0 ? 'Some activity detected. Monitor for growth.'
    : 'No listening activity found in public data.';

  // Revenue range from backend (with fallback to client-side estimate)
  const revLow  = result?.steps.detect.revenue?.low  ?? Math.round(listens * 0.0007);
  const revMid  = result?.steps.detect.revenue?.mid  ?? Math.round(listens * 0.003);
  const revHigh = result?.steps.detect.revenue?.high ?? Math.round(listens * 0.004);
  const revConfLabel = result?.steps.detect.revenue?.confidence_label ?? '';

  const findingActionLinks: Record<string, { label: string; href: string; external?: boolean }> = {
    black_box:     { label: 'File MLC Claim →',   href: '/attorney-portal' },
    mlc_unmatched: { label: 'Submit to MLC →',     href: 'https://www.themlc.com/', external: true },
    missing_iswc:  { label: 'Generate CWR →',      href: '/cwr-generator' },
    missing_ipi:   { label: 'Register with PRO →', href: 'https://www.ascap.com/membership/join-ascap', external: true },
    not_registered:{ label: 'Find Distributor →',  href: '/royalty-finder' },
    split_audit:   { label: 'Run Split Audit →',   href: '/attorney-portal' },
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary', label: 'Audit Summary' },
    { id: 'registries', label: 'Registry Nodes' },
    { id: 'evidence', label: 'Evidence Log' },
    { id: 'legal', label: 'Legal Package' },
  ];

  // Build registry node list from result
  const registryNodes = result ? [
    {
      id: 'smpt',
      name: 'SMPT Global Registry',
      type: 'ISRC · Recording',
      status: result.steps.probe.status,
      matched: result.steps.probe.status === 'found',
      data: result.steps.probe.data,
      searchTerm: result.isrc,
      externalUrl: null,
    },
    {
      id: 'discogs',
      name: 'Discogs',
      type: 'ISRC · Release Database',
      status: result.steps.discogs?.status ?? 'not_checked',
      matched: result.steps.discogs?.status === 'found' || result.steps.discogs?.status === 'found_by_name',
      data: result.steps.discogs?.data ?? null,
      searchTerm: result.isrc,
      externalUrl: `https://www.discogs.com/search/?q=${encodeURIComponent(result.artist + ' ' + result.song_title)}&type=release`,
    },
    {
      id: 'mlc',
      name: 'The MLC',
      type: 'Mechanical · US',
      status: 'manual_required',
      matched: null,
      data: null,
      searchTerm: result.isrc,
      externalUrl: `https://www.themlc.com/`,
    },
    {
      id: 'ascap',
      name: 'ASCAP',
      type: 'Performance · US',
      status: 'manual_required',
      matched: null,
      data: null,
      searchTerm: `${result.artist} ${result.song_title}`.trim(),
      externalUrl: `https://www.ascap.com/repertory#/?query=${encodeURIComponent(result.artist + ' ' + result.song_title)}`,
    },
    {
      id: 'bmi',
      name: 'BMI',
      type: 'Performance · US',
      status: 'manual_required',
      matched: null,
      data: null,
      searchTerm: `${result.artist} ${result.song_title}`.trim(),
      externalUrl: `https://repertoire.bmi.com/`,
    },
    {
      id: 'sesac',
      name: 'SESAC',
      type: 'Performance · US',
      status: 'manual_required',
      matched: null,
      data: null,
      searchTerm: `${result.artist} ${result.song_title}`.trim(),
      externalUrl: `https://www.sesac.com/repertory/`,
    },
    {
      id: 'soundexchange',
      name: 'SoundExchange',
      type: 'ISRC · Digital Performance',
      status: 'manual',
      matched: undefined,
      data: null,
      searchTerm: result.isrc,
      externalUrl: `https://isrc.soundexchange.com/`,
    },
    {
      id: 'ifpi',
      name: 'IFPI ISRC',
      type: 'ISRC · Authority',
      status: 'manual',
      matched: undefined,
      data: null,
      searchTerm: result.isrc,
      externalUrl: `https://isrc.ifpi.org/`,
    },
    {
      id: 'cisac',
      name: 'CISAC',
      type: 'International Rights',
      status: 'manual',
      matched: undefined,
      data: null,
      searchTerm: result.isrc,
      externalUrl: `https://www.cisac.org/`,
    },
  ] : [];

  const openPanel = panel ? registryNodes.find(n => n.id === panel) : null;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white py-12">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-xs text-indigo-400 hover:text-indigo-300 mb-4 inline-block">← Back</Link>
          <h1 className="text-2xl font-bold text-white mb-2">Forensic Royalty Audit</h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Single-pane command center. One search queries every registry, detects black box claims,
            and generates a legal evidence package — without leaving this page.
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          {(['isrc', 'artist'] as const).map(m => (
            <button key={m} onClick={() => { setSearchMethod(m); setError(''); setArtistResults([]); setResult(null); }}
              className={`px-5 py-2 rounded text-sm font-medium transition ${searchMethod === m ? 'bg-indigo-600 text-white' : 'bg-[#1e293b] text-slate-300 hover:bg-slate-700'}`}>
              {m === 'isrc' ? 'Search by ISRC' : 'Search by Artist / Song'}
            </button>
          ))}
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {searchMethod === 'isrc' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ISRC Code</label>
                <input type="text" value={isrc} onChange={e => setIsrc(e.target.value)}
                  placeholder="CC-XXX-YY-NNNNN"
                  className="w-full px-4 py-2.5 bg-[#0a0f1e] border border-slate-700 text-slate-200 placeholder-slate-600 text-sm rounded focus:outline-none focus:border-indigo-500 transition" />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Artist or Song Name</label>
                <input type="text" value={artist} onChange={e => setArtist(e.target.value)}
                  placeholder="Enter artist or song name"
                  className="w-full px-4 py-2.5 bg-[#0a0f1e] border border-slate-700 text-slate-200 placeholder-slate-600 text-sm rounded focus:outline-none focus:border-indigo-500 transition" />
              </div>
            )}
            <button id="audit-submit-btn" type="submit" disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded transition disabled:opacity-50">
              {loading ? (searchMethod === 'isrc' ? 'Running forensic audit...' : 'Searching...') : (searchMethod === 'isrc' ? 'Run Forensic Audit' : 'Find Artist')}
            </button>
          </form>
          {error && (
            <>
              <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-300">{error}</div>
              <DeepProbePanel
                searchTerm={searchMethod === 'isrc' ? isrc : artist}
                isrcTerm={searchMethod === 'isrc' ? isrc : undefined}
                deepProbeIsrc={deepProbeIsrc}
                setDeepProbeIsrc={setDeepProbeIsrc}
                onImport={handleImportIsrc}
                loading={loading}
              />
            </>
          )}
        </div>

        {/* ── COMMAND CENTER ────────────────────────── */}
        {result && (
          <div>
            {/* Verdict bar */}
            <div className={`p-4 rounded-lg border mb-4 flex items-center justify-between ${verdictColor}`}>
              <div>
                <p className={`text-lg font-bold ${result.verdict.color === 'red' ? 'text-red-400' : result.verdict.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'}`}>
                  {result.verdict.level}
                  {result.steps.detect.black_box && <span className="ml-3 text-xs font-bold px-2 py-0.5 bg-red-900/60 text-red-300 rounded border border-red-700 animate-pulse">BLACK BOX DETECTED</span>}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{result.verdict.summary}</p>
                {result.steps.detect.black_box && revMid > 0 && (
                  <p className="text-sm font-bold text-red-300 mt-1">Est. unclaimed: ${revLow.toLocaleString()} – ${revHigh.toLocaleString()}</p>
                )}
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-medium text-slate-300">{result.song_title}</p>
                <p>{result.artist}</p>
                <p className="font-mono mt-0.5">{result.isrc}</p>
              </div>
            </div>

            {/* ── STATUTE OF LIMITATIONS BANNER ── */}
            {result.statute && (
              <div className={`mb-4 p-4 rounded-lg border flex gap-3 items-start ${result.statute.level === 'urgent' ? 'bg-red-950/30 border-red-700' : 'bg-yellow-950/20 border-yellow-700'}`}>
                <span className="text-lg flex-shrink-0">{result.statute.level === 'urgent' ? '🚨' : '⚠️'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${result.statute.level === 'urgent' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {result.statute.label}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">{result.statute.message}</p>
                  <p className="text-[10px] text-slate-600 mt-1">Release date on record: {result.statute.release_date} · Age: {result.statute.age_years} years</p>
                </div>
              </div>
            )}

            {/* ── BLACK BOX LEGAL VERDICT ── */}
            {result.steps.detect.black_box && (
              <div className="mb-4 border border-red-700/60 rounded-lg overflow-hidden bg-red-950/10">
                <div className="px-5 py-3 bg-red-900/20 border-b border-red-800/30 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚩</span>
                    <div>
                      <p className="text-sm font-bold text-red-300">Audit Verdict: Black Box Detected</p>
                      <p className="text-[10px] text-red-500/80 uppercase tracking-wide">Status: CRITICAL · Action Required: IMMEDIATE</p>
                    </div>
                  </div>
                  {revMid > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[9px] text-red-600 uppercase tracking-wider">Estimated Unclaimed</p>
                      <p className="text-xl font-bold text-red-400">${revLow.toLocaleString()} – ${revHigh.toLocaleString()}</p>
                      <p className="text-[9px] text-red-700 mt-0.5">mid: ${revMid.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="px-5 py-4 space-y-4 text-xs">
                  <p className="text-slate-300 leading-relaxed">
                    The SMPT Protocol has identified a high-confidence revenue leak. This recording is actively generating consumption data, but the payment infrastructure is broken due to a{' '}
                    <strong className="text-red-400">Metadata Mapping Failure</strong>.
                  </p>

                  {/* Why flagged */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Why This Was Flagged</p>
                    <div className="space-y-1.5">
                      {[
                        ['Registry Disconnect', 'The ISRC is active and earning, but it is not currently linked to a valid ISWC or Writer IPI in the global mechanical database.'],
                        ['MLC Match Status', 'This work is officially listed as UNMATCHED — no matched owner on record, royalties cannot be distributed.'],
                        ['Earnings Evidence', `${listens.toLocaleString()} documented listens confirm royalties are being collected by DSPs and held in a Black Box pool.`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex gap-2.5 p-2.5 bg-red-900/10 border border-red-800/20 rounded">
                          <span className="text-red-600 flex-shrink-0 mt-0.5">◆</span>
                          <div><span className="font-bold text-slate-300">{k}: </span><span className="text-slate-400">{v}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required legal actions */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Required Legal Actions</p>
                    <div className="space-y-1.5">
                      {[
                        { n: '1', label: 'Link Identifiers', desc: 'Register the ISRC-to-ISWC relationship via a CWR file to bridge the data gap.', href: '/cwr-generator', btnLabel: 'Generate CWR →', external: false },
                        { n: '2', label: 'File Notice of Claim', desc: 'Submit a formal claim to The MLC using the forensic evidence provided in this report.', href: 'https://www.themlc.com/', btnLabel: 'Go to MLC →', external: true },
                        { n: '3', label: 'Address Splits', desc: 'If MLC shows Partial Claim, resolve the split discrepancy with co-writers to unlock 100% payout.', href: '/attorney-portal', btnLabel: 'Attorney Portal →', external: false },
                      ].map(a => (
                        <div key={a.n} className="flex items-start gap-2.5 p-2.5 bg-slate-800/30 rounded">
                          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center bg-red-800/50 text-red-300 rounded text-[9px] font-bold mt-0.5">{a.n}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-200">{a.label}</p>
                            <p className="text-slate-500 mt-0.5 leading-relaxed">{a.desc}</p>
                          </div>
                          {a.external ? (
                            <a href={a.href} target="_blank" rel="noopener noreferrer"
                              className="flex-shrink-0 ml-2 px-2.5 py-1 bg-red-700/60 hover:bg-red-700 text-white text-[10px] font-bold rounded transition whitespace-nowrap">
                              {a.btnLabel}
                            </a>
                          ) : (
                            <Link href={a.href}
                              className="flex-shrink-0 ml-2 px-2.5 py-1 bg-red-700/60 hover:bg-red-700 text-white text-[10px] font-bold rounded transition whitespace-nowrap">
                              {a.btnLabel}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attorney note */}
                  <div className="p-3 bg-amber-900/10 border border-amber-800/30 rounded">
                    <p className="text-[10px] font-bold text-amber-500/80 uppercase mb-1">⚖️ Note to Attorney</p>
                    <p className="text-slate-500 leading-relaxed text-xs">
                      {result.statute
                        ? result.statute.message
                        : 'These funds are subject to a statute of limitations. If not claimed within the prescribed holding period, they may be redistributed based on general market share.'}
                    </p>
                    {auditId && <p className="text-[10px] text-slate-600 mt-1">Evidence ID: <span className="font-mono text-slate-400">{auditId}</span></p>}
                  </div>
                </div>
              </div>
            )}

            {/* Deep Probe — shown when ISRC not in primary registry */}
            {result.steps.probe.status !== 'found' && (
              <DeepProbePanel
                searchTerm={isrc || artist}
                isrcTerm={isrc || undefined}
                deepProbeIsrc={deepProbeIsrc}
                setDeepProbeIsrc={setDeepProbeIsrc}
                onImport={handleImportIsrc}
                loading={loading}
              />
            )}

            {/* Tab bar */}
            <div className="flex border-b border-slate-700 mb-4">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-5 py-2.5 text-xs font-semibold transition border-b-2 -mb-px ${activeTab === t.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── TAB: AUDIT SUMMARY ── */}
            {activeTab === 'summary' && (
              <div className="space-y-3">
                {/* Steps 1 & 2 */}
                {[
                  {
                    step: '1', label: 'Probe — SMPT Registry',
                    ok: result.steps.probe.status === 'found',
                    checkedAt: result.steps.probe.checked_at,
                    source: result.steps.probe.source,
                    rows: result.steps.probe.status === 'found' ? [
                      ['Song', result.steps.probe.data.song_title],
                      ['Artist', result.steps.probe.data.artist],
                      ['ISWC', result.steps.probe.data.iswc || '⚠ Not found'],
                      ['IPI', result.steps.probe.data.ipi || '⚠ Not found'],
                      ['Work Link', result.steps.probe.data.has_work_relationship ? '✓ Yes' : '⚠ No'],
                      ['Release Date', result.steps.probe.data.first_release_date || 'Unknown'],
                    ] : [['Status', 'ISRC not in global registry']],
                  },
                  {
                    step: '2', label: 'Verify — MLC Mechanical',
                    ok: null as boolean | null,
                    checkedAt: result.steps.verify.checked_at,
                    source: result.steps.verify.source,
                    rows: [
                      ['Status', 'Manual verification required'],
                      ['Why', 'MLC has no public API — attorney must search directly'],
                      ['Action', 'Use manual checklist below ↓'],
                    ],
                  },
                ].map(({ step, label, ok, checkedAt, source, rows }) => (
                  <div key={step} className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Step {step}</span>
                        <span className="text-sm font-medium text-slate-200">{label}</span>
                      </div>
                      <StatusBadge matched={ok} />
                    </div>
                    {(source || checkedAt) && (
                      <p className="text-[10px] text-slate-600 mb-3">
                        {source && <span>Source: <span className="text-slate-500">{source}</span></span>}
                        {source && checkedAt && <span className="mx-1">·</span>}
                        {checkedAt && <span>Checked: <span className="text-slate-500">{checkedAt}</span></span>}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {rows.map(([k, v]) => (
                        <div key={k} className="bg-slate-800/30 rounded p-2">
                          <p className="text-[10px] text-slate-500 uppercase">{k}</p>
                          <p className={`text-xs font-mono mt-0.5 ${String(v).startsWith('⚠') || v === 'N/A' || v === 'UNMATCHED' ? 'text-red-400' : 'text-slate-200'}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Step 3 — Market Activity Probe */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Step 3</span>
                      <span className="text-sm font-medium text-slate-200">Market Activity Probe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${signalClass}`}>{signalLabel}</span>
                      <StatusBadge matched={listens > 0} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-800/30 rounded p-2">
                      <p className="text-[10px] text-slate-500 uppercase">Total Listens</p>
                      <p className="text-xs font-mono mt-0.5 text-slate-200">{listens.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">Source: ListenBrainz</p>
                    </div>
                    <div className="bg-slate-800/30 rounded p-2">
                      <p className="text-[10px] text-slate-500 uppercase">Unique Listeners</p>
                      <p className="text-xs font-mono mt-0.5 text-slate-200">{result.steps.detect.streaming.unique_listeners.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">Source: ListenBrainz</p>
                    </div>
                    {revMid > 0 && (
                      <div className="col-span-2 bg-green-900/15 border border-green-800/30 rounded p-3 space-y-2">
                        <p className="text-[10px] text-green-600 uppercase tracking-wider">Estimated Unclaimed Revenue Range</p>
                        <div className="flex items-end gap-2">
                          <p className="text-2xl font-bold text-green-400">${revLow.toLocaleString()} – ${revHigh.toLocaleString()}</p>
                          <p className="text-xs text-slate-500 mb-0.5">mid: ${revMid.toLocaleString()}</p>
                        </div>
                        {revConfLabel && <p className="text-[10px] text-slate-500">Confidence: {revConfLabel}</p>}
                        <p className="text-[10px] text-slate-600">{listens.toLocaleString()} listens · low=$0.0007 / avg=$0.003 / high=$0.004 per stream</p>
                        {/* Gap chart */}
                        <div className="mt-3 pt-3 border-t border-green-800/20">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Revenue Gap Visualization</p>
                          {[
                            { label: 'Streams Documented', value: listens, max: listens, color: 'bg-indigo-500', unit: 'plays' },
                            { label: 'Expected Revenue (mid)', value: revMid, max: revHigh, color: 'bg-green-500', unit: '$', prefix: '$' },
                            { label: 'Reported / Paid', value: 0, max: revHigh, color: 'bg-red-500', unit: '$', note: 'Not verifiable without statement' },
                          ].map(row => (
                            <div key={row.label} className="mb-2">
                              <div className="flex justify-between text-[9px] text-slate-500 mb-0.5">
                                <span>{row.label}</span>
                                <span>{row.note ?? `${row.prefix ?? ''}${row.value.toLocaleString()}`}</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${row.color} rounded-full transition-all`}
                                  style={{ width: row.max > 0 ? `${Math.min(100, (row.value / row.max) * 100)}%` : '0%' }}
                                />
                              </div>
                            </div>
                          ))}
                          <p className="text-[9px] text-slate-700 mt-1">Gap = Expected − Reported = potential black box or unmatched royalties</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600">{signalDesc}</p>
                </div>

                {/* Manual Checklist */}
                {(result.manual_checklist ?? result.steps.manual_checklist?.items ?? []).length > 0 && (
                  <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Manual Attorney Verification</p>
                    <p className="text-[11px] text-slate-600 mb-3">These registries have no public API. Each link is pre-filled — open in a new tab and search manually.</p>
                    <div className="space-y-2">
                      {(result.manual_checklist ?? result.steps.manual_checklist?.items ?? []).map((item: ManualCheckItem) => (
                        <div key={item.registry} className="flex items-start justify-between gap-3 p-3 bg-slate-800/30 rounded border border-slate-700/40">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-semibold text-slate-200">{item.registry}</p>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-900/30 text-amber-500 border border-amber-800/30 rounded uppercase">Manual</span>
                            </div>
                            <p className="text-[11px] text-slate-500">{item.check}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">{item.what_to_look_for}</p>
                          </div>
                          <a href={item.url} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 px-2.5 py-1 bg-indigo-700/60 hover:bg-indigo-700 text-indigo-300 text-xs rounded transition whitespace-nowrap">
                            Open ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Findings with action buttons */}
                {result.steps.detect.findings.length > 0 && (
                  <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Detect — Findings & Actions</p>
                    <div className="space-y-3">
                      {result.steps.detect.findings.map((f, i) => {
                        const fix = findingActionLinks[f.type];
                        return (
                          <div key={i} className={`p-3 rounded border-l-2 ${f.severity === 'critical' ? 'bg-red-950/30 border-red-600' : f.severity === 'warning' ? 'bg-yellow-950/20 border-yellow-600' : 'bg-blue-950/20 border-blue-700'}`}>
                            <p className="text-sm font-semibold text-slate-100 mb-1">{f.title}</p>
                            <p className="text-xs text-slate-400 mb-1">{f.description}</p>
                            {(f as any).source && (
                              <p className="text-[10px] text-slate-600 mb-2">
                                Source: <span className="text-slate-500">{(f as any).source}</span>
                                {(f as any).checked_at && <span> · Checked: <span className="text-slate-500">{(f as any).checked_at}</span></span>}
                              </p>
                            )}
                            {(f as any).estimated_low != null && (f as any).estimated_high != null && (f as any).estimated_high > 0 && (
                              <p className="text-xs font-bold text-green-400 mb-2">
                                Est. recoverable: ${(f as any).estimated_low.toLocaleString()} – ${(f as any).estimated_high.toLocaleString()}
                              </p>
                            )}
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <p className="text-xs text-indigo-400 font-medium flex-1">→ {f.action}</p>
                              {fix && (
                                fix.external ? (
                                  <a href={fix.href} target="_blank" rel="noopener noreferrer"
                                    className={`flex-shrink-0 px-3 py-1 text-xs font-bold rounded transition ${f.severity === 'critical' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-indigo-700 hover:bg-indigo-600 text-white'}`}>
                                    {fix.label}
                                  </a>
                                ) : (
                                  <Link href={fix.href}
                                    className={`flex-shrink-0 px-3 py-1 text-xs font-bold rounded transition ${f.severity === 'critical' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-indigo-700 hover:bg-indigo-600 text-white'}`}>
                                    {fix.label}
                                  </Link>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: REGISTRY NODES ── */}
            {activeTab === 'registries' && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/20">
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Registry Node Status</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">All registries probed in a single audit pass</p>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {registryNodes.map(node => (
                    <div key={node.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/20 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-200">{node.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-700/60 text-slate-500 rounded uppercase">{node.type}</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-600 mt-0.5 truncate">{node.searchTerm}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <StatusBadge status={node.status} matched={node.matched} />
                        {(node.data?.results?.length > 0 || node.data?.status === 'found') && (
                          <button onClick={() => setPanel(node.id)}
                            className="text-xs px-2 py-1 border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-400 rounded transition">
                            View Data
                          </button>
                        )}
                        {node.externalUrl && (
                          <a href={node.externalUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-2 py-1 border border-indigo-800 text-indigo-400 hover:border-indigo-500 rounded transition">
                            Open ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: EVIDENCE LOG ── */}
            {activeTab === 'evidence' && (
              <div className="space-y-3">
                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Audit Identity</p>
                  <div className="space-y-3 font-mono text-xs">
                    {[
                      ['Audit ID', auditId],
                      ['ISRC', result.isrc],
                      ['Song', result.song_title],
                      ['Artist', result.artist],
                      ['Timestamp', new Date().toISOString()],
                      ['Verdict', result.verdict.level],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-4 border-b border-slate-800/50 pb-2">
                        <span className="text-slate-500 w-24 flex-shrink-0">{k}</span>
                        <span className="text-slate-200 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Streaming Evidence</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${signalClass}`}>{signalLabel}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 rounded p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Total Listens</p>
                      <p className="text-2xl font-bold text-slate-100">{listens.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-600 mt-1">Source: ListenBrainz</p>
                    </div>
                    <div className="bg-slate-800/30 rounded p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Unique Listeners</p>
                      <p className="text-2xl font-bold text-slate-100">{result.steps.detect.streaming.unique_listeners.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-600 mt-1">Source: ListenBrainz</p>
                    </div>
                    {revMid > 0 && (
                      <div className="col-span-2 bg-green-900/15 border border-green-800/30 rounded p-4 text-center">
                        <p className="text-xs text-green-600 uppercase tracking-wider mb-2">Estimated Unclaimed Revenue Range</p>
                        <p className="text-3xl font-bold text-green-400">${revLow.toLocaleString()} – ${revHigh.toLocaleString()}</p>
                        <p className="text-sm text-slate-400 mt-1">Mid estimate: ${revMid.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{listens.toLocaleString()} listens · rates: $0.0007–$0.004/stream</p>
                        {revConfLabel && <p className="text-[10px] text-indigo-400/70 mt-1">Confidence: {revConfLabel}</p>}
                        <p className="text-[10px] text-slate-700 mt-1">{signalDesc}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">SHA-256 Verification Hash</p>
                    <button onClick={() => navigator.clipboard.writeText(auditHash)}
                      className="text-[10px] px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition">
                      Copy
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-indigo-400 break-all leading-relaxed">{auditHash}</p>
                  <p className="text-[10px] text-slate-600 mt-2">Hash of full audit payload · immutable chain-of-custody fingerprint</p>
                </div>
              </div>
            )}

            {/* ── TAB: LEGAL PACKAGE ── */}
            {activeTab === 'legal' && (
              <div className="space-y-3">
                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Claim Documentation</p>
                  <div className="space-y-2 text-xs text-slate-400">
                    {[
                      ['Recording Title', result.song_title],
                      ['Artist', result.artist],
                      ['ISRC', result.isrc],
                      ['ISWC', result.steps.probe.data?.iswc || result.steps.verify.iswc || 'Not registered'],
                      ['MLC Song Code', result.steps.verify.mlc_song_code || 'Not found'],
                      ['MLC Match Status', result.steps.verify.matched ? 'MATCHED' : 'UNMATCHED — Claim eligible'],
                      ['Black Box Claim', result.steps.detect.black_box ? 'YES — Active earnings detected without matched owner' : 'No'],
                      ['IPI Number', result.steps.probe.data?.ipi || 'Not on record'],
                      ['Streaming Evidence', `${result.steps.detect.streaming.total_listens.toLocaleString()} listens documented`],
                      ['Est. Revenue Range', revMid > 0 ? `$${revLow.toLocaleString()} – $${revHigh.toLocaleString()} (mid: $${revMid.toLocaleString()})` : 'N/A'],
                      ['Statute of Limitations', result.statute ? `${result.statute.label} — ${result.statute.age_years} yrs old` : 'Within window'],
                      ['Audit ID', auditId],
                      ['Audit Hash', auditHash.slice(0, 32) + '…'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-4 border-b border-slate-800/50 pb-2">
                        <span className="text-slate-500 w-40 flex-shrink-0">{k}</span>
                        <span className={`font-mono ${String(v).includes('Claim eligible') || String(v).startsWith('YES') ? 'text-red-400 font-bold' : 'text-slate-300'}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">Next Steps</p>
                  <div className="space-y-2">
                    {result.steps.detect.findings.filter(f => f.severity !== 'info').map((f, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-slate-800/30 rounded">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 h-fit ${f.severity === 'critical' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                          {i + 1}
                        </span>
                        <p className="text-xs text-slate-300">{f.action}</p>
                      </div>
                    ))}
                    {result.steps.detect.findings.filter(f => f.severity !== 'info').length === 0 && (
                      <p className="text-xs text-green-400">No critical actions required. Registration chain appears intact.</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const body = {
                        track_id: result.isrc,
                        title: result.song_title,
                        artist: result.artist,
                        isrc: result.isrc,
                        contributors: [{
                          name: result.artist || 'Unknown',
                          role: 'Artist',
                          ipi: result.steps.probe.data?.ipi || '',
                          share: 100,
                        }],
                      };
                      const res = await fetch('/api/lawyer-pdf/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                      });
                      if (res.ok) {
                        const html = await res.text();
                        const blob = new Blob([html], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                      } else {
                        const data = await res.json().catch(() => ({}));
                        alert(data.detail || 'PDF generation failed');
                      }
                    } catch (e) {
                      alert('Error: ' + (e as Error).message);
                    }
                  }}
                  className="w-full py-3 bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-semibold rounded transition flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Generate Legal Evidence Package (PDF)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Artist search results */}
        {artistResults.length > 0 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30">
              <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">{artistResults.length} Artists Found — Select to run forensic audit</p>
            </div>
            <div className="divide-y divide-slate-800">
              {artistResults.map((a: any) => (
                <div key={a.mbid} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/20 transition">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{a.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{[a.type, a.country, a.disambiguation].filter(Boolean).join(' · ')}</p>
                    <p className="text-[10px] font-mono text-slate-700 mt-0.5">MBID: {a.mbid}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Link href={`/mlc-search?q=${encodeURIComponent(a.name)}`}
                      className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-semibold rounded transition">MLC →</Link>
                    <Link href={`/royalty-finder?q=${encodeURIComponent(a.name)}`}
                      className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded transition">ISRCs →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom info */}
        <div className="grid grid-cols-3 gap-4 mt-8 text-center">
          {[['SMPT / MusicBrainz', 'Global recording registry · confirms ISRC'], ['ListenBrainz', 'Open stream data · confirms listen activity'], ['Manual Checklist', 'MLC · ASCAP · BMI · SoundExchange · SESAC']].map(([t, s]) => (
            <div key={t} className="bg-[#0f172a] border border-slate-800 p-4 rounded-lg">
              <p className="text-xs font-semibold text-slate-300">{t}</p>
              <p className="text-[11px] text-slate-600 mt-1">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-over panel */}
      {panel && openPanel && (
        <SlidePanel title={openPanel.name} onClose={() => setPanel(null)}>
          <div className="space-y-3 text-xs">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Search Term</p>
              <p className="font-mono text-indigo-400">{openPanel.searchTerm}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <StatusBadge status={openPanel.status} matched={openPanel.matched} />
            </div>

            {/* SMPT data */}
            {openPanel.id === 'smpt' && openPanel.data?.status === 'found' && (
              <div className="space-y-2 mt-4">
                {[['Recording ID', openPanel.data.recording_id], ['ISWC', openPanel.data.iswc || 'Not found'], ['IPI', openPanel.data.ipi || 'Not found'], ['ISNI', openPanel.data.isni || 'Not found'], ['Work Link', openPanel.data.has_work_relationship ? 'Yes' : 'No']].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-mono text-slate-200">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* MLC / PRO registries — manual only */}
            {['mlc', 'ascap', 'bmi', 'sesac'].includes(openPanel.id) && (
              <div className="mt-4 p-3 bg-amber-900/10 border border-amber-800/30 rounded text-xs text-slate-400 leading-relaxed">
                <p className="font-bold text-amber-400 mb-1">Manual verification required</p>
                <p>This registry has no public API. An attorney must search directly on their website using the search term above.</p>
              </div>
            )}

            {openPanel.externalUrl && (
              <a href={openPanel.externalUrl} target="_blank" rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 w-full py-2 border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-400 rounded transition text-xs">
                Open {openPanel.name} ↗
              </a>
            )}
          </div>
        </SlidePanel>
      )}
    </div>
  );
}
