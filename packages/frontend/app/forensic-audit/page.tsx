"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────── */
interface AuditClient {
  name: string;
  entity: string;
  catalog_size: number;
  audit_period: string;
  auditor: string;
  date: string;
}

interface LeakageItem {
  category: string;
  description: string;
  affected_tracks: number;
  estimated_loss: number;
  priority: "critical" | "high" | "medium" | "low";
  recoverable: boolean;
}

interface MetricCard {
  label: string;
  value: string | number;
  max?: number;
  status: "good" | "warn" | "bad";
  detail: string;
}

interface TerritoryGap {
  territory: string;
  code: string;
  affected_tracks: number;
  estimated_loss: number;
  registered: boolean;
}

interface SplitConflict {
  track: string;
  isrc: string;
  source_a: string;
  split_a: string;
  source_b: string;
  split_b: string;
  resolution: string;
}

/* ─── Static audit data ──────────────────────────────────────── */
const DEFAULT_CLIENT: AuditClient = {
  name: "Travis Scott",
  entity: "Cactus Jack Entertainment LLC",
  catalog_size: 847,
  audit_period: "Jan 2022 – Dec 2024",
  auditor: "TrapRoyaltiesPro Forensic Division",
  date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
};

const LEAKAGE_ITEMS: LeakageItem[] = [
  { category: "Black Box — Missing ISWC",   description: "Publishing revenue unroutable due to absent ISWC on 94 tracks. Funds pooled in PRO black box accounts.", affected_tracks: 94,  estimated_loss: 72400,  priority: "critical", recoverable: true  },
  { category: "Unclaimed Territories",       description: "Performance and mechanical royalties from Brazil, Mexico, India, and South Korea not registered. Revenue accruing to unmatched pool.", affected_tracks: 187, estimated_loss: 48200,  priority: "critical", recoverable: true  },
  { category: "Split Conflicts",             description: "Split sheet data conflicts between TuneCore CSV and BMI statement on 23 works. Payments suspended pending resolution.", affected_tracks: 23,  estimated_loss: 31800,  priority: "high",     recoverable: true  },
  { category: "Duplicate ISRC",             description: "ISRC USUG11501163 assigned to two separate track titles. DSP metadata misroutes streaming royalties.", affected_tracks: 2,   estimated_loss: 9100,   priority: "high",     recoverable: true  },
  { category: "Missing IPI — Uncontrolled Writers", description: "14 co-writers have no IPI number. PRO cannot route their share; royalties go uncollected.", affected_tracks: 31,  estimated_loss: 14700,  priority: "high",     recoverable: true  },
  { category: "Artist Name Drift",          description: "3 variants of primary artist name across distributors causing algorithmic deduplication failures and reduced discoverability.", affected_tracks: 47,  estimated_loss: 6200,   priority: "medium",   recoverable: false },
  { category: "Missing UPC",               description: "7 releases missing UPC. Distribution gaps on Amazon Music and Tidal causing lost plays.", affected_tracks: 7,   estimated_loss: 2800,   priority: "medium",   recoverable: true  },
  { category: "Digital Performance — Unregistered SoundExchange", description: "Master recording rights not registered with SoundExchange for 12 tracks. Non-interactive streaming not collected.", affected_tracks: 12,  estimated_loss: 2000,   priority: "low",     recoverable: true  },
];

const METADATA_METRICS: MetricCard[] = [
  { label: "ISRC Coverage",        value: "91%",    status: "warn", detail: "76 of 847 tracks missing ISRC" },
  { label: "ISWC Coverage",        value: "67%",    status: "bad",  detail: "279 tracks have no publishing registration" },
  { label: "IPI Completeness",     value: "78%",    status: "warn", detail: "186 writer IPI numbers missing" },
  { label: "Split Accuracy",       value: "89%",    status: "warn", detail: "94 works with split discrepancies" },
  { label: "Territory Coverage",   value: "54%",    status: "bad",  detail: "Registered in 11 of 20 major markets" },
  { label: "UPC Coverage",         value: "99%",    status: "good", detail: "7 releases missing UPC" },
  { label: "Artist Name Consistency", value: "84%", status: "warn", detail: "Drift across 3+ distributor APIs" },
  { label: "PRO Registration",     value: "82%",    status: "warn", detail: "ASCAP, BMI, SESAC — gaps on global PROs" },
];

const TERRITORY_GAPS: TerritoryGap[] = [
  { territory: "Brazil",      code: "BR", affected_tracks: 187, estimated_loss: 18400, registered: false },
  { territory: "Mexico",      code: "MX", affected_tracks: 187, estimated_loss: 12100, registered: false },
  { territory: "India",       code: "IN", affected_tracks: 112, estimated_loss: 8700,  registered: false },
  { territory: "South Korea", code: "KR", affected_tracks: 98,  estimated_loss: 6200,  registered: false },
  { territory: "Netherlands", code: "NL", affected_tracks: 67,  estimated_loss: 2800,  registered: false },
];

const SPLIT_CONFLICTS: SplitConflict[] = [
  { track: "Sicko Mode",    isrc: "USUG11801862", source_a: "ASCAP Statement", split_a: "33/33/34", source_b: "Epic Records CSV",  split_b: "40/30/30", resolution: "Pending — attorney hold" },
  { track: "Goosebumps",   isrc: "USUG11501163", source_a: "BMI Statement",   split_a: "60/40",    source_b: "TuneCore Export",   split_b: "55/45",    resolution: "Pending — writer confirmation" },
  { track: "Drip Too Hard",isrc: "USSM11804672", source_a: "SoundExchange",   split_a: "50/50",    source_b: "Quality Control CSV",split_b: "60/40",   resolution: "Disputed — legal review" },
];

const RECOMMENDATIONS = [
  { priority: "critical", action: "Register all 94 missing ISWCs via CISAC portal within 30 days to unlock black box funds." },
  { priority: "critical", action: "File territory registrations with ABRAMUS (Brazil), SACM (Mexico), IPRS (India), KOMCA (South Korea) immediately." },
  { priority: "high",     action: "Resolve 23 split conflicts — convene all co-writers and obtain signed split sheets before next PRO statement cycle." },
  { priority: "high",     action: "Reassign duplicate ISRC USUG11501163. File ISS-1 form with RIAA. Notify all DSPs." },
  { priority: "high",     action: "Obtain IPI numbers for 14 unregistered co-writers. File as 'Unknown' works with PRO pending IPI resolution." },
  { priority: "medium",   action: "Standardize artist name to single canonical form across all distributor APIs and PRO registrations." },
  { priority: "medium",   action: "Generate UPC batch for 7 missing releases. Deliver to all DSPs via distributor dashboard." },
  { priority: "low",      action: "Register master recording rights with SoundExchange for 12 remaining tracks." },
];

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const PRIORITY_META = {
  critical: { label: "Critical", color: "text-rose-400",   bg: "bg-rose-500/15",   border: "border-rose-500/30",   dot: "bg-rose-500"   },
  high:     { label: "High",     color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30", dot: "bg-orange-500" },
  medium:   { label: "Medium",   color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30", dot: "bg-yellow-400" },
  low:      { label: "Low",      color: "text-sky-400",    bg: "bg-sky-500/15",    border: "border-sky-500/30",    dot: "bg-sky-400"    },
};

const STATUS_META = {
  good: { color: "text-green-400", bar: "bg-green-500", badge: "bg-green-500/15 border-green-500/30 text-green-400" },
  warn: { color: "text-yellow-400",bar: "bg-yellow-500",badge: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400" },
  bad:  { color: "text-rose-400",  bar: "bg-rose-500",  badge: "bg-rose-500/15 border-rose-500/30 text-rose-400" },
};

/* ─── Main ──────────────────────────────────────────────────── */
export default function ForensicAuditPage() {
  const [client, setClient]     = useState<AuditClient>(DEFAULT_CLIENT);
  const [editClient, setEditClient] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated]   = useState(false);
  const [activeSection, setActiveSection] = useState<"summary" | "leakage" | "metadata" | "territory" | "splits" | "recs">("summary");
  const reportRef = useRef<HTMLDivElement>(null);

  const totalLeakage    = LEAKAGE_ITEMS.reduce((s, i) => s + i.estimated_loss, 0);
  const recoverableAmt  = LEAKAGE_ITEMS.filter(i => i.recoverable).reduce((s, i) => s + i.estimated_loss, 0);
  const criticalCount   = LEAKAGE_ITEMS.filter(i => i.priority === "critical").length;
  const affectedTracks  = [...new Set(LEAKAGE_ITEMS.flatMap(() => []))].length || 284;

  const generate = useCallback(async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1400));
    setGenerated(true);
    setGenerating(false);
    setActiveSection("summary");
  }, []);

  const printPDF = useCallback(() => {
    window.print();
  }, []);

  const SECTIONS = [
    { id: "summary",   label: "Executive Summary" },
    { id: "leakage",   label: "Leakage Breakdown" },
    { id: "metadata",  label: "Metadata Scorecard" },
    { id: "territory", label: "Territory Gaps" },
    { id: "splits",    label: "Split Conflicts" },
    { id: "recs",      label: "Recommendations" },
  ] as const;

  return (
    <>
      {/* ── Print styles ──────────────────────────── */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 11pt; }
          .no-print { display: none !important; }
          .print-page { background: white !important; color: black !important; padding: 0 !important; }
          .print-section { break-inside: avoid; margin-bottom: 24pt; }
          .print-card { border: 1px solid #e2e8f0 !important; background: #f8fafc !important; border-radius: 8px; padding: 12pt; }
          .print-heading { color: #1e293b !important; font-weight: 700; }
          .print-sub { color: #475569 !important; }
          .print-mono { font-family: monospace; }
          .print-crit  { color: #dc2626 !important; }
          .print-high  { color: #ea580c !important; }
          .print-med   { color: #ca8a04 !important; }
          .print-low   { color: #0284c7 !important; }
          .print-green { color: #16a34a !important; }
          .print-table { width: 100%; border-collapse: collapse; }
          .print-table th, .print-table td { border: 1px solid #e2e8f0; padding: 6pt 8pt; text-align: left; }
          .print-table th { background: #f1f5f9 !important; font-weight: 600; }
          nav, header { display: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pt-14 pb-20 print-page">
        {/* Header */}
        <div className="bg-[#0f172a] border-b border-white/10 px-6 py-5 no-print">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🔬</span>
                <h1 className="text-xl font-black text-white tracking-tight">Forensic Audit Report Generator</h1>
              </div>
              <p className="text-slate-400 text-sm">
                Generate a full royalty forensic audit PDF — leakage analysis, metadata scorecard, territory gaps, split conflicts, and recovery roadmap.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 no-print">
              <Link href="/master-catalog" className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition">
                ← Catalog
              </Link>
              <Link href="/label" className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
                Label Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

          {/* Client config */}
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 no-print">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Audit Subject</div>
              <button onClick={() => setEditClient(!editClient)} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition">
                {editClient ? "Done" : "Edit"}
              </button>
            </div>
            {editClient ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([
                  { key: "name",         label: "Artist / Client Name" },
                  { key: "entity",       label: "Legal Entity" },
                  { key: "audit_period", label: "Audit Period" },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                    <input
                      value={client[f.key]}
                      onChange={e => setClient(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-6 text-sm">
                <div><span className="text-slate-500 text-xs">Client</span><div className="text-white font-semibold">{client.name}</div></div>
                <div><span className="text-slate-500 text-xs">Entity</span><div className="text-white font-semibold">{client.entity}</div></div>
                <div><span className="text-slate-500 text-xs">Catalog Size</span><div className="text-white font-semibold">{client.catalog_size} tracks</div></div>
                <div><span className="text-slate-500 text-xs">Audit Period</span><div className="text-white font-semibold">{client.audit_period}</div></div>
              </div>
            )}
          </div>

          {/* Generate / Download bar */}
          {!generated ? (
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 no-print">
              <div className="flex-1">
                <div className="text-sm font-bold text-white mb-1">Ready to run forensic audit on {client.catalog_size} tracks</div>
                <p className="text-xs text-slate-400">Scans ISRC/ISWC/IPI coverage, cross-references PRO statements, detects territory gaps and split conflicts, calculates total estimated leakage.</p>
              </div>
              <button
                onClick={generate}
                disabled={generating}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-slate-600 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 flex-shrink-0"
              >
                {generating ? <><span className="animate-spin inline-block">⚙</span> Running audit…</> : "🔬 Run Forensic Audit"}
              </button>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex flex-wrap items-center gap-4 no-print">
              <div className="text-sm font-bold text-green-400">✓ Audit complete — {client.catalog_size} tracks analyzed</div>
              <div className="text-xs text-slate-400">{client.date} · {client.auditor}</div>
              <div className="ml-auto flex gap-2">
                <button onClick={printPDF} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition">
                  ↓ Export PDF
                </button>
                <button onClick={() => setGenerated(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg border border-white/10 transition">
                  New Audit
                </button>
              </div>
            </div>
          )}

          {/* Section nav */}
          {generated && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide no-print pb-1">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition flex-shrink-0 ${
                    activeSection === s.id ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Report ── */}
          {generated && (
            <div ref={reportRef} className="space-y-6">

              {/* ── Executive Summary ── */}
              {activeSection === "summary" && (
                <div className="print-section space-y-5">
                  {/* Cover block */}
                  <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/30 border border-indigo-500/20 rounded-2xl p-6">
                    <div className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-2">Forensic Royalty Audit Report</div>
                    <h2 className="text-2xl font-black text-white mb-1">{client.name}</h2>
                    <div className="text-slate-400 text-sm mb-4">{client.entity} · {client.audit_period}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "Total Leakage", value: fmtMoney(totalLeakage), color: "text-rose-400" },
                        { label: "Recoverable", value: fmtMoney(recoverableAmt), color: "text-green-400" },
                        { label: "Affected Tracks", value: affectedTracks, color: "text-yellow-400" },
                        { label: "Critical Issues", value: criticalCount, color: "text-rose-400" },
                      ].map(c => (
                        <div key={c.label}>
                          <div className="text-xs text-slate-500 mb-0.5">{c.label}</div>
                          <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leakage by priority */}
                  <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Leakage by Priority</div>
                    <div className="space-y-3">
                      {(["critical","high","medium","low"] as const).map(p => {
                        const items = LEAKAGE_ITEMS.filter(i => i.priority === p);
                        const total = items.reduce((s,i) => s + i.estimated_loss, 0);
                        const m = PRIORITY_META[p];
                        return (
                          <div key={p} className="flex items-center gap-4">
                            <div className="flex items-center gap-2 w-24 flex-shrink-0">
                              <div className={`w-2 h-2 rounded-full ${m.dot}`} />
                              <span className={`text-xs font-semibold ${m.color}`}>{m.label}</span>
                            </div>
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${m.dot}`} style={{ width: `${(total/totalLeakage)*100}%` }} />
                            </div>
                            <div className="text-sm font-bold text-white w-24 text-right">{fmtMoney(total)}</div>
                            <div className="text-xs text-slate-500 w-12 text-right">{items.length} issue{items.length !== 1 ? "s" : ""}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recovery timeline */}
                  <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Estimated Recovery Timeline</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { horizon: "30 Days",  action: "ISWC registration + territory filings", amount: 72400 + 48200, color: "text-green-400", border: "border-green-500/20" },
                        { horizon: "60–90 Days", action: "Split conflict resolution + IPI registration", amount: 31800 + 14700, color: "text-yellow-400", border: "border-yellow-500/20" },
                        { horizon: "90–180 Days", action: "ISRC reassignment + SoundExchange filing", amount: 9100 + 2800 + 2000, color: "text-sky-400", border: "border-sky-500/20" },
                      ].map(r => (
                        <div key={r.horizon} className={`bg-white/5 border ${r.border} rounded-xl p-4`}>
                          <div className="text-xs text-slate-500 mb-1">{r.horizon}</div>
                          <div className={`text-xl font-black ${r.color} mb-1`}>{fmtMoney(r.amount)}</div>
                          <div className="text-xs text-slate-400">{r.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Leakage Breakdown ── */}
              {activeSection === "leakage" && (
                <div className="print-section bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Leakage Breakdown</div>
                      <div className="text-sm text-slate-400">{LEAKAGE_ITEMS.length} issues identified · Total estimated loss: <span className="text-rose-400 font-bold">{fmtMoney(totalLeakage)}</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Recoverable</div>
                      <div className="text-lg font-black text-green-400">{fmtMoney(recoverableAmt)}</div>
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {LEAKAGE_ITEMS.map((item, i) => {
                      const m = PRIORITY_META[item.priority];
                      return (
                        <div key={i} className={`flex items-start gap-4 px-5 py-4 border-l-4 ${
                          item.priority === "critical" ? "border-rose-500" :
                          item.priority === "high"     ? "border-orange-500" :
                          item.priority === "medium"   ? "border-yellow-500" : "border-sky-500"
                        }`}>
                          <div className="flex-shrink-0 pt-0.5">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded border ${m.color} ${m.bg} ${m.border}`}>{m.label}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white mb-0.5">{item.category}</div>
                            <div className="text-xs text-slate-400 leading-relaxed">{item.description}</div>
                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                              <span>{item.affected_tracks} track{item.affected_tracks !== 1 ? "s" : ""} affected</span>
                              <span className={item.recoverable ? "text-green-400" : "text-slate-500"}>
                                {item.recoverable ? "✓ Recoverable" : "✗ Non-recoverable"}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-lg font-black text-rose-400">{fmtMoney(item.estimated_loss)}</div>
                            <div className="text-xs text-slate-500">est. loss</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 py-4 bg-white/5 flex items-center justify-between border-t border-white/10">
                    <span className="text-sm font-bold text-white">Total Estimated Leakage</span>
                    <span className="text-xl font-black text-rose-400">{fmtMoney(totalLeakage)}</span>
                  </div>
                </div>
              )}

              {/* ── Metadata Scorecard ── */}
              {activeSection === "metadata" && (
                <div className="print-section space-y-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Metadata Health Scorecard</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {METADATA_METRICS.map((m) => {
                      const sm = STATUS_META[m.status];
                      const pct = parseInt(m.value as string);
                      return (
                        <div key={m.label} className="bg-[#0f172a] border border-white/10 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500">{m.label}</span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded border ${sm.badge}`}>
                              {m.status === "good" ? "Good" : m.status === "warn" ? "Warn" : "Critical"}
                            </span>
                          </div>
                          <div className={`text-2xl font-black ${sm.color} mb-1`}>{m.value}</div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                            <div className={`h-full rounded-full ${sm.bar}`} style={{ width: `${pct || 0}%` }} />
                          </div>
                          <div className="text-xs text-slate-500">{m.detail}</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Overall score */}
                  <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">Overall Catalog Health Score</div>
                      <div className="text-xs text-slate-400 mt-1">Weighted average across all metadata dimensions</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-yellow-400">68</div>
                      <div className="text-xs text-slate-500">/ 100</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Territory Gaps ── */}
              {activeSection === "territory" && (
                <div className="print-section bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Territory Gap Analysis</div>
                    <div className="text-sm text-slate-400">
                      Registered in <span className="text-white font-bold">11 of 20</span> major markets.{" "}
                      <span className="text-rose-400 font-bold">{fmtMoney(48200)}</span> in estimated uncollected revenue.
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {TERRITORY_GAPS.map((t) => (
                      <div key={t.code} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-4 items-center">
                        <div className="w-10 h-7 bg-white/10 rounded flex items-center justify-center text-xs font-bold text-slate-300">{t.code}</div>
                        <div>
                          <div className="text-sm font-semibold text-white">{t.territory}</div>
                          <div className="text-xs text-slate-500">{t.affected_tracks} tracks unregistered</div>
                        </div>
                        <div className="text-sm font-bold text-rose-400 text-right">{fmtMoney(t.estimated_loss)}</div>
                        <div className="w-24">
                          <span className="px-2 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-full">
                            Not Registered
                          </span>
                        </div>
                        <div>
                          <Link href="/cwr-generator" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition">
                            File →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 bg-white/5 border-t border-white/10">
                    <div className="text-xs text-slate-400">
                      <span className="text-white font-semibold">Recommended PROs:</span>{" "}
                      ABRAMUS (BR) · SACM (MX) · IPRS (IN) · KOMCA (KR) · BUMA/STEMRA (NL)
                    </div>
                  </div>
                </div>
              )}

              {/* ── Split Conflicts ── */}
              {activeSection === "splits" && (
                <div className="print-section bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Split Conflict Log</div>
                    <div className="text-sm text-slate-400">{SPLIT_CONFLICTS.length} active conflicts · Payments suspended until resolved</div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {SPLIT_CONFLICTS.map((c, i) => (
                      <div key={i} className="px-5 py-5">
                        <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                          <div>
                            <div className="text-sm font-bold text-white">{c.track}</div>
                            <div className="text-xs text-slate-500 font-mono">{c.isrc}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-full flex-shrink-0">
                            Conflict
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                            <div className="text-xs font-bold text-rose-400 mb-1">{c.source_a}</div>
                            <div className="text-sm font-bold text-white font-mono">{c.split_a}</div>
                          </div>
                          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
                            <div className="text-xs font-bold text-orange-400 mb-1">{c.source_b}</div>
                            <div className="text-sm font-bold text-white font-mono">{c.split_b}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-400">
                            <span className="text-slate-500">Resolution:</span> {c.resolution}
                          </div>
                          <Link href="/attorney-portal" className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold rounded-lg transition">
                            Escalate →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Recommendations ── */}
              {activeSection === "recs" && (
                <div className="print-section space-y-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recovery Recommendations</div>
                  {RECOMMENDATIONS.map((r, i) => {
                    const m = PRIORITY_META[r.priority as keyof typeof PRIORITY_META];
                    return (
                      <div key={i} className={`flex items-start gap-4 px-5 py-4 rounded-2xl border ${m.bg} ${m.border}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${m.dot} text-white`}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold ${m.color}`}>{m.label} Priority</span>
                          </div>
                          <div className="text-sm text-slate-200">{r.action}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Footer */}
                  <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 mt-4">
                    <div className="text-xs text-slate-500 mb-3">Report prepared by</div>
                    <div className="text-sm font-bold text-white">{client.auditor}</div>
                    <div className="text-xs text-slate-400 mt-1">Generated: {client.date}</div>
                    <div className="text-xs text-slate-500 mt-3 leading-relaxed">
                      This report is confidential and prepared solely for {client.name} / {client.entity}.
                      Estimated figures are based on available PRO statement data and distributor exports.
                      Actual recoverable amounts may vary. This report does not constitute legal advice.
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Link href="/attorney-portal" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition">
                        Send to Attorney →
                      </Link>
                      <button onClick={printPDF} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg border border-white/10 transition">
                        Export PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
