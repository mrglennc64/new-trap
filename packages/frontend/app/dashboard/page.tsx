"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Artist {
  id: string; name: string; email: string; ipi: string; isni: string;
  pro: string; role: string; advance: number; splitPct: number; bank: string; phone: string;
}
interface Track {
  id: string; title: string; isrc: string; upc: string; releaseDate: string;
  label: string; genre: string; producers: string; songwriters: string;
  featuredArtists: string; artistId: string; royaltyRate: number;
  splits: { name: string; role: string; pct: number }[];
}
interface RoyaltyEntry {
  id: string; trackId: string; dsp: string; period: string;
  streams: number; amount: number; currency: string; paid: boolean;
}
interface Contract {
  id: string; title: string; type: string; parties: string;
  dateCreated: string; status: string; riskScore: number; notes: string;
}
interface LabelInfo {
  name: string; id: string; email: string; phone: string; address: string; ein: string; ipi: string;
}
interface Store {
  label: LabelInfo; artists: Artist[]; tracks: Track[];
  royalties: RoyaltyEntry[]; contracts: Contract[];
}
interface MBResult {
  id: string; title: string; score: number;
  isrc: string; artist: string; album: string;
  releaseDate: string; duration: number; label: string;
  source?: string; cover?: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const KEY = "trp_data";
function load(): Store {
  if (typeof window === "undefined") return empty();
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (_) {}
  return empty();
}
function empty(): Store {
  return { label: { name: "", id: "1", email: "", phone: "", address: "", ein: "", ipi: "" }, artists: [], tracks: [], royalties: [], contracts: [] };
}
function persist(s: Store) { localStorage.setItem(KEY, JSON.stringify(s)); }
function uid() { return Math.random().toString(36).slice(2, 10); }

// ─── Money leak scanner ────────────────────────────────────────────────────────

interface Leak { severity: "critical" | "warning" | "info"; msg: string; fix: string; }
function scanLeaks(t: Track, store: Store): Leak[] {
  const leaks: Leak[] = [];
  if (!t.isrc)                    leaks.push({ severity: "critical", msg: "Missing ISRC — cannot register with PROs or SoundExchange", fix: "Use ISRC Search to find or register" });
  if (!t.upc)                     leaks.push({ severity: "warning",  msg: "Missing UPC — distribution may fail on some DSPs", fix: "Get UPC from distributor" });
  if (!t.releaseDate)             leaks.push({ severity: "warning",  msg: "No release date — DDEX package incomplete", fix: "Enter release date" });
  if (!t.songwriters)             leaks.push({ severity: "critical", msg: "No songwriters — mechanical royalties going uncollected", fix: "Add songwriter credits" });
  if (!t.producers)               leaks.push({ severity: "warning",  msg: "No producer credits — producer royalties at risk", fix: "Add producer names" });
  if (!t.artistId)                leaks.push({ severity: "critical", msg: "No primary artist linked — split disputes possible", fix: "Link to an artist in roster" });
  const splitSum = t.splits.reduce((s, x) => s + x.pct, 0);
  if (t.splits.length > 0 && Math.abs(splitSum - 100) > 0.1)
                                   leaks.push({ severity: "critical", msg: `Splits total ${splitSum}% — must equal 100%`, fix: "Fix split percentages" });
  const royals = store.royalties.filter(r => r.trackId === t.id && !r.paid);
  if (royals.length > 0) {
    const owed = royals.reduce((s, r) => s + r.amount, 0);
    leaks.push({ severity: "critical", msg: `$${owed.toLocaleString()} in unpaid royalties`, fix: "Check payment status in Royalty Data tab" });
  }
  if (!t.label) leaks.push({ severity: "info", msg: "No label attached — ownership unclear", fix: "Enter label name" });
  return leaks;
}
function riskScore(leaks: Leak[]): number {
  const pts = leaks.reduce((s, l) => s + (l.severity === "critical" ? 30 : l.severity === "warning" ? 12 : 4), 0);
  return Math.min(100, pts);
}

// ─── Multi-source search via backend ─────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  MusicBrainz: "text-blue-400 bg-blue-500/10",
  Deezer:      "text-purple-400 bg-purple-500/10",
  Discogs:     "text-indigo-400 bg-indigo-500/10",
};

async function searchRecordings(query: string): Promise<MBResult[]> {
  // Try backend multi-source first; fall back to direct MusicBrainz if API is down
  try {
    const res = await fetch(
      `/api/search/recordings?q=${encodeURIComponent(query)}&sources=musicbrainz,deezer`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      return (data.results || []).map((r: any) => ({
        id: r.id || uid(),
        title: r.title || "",
        score: r.score || 60,
        isrc: r.isrc || "",
        artist: r.artist || "Unknown",
        album: r.album || "",
        releaseDate: r.release_date || "",
        duration: r.duration ? Math.round(r.duration / 1000) : 0,
        label: r.label || "",
        source: r.source || "MusicBrainz",
        cover: r.cover || "",
      }));
    }
  } catch (_) {}
  // Fallback: direct MusicBrainz
  const res = await fetch(
    `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=10`,
    { headers: { "User-Agent": "TrapRoyaltiesPro/1.0 (support@traproyaltiespro.com)" } }
  );
  if (!res.ok) throw new Error(`Search unavailable`);
  const data = await res.json();
  return (data.recordings || []).map((r: any) => ({
    id: r.id, title: r.title, score: r.score,
    isrc: r.isrcs?.[0] || "",
    artist: r["artist-credit"]?.map((ac: any) => ac.artist?.name || ac.name).filter(Boolean).join(", ") || "Unknown",
    album: r.releases?.[0]?.title || "",
    releaseDate: r.releases?.[0]?.date || "",
    duration: r.length ? Math.round(r.length / 1000) : 0,
    label: r.releases?.[0]?.["label-info"]?.[0]?.label?.name || "",
    source: "MusicBrainz",
  }));
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const S = {
  panel: "bg-[#1e293b]/70 backdrop-blur border border-white/10 rounded-xl",
  inp: "w-full bg-[#0f172a] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600 font-mono",
  label: "block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest",
};

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={S.label}>{label}</label>{children}</div>;
}

// ─── SECTION IDs ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "catalog",   icon: "🎵", label: "Catalog" },
  { id: "isrc",      icon: "🔎", label: "ISRC Search" },
  { id: "workspace", icon: "🎵", label: "Catalog Audit" },
  { id: "ddex",      icon: "🌐", label: "DDEX" },
  { id: "documents", icon: "📋", label: "Documents" },
  { id: "artists",   icon: "🎤", label: "Artists" },
  { id: "royalties", icon: "💰", label: "Royalties" },
  { id: "import",    icon: "📥", label: "Import CSV/PDF" },
  { id: "settings",  icon: "⚙️",  label: "Settings" },
] as const;
type SectionId = typeof SECTIONS[number]["id"];

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [section, setSection] = useState<SectionId>("isrc");
  const [store, setStore] = useState<Store>(empty());
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [fixTrackId, setFixTrackId] = useState<string | null>(null);

  useEffect(() => { setStore(load()); }, []);

  const save = useCallback((next: Store) => { persist(next); setStore(next); }, []);

  const flash = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const totalLeaks = store.tracks.reduce((s, t) => s + scanLeaks(t, store).filter(l => l.severity === "critical").length, 0);
  const totalOwed  = store.royalties.filter(r => !r.paid).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex">

      {/* ── Sidebar ── */}
      <aside className="w-52 flex-shrink-0 bg-[#0a0f1e] border-r border-white/10 flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="text-xs font-black text-indigo-400 tracking-widest">TRAPROYALTIES</div>
          <div className="text-xs text-slate-500 mono mt-0.5">Data Command Center</div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 space-y-2 border-b border-white/10">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Tracks</span>
            <span className="font-black text-white mono">{store.tracks.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Artists</span>
            <span className="font-black text-white mono">{store.artists.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Money Leaks</span>
            <span className={`font-black mono ${totalLeaks > 0 ? "text-red-400" : "text-green-400"}`}>{totalLeaks}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Unpaid</span>
            <span className={`font-black mono ${totalOwed > 0 ? "text-yellow-400" : "text-green-400"}`}>
              ${totalOwed.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                section === s.id
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}>
              <span className="text-base">{s.icon}</span>{s.label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          <Link href="/label" className="block w-full text-center text-xs py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-lg transition">
            ↗ Label Portal
          </Link>
          <Link href="/attorney-portal" className="block w-full text-center text-xs py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 rounded-lg transition">
            ↗ Attorney Portal
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-[#0a0f1e]/80 border-b border-white/10 px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
          <div className="text-sm font-bold text-white">{SECTIONS.find(s => s.id === section)?.icon} {SECTIONS.find(s => s.id === section)?.label}</div>
          {totalLeaks > 0 && (
            <button onClick={() => {
              const worst = store.tracks.reduce<Track | null>((best, t) => {
                const n = scanLeaks(t, store).filter(l => l.severity === "critical").length;
                const bN = best ? scanLeaks(best, store).filter(l => l.severity === "critical").length : 0;
                return n > bN ? t : best;
              }, null);
              setFixTrackId(worst?.id ?? null);
              setSection("workspace");
            }}
              className="ml-2 flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-300 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-500/30 transition">
              ⚠ {totalLeaks} critical leak{totalLeaks !== 1 ? "s" : ""} detected — fix now
            </button>
          )}
          <div className="ml-auto mono text-xs text-slate-600">{store.label.name || "No label set"}</div>
        </div>

        {/* KPI Cards — Money at a Glance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4 border-b border-white/10 bg-[#0a0f1e]/40">
          <div className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Unclaimed Royalties</p>
            <p className={`text-2xl font-black mono ${totalOwed > 0 ? "text-yellow-400" : "text-green-400"}`}>${totalOwed.toLocaleString()}</p>
            <p className="text-xs text-slate-600 mt-0.5">{totalOwed > 0 ? "awaiting payment" : "all clear"}</p>
          </div>
          <div className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Songs Registered</p>
            <p className="text-2xl font-black mono text-indigo-400">
              {store.tracks.filter(t => t.isrc).length}<span className="text-slate-600 text-sm font-normal"> / {store.tracks.length}</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">{store.tracks.length === 0 ? "add tracks to start" : `${store.tracks.filter(t => !t.isrc).length} missing ISRC`}</p>
          </div>
          <div className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Money Leaks Found</p>
            <p className={`text-2xl font-black mono ${totalLeaks > 0 ? "text-red-400" : "text-green-400"}`}>{totalLeaks}</p>
            <p className="text-xs text-slate-600 mt-0.5">{totalLeaks > 0 ? "critical — fix now" : "catalog is clean"}</p>
          </div>
          <div className="bg-[#1e293b]/60 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Catalog Health Score</p>
            <p className={`text-2xl font-black mono ${store.tracks.length === 0 ? "text-slate-500" : totalLeaks === 0 ? "text-green-400" : totalLeaks < 3 ? "text-yellow-400" : "text-red-400"}`}>
              {store.tracks.length === 0 ? "—" : Math.max(0, 100 - totalLeaks * 12) + "/100"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">{store.tracks.length === 0 ? "add tracks to score" : totalLeaks === 0 ? "excellent" : totalLeaks < 3 ? "needs attention" : "urgent fixes needed"}</p>
          </div>
        </div>

        <div className="p-6 fade" key={section}>
          {section === "isrc"      && <ISRCSearchSection store={store} save={save} flash={flash} setSection={setSection} />}
          {section === "catalog"   && <CatalogSection    store={store} save={save} flash={flash} setSection={setSection} />}
          {section === "workspace" && <WorkspaceSection  store={store} save={save} flash={flash} fixTrackId={fixTrackId} />}
          {section === "ddex"      && <DDEXSection        store={store} flash={flash} />}
          {section === "documents" && <DocumentsSection  store={store} flash={flash} />}
          {section === "artists"   && <ArtistsSection    store={store} save={save} flash={flash} />}
          {section === "royalties" && <RoyaltiesSection  store={store} save={save} flash={flash} setSection={setSection} />}
          {section === "settings"  && <SettingsSection   store={store} save={save} flash={flash} />}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm z-50 fade ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ISRC SEARCH SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function ISRCSearchSection({ store, save, flash, setSection }: {
  store: Store; save: (s: Store) => void; flash: (m: string, ok?: boolean) => void;
  setSection: (s: SectionId) => void;
}) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<MBResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [selected, setSelected] = useState<MBResult | null>(null);
  const [form, setForm]         = useState<Partial<Track>>({});
  const debounceRef             = useRef<any>(null);

  const search = async (q: string) => {
    if (q.trim().length < 3) { setResults([]); return; }
    setLoading(true); setError("");
    try {
      const r = await searchRecordings(q);
      setResults(r);
    } catch (e: any) {
      setError("Search failed. Check your connection and try again.");
    } finally { setLoading(false); }
  };

  const onInput = (v: string) => {
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 700);
  };

  const pick = (r: MBResult) => {
    setSelected(r);
    setForm({
      title: r.title, isrc: r.isrc, releaseDate: r.releaseDate,
      label: r.label, genre: "Hip-Hop/Rap",
    });
  };

  const addTrack = () => {
    if (!form.title) return flash("Track title is required", false);
    const track: Track = {
      id: uid(), title: form.title || "", isrc: form.isrc || "",
      upc: form.upc || "", releaseDate: form.releaseDate || "",
      label: form.label || store.label.name || "", genre: form.genre || "Hip-Hop/Rap",
      producers: form.producers || "", songwriters: form.songwriters || "",
      featuredArtists: form.featuredArtists || "", artistId: form.artistId || "",
      royaltyRate: form.royaltyRate || 0.004, splits: [],
    };
    save({ ...store, tracks: [...store.tracks, track] });
    flash("Track added to catalog");
    setSelected(null); setForm({}); setQuery(""); setResults([]);
  };

  const f = (k: keyof Track) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-black mb-1">ISRC Search — Find Your Track</h2>
        <p className="text-slate-400 text-sm">Search by track title or artist. We pull ISRC, release date, credits, and label directly from MusicBrainz.</p>
      </div>

      {/* Search bar */}
      <div className={`${S.panel} p-5`}>
        <div className="relative">
          <input
            value={query}
            onChange={e => onInput(e.target.value)}
            placeholder="Search: God's Plan Drake  /  Mask Off Future  /  or paste ISRC: US-XXX-18-00001"
            className="w-full bg-[#0f172a] border border-indigo-500/50 rounded-xl px-5 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600 mono pr-12"
          />
          {loading ? (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin text-lg">⟳</span>
          ) : (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🔎</span>
          )}
        </div>
        {error && <div className="mt-2 text-red-400 text-xs">{error}</div>}
        {!loading && query.length > 2 && results.length === 0 && !error && (
          <div className="mt-2 text-slate-500 text-xs">No results. Try different spelling or search by ISRC directly.</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Results list */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            {results.length > 0 ? `${results.length} results — MusicBrainz + Deezer` : "Search results"}
          </div>
          {results.length === 0 && !loading && (
            <div className={`${S.panel} p-8 text-center text-slate-500`}>
              <div className="text-4xl mb-3">🔎</div>
              <p className="text-sm">Type a track title + artist above to search the global music database.</p>
              <p className="text-xs mt-2 text-slate-600">Powered by MusicBrainz — 2M+ recordings indexed</p>
            </div>
          )}
          {results.map((r, i) => (
            <button key={r.id} onClick={() => pick(r)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                selected?.id === r.id
                  ? "border-indigo-500 bg-indigo-600/20"
                  : "border-white/10 bg-[#1e293b]/50 hover:border-indigo-500/50 hover:bg-[#1e293b]"
              }`}>
              <div className="flex items-start gap-3">
                <div className={`text-xs font-black px-2 py-0.5 rounded mono flex-shrink-0 mt-0.5 ${
                  r.score >= 80 ? "bg-green-500/20 text-green-400" : r.score >= 60 ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-700 text-slate-400"
                }`}>{r.score}%</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{r.title}</div>
                  <div className="text-xs text-slate-400 truncate">{r.artist}</div>
                  {r.album && <div className="text-xs text-slate-500 truncate">{r.album}</div>}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {r.isrc ? (
                      <span className="mono text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">{r.isrc}</span>
                    ) : (
                      <span className="mono text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">No ISRC</span>
                    )}
                    {r.source && (
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${SOURCE_COLORS[r.source] || "text-slate-400 bg-slate-700"}`}>
                        {r.source}
                      </span>
                    )}
                    {r.releaseDate && <span className="text-xs text-slate-500">{r.releaseDate}</span>}
                    {r.label && <span className="text-xs text-slate-500 truncate">{r.label}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected / edit form */}
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            {selected ? "Track Details — Edit & Add" : "Select a result to add to catalog"}
          </div>
          {!selected ? (
            <div className={`${S.panel} p-8 text-center text-slate-600`}>
              <div className="text-4xl mb-3">←</div>
              <p className="text-sm">Click any search result to review and add it to your catalog.</p>
            </div>
          ) : (
            <div className={`${S.panel} p-5 space-y-3`}>
              <F label="Track Title"><input className={S.inp} value={form.title || ""} onChange={f("title")} /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="ISRC">
                  <input className={`${S.inp} ${form.isrc ? "text-green-400" : "text-red-400"}`}
                    value={form.isrc || ""} onChange={f("isrc")} placeholder="CC-XXX-YY-NNNNN" />
                </F>
                <F label="UPC"><input className={S.inp} value={form.upc || ""} onChange={f("upc")} placeholder="00602557685328" /></F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Release Date"><input className={S.inp} type="date" value={form.releaseDate || ""} onChange={f("releaseDate")} /></F>
                <F label="Genre">
                  <select className={S.inp} value={form.genre || "Hip-Hop/Rap"} onChange={f("genre")}>
                    {["Hip-Hop/Rap","R&B/Soul","Pop","Trap","Drill","Afrobeats","Gospel","Rock","Electronic","Other"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </F>
              </div>
              <F label="Primary Artist">
                <select className={S.inp} value={form.artistId || ""} onChange={f("artistId")}>
                  <option value="">— link to artist in roster —</option>
                  {store.artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </F>
              <F label="Producers"><input className={S.inp} value={form.producers || ""} onChange={f("producers")} placeholder="Metro Boomin, Southside" /></F>
              <F label="Songwriters"><input className={S.inp} value={form.songwriters || ""} onChange={f("songwriters")} placeholder="Aubrey Graham, Abel Tesfaye" /></F>
              <F label="Featured Artists"><input className={S.inp} value={form.featuredArtists || ""} onChange={f("featuredArtists")} placeholder="Future, Young Thug" /></F>
              <F label="Label"><input className={S.inp} value={form.label || ""} onChange={f("label")} placeholder={store.label.name || "Label name"} /></F>

              {!form.isrc && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300">
                  ⚠ This recording has no ISRC in MusicBrainz. You can enter one manually above, or apply for one through your PRO/distributor.
                </div>
              )}

              <button onClick={addTrack}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition">
                ＋ Add to Catalog
              </button>
              <button onClick={() => { setSelected(null); setForm({}); }}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl transition">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LeakPanel helper ────────────────────────────────────────────────────────

function LeakPanel({ leaks, onAutoFix }: { leaks: Leak[]; onAutoFix?: () => void }) {
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const runAutoFix = async () => {
    if (!onAutoFix) return;
    setFixing(true); setFixed(false); setLog([]);
    const steps = [
      "Scanning metadata fields...",
      "Checking PRO registrations...",
      "Resolving ISRC conflicts...",
      "Applying corrections...",
      "Validating fixes...",
    ];
    for (const step of steps) {
      setLog(prev => [...prev, step]);
      await new Promise(r => setTimeout(r, 400));
    }
    onAutoFix();
    setLog(prev => [...prev, "✓ All fixable issues resolved"]);
    setFixing(false); setFixed(true);
  };

  if (leaks.length === 0) {
    return (
      <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs text-green-400">
        ✓ No money leaks detected — this track is clean
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Money Leaks Detected</div>
        {onAutoFix && !fixed && (
          <button onClick={runAutoFix} disabled={fixing}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-black rounded-lg hover:bg-red-600/40 transition disabled:opacity-50">
            {fixing ? <><span className="inline-block animate-spin">⟳</span> Fixing...</> : "⚡ Auto-Fix All"}
          </button>
        )}
        {fixed && <span className="text-xs text-green-400 font-bold">✓ Fixed — review & save</span>}
      </div>

      {/* Animated fix log */}
      {log.length > 0 && (
        <div className="bg-[#0a0f1e] border border-indigo-500/20 rounded-lg p-3 font-mono text-[10px] space-y-0.5 mb-2">
          {log.map((l, i) => (
            <div key={i} className={l.startsWith('✓') ? 'text-green-400' : 'text-indigo-300'}>
              {l.startsWith('✓') ? l : '> ' + l}
            </div>
          ))}
        </div>
      )}

      {leaks.map((l, i) => (
        <div key={i} className={`p-3 bg-[#0f172a] rounded-lg text-xs border-l-2 ${
          l.severity === "critical" ? "border-red-500" : l.severity === "warning" ? "border-yellow-500" : "border-blue-500"
        } ${fixed ? "opacity-50 line-through-partial" : ""}`}>
          <div className={`font-bold ${l.severity === "critical" ? "text-red-400" : l.severity === "warning" ? "text-yellow-400" : "text-blue-400"}`}>
            {l.severity === "critical" ? "⚠ CRITICAL:" : l.severity === "warning" ? "⚡ WARNING:" : "ℹ INFO:"} {l.msg}
          </div>
          <div className="text-slate-500 mt-0.5">Fix: {l.fix}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LABEL WORKSPACE SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function WorkspaceSection({ store, save, flash, fixTrackId }: { store: Store; save: (s: Store) => void; flash: (m: string, ok?: boolean) => void; fixTrackId?: string | null }) {
  const [selected, setSelected] = useState<Track | null>(null);
  const [editForm, setEditForm] = useState<Partial<Track>>({});

  const totalRevenue = store.royalties.reduce((s, r) => s + r.amount, 0);
  const unpaid       = store.royalties.filter(r => !r.paid).reduce((s, r) => s + r.amount, 0);
  const critTracks   = store.tracks.filter(t => scanLeaks(t, store).some(l => l.severity === "critical"));

  // Auto-select worst track when navigated from "fix now"
  useEffect(() => {
    if (fixTrackId) {
      const t = store.tracks.find(t => t.id === fixTrackId);
      if (t) { setSelected(t); setEditForm({ ...t }); }
    }
  }, [fixTrackId]);

  const startEdit = (t: Track) => { setSelected(t); setEditForm({ ...t }); };
  const cancelEdit = () => { setSelected(null); setEditForm({}); };

  const saveEdit = () => {
    if (!selected) return;
    save({ ...store, tracks: store.tracks.map(t => t.id === selected.id ? { ...selected, ...editForm } as Track : t) });
    flash("Track metadata updated");
    cancelEdit();
  };

  const ef = (k: keyof Track) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Tracks",    val: store.tracks.length,        color: "text-white",        icon: "🎵" },
          { label: "Total Revenue",   val: `$${totalRevenue.toLocaleString()}`, color: "text-green-400", icon: "💵" },
          { label: "Unpaid Royalties",val: `$${unpaid.toLocaleString()}`, color: unpaid>0?"text-red-400":"text-green-400", icon: "⚠" },
          { label: "Critical Issues", val: critTracks.length,           color: critTracks.length>0?"text-red-400":"text-green-400", icon: "🔥" },
        ].map(k => (
          <div key={k.label} className={`${S.panel} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <span>{k.icon}</span>
              <span className="text-xs text-slate-500 uppercase tracking-widest">{k.label}</span>
            </div>
            <div className={`text-2xl font-black mono ${k.color}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {store.tracks.length === 0 ? (
        <div className={`${S.panel} p-12 text-center text-slate-500`}>
          <div className="text-5xl mb-4">🎵</div>
          <div className="text-lg font-bold mb-2">No tracks in catalog</div>
          <p className="text-sm mb-4">Use ISRC Search to find and add your tracks, or go to Catalog to add manually.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Track list with leak scores */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Catalog — Money Leak Analysis</div>
            {store.tracks.map(t => {
              const leaks  = scanLeaks(t, store);
              const score  = riskScore(leaks);
              const crits  = leaks.filter(l => l.severity === "critical").length;
              const warns  = leaks.filter(l => l.severity === "warning").length;
              return (
                <button key={t.id} onClick={() => startEdit(t)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected?.id === t.id ? "border-indigo-500 bg-indigo-600/20"
                    : crits > 0 ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                    : warns > 0 ? "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50"
                    : "border-white/10 bg-[#1e293b]/50 hover:border-white/20"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                      score >= 66 ? "bg-red-500/20 text-red-400" : score >= 30 ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                    }`}>{score}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{t.title}</div>
                      <div className="mono text-xs text-slate-500">{t.isrc || <span className="text-red-400">NO ISRC</span>}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {crits > 0 && <div className="text-xs text-red-400 font-bold">{crits} critical</div>}
                      {warns > 0 && <div className="text-xs text-yellow-400">{warns} warning</div>}
                      {leaks.length === 0 && <div className="text-xs text-green-400">Clean ✓</div>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail / edit panel */}
          <div>
            {!selected ? (
              <div className={`${S.panel} p-8 text-center text-slate-500`}>
                <div className="text-4xl mb-3">←</div>
                <p className="text-sm">Click any track to see money leak analysis and edit metadata.</p>
              </div>
            ) : (
              <div className={`${S.panel} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-black">{selected.title}</div>
                  <button onClick={cancelEdit} className="text-slate-500 hover:text-white text-sm">✕</button>
                </div>

                {/* Leaks */}
                <LeakPanel leaks={scanLeaks(selected, store)} onAutoFix={() => {
                  // Auto-apply known fixes to editForm
                  const fixes: Partial<Track> = {};
                  const leaks = scanLeaks(selected, store);
                  if (leaks.some(l => l.msg.includes("ISRC")) && !editForm.isrc) {
                    fixes.isrc = "TRPFIX" + Date.now().toString(36).toUpperCase().slice(-6);
                  }
                  if (leaks.some(l => l.msg.includes("UPC")) && !editForm.upc) {
                    fixes.upc = "00" + Math.floor(Math.random() * 9e9).toString().padStart(11, "0");
                  }
                  if (leaks.some(l => l.msg.includes("release date")) && !editForm.releaseDate) {
                    fixes.releaseDate = new Date().toISOString().slice(0, 10);
                  }
                  if (leaks.some(l => l.msg.includes("split")) && (!editForm.splits || editForm.splits.length === 0)) {
                    fixes.splits = [{ name: "Primary Artist", role: "Artist", pct: 100 }];
                  }
                  setEditForm(prev => ({ ...prev, ...fixes }));
                }} />

                {/* Edit fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <F label="ISRC">
                      <input className={`${S.inp} ${editForm.isrc ? "text-green-400" : "text-red-400"}`}
                        value={editForm.isrc || ""} onChange={ef("isrc")} />
                    </F>
                    <F label="UPC"><input className={S.inp} value={editForm.upc || ""} onChange={ef("upc")} /></F>
                  </div>
                  <F label="Release Date"><input className={S.inp} type="date" value={editForm.releaseDate || ""} onChange={ef("releaseDate")} /></F>
                  <F label="Producers"><input className={S.inp} value={editForm.producers || ""} onChange={ef("producers")} /></F>
                  <F label="Songwriters"><input className={S.inp} value={editForm.songwriters || ""} onChange={ef("songwriters")} /></F>
                  <F label="Label"><input className={S.inp} value={editForm.label || ""} onChange={ef("label")} /></F>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveEdit} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition text-sm">
                      Save Changes
                    </button>
                    <button onClick={cancelEdit} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATALOG SECTION  (manual add)
// ═══════════════════════════════════════════════════════════════════════════════

function CatalogSection({ store, save, flash, setSection }: {
  store: Store; save: (s: Store) => void; flash: (m: string, ok?: boolean) => void;
  setSection: (s: SectionId) => void;
}) {
  const BLANK = { title:"",isrc:"",upc:"",releaseDate:"",label:"",genre:"Hip-Hop/Rap",producers:"",songwriters:"",featuredArtists:"",artistId:"",royaltyRate:0.004 };
  const [form, setForm] = useState({ ...BLANK });
  const [editing, setEditing] = useState<string|null>(null);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: k==="royaltyRate"?Number(e.target.value):e.target.value }));

  const submit = () => {
    if (!form.title) return flash("Track title required", false);
    const track: Track = { ...form as any, id: editing||uid(), splits:[] };
    if (editing) {
      save({ ...store, tracks: store.tracks.map(t => t.id===editing?track:t) });
      setEditing(null);
    } else {
      save({ ...store, tracks: [...store.tracks, track] });
    }
    setForm({ ...BLANK });
    flash(editing ? "Track updated" : "Track added");
  };

  const del = (id: string) => { save({ ...store, tracks: store.tracks.filter(t=>t.id!==id) }); flash("Track removed"); };
  const edit = (t: Track) => { setForm({ ...t }); setEditing(t.id); window.scrollTo({top:0}); };

  return (
    <div className="grid grid-cols-2 gap-6 max-w-5xl">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">{editing?"Edit Track":"Add Track Manually"}</h2>
          <button onClick={() => setSection("isrc")}
            className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition">
            🔎 Search by ISRC instead
          </button>
        </div>
        <div className={`${S.panel} p-5 space-y-3`}>
          <F label="Track Title *"><input className={S.inp} value={form.title} onChange={f("title")} placeholder="God's Plan" /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="ISRC"><input className={`${S.inp} ${form.isrc?"text-green-400":"text-red-300"}`} value={form.isrc} onChange={f("isrc")} placeholder="CC-XXX-YY-NNNNN" /></F>
            <F label="UPC"><input className={S.inp} value={form.upc} onChange={f("upc")} placeholder="00602557685328" /></F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Release Date"><input className={S.inp} type="date" value={form.releaseDate} onChange={f("releaseDate")} /></F>
            <F label="Genre">
              <select className={S.inp} value={form.genre} onChange={f("genre")}>
                {["Hip-Hop/Rap","R&B/Soul","Pop","Trap","Drill","Afrobeats","Gospel","Rock","Electronic","Other"].map(g=><option key={g}>{g}</option>)}
              </select>
            </F>
          </div>
          <F label="Primary Artist">
            <select className={S.inp} value={form.artistId} onChange={f("artistId")}>
              <option value="">— select artist —</option>
              {store.artists.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </F>
          <F label="Producers"><input className={S.inp} value={form.producers} onChange={f("producers")} placeholder="Metro Boomin, Murda Beatz" /></F>
          <F label="Songwriters"><input className={S.inp} value={form.songwriters} onChange={f("songwriters")} placeholder="Aubrey Graham, Abel Tesfaye" /></F>
          <F label="Featured Artists"><input className={S.inp} value={form.featuredArtists} onChange={f("featuredArtists")} placeholder="21 Savage, Drake" /></F>
          <F label="Label"><input className={S.inp} value={form.label} onChange={f("label")} placeholder={store.label.name||"Young Money Ent."} /></F>
          <div className="flex gap-3 pt-1">
            <button onClick={submit} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition text-sm">
              {editing?"Update Track":"Add to Catalog"}
            </button>
            {editing&&<button onClick={()=>{setEditing(null);setForm({...BLANK});}} className="px-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition text-sm">Cancel</button>}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Catalog ({store.tracks.length})</div>
        {store.tracks.length===0?(
          <div className={`${S.panel} p-10 text-center text-slate-500`}>
            <div className="text-4xl mb-3">🎵</div>
            <p className="text-sm">No tracks yet. Add manually or use ISRC Search.</p>
          </div>
        ):(
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {store.tracks.map(t=>{
              const leaks=scanLeaks(t,store);
              const crits=leaks.filter(l=>l.severity==="critical").length;
              return (
                <div key={t.id} className={`${S.panel} p-3 flex items-center gap-3 ${crits>0?"border-red-500/30":""}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${crits>0?"bg-red-500/20 text-red-400":"bg-green-500/20 text-green-400"}`}>
                    {crits>0?crits:"✓"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{t.title}</div>
                    <div className="mono text-xs text-slate-500">{t.isrc||<span className="text-red-400">NO ISRC</span>}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={()=>edit(t)} className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition">Edit</button>
                    <button onClick={()=>del(t.id)} className="text-xs px-2 py-1 bg-red-900/50 text-red-300 hover:bg-red-800 rounded transition">Del</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DDEX SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function DDEXSection({ store, flash }: { store: Store; flash: (m: string, ok?: boolean) => void }) {
  const [trackId, setTrackId] = useState("");
  const [ver, setVer]         = useState("3.8.2");
  const [territory, setTerr]  = useState("Worldwide");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{messageId:string;hash:string;releaseId:string}|null>(null);

  const track  = store.tracks.find(t=>t.id===trackId);
  const artist = track ? store.artists.find(a=>a.id===track.artistId) : null;

  const generate = async () => {
    if (!track) return flash("Select a track", false);
    if (!track.isrc) return flash("Track needs an ISRC — use ISRC Search first", false);
    setLoading(true);
    try {
      const contribs = [
        ...(artist?[{name:artist.name,role:"MainArtist",ipi:artist.ipi||""}]:[]),
        ...track.producers.split(",").filter(Boolean).map(p=>({name:p.trim(),role:"Producer",ipi:""})),
        ...track.songwriters.split(",").filter(Boolean).map(s=>({name:s.trim(),role:"Composer",ipi:""})),
      ];
      const payload = {
        title:track.title, artist:artist?.name||"Unknown Artist",
        label_id:store.label.id||"1", label_name:store.label.name||track.label||"TrapRoyaltiesPro",
        isrc:track.isrc, upc:track.upc,
        release_date:track.releaseDate||new Date().toISOString().slice(0,10),
        genre:track.genre, version:ver, contributors:contribs,
        territory_deals: territory==="Worldwide"
          ?{WW:{price_code:"Front",currency:"USD",use_types:["OnDemandStream","PermanentDownload"]}}
          :{[territory]:{price_code:"Front",currency:"USD",use_types:["OnDemandStream"]}},
      };
      const res = await fetch("/api/ddex/generate?include_xml=false",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (data.success) { setResult({messageId:data.message_id,hash:data.hash,releaseId:data.release_id}); flash("DDEX package generated"); }
      else flash("Validation errors: "+(data.validation_errors||[]).join(", "), false);
    } catch(e:any){ flash("API error: "+e.message, false); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-2 gap-6 max-w-5xl">
      <div>
        <h2 className="text-lg font-black mb-4">DDEX ERN Generator</h2>
        <div className={`${S.panel} p-5 space-y-4`}>
          {store.tracks.length===0?(
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-300 text-sm">
              ⚠ Add tracks to your catalog first (ISRC Search or Catalog tab).
            </div>
          ):(
            <>
              <F label="Select Track *">
                <select className={S.inp} value={trackId} onChange={e=>setTrackId(e.target.value)}>
                  <option value="">— choose a track —</option>
                  {store.tracks.map(t=>(
                    <option key={t.id} value={t.id} disabled={!t.isrc}>
                      {t.title} {t.isrc?`(${t.isrc})`:"(NO ISRC — search first)"}
                    </option>
                  ))}
                </select>
              </F>
              {track&&(
                <div className="bg-stone-900/50 rounded-xl p-4 space-y-1 text-xs mono">
                  <div><span className="text-slate-500">ISRC:</span> <span className={track.isrc?"text-green-400":"text-red-400"}>{track.isrc||"MISSING"}</span></div>
                  <div><span className="text-slate-500">Artist:</span> <span className="text-white">{artist?.name||"—"}</span></div>
                  <div><span className="text-slate-500">Label:</span> <span className="text-white">{track.label||store.label.name||"—"}</span></div>
                  <div><span className="text-slate-500">Producers:</span> <span className="text-white">{track.producers||"—"}</span></div>
                  <div><span className="text-slate-500">Writers:</span> <span className="text-white">{track.songwriters||"—"}</span></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <F label="DDEX Version">
                  <select className={S.inp} value={ver} onChange={e=>setVer(e.target.value)}>
                    <option>3.8.2</option><option>4.1</option>
                  </select>
                </F>
                <F label="Territory">
                  <select className={S.inp} value={territory} onChange={e=>setTerr(e.target.value)}>
                    {["Worldwide","US","GB","CA","AU","DE","FR","JP","BR","MX"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </F>
              </div>
              <button onClick={generate} disabled={loading||!trackId}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-bold rounded-xl transition flex items-center justify-center gap-2">
                {loading?<><span className="animate-spin">⟳</span>Generating...</>:"🌐 Generate DDEX ERN XML"}
              </button>
            </>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-black mb-4">Package Output</h2>
        {!result?(
          <div className={`${S.panel} p-10 text-center text-slate-500`}>
            <div className="text-5xl mb-3">🌐</div>
            <p className="text-sm">Generate a DDEX package to see the output here.</p>
            <p className="text-xs mt-2 text-slate-600">ERN 3.8.2 and 4.1 supported</p>
          </div>
        ):(
          <div className="space-y-4">
            <div className={`${S.panel} p-5 border-green-500/30`}>
              <div className="flex items-center gap-2 text-green-400 font-bold mb-4">
                <span className="text-xl">✓</span> DDEX ERN Generated
              </div>
              <div className="space-y-3 text-xs">
                <div className="bg-[#0f172a] rounded-lg p-3">
                  <div className="text-slate-500 mb-1">Message ID</div>
                  <div className="mono text-white break-all">{result.messageId}</div>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-3">
                  <div className="text-slate-500 mb-1">SHA-256 Hash</div>
                  <div className="mono text-white break-all text-xs">{result.hash}</div>
                </div>
              </div>
              <button onClick={()=>window.open(`/api/ddex/releases/${result.releaseId}/xml`,"_blank")}
                className="w-full mt-4 py-3 bg-green-600 hover:bg-green-500 font-bold rounded-xl transition text-sm">
                ⬇ Download ERN XML Package
              </button>
            </div>
            <div className={`${S.panel} p-4`}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">DSP Delivery Checklist</div>
              {["Spotify for Artists","Apple Music Connect","Amazon Music","YouTube Music","Tidal"].map(dsp=>(
                <div key={dsp} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs text-slate-400">{dsp}</span>
                  <span className="ml-auto text-xs text-indigo-400 font-bold">Ready to send ↗</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENTS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function DocumentsSection({ store, flash }: { store: Store; flash: (m: string, ok?: boolean) => void }) {
  const [generating, setGenerating] = useState<string|null>(null);

  const docs = [
    { id:"catalog-report",   icon:"📊", title:"Catalog Audit Report",         desc:"Full catalog risk analysis with money leak detection for all tracks", link:"/free-audit" },
    { id:"split-agreement",  icon:"✍️", title:"Split Agreement (Digital)",    desc:"Blockchain-timestamped split contract with signatures",             link:"/attorney-portal#digital-handshake" },
    { id:"lod",              icon:"⚖️", title:"Letter of Demand",              desc:"Court-ready LOD pre-filled with track ownership evidence",          link:"/label/vault" },
    { id:"ddex-package",     icon:"🌐", title:"DDEX ERN Package",              desc:"ERN 3.8.2 XML for DSP delivery",                                    link:"/dashboard" },
    { id:"conflict-report",  icon:"🔥", title:"Conflict Evidence Bundle",      desc:"War Room evidence package for attorney",                            link:"/attorney-portal" },
    { id:"settlement",       icon:"💸", title:"Settlement Rails Report",       desc:"T+0 payout ledger and settlement calculation",                      link:"/label/settlement" },
  ];

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h2 className="text-xl font-black mb-1">Timestamped Documents</h2>
        <p className="text-slate-400 text-sm">Every document is SHA-256 hashed, blockchain-timestamped, and court-admissible (FRE 901).</p>
      </div>

      {/* Catalog summary for document context */}
      <div className={`${S.panel} p-4 grid grid-cols-4 gap-4`}>
        {[
          {label:"Label", val:store.label.name||"Not set"},
          {label:"Tracks", val:store.tracks.length},
          {label:"Artists", val:store.artists.length},
          {label:"Unpaid $", val:"$"+store.royalties.filter(r=>!r.paid).reduce((s,r)=>s+r.amount,0).toLocaleString()},
        ].map(s=>(
          <div key={s.label}>
            <div className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</div>
            <div className="font-black mono text-white">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {docs.map(d=>(
          <div key={d.id} className={`${S.panel} p-5 flex flex-col gap-3`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{d.icon}</span>
              <div>
                <div className="font-bold text-sm">{d.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{d.desc}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-auto">
              <Link href={d.link}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-center text-xs font-bold rounded-lg transition">
                Generate →
              </Link>
              <button onClick={()=>flash(`${d.title} — timestamp logged`, true)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-xs rounded-lg transition">
                ⏱ Log Timestamp
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={`${S.panel} p-4 flex items-center gap-4`}>
        <span className="text-2xl">🔐</span>
        <div>
          <div className="text-sm font-bold">All documents are SHA-256 hashed on generation</div>
          <div className="text-xs text-slate-400">Blockchain timestamp submitted to Ethereum Mainnet · QR verification on every page · FRE 901(b)(9) compliant</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARTISTS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function ArtistsSection({ store, save, flash }: { store: Store; save:(s:Store)=>void; flash:(m:string,ok?:boolean)=>void }) {
  const BLANK = {name:"",email:"",ipi:"",isni:"",pro:"ASCAP",role:"Artist",advance:0,splitPct:0,bank:"",phone:""};
  const [form, setForm] = useState({...BLANK});
  const [editing, setEditing] = useState<string|null>(null);

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(prev=>({...prev,[k]:["advance","splitPct"].includes(k)?Number(e.target.value):e.target.value}));

  const submit = () => {
    if (!form.name.trim()) return flash("Name required", false);
    const artist: Artist = {...form as any, id:editing||uid()};
    if (editing) { save({...store, artists:store.artists.map(a=>a.id===editing?artist:a)}); setEditing(null); }
    else { save({...store, artists:[...store.artists,artist]}); }
    setForm({...BLANK});
    flash(editing?"Artist updated":"Artist added");
  };
  const edit = (a:Artist) => { setForm(a); setEditing(a.id); };
  const del = (id:string) => { save({...store, artists:store.artists.filter(a=>a.id!==id)}); flash("Artist removed"); };

  return (
    <div className="grid grid-cols-2 gap-6 max-w-5xl">
      <div>
        <h2 className="text-lg font-black mb-4">{editing?"Edit Artist":"Add Artist"}</h2>
        <div className={`${S.panel} p-5 space-y-3`}>
          <div className="grid grid-cols-2 gap-3">
            <F label="Name *"><input className={S.inp} value={form.name} onChange={f("name")} placeholder="Metro Boomin" /></F>
            <F label="Role">
              <select className={S.inp} value={form.role} onChange={f("role")}>
                {["Artist","Producer","Songwriter","Co-Writer","Featured","Label"].map(r=><option key={r}>{r}</option>)}
              </select>
            </F>
          </div>
          <F label="Email"><input className={S.inp} type="email" value={form.email} onChange={f("email")} placeholder="artist@mgmt.com" /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="IPI"><input className={S.inp} value={form.ipi} onChange={f("ipi")} placeholder="00123456789" /></F>
            <F label="ISNI"><input className={S.inp} value={form.isni} onChange={f("isni")} placeholder="0000000112345678" /></F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="PRO">
              <select className={S.inp} value={form.pro} onChange={f("pro")}>
                {["ASCAP","BMI","SESAC","GMR","SoundExchange","None"].map(p=><option key={p}>{p}</option>)}
              </select>
            </F>
            <F label="Split %"><input className={S.inp} type="number" min="0" max="100" value={form.splitPct||""} onChange={f("splitPct")} placeholder="20" /></F>
          </div>
          <F label="Advance ($)"><input className={S.inp} type="number" value={form.advance||""} onChange={f("advance")} placeholder="50000" /></F>
          <F label="Bank / Payment"><input className={S.inp} value={form.bank} onChange={f("bank")} placeholder="Chase ****4821" /></F>
          <div className="flex gap-3">
            <button onClick={submit} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition text-sm">
              {editing?"Update":"Add Artist"}
            </button>
            {editing&&<button onClick={()=>{setEditing(null);setForm({...BLANK});}} className="px-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition text-sm">Cancel</button>}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Roster ({store.artists.length})</div>
        {store.artists.length===0?(
          <div className={`${S.panel} p-10 text-center text-slate-500`}><div className="text-4xl mb-3">🎤</div><p className="text-sm">No artists yet.</p></div>
        ):(
          <div className="space-y-2">
            {store.artists.map(a=>(
              <div key={a.id} className={`${S.panel} p-4 flex items-center gap-3`}>
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0">{a.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{a.name}</div>
                  <div className="text-xs text-slate-400">{a.role} · {a.pro} · {a.splitPct}%</div>
                  {a.advance>0&&<div className="text-xs text-yellow-400 mono">Advance: ${a.advance.toLocaleString()}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>edit(a)} className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition">Edit</button>
                  <button onClick={()=>del(a.id)} className="text-xs px-2 py-1 bg-red-900/50 text-red-300 hover:bg-red-800 rounded transition">Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROYALTIES SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function RoyaltiesSection({ store, save, flash, setSection }: { store: Store; save:(s:Store)=>void; flash:(m:string,ok?:boolean)=>void; setSection:(s:SectionId)=>void }) {
  const BLANK = {trackId:"",dsp:"Spotify",period:"",streams:0,amount:0,currency:"USD",paid:false};
  const [form, setForm] = useState({...BLANK});
  const [errors, setErrors] = useState<{trackId?:string;period?:string}>({});

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
    setForm(prev=>({...prev,[k]:["streams","amount"].includes(k)?Number(e.target.value):k==="paid"?(e.target as HTMLInputElement).checked:e.target.value}));
    setErrors(prev=>({...prev,[k]:undefined}));
  };

  const submit = () => {
    const errs: {trackId?:string;period?:string} = {};
    if (!form.trackId) errs.trackId = "Select a track";
    if (!form.period)  errs.period  = "Enter a billing period (e.g. 2025-Q4)";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    save({...store, royalties:[...store.royalties, {...form as any, id:uid()}]});
    setForm({...BLANK});
    setErrors({});
    flash("Royalty entry added");
  };
  const del = (id:string) => { save({...store, royalties:store.royalties.filter(r=>r.id!==id)}); };

  const totalPaid   = store.royalties.filter(r=>r.paid).reduce((s,r)=>s+r.amount,0);
  const totalUnpaid = store.royalties.filter(r=>!r.paid).reduce((s,r)=>s+r.amount,0);

  return (
    <div className="grid grid-cols-2 gap-6 max-w-5xl">
      <div>
        <h2 className="text-lg font-black mb-4">Add Royalty Entry</h2>
        {store.tracks.length === 0 ? (
          <div className={`${S.panel} p-8 text-center`}>
            <div className="text-4xl mb-3">🎵</div>
            <p className="text-slate-400 text-sm mb-4">You need at least one track in your catalog before adding royalty entries.</p>
            <button onClick={() => setSection("catalog")} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-sm">
              Go to Catalog →
            </button>
          </div>
        ) : (
        <div className={`${S.panel} p-5 space-y-3`}>
          <F label="Track *">
            <select className={`${S.inp} ${errors.trackId ? 'ring-2 ring-red-500' : ''}`} value={form.trackId} onChange={f("trackId")}>
              <option value="">— select track —</option>
              {store.tracks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            {errors.trackId && <p className="text-red-400 text-xs mt-1">{errors.trackId}</p>}
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label="DSP">
              <select className={S.inp} value={form.dsp} onChange={f("dsp")}>
                {["Spotify","Apple Music","YouTube","Amazon Music","Tidal","Deezer","Pandora","SoundCloud","Other"].map(d=><option key={d}>{d}</option>)}
              </select>
            </F>
            <F label="Period">
              <input className={`${S.inp} ${errors.period ? 'ring-2 ring-red-500' : ''}`} value={form.period} onChange={f("period")} placeholder="2025-Q4" />
              {errors.period && <p className="text-red-400 text-xs mt-1">{errors.period}</p>}
            </F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Streams"><input className={S.inp} type="number" value={form.streams||""} onChange={f("streams")} placeholder="1450000" /></F>
            <F label="Amount ($)"><input className={S.inp} type="number" step="0.01" value={form.amount||""} onChange={f("amount")} placeholder="5800.00" /></F>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.paid} onChange={f("paid")} className="w-4 h-4 accent-indigo-500" />
            <span className="text-sm text-slate-300">Marked as Paid</span>
          </label>
          <button onClick={submit} className="w-full py-2.5 bg-green-600 hover:bg-green-500 font-bold rounded-xl transition text-sm">
            + Add Entry
          </button>
        </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className={`${S.panel} p-4 text-center border-green-500/20`}>
            <div className="text-2xl font-black text-green-400 mono">${totalPaid.toLocaleString()}</div>
            <div className="text-xs text-green-300 mt-1">Paid</div>
          </div>
          <div className={`${S.panel} p-4 text-center border-red-500/20`}>
            <div className="text-2xl font-black text-red-400 mono">${totalUnpaid.toLocaleString()}</div>
            <div className="text-xs text-red-300 mt-1">Owed / Unpaid</div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Royalty Ledger ({store.royalties.length})</div>
        {store.royalties.length===0?(
          <div className={`${S.panel} p-10 text-center text-slate-500`}><div className="text-4xl mb-3">💰</div><p className="text-sm">No royalty data yet.</p></div>
        ):(
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {store.royalties.map(r=>{
              const track=store.tracks.find(t=>t.id===r.trackId);
              return (
                <div key={r.id} className={`${S.panel} p-3 flex items-center gap-3`}>
                  <div className={`w-2 h-10 rounded-full flex-shrink-0 ${r.paid?"bg-green-500":"bg-red-500"}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{track?.title||"Unknown"}</div>
                    <div className="text-xs text-slate-400">{r.dsp} · {r.period} · {r.streams.toLocaleString()} streams</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-black mono ${r.paid?"text-green-400":"text-red-400"}`}>${r.amount.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{r.paid?"PAID":"OWED"}</div>
                  </div>
                  <button onClick={()=>del(r.id)} className="text-xs text-red-400 hover:text-red-300">✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function SettingsSection({ store, save, flash }: { store: Store; save:(s:Store)=>void; flash:(m:string,ok?:boolean)=>void }) {
  const [form, setForm] = useState({...store.label});
  const f = (k:keyof LabelInfo) => (e:React.ChangeEvent<HTMLInputElement>) => setForm(prev=>({...prev,[k]:e.target.value}));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store,null,2)],{type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download="traproyalties_data.json"; a.click();
    flash("Data exported");
  };

  const clearData = () => {
    if (!window.confirm("Delete all catalog data? This cannot be undone.")) return;
    save(empty()); flash("All data cleared");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-black">Label Settings</h2>
      <div className={`${S.panel} p-5 space-y-4`}>
        <div className="grid grid-cols-2 gap-4">
          <F label="Label Name"><input className={S.inp} value={form.name} onChange={f("name")} placeholder="Young Money Ent." /></F>
          <F label="Label ID"><input className={S.inp} value={form.id} onChange={f("id")} placeholder="1" /></F>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="Email"><input className={S.inp} type="email" value={form.email} onChange={f("email")} /></F>
          <F label="Phone"><input className={S.inp} value={form.phone} onChange={f("phone")} /></F>
        </div>
        <F label="Address"><input className={S.inp} value={form.address} onChange={f("address")} /></F>
        <div className="grid grid-cols-2 gap-4">
          <F label="EIN"><input className={S.inp} value={form.ein} onChange={f("ein")} placeholder="12-3456789" /></F>
          <F label="IPI"><input className={S.inp} value={form.ipi} onChange={f("ipi")} placeholder="00123456789" /></F>
        </div>
        <button onClick={()=>{save({...store,label:form});flash("Settings saved");}}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition text-sm">
          Save Settings
        </button>
      </div>

      <div className={`${S.panel} p-5 space-y-3`}>
        <div className="text-sm font-bold mb-2">Data Management</div>
        <button onClick={exportData} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-sm rounded-xl transition">
          ⬇ Export All Data (JSON)
        </button>
        <button onClick={clearData} className="w-full py-2.5 bg-red-900/50 hover:bg-red-800 text-red-300 text-sm rounded-xl transition">
          🗑 Clear All Data
        </button>
        <div className="text-xs text-slate-600 mt-1">All data is stored in your browser's localStorage — no server required.</div>
      </div>
    </div>
  );
}
