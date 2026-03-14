'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────
interface TrackResult {
  isrc: string;
  status: string;
  error?: string;
  song_title: string;
  artist: string;
  verdict_level: string;
  verdict_color: string;
  black_box: boolean;
  mlc_matched: boolean;
  listens: number;
  estimated_revenue: number;
  has_iswc: boolean;
  findings_count: number;
  critical_count: number;
}

interface ScanResult {
  label: string;
  total_tracks: number;
  health_score: number;
  leakage_total: number;
  exposure_rate: number;
  actionable_claims: number;
  black_box_count: number;
  tracks: TrackResult[];
}

// ── Helpers ───────────────────────────────────────────────────────────
function parseIsrcs(raw: string): string[] {
  return raw
    .split(/[\n,\t;]+/)
    .map(s => s.trim().replace(/-/g, '').toUpperCase())
    .filter(s => s.length >= 10 && s.length <= 12 && /^[A-Z0-9]+$/.test(s));
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  const label = score >= 80 ? 'HEALTHY' : score >= 50 ? 'AT RISK' : 'CRITICAL';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs font-bold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

function VerdictDot({ color }: { color: string }) {
  const cls = color === 'red' ? 'bg-red-500' : color === 'yellow' ? 'bg-yellow-500' : color === 'green' ? 'bg-green-500' : 'bg-slate-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} flex-shrink-0`} />;
}

// ── Main ──────────────────────────────────────────────────────────────
export default function CatalogScanPage() {
  const [rawInput, setRawInput] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  const parsedCount = parseIsrcs(rawInput).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRawInput(ev.target?.result as string || '');
    reader.readAsText(file);
  };

  const handleScan = async () => {
    const isrcs = parseIsrcs(rawInput);
    if (!isrcs.length) { setError('No valid ISRCs found. Paste ISRCs separated by commas or newlines.'); return; }
    if (isrcs.length > 25) { setError('Maximum 25 ISRCs per scan. Remove extras and try again.'); return; }

    setLoading(true);
    setError('');
    setResult(null);
    setProgress(`Initializing forensic pipeline for ${isrcs.length} tracks…`);

    const interval = setInterval(() => {
      setProgress(p => p.endsWith('…………') ? 'Running SMPT + MLC + ListenBrainz probes…' : p + '…');
    }, 2000);

    try {
      const res = await fetch('/api/catalog-scan/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isrcs, label: label || 'Attorney Catalog Scan' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Scan failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white py-10">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-xs text-indigo-400 hover:text-indigo-300 mb-4 inline-block">← Back</Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Catalog Forensic Scan</h1>
              <p className="text-sm text-slate-400 max-w-xl">
                Upload a list of ISRCs. The pipeline runs every forensic step simultaneously and delivers
                a <strong className="text-slate-300">Summary of Loss</strong> — dollar-value claims ranked by urgency.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-indigo-900/40 border border-indigo-700/50 text-indigo-400 rounded uppercase tracking-widest flex-shrink-0">
              Attorney · Work Product
            </span>
          </div>
        </div>

        {/* Input panel */}
        {!result && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Client / Catalog Label (optional)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g., Metro Boomin Estate — Q1 2026"
                  className="w-full px-3 py-2 bg-[#0a0f1e] border border-slate-700 text-slate-200 placeholder-slate-600 text-sm rounded focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Upload CSV / Text File
                </label>
                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-[#0a0f1e] border border-slate-700 border-dashed text-slate-500 hover:text-slate-300 hover:border-slate-500 text-sm rounded transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Upload .csv or .txt
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="sr-only" />
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Paste ISRCs (comma, newline, or tab separated · max 25)
              </label>
              <textarea
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder={"USUM71703861\nUSUM71800234\nUSUM72004567\n…"}
                rows={6}
                className="w-full px-3 py-2 bg-[#0a0f1e] border border-slate-700 text-slate-200 placeholder-slate-600 text-sm rounded font-mono focus:outline-none focus:border-indigo-500 transition resize-none"
              />
              <p className="text-[11px] text-slate-600 mt-1">
                {parsedCount > 0 ? (
                  <span className={parsedCount > 25 ? 'text-red-400' : 'text-slate-400'}>
                    {parsedCount} valid ISRC{parsedCount !== 1 ? 's' : ''} detected{parsedCount > 25 ? ' — reduce to 25 max' : ''}
                  </span>
                ) : 'No ISRCs detected yet'}
              </p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-300">{error}</div>}

            <button
              onClick={handleScan}
              disabled={loading || parsedCount === 0 || parsedCount > 25}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm rounded transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {progress || 'Running forensic pipeline…'}
                </span>
              ) : `Run Catalog Forensic Scan (${parsedCount} track${parsedCount !== 1 ? 's' : ''})`}
            </button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <div>
            {/* Summary of Loss header */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-6 mb-4">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Summary of Loss — {result.label}</p>
                  <p className="text-3xl font-bold text-red-400">${result.leakage_total.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Total estimated unclaimed revenue across {result.actionable_claims} actionable claim{result.actionable_claims !== 1 ? 's' : ''}</p>
                  {result.black_box_count > 0 && (
                    <p className="text-xs text-red-400 font-bold mt-2">⚠ {result.black_box_count} Black Box detection{result.black_box_count !== 1 ? 's' : ''} — funds actively held in unmatched pool</p>
                  )}
                </div>
                <ScoreRing score={result.health_score} />
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {[
                  { label: 'Total Tracks', value: result.total_tracks.toString(), sub: 'scanned', color: 'text-slate-300' },
                  { label: 'Exposure Rate', value: result.exposure_rate + '%', sub: 'at risk', color: result.exposure_rate > 50 ? 'text-red-400' : result.exposure_rate > 20 ? 'text-yellow-400' : 'text-green-400' },
                  { label: 'Actionable Claims', value: result.actionable_claims.toString(), sub: 'ready to file', color: result.actionable_claims > 0 ? 'text-red-400' : 'text-green-400' },
                  { label: 'Black Box', value: result.black_box_count.toString(), sub: 'detected', color: result.black_box_count > 0 ? 'text-red-400' : 'text-slate-400' },
                ].map(m => (
                  <div key={m.label} className="bg-slate-800/30 rounded p-3">
                    <p className="text-[10px] text-slate-500 uppercase">{m.label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${m.color}`}>{m.value}</p>
                    <p className="text-[10px] text-slate-600">{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* Action sidebar buttons */}
              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-800">
                <Link href="/attorney-portal"
                  className="flex items-center gap-2 px-4 py-2 bg-red-700/80 hover:bg-red-700 text-white text-xs font-bold rounded transition">
                  ⚖️ Generate Letter of Direction
                </Link>
                <Link href="/cwr-generator"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-700/80 hover:bg-indigo-700 text-white text-xs font-bold rounded transition">
                  📋 Generate CWR for Unregistered Works
                </Link>
                <button
                  onClick={() => window.open('/api/lawyer-pdf/generate', '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded transition">
                  📦 Download Evidence ZIP
                </button>
                <button
                  onClick={() => { setResult(null); setRawInput(''); }}
                  className="ml-auto flex items-center gap-1 px-3 py-2 border border-slate-700 text-slate-500 hover:text-slate-300 text-xs rounded transition">
                  ← New Scan
                </button>
              </div>
            </div>

            {/* Ranked claims table */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Claims Ranked by Dollar Value</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Black Box + highest revenue shown first</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{result.total_tracks} records</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {result.tracks.map((t, i) => (
                  <div key={t.isrc} className={`px-5 py-3.5 hover:bg-slate-800/20 transition ${t.black_box ? 'bg-red-950/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <span className="text-xs font-mono text-slate-600 w-5 flex-shrink-0">{i + 1}</span>

                      {/* Status dot */}
                      <VerdictDot color={t.verdict_color} />

                      {/* Track info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-200 truncate">{t.song_title}</p>
                          {t.black_box && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-900/50 text-red-400 border border-red-800/50 rounded uppercase">Black Box</span>
                          )}
                          {!t.mlc_matched && !t.black_box && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-yellow-900/30 text-yellow-500 border border-yellow-800/30 rounded uppercase">Unmatched</span>
                          )}
                          {!t.has_iswc && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-orange-900/30 text-orange-400 border border-orange-800/30 rounded uppercase">No ISWC</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <p className="text-[11px] text-slate-500">{t.artist}</p>
                          <p className="text-[10px] font-mono text-slate-700">{t.isrc}</p>
                          {t.listens > 0 && <p className="text-[10px] text-slate-600">{t.listens.toLocaleString()} listens</p>}
                        </div>
                      </div>

                      {/* Revenue + action */}
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <div className="text-right">
                          {t.estimated_revenue > 0 ? (
                            <p className={`text-sm font-bold ${t.black_box ? 'text-red-400' : 'text-slate-300'}`}>
                              ${t.estimated_revenue.toLocaleString()}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-600">—</p>
                          )}
                          <p className="text-[9px] text-slate-600">est. unclaimed</p>
                        </div>
                        <Link
                          href={`/free-audit?isrc=${t.isrc}`}
                          className="px-2.5 py-1.5 bg-indigo-700/60 hover:bg-indigo-700 text-indigo-300 text-[10px] font-bold rounded transition"
                        >
                          Audit →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legal footer */}
              <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/30">
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Revenue estimates based on {result.tracks.reduce((a, t) => a + t.listens, 0).toLocaleString()} total documented listens × $0.003 avg streaming rate.
                  Data sourced from SMPT Global Registry, The MLC, and ListenBrainz. This report constitutes attorney work product and may be used in support of
                  royalty claims, dispute letters, and court filings. Estimates do not constitute legal advice.
                  Statute of limitations for MLC mechanical claims: 3 years from date of infringement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom info cards */}
        {!result && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              ['⚡ Parallel Pipeline', 'All 4 forensic steps run simultaneously — no waiting between probes.'],
              ['⚖️ Attorney-Grade Output', 'Summary of Loss formatted as work product. Delegate discovery to a paralegal.'],
              ['🔒 Chain of Custody', 'Each scan generates a SHA-256 audit hash + timestamp for court use.'],
            ].map(([t, s]) => (
              <div key={t} className="bg-[#0f172a] border border-slate-800 p-4 rounded-lg">
                <p className="text-xs font-semibold text-slate-300 mb-1">{t}</p>
                <p className="text-[11px] text-slate-600">{s}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
