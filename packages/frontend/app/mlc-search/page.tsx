"use client";

import { useState, useRef } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────── */
interface Writer {
  name: string;
  ipi: string;
  share: string;
}

interface ClaimDoc {
  id: string;
  timestamp: string;
  songTitle: string;
  artist: string;
  mlcCode: string;
  iswc: string;
  isrc: string;
  knownShares: number;
  unclaimedShares: number;
  writers: Writer[];
  claimBasis: string;
  sha256: string;
  json: string;
}

/* ─── SHA-256 helper (Web Crypto) ───────────────────────────── */
async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ─── Quick search chips ─────────────────────────────────────── */
const QUICK_CHIPS = ["10AM / Save the World", "Life Is Good", "Rockstar", "God's Plan", "HUMBLE."];

/* ─── Main ──────────────────────────────────────────────────── */
export default function MLCSearchPage() {
  /* Step 1 — search gateway */
  const [searchTerm, setSearchTerm]   = useState("");
  const [copied, setCopied]           = useState(false);

  /* Step 2 — import form */
  const [songTitle, setSongTitle]     = useState("");
  const [artist, setArtist]           = useState("");
  const [mlcCode, setMlcCode]         = useState("");
  const [iswc, setIswc]               = useState("");
  const [isrc, setIsrc]               = useState("");
  const [knownShares, setKnownShares] = useState("");
  const [claimBasis, setClaimBasis]   = useState("");
  const [writers, setWriters]         = useState<Writer[]>([{ name: "", ipi: "", share: "" }]);
  const [generating, setGenerating]   = useState(false);

  /* Generated docs */
  const [claimLog, setClaimLog]       = useState<ClaimDoc[]>([]);
  const [activeDoc, setActiveDoc]     = useState<ClaimDoc | null>(null);
  const [copiedJson, setCopiedJson]   = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Step 1: open MLC portal ── */
  const handleSearchMLC = async () => {
    if (!searchTerm.trim()) return;
    try {
      await navigator.clipboard.writeText(searchTerm.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (_) { /* clipboard blocked */ }
    const url = `https://portal.themlc.com/search#work`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ── Writers helpers ── */
  const addWriter = () => setWriters(p => [...p, { name: "", ipi: "", share: "" }]);
  const removeWriter = (i: number) => setWriters(p => p.filter((_, idx) => idx !== i));
  const updateWriter = (i: number, field: keyof Writer, val: string) =>
    setWriters(p => p.map((w, idx) => idx === i ? { ...w, [field]: val } : w));

  /* ── Step 2: generate claim doc ── */
  const handleGenerate = async () => {
    if (!songTitle.trim() || !mlcCode.trim()) return;
    setGenerating(true);

    const known = parseFloat(knownShares) || 0;
    const unclaimed = parseFloat((100 - known).toFixed(2));

    const payload = {
      generated: new Date().toISOString(),
      songTitle: songTitle.trim(),
      artist: artist.trim(),
      mlcSongCode: mlcCode.trim(),
      iswc: iswc.trim() || "Not provided",
      isrc: isrc.trim() || "Not provided",
      totalKnownShares: known,
      unclaimedShares: unclaimed,
      writers: writers.filter(w => w.name.trim()),
      claimBasis: claimBasis.trim(),
    };

    const json = JSON.stringify(payload, null, 2);
    const hash = await sha256hex(json);
    const id = `TRAP-${Date.now().toString(36).toUpperCase().slice(-8)}`;

    const doc: ClaimDoc = {
      id,
      timestamp: new Date().toLocaleString(),
      songTitle: payload.songTitle,
      artist: payload.artist,
      mlcCode: payload.mlcSongCode,
      iswc: payload.iswc,
      isrc: payload.isrc,
      knownShares: known,
      unclaimedShares: unclaimed,
      writers: writers.filter(w => w.name.trim()),
      claimBasis: payload.claimBasis,
      sha256: hash,
      json,
    };

    setClaimLog(p => [doc, ...p]);
    setActiveDoc(doc);
    setGenerating(false);

    /* clear form */
    setSongTitle(""); setArtist(""); setMlcCode(""); setIswc("");
    setIsrc(""); setKnownShares(""); setClaimBasis("");
    setWriters([{ name: "", ipi: "", share: "" }]);
  };

  const formValid = songTitle.trim() && mlcCode.trim();

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pt-14 pb-20">

      {/* Header */}
      <div className="bg-[#0f172a] border-b border-white/10 px-6 py-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔎</span>
              <h1 className="text-xl font-black text-white tracking-tight">MLC Search Gateway</h1>
              <span className="px-2 py-0.5 text-xs font-bold text-green-300 bg-green-500/20 border border-green-500/30 rounded-full">
                Real Portal
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Search the live MLC portal, then import what you find to generate attorney-grade claim documentation.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/lod-generator" className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition">
              ← LOD
            </Link>
            <Link href="/cwr-generator" className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
              CWR Generator
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ═══════════════════════════════════════════════════════
            STEP 1 — SEARCH GATEWAY
        ═══════════════════════════════════════════════════════ */}
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <span className="w-7 h-7 flex items-center justify-center bg-indigo-600 rounded-full text-xs font-black text-white">1</span>
            <div>
              <div className="text-sm font-bold text-white">Search The MLC Portal</div>
              <div className="text-xs text-slate-500">Opens the real MLC portal — your search term is copied to clipboard automatically</div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔎</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearchMLC()}
                  placeholder="Song title, artist, ISRC, or ISWC…"
                  className="w-full pl-9 pr-4 py-3 bg-[#1e293b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleSearchMLC}
                disabled={!searchTerm.trim()}
                className="px-5 py-3 bg-green-700 hover:bg-green-600 disabled:bg-white/10 disabled:text-slate-600 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 whitespace-nowrap"
              >
                Search The MLC ↗
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-600 self-center">Quick:</span>
              {QUICK_CHIPS.map(name => (
                <button key={name}
                  onClick={() => setSearchTerm(name)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs rounded-lg border border-white/10 transition">
                  {name}
                </button>
              ))}
            </div>

            {/* Clipboard notice */}
            {copied && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-900/30 border border-green-700/40 rounded-xl text-xs text-green-300">
                <span>✓</span>
                <span><strong>"{searchTerm}"</strong> copied to clipboard — paste it into the MLC search box that just opened.</span>
              </div>
            )}

            {/* Info callout */}
            <div className="flex gap-3 p-4 bg-blue-950/30 border border-blue-700/40 rounded-xl text-xs text-blue-200/80 leading-relaxed">
              <span className="text-lg flex-shrink-0">ℹ️</span>
              <div>
                <span className="font-bold text-blue-300 block mb-1">How this works</span>
                Clicking <strong>Search The MLC ↗</strong> opens <span className="font-mono text-blue-300">portal.themlc.com</span> in a new tab and copies your search term to the clipboard.
                Paste it into the MLC search box, find your work, note the <strong>MLC Song Code</strong>, <strong>ISWC</strong>, and <strong>Known Shares %</strong>, then come back to Step 2 below.
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            STEP 2 — IMPORT + GENERATE
        ═══════════════════════════════════════════════════════ */}
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <span className="w-7 h-7 flex items-center justify-center bg-indigo-600 rounded-full text-xs font-black text-white">2</span>
            <div>
              <div className="text-sm font-bold text-white">Import MLC Data & Generate Claim Documentation</div>
              <div className="text-xs text-slate-500">Paste what you found on The MLC portal to create SHA-256 hashed attorney documentation</div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Song info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">Song Title <span className="text-rose-400">*</span></label>
                <input
                  type="text" value={songTitle} onChange={e => setSongTitle(e.target.value)}
                  placeholder="e.g. 10AM / Save the World"
                  className="w-full px-3 py-2.5 bg-[#1e293b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">Artist / Performer</label>
                <input
                  type="text" value={artist} onChange={e => setArtist(e.target.value)}
                  placeholder="e.g. Drake"
                  className="w-full px-3 py-2.5 bg-[#1e293b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">
                  MLC Song Code <span className="text-rose-400">*</span>
                  <span className="ml-1 text-slate-600 font-normal">(from MLC portal)</span>
                </label>
                <input
                  type="text" value={mlcCode} onChange={e => setMlcCode(e.target.value)}
                  placeholder="e.g. MLC123456789"
                  className="w-full px-3 py-2.5 bg-[#1e293b] border border-white/10 rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">
                  ISWC
                  <span className="ml-1 text-slate-600 font-normal">(from MLC portal)</span>
                </label>
                <input
                  type="text" value={iswc} onChange={e => setIswc(e.target.value)}
                  placeholder="e.g. T-123.456.789-0"
                  className="w-full px-3 py-2.5 bg-[#1e293b] border border-white/10 rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">ISRC</label>
                <input
                  type="text" value={isrc} onChange={e => setIsrc(e.target.value)}
                  placeholder="e.g. USRC11600001"
                  className="w-full px-3 py-2.5 bg-[#1e293b] border border-white/10 rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">
                  Total Known Shares %
                  <span className="ml-1 text-slate-600 font-normal">(from MLC portal — e.g. 97.5)</span>
                </label>
                <div className="relative">
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={knownShares} onChange={e => setKnownShares(e.target.value)}
                    placeholder="e.g. 97.5"
                    className="w-full px-3 py-2.5 bg-[#1e293b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  {knownShares && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-400">
                      {(100 - parseFloat(knownShares)).toFixed(2)}% unclaimed
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Writers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400 font-semibold">Writers / Rights Holders</label>
                <button onClick={addWriter}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition font-semibold">
                  + Add Writer
                </button>
              </div>
              <div className="space-y-2">
                {writers.map((w, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text" value={w.name} onChange={e => updateWriter(i, "name", e.target.value)}
                      placeholder="Writer full name"
                      className="flex-1 px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text" value={w.ipi} onChange={e => updateWriter(i, "ipi", e.target.value)}
                      placeholder="IPI #"
                      className="w-32 px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text" value={w.share} onChange={e => updateWriter(i, "share", e.target.value)}
                      placeholder="Share %"
                      className="w-24 px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    {writers.length > 1 && (
                      <button onClick={() => removeWriter(i)}
                        className="text-slate-600 hover:text-rose-400 text-lg leading-none transition">×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Claim basis */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1.5">Claim Basis / Evidence Summary</label>
              <textarea
                value={claimBasis} onChange={e => setClaimBasis(e.target.value)}
                rows={3}
                placeholder="Describe the basis for this claim — e.g. 'Client is listed as co-writer. ISRC USRC11600001 confirmed on MLC portal with 2.5% unclaimed mechanical share. No claim on file as of 2026-03-09.'"
                className="w-full px-3 py-2.5 bg-[#1e293b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!formValid || generating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-slate-600 text-white font-black rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              {generating ? <><span className="animate-spin">⚙</span> Generating…</> : "Generate Claim Documentation →"}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            GENERATED DOC
        ═══════════════════════════════════════════════════════ */}
        {activeDoc && (
          <div className="bg-[#0f172a] border border-indigo-500/40 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 bg-indigo-600/10 border-b border-indigo-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <div>
                  <div className="text-sm font-black text-white">Claim Documentation — {activeDoc.id}</div>
                  <div className="text-xs text-slate-400">{activeDoc.timestamp}</div>
                </div>
              </div>
              <button onClick={() => setActiveDoc(null)} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
            </div>

            <div className="p-5 space-y-5">

              {/* Unclaimed alert */}
              {activeDoc.unclaimedShares > 0 && (
                <div className="flex gap-3 p-4 bg-rose-950/40 border border-rose-700/40 rounded-xl">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <div className="text-sm font-black text-rose-400 mb-0.5">
                      {activeDoc.unclaimedShares.toFixed(2)}% Mechanical Share Unclaimed
                    </div>
                    <div className="text-xs text-rose-200/70 leading-relaxed">
                      The MLC portal shows <strong className="text-white">{activeDoc.knownShares}% known shares</strong> for this work.
                      The remaining <strong className="text-rose-300">{activeDoc.unclaimedShares.toFixed(2)}%</strong> has no registered claimant.
                      This represents a potential unclaimed mechanical royalty position.
                    </div>
                  </div>
                </div>
              )}

              {/* Evidence table */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Evidence Record</div>
                <div className="bg-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                  {[
                    ["Document ID",       activeDoc.id],
                    ["Song Title",        activeDoc.songTitle],
                    ["Artist",            activeDoc.artist || "—"],
                    ["MLC Song Code",     activeDoc.mlcCode],
                    ["ISWC",              activeDoc.iswc],
                    ["ISRC",              activeDoc.isrc],
                    ["Total Known Shares",`${activeDoc.knownShares}%`],
                    ["Unclaimed Shares",  `${activeDoc.unclaimedShares.toFixed(2)}%`],
                    ["Generated",         activeDoc.timestamp],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-4 px-4 py-2.5 text-sm">
                      <span className="text-slate-500 w-44 flex-shrink-0 text-xs">{k}</span>
                      <span className="text-white font-mono text-xs break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Writers breakdown */}
              {activeDoc.writers.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Writers / Rights Holders</div>
                  <div className="space-y-2">
                    {activeDoc.writers.map((w, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
                        <div>
                          <div className="text-sm font-semibold text-white">{w.name}</div>
                          {w.ipi && <div className="text-xs text-slate-500 font-mono">IPI: {w.ipi}</div>}
                        </div>
                        {w.share && <div className="text-sm font-black text-indigo-300">{w.share}%</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Claim basis */}
              {activeDoc.claimBasis && (
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Claim Basis</div>
                  <div className="bg-white/5 rounded-xl px-4 py-3 text-sm text-slate-300 leading-relaxed">
                    {activeDoc.claimBasis}
                  </div>
                </div>
              )}

              {/* Attorney next steps */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Attorney Next Steps</div>
                <div className="space-y-2">
                  {[
                    {
                      n: "1",
                      title: "Verify Ownership Documentation",
                      desc: "Gather all chain-of-title documents: original recording contracts, songwriter agreements, copyright registrations, and any prior assignment or licensing agreements.",
                    },
                    {
                      n: "2",
                      title: "File Claim at The MLC Portal",
                      desc: "Log into portal.themlc.com as the rights holder. Navigate to the work using the MLC Song Code above. Submit a formal ownership claim with supporting documentation.",
                      link: { href: "https://portal.themlc.com", label: "Open MLC Portal ↗" },
                    },
                    {
                      n: "3",
                      title: "Register via CWR if No ISWC",
                      desc: "If the ISWC field is missing or unregistered, file a Common Works Registration (CWR) through your PRO or directly. This is required to collect international mechanicals.",
                      link: { href: "/cwr-generator", label: "CWR Generator →" },
                    },
                    {
                      n: "4",
                      title: "Generate Letter of Direction (LOD)",
                      desc: "Issue a LOD directing The MLC to distribute unclaimed mechanical royalties to your client's designated account upon successful claim resolution.",
                      link: { href: "/lod-generator", label: "LOD Generator →" },
                    },
                  ].map(s => (
                    <div key={s.n} className="flex gap-3 p-3 bg-white/5 rounded-xl">
                      <span className="w-6 h-6 flex items-center justify-center bg-indigo-600/40 border border-indigo-500/40 rounded-full text-xs font-black text-indigo-300 flex-shrink-0 mt-0.5">
                        {s.n}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white mb-0.5">{s.title}</div>
                        <div className="text-xs text-slate-400 leading-relaxed">{s.desc}</div>
                        {s.link && (
                          <a href={s.link.href} target={s.link.href.startsWith("http") ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            className="inline-block mt-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition">
                            {s.link.label}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHA-256 chain of custody */}
              <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">🔐</span>
                  <span className="text-xs font-bold text-green-400">Chain of Custody — SHA-256</span>
                </div>
                <div className="font-mono text-xs text-green-300/80 break-all leading-relaxed">
                  {activeDoc.sha256}
                </div>
                <div className="text-[11px] text-slate-600">
                  This hash uniquely identifies the exact document content. Any change to the data will produce a different hash — providing tamper evidence for legal proceedings.
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                <Link href="/cwr-generator"
                  className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition">
                  CWR Generator →
                </Link>
                <a href="https://portal.themlc.com" target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-700/20 hover:bg-green-700/30 text-green-300 border border-green-700/30 rounded-lg text-xs font-semibold transition">
                  File at MLC ↗
                </a>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(activeDoc.json);
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-semibold transition">
                  {copiedJson ? "✓ Copied!" : "Copy JSON"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            SESSION CLAIM LOG
        ═══════════════════════════════════════════════════════ */}
        {claimLog.length > 1 && (
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <div className="text-sm font-bold text-white">Session Claim Log — {claimLog.length} documented works</div>
              <div className="text-xs text-slate-500">All documentation generated this session. Refresh to clear.</div>
            </div>
            <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
              {claimLog.map(doc => (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{doc.songTitle}</div>
                    <div className="text-xs text-slate-500">{doc.artist || "—"} · {doc.mlcCode} · {doc.unclaimedShares.toFixed(2)}% unclaimed</div>
                  </div>
                  <div className="text-xs text-slate-600 font-mono hidden sm:block">{doc.id}</div>
                  <button
                    onClick={() => setActiveDoc(doc)}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition">
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            INFO CARDS
        ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🌐",
              title: "Real MLC Data",
              desc: "This tool opens the actual MLC portal — no simulated results, no mock database. Every work you import comes directly from your live MLC search.",
            },
            {
              icon: "🔐",
              title: "Chain of Custody",
              desc: "Every claim document receives a SHA-256 hash computed from its exact content. Use this hash in legal filings to prove the document has not been altered.",
            },
            {
              icon: "🔍",
              title: "Gap Detection",
              desc: "Known Shares below 100% = unclaimed mechanical position. Even 0.5% unclaimed on a major hit can represent thousands in unrecovered royalties.",
            },
          ].map(c => (
            <div key={c.title} className="bg-[#0f172a] border border-white/10 rounded-xl p-4 space-y-2">
              <div className="text-2xl">{c.icon}</div>
              <div className="text-sm font-semibold text-white">{c.title}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
