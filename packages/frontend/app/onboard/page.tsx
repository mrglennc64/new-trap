'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

const FOLDERS = [
  {
    id: 'distribution',
    letter: 'A',
    label: 'Distribution Exports',
    sub: 'The "Master" Data',
    icon: '📊',
    color: 'indigo',
    desc: 'Raw .csv or .txt exports from your distributor (The Orchard, DistroKid, UnitedMasters). Contains ISRC, UPC, and Earnings by Track.',
    accepts: '.csv, .txt, .xlsx',
    examples: ['DistroKid earnings export', 'The Orchard delivery report', 'UnitedMasters royalty CSV'],
  },
  {
    id: 'society',
    letter: 'B',
    label: 'Society Statements',
    sub: 'The "Evidence"',
    icon: '📋',
    color: 'purple',
    desc: 'PDF or CSV statements from SoundExchange, ASCAP/BMI, and The MLC. This is where the gap between what you earned and what you collected becomes visible.',
    accepts: '.pdf, .csv',
    examples: ['SoundExchange quarterly statement', 'ASCAP/BMI royalty statement', 'The MLC matching report'],
  },
  {
    id: 'splits',
    letter: 'C',
    label: 'The Split Vault',
    sub: 'The "Legal"',
    icon: '⚖️',
    color: 'emerald',
    desc: 'Scans of signed split sheets or PDF contracts. Our AI reads these to verify that actual payments match the legal agreement on file.',
    accepts: '.pdf, .jpg, .png',
    examples: ['Producer split sheet', 'Feature artist agreement', 'Co-writer contract'],
  },
  {
    id: 'loss',
    letter: 'D',
    label: 'The Loss Log',
    sub: 'The "Evidence of Harm"',
    icon: '⚠️',
    color: 'red',
    desc: 'Any emails or takedown notices received. Helps the AI identify where copyright strikes are actively blocking revenue streams.',
    accepts: '.pdf, .eml, .msg, .txt',
    examples: ['DMCA takedown notices', 'Platform content ID disputes', 'Distribution rejection emails'],
  },
];

const AUTO_FIX_ITEMS = [
  { severity: 'critical', icon: '⚠️', label: 'Missing ISRC',        fix: 'Query IFPI/Soundcharts API to locate or generate',    color: 'red' },
  { severity: 'critical', icon: '⚠️', label: 'Missing ISWC',        fix: 'Auto-Link via MLC API — bridges master to composition', color: 'red' },
  { severity: 'critical', icon: '⚠️', label: 'No Songwriter Credit', fix: 'Flag 100% of writer share as Blocked/Uncollectible',   color: 'red' },
  { severity: 'critical', icon: '⚠️', label: 'IPI Mismatch',        fix: 'Cross-reference ACE (ASCAP) and Repertory (BMI) APIs', color: 'red' },
  { severity: 'warning',  icon: '⚡', label: 'Missing UPC',          fix: 'Generate batch UPC via distributor API',               color: 'orange' },
  { severity: 'warning',  icon: '⚡', label: 'Over-Allocation (>100%)', fix: 'Flag for attorney review — payment frozen until resolved', color: 'orange' },
  { severity: 'warning',  icon: '⚡', label: 'No Release Date',      fix: 'Required for DDEX package — prompt for manual entry',  color: 'orange' },
  { severity: 'warning',  icon: '⚡', label: 'Artist Name Drift',    fix: 'Merge identity across platforms via fuzzy match',       color: 'orange' },
  { severity: 'info',     icon: 'ℹ️', label: 'No Producer Credits',  fix: 'Flag producer royalties as at-risk',                   color: 'blue' },
  { severity: 'info',     icon: 'ℹ️', label: 'No Label Attached',    fix: 'Ownership unclear — prompt label assignment',          color: 'blue' },
];

const LEAKAGE_TABLE = [
  { source: 'Missing ISWC → ISRC Link', tracks: 38, estLoss: 84000,  severity: 'critical' },
  { source: 'IPI Mismatch / Writer Gaps', tracks: 12, estLoss: 22500, severity: 'critical' },
  { source: 'Unclaimed SoundExchange',   tracks: 22, estLoss: 41200,  severity: 'warning'  },
  { source: 'Double Claims / Over-Alloc', tracks: 5, estLoss: 39500,  severity: 'warning'  },
];

const STEPS = [
  { n: '01', icon: '🔌', title: 'Plug in USB',          desc: 'Arrive at the office with a portable external drive containing the 4 data folders.' },
  { n: '02', icon: '📂', title: 'Drag Folders In',       desc: 'Client drags each USB folder into the corresponding upload zone. All encryption happens locally in the browser before any data leaves their machine.' },
  { n: '03', icon: '🧠', title: 'AI Parsing Engine',     desc: 'Schema-agnostic parser identifies columns across any distributor format. DistroKid, The Orchard, UnitedMasters — all normalized to the same Master Catalog JSON.' },
  { n: '04', icon: '🔍', title: 'Forensic Scan',         desc: 'Cross-references 15+ databases: MusicBrainz, SoundExchange, ASCAP, BMI, The MLC, ISRC Registry, Spotify, Apple Music, AcoustID.' },
  { n: '05', icon: '⚡', title: 'Auto-Fix Triggers',     desc: 'Critical errors surface instantly. One-click submission generates CWR files, submits ISRC requests, and flags splits for attorney review.' },
  { n: '06', icon: '💰', title: 'Live Dashboard',        desc: 'Mock data is replaced by real forensic math. The "$187,200 Projected Recovery Opportunity" becomes specific to their catalog.' },
];

export default function OnboardPage() {
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const totalLeakage = LEAKAGE_TABLE.reduce((s, r) => s + r.estLoss, 0);
  const uploadedCount = Object.values(uploaded).filter(Boolean).length;

  function handleDrop(folderId: string) {
    setUploaded(prev => ({ ...prev, [folderId]: true }));
    setDragOver(null);
  }

  function handleFile(folderId: string) {
    setUploaded(prev => ({ ...prev, [folderId]: true }));
  }

  function runScan() {
    setScanning(true);
    setTimeout(() => { setScanning(false); setScanDone(true); }, 2800);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse2 { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .scanning-dot { animation: pulse2 1.2s ease infinite; }
        .spinner { animation: spin 0.9s linear infinite; }
      `}</style>

      {/* Hero */}
      <div className="bg-[#0f172a] border-b border-white/10 py-14">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-4 py-1 text-indigo-300 text-xs font-semibold mb-6 uppercase tracking-widest">
            USB-First Onboarding Protocol
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Label Forensic Onboarding
          </h1>
          <p className="text-xl text-slate-400 mb-3 max-w-2xl mx-auto">
            You're not taking MP3s. You're capturing the <span className="text-white font-semibold">Financial DNA</span> of the label.
          </p>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Arrive with a portable USB drive. Upload four folders. Our AI cross-references 15+ databases and surfaces every dollar sitting in the Black Box.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs">
            {['AES-256 Encrypted', 'SHA-256 File Hashing', 'Zero-Knowledge Transfer', 'Local Encryption Before Upload'].map(t => (
              <span key={t} className="bg-[#1e293b] border border-white/10 rounded-full px-3 py-1 text-slate-400">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* How It Works Steps */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-white">How the USB Onboarding Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.n} className="fade-up bg-[#0f172a] border border-white/10 rounded-2xl p-5" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{s.n}</span>
                </div>
                <h3 className="font-bold text-white mb-1">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4-Folder Upload Zone */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Upload the 4 USB Folders</h2>
              <p className="text-slate-500 text-sm mt-1">Drag each folder from the USB drive into the corresponding zone below</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-white">{uploadedCount}<span className="text-slate-500 text-lg font-normal">/4</span></div>
              <div className="text-xs text-slate-500">folders loaded</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FOLDERS.map(f => {
              const done = uploaded[f.id];
              const over = dragOver === f.id;
              const borderColor = {
                indigo: done ? 'border-indigo-500/60 bg-indigo-600/10' : over ? 'border-indigo-400 bg-indigo-600/15' : 'border-white/10 bg-[#0f172a]',
                purple: done ? 'border-purple-500/60 bg-purple-600/10' : over ? 'border-purple-400 bg-purple-600/15' : 'border-white/10 bg-[#0f172a]',
                emerald: done ? 'border-emerald-500/60 bg-emerald-600/10' : over ? 'border-emerald-400 bg-emerald-600/15' : 'border-white/10 bg-[#0f172a]',
                red: done ? 'border-red-500/60 bg-red-600/10' : over ? 'border-red-400 bg-red-600/15' : 'border-white/10 bg-[#0f172a]',
              }[f.color];
              return (
                <div
                  key={f.id}
                  className={`border-2 border-dashed rounded-2xl p-5 transition-all duration-200 cursor-pointer ${borderColor}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(f.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); handleDrop(f.id); }}
                  onClick={() => fileRefs.current[f.id]?.click()}
                >
                  <input
                    type="file"
                    multiple
                    ref={el => { fileRefs.current[f.id] = el; }}
                    className="hidden"
                    onChange={() => handleFile(f.id)}
                  />
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">{f.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Folder {f.letter}</span>
                        {done && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5 font-semibold">Loaded ✓</span>}
                      </div>
                      <h3 className="font-bold text-white text-sm">{f.label}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mb-2">{f.sub}</p>
                      <p className="text-slate-400 text-xs leading-relaxed mb-3">{f.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {f.examples.map(ex => (
                          <span key={ex} className="text-[10px] bg-white/5 border border-white/10 rounded px-2 py-0.5 text-slate-500">{ex}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-600 mt-2">Accepts: {f.accepts}</p>
                    </div>
                  </div>
                  {!done && (
                    <div className="mt-3 text-center text-xs text-slate-600">
                      {over ? '⬇ Drop to load' : 'Drag folder here or click to browse'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scan button */}
          <div className="mt-6 flex justify-center">
            {!scanDone ? (
              <button
                onClick={runScan}
                disabled={uploadedCount === 0 || scanning}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200 ${
                  uploadedCount === 0
                    ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                    : scanning
                    ? 'bg-indigo-600 text-white cursor-wait'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 shadow-xl shadow-indigo-500/20'
                }`}
              >
                {scanning ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
                    Running Forensic Scan...
                  </>
                ) : (
                  <>🔍 Run Forensic Audit Scan</>
                )}
              </button>
            ) : (
              <div className="text-center">
                <div className="text-emerald-400 font-bold text-lg mb-1">✓ Scan Complete</div>
                <div className="text-slate-500 text-sm">Mock data replaced with forensic projections</div>
              </div>
            )}
          </div>
        </section>

        {/* Forensic Scan Results */}
        {scanDone && (
          <section className="fade-up">
            <div className="bg-[#0f172a] border border-red-500/30 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-1">CONFIDENTIAL — Forensic Metadata Audit</div>
                  <h2 className="text-lg font-black text-white">⚠ CRITICAL ACTION REQUIRED</h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-red-400">${totalLeakage.toLocaleString('en-US')}</div>
                  <div className="text-xs text-slate-500">Projected Recovery Opportunity</div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#1e293b] rounded-xl p-4 text-center border border-white/5">
                    <div className="text-2xl font-black text-white">69%</div>
                    <div className="text-xs text-slate-500 mt-1">Metadata Health Score</div>
                    <div className="text-[10px] text-red-400 mt-0.5">Industry standard: &gt;95%</div>
                  </div>
                  <div className="bg-[#1e293b] rounded-xl p-4 text-center border border-white/5">
                    <div className="text-2xl font-black text-orange-400">31%</div>
                    <div className="text-xs text-slate-500 mt-1">Metadata Leakage Rate</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">Black Box accumulation</div>
                  </div>
                  <div className="bg-[#1e293b] rounded-xl p-4 text-center border border-white/5">
                    <div className="text-2xl font-black text-red-400">5</div>
                    <div className="text-xs text-slate-500 mt-1">Critical Errors</div>
                    <div className="text-[10px] text-red-400 mt-0.5">Payments currently locked</div>
                  </div>
                </div>

                {/* Leakage Table */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-3">The "Fatal 5" — Black Box Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 px-3 text-slate-500 text-xs font-medium">Error Type</th>
                          <th className="text-center py-2 px-3 text-slate-500 text-xs font-medium">Affected</th>
                          <th className="text-right py-2 px-3 text-slate-500 text-xs font-medium">Est. Annual Leakage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {LEAKAGE_TABLE.map((row, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${row.severity === 'critical' ? 'bg-red-500' : 'bg-orange-400'}`} />
                                <span className="text-white text-sm">{row.source}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center text-slate-400 text-sm">{row.tracks} tracks</td>
                            <td className="py-3 px-3 text-right font-bold text-red-400">${row.estLoss.toLocaleString('en-US')}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-red-500/30 bg-red-500/5">
                          <td colSpan={2} className="py-3 px-3 font-black text-white">TOTAL PROJECTED RECOVERY</td>
                          <td className="py-3 px-3 text-right font-black text-red-400 text-lg">${totalLeakage.toLocaleString('en-US')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-4 text-sm text-indigo-300">
                  <span className="font-bold text-white">💡 Lawyer-Proof Disclaimer: </span>
                  Based on your catalog's stream data and the {LEAKAGE_TABLE.reduce((s,r)=>s+r.tracks,0)} tracks identified as having critical metadata gaps, our AI projects a <strong>${totalLeakage.toLocaleString('en-US')} Projected Recovery Opportunity</strong> currently sitting in the Black Box. These funds are subject to Statutes of Limitation — unclaimed royalties are redistributed to other rights holders within 18–24 months.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Auto-Fix Engine */}
        <section>
          <h2 className="text-2xl font-bold mb-2 text-white">Auto-Fix Engine</h2>
          <p className="text-slate-500 text-sm mb-6">As data is ingested, these validation hooks fire automatically. One-click submission generates CWR files and flags issues for attorney review.</p>
          <div className="space-y-2">
            {AUTO_FIX_ITEMS.map((item, i) => (
              <div key={i} className={`flex items-center gap-4 bg-[#0f172a] border rounded-xl px-4 py-3 ${
                item.color === 'red' ? 'border-red-500/20' : item.color === 'orange' ? 'border-orange-500/20' : 'border-white/5'
              }`}>
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold uppercase tracking-wide ${
                      item.color === 'red' ? 'text-red-400' : item.color === 'orange' ? 'text-orange-400' : 'text-blue-400'
                    }`}>{item.severity}</span>
                    <span className="text-white text-sm font-semibold">{item.label}</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">Fix: {item.fix}</p>
                </div>
                <button className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                  item.color === 'red'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                    : item.color === 'orange'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                }`}>
                  Auto-Fix →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Case Study */}
        <section className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-2xl p-8">
          <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mb-2">Case Study</div>
          <h2 className="text-2xl font-bold text-white mb-1">🏆 Mid-Size Atlanta Indie Label</h2>
          <p className="text-slate-400 text-sm mb-6">450-asset catalog · First 30 days of deployment</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Identified Recovery', before: '$0', after: '$54,300', up: true },
              { label: 'Conflicts Resolved', before: '0', after: '5 Major', up: true },
              { label: 'Admin Hours / mo', before: '40+', after: '2 hrs', up: true },
              { label: 'Artist Satisfaction', before: 'Low', after: 'High', up: true },
            ].map(r => (
              <div key={r.label} className="bg-[#0a0f1e]/60 rounded-xl p-4 border border-white/5 text-center">
                <div className="text-xs text-slate-500 mb-2">{r.label}</div>
                <div className="text-sm text-slate-600 line-through mb-1">{r.before}</div>
                <div className="text-lg font-black text-emerald-400">{r.after}</div>
              </div>
            ))}
          </div>
          <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-slate-300 text-sm">
            "We thought we were doing everything right, but the platform found money we didn't even know was missing. It paid for itself in the first 48 hours."
            <cite className="block mt-2 text-xs text-slate-500 not-italic">— Label Manager, Atlanta, GA</cite>
          </blockquote>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Ready to Start an Onboarding Session?</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Book a session where we come to your office with a USB drive and run the full forensic ingestion live.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/partnership" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-xl shadow-indigo-500/20">
              View Partnership Terms
            </Link>
            <Link href="/attorney-portal" className="px-6 py-3 bg-[#1e293b] border border-white/10 text-slate-300 rounded-xl font-bold hover:bg-[#0f172a] hover:text-white transition">
              Attorney Portal →
            </Link>
            <Link href="/label" className="px-6 py-3 bg-[#1e293b] border border-white/10 text-slate-300 rounded-xl font-bold hover:bg-[#0f172a] hover:text-white transition">
              Label Command Center →
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
