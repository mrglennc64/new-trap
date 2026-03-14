"use client";

import Link from 'next/link';
import { useState } from 'react';

const CONFLICT_CASES = [
  { id: 'CF-8821', label: 'CF-8821: Mask Off (Sony/ATV Overlap)' },
  { id: 'CF-9012', label: 'CF-9012: Jumpman (Internal Error)' },
];

const DISPUTE_LETTER = `Date: March 06, 2026

RE: NOTICE OF OWNERSHIP DISCREPANCY

Asset: Mask Off (Future)
ISRC: US-S1Z-17-00001
Conflict ID: CF-8821

To Whom It May Concern at Sony/ATV Music Publishing,

Please be advised that our system of record, TrapRoyalties Pro, has identified a mechanical ownership overlap of 12.5% on the aforementioned asset. According to the signed split sheet dated January 12, 2017, the claimant holds 100% of the master recording rights.

We formally request a reconciliation of your internal metadata against our immutable ledger within fourteen (14) business days. Failure to resolve this discrepancy will result in a formal hold on settlement distributions for this ISRC via the TrapRoyalties protocol.

Authorized by,
Legal Compliance Dept.
TrapRoyalties Pro x Theel Good Music`;

export default function VaultPage() {
  const [selectedCase, setSelectedCase] = useState('CF-8821');
  const [noticeType, setNoticeType] = useState('formal');

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc]">
      <nav className="border-b border-slate-800 px-8 py-4 flex justify-between items-center glass sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="text-purple-500 font-extrabold tracking-tighter text-xl">TRAPROYALTIES PRO</span>
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <Link href="/label" className="hover:text-white transition">Summary</Link>
            <Link href="/label/conflict" className="hover:text-white transition">Conflict Center</Link>
            <Link href="/label/settlement" className="hover:text-white transition">Settlement Rails</Link>
            <Link href="/label/vault" className="text-white border-b-2 border-purple-500 pb-1">Legal Vault</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto p-8">
        <div className="mb-12">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Legal &amp; Compliance Vault</h1>
          <p className="text-slate-500">Immutable document storage and automated legal drafting</p>
        </div>

        {/* Automated Dispute Generator */}
        <div className="glass rounded-2xl p-8 mb-12" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-purple-500">⚡</span> Automated Dispute Generator
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Select Conflict Case</label>
                <select
                  value={selectedCase}
                  onChange={e => setSelectedCase(e.target.value)}
                  className="w-full bg-slate-800 border-none rounded-lg p-3 text-sm mono text-slate-200 outline-none"
                >
                  {CONFLICT_CASES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 mt-4">Notice Type</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setNoticeType('formal')}
                    className={`w-full p-3 rounded-lg border text-left transition ${
                      noticeType === 'formal'
                        ? 'bg-slate-800 border-purple-500/30'
                        : 'bg-slate-900 border-transparent hover:border-slate-800'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">Formal Notice of Claim</p>
                    <p className="text-[10px] text-slate-500">Standard metadata correction request</p>
                  </button>
                  <button
                    onClick={() => setNoticeType('cease')}
                    className={`w-full p-3 rounded-lg border text-left transition ${
                      noticeType === 'cease'
                        ? 'bg-slate-800 border-purple-500/30'
                        : 'bg-slate-900 border-transparent hover:border-slate-800'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">Cease &amp; Desist (Royalties)</p>
                    <p className="text-[10px] text-slate-500">Urgent hold on payout distribution</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Letter preview */}
            <div className="md:col-span-2 bg-slate-900 text-slate-900 p-8 rounded shadow-2xl h-[400px] overflow-y-auto text-[11px] leading-relaxed font-serif" style={{ boxShadow: '0 10px 30px rgba(147,51,234,0.1)' }}>
              <p className="font-bold text-right mb-8 font-sans uppercase text-xs">Date: March 06, 2026</p>
              <p className="mb-4 font-bold">RE: NOTICE OF OWNERSHIP DISCREPANCY</p>
              <p className="mb-4">
                <strong>Asset:</strong> Mask Off (Future)<br />
                <strong>ISRC:</strong> US-S1Z-17-00001<br />
                <strong>Conflict ID:</strong> CF-8821
              </p>
              <p className="mb-4">To Whom It May Concern at Sony/ATV Music Publishing,</p>
              <p className="mb-4">
                Please be advised that our system of record, TrapRoyalties Pro, has identified a mechanical ownership overlap of <strong>12.5%</strong> on the aforementioned asset. According to the signed split sheet dated January 12, 2017, the claimant holds 100% of the master recording rights.
              </p>
              <p className="mb-4">
                We formally request a reconciliation of your internal metadata against our immutable ledger within fourteen (14) business days. Failure to resolve this discrepancy will result in a formal hold on settlement distributions for this ISRC via the TrapRoyalties protocol.
              </p>
              <p className="mt-12">
                Authorized by,<br />
                <strong>Legal Compliance Dept.</strong><br />
                TrapRoyalties Pro x Theel Good Music
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4 border-t border-slate-800 pt-6">
            <button className="px-6 py-2 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 transition">
              Download PDF
            </button>
            <button className="px-6 py-2 bg-purple-600 rounded-lg text-xs font-bold hover:bg-purple-500 transition shadow-lg shadow-purple-900/40">
              Dispatch to Counter-Party
            </button>
          </div>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="#" className="glass p-6 rounded-2xl hover:border-purple-500/50 transition cursor-pointer block group">
            <div className="text-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-sm group-hover:text-purple-400 transition">Master Agreements</h3>
            <p className="text-[10px] text-slate-500 mono mt-1 uppercase">124 Signed PDF/A</p>
          </Link>

          <Link href="/split-verification" className="glass p-6 rounded-2xl hover:border-purple-500/50 transition cursor-pointer block group">
            <div className="text-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="font-bold text-sm group-hover:text-purple-400 transition">Artist Split Sheets</h3>
            <p className="text-[10px] text-slate-500 mono mt-1 uppercase">986 Digital Executions</p>
          </Link>

          <Link href="#" className="glass p-6 rounded-2xl hover:border-purple-500/50 transition cursor-pointer block group">
            <div className="text-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-bold text-sm group-hover:text-purple-400 transition">Audit Trail Logs</h3>
            <p className="text-[10px] text-slate-500 mono mt-1 uppercase">Immutable History</p>
          </Link>

          <Link href="/attorney-portal" className="glass p-6 rounded-2xl hover:border-purple-500/50 transition cursor-pointer block group">
            <div className="text-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h3 className="font-bold text-sm group-hover:text-amber-400 transition">Attorney Portal</h3>
            <p className="text-[10px] text-slate-500 mono mt-1 uppercase">Contract Auditor</p>
          </Link>

          <Link href="/label/conflict" className="glass p-6 rounded-2xl hover:border-purple-500/50 transition cursor-pointer block group">
            <div className="text-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-bold text-sm group-hover:text-red-400 transition">Active Conflicts</h3>
            <p className="text-[10px] text-slate-500 mono mt-1 uppercase">2 Open Cases</p>
          </Link>

          <Link href="/label/settlement" className="glass p-6 rounded-2xl hover:border-purple-500/50 transition cursor-pointer block group">
            <div className="text-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-sm group-hover:text-green-400 transition">Settlement Records</h3>
            <p className="text-[10px] text-slate-500 mono mt-1 uppercase">$142,850 Identified</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
