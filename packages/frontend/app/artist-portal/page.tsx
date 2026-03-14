"use client";

import Link from 'next/link';
import { useState } from 'react';

const ARTISTS = [
  {
    name: 'METRO BOOMIN',
    initial: 'M',
    balance: '$12,840.42',
    gradient: 'from-purple-600 to-blue-500',
    accruals: [
      { track: 'Jumpman', platform: 'Spotify', territory: 'US', amount: '+$142.10', status: 'live' },
      { track: 'Mask Off', platform: 'Apple Music', territory: 'UK', amount: '+$88.19', status: 'live' },
      { track: 'Creepin', platform: 'YouTube', territory: 'Global', amount: 'Processing', status: 'processing' },
      { track: 'Overdue', platform: 'Tidal', territory: 'US', amount: '+$34.55', status: 'live' },
    ],
    lodSigned: true,
    splits: [{ track: 'Jumpman', pct: 50 }, { track: 'Creepin', pct: 25 }, { track: 'Mask Off', pct: 30 }],
  },
  {
    name: 'FUTURE',
    initial: 'F',
    balance: '$31,200.00',
    gradient: 'from-orange-500 to-red-600',
    accruals: [
      { track: 'Mask Off', platform: 'Spotify', territory: 'Global', amount: '+$820.44', status: 'live' },
      { track: 'Low Life', platform: 'Apple Music', territory: 'US', amount: '+$210.11', status: 'live' },
      { track: 'Draco', platform: 'YouTube', territory: 'Global', amount: 'Processing', status: 'processing' },
    ],
    lodSigned: true,
    splits: [{ track: 'Mask Off', pct: 100 }, { track: 'Low Life', pct: 60 }],
  },
  {
    name: '21 SAVAGE',
    initial: '21',
    balance: '$8,450.18',
    gradient: 'from-slate-600 to-slate-800',
    accruals: [
      { track: 'Creepin', platform: 'Spotify', territory: 'US', amount: '+$188.22', status: 'live' },
      { track: 'Knife Talk', platform: 'Apple Music', territory: 'UK', amount: 'Dispute Hold', status: 'hold' },
    ],
    lodSigned: false,
    splits: [{ track: 'Creepin', pct: 25 }, { track: 'Knife Talk', pct: 33 }],
  },
];

const SCREENS = ['home', 'analytics', 'files', 'settings'];
const SCREEN_ICONS = ['🏠', '📊', '📂', '⚙️'];

export default function ArtistPortalPage() {
  const [selectedArtist, setSelectedArtist] = useState(0);
  const [screen, setScreen] = useState('home');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const artist = ARTISTS[selectedArtist];

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-start py-8 px-4">

      {/* Page header (outside phone) */}
      <div className="w-full max-w-5xl mb-8">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-purple-500 font-extrabold tracking-tighter text-xl">TRAPROYALTIES PRO</Link>
            <p className="text-slate-500 text-xs mt-1">Artist Liquidity Portal — Real-Time Royalty Dashboard</p>
          </div>
          <div className="flex gap-3">
            <Link href="/attorney-portal" className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-700 transition">Attorney Portal</Link>
            <Link href="/label" className="px-4 py-2 bg-purple-600 rounded-lg text-xs font-bold hover:bg-purple-500 transition">Label Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl flex gap-10 items-start">

        {/* Artist selector sidebar */}
        <div className="hidden md:flex flex-col gap-4 w-52 flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Select Artist</p>
          {ARTISTS.map((a, i) => (
            <button key={i} onClick={() => { setSelectedArtist(i); setScreen('home'); }}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition text-left ${selectedArtist === i ? 'bg-slate-800 border-purple-500/50' : 'border-slate-800 hover:bg-slate-900'}`}>
              <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${a.gradient} flex items-center justify-center text-xs font-black flex-shrink-0`}>{a.initial}</div>
              <div>
                <p className="text-xs font-bold text-white">{a.name}</p>
                <p className="text-[10px] text-slate-500 mono">{a.balance}</p>
                {!a.lodSigned && <p className="text-[9px] text-red-400 font-bold mt-0.5">LOD Unsigned</p>}
              </div>
            </button>
          ))}

          <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Platform Links</p>
            <div className="space-y-2">
              <Link href="/split-verification" className="text-[11px] text-purple-400 hover:text-purple-300 block transition">→ Verify My Splits</Link>
              <Link href="/attorney-portal#digital-handshake" className="text-[11px] text-purple-400 hover:text-purple-300 block transition">→ Sign Digital Handshake</Link>
              <Link href="/label/settlement" className="text-[11px] text-purple-400 hover:text-purple-300 block transition">→ Settlement Rails</Link>
            </div>
          </div>
        </div>

        {/* iPhone frame */}
        <div className="flex-1 flex justify-center">
          <div className="w-[375px] bg-slate-950 rounded-[54px] border-[8px] border-slate-900 overflow-hidden relative shadow-2xl" style={{ height: '812px', boxShadow: '0 0 80px rgba(168,85,247,0.1), 0 40px 80px rgba(0,0,0,0.8)' }}>

            {/* Status bar */}
            <div className="h-12 flex justify-between px-8 items-end pb-2 bg-slate-950">
              <span className="text-[10px] font-bold text-white">9:41</span>
              <div className="h-6 w-24 bg-slate-900 rounded-full"></div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2.5 border border-white/60 rounded-sm relative"><div className="absolute inset-0.5 bg-white/80 rounded-sm w-3/4"></div></div>
              </div>
            </div>

            <div className="h-full overflow-y-auto pb-24" style={{ height: 'calc(812px - 48px - 80px)' }}>

              {/* HOME SCREEN */}
              {screen === 'home' && (
                <div className="p-6">
                  {/* Artist header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Artist Account</p>
                      <h1 className="text-xl font-black italic">{artist.name}</h1>
                    </div>
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-tr ${artist.gradient} flex items-center justify-center font-bold text-lg`}>{artist.initial}</div>
                  </div>

                  {/* Balance card */}
                  <div className="p-8 rounded-[40px] text-center mb-6 relative overflow-hidden border border-purple-500/20" style={{ background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(20px)' }}>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 blur-3xl rounded-full pointer-events-none"></div>
                    <p className="text-[10px] text-purple-400 font-bold uppercase mb-2">Available for Instant Payout</p>
                    <h2 className="text-4xl font-black mono mb-1" style={{ textShadow: '0 0 20px rgba(168,85,247,0.4)' }}>{artist.balance}</h2>
                    <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Verified via TrapRoyalties Ledger</p>
                    {!artist.lodSigned && (
                      <div className="mt-3 px-3 py-1.5 bg-red-900/20 border border-red-500/30 rounded-xl text-[10px] text-red-400 font-bold">
                        LOD Unsigned — Payout on Hold
                      </div>
                    )}
                  </div>

                  {/* Withdraw button */}
                  <button onClick={() => artist.lodSigned && setShowWithdraw(true)}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest mb-8 shadow-lg transition active:scale-95 ${artist.lodSigned ? 'bg-white text-slate-950 hover:bg-purple-100' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                    {artist.lodSigned ? 'Withdraw to Bank' : 'Sign LOD to Unlock'}
                  </button>

                  {/* Real-time accruals */}
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Real-Time Accruals</h3>
                  <div className="space-y-3">
                    {artist.accruals.map((a, i) => (
                      <div key={i} className={`p-4 rounded-2xl flex justify-between items-center border ${a.status === 'hold' ? 'border-red-500/20 bg-red-900/5' : 'border-white/5'}`}
                        style={{ background: a.status !== 'hold' ? 'rgba(30,41,59,0.5)' : undefined, backdropFilter: 'blur(20px)' }}>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tighter">{a.track}</p>
                          <p className="text-[9px] text-slate-500 font-mono">{a.platform} · {a.territory}</p>
                        </div>
                        <p className={`text-xs font-bold ${a.status === 'live' ? 'text-green-400' : a.status === 'hold' ? 'text-red-400' : 'text-slate-400'}`}>{a.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ANALYTICS SCREEN */}
              {screen === 'analytics' && (
                <div className="p-6">
                  <h2 className="text-lg font-black mb-6">My Splits</h2>
                  <div className="space-y-4">
                    {artist.splits.map((s, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(30,41,59,0.5)' }}>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-bold uppercase">{s.track}</p>
                          <span className="text-xs font-black text-purple-400 mono">{s.pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${s.pct}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/split-verification" className="block w-full mt-6 py-3 text-center bg-purple-600/20 border border-purple-500/30 rounded-2xl text-xs font-bold text-purple-400">
                    Verify All Splits →
                  </Link>
                </div>
              )}

              {/* FILES SCREEN */}
              {screen === 'files' && (
                <div className="p-6">
                  <h2 className="text-lg font-black mb-6">My Documents</h2>
                  <div className="space-y-3">
                    {['Split Sheet Agreement', 'LOD Authorization', 'Master Recording Contract', 'Publishing Deal'].map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(30,41,59,0.5)' }}>
                        <div className="h-9 w-9 bg-slate-800 rounded-lg flex items-center justify-center text-red-400 text-[10px] font-black">PDF</div>
                        <div className="flex-1">
                          <p className="text-xs font-bold">{doc}</p>
                          <p className="text-[9px] text-slate-500 mono">{i === 1 && !artist.lodSigned ? 'UNSIGNED' : '✓ Verified'}</p>
                        </div>
                        {i === 1 && !artist.lodSigned && (
                          <Link href="/attorney-portal#digital-handshake" className="text-[9px] text-amber-400 font-bold border border-amber-400/30 px-2 py-1 rounded">Sign</Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SETTINGS SCREEN */}
              {screen === 'settings' && (
                <div className="p-6">
                  <h2 className="text-lg font-black mb-6">Account Settings</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Bank Account', value: 'Chase ****1234' },
                      { label: 'IPI Number', value: '00624789341' },
                      { label: 'PRO', value: 'BMI' },
                      { label: 'Tax Status', value: 'W-9 on File' },
                    ].map(s => (
                      <div key={s.label} className="flex justify-between items-center p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(30,41,59,0.5)' }}>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">{s.label}</span>
                        <span className="text-xs font-bold mono">{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/attorney-portal" className="block w-full mt-6 py-3 text-center bg-slate-800 border border-slate-700 rounded-2xl text-xs font-bold text-slate-300">
                    Attorney Portal →
                  </Link>
                </div>
              )}
            </div>

            {/* Bottom nav */}
            <div className="absolute bottom-0 w-full h-20 border-t border-white/5 flex justify-around items-center px-6"
              style={{ background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(20px)' }}>
              {SCREENS.map((s, i) => (
                <button key={s} onClick={() => setScreen(s)} className={`text-2xl transition ${screen === s ? 'opacity-100' : 'opacity-30'}`}>
                  {SCREEN_ICONS[i]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right info panel */}
        <div className="hidden xl:flex flex-col gap-6 w-56 flex-shrink-0">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Why This Matters</p>
            <ul className="space-y-3 text-[11px] text-slate-400 leading-relaxed">
              <li className="flex gap-2"><span className="text-purple-400">✓</span>Artists see live accruals — no more 6-month wait</li>
              <li className="flex gap-2"><span className="text-purple-400">✓</span>Instant withdrawal bypasses traditional admin fees</li>
              <li className="flex gap-2"><span className="text-purple-400">✓</span>LOD enforcement locks unauthorized payouts</li>
              <li className="flex gap-2"><span className="text-purple-400">✓</span>All splits verified on-chain — no disputes</li>
            </ul>
          </div>
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Platform Stats</p>
            <div className="space-y-3">
              {[['$142,850', 'Identified'], ['94.2%', 'Catalog Score'], ['T+0', 'Settlement'], ['5%', 'Protocol Fee']].map(([v, l]) => (
                <div key={l}>
                  <p className="text-lg font-black text-purple-400 mono">{v}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-3xl p-8" style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 0 50px rgba(147,51,234,0.2)' }}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-black tracking-tighter uppercase">Instant Payout</h2>
                <p className="text-xs text-slate-500">T+0 Settlement Rails</p>
              </div>
              <button onClick={() => setShowWithdraw(false)} className="text-slate-500 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 mb-4">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Available Balance</p>
              <p className="text-3xl font-black mono">{artist.balance}</p>
            </div>
            <div className="flex justify-center py-2 text-purple-500 animate-bounce text-lg mb-4">↓</div>
            <div className="p-6 rounded-2xl border mb-6" style={{ background: 'rgba(147,51,234,0.1)', borderColor: 'rgba(168,85,247,0.3)' }}>
              <p className="text-[10px] text-purple-400 uppercase mb-1">Bank Credit (after 5% fee)</p>
              <p className="text-3xl font-black mono text-purple-400">
                ${(parseFloat(artist.balance.replace(/[$,]/g, '')) * 0.95).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700 mb-6">
              <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center text-slate-900 text-[10px] font-black">BANK</div>
              <div>
                <p className="text-xs font-bold">CHASE BUSINESS CHECKING</p>
                <p className="text-[10px] text-slate-500 mono">****1234</p>
              </div>
            </div>
            <button onClick={() => setShowWithdraw(false)} className="w-full py-4 bg-white text-slate-900 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-purple-100 transition">
              Confirm Disbursement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
