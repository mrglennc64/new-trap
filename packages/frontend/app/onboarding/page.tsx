"use client";

import { useState } from "react";
import Link from "next/link";

const STEPS = [
  {
    day: "Day 1",
    title: "Clean Room Session",
    icon: "🏢",
    color: "indigo",
    desc: "We come to your office or studio. Bring your hard drives, DSP statements, and any contracts you have. We scan everything and pull every ISRC, UPC, and split on record.",
    actions: ["ISRC scan of your full catalog", "DSP statement audit (Spotify, Apple, Tidal)", "Contract intake + risk flag", "Split sheet review"],
  },
  {
    day: "Day 7",
    title: "Health Report Delivered",
    icon: "📊",
    color: "blue",
    desc: "You get a full Money Leak Report — every track missing an ISRC, every uncollected mechanical, every split that doesn't add up to 100%. Prioritized by dollar amount at risk.",
    actions: ["Full catalog risk score", "Money leak breakdown by track", "DSP discrepancy flags", "Attorney review recommended items"],
  },
  {
    day: "Day 30",
    title: "First Dispute Filed",
    icon: "⚖️",
    color: "purple",
    desc: "Your first royalty dispute or registration correction goes out the door — with timestamps, ISRC evidence, and attorney-signed documentation. Most DSPs respond within 30–60 days.",
    actions: ["Dispute letter generated + timestamped", "ISRC registration corrected", "PRO metadata updated", "DDEX package sent to distribution"],
  },
  {
    day: "Day 60",
    title: "First Settlement",
    icon: "💰",
    color: "green",
    desc: "DSPs and PROs respond. We track every incoming settlement and reconcile against your original catalog data. If they underpay, we dispute again.",
    actions: ["Settlement tracking dashboard", "Reconciliation against audit data", "Secondary dispute if underpaid", "Revenue attribution updated"],
  },
  {
    day: "Day 90",
    title: "90-Day Review",
    icon: "🔄",
    color: "orange",
    desc: "Full performance review. How much was recovered, what's still in dispute, and what your recurring protection plan looks like going forward.",
    actions: ["Total recovery report", "Ongoing dispute status", "Recurring monitoring plan", "Label partnership discussion"],
  },
];

const FEATURES = [
  {
    icon: "🔎",
    title: "ISRC Search",
    path: "/dashboard",
    section: "isrc",
    desc: "Search any track by title + artist across MusicBrainz and Deezer. Pulls ISRC, label, release date, and credits automatically. No ISRC? We find it or register one.",
    detail: "Every track needs an ISRC to collect from PROs, SoundExchange, and international societies. Missing one = money left behind.",
  },
  {
    icon: "🎵",
    title: "Catalog Manager",
    path: "/dashboard",
    section: "catalog",
    desc: "Your full track catalog with real-time money leak scanning. Every missing credit, broken split, or unregistered track shows up with a risk score.",
    detail: "We scan for: missing ISRC, missing songwriters, splits not totaling 100%, unpaid royalties, no label attached, no primary artist linked.",
  },
  {
    icon: "⚡",
    title: "Label Workspace",
    path: "/dashboard",
    section: "workspace",
    desc: "Terminal-style interface to review every track's risk score, fix leaks, and generate corrective documents. Built for speed — not spreadsheets.",
    detail: "Click any track to expand its full money leak panel. Each issue has a severity level (critical/warning/info) and a fix action.",
  },
  {
    icon: "🌐",
    title: "DDEX Generator",
    path: "/dashboard",
    section: "ddex",
    desc: "Generate industry-standard DDEX ERN XML packages for distribution. Used by all major DSPs for metadata ingestion — Spotify, Apple Music, Tidal, Amazon.",
    detail: "DDEX is the XML language DSPs use to accept track metadata. Correct DDEX = correct credits on streaming platforms = correct royalty routing.",
  },
  {
    icon: "📋",
    title: "Legal Documents",
    path: "/dashboard",
    section: "documents",
    desc: "Timestamped PDFs of every dispute letter, split sheet, ISRC registration, and audit report. Attorney-ready. Court-admissible.",
    detail: "Every document is timestamped and tied to your catalog data. If a DSP challenges your claim, you have evidence.",
  },
  {
    icon: "🏢",
    title: "Label Portal",
    path: "/label",
    section: "",
    desc: "Full label operations dashboard: branding, artist roster, contract vault, payout manager, recoupment tracking, and settlement calculator.",
    detail: "Built for independent labels managing 5–500 artists. Replaces 6 different spreadsheets with one system.",
  },
  {
    icon: "⚖️",
    title: "Attorney Portal",
    path: "/attorney-portal",
    section: "",
    desc: "AI-powered contract risk analysis. Upload any recording, publishing, or distribution agreement and get a risk score with specific red flag explanations.",
    detail: "Uses pattern matching against known bad clauses: excessive recoupment, rights grabs, unclear royalty definitions, no audit rights.",
  },
  {
    icon: "🤝",
    title: "Partnership Program",
    path: "/partnership",
    section: "",
    desc: "Full-service engagement for labels and management companies. Includes the 90-day sprint, ongoing monitoring, and attorney access.",
    detail: "$5k onboarding + $500/mo retainer + 5% of recovered royalties. Everything included.",
  },
];

const LEAKS = [
  { emoji: "❌", title: "Missing ISRC", impact: "Cannot collect from SoundExchange, PROs, or international societies", freq: "68% of indie catalogs" },
  { emoji: "❌", title: "No Songwriter Credits", impact: "Mechanical royalties go unclaimed — 9.1¢/stream stays at publisher", freq: "54% of tracks" },
  { emoji: "⚠️", title: "Splits Don't Add to 100%", impact: "Disputed ownership = frozen payments, potential lawsuit", freq: "31% of multi-artist tracks" },
  { emoji: "⚠️", title: "Wrong Label Code", impact: "Streaming payouts go to wrong entity, requires dispute to recover", freq: "22% of catalog transfers" },
  { emoji: "⚠️", title: "No UPC", impact: "Track doesn't show up correctly across all DSPs", freq: "41% of tracks before 2020" },
  { emoji: "ℹ️", title: "Missing Producer Credits", impact: "Producer points can't be paid — contract disputes later", freq: "77% of trap/hip-hop releases" },
];

const COLOR = {
  indigo: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
  blue:   "bg-blue-500/10 border-blue-500/30 text-blue-400",
  purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  green:  "bg-green-500/10 border-green-500/30 text-green-400",
  orange: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
} as const;

export default function OnboardingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeStep, setActiveStep]       = useState(0);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        .fu { animation: fadeUp 0.4s ease both; }
        @keyframes pulse-slow { 0%,100%{opacity:1} 50%{opacity:.6} }
        .pulse-slow { animation: pulse-slow 3s ease infinite; }
        .mono { font-family: 'JetBrains Mono','Fira Code',monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,.4); border-radius: 2px; }
      `}</style>

      {/* ── Hero ── */}
      <section className="relative border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-transparent to-purple-900/20 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-4 py-2 rounded-full mb-6 mono">
            <span className="pulse-slow">●</span> TRAPROYALTIESPRO — Platform Overview
          </div>

          <h1 className="text-5xl font-black mb-5 leading-tight">
            Your music is making money<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Someone else is keeping it.
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            TrapRoyaltiesPro is a royalty recovery and catalog protection system built for
            independent artists, labels, and their attorneys. We find missing money.
            We build the paper trail. We get it back.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition text-base">
              ⚡ Open Data Hub
            </Link>
            <Link href="/free-audit"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition text-base border border-white/20">
              Run Free Audit
            </Link>
            <Link href="/partnership"
              className="px-8 py-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold rounded-xl transition text-base border border-purple-500/30">
              Partnership Program →
            </Link>
          </div>
        </div>
      </section>

      {/* ── By the numbers ── */}
      <section className="border-b border-white/10 bg-[#0a0f1e]/50">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: "$2.5B+", label: "Unclaimed royalties annually (RIAA)" },
            { n: "68%",    label: "Indie catalog tracks missing ISRC" },
            { n: "90 days",label: "Median time to first recovery" },
            { n: "5%",     label: "Success fee — you only pay on results" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-indigo-400 mono">{s.n}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Money leaks ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mono mb-2">Common Money Leaks</div>
          <h2 className="text-3xl font-black">What we find in every catalog</h2>
          <p className="text-slate-400 mt-2 max-w-xl">These are the six most common issues across 10,000+ tracks we have audited. Every one represents uncollected income.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEAKS.map((l, i) => (
            <div key={i} className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-5 flex gap-4">
              <div className="text-2xl flex-shrink-0">{l.emoji}</div>
              <div>
                <div className="font-bold text-sm mb-1">{l.title}</div>
                <div className="text-slate-400 text-sm mb-2">{l.impact}</div>
                <div className="mono text-xs text-slate-600">Found in {l.freq}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-300 font-bold rounded-xl hover:bg-red-500/30 transition">
            Scan your catalog for leaks →
          </Link>
        </div>
      </section>

      {/* ── Platform features ── */}
      <section className="border-t border-white/10 bg-[#0a0f1e]/50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-10">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mono mb-2">Platform Features</div>
            <h2 className="text-3xl font-black">Everything in one system</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-8">
            {FEATURES.map((f, i) => (
              <button key={i} onClick={() => setActiveFeature(i)}
                className={`text-left px-4 py-3 rounded-xl border transition-all ${
                  activeFeature === i
                    ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                    : "border-white/10 text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/5"
                }`}>
                <span className="text-lg mr-2">{f.icon}</span>
                <span className="text-sm font-semibold">{f.title}</span>
              </button>
            ))}
          </div>

          <div className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-8 fu" key={activeFeature}>
            <div className="flex items-start gap-5">
              <div className="text-5xl">{FEATURES[activeFeature].icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-2">{FEATURES[activeFeature].title}</h3>
                <p className="text-slate-300 mb-4">{FEATURES[activeFeature].desc}</p>
                <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4 text-sm text-slate-400 mono mb-5">
                  {FEATURES[activeFeature].detail}
                </div>
                <Link
                  href={FEATURES[activeFeature].path}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition text-sm">
                  Open {FEATURES[activeFeature].title} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 90-Day Sprint ── */}
      <section className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-10">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mono mb-2">The Process</div>
            <h2 className="text-3xl font-black">90-Day Recovery Sprint</h2>
            <p className="text-slate-400 mt-2 max-w-xl">From first session to first check — here is what the full engagement looks like.</p>
          </div>

          {/* Timeline */}
          <div className="flex flex-col md:flex-row gap-3 mb-8">
            {STEPS.map((s, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                className={`flex-1 text-left px-4 py-3 rounded-xl border transition-all ${
                  activeStep === i
                    ? `border-${s.color}-500/50 bg-${s.color}-500/10`
                    : "border-white/10 hover:border-white/30 hover:bg-white/5"
                }`}>
                <div className="text-xs font-black text-slate-500 mono">{s.day}</div>
                <div className="text-sm font-bold mt-0.5">{s.title}</div>
              </button>
            ))}
          </div>

          <div className={`rounded-2xl border p-8 fu ${COLOR[STEPS[activeStep].color as keyof typeof COLOR]}`} key={activeStep}>
            <div className="flex items-start gap-5">
              <div className="text-5xl">{STEPS[activeStep].icon}</div>
              <div className="flex-1">
                <div className="mono text-xs font-black mb-1 opacity-70">{STEPS[activeStep].day}</div>
                <h3 className="text-2xl font-black mb-3">{STEPS[activeStep].title}</h3>
                <p className="text-slate-300 mb-5">{STEPS[activeStep].desc}</p>
                <ul className="space-y-2">
                  {STEPS[activeStep].actions.map((a, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <span className="text-green-400 flex-shrink-0">✓</span>
                      <span className="text-slate-300">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Artist Quick Start ── */}
      <section className="border-t border-white/10 bg-[#0a0f1e]/50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-10">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mono mb-2">Artist Quick Start</div>
            <h2 className="text-3xl font-black">Get started in 15 minutes</h2>
            <p className="text-slate-400 mt-2">No account needed. Everything runs locally in your browser — your data never leaves your device until you choose to file a dispute.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: "🔎",
                title: "Search Your Track",
                desc: "Go to the Data Hub. Type your track title + artist name. We pull the ISRC, label, and release date from MusicBrainz and Deezer automatically.",
                cta: "Open ISRC Search",
                href: "/dashboard",
              },
              {
                step: "02",
                icon: "🎵",
                title: "Add to Catalog",
                desc: "Click any result to pre-fill the track form. Add songwriters, producers, splits, and your featured artists. Hit Save — the money leak scanner runs instantly.",
                cta: "Open Catalog",
                href: "/dashboard",
              },
              {
                step: "03",
                icon: "📋",
                title: "Generate Documents",
                desc: "Once your catalog is clean — generate a DDEX package for distribution or a timestamped dispute letter for your attorney. One click.",
                cta: "Open Documents",
                href: "/dashboard",
              },
            ].map(s => (
              <div key={s.step} className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6">
                <div className="mono text-xs font-black text-slate-600 mb-3">{s.step}</div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-black text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm mb-5">{s.desc}</p>
                <Link href={s.href}
                  className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 px-4 py-2 rounded-lg transition">
                  {s.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who this is for ── */}
      <section className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-10">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mono mb-2">Who This Is For</div>
            <h2 className="text-3xl font-black">Built for the whole ecosystem</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎤",
                title: "Independent Artists",
                desc: "You released music, it's streaming, but the checks are missing or wrong. We trace every dollar from stream to split.",
                items: ["Find your ISRC", "Register with PROs", "Dispute underpayments", "Generate split sheets"],
              },
              {
                icon: "🏢",
                title: "Labels & Management",
                desc: "You manage 10–500 artists across multiple DSPs and distributors. Our label workspace gives you catalog-wide oversight in one dashboard.",
                items: ["Full roster ISRC audit", "Payout reconciliation", "DDEX batch generation", "Recoupment tracking"],
              },
              {
                icon: "⚖️",
                title: "Music Attorneys",
                desc: "Your clients come to you with missing royalties and no documentation. We build the timestamped evidence trail you need to file and win.",
                items: ["AI contract risk analysis", "Dispute letter generation", "ISRC evidence packaging", "Settlement tracking"],
              },
            ].map(c => (
              <div key={c.title} className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6">
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="font-black text-lg mb-2">{c.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{c.desc}</p>
                <ul className="space-y-1.5">
                  {c.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-indigo-400">→</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/10 bg-gradient-to-br from-indigo-900/30 to-purple-900/20">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-black mb-4">Ready to find your money?</h2>
          <p className="text-slate-400 mb-10 text-lg">
            Start free — scan your catalog in 15 minutes. No account, no card, no spreadsheets.
            If you want the full 90-day sprint with attorney access, contact us about the Partnership Program.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard"
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition text-lg">
              ⚡ Start Now — It's Free
            </Link>
            <Link href="/partnership"
              className="px-10 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition text-lg">
              Partnership Program →
            </Link>
          </div>
          <div className="mt-8 text-xs text-slate-600 mono">
            Atlanta-based. Serving independent artists and labels nationally.
          </div>
        </div>
      </section>
    </div>
  );
}
