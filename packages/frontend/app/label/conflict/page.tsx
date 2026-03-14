"use client";

import Link from 'next/link';

const CONFLICTS = [
  {
    id: 'CF-8821',
    asset: 'Mask Off',
    artist: 'Future',
    isrc: 'US-S1Z-17-00001',
    overlap: '12.5%',
    rival: 'Sony/ATV',
    rivalSource: 'HFA/Mechanical Registry',
    errorType: 'Double Attribution on Derivative Work',
    status: 'Counter-Party Notified',
    ourClaim: '100%',
    ourSource: 'Executed Master Agreement',
    timestamp: 'Mar 06, 2026 20:51',
  },
  {
    id: 'CF-9012',
    asset: 'Jumpman',
    artist: 'Metro Boomin / Drake',
    isrc: 'US-S1Z-15-00001',
    overlap: '5.0%',
    rival: 'Internal Registry',
    rivalSource: 'BMI Auto-Registration',
    errorType: 'Internal Writer Share Rounding Error',
    status: 'Pending Internal Review',
    ourClaim: '100%',
    ourSource: 'Digital Handshake — Signed PDF/A',
    timestamp: 'Feb 28, 2026 14:22',
  },
];

export default function ConflictCenterPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc]">
      <nav className="border-b border-slate-800 px-8 py-4 flex justify-between items-center glass sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="text-purple-500 font-extrabold tracking-tighter text-xl">TRAPROYALTIES PRO</span>
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <Link href="/label" className="hover:text-white transition">Summary</Link>
            <Link href="/label/conflict" className="text-white border-b-2 border-purple-500 pb-1">Conflict Center</Link>
            <Link href="/label/settlement" className="hover:text-white transition">Settlement Rails</Link>
            <Link href="/label/vault" className="hover:text-white transition">Legal Vault</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Conflict Resolution</h1>
            <p className="text-slate-500">Forensic Analysis of Ownership Overlaps</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 mono">{CONFLICTS.length} active conflicts</span>
            <Link href="/attorney-portal" className="px-4 py-2 bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-700 transition">
              Attorney Portal →
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {CONFLICTS.map((c) => (
            <div key={c.id} className="glass rounded-2xl overflow-hidden active-conflict-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
              {/* Header */}
              <div className="p-6 flex justify-between items-center" style={{ backgroundColor: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500 font-bold text-lg">!</div>
                  <div>
                    <h2 className="font-bold">Conflict ID: #{c.id} — {c.asset}</h2>
                    <p className="text-xs text-slate-500 mono">ISRC: {c.isrc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-widest">{c.overlap} Overlap Detected</span>
                  <p className="text-[10px] text-slate-500 mt-1">{c.status}</p>
                </div>
              </div>

              {/* Claims */}
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1px', backgroundColor: '#1e293b' }}>
                <div className="p-8 bg-[#0f172a]">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-6">Your Verified Claim</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black mono text-white">{c.ourClaim}</span>
                    <span className="text-xs text-green-400 font-bold uppercase tracking-tighter">Verified Ledger</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-400">
                    <li>• Source: {c.ourSource}</li>
                    <li>• Attachment: <span className="text-purple-400 underline cursor-pointer">Split_Sheet_Final.pdf</span></li>
                    <li>• Timestamp: {c.timestamp}</li>
                  </ul>
                </div>

                <div className="p-8 bg-[#0f172a]">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-6">Rival Claim: {c.rival}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black mono text-red-400">{c.overlap}</span>
                    <span className="text-xs text-red-500 font-bold uppercase tracking-tighter">Registry Conflict</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-400">
                    <li>• Source: {c.rivalSource}</li>
                    <li>• Error Type: {c.errorType}</li>
                    <li>• Status: {c.status}</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 flex justify-end gap-4 border-t border-slate-800 bg-slate-900/80">
                <Link href="/attorney-portal" className="px-6 py-2 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 transition">
                  Open in Contract Auditor
                </Link>
                <button className="px-6 py-2 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 transition">
                  Request External Audit
                </button>
                <Link href="/label/vault" className="px-6 py-2 bg-purple-600 rounded-lg text-xs font-bold hover:bg-purple-500 transition shadow-lg shadow-purple-900/40">
                  Push Legal Dispute Letter
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
