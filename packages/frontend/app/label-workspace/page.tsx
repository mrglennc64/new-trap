"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface ArtistFile {
  id: string;
  name: string;
  type: 'artist' | 'album' | 'track';
  isrc?: string;
  tracks?: ArtistFile[];
}

interface Issue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  fixed?: boolean;
}

interface AuditEntry {
  id: string;
  name: string;
  artist: string;
  isrc: string;
  issues: Issue[];
  proStatus: { ascap: boolean; bmi: boolean; socan: boolean; prs: boolean };
  hash?: string;
  timestamp?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const DEMO_ARTISTS: ArtistFile[] = [
  {
    id: 'a1', name: 'Future', type: 'artist', tracks: [
      { id: 't1', name: 'Mask Off', type: 'track', isrc: 'USSM11701444' },
      { id: 't2', name: 'Jumpman', type: 'track', isrc: 'USSM11602234' },
    ]
  },
  {
    id: 'a2', name: 'Metro Boomin', type: 'artist', tracks: [
      { id: 't3', name: 'Creepin\'', type: 'track', isrc: 'USSM12204567' },
      { id: 't4', name: 'Superhero', type: 'track', isrc: '' },
    ]
  },
  {
    id: 'a3', name: 'Travis Scott', type: 'artist', tracks: [
      { id: 't5', name: 'SICKO MODE', type: 'track', isrc: 'USSM11803456' },
      { id: 't6', name: 'Goosebumps', type: 'track', isrc: 'USSM11601122' },
    ]
  },
];

function generateIssues(track: ArtistFile): Issue[] {
  const issues: Issue[] = [];
  if (!track.isrc) {
    issues.push({ severity: 'error', field: 'ISRC', message: 'Missing ISRC — track cannot be tracked by PROs or DSPs' });
  }
  if (Math.random() > 0.5) {
    issues.push({ severity: 'error', field: 'BMI', message: 'Not registered with BMI — missing mechanical royalties' });
  }
  if (Math.random() > 0.6) {
    issues.push({ severity: 'warning', field: 'SOCAN', message: 'SOCAN registration unverified — Canadian royalties at risk' });
  }
  if (Math.random() > 0.7) {
    issues.push({ severity: 'warning', field: 'Split', message: 'Split sheet not on-chain — dispute risk' });
  }
  issues.push({ severity: 'info', field: 'ASCAP', message: 'ASCAP registration confirmed' });
  return issues;
}

function generateHash(): string {
  return '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export default function LabelWorkspacePage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['a1']));
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<AuditEntry | null>(null);
  const [autoFixing, setAutoFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Welcome to the Label Workspace. Drag tracks from the left panel to begin auditing. I can answer questions about your catalog.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [pushed, setPushed] = useState(false);
  const dragRef = useRef<ArtistFile | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const track = dragRef.current;
    if (!track) return;
    const artist = DEMO_ARTISTS.find(a => a.tracks?.some(t => t.id === track.id));
    if (!artist) return;

    const existing = auditEntries.find(e => e.id === track.id);
    if (existing) { setActiveEntry(existing); return; }

    const entry: AuditEntry = {
      id: track.id,
      name: track.name,
      artist: artist.name,
      isrc: track.isrc || '',
      issues: generateIssues(track),
      proStatus: { ascap: true, bmi: Math.random() > 0.5, socan: Math.random() > 0.6, prs: Math.random() > 0.5 },
    };
    const updated = [...auditEntries, entry];
    setAuditEntries(updated);
    setActiveEntry(entry);
    setPushed(false);
    setChat(prev => [...prev, { role: 'assistant', text: `Audited "${track.name}" by ${artist.name}. Found ${entry.issues.filter(i => i.severity === 'error').length} error(s) and ${entry.issues.filter(i => i.severity === 'warning').length} warning(s).` }]);
  };

  const runAutoFix = () => {
    if (!activeEntry) return;
    setAutoFixing(true);
    setFixProgress(0);
    const interval = setInterval(() => {
      setFixProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setAutoFixing(false);
          const fixed: AuditEntry = {
            ...activeEntry,
            issues: activeEntry.issues.map(i => ({ ...i, fixed: i.severity !== 'info' })),
            proStatus: { ascap: true, bmi: true, socan: true, prs: true },
            isrc: activeEntry.isrc || `USTR${Date.now().toString().slice(-8)}`,
            hash: generateHash(),
            timestamp: new Date().toISOString(),
          };
          setActiveEntry(fixed);
          setAuditEntries(prev => prev.map(e => e.id === fixed.id ? fixed : e));
          setChat(prev => [...prev, { role: 'assistant', text: `✅ Auto-fix complete for "${fixed.name}". All registrations updated, ISRC assigned, split sheet pushed to Monad blockchain. Hash: ${fixed.hash?.slice(0, 12)}...` }]);
          return 100;
        }
        return p + 3;
      });
    }, 60);
  };

  const handlePush = () => {
    if (!activeEntry) return;
    setPushed(true);
    setChat(prev => [...prev, { role: 'assistant', text: `Pushed updates for "${activeEntry.name}" to the right panel. Ready to generate court-admissible PDF.` }]);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setTimeout(() => {
      let reply = 'I can help with that. Try dragging a track to the audit panel for detailed analysis.';
      const q = userMsg.toLowerCase();
      if (q.includes('isrc')) reply = 'ISRC (International Standard Recording Code) is a 12-character code that uniquely identifies a recording. Missing ISRCs block royalty payments from DSPs and PROs.';
      else if (q.includes('ascap') || q.includes('bmi') || q.includes('pro')) reply = 'PROs (Performing Rights Organizations) collect royalties for public performances. Missing registrations mean uncollected royalties. We check ASCAP, BMI, SOCAN, and PRS automatically.';
      else if (q.includes('split')) reply = 'Split sheets define how royalties are divided between contributors. We verify splits on-chain via Monad blockchain, making them tamper-proof and court-admissible.';
      else if (q.includes('fix')) reply = 'Click the ⚡ Auto Fix button to automatically resolve ISRC gaps, update PRO registrations, and push split data to blockchain.';
      setChat(prev => [...prev, { role: 'assistant', text: reply }]);
    }, 600);
  };

  const errorCount = activeEntry?.issues.filter(i => i.severity === 'error' && !i.fixed).length ?? 0;
  const warnCount = activeEntry?.issues.filter(i => i.severity === 'warning' && !i.fixed).length ?? 0;

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
      {/* Title bar */}
      <div className="h-10 bg-[#323233] flex items-center px-4 gap-4 text-sm border-b border-[#3c3c3c] shrink-0">
        <Link href="/" className="text-purple-400 hover:text-purple-300 font-bold">TrapRoyalties Pro</Link>
        <span className="text-gray-500">|</span>
        <span className="text-gray-300">Label Workspace</span>
        {activeEntry && (
          <>
            <span className="text-gray-500">›</span>
            <span className="text-gray-400">{activeEntry.artist} / {activeEntry.name}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-3">
          <Link href="/label" className="text-xs text-gray-400 hover:text-white transition">Label Portal</Link>
          <Link href="/attorney-portal" className="text-xs text-gray-400 hover:text-white transition">Attorney Portal</Link>
          <Link href="/split-verification" className="text-xs text-gray-400 hover:text-white transition">Split Verification</Link>
        </div>
      </div>

      {/* 3 Panels */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Explorer */}
        <div className="w-64 shrink-0 bg-[#252526] border-r border-[#3c3c3c] flex flex-col overflow-hidden">
          <div className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-[#3c3c3c]">
            Explorer — Label Catalog
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {DEMO_ARTISTS.map(artist => (
              <div key={artist.id}>
                <div
                  onClick={() => toggleExpand(artist.id)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#2a2d2e] cursor-pointer text-sm"
                >
                  <span className="text-gray-400 text-xs">{expanded.has(artist.id) ? '▼' : '▶'}</span>
                  <span className="text-[#c5c5c5]">📁 {artist.name}</span>
                </div>
                {expanded.has(artist.id) && artist.tracks?.map(track => (
                  <div
                    key={track.id}
                    draggable
                    onDragStart={() => { dragRef.current = track; }}
                    onClick={() => {
                      dragRef.current = track;
                      const fakeEvent = { preventDefault: () => {} } as React.DragEvent;
                      handleDrop(fakeEvent);
                    }}
                    className={`flex items-center gap-2 pl-8 pr-3 py-1.5 hover:bg-[#2a2d2e] cursor-grab active:cursor-grabbing text-sm group ${
                      activeEntry?.id === track.id ? 'bg-[#094771] text-white' : 'text-[#c5c5c5]'
                    }`}
                  >
                    <span className="text-xs">🎵</span>
                    <span className="flex-1 truncate">{track.name}</span>
                    {!track.isrc && <span className="text-red-400 text-xs opacity-0 group-hover:opacity-100">!</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-[#3c3c3c] text-xs text-gray-500">
            Drag tracks to audit panel →
          </div>
        </div>

        {/* MIDDLE: Audit panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="h-9 bg-[#2d2d2d] flex items-center border-b border-[#3c3c3c] text-xs shrink-0">
            {auditEntries.map(entry => (
              <div
                key={entry.id}
                onClick={() => { setActiveEntry(entry); setPushed(false); }}
                className={`h-full flex items-center gap-2 px-4 cursor-pointer border-r border-[#3c3c3c] ${
                  activeEntry?.id === entry.id ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500' : 'text-gray-400 hover:bg-[#252526]'
                }`}
              >
                🎵 {entry.name}
                {entry.issues.some(i => i.severity === 'error' && !i.fixed) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                )}
              </div>
            ))}
          </div>

          {/* Drop zone / content */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="flex-1 overflow-y-auto"
          >
            {!activeEntry ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="text-6xl mb-6 opacity-30">📂</div>
                <p className="text-gray-500 text-lg mb-2">Drop a track here to audit</p>
                <p className="text-gray-600 text-sm">Drag from the Explorer panel on the left, or click a track</p>
              </div>
            ) : (
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{activeEntry.name}</h2>
                    <p className="text-gray-400">{activeEntry.artist}</p>
                    {activeEntry.isrc && <p className="text-xs text-gray-500 font-mono mt-1">ISRC: {activeEntry.isrc}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {errorCount > 0 && <span className="px-3 py-1 bg-red-900/60 text-red-300 rounded-full text-xs font-bold">{errorCount} errors</span>}
                    {warnCount > 0 && <span className="px-3 py-1 bg-yellow-900/60 text-yellow-300 rounded-full text-xs font-bold">{warnCount} warnings</span>}
                  </div>
                </div>

                {/* PRO status */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {Object.entries(activeEntry.proStatus).map(([pro, reg]) => (
                    <div key={pro} className={`p-3 rounded-xl text-center border ${reg ? 'border-green-700/50 bg-green-900/20' : 'border-red-700/50 bg-red-900/20'}`}>
                      <p className="text-xs font-bold text-gray-300 uppercase">{pro}</p>
                      <p className={`text-xl ${reg ? 'text-green-400' : 'text-red-400'}`}>{reg ? '✓' : '✗'}</p>
                    </div>
                  ))}
                </div>

                {/* Issues list */}
                <div className="space-y-2 mb-6">
                  {activeEntry.issues.map((issue, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                      issue.fixed ? 'border-green-700/30 bg-green-900/20 opacity-60' :
                      issue.severity === 'error' ? 'border-red-700/40 bg-red-900/20' :
                      issue.severity === 'warning' ? 'border-yellow-700/40 bg-yellow-900/20' :
                      'border-blue-700/40 bg-blue-900/20'
                    }`}>
                      <span className="shrink-0 mt-0.5">
                        {issue.fixed ? '✅' : issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase mr-2">{issue.field}</span>
                        <span className={`text-sm ${issue.fixed ? 'line-through text-gray-500' : 'text-gray-200'}`}>{issue.message}</span>
                        {issue.fixed && <span className="ml-2 text-xs text-green-400">Fixed</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Auto-fix button */}
                {!autoFixing && activeEntry.issues.some(i => i.severity !== 'info' && !i.fixed) && (
                  <button
                    onClick={runAutoFix}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold transition mb-4"
                  >
                    <span className="text-xl">⚡</span>
                    Auto Fix All Issues
                  </button>
                )}

                {autoFixing && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="animate-spin text-xl">⚙️</div>
                      <span className="text-purple-300 font-medium">Applying fixes... {fixProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100 rounded-full" style={{ width: `${fixProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {/* Push button */}
                {activeEntry.hash && !pushed && (
                  <button
                    onClick={handlePush}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-700 hover:bg-indigo-600 rounded-xl font-bold transition mb-4"
                  >
                    <span>🚀</span> Push to Right Panel
                  </button>
                )}

                {/* Hash info */}
                {activeEntry.hash && (
                  <div className="bg-[#0d1117] border border-green-700/30 rounded-xl p-4 mt-4 font-mono text-xs text-green-400">
                    <div className="mb-1">HASH: {activeEntry.hash}</div>
                    <div className="text-gray-500">TIMESTAMP: {activeEntry.timestamp}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat box */}
          <div className="h-56 border-t border-[#3c3c3c] bg-[#1e1e1e] flex flex-col">
            <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-[#3c3c3c] font-bold uppercase tracking-widest">Chat</div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {chat.map((msg, i) => (
                <div key={i} className={`flex gap-2 text-xs ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-gray-700">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <div className={`px-3 py-2 rounded-xl max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-800 text-white' : 'bg-[#2d2d2d] text-gray-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 px-3 pb-3">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Ask about ISRC, splits, PROs..."
                className="flex-1 bg-[#3c3c3c] border border-[#4c4c4c] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button onClick={sendChat} className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Results panel */}
        <div className="w-72 shrink-0 bg-[#252526] border-l border-[#3c3c3c] flex flex-col overflow-hidden">
          <div className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-[#3c3c3c]">
            Updated Info
          </div>

          {pushed && activeEntry ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-[#1e1e1e] rounded-xl p-4 border border-green-700/30">
                <h3 className="font-bold text-green-400 mb-3">✅ Fixed & Verified</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Track</span>
                    <span className="text-white font-medium">{activeEntry.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Artist</span>
                    <span className="text-white">{activeEntry.artist}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ISRC</span>
                    <span className="text-green-400 font-mono text-xs">{activeEntry.isrc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ASCAP</span>
                    <span className="text-green-400">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BMI</span>
                    <span className="text-green-400">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SOCAN</span>
                    <span className="text-green-400">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">PRS</span>
                    <span className="text-green-400">✓</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1e1e1e] rounded-xl p-4 border border-indigo-700/30">
                <h3 className="font-bold text-indigo-400 mb-2 text-sm">Blockchain Proof</h3>
                <p className="font-mono text-xs text-gray-400 break-all">{activeEntry.hash}</p>
                <p className="text-xs text-gray-600 mt-1">{activeEntry.timestamp?.slice(0, 19).replace('T', ' ')} UTC</p>

                {/* QR placeholder */}
                <div className="mt-3 bg-white rounded-lg p-3 flex items-center justify-center">
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: 49 }, (_, i) => (
                      <div key={i} className={`w-2.5 h-2.5 ${Math.random() > 0.4 ? 'bg-black' : 'bg-white'}`}></div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-center text-gray-600 mt-1">Scan to verify on-chain</p>
              </div>

              <Link
                href="/attorney-portal#generate-court-report"
                className="block w-full py-3 bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-center text-sm transition"
              >
                📄 View & Download PDF
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="text-5xl mb-4 opacity-20">📋</div>
              <p className="text-gray-600 text-sm">Run auto-fix and click Push to see updated info here</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
