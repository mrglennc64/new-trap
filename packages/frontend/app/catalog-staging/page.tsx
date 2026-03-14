"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────── */
type ChangeType = "new" | "modified" | "conflict" | "deleted";
type Status = "pending" | "approved" | "rejected";

interface CatalogRecord {
  id: string;
  title: string;
  artist: string;
  isrc: string;
  iswc?: string;
  ipi?: string;
  splits: string;
  distributor: string;
  source: string;
  changeType: ChangeType;
  status: Status;
  liveValue?: Record<string, string>;
  shadowValue: Record<string, string>;
  diff: string[];
  riskScore: number; // 0-100
}

interface SwapSummary {
  totalShadow: number;
  approved: number;
  rejected: number;
  pending: number;
  conflicts: number;
  estimatedRecovery: number;
}

/* ─── Mock data ──────────────────────────────────────────────── */
const MOCK_RECORDS: CatalogRecord[] = [
  {
    id: "r1", title: "Starboy", artist: "The Weeknd", isrc: "USUG11600681",
    iswc: "T-921.614.229-5", ipi: "00495205820", splits: "100% — The Weeknd",
    distributor: "Republic Records", source: "TuneCore Export",
    changeType: "new", status: "pending",
    shadowValue: { isrc: "USUG11600681", iswc: "T-921.614.229-5", splits: "100%", ipi: "00495205820" },
    diff: ["ISRC mapped", "ISWC linked", "IPI resolved"],
    riskScore: 12,
  },
  {
    id: "r2", title: "Sicko Mode", artist: "Travis Scott", isrc: "USUG11801862",
    ipi: "Missing", splits: "40/30/30", distributor: "Cactus Jack / Epic",
    source: "ASCAP Statement Q3",
    changeType: "modified", status: "pending",
    liveValue: { splits: "50/25/25", ipi: "—", society: "Not registered" },
    shadowValue: { splits: "40/30/30", ipi: "00721084930", society: "ASCAP" },
    diff: ["Split corrected 50/25/25 → 40/30/30", "IPI added", "ASCAP registration linked"],
    riskScore: 34,
  },
  {
    id: "r3", title: "Goosebumps", artist: "Travis Scott", isrc: "USUG11601823",
    splits: "55/45", distributor: "Cactus Jack / Epic", source: "BMI Statement",
    changeType: "conflict", status: "pending",
    liveValue: { splits: "60/40", society: "ASCAP" },
    shadowValue: { splits: "55/45", society: "BMI" },
    diff: ["CONFLICT: Split mismatch (live 60/40 vs shadow 55/45)", "CONFLICT: Society mismatch (ASCAP vs BMI)"],
    riskScore: 88,
  },
  {
    id: "r4", title: "No Role Modelz", artist: "J. Cole", isrc: "USRC11400626",
    iswc: "T-913.284.771-3", splits: "100% — J. Cole",
    distributor: "Dreamville / Interscope", source: "CD Baby Export",
    changeType: "new", status: "pending",
    shadowValue: { isrc: "USRC11400626", iswc: "T-913.284.771-3", splits: "100%", territory: "Worldwide" },
    diff: ["New track — not in live catalog", "ISWC linked", "Territory set: Worldwide"],
    riskScore: 8,
  },
  {
    id: "r5", title: "Drip Too Hard", artist: "Lil Baby & Gunna", isrc: "USSM11804672",
    splits: "50/50", distributor: "Quality Control / Capitol",
    source: "SoundExchange Q4",
    changeType: "modified", status: "pending",
    liveValue: { splits: "60/40", digital_performance: "unclaimed" },
    shadowValue: { splits: "50/50", digital_performance: "$12,400 pending" },
    diff: ["Split corrected 60/40 → 50/50", "Digital performance royalty $12,400 unclaimed"],
    riskScore: 61,
  },
  {
    id: "r6", title: "Rockstar", artist: "Post Malone ft. 21 Savage", isrc: "USUM71705561",
    splits: "70/30", distributor: "Republic Records", source: "DistroKid CSV",
    changeType: "new", status: "pending",
    shadowValue: { isrc: "USUM71705561", splits: "70/30", feat: "21 Savage — IPI 00612304851" },
    diff: ["New track", "Featured artist IPI resolved", "Territory gap: Japan unclaimed"],
    riskScore: 22,
  },
  {
    id: "r7", title: "Antidote", artist: "Travis Scott", isrc: "USUG11501163",
    splits: "100%", distributor: "Cactus Jack / Epic", source: "TuneCore Export",
    changeType: "deleted", status: "pending",
    liveValue: { status: "Active", isrc: "USUG11501163" },
    shadowValue: { status: "Duplicate — superseded by USUG11501163-R" },
    diff: ["DUPLICATE DETECTED — live record flagged for removal", "Replacement ISRC: USUG11501163-R"],
    riskScore: 71,
  },
  {
    id: "r8", title: "Look Alive", artist: "BlocBoy JB ft. Drake", isrc: "USSM11801532",
    ipi: "00495205820", splits: "65/35",
    distributor: "FADER Label / Interscope", source: "BMI Statement Q1",
    changeType: "new", status: "pending",
    shadowValue: { isrc: "USSM11801532", splits: "65/35", society: "BMI", territory: "US only" },
    diff: ["New track", "Territory restriction: US only", "BMI registration confirmed"],
    riskScore: 15,
  },
];

const CHANGE_META: Record<ChangeType, { label: string; color: string; bg: string; border: string }> = {
  new:      { label: "New",      color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30" },
  modified: { label: "Modified", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  conflict: { label: "Conflict", color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/30" },
  deleted:  { label: "Remove",   color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
};

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/* ─── CSV Parser ─────────────────────────────────────────────── */
function parseCSVToRecords(text: string): CatalogRecord[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const delim = (lines[0].match(/\t/g) || []).length > (lines[0].match(/,/g) || []).length ? '\t' : lines[0].includes(';') ? ';' : ',';

  function splitRow(line: string): string[] {
    const cells: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line + delim) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === delim && !inQ) { cells.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    return cells;
  }

  const headers = splitRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const find = (...terms: string[]) => {
    for (const t of terms) {
      const i = headers.findIndex(h => h.includes(t));
      if (i >= 0) return i;
    }
    return -1;
  };

  const cols = {
    title:       find('title', 'track', 'song', 'name'),
    artist:      find('artist', 'performer', 'creator'),
    isrc:        find('isrc'),
    iswc:        find('iswc'),
    ipi:         find('ipi'),
    splits:      find('split', 'percentage', 'share', 'percent', 'writer'),
    distributor: find('distributor', 'label', 'publisher', 'distrib'),
  };

  const get = (cells: string[], idx: number) => idx >= 0 ? (cells[idx] || '').trim() : '';

  return lines.slice(1).flatMap((line, i) => {
    if (!line.trim()) return [];
    const cells = splitRow(line);
    const title = get(cells, cols.title) || `Track ${i + 1}`;
    const artist = get(cells, cols.artist) || '—';
    const isrc = get(cells, cols.isrc).toUpperCase().replace(/[-\s]/g, '');
    const iswc = get(cells, cols.iswc);
    const ipi = get(cells, cols.ipi);
    const splits = get(cells, cols.splits);
    const distributor = get(cells, cols.distributor);

    let risk = 5;
    const diff: string[] = [];
    if (!isrc) { risk += 40; diff.push('⚠ ISRC missing — not trackable at DSPs'); }
    else diff.push(`ISRC: ${isrc}`);
    if (!iswc) { risk += 20; diff.push('⚠ ISWC not linked — publishing unroutable at PROs'); }
    else diff.push(`ISWC: ${iswc}`);
    if (!ipi) { risk += 20; diff.push('⚠ IPI missing — writer share unclaimed'); }
    else diff.push(`IPI: ${ipi}`);
    if (splits) diff.push(`Splits: ${splits}`);

    return [{
      id: `csv_${i}_${Date.now()}`,
      title,
      artist,
      isrc: isrc || '—',
      iswc: iswc || undefined,
      ipi: ipi || undefined,
      splits: splits || '—',
      distributor: distributor || '—',
      source: 'CSV Upload',
      changeType: 'new' as ChangeType,
      status: 'pending' as Status,
      shadowValue: { title, artist, isrc: isrc || '—', splits: splits || '—', distributor: distributor || '—' },
      diff,
      riskScore: Math.min(risk, 100),
    }];
  });
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-rose-500" : score >= 40 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold ${score >= 70 ? "text-rose-400" : score >= 40 ? "text-yellow-400" : "text-green-400"}`}>
        {score}
      </span>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────── */
export default function CatalogStagingPage() {
  const [records, setRecords] = useState<CatalogRecord[]>(MOCK_RECORDS);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | ChangeType | "pending" | "approved" | "rejected">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [swapPhase, setSwapPhase] = useState<"idle" | "confirming" | "swapping" | "done">("idle");
  const [swapPct, setSwapPct] = useState(0);
  const [swapLog, setSwapLog] = useState<string[]>([]);
  const [rollbackAvail, setRollbackAvail] = useState(false);
  const [rolledBack, setRolledBack] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSVToRecords(text);
      if (parsed.length > 0) {
        setRecords(parsed);
        setCsvLoaded(true);
        setSwapPhase("idle");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const setStatus = useCallback((id: string, s: Status) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: s } : r)));
  }, []);

  const approveAll = () => setRecords((prev) => prev.map((r) => r.changeType !== "conflict" ? { ...r, status: "approved" } : r));
  const rejectAll  = () => setRecords((prev) => prev.map((r) => ({ ...r, status: "rejected" })));

  const summary: SwapSummary = {
    totalShadow: records.length,
    approved: records.filter((r) => r.status === "approved").length,
    rejected: records.filter((r) => r.status === "rejected").length,
    pending: records.filter((r) => r.status === "pending").length,
    conflicts: records.filter((r) => r.changeType === "conflict").length,
    estimatedRecovery: 187200,
  };

  const filtered = records.filter((r) => {
    const matchSearch = searchQ === "" ||
      r.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      r.artist.toLowerCase().includes(searchQ.toLowerCase()) ||
      r.isrc.toLowerCase().includes(searchQ.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "all") return true;
    if (filter === "pending" || filter === "approved" || filter === "rejected") return r.status === filter;
    return r.changeType === filter;
  });

  const execSwap = useCallback(async () => {
    setSwapPhase("swapping");
    setSwapPct(0);
    setSwapLog([]);
    const log = (m: string) => setSwapLog((p) => [...p, `[${new Date().toLocaleTimeString()}] ${m}`]);

    log("Initiating shadow-to-live database swap…");
    await new Promise((r) => setTimeout(r, 400));
    log(`Writing ${summary.approved} approved records to live catalog…`);

    for (let p = 0; p <= 100; p += 3) {
      await new Promise((r) => setTimeout(r, 50));
      setSwapPct(p);
      if (p === 30) log("Applying new records…");
      if (p === 55) log("Applying modified records…");
      if (p === 75) log("Removing duplicate/deleted records…");
      if (p === 90) log("Rebuilding catalog index…");
    }

    log("Verifying record counts…");
    await new Promise((r) => setTimeout(r, 500));
    log(`SUCCESS — ${summary.approved} records committed to live catalog`);
    log(`Snapshot saved — rollback available for 24h`);
    log(`Timestamp: ${new Date().toISOString()}`);
    setSwapPhase("done");
    setRollbackAvail(true);
  }, [summary.approved]);

  const execRollback = useCallback(async () => {
    setSwapLog((p) => [...p, `[${new Date().toLocaleTimeString()}] Rollback initiated — restoring previous live snapshot…`]);
    await new Promise((r) => setTimeout(r, 1200));
    setSwapLog((p) => [...p, `[${new Date().toLocaleTimeString()}] Rollback complete — live catalog restored`]);
    setRolledBack(true);
    setRollbackAvail(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pt-14 pb-20">
      {/* Header */}
      <div className="bg-[#0f172a] border-b border-white/10 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔄</span>
              <h1 className="text-xl font-black text-white tracking-tight">Mock → Live Catalog Swap</h1>
              {swapPhase === "done" && !rolledBack && (
                <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                  LIVE
                </span>
              )}
              {rolledBack && (
                <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full border border-orange-500/30">
                  ROLLED BACK
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              Review every shadow record before it touches the live Master Catalog. Approve, reject, or hold — then execute the swap.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              className="hidden"
              onChange={handleCSVUpload}
            />
            <button
              onClick={() => csvInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg border border-indigo-500/30 transition"
            >
              📁 Upload CSV
            </button>
            {csvLoaded && (
              <button
                onClick={() => { setRecords(MOCK_RECORDS); setCsvLoaded(false); setSwapPhase("idle"); }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition"
              >
                Reset Demo
              </button>
            )}
            <Link href="/ingest" className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition">
              ← Bulk Ingest
            </Link>
            <Link href="/label" className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
              Label Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: "Shadow Records", value: summary.totalShadow, color: "text-white" },
            { label: "Approved", value: summary.approved, color: "text-green-400" },
            { label: "Rejected", value: summary.rejected, color: "text-rose-400" },
            { label: "Pending Review", value: summary.pending, color: "text-yellow-400" },
            { label: "Conflicts", value: summary.conflicts, color: "text-orange-400" },
            { label: "Est. Recovery", value: fmtMoney(summary.estimatedRecovery), color: "text-indigo-400 text-sm font-black" },
          ].map((c) => (
            <div key={c.label} className="bg-[#0f172a] border border-white/10 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">{c.label}</div>
              <div className={`text-xl font-black ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search title, artist, ISRC…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="px-3 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-56"
          />
          <div className="flex items-center gap-1 flex-wrap">
            {(["all","new","modified","conflict","deleted","pending","approved","rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  filter === f ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={approveAll} className="px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-xs font-semibold transition">
              Approve All Clean
            </button>
            <button onClick={rejectAll} className="px-3 py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-xs font-semibold transition">
              Reject All
            </button>
          </div>
        </div>

        {/* Demo data notice */}
        {!csvLoaded && (
          <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-300">
            <span className="text-base">⚠️</span>
            <span>Showing <strong>demo data</strong> — click <strong>📁 Upload CSV</strong> in the header to load your real catalog records.</span>
          </div>
        )}

        {/* Record table */}
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold text-slate-500 uppercase tracking-widest px-5 py-3 border-b border-white/10 hidden sm:grid">
            <div className="w-24 pr-4">Type</div>
            <div>Track / Artist</div>
            <div className="px-4">Risk</div>
            <div className="px-4 w-28">ISRC</div>
            <div className="px-4 w-24">Source</div>
            <div className="w-40 text-right">Action</div>
          </div>

          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">No records match this filter.</div>
          )}

          {filtered.map((r) => {
            const meta = CHANGE_META[r.changeType];
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className={`border-b border-white/5 last:border-0 transition-colors ${isOpen ? "bg-white/5" : "hover:bg-white/5"}`}>
                {/* Main row */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 sm:gap-0 px-5 py-3 cursor-pointer items-center"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  <div className="w-24 pr-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${meta.color} ${meta.bg} border ${meta.border}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{r.title}</div>
                    <div className="text-xs text-slate-400 truncate">{r.artist}</div>
                  </div>
                  <div className="px-4">
                    <RiskBar score={r.riskScore} />
                  </div>
                  <div className="px-4 w-28 font-mono text-xs text-slate-400 truncate">{r.isrc}</div>
                  <div className="px-4 w-24 text-xs text-slate-500 truncate">{r.source}</div>
                  <div className="w-40 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {r.status === "pending" ? (
                      <>
                        <button
                          onClick={() => setStatus(r.id, "approved")}
                          disabled={r.changeType === "conflict"}
                          className="px-2.5 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 rounded-lg text-xs font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setStatus(r.id, "rejected")}
                          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${r.status === "approved" ? "text-green-400" : "text-rose-400"}`}>
                          {r.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                        </span>
                        <button
                          onClick={() => setStatus(r.id, "pending")}
                          className="text-xs text-slate-500 hover:text-slate-300 underline"
                        >
                          undo
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded diff view */}
                {isOpen && (
                  <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Diff / changes */}
                    <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Changes in Shadow</div>
                      <ul className="space-y-1.5">
                        {r.diff.map((d, i) => (
                          <li key={i} className={`flex items-start gap-2 text-xs ${d.startsWith("CONFLICT") ? "text-rose-400" : d.startsWith("DUPLICATE") ? "text-orange-400" : "text-green-400"}`}>
                            <span className="flex-shrink-0 mt-0.5">{d.startsWith("CONFLICT") || d.startsWith("DUPLICATE") ? "⚠" : "+"}</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Side-by-side */}
                    {r.liveValue && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                          <div className="text-xs font-bold text-rose-400 mb-2">LIVE (current)</div>
                          {Object.entries(r.liveValue).map(([k, v]) => (
                            <div key={k} className="text-xs mb-1">
                              <span className="text-slate-500">{k}:</span>{" "}
                              <span className="text-rose-300">{v}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                          <div className="text-xs font-bold text-green-400 mb-2">SHADOW (incoming)</div>
                          {Object.entries(r.shadowValue).map(([k, v]) => (
                            <div key={k} className="text-xs mb-1">
                              <span className="text-slate-500">{k}:</span>{" "}
                              <span className="text-green-300">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!r.liveValue && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                        <div className="text-xs font-bold text-green-400 mb-2">SHADOW VALUES</div>
                        {Object.entries(r.shadowValue).map(([k, v]) => (
                          <div key={k} className="text-xs mb-1">
                            <span className="text-slate-500">{k}:</span>{" "}
                            <span className="text-green-300">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Conflict warning */}
                    {r.changeType === "conflict" && (
                      <div className="sm:col-span-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2">
                        <span className="text-rose-400 text-lg flex-shrink-0">⚠</span>
                        <div>
                          <div className="text-xs font-bold text-rose-400 mb-1">Manual Resolution Required</div>
                          <p className="text-xs text-slate-400">
                            Conflicting data between live catalog and shadow import. Approve will be disabled until you manually set the correct value in the label portal, then re-import.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Swap execution panel */}
        {swapPhase === "idle" && (
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="text-sm font-bold text-white mb-1">Ready to Execute Swap?</div>
                <p className="text-xs text-slate-400">
                  {summary.pending > 0
                    ? `${summary.pending} record(s) still pending. You can swap approved records now or resolve all first.`
                    : `All records reviewed. ${summary.approved} approved and ready to commit to the live Master Catalog.`}
                </p>
                {summary.conflicts > 0 && (
                  <p className="text-xs text-rose-400 mt-1">
                    ⚠ {summary.conflicts} conflict(s) must be manually resolved before they can be approved.
                  </p>
                )}
              </div>
              <button
                onClick={() => setSwapPhase("confirming")}
                disabled={summary.approved === 0}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-white/10 disabled:text-slate-600 text-white font-bold rounded-xl text-sm transition flex-shrink-0"
              >
                Execute Swap ({summary.approved} records)
              </button>
            </div>
          </div>
        )}

        {swapPhase === "confirming" && (
          <div className="bg-[#0f172a] border border-yellow-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">⚠️</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-yellow-400 mb-2">Confirm Live Catalog Swap</div>
                <p className="text-xs text-slate-400 mb-4">
                  You are about to write <span className="text-white font-semibold">{summary.approved} records</span> to the live Master Catalog.
                  A snapshot will be saved — rollback is available for 24 hours.
                  <span className="text-rose-400"> This cannot be undone without the rollback tool.</span>
                </p>
                <div className="flex gap-3">
                  <button onClick={execSwap} className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition">
                    Confirm Swap
                  </button>
                  <button onClick={() => setSwapPhase("idle")} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl text-sm border border-white/10 transition">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(swapPhase === "swapping" || swapPhase === "done") && (
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${swapPhase === "swapping" ? "bg-blue-400 animate-pulse" : rolledBack ? "bg-orange-400" : "bg-green-400"}`} />
                <span className="text-sm font-bold text-white">
                  {swapPhase === "swapping" ? "Swap in progress…" : rolledBack ? "Rolled back" : "Swap complete"}
                </span>
              </div>
              {swapPhase === "done" && rollbackAvail && !rolledBack && (
                <button
                  onClick={execRollback}
                  className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-semibold transition"
                >
                  Rollback (24h window)
                </button>
              )}
            </div>

            {swapPhase === "swapping" && (
              <div className="px-5 py-3">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Shadow → Live swap</span>
                  <span>{swapPct}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-green-500 transition-all duration-100 rounded-full" style={{ width: `${swapPct}%` }} />
                </div>
              </div>
            )}

            <div className="bg-black/40 p-4 font-mono text-xs text-green-400 space-y-0.5 max-h-48 overflow-y-auto">
              {swapLog.map((l, i) => <div key={i}>{l}</div>)}
              {swapPhase === "swapping" && <div className="animate-pulse">▊</div>}
            </div>

            {swapPhase === "done" && !rolledBack && (
              <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="text-sm font-semibold text-green-400">
                  ✅ {summary.approved} records live
                </div>
                <Link href="/label" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition">
                  View Live Catalog
                </Link>
                <Link href="/attorney-portal" className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg border border-white/10 transition">
                  Attorney Review
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
