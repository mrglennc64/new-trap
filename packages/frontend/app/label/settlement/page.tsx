"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function SettlementRailsPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc]">
      <nav className="border-b border-slate-800 px-8 py-4 flex justify-between items-center glass sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="text-purple-500 font-extrabold tracking-tighter text-xl">TRAPROYALTIES PRO</span>
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <Link href="/label" className="hover:text-white transition">Summary</Link>
            <Link href="/label/conflict" className="hover:text-white transition">Conflict Center</Link>
            <Link href="/label/settlement" className="text-white border-b-2 border-purple-500 pb-1">Settlement Rails</Link>
            <Link href="/label/vault" className="hover:text-white transition">Legal Vault</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Settlement Rails</h1>
            <p className="text-slate-500">Automated Financial Distribution &amp; Liquidity Management</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Next Global Payout In</p>
            <p className="text-xl font-black mono text-purple-400">02d : 14h : 55m</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">

            {/* Live Settlement Pipeline */}
            <div className="glass p-8 rounded-2xl rail-glow">
              <h2 className="text-xs font-bold text-slate-500 uppercase mb-6 tracking-widest">Live Settlement Pipeline</h2>
              <div className="flex items-center justify-between gap-4 relative">
                <div className="flex-1 text-center">
                  <div className="h-2 w-full bg-purple-900/30 rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-purple-500 w-full"></div>
                  </div>
                  <p className="text-[10px] font-bold uppercase">DSP Collection</p>
                  <p className="text-xs mono text-slate-400">$412.5k</p>
                </div>
                <div className="text-purple-500 animate-pulse text-lg">→</div>
                <div className="flex-1 text-center">
                  <div className="h-2 w-full bg-purple-900/30 rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-purple-500 animate-pulse" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-[10px] font-bold uppercase">Audit Validation</p>
                  <p className="text-xs mono text-slate-400">Processing...</p>
                </div>
                <div className="text-slate-700 text-lg">→</div>
                <div className="flex-1 text-center opacity-40">
                  <div className="h-2 w-full bg-slate-800 rounded-full mb-3"></div>
                  <p className="text-[10px] font-bold uppercase">Creator Payout</p>
                  <p className="text-xs mono text-slate-400">Pending</p>
                </div>
              </div>
            </div>

            {/* Direct Payout Ledger */}
            <div className="glass p-8 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Direct Payout Ledger</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-slate-800 rounded text-[10px] font-bold uppercase hover:bg-slate-700 transition">CSV</button>
                  <button className="px-3 py-1 bg-slate-800 rounded text-[10px] font-bold uppercase hover:bg-slate-700 transition">PDF</button>
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="pb-4">Asset / ISRC</th>
                    <th className="pb-4">Payee</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Settled Amount</th>
                  </tr>
                </thead>
                <tbody className="text-xs mono text-slate-300">
                  <tr className="border-b border-slate-800 hover:bg-slate-800 transition">
                    <td className="py-4 font-bold text-white">
                      Jumpman<br />
                      <span className="text-[10px] text-slate-500">US-S1Z-15-00001</span>
                    </td>
                    <td className="py-4 text-purple-400 underline underline-offset-4 cursor-pointer">Metro Boomin</td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 bg-green-900/20 text-green-500 border border-green-900/50 rounded uppercase text-[9px] font-bold">Disbursed</span>
                    </td>
                    <td className="py-4 text-right text-green-400 font-bold">+$24,150.00</td>
                  </tr>
                  <tr className="border-b border-slate-800 hover:bg-slate-800 transition">
                    <td className="py-4 font-bold text-white">
                      Creepin<br />
                      <span className="text-[10px] text-slate-500">US-S1Z-22-00442</span>
                    </td>
                    <td className="py-4 text-purple-400 underline underline-offset-4 cursor-pointer">21 Savage</td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 bg-yellow-900/20 text-yellow-500 border border-yellow-900/50 rounded uppercase text-[9px] font-bold">Pending</span>
                    </td>
                    <td className="py-4 text-right text-slate-400 font-bold">+$18,920.12</td>
                  </tr>
                  <tr className="hover:bg-slate-800 transition">
                    <td className="py-4 font-bold text-white">
                      Mask Off<br />
                      <span className="text-[10px] text-slate-500">US-S1Z-17-00001</span>
                    </td>
                    <td className="py-4 text-purple-400 underline underline-offset-4 cursor-pointer">Future</td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 bg-blue-900/20 text-blue-400 border border-blue-900/50 rounded uppercase text-[9px] font-bold">In Review</span>
                    </td>
                    <td className="py-4 text-right text-slate-400 font-bold">+$9,100.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="glass p-8 rounded-2xl" style={{ borderColor: 'rgba(168,85,247,0.3)', background: 'linear-gradient(to bottom, rgba(88,28,135,0.1), transparent)' }}>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Protocol Efficiency</p>
              <div className="text-5xl font-black text-purple-400 mb-2 mono">5.0%</div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                &ldquo;Your label is currently retaining{' '}
                <span className="text-green-400 font-bold">95.0%</span> of master royalties by bypassing traditional 50% admin fee structures.&rdquo;
              </p>
            </div>

            <div className="glass p-8 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Funds in Flight</p>
              <h3 className="text-2xl font-black text-white mono mb-6">$112,400.18</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Spotify (US)</span>
                  <span className="text-xs mono">$42,100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Apple Music (UK)</span>
                  <span className="text-xs mono">$12,400</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">YouTube (Global)</span>
                  <span className="text-xs mono">$31,200</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Tidal (US)</span>
                  <span className="text-xs mono">$26,700</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-slate-100 text-slate-900 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition shadow-[0_0_50px_rgba(147,51,234,0.2)]"
            >
              Request Early Withdrawal
            </button>
          </div>
        </div>
      </main>

      {/* Withdrawal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-sm">
          <div className="glass max-w-lg w-full p-8 rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.2)] mx-4" style={{ borderColor: 'rgba(168,85,247,0.4)' }}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black tracking-tighter uppercase">Instant Settlement</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Protocol Bridge: DSP → Bank</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white transition text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800">
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Accrued Digital Balance</span>
                  <span className="text-[10px] text-green-400 mono">Verified</span>
                </div>
                <div className="text-3xl font-black mono">$112,400.18</div>
              </div>

              <div className="flex justify-center py-2 text-purple-500 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              <div className="p-6 rounded-2xl border" style={{ background: 'rgba(147,51,234,0.1)', borderColor: 'rgba(168,85,247,0.3)' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-bold text-purple-400 uppercase">Estimated Bank Credit</span>
                  <span className="text-[10px] text-purple-500 mono">T+0 Rails</span>
                </div>
                <div className="text-3xl font-black mono text-purple-400">$106,780.17</div>
                <p className="text-[9px] text-slate-500 mt-2 italic">*After 5% Protocol Fee ($5,620.01)</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-800 rounded-xl border border-slate-800 mb-8">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center font-bold text-slate-900 text-xs uppercase">BANK</div>
                <div className="text-left">
                  <p className="text-xs font-bold">CHASE BUSINESS CHECKING</p>
                  <p className="text-[10px] text-slate-500 mono">Routing: ****6789 | Acct: ****1234</p>
                </div>
              </div>
            </div>

            <button className="w-full bg-slate-900 text-slate-900 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-purple-400 transition shadow-2xl">
              Confirm Instant Disbursement
            </button>

            <p className="text-center text-[9px] text-slate-500 mt-4 uppercase font-bold tracking-widest">
              Immutable Transaction Hash: 0x82...e44f
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
