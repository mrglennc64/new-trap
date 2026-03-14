'use client';
import { useState, useRef } from 'react';
import { useDemoMode } from '../lib/DemoModeProvider';
import Link from 'next/link';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM';
type Status = 'GREEN' | 'YELLOW' | 'RED';

interface Gap {
  type: string;
  severity: Severity;
  message: string;
}

interface ProbeResult {
  isrc: string;
  status: Status;
  song_title?: string;
  artist?: string;
  gaps: Gap[];
  estimated_loss: number;
  details?: {
    recording?: any;
    work?: any;
    artist_identifiers?: { ipi: string | null; isni: string | null };
    listen_stats?: { total_listens: number; unique_listeners: number };
    acr_enriched?: {
      name: string;
      artists: string[];
      album: { title: string | null; label: string | null; cover: string | null };
      iswc: string | null;
      contributors: { name: string; ipi: number | null; roles: string[] }[];
      platforms: { spotify?: string | null; applemusic?: string | null; youtube?: string | null; deezer?: string | null };
    };
  };
  listen_count?: number;
}

interface BatchSummary {
  total_tracks: number;
  clean: number;
  yellow: number;
  red: number;
  gaps_found: number;
  total_estimated_leakage: number;
}

const SEV_COLOR: Record<Severity, string> = {
  CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/40',
  HIGH:     'bg-orange-500/20 text-orange-300 border-orange-500/40',
  MEDIUM:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
};
const SEV_DOT: Record<Severity, string> = {
  CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡',
};

const ACTION_MAP: Record<string, { label: string; href: string }> = {
  LINKAGE_GAP:    { label: 'Register ISRC',       href: '/cwr-generator' },
  ISWC_GAP:       { label: 'Link via CWR',         href: '/cwr-generator' },
  PERCENTAGE_GAP: { label: 'Verify Splits',        href: '/split-verification' },
  IDENTITY_GAP:   { label: 'Add IPI',              href: '/royalty-finder' },
};

// ── Demo Mode: Pre-Indexed Forensic Cache ─────────────────────────────────────
function calcDemoRevenue(viewCount: number, hasIswc: boolean, hasIpi: boolean) {
  const baseRate   = 0.002;
  const rawRevenue = viewCount * baseRate;
  let leakage      = 0;
  if (!hasIswc) leakage += 20;
  if (!hasIpi)  leakage += 11.4;
  const unclaimed  = rawRevenue * (leakage / 100);
  return {
    unclaimed:   Math.round(unclaimed),
    min:         Math.round(unclaimed * 0.85),
    max:         Math.round(unclaimed * 1.15),
    leakage:     leakage.toFixed(1),
    raw_revenue: Math.round(rawRevenue),
  };
}

const DEMO_TRACKS: Record<string, ProbeResult & { _demo: true; _revenue: ReturnType<typeof calcDemoRevenue>; _source: string }> = {
  USSM12200452: (() => {
    const rev = calcDemoRevenue(582_000_000, false, false);
    return {
      _demo: true, _source: 'MusicBrainz + ListenBrainz',
      _revenue: rev,
      isrc: 'USSM12200452',
      status: 'RED',
      gaps: [
        { type: 'ISWC_GAP',       severity: 'CRITICAL', message: 'No ISWC linked to this recording — publishing royalties unroutable.' },
        { type: 'PERCENTAGE_GAP', severity: 'HIGH',     message: '1 of 3 composers missing IPI — est. 33% of publishing share in Black Box.' },
        { type: 'IDENTITY_GAP',   severity: 'HIGH',     message: 'Unidentified Rights Participant — neighboring rights claim cannot be processed.' },
      ],
      estimated_loss: rev.unclaimed,
      details: {
        recording: { title: 'Wait for U (feat. Drake & Tems)', artist: 'Future', source: 'MusicBrainz' },
        work: {
          id: 'demo', title: 'Wait for U', iswc: null,
          writers: [
            { name: 'Nayvadius Wilburn (Future)', role: 'composer', ipi: '00736428519' },
            { name: 'Aubrey Graham (Drake)',       role: 'composer', ipi: '00845219367' },
            { name: 'Temilade Openiyi (Tems)',     role: 'composer', ipi: null          },
          ],
          total_writers: 3, writers_with_ipi: 2,
        },
        listen_stats:       { total_listens: 582_000_000, unique_listeners: 48_200_000 },
        artist_identifiers: { ipi: '00736428519', isni: '0000000122456789' },
      },
    };
  })(),
  USABC2300001: (() => {
    const rev = calcDemoRevenue(12_000_000, false, false);
    return {
      _demo: true, _source: 'MusicBrainz + ListenBrainz',
      _revenue: rev,
      isrc: 'USABC2300001',
      status: 'RED',
      gaps: [
        { type: 'LINKAGE_GAP',    severity: 'CRITICAL', message: 'ISRC not registered in MusicBrainz — recording unlinked from global rights chain.' },
        { type: 'ISWC_GAP',       severity: 'CRITICAL', message: 'No ISWC — 100% of publishing royalties unroutable.' },
        { type: 'PERCENTAGE_GAP', severity: 'HIGH',     message: 'All contributors missing IPI — 100% of publishing share in Black Box.' },
      ],
      estimated_loss: rev.unclaimed,
      details: {
        recording:    { title: 'Demo Track', artist: 'Zaytoven', source: 'MusicBrainz' },
        work:         { id: 'demo', title: 'Demo Track', iswc: null, writers: [], total_writers: 0, writers_with_ipi: 0 },
        listen_stats: { total_listens: 12_000_000, unique_listeners: 3_400_000 },
        artist_identifiers: { ipi: null, isni: null },
      },
    };
  })(),
  USUM71703861: (() => {
    const rev = calcDemoRevenue(1_800_000_000, true, true);
    return {
      _demo: true, _source: 'MusicBrainz + ListenBrainz',
      _revenue: { ...rev, leakage: '0.0', unclaimed: 0, min: 0, max: 0 },
      isrc: 'USUM71703861',
      status: 'GREEN',
      gaps: [],
      estimated_loss: 0,
      details: {
        recording:          { title: "God's Plan", artist: 'Drake', source: 'MusicBrainz' },
        work:               { id: 'demo', title: "God's Plan", iswc: 'T-920.709.502-1', writers: [{ name: 'Aubrey Graham', role: 'composer', ipi: '00845219367' }], total_writers: 1, writers_with_ipi: 1 },
        listen_stats:       { total_listens: 1_800_000_000, unique_listeners: 140_000_000 },
        artist_identifiers: { ipi: '00845219367', isni: '0000000122456789' },
      },
    };
  })(),
};

function StatusBadge({ status }: { status: Status }) {
  const cfg = {
    GREEN:  { bg: 'bg-green-500/20 border-green-500/40',  text: 'text-green-300',  label: '✓ CLEAN' },
    YELLOW: { bg: 'bg-yellow-500/20 border-yellow-500/40', text: 'text-yellow-300', label: '⚠ PARTIAL' },
    RED:    { bg: 'bg-red-500/20 border-red-500/40',      text: 'text-red-300',    label: '✗ CRITICAL' },
  }[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function TrafficLight({ status }: { status: Status }) {
  return (
    <div className="flex flex-col gap-1.5 items-center">
      {(['RED','YELLOW','GREEN'] as Status[]).map(s => (
        <div key={s} className={`w-4 h-4 rounded-full border ${
          status === s
            ? s === 'RED'    ? 'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
            : s === 'YELLOW' ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.8)]'
            :                   'bg-green-500 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
            : 'bg-slate-800 border-slate-700'
        }`} />
      ))}
    </div>
  );
}

export default function GapFinderPage() {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  const { demoMode, setDemoMode, consumeProbe } = useDemoMode();

  // Single probe
  const [singleISRC, setSingleISRC] = useState('');
  const [singleRevenue, setSingleRevenue] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<ProbeResult | null>(null);
  const [singleError, setSingleError] = useState('');

  // Bulk
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<BatchSummary | null>(null);
  const [bulkResults, setBulkResults] = useState<ProbeResult[]>([]);
  const [bulkError, setBulkError] = useState('');
  const [bulkFilter, setBulkFilter] = useState<'ALL' | Status>('ALL');
  const fileRef = useRef<HTMLInputElement>(null);

  const runSingleProbe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError('');
    setSingleResult(null);
    setSingleLoading(true);

    // Demo Mode: use pre-indexed forensic cache instantly
    if (demoMode) {
      const key = singleISRC.trim().toUpperCase().replace(/-/g, '');
      const mock = DEMO_TRACKS[key];
      await new Promise(r => setTimeout(r, 600)); // realistic load feel
      if (mock) setSingleResult(mock);
      else setSingleError('No pre-indexed data for this ISRC in demo cache. Try: USSM12200452 (Future), USUM71703861 (Drake), or USABC2300001 (Zaytoven).');
      setSingleLoading(false);
      return;
    }

    // Consume a live probe — reverts to demo if quota hit
    if (!consumeProbe()) {
      setSingleError('Live probe quota reached. Switching back to Demo Mode.');
      setSingleLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/gap-finder/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isrc: singleISRC.trim(),
          estimated_revenue: parseFloat(singleRevenue) || 0,
        }),
      });
      const data = await res.json();
      if (data.error) setSingleError(data.error);
      else setSingleResult(data);
    } catch { setSingleError('Connection error — check network'); }
    finally { setSingleLoading(false); }
  };

  const runBulkAudit = async () => {
    setBulkError('');
    setBulkSummary(null);
    setBulkResults([]);
    setBulkLoading(true);
    try {
      const res = await fetch('/api/gap-finder/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: bulkText }),
      });
      const data = await res.json();
      if (data.error) setBulkError(data.error);
      else {
        setBulkSummary(data.summary);
        setBulkResults(data.results || []);
      }
    } catch { setBulkError('Connection error'); }
    finally { setBulkLoading(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBulkText(ev.target?.result as string || '');
    reader.readAsText(file);
  };

  const filtered = bulkFilter === 'ALL' ? bulkResults : bulkResults.filter(r => r.status === bulkFilter);

  const exportCSV = () => {
    const rows = [
      ['ISRC', 'Status', 'Track', 'Artist', 'Gaps', 'Est. Loss ($)'],
      ...bulkResults.map(r => [
        r.isrc,
        r.status,
        r.song_title || '',
        r.artist || '',
        r.gaps.map(g => g.type).join(' | '),
        r.estimated_loss.toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `gap-audit-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0f172a]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/" className="text-indigo-400 text-sm hover:underline">← Home</Link>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight">
              ⚡ <span className="text-indigo-400">Gap Finder</span>
            </h1>
            <button
              onClick={() => { setDemoMode(!demoMode); setSingleResult(null); setSingleError(''); setSingleISRC(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition border ${
                demoMode
                  ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {demoMode ? '🎬 DEMO MODE ON' : '🎬 Demo Mode'}
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Triple-Probe audit engine — detects Linkage Gaps, Percentage Gaps, and Identity Gaps
            across MusicBrainz, ListenBrainz, and PRO registries. Built for attorneys & catalog managers.
          </p>
          {demoMode && (
            <div className="mt-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
              <span className="font-black">DEMO MODE ACTIVE</span> — Pulling from Pre-Indexed Forensic Cache. Zero API latency. Perfect for live presentations.
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setMode('single')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition ${mode === 'single' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            🔬 Single Track Probe
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition ${mode === 'bulk' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            📋 Bulk Catalog Audit
          </button>
        </div>

        {/* ── SINGLE MODE ── */}
        {mode === 'single' && (
          <div className="space-y-6">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 text-indigo-300">
                {demoMode ? '🎬 Demo: Pre-Indexed Forensic Cache' : 'Triple-Probe: Single ISRC'}
              </h2>

              {/* Demo quick-select */}
              {demoMode && (
                <div className="mb-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Quick-Load Demo Track</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Future — Wait for U',  isrc: 'USSM12200452', badge: '🔴 CRITICAL' },
                      { label: "Drake — God's Plan",   isrc: 'USUM71703861', badge: '✅ CLEAN' },
                      { label: 'Zaytoven — Demo',      isrc: 'USABC2300001', badge: '🔴 CRITICAL' },
                    ].map(t => (
                      <button
                        key={t.isrc}
                        type="button"
                        onClick={() => setSingleISRC(t.isrc)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                          singleISRC === t.isrc
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500/50'
                        }`}
                      >
                        {t.label}
                        <span className="text-[10px] opacity-70">{t.badge}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={runSingleProbe} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">ISRC *</label>
                    <input
                      type="text"
                      value={singleISRC}
                      onChange={e => setSingleISRC(e.target.value)}
                      placeholder="e.g. USUM71703861"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Est. Annual Revenue (optional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-500">$</span>
                      <input
                        type="number"
                        value={singleRevenue}
                        onChange={e => setSingleRevenue(e.target.value)}
                        placeholder="50000"
                        min="0"
                        className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* What we check */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  {[
                    { icon: '🔴', label: 'Check A', sub: 'Linkage Gap\n(ISRC registered?)' },
                    { icon: '🟠', label: 'Check B', sub: 'Percentage Gap\n(100% claimed?)' },
                    { icon: '🟡', label: 'Check C', sub: 'Identity Gap\n(IPI / ISWC?)' },
                  ].map(c => (
                    <div key={c.label} className="bg-slate-800/40 border border-slate-700 rounded-xl p-3">
                      <div className="text-xl mb-1">{c.icon}</div>
                      <p className="font-bold text-slate-300">{c.label}</p>
                      <p className="text-slate-500 whitespace-pre-line mt-0.5">{c.sub}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={singleLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-xl transition text-sm"
                >
                  {singleLoading ? '🔬 Running Triple-Probe...' : '⚡ Run Gap Probe'}
                </button>
              </form>

              {singleError && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-sm">{singleError}</div>
              )}
            </div>

            {/* Single result */}
            {singleResult && (
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                {/* Result header */}
                <div className="flex items-center gap-4 p-5 border-b border-white/10">
                  <TrafficLight status={singleResult.status} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-black text-lg text-white">
                        {singleResult.song_title || singleResult.isrc}
                      </p>
                      <StatusBadge status={singleResult.status} />
                    </div>
                    {singleResult.artist && (
                      <p className="text-slate-400 text-sm mt-0.5">{singleResult.artist}</p>
                    )}
                    <p className="text-slate-500 font-mono text-xs mt-1">{singleResult.isrc}</p>
                  </div>
                  {singleResult.estimated_loss > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-black text-red-400">${singleResult.estimated_loss.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Est. Annual Loss</p>
                    </div>
                  )}
                </div>

                {/* Gaps */}
                {singleResult.gaps.length > 0 ? (
                  <div>
                    <div className="px-5 py-3 bg-orange-500/5 border-b border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                        {singleResult.gaps.length} Gap{singleResult.gaps.length !== 1 ? 's' : ''} Detected
                      </p>
                    </div>
                    <div className="divide-y divide-white/5">
                      {singleResult.gaps.map((gap, i) => {
                        const action = ACTION_MAP[gap.type];
                        return (
                          <div key={i} className="flex items-center justify-between px-5 py-4 gap-4">
                            <div className="flex items-start gap-3">
                              <span className="text-base mt-0.5">{SEV_DOT[gap.severity as Severity]}</span>
                              <div>
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black border mr-2 ${SEV_COLOR[gap.severity as Severity]}`}>
                                  {gap.severity} — {gap.type.replace(/_/g, ' ')}
                                </span>
                                <p className="text-sm text-slate-300 mt-1">{gap.message}</p>
                              </div>
                            </div>
                            {action && (
                              <Link href={action.href} className="flex-shrink-0 px-3 py-1.5 bg-indigo-700/60 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition">
                                {action.label} →
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-4 flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <p className="text-green-300 font-bold">No gaps detected — fully registered and indexed.</p>
                  </div>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 border-t border-white/5">
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-white">{singleResult.gaps.length}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Gaps</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-indigo-300">
                      {(singleResult.details?.listen_stats?.total_listens || singleResult.listen_count || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">LB Listens</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-white">
                      {singleResult.details?.work?.iswc || '—'}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">ISWC</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-white">
                      {singleResult.details?.artist_identifiers?.ipi || '—'}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Artist IPI</p>
                  </div>
                </div>

                {/* Writers */}
                {singleResult.details?.work?.writers?.length > 0 && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Registered Writers</p>
                    <div className="space-y-2">
                      {singleResult.details?.work?.writers?.map((w: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{w.name} <span className="text-slate-500 text-xs">({w.role})</span></span>
                          {w.ipi
                            ? <span className="text-green-400 font-mono text-xs">IPI: {w.ipi} ✓</span>
                            : <span className="text-red-400 text-xs font-bold">IPI Missing ✗</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACRCloud Enrichment */}
                {singleResult.details?.acr_enriched && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">🎵 ACRCloud Enrichment</p>
                    <div className="flex items-start gap-3 mb-3">
                      {singleResult.details.acr_enriched.album?.cover && (
                        <img src={singleResult.details.acr_enriched.album.cover} alt="cover" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="min-w-0 text-xs space-y-0.5">
                        {singleResult.details.acr_enriched.iswc && (
                          <p className="text-slate-300">
                            <span className="text-slate-500 font-bold uppercase text-[10px]">ISWC </span>
                            <span className="font-mono text-indigo-300">{singleResult.details.acr_enriched.iswc}</span>
                          </p>
                        )}
                        {singleResult.details.acr_enriched.album?.label && (
                          <p className="text-slate-400">
                            <span className="text-slate-500 font-bold uppercase text-[10px]">Label </span>
                            {singleResult.details.acr_enriched.album.label}
                          </p>
                        )}
                      </div>
                    </div>
                    {singleResult.details.acr_enriched.contributors?.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {singleResult.details.acr_enriched.contributors.map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-xs px-3 py-1.5 bg-white/5 rounded-lg">
                            <span className="text-slate-200">{c.name}
                              {c.roles?.length > 0 && <span className="text-slate-500 ml-1.5">{c.roles.join(', ')}</span>}
                            </span>
                            {c.ipi
                              ? <span className="font-mono text-green-400">IPI: {c.ipi} ✓</span>
                              : <span className="text-orange-400 font-bold">No IPI</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {Object.values(singleResult.details.acr_enriched.platforms).some(Boolean) && (
                      <div className="flex flex-wrap gap-2">
                        {singleResult.details.acr_enriched.platforms.spotify && (
                          <a href={singleResult.details.acr_enriched.platforms.spotify} target="_blank" rel="noreferrer" className="px-3 py-1 bg-green-800/40 text-green-300 text-[10px] font-bold rounded-lg border border-green-600/30 hover:bg-green-700/50 transition">Spotify ↗</a>
                        )}
                        {singleResult.details.acr_enriched.platforms.applemusic && (
                          <a href={singleResult.details.acr_enriched.platforms.applemusic} target="_blank" rel="noreferrer" className="px-3 py-1 bg-pink-900/40 text-pink-300 text-[10px] font-bold rounded-lg border border-pink-600/30 hover:bg-pink-800/50 transition">Apple Music ↗</a>
                        )}
                        {singleResult.details.acr_enriched.platforms.youtube && (
                          <a href={singleResult.details.acr_enriched.platforms.youtube} target="_blank" rel="noreferrer" className="px-3 py-1 bg-red-900/40 text-red-300 text-[10px] font-bold rounded-lg border border-red-600/30 hover:bg-red-800/50 transition">YouTube ↗</a>
                        )}
                        {singleResult.details.acr_enriched.platforms.deezer && (
                          <a href={singleResult.details.acr_enriched.platforms.deezer} target="_blank" rel="noreferrer" className="px-3 py-1 bg-slate-700/60 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-500/30 hover:bg-slate-600/60 transition">Deezer ↗</a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Revenue Recovery Dashboard — Demo Mode only */}
                {(singleResult as any)._demo && (singleResult as any)._revenue && (() => {
                  const rev = (singleResult as any)._revenue;
                  const leakageNum = parseFloat(rev.leakage);
                  const leakageSeverity = leakageNum >= 30 ? 'CRITICAL' : leakageNum >= 15 ? 'HIGH' : 'MEDIUM';
                  const leakageColor = leakageNum >= 30 ? 'text-red-400' : leakageNum >= 15 ? 'text-orange-400' : 'text-yellow-400';
                  const leakageBg = leakageNum >= 30 ? 'bg-red-500/10 border-red-500/30' : leakageNum >= 15 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-yellow-500/10 border-yellow-500/30';
                  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toFixed(0)}`;
                  return (
                    <div className={`mx-5 mb-4 rounded-xl border p-5 ${leakageBg}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Revenue Recovery Dashboard</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-3xl font-black text-red-400">${rev.unclaimed.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Current Unclaimed Projection</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-black text-slate-300">
                            {fmt(rev.min)} — {fmt(rev.max)}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Confidence Range (±15%)</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-2xl font-black ${leakageColor}`}>{rev.leakage}%</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">
                            Leakage Rate{' '}
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black border ${leakageNum >= 30 ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-orange-500/20 text-orange-300 border-orange-500/40'}`}>
                              {leakageSeverity}
                            </span>
                          </p>
                        </div>
                      </div>
                      {rev._source && (
                        <p className="text-[10px] text-slate-600 mb-4">Source: {rev._source}</p>
                      )}
                      <Link
                        href={`/free-audit?isrc=${singleResult.isrc}`}
                        className="block w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-center rounded-xl transition text-sm tracking-widest uppercase"
                      >
                        Generate Recovery Directive →
                      </Link>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="px-5 pb-5 pt-2 flex flex-wrap gap-2">
                  <Link href={`/free-audit?isrc=${singleResult.isrc}`} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-lg border border-white/10 transition">
                    🔬 Full Forensic Audit
                  </Link>
                  <Link href="/split-verification" className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/20 transition">
                    📋 Verify Splits
                  </Link>
                  <Link href="/attorney-portal" className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-purple-300 text-xs font-bold rounded-lg border border-purple-500/20 transition">
                    ⚖️ Attorney Portal
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BULK MODE ── */}
        {mode === 'bulk' && (
          <div className="space-y-6">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-1 text-indigo-300">Bulk Catalog Audit</h2>
              <p className="text-slate-500 text-sm mb-4">Paste ISRCs (one per line, or comma-separated) or upload a CSV. Max 100 per batch.</p>

              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                rows={6}
                placeholder={"USUM71703861\nUSRC17607839\nGBUM71500077\n..."}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-xs font-bold rounded-lg hover:bg-white/10 transition"
                >
                  📂 Upload CSV
                </button>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                <span className="text-slate-600 text-xs">
                  {bulkText.split(/[\n,;\s]+/).filter(s => /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/i.test(s.trim())).length} valid ISRCs detected
                </span>
                <button
                  onClick={runBulkAudit}
                  disabled={bulkLoading || !bulkText.trim()}
                  className="ml-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-xl transition text-sm"
                >
                  {bulkLoading ? '⚡ Auditing...' : '⚡ Run Bulk Audit'}
                </button>
              </div>

              {bulkLoading && (
                <div className="mt-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="text-indigo-300 font-bold text-sm">Probing catalog against MusicBrainz...</p>
                      <p className="text-slate-500 text-xs mt-0.5">Each ISRC runs 3 checks — allow ~2s per track to respect rate limits.</p>
                    </div>
                  </div>
                </div>
              )}

              {bulkError && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-sm">{bulkError}</div>
              )}
            </div>

            {/* Executive Summary */}
            {bulkSummary && (
              <>
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Executive Summary</p>
                      <h2 className="text-2xl font-black">Catalog Audit Report</h2>
                      <p className="text-slate-500 text-xs mt-1">{new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</p>
                    </div>
                    <button
                      onClick={exportCSV}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold rounded-lg transition"
                    >
                      ⬇ Export CSV
                    </button>
                  </div>

                  {/* KPI row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-white">{bulkSummary.total_tracks}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Total Tracks</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-green-400">{bulkSummary.clean}</p>
                      <p className="text-[10px] text-green-600 uppercase font-bold mt-1">Clean ✓</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-orange-400">{bulkSummary.yellow + bulkSummary.red}</p>
                      <p className="text-[10px] text-orange-600 uppercase font-bold mt-1">Need Action</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-red-400">${bulkSummary.total_estimated_leakage.toLocaleString()}</p>
                      <p className="text-[10px] text-red-600 uppercase font-bold mt-1">Est. Annual Leakage</p>
                    </div>
                  </div>

                  {/* Visual bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Catalog Health</span>
                      <span>{Math.round((bulkSummary.clean / bulkSummary.total_tracks) * 100)}% clean</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="bg-green-500 h-full transition-all" style={{ width: `${(bulkSummary.clean / bulkSummary.total_tracks) * 100}%` }} />
                      <div className="bg-yellow-400 h-full transition-all" style={{ width: `${(bulkSummary.yellow / bulkSummary.total_tracks) * 100}%` }} />
                      <div className="bg-red-500 h-full transition-all" style={{ width: `${(bulkSummary.red / bulkSummary.total_tracks) * 100}%` }} />
                    </div>
                    <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{bulkSummary.clean} Clean</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />{bulkSummary.yellow} Partial</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{bulkSummary.red} Critical</span>
                    </div>
                  </div>
                </div>

                {/* Results table */}
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm font-bold text-white">Track Results</p>
                    <div className="flex gap-2">
                      {(['ALL','GREEN','YELLOW','RED'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setBulkFilter(f)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black border transition ${
                            bulkFilter === f
                              ? f === 'GREEN'  ? 'bg-green-500/30 border-green-500/50 text-green-300'
                              : f === 'YELLOW' ? 'bg-yellow-500/30 border-yellow-500/50 text-yellow-300'
                              : f === 'RED'    ? 'bg-red-500/30 border-red-500/50 text-red-300'
                              :                  'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'
                          }`}
                        >
                          {f === 'ALL' ? `All (${bulkResults.length})` : f === 'GREEN' ? `✓ Clean (${bulkSummary.clean})` : f === 'YELLOW' ? `⚠ Partial (${bulkSummary.yellow})` : `✗ Critical (${bulkSummary.red})`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-600 uppercase tracking-widest font-black text-[9px]">
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">ISRC</th>
                          <th className="px-4 py-3 text-left">Track / Artist</th>
                          <th className="px-4 py-3 text-left">Gaps</th>
                          <th className="px-4 py-3 text-right">Est. Loss</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filtered.map((r, i) => (
                          <tr key={i} className="hover:bg-white/3 transition">
                            <td className="px-4 py-3">
                              <TrafficLight status={r.status} />
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-400">{r.isrc}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-200">{r.song_title || '—'}</p>
                              {r.artist && <p className="text-slate-500">{r.artist}</p>}
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              {r.gaps.length === 0
                                ? <span className="text-green-500 text-[10px] font-bold">No gaps</span>
                                : r.gaps.map((g, gi) => (
                                    <span key={gi} className={`inline-block mr-1 mb-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${SEV_COLOR[g.severity as Severity]}`}>
                                      {g.type.replace(/_/g, ' ')}
                                    </span>
                                  ))
                              }
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {r.estimated_loss > 0
                                ? <span className="text-red-400 font-bold">${r.estimated_loss.toLocaleString()}</span>
                                : <span className="text-slate-600">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {r.status !== 'GREEN' && (
                                <Link
                                  href={r.status === 'RED' ? '/cwr-generator' : '/split-verification'}
                                  className="px-2 py-1 bg-indigo-700/60 hover:bg-indigo-700 text-white text-[9px] font-black rounded transition"
                                >
                                  Fix →
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length === 0 && (
                      <div className="px-5 py-8 text-center text-slate-500 text-sm">No tracks in this category.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Bottom feature strip */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          {[
            { icon: '🔴', title: 'Linkage Gap', desc: 'ISRC not in registry — track is invisible to DSPs and PROs.' },
            { icon: '🟠', title: 'Percentage Gap', desc: 'Writers missing IPI or no ISWC — portion of publishing share is unclaimed.' },
            { icon: '🟡', title: 'Identity Gap', desc: 'Artist has no IPI/ISNI — SoundExchange neighboring rights claim will fail.' },
          ].map(f => (
            <div key={f.title} className="bg-[#0f172a] border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="font-bold text-sm text-white mb-1">{f.title}</p>
              <p className="text-xs text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
