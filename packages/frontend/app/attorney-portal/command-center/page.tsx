"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Data ──────────────────────────────────────────────────────────────────────

interface Label {
  id: string;
  name: string;
  status: "active" | "idle" | "urgent" | "action";
  statusLabel: string;
  artists: number;
  tracks: number;
  audited: number; // percent
  pipeline: number;
  opportunities: Opportunity[];
  alerts: Alert[];
  roster: RosterItem[];
}

interface Opportunity {
  track: string;
  artist: string;
  issue: string;
  amount: number;
  severity: "critical" | "warning" | "info";
  action: string;
}

interface Alert {
  type: "urgent" | "notice" | "resolved";
  title: string;
  body: string;
  hash?: string;
}

interface RosterItem {
  name: string;
  tracks: number;
  leaks: number;
  owed: number;
  isrcCoverage: number;
}

const LABELS: Label[] = [
  {
    id: "tgm",
    name: "Theel Good Music",
    status: "active",
    statusLabel: "Active View",
    artists: 12,
    tracks: 89,
    audited: 92,
    pipeline: 487200,
    opportunities: [
      { track: "Mask Off", artist: "Future", issue: "Sony/ATV ownership conflict — parallel claim filed", amount: 42100, severity: "critical", action: "Open War Room" },
      { track: "Right Now", artist: "DJ Esco", issue: "Missing ISRC — SoundExchange holding $18k", amount: 18400, severity: "critical", action: "File ISRC Claim" },
      { track: "Stick Talk", artist: "Future", issue: "Producer credit omitted — split mismatch", amount: 9800, severity: "warning", action: "Amend Split Sheet" },
      { track: "Zoom", artist: "Future ft. Stylo G", issue: "International distrib. not registered with PRS", amount: 7200, severity: "warning", action: "Register PRS" },
    ],
    alerts: [
      { type: "resolved", title: "Settlement Received", body: "ASCAP paid $24,500 for Q3 performance claims. Reconciliation complete.", hash: "0x44a...9d2" },
    ],
    roster: [
      { name: "Future", tracks: 34, leaks: 4, owed: 67800, isrcCoverage: 88 },
      { name: "DJ Esco", tracks: 22, leaks: 6, owed: 31200, isrcCoverage: 72 },
      { name: "Doe Boy", tracks: 18, leaks: 2, owed: 12400, isrcCoverage: 94 },
      { name: "Gunna", tracks: 15, leaks: 1, owed: 8900, isrcCoverage: 97 },
    ],
  },
  {
    id: "sde",
    name: "Street Dreams Ent.",
    status: "idle",
    statusLabel: "Idle",
    artists: 8,
    tracks: 54,
    audited: 61,
    pipeline: 214700,
    opportunities: [
      { track: "ATL Nights", artist: "Lil Baby", issue: "Publishing deal has no audit clause — rights grab risk", amount: 95000, severity: "critical", action: "Review Contract" },
      { track: "No Jumper", artist: "21 Savage", issue: "360 deal taking 15% of non-music income — dispute needed", amount: 34200, severity: "critical", action: "File Dispute" },
      { track: "Came Up", artist: "Rich Homie Quan", issue: "Mechanical royalties uncollected for 3 years", amount: 21000, severity: "warning", action: "Register Harry Fox" },
    ],
    alerts: [
      { type: "notice", title: "C&D Dispatched", body: "Cease and Desist successfully sent to Interscope. Awaiting response.", hash: "0x992...f2e" },
    ],
    roster: [
      { name: "Lil Baby", tracks: 21, leaks: 7, owed: 95000, isrcCoverage: 66 },
      { name: "21 Savage", tracks: 18, leaks: 5, owed: 65400, isrcCoverage: 78 },
      { name: "Rich Homie Quan", tracks: 15, leaks: 3, owed: 54300, isrcCoverage: 81 },
    ],
  },
  {
    id: "z6r",
    name: "Zone 6 Records",
    status: "urgent",
    statusLabel: "Action Needed",
    artists: 6,
    tracks: 41,
    audited: 44,
    pipeline: 392400,
    opportunities: [
      { track: "Walk It Talk It", artist: "Migos", issue: "ISRC registry hard-lock — Warner Chappell rival claim", amount: 88000, severity: "critical", action: "Intervene Now" },
      { track: "Bad and Boujee", artist: "Migos", issue: "Primary publisher not registered with BMI", amount: 52000, severity: "critical", action: "BMI Registration" },
      { track: "T-Shirt", artist: "Migos", issue: "Streaming royalties Q1-Q2 not reconciled", amount: 28400, severity: "warning", action: "Reconcile DSPs" },
    ],
    alerts: [
      { type: "urgent", title: "Registry Lock", body: "4 ISRCs hard-locked due to rival ownership claims from Warner Chappell. Requires immediate intervention.", },
      { type: "urgent", title: "Deadline: 72hrs", body: "Response required to Universal Music Group dispute notice. Failure to respond cedes rights.", },
    ],
    roster: [
      { name: "Migos", tracks: 28, leaks: 11, owed: 168400, isrcCoverage: 52 },
      { name: "Quavo", tracks: 13, leaks: 4, owed: 88000, isrcCoverage: 69 },
    ],
  },
  {
    id: "hcm",
    name: "Hustle Camp Music",
    status: "action",
    statusLabel: "Pending Review",
    artists: 9,
    tracks: 67,
    audited: 78,
    pipeline: 241600,
    opportunities: [
      { track: "Drip Too Hard", artist: "Gunna", issue: "Producer advance uncouped — YSL dispute pending", amount: 45000, severity: "critical", action: "Audit Recoupment" },
      { track: "Sold Out Dates", artist: "Gunna", issue: "Sync license revenue not passed through to artist", amount: 19800, severity: "warning", action: "Request Statement" },
    ],
    alerts: [
      { type: "notice", title: "Audit Complete", body: "Full catalog scan done. 14 critical issues identified across 7 artists." },
    ],
    roster: [
      { name: "Gunna", tracks: 29, leaks: 6, owed: 64800, isrcCoverage: 89 },
      { name: "Young Thug", tracks: 22, leaks: 5, owed: 91200, isrcCoverage: 83 },
      { name: "Lil Keed", tracks: 16, leaks: 3, owed: 42600, isrcCoverage: 76 },
    ],
  },
  {
    id: "nmg",
    name: "New Money Gang",
    status: "idle",
    statusLabel: "Onboarding",
    artists: 4,
    tracks: 28,
    audited: 19,
    pipeline: 147000,
    opportunities: [
      { track: "Money Longer", artist: "Lil Uzi Vert", issue: "No ISRC on 14 of 28 tracks — PROs can't pay", amount: 62000, severity: "critical", action: "ISRC Batch Register" },
      { track: "XO Tour Llif3", artist: "Lil Uzi Vert", issue: "Publishing deal lacks reversion clause", amount: 38000, severity: "critical", action: "Renegotiate" },
    ],
    alerts: [
      { type: "notice", title: "Intake Session Complete", body: "Day 1 Clean Room done. ISRC scan in progress. Health Report due in 6 days." },
    ],
    roster: [
      { name: "Lil Uzi Vert", tracks: 28, leaks: 14, owed: 147000, isrcCoverage: 50 },
    ],
  },
];

const TOTAL_PIPELINE = LABELS.reduce((s, l) => s + l.pipeline, 0);

// ─── Status styles ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  active:  "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500",
  idle:    "border-slate-800 hover:border-slate-500",
  urgent:  "border-red-500/50 bg-red-500/5 hover:border-red-500",
  action:  "border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/50",
};
const STATUS_TEXT: Record<string, string> = {
  active:  "text-purple-400",
  idle:    "text-slate-500",
  urgent:  "text-red-400",
  action:  "text-yellow-400",
};
const SEVERITY_STYLE: Record<string, string> = {
  critical: "border-l-4 border-red-500",
  warning:  "border-l-4 border-yellow-500",
  info:     "border-l-4 border-blue-500",
};
const ALERT_STYLE: Record<string, string> = {
  urgent:   "bg-red-950/20 border-red-900/30 text-red-300",
  notice:   "bg-slate-900 border-slate-800 text-slate-300",
  resolved: "bg-green-950/20 border-green-900/30 text-green-300",
};

// ─── War Room Modal ────────────────────────────────────────────────────────────

function WarRoom({ op, label, onClose }: { op: Opportunity; label: Label; onClose: () => void }) {
  const [filed, setFiled] = useState(false);

  const handleFile = () => {
    setTimeout(() => setFiled(true), 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f172a] border border-white/20 rounded-2xl max-w-2xl w-full p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-xs font-black text-red-400 mono uppercase mb-1">War Room — {label.name}</div>
            <h2 className="text-2xl font-black">{op.track}</h2>
            <div className="text-slate-400 text-sm">{op.artist}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="bg-[#1e293b] border border-white/10 rounded-xl p-5 mb-5">
          <div className="text-xs font-bold text-slate-500 mono uppercase mb-2">Issue</div>
          <p className="text-white text-sm">{op.issue}</p>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <div className="text-xs text-slate-500 mono">Recovery Potential</div>
              <div className="text-2xl font-black text-green-400">${op.amount.toLocaleString()}</div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500 mono mb-1">Evidence Status</div>
              <div className="flex gap-2">
                {["ISRC Verified", "Timestamp Hash", "Split Sheet"].map(e => (
                  <span key={e} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded mono">{e}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {filed ? (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">✓</div>
            <div className="text-green-400 font-black">Action Filed</div>
            <div className="text-xs text-slate-400 mono mt-1">Hash: TRP-{label.id.toUpperCase()}-{Date.now().toString(36).toUpperCase()}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleFile}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition text-sm">
              {op.action}
            </button>
            <button onClick={() => {
              const h = "TRP-" + label.id.toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
              const html = `<!DOCTYPE html><html><head><title>Dispute Notice</title></head><body style="font-family:Arial;max-width:800px;margin:40px auto;color:#111"><h1>DISPUTE NOTICE</h1><p><b>Matter:</b> ${op.track} — ${op.artist}</p><p><b>Label:</b> ${label.name}</p><p><b>Issue:</b> ${op.issue}</p><p><b>Recovery:</b> $${op.amount.toLocaleString()}</p><p><b>Reference:</b> ${h}</p><p>This notice is submitted pursuant to applicable royalty collection and intellectual property laws. The undersigned demands immediate cure of the above-described deficiency within 30 days.</p><br><p>___________________________<br>Attorney of Record</p></body></html>`;
              const blob = new Blob([html], {type:"text/html"});
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `dispute-${h}.html`; a.click();
            }}
              className="flex-1 py-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 font-bold rounded-xl transition text-sm">
              Generate Dispute Letter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CommandCenter() {
  const [activeId, setActiveId]         = useState("tgm");
  const [warRoom, setWarRoom]           = useState<{ op: Opportunity; label: Label } | null>(null);
  const [animPipeline, setAnimPipeline] = useState(0);

  const label = LABELS.find(l => l.id === activeId) || LABELS[0];

  useEffect(() => {
    let start = 0;
    const end = TOTAL_PIPELINE;
    const duration = 1200;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setAnimPipeline(Math.round(start));
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <style>{`
        .mono { font-family: 'JetBrains Mono','Fira Code',monospace; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        .fu { animation: fadeUp 0.3s ease both; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .blink { animation: blink 1.5s ease infinite; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,.4); border-radius: 2px; }
      `}</style>

      {/* ── Header ── */}
      <header className="border-b border-white/10 bg-[#0a0f1e] sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <span className="blink text-purple-400 text-xs">●</span>
              <span className="text-xs font-black mono uppercase tracking-[0.2em] text-slate-400">
                Firm Command Center
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase italic">
              TrapRoyaltiesPro <span className="text-purple-400">Attorney Terminal</span>
            </h1>
            <p className="text-slate-500 mono text-[10px] mt-0.5">
              Managed Portfolios: {LABELS.length} Labels / {LABELS.reduce((s, l) => s + l.artists, 0)} Artists
            </p>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-bold uppercase mono mb-1">Total Firm Recovery Pipeline</div>
            <div className="text-4xl font-black text-purple-400 mono">
              ${animPipeline.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mono mt-1">across {LABELS.length} active labels</div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-8 py-8">

        {/* ── Label Switcher ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {LABELS.map(l => (
            <button key={l.id} onClick={() => setActiveId(l.id)}
              className={`glass p-4 rounded-xl border text-left transition-all duration-200 ${
                activeId === l.id ? STATUS_STYLE.active : STATUS_STYLE[l.status] || STATUS_STYLE.idle
              }`}>
              <p className={`text-[9px] font-black uppercase mono mb-1 tracking-widest ${
                activeId === l.id ? "text-purple-400" : STATUS_TEXT[l.status]
              }`}>{l.statusLabel}</p>
              <p className="font-black text-sm uppercase leading-tight">{l.name}</p>
              <p className="text-[10px] text-slate-500 mono mt-1">
                {l.artists} artists · {l.tracks} tracks
              </p>
              <p className="text-[10px] font-black text-green-400 mono mt-0.5">
                ${(l.pipeline / 1000).toFixed(0)}k pipeline
              </p>
            </button>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 fu" key={activeId}>

          {/* Left: Label detail + opportunities */}
          <div className="lg:col-span-2 space-y-6">

            {/* Label header */}
            <div className="flex items-center justify-between bg-[#1e293b]/60 border border-slate-800 rounded-2xl p-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mono mb-1">
                  Active View
                </h3>
                <h2 className="text-xl font-black">{label.name}</h2>
                <p className="text-slate-500 text-sm mono">{label.artists} artists · {label.tracks} tracks</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-black text-purple-400 mono">${(label.pipeline / 1000).toFixed(0)}k</div>
                  <div className="text-[10px] text-slate-500 mono">pipeline</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-black mono ${label.audited >= 80 ? "text-green-400" : label.audited >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                    {label.audited}%
                  </div>
                  <div className="text-[10px] text-slate-500 mono">audited</div>
                </div>
              </div>
            </div>

            {/* Recovery opportunities */}
            <div className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6">
              <h4 className="text-xs font-black mono uppercase tracking-widest text-slate-400 mb-5">
                Top Recovery Opportunities
              </h4>
              <div className="space-y-3">
                {label.opportunities.map((op, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 bg-[#0f172a] rounded-xl ${SEVERITY_STYLE[op.severity]}`}>
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-bold truncate">{op.track}
                        <span className="text-slate-500 font-normal"> — {op.artist}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase mono mt-0.5">{op.issue}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black mono">${op.amount.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-500">at risk</p>
                      </div>
                      <button onClick={() => setWarRoom({ op, label })}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                          op.severity === "critical"
                            ? "bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/40"
                            : "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 hover:bg-yellow-600/40"
                        }`}>
                        {op.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Artist roster health */}
            <div className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6">
              <h4 className="text-xs font-black mono uppercase tracking-widest text-slate-400 mb-5">
                Artist Roster Health
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] text-slate-500 mono uppercase">
                      <th className="text-left pb-3">Artist</th>
                      <th className="text-right pb-3">Tracks</th>
                      <th className="text-right pb-3">Leaks</th>
                      <th className="text-right pb-3">Owed</th>
                      <th className="text-right pb-3">ISRC %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {label.roster.map(r => (
                      <tr key={r.name} className="hover:bg-slate-900/5 transition">
                        <td className="py-3 font-bold">{r.name}</td>
                        <td className="py-3 text-right mono text-slate-400">{r.tracks}</td>
                        <td className="py-3 text-right">
                          <span className={`mono font-black ${r.leaks >= 8 ? "text-red-400" : r.leaks >= 4 ? "text-yellow-400" : "text-green-400"}`}>
                            {r.leaks}
                          </span>
                        </td>
                        <td className="py-3 text-right mono font-bold text-green-400">
                          ${r.owed.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`mono text-xs ${r.isrcCoverage >= 90 ? "text-green-400" : r.isrcCoverage >= 70 ? "text-yellow-400" : "text-red-400"}`}>
                            {r.isrcCoverage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Alerts + quick links */}
          <div className="space-y-5">

            {/* Firm-wide urgent alerts */}
            <div className="bg-[#1e293b]/60 border border-red-500/20 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-red-400 uppercase mono mb-5 tracking-widest italic">
                Global Firm Alerts
              </h3>
              <div className="space-y-4">
                {LABELS.flatMap(l =>
                  l.alerts.filter(a => a.type === "urgent").map(a => ({...a, labelName: l.name}))
                ).map((a, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${ALERT_STYLE.urgent}`}>
                    <p className="text-[10px] font-black uppercase mono mb-1 italic">{a.title}</p>
                    <p className="text-xs mb-1 text-slate-400">
                      <span className="text-red-400 font-bold">{(a as any).labelName}</span> — {a.body}
                    </p>
                    <button
                      onClick={() => {
                        const l = LABELS.find(lb => lb.alerts.some(al => al.title === a.title));
                        if (l) setActiveId(l.id);
                      }}
                      className="w-full mt-2 bg-red-600/20 text-red-400 py-2 rounded text-[9px] font-black uppercase hover:bg-red-600/40 transition mono">
                      Intervene Now
                    </button>
                  </div>
                ))}

                {LABELS.flatMap(l =>
                  l.alerts.filter(a => a.type !== "urgent").map(a => ({...a, labelName: l.name}))
                ).map((a, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${ALERT_STYLE[a.type]}`}>
                    <p className="text-[10px] font-bold uppercase mono mb-1">{a.title}</p>
                    <p className="text-xs text-slate-400">{a.body}</p>
                    {a.hash && (
                      <p className="text-[9px] text-slate-500 mt-2 italic mono">Hash: {a.hash}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xs font-bold uppercase mono tracking-widest text-slate-400 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/attorney-portal"
                  className="flex items-center gap-3 px-4 py-3 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-600/30 transition text-sm font-bold">
                  <span>⚖️</span> Contract Risk Analyzer
                </Link>
                <Link href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 bg-purple-600/20 border border-purple-500/30 text-indigo-300 rounded-lg hover:bg-purple-600/30 transition text-sm font-bold">
                  <span>🔎</span> ISRC Search & Register
                </Link>
                <Link href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 bg-slate-900/5 border border-white/10 text-slate-300 rounded-lg hover:bg-slate-900/10 transition text-sm font-bold">
                  <span>🌐</span> Generate DDEX Package
                </Link>
                <Link href="/onboard"
                  className="flex items-center gap-3 px-4 py-3 bg-green-600/10 border border-green-500/20 text-green-300 rounded-lg hover:bg-green-600/20 transition text-sm font-bold">
                  <span>🤝</span> Onboard New Label
                </Link>
              </div>
            </div>

            {/* Firm summary */}
            <div className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xs font-bold uppercase mono tracking-widest text-slate-400 mb-4">Firm Summary</h3>
              <div className="space-y-3">
                {[
                  { label: "Labels Managed", val: LABELS.length.toString() },
                  { label: "Total Artists", val: LABELS.reduce((s, l) => s + l.artists, 0).toString() },
                  { label: "Total Tracks", val: LABELS.reduce((s, l) => s + l.tracks, 0).toString() },
                  { label: "Urgent Actions", val: LABELS.flatMap(l => l.alerts.filter(a => a.type === "urgent")).length.toString(), red: true },
                  { label: "Total Pipeline", val: `$${(TOTAL_PIPELINE / 1000).toFixed(0)}k`, green: true },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 mono">{r.label}</span>
                    <span className={`text-sm font-black mono ${r.red ? "text-red-400" : r.green ? "text-green-400" : "text-white"}`}>
                      {r.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── War Room Modal ── */}
      {warRoom && (
        <WarRoom op={warRoom.op} label={warRoom.label} onClose={() => setWarRoom(null)} />
      )}
    </div>
  );
}
