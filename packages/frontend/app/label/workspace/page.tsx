'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Track {
  id: string; artistId: string; title: string; isrc: string; upc: string;
  releaseDate: string; genre: string; producers: string; songwriters: string;
  splits: { name: string; role: string; pct: number }[];
  streams: number; revenue: number;
}
interface Artist { id: string; name: string; genre: string; isrc: string; }
interface Leak { severity: 'critical' | 'warning' | 'info'; msg: string; fix: string; }
interface ChatMsg { role: 'user' | 'bot'; text: string; }

// ─── Mock catalog ──────────────────────────────────────────────────────────

const ARTISTS: Artist[] = [
  { id: 'a1', name: 'Future',       genre: 'Trap',    isrc: 'USUG12400001' },
  { id: 'a2', name: 'Metro Boomin', genre: 'Trap',    isrc: 'USRC17611045' },
  { id: 'a3', name: 'Travis Scott', genre: 'Trap',    isrc: 'USRC17801922' },
  { id: 'a4', name: '21 Savage',    genre: 'Hip-Hop', isrc: 'GBUM71402025' },
];

const TRACKS: Track[] = [
  { id: 't1', artistId: 'a1', title: 'Low Life',         isrc: 'USUG12400011', upc: '', releaseDate: '2016-04-29', genre: 'Trap',    producers: 'Southside', songwriters: 'Future, The Weeknd', splits: [{name:'Future',role:'Artist',pct:50},{name:'The Weeknd',role:'Feature',pct:30},{name:'Southside',role:'Producer',pct:20}], streams: 892000000, revenue: 4285 },
  { id: 't2', artistId: 'a1', title: 'Mask Off',         isrc: 'USUG12100022', upc: '00602557', releaseDate: '2017-04-14', genre: 'Trap',    producers: 'Metro Boomin', songwriters: 'Future', splits: [{name:'Future',role:'Artist',pct:70},{name:'Metro Boomin',role:'Producer',pct:30}], streams: 1400000000, revenue: 6720 },
  { id: 't3', artistId: 'a1', title: 'Life Is Good',     isrc: '',             upc: '', releaseDate: '2020-01-10', genre: 'Hip-Hop', producers: 'Metro Boomin', songwriters: 'Future, Drake', splits: [], streams: 780000000, revenue: 3745 },
  { id: 't4', artistId: 'a2', title: 'Bad and Boujee',   isrc: 'USUG11600801', upc: '00602557', releaseDate: '2016-10-28', genre: 'Trap',    producers: 'Metro Boomin', songwriters: 'Migos, Lil Uzi', splits: [{name:'Migos',role:'Artist',pct:60},{name:'Metro Boomin',role:'Producer',pct:40}], streams: 2100000000, revenue: 10080 },
  { id: 't5', artistId: 'a2', title: 'Superhero',        isrc: 'USUG12300011', upc: '00602508', releaseDate: '2023-07-21', genre: 'Trap',    producers: 'Metro Boomin, Southside', songwriters: 'Metro Boomin, Future, Chris Brown', splits: [], streams: 620000000, revenue: 2976 },
  { id: 't6', artistId: 'a3', title: 'SICKO MODE',       isrc: 'USUG11803117', upc: '00602577', releaseDate: '2018-08-03', genre: 'Trap',    producers: 'Tay Keith, OZ', songwriters: 'Travis Scott, Drake', splits: [{name:'Travis Scott',role:'Artist',pct:60},{name:'Drake',role:'Feature',pct:25},{name:'Tay Keith',role:'Producer',pct:15}], streams: 3200000000, revenue: 15360 },
  { id: 't7', artistId: 'a3', title: 'Goosebumps',       isrc: '',             upc: '', releaseDate: '2016-09-30', genre: 'Trap',    producers: 'WondaGurl, Frank Dukes', songwriters: 'Travis Scott, Kendrick Lamar', splits: [], streams: 980000000, revenue: 4704 },
  { id: 't8', artistId: 'a4', title: 'Rockstar',         isrc: 'USUG11701829', upc: '00602567', releaseDate: '2017-09-15', genre: 'Hip-Hop', producers: 'Metro Boomin', songwriters: '21 Savage, Post Malone', splits: [{name:'21 Savage',role:'Artist',pct:50},{name:'Post Malone',role:'Feature',pct:35},{name:'Metro Boomin',role:'Producer',pct:15}], streams: 2800000000, revenue: 13440 },
  { id: 't9', artistId: 'a4', title: 'a lot',            isrc: 'USUG11802201', upc: '00602508', releaseDate: '2018-12-21', genre: 'Hip-Hop', producers: 'Metro Boomin', songwriters: '21 Savage, J. Cole', splits: [], streams: 540000000, revenue: 2592 },
];

// ─── Leak scanner ──────────────────────────────────────────────────────────

function scanLeaks(t: Track): Leak[] {
  const leaks: Leak[] = [];
  if (!t.isrc)          leaks.push({ severity: 'critical', msg: 'Missing ISRC — cannot register with PROs or SoundExchange', fix: 'Use ISRC Search or register at usisrc.org' });
  if (!t.upc)           leaks.push({ severity: 'warning',  msg: 'Missing UPC — distribution may reject this release', fix: 'Get UPC from your distributor' });
  if (!t.releaseDate)   leaks.push({ severity: 'warning',  msg: 'No release date — DDEX package will be incomplete', fix: 'Enter release date' });
  if (!t.songwriters)   leaks.push({ severity: 'critical', msg: 'No songwriters — mechanical royalties uncollected', fix: 'Add songwriter credits' });
  if (!t.producers)     leaks.push({ severity: 'warning',  msg: 'No producer credits — producer royalties at risk', fix: 'Add producer names' });
  if (t.splits.length === 0) leaks.push({ severity: 'critical', msg: 'No split sheet — ownership disputes possible', fix: 'Add split percentages for all contributors' });
  else {
    const sum = t.splits.reduce((s, x) => s + x.pct, 0);
    if (Math.abs(sum - 100) > 0.1) leaks.push({ severity: 'critical', msg: `Splits total ${sum}% — must equal 100%`, fix: 'Correct split percentages' });
  }
  return leaks;
}

function riskScore(leaks: Leak[]) {
  return Math.min(100, leaks.reduce((s, l) => s + (l.severity === 'critical' ? 30 : l.severity === 'warning' ? 12 : 4), 0));
}

// ─── Bot responses ─────────────────────────────────────────────────────────

function botReply(q: string, track: Track | null): string {
  const lq = q.toLowerCase();
  if (lq.includes('isrc') && track) return track.isrc ? `ISRC for "${track.title}" is ${track.isrc}.` : `"${track.title}" is missing an ISRC — this is a critical leak. Register at usisrc.org or through your PRO.`;
  if (lq.includes('split') && track) return track.splits.length ? `Splits for "${track.title}": ${track.splits.map(s=>`${s.name} ${s.pct}%`).join(', ')}` : `"${track.title}" has no split sheet on file — ownership is unverified.`;
  if (lq.includes('revenue') || lq.includes('earning')) return track ? `"${track.title}" has earned $${track.revenue.toLocaleString()} from ${(track.streams/1e6).toFixed(0)}M streams.` : 'Select a track first to see revenue data.';
  if (lq.includes('leak') || lq.includes('issue') || lq.includes('problem')) return track ? `Found ${scanLeaks(track).length} issue(s) on "${track.title}". Risk score: ${riskScore(scanLeaks(track))}/100. Click Auto-Fix to resolve what we can automatically.` : 'Select a track from the explorer to run leak analysis.';
  if (lq.includes('pro') || lq.includes('ascap') || lq.includes('bmi')) return 'PRO registrations (ASCAP, BMI, SOCAN, PRS) are checked in the Full Catalog Due Diligence report. Missing registrations cause mechanical and performance royalties to go to the Black Box.';
  if (lq.includes('hello') || lq.includes('hi')) return 'Hello! I can help with ISRC lookup, split verification, PRO registrations, and royalty analysis. What do you need?';
  if (lq.includes('ddex')) return 'DDEX packages require a valid ISRC, UPC, and release date. Once your metadata is clean, go to the Enter Data → DDEX section to generate ERN 3.8.2 XML.';
  return 'I can answer questions about ISRC, split sheets, PRO registrations, revenue, and royalty leaks. Try asking "What are the issues with this track?" or "Show me the splits."';
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function LabelWorkspace() {
  const [expanded, setExpanded]   = useState<Set<string>>(new Set(['a1']));
  const [auditing, setAuditing]   = useState<Track | null>(null);
  const [dragOver, setDragOver]   = useState(false);
  const [chatMsgs, setChatMsgs]   = useState<ChatMsg[]>([
    { role: 'bot', text: 'Welcome to the Label Workspace. Click a track from the Explorer to begin auditing. I can answer questions about your catalog.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [fixing, setFixing]       = useState(false);
  const [fixLog, setFixLog]       = useState<string[]>([]);
  const [fixedTrack, setFixedTrack] = useState<Track | null>(null);
  const [portal, setPortal]       = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);

  function toggleArtist(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function selectTrack(t: Track) {
    setAuditing(t);
    setFixLog([]);
    setFixedTrack(null);
    const leaks = scanLeaks(t);
    const msg = leaks.length
      ? `Loaded "${t.title}". Found ${leaks.length} issue(s) — Risk Score ${riskScore(leaks)}/100. ${leaks.filter(l=>l.severity==='critical').length} critical.`
      : `"${t.title}" is clean — no metadata leaks detected.`;
    setChatMsgs(prev => [...prev, { role: 'bot', text: msg }]);
  }

  function sendChat() {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatMsgs(prev => [...prev, { role: 'user', text: q }]);
    setChatInput('');
    setTimeout(() => setChatMsgs(prev => [...prev, { role: 'bot', text: botReply(q, auditing) }]), 400);
  }

  async function runAutoFix() {
    if (!auditing) return;
    setFixing(true); setFixLog([]);
    const steps = ['Scanning metadata fields...', 'Checking PRO registrations...', 'Resolving ISRC conflicts...', 'Applying corrections...', 'Validating fixes...'];
    for (const step of steps) {
      setFixLog(prev => [...prev, step]);
      await new Promise(r => setTimeout(r, 400));
    }
    const leaks = scanLeaks(auditing);
    const fixed: Track = { ...auditing };
    if (!fixed.isrc)        fixed.isrc = 'TRPFIX' + Date.now().toString(36).toUpperCase().slice(-6);
    if (!fixed.upc)         fixed.upc  = '00' + Math.floor(Math.random() * 9e9).toString().padStart(11, '0');
    if (!fixed.releaseDate) fixed.releaseDate = new Date().toISOString().slice(0, 10);
    if (fixed.splits.length === 0) fixed.splits = [{ name: 'Primary Artist', role: 'Artist', pct: 100 }];
    setFixLog(prev => [...prev, `\u2713 Fixed ${leaks.length} issue(s) — review below and click Push to save`]);
    setFixedTrack(fixed);
    setFixing(false);
    setChatMsgs(prev => [...prev, { role: 'bot', text: `Auto-fix complete for "${auditing.title}". ${leaks.length} issue(s) corrected. Review the Updated Info panel and click Push to confirm.` }]);
  }

  const leaks = auditing ? scanLeaks(auditing) : [];
  const score = riskScore(leaks);

  if (portal) {
    // Inline mini label portal (all the operations features)
    return <LabelPortalView onBack={() => setPortal(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">

      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-40 bg-[#0a0f1e] border-b border-white/10 flex items-center px-6 py-3 gap-1">
        <span className="text-sm font-black text-purple-300 mr-6">TrapRoyalties<span className="text-white">Pro</span></span>
        <div className="flex gap-1">
          {[
            { label: 'Label Workspace', active: true,  action: () => {} },
            { label: 'Label Portal',    active: false, action: () => setPortal(true) },
          ].map(t => (
            <button key={t.label} onClick={t.action}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${t.active ? 'bg-purple-600/30 text-indigo-300 border border-purple-500/40' : 'text-slate-500 hover:text-white hover:bg-slate-900/5'}`}>
              {t.label}
            </button>
          ))}
          <Link href="/attorney-portal" className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-white hover:bg-slate-900/5 transition">Attorney Portal</Link>
          <Link href="/split-verification" className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-white hover:bg-slate-900/5 transition">Split Verification</Link>
        </div>
        <Link href="/" className="ml-auto text-xs text-slate-500 hover:text-white transition">← Main Site</Link>
      </nav>

      {/* ── 3-Column Body ── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 49px)' }}>

        {/* ── LEFT: Explorer ── */}
        <div className="w-56 flex-shrink-0 bg-[#0f172a] border-r border-white/10 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Explorer — Label Catalog</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {ARTISTS.map(artist => {
              const tracks = TRACKS.filter(t => t.artistId === artist.id);
              const open = expanded.has(artist.id);
              return (
                <div key={artist.id}>
                  <button
                    onClick={() => toggleArtist(artist.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-900/5 transition text-left">
                    <span className="text-slate-500 w-3">{open ? '▼' : '▶'}</span>
                    <span className="text-yellow-400">📁</span>
                    <span className="text-slate-300">{artist.name}</span>
                  </button>
                  {open && tracks.map(t => {
                    const lks = scanLeaks(t);
                    const crit = lks.filter(l => l.severity === 'critical').length;
                    return (
                      <button
                        key={t.id}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('trackId', t.id)}
                        onClick={() => selectTrack(t)}
                        className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-xs hover:bg-purple-600/10 transition text-left group ${auditing?.id === t.id ? 'bg-purple-600/20 text-indigo-300' : 'text-slate-400'}`}>
                        <span className={crit > 0 ? 'text-red-400' : 'text-slate-500'}>🎵</span>
                        <span className="truncate flex-1">{t.title}</span>
                        {crit > 0 && <span className="text-red-400 text-[9px] font-black">{crit}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="px-3 py-3 border-t border-white/10 text-[10px] text-slate-500 text-center">
            Drag tracks to audit panel →
          </div>
        </div>

        {/* ── MIDDLE: Audit Panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0f1e]">
          {!auditing ? (
            // Drop zone
            <div
              className={`flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed m-6 rounded-2xl transition ${dragOver ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false);
                const id = e.dataTransfer.getData('trackId');
                const t = TRACKS.find(x => x.id === id);
                if (t) selectTrack(t);
              }}>
              <div className="text-5xl opacity-30">📂</div>
              <p className="text-slate-500 font-bold text-sm">Drop a track here to audit</p>
              <p className="text-slate-500 text-xs">Drag from the Explorer panel on the left, or click a track</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Track header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-purple-300 font-mono uppercase tracking-widest mb-1">Audit Panel</p>
                  <h2 className="text-2xl font-black">{auditing.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{ARTISTS.find(a=>a.id===auditing.artistId)?.name} · {auditing.genre}</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-black ${score >= 60 ? 'text-red-400' : score >= 30 ? 'text-yellow-400' : 'text-green-400'}`}>{score}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Risk Score</div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Streams</p>
                  <p className="text-lg font-black text-white">{(auditing.streams/1e6).toFixed(0)}M</p>
                </div>
                <div className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Revenue</p>
                  <p className="text-lg font-black text-green-400">${auditing.revenue.toLocaleString()}</p>
                </div>
                <div className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Leaks</p>
                  <p className={`text-lg font-black ${leaks.length > 0 ? 'text-red-400' : 'text-green-400'}`}>{leaks.length}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-4 space-y-2 text-xs font-mono">
                {[
                  ['ISRC',         auditing.isrc       || '⚠ MISSING'],
                  ['UPC',          auditing.upc        || '⚠ MISSING'],
                  ['Release Date', auditing.releaseDate || '⚠ MISSING'],
                  ['Producers',    auditing.producers  || '⚠ MISSING'],
                  ['Songwriters',  auditing.songwriters || '⚠ MISSING'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-500">{k}</span>
                    <span className={v.toString().startsWith('⚠') ? 'text-red-400 font-bold' : 'text-slate-200'}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Splits */}
              {auditing.splits.length > 0 && (
                <div className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Split Sheet</p>
                  <div className="space-y-2">
                    {auditing.splits.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-900/10 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-300 w-28 text-right truncate">{s.name}</span>
                        <span className="text-xs font-black text-indigo-300 w-10 text-right">{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leak list */}
              {leaks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Money Leaks</p>
                    <button onClick={runAutoFix} disabled={fixing || !!fixedTrack}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-black rounded-lg hover:bg-red-600/40 transition disabled:opacity-50">
                      {fixing ? <><span className="animate-spin inline-block">⟳</span> Fixing...</> : fixedTrack ? '✓ Fixed' : '⚡ Auto-Fix All'}
                    </button>
                  </div>
                  {leaks.map((l, i) => (
                    <div key={i} className={`p-3 rounded-lg text-xs border-l-2 ${l.severity==='critical'?'border-red-500 bg-red-500/5':l.severity==='warning'?'border-yellow-500 bg-yellow-500/5':'border-blue-500 bg-blue-500/5'}`}>
                      <p className={`font-bold ${l.severity==='critical'?'text-red-400':l.severity==='warning'?'text-yellow-400':'text-blue-400'}`}>
                        {l.severity==='critical'?'⚠ CRITICAL:':l.severity==='warning'?'⚡ WARNING:':'ℹ INFO:'} {l.msg}
                      </p>
                      <p className="text-slate-500 mt-0.5">Fix: {l.fix}</p>
                    </div>
                  ))}
                </div>
              )}

              {leaks.length === 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-xs text-green-400 font-bold text-center">
                  ✓ No metadata leaks — this track is clean
                </div>
              )}

              <button onClick={() => { setAuditing(null); setFixLog([]); setFixedTrack(null); }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-400 border border-white/5 rounded-xl transition">
                Clear audit panel
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Chat + Updated Info ── */}
        <div className="w-72 flex-shrink-0 bg-[#0f172a] border-l border-white/10 flex flex-col">

          {/* Chat */}
          <div className="flex flex-col flex-1 overflow-hidden border-b border-white/10">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <span className="text-base">🤖</span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chat</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.role==='user'?'justify-end':''}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${m.role==='user'?'bg-purple-600 text-white':'bg-[#1e293b] text-slate-300'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Ask about ISRC, splits, PROs..."
                className="flex-1 bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button onClick={sendChat} className="px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold transition">Send</button>
            </div>
          </div>

          {/* Updated Info / Auto-fix log */}
          <div className="flex flex-col overflow-hidden" style={{minHeight: '200px', maxHeight: '260px'}}>
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📋</span>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Updated Info</span>
              </div>
              {fixedTrack && (
                <button onClick={() => {
                  setChatMsgs(prev => [...prev, { role: 'bot', text: `Changes for "${fixedTrack.title}" pushed to catalog.` }]);
                  setAuditing(fixedTrack);
                  setFixedTrack(null);
                  setFixLog([]);
                }}
                  className="px-2 py-1 bg-green-600/20 border border-green-500/30 text-green-300 text-[10px] font-black rounded-lg hover:bg-green-600/40 transition">
                  Push →
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {fixLog.length === 0 && !fixedTrack && (
                <p className="text-xs text-slate-500 text-center mt-4">Run auto-fix and click Push to see updated info here</p>
              )}
              {fixLog.length > 0 && (
                <div className="space-y-1 font-mono text-[10px]">
                  {fixLog.map((l, i) => (
                    <div key={i} className={l.startsWith('✓') ? 'text-green-400' : 'text-indigo-300'}>
                      {l.startsWith('✓') ? l : '> ' + l}
                    </div>
                  ))}
                </div>
              )}
              {fixedTrack && (
                <div className="mt-3 space-y-1.5 font-mono text-[10px]">
                  {fixedTrack.isrc && fixedTrack.isrc !== auditing?.isrc && (
                    <div className="flex justify-between bg-green-500/10 rounded px-2 py-1">
                      <span className="text-slate-500">ISRC</span>
                      <span className="text-green-400">{fixedTrack.isrc}</span>
                    </div>
                  )}
                  {fixedTrack.upc && fixedTrack.upc !== auditing?.upc && (
                    <div className="flex justify-between bg-green-500/10 rounded px-2 py-1">
                      <span className="text-slate-500">UPC</span>
                      <span className="text-green-400">{fixedTrack.upc}</span>
                    </div>
                  )}
                  {fixedTrack.releaseDate && fixedTrack.releaseDate !== auditing?.releaseDate && (
                    <div className="flex justify-between bg-green-500/10 rounded px-2 py-1">
                      <span className="text-slate-500">Release Date</span>
                      <span className="text-green-400">{fixedTrack.releaseDate}</span>
                    </div>
                  )}
                  {fixedTrack.splits.length > 0 && auditing?.splits.length === 0 && (
                    <div className="bg-green-500/10 rounded px-2 py-1">
                      <span className="text-slate-500">Splits added: </span>
                      <span className="text-green-400">{fixedTrack.splits.map(s=>`${s.name} ${s.pct}%`).join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Label Portal (operations) ─────────────────────────────────────

function LabelPortalView({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState('dashboard');
  const artists = [
    { id: 1, stage: 'Drake',       genre: 'Hip-Hop', recouped: true,  earnings: 1250000, expenses: 800000  },
    { id: 2, stage: 'Travis Scott',genre: 'Trap',    recouped: false, earnings: 950000,  expenses: 1200000 },
    { id: 3, stage: '21 Savage',   genre: 'Trap',    recouped: true,  earnings: 750000,  expenses: 450000  },
    { id: 4, stage: 'Metro Boomin',genre: 'Trap',    recouped: false, earnings: 450000,  expenses: 600000  },
  ];
  const NAV = [
    { id: 'dashboard', label: 'Overview',       icon: '📊' },
    { id: 'artists',   label: 'Artists',         icon: '🎤' },
    { id: 'territory', label: 'Revenue Map',     icon: '🌍' },
    { id: 'metadata',  label: 'Metadata Health', icon: '🛡️' },
    { id: 'recoupment',label: 'Recoupment',      icon: '💰' },
    { id: 'payouts',   label: 'Payouts',         icon: '💸' },
    { id: 'import',    label: 'Import CSV/PDF',  icon: '📥' },
  ];
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      <div className="flex items-center px-6 py-3 border-b border-white/10 bg-[#0a0f1e]">
        <button onClick={onBack} className="text-xs text-slate-500 hover:text-white mr-4 transition">← Back to Workspace</button>
        <span className="text-sm font-black text-purple-300">Label<span className="text-white"> Operations Portal</span></span>
        <Link href="/attorney-portal" className="ml-auto text-xs text-slate-500 hover:text-white transition">⚖️ Attorney Portal</Link>
      </div>
      <div className="flex flex-1">
        <div className="w-52 bg-[#0f172a] border-r border-white/10 p-4 flex flex-col">
          <nav className="space-y-1 flex-1">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setView(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left ${view===n.id?'bg-purple-600/20 text-indigo-300 border border-purple-500/30 font-semibold':'text-slate-400 hover:text-white hover:bg-slate-900/5'}`}>
                <span>{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1 p-8 overflow-y-auto">
          {view === 'dashboard' && (
            <div>
              <h1 className="text-3xl font-black mb-6">Label Overview</h1>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Artists',     value: artists.length,                          color: 'indigo' },
                  { label: 'Total Earnings',     value: '$'+artists.reduce((s,a)=>s+a.earnings,0).toLocaleString(), color: 'green' },
                  { label: 'Unrecouped',         value: '$'+artists.filter(a=>!a.recouped).reduce((s,a)=>s+(a.expenses-a.earnings),0).toLocaleString(), color: 'yellow' },
                  { label: 'Ready to Pay',       value: '$'+artists.filter(a=>a.recouped).reduce((s,a)=>s+(a.earnings-a.expenses),0).toLocaleString(), color: 'emerald' },
                ].map(k=>(
                  <div key={k.label} className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-5">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">{k.label}</p>
                    <p className={`text-2xl font-black text-${k.color}-400`}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-4">Roster</h3>
                <div className="space-y-2">
                  {artists.map(a=>(
                    <div key={a.id} className="flex justify-between items-center p-3 bg-[#0f172a] rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-black text-indigo-300">{a.stage[0]}</div>
                        <div><p className="font-bold text-sm">{a.stage}</p><p className="text-xs text-slate-500">{a.genre}</p></div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${a.recouped?'bg-green-500/20 text-green-300':'bg-yellow-500/20 text-yellow-300'}`}>{a.recouped?'RECOUPED':'UNRECOUPED'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {view !== 'dashboard' && (
            <div className="text-center mt-20">
              <div className="text-4xl mb-4">{NAV.find(n=>n.id===view)?.icon}</div>
              <h2 className="text-xl font-black mb-2">{NAV.find(n=>n.id===view)?.label}</h2>
              <p className="text-slate-500 text-sm">This section is available in the full dashboard.</p>
              <Link href="/dashboard" className="inline-block mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition">Open Full Dashboard →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
