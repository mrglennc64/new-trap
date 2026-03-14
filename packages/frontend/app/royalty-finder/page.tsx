'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDemoMode } from '../lib/DemoModeProvider';
import { DEMO_ROYALTY_RESULT, DEMO_ISRC } from '../lib/demoData';

const ISRC_RE = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/i;
const ISRC_PARTIAL_RE = /^[A-Z]{2}[A-Z0-9]{3}\d{2,6}$/i; // looks like an ISRC but wrong length

export default function RoyaltyFinderPage() {
  return (
    <Suspense>
      <RoyaltyFinderContent />
    </Suspense>
  );
}

function RoyaltyFinderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { demoMode, consumeProbe } = useDemoMode();
  const [searchType, setSearchType] = useState('artist');
  const [artistQuery, setArtistQuery] = useState('');
  const [isrc, setIsrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  // Per-artist expanded state: mbid → { open, loadingIsrcs, recordings }
  const [acrData, setAcrData] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, { open: boolean; loading: boolean; recordings: any[] }>>({});

  const toggleArtist = async (mbid: string) => {
    if (expanded[mbid]?.open) {
      setExpanded(p => ({ ...p, [mbid]: { ...p[mbid], open: false } }));
      return;
    }
    if (expanded[mbid]?.recordings?.length) {
      setExpanded(p => ({ ...p, [mbid]: { ...p[mbid], open: true } }));
      return;
    }
    // Fetch ISRCs
    setExpanded(p => ({ ...p, [mbid]: { open: true, loading: true, recordings: [] } }));
    try {
      const res = await fetch(`/api/royalty-finder/artist/${mbid}/recordings?limit=15`);
      const data = await res.json();
      setExpanded(p => ({ ...p, [mbid]: { open: true, loading: false, recordings: data.recordings || [] } }));
    } catch {
      setExpanded(p => ({ ...p, [mbid]: { open: true, loading: false, recordings: [] } }));
    }
  };

  // Demo mode: auto-populate and trigger search
  useEffect(() => {
    if (demoMode) {
      setSearchType('isrc');
      setIsrc(DEMO_ISRC);
      setTimeout(() => document.getElementById('search-btn')?.click(), 300);
    }
  }, [demoMode]);

  // Pre-populate from landing page query and auto-search
  useEffect(() => {
    const q = searchParams.get('q');
    if (!q) return;
    const clean = q.trim().replace(/-/g, '').toUpperCase();
    if (ISRC_RE.test(clean)) {
      setSearchType('isrc');
      setIsrc(q.trim());
      // auto-trigger search
      setTimeout(() => document.getElementById('search-btn')?.click(), 100);
    } else {
      setSearchType('artist');
      setArtistQuery(q.trim());
      setTimeout(() => document.getElementById('search-btn')?.click(), 100);
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);
    setAcrData(null);

    if (demoMode) {
      await new Promise(r => setTimeout(r, 800));
      setResults(DEMO_ROYALTY_RESULT);
      setLoading(false);
      return;
    }

    if (!consumeProbe()) {
      setError('Live probe quota reached. Switching back to Demo Mode.');
      setLoading(false);
      return;
    }

    try {
      let url = '';
      const options: RequestInit = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      };

      if (searchType === 'artist') {
        if (!artistQuery.trim()) {
          throw new Error('Please enter an artist name');
        }
        const clean = artistQuery.trim().replace(/-/g, '').toUpperCase();
        if (ISRC_RE.test(clean)) {
          // User entered a full ISRC in the artist field — switch to ISRC audit
          setSearchType('isrc');
          setIsrc(artistQuery.trim());
          url = `/api/royalty-finder/audit`;
          options.method = 'POST';
          options.body = JSON.stringify({ isrc: clean });
        } else if (ISRC_PARTIAL_RE.test(clean)) {
          throw new Error(`"${artistQuery.trim()}" looks like an incomplete ISRC. ISRCs are 12 characters (e.g. USUM71703861). Check your code and try again.`);
        } else {
          url = `/api/royalty-finder/search/artist?query=${encodeURIComponent(artistQuery)}`;
        }
      } else {
        if (!isrc.trim()) {
          throw new Error('Please enter an ISRC code');
        }
        url = `/api/royalty-finder/audit`;
        options.method = 'POST';
        options.body = JSON.stringify({ isrc: isrc.toUpperCase().replace(/-/g, '') });
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Search failed');
      }

      setResults(data);

      // If audit route already bundled ACRCloud data (e.g. MB miss), use it immediately
      if (data.acr) {
        // Normalise to the shape the ACRCloud panel expects
        setAcrData({
          name: data.acr.name,
          artists: data.acr.artist ? [data.acr.artist] : [],
          album: {
            title: data.acr.album_title ?? null,
            label: data.acr.album_label ?? null,
            cover: data.acr.album_cover ?? null,
            upc:   null,
          },
          release_date: data.acr.release_date ?? null,
          works: data.acr.iswc || data.acr.contributors?.length
            ? [{ iswc: data.acr.iswc, contributors: data.acr.contributors ?? [] }]
            : [],
          platforms: data.acr.platforms ?? {},
        });
      }

      // Fetch ACRCloud enrichment for ISRC searches (enriches MB results too)
      const finalIsrc = options.body
        ? JSON.parse(options.body as string).isrc
        : null;
      if (finalIsrc && !data.acr) {
        fetch(`/api/acrcloud?isrc=${finalIsrc}&include_works=1`)
          .then(r => r.ok ? r.json() : null)
          .then(acr => { if (acr?.tracks?.[0]) setAcrData(acr.tracks[0]); })
          .catch(() => {});
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Find Missing Royalties</h1>
          <p className="text-lg text-slate-300">
            Hunt down unclaimed bags from streams, syncs, performances & playlists. 
            Scan SMPT for recordings, ISRCs, and rights gaps — built for hip hop & R&B creators.
          </p>
        </div>

        {/* Search Type Toggle */}
        <div className="bg-[#0f172a] rounded-xl shadow-lg p-6 mb-8 border border-white/10">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSearchType('artist')}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                searchType === 'artist' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              Search by Artist
            </button>
            <button
              onClick={() => setSearchType('isrc')}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                searchType === 'isrc' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              Lookup by ISRC
            </button>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            {searchType === 'artist' ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Artist Name
                </label>
                <input
                  type="text"
                  value={artistQuery}
                  onChange={(e) => setArtistQuery(e.target.value)}
                  placeholder="e.g., Drake, Travis Scott, Kendrick Lamar"
                  className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white bg-[#0f172a] placeholder-slate-500"
                  required
                />
                <p className="text-sm text-slate-400 mt-2">
                  Search SMPT for artist information
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ISRC Code
                </label>
                <input
                  type="text"
                  value={isrc}
                  onChange={(e) => setIsrc(e.target.value)}
                  placeholder="e.g., USUM71703861"
                  className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white bg-[#0f172a] placeholder-slate-500"
                  required
                />
                <p className="text-sm text-slate-400 mt-2">
                  Example: USUM71703861 (Drake - God's Plan)
                </p>
                {/* MLC cross-link */}
                <div className="mt-3 flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="text-indigo-400 text-sm">🔎 Also check for unclaimed mechanical royalties in the MLC database:</span>
                  <Link
                    href={`/mlc-search${isrc ? `?q=${encodeURIComponent(isrc)}` : ''}`}
                    className="flex-shrink-0 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition"
                  >
                    Search MLC →
                  </Link>
                </div>
              </div>
            )}

            <button
              id="search-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? '🔍 Searching SMPT...' : '🔍 Find Royalties'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="bg-[#0f172a] rounded-xl shadow-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Results from SMPT</h2>
            
            {searchType === 'artist' && results.artists && (
              <div className="space-y-3">
                {results.artists.map((artist: any) => {
                  const state = expanded[artist.mbid];
                  return (
                    <div key={artist.mbid} className="border border-slate-700 rounded-lg overflow-hidden">
                      {/* Artist row — click to expand */}
                      <button
                        onClick={() => toggleArtist(artist.mbid)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition text-left"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{artist.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {[artist.type, artist.country, artist.disambiguation].filter(Boolean).join(' · ')}
                            {' · '}
                            <span className="font-mono">{artist.mbid.slice(0,8)}…</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <span className="text-[11px] font-bold text-indigo-400">{artist.score}%</span>
                          <span className="text-xs text-slate-400 border border-slate-600 px-2 py-0.5 rounded">
                            {state?.open ? '▲ Hide ISRCs' : '▼ Get ISRCs'}
                          </span>
                        </div>
                      </button>

                      {/* Expanded: recordings / ISRCs */}
                      {state?.open && (
                        <div className="border-t border-slate-700 bg-[#080d1a]">
                          {state.loading && (
                            <p className="px-4 py-3 text-xs text-slate-400">Loading recordings from SMPT...</p>
                          )}
                          {!state.loading && state.recordings.length === 0 && (
                            <p className="px-4 py-3 text-xs text-slate-500">No ISRC-linked recordings found in SMPT.</p>
                          )}
                          {!state.loading && state.recordings.map((rec: any) => (
                            <div key={rec.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/20 transition">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-slate-200 truncate">{rec.title}</p>
                                {rec.primary_isrc ? (
                                  <p className="text-[10px] font-mono text-indigo-400 mt-0.5">{rec.primary_isrc}</p>
                                ) : (
                                  <p className="text-[10px] text-slate-600 mt-0.5">No ISRC on record</p>
                                )}
                              </div>
                              {rec.primary_isrc && (
                                <button
                                  onClick={() => router.push(`/free-audit?isrc=${rec.primary_isrc}`)}
                                  className="ml-3 flex-shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded transition"
                                >
                                  Forensic Audit →
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {searchType === 'isrc' && results && (
              <div className="space-y-4">
                {/* Track header + risk score */}
                {results.found === false ? (
                  <div className="p-5 bg-red-900/20 border border-red-500/40 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="font-bold text-red-300">ISRC Not Registered</p>
                        <p className="text-sm text-slate-400">{results.isrc} — not found in MusicBrainz</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mb-4">This ISRC has no public registration. Publishing revenue may be uncollectable until registered.</p>
                    <div className="flex gap-2 flex-wrap">
                      <Link href="/mlc-search" className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition">🔎 Check MLC</Link>
                      <Link href="/cwr-generator" className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/30 transition">📋 Register Now (CWR)</Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Track card */}
                    <div className="flex items-start justify-between p-5 bg-slate-800/40 border border-slate-700 rounded-xl">
                      <div>
                        <p className="text-lg font-bold text-white">{results.song_title}</p>
                        <p className="text-sm text-slate-400 mt-0.5">
                          {results.artist && <span>{results.artist} · </span>}
                          <span className="font-mono">{results.isrc}</span>
                          {results.releases?.[0]?.date && <span> · {results.releases[0].date.slice(0,4)}</span>}
                        </p>
                        {results.source === 'acrcloud' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-800/50 border border-indigo-500/40 rounded text-[10px] text-indigo-300 font-bold">
                            🎵 Found via ACRCloud — not yet in MusicBrainz
                          </span>
                        )}
                        {results.audiodb?.genre && (
                          <p className="text-xs text-indigo-400 mt-1">Genre: {results.audiodb.genre}{results.audiodb.mood ? ` · Mood: ${results.audiodb.mood}` : ''}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-4 text-center">
                        <div className={`text-3xl font-black ${results.score === 0 ? 'text-green-400' : results.score <= 25 ? 'text-yellow-400' : results.score <= 50 ? 'text-orange-400' : 'text-red-400'}`}>
                          {results.score}
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Risk/100</p>
                      </div>
                    </div>

                    {/* ListenBrainz stats */}
                    {results.listen_stats && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-center">
                          <p className="text-xl font-black text-indigo-300">{(results.listen_stats.total_listen_count || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Total Listens (LB)</p>
                        </div>
                        <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-center">
                          <p className="text-xl font-black text-indigo-300">{(results.listen_stats.total_user_count || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Unique Listeners</p>
                        </div>
                      </div>
                    )}

                    {/* Gap Finder */}
                    {results.gaps?.length > 0 && (
                      <div className="border border-orange-500/30 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2">
                          <span className="text-orange-400 text-sm font-black">⚡ GAP FINDER</span>
                          <span className="text-xs text-orange-300">{results.gaps.length} royalty gap{results.gaps.length !== 1 ? 's' : ''} detected</span>
                        </div>
                        <div className="divide-y divide-white/5">
                          {results.gaps.map((gap: any, i: number) => {
                            // gaps may be objects {type, severity, message} or legacy strings
                            const msg        = typeof gap === 'string' ? gap : gap.message ?? '';
                            const gapType    = typeof gap === 'object' ? gap.type ?? '' : '';
                            const severity   = typeof gap === 'object' ? gap.severity : null;
                            const icon       = severity === 'CRITICAL' || gapType === 'LINKAGE_GAP' ? '🔴'
                                             : severity === 'HIGH'     || gapType === 'ISWC_GAP'    ? '🟠'
                                             : '🟡';
                            const actionHref = gapType === 'LINKAGE_GAP' ? '/cwr-generator'
                                             : gapType === 'ISWC_GAP'    ? '/cwr-generator'
                                             : gapType === 'PERCENTAGE_GAP' ? '/split-verification'
                                             : '/free-audit';
                            const actionLabel= gapType === 'LINKAGE_GAP' ? 'Register ISRC'
                                             : gapType === 'ISWC_GAP'    ? 'Link via CWR'
                                             : gapType === 'PERCENTAGE_GAP' ? 'Verify Splits'
                                             : 'Run Audit';
                            return (
                              <div key={i} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-start gap-3">
                                  <span className="text-base mt-0.5">{icon}</span>
                                  <div>
                                    {severity && (
                                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mr-2">{severity}</span>
                                    )}
                                    <p className="text-sm text-slate-300">{msg}</p>
                                  </div>
                                </div>
                                <Link href={actionHref} className="flex-shrink-0 ml-3 px-3 py-1 bg-indigo-700/60 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition">
                                  {actionLabel} →
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {results.gaps?.length === 0 && (
                      <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <p className="text-sm text-green-300 font-medium">No gaps detected — this recording is fully indexed across MusicBrainz, ListenBrainz, and TheAudioDB.</p>
                      </div>
                    )}

                    {/* ACRCloud Enrichment Panel */}
                    {acrData && (
                      <div className="border border-indigo-500/30 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 bg-indigo-900/20 border-b border-indigo-500/20 flex items-center gap-2">
                          <span className="text-indigo-300 text-sm font-black">🎵 ACRCloud DATA</span>
                          {acrData.album?.label && (
                            <span className="text-xs text-slate-400">Label: {acrData.album.label}</span>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          {/* Album cover + basic info */}
                          <div className="flex items-start gap-3">
                            {acrData.album?.cover && (
                              <img src={acrData.album.cover} alt="cover" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              {acrData.works?.[0]?.iswc && (
                                <p className="text-xs text-slate-300">
                                  <span className="text-slate-500 font-bold uppercase text-[10px]">ISWC </span>
                                  <span className="font-mono text-indigo-300">{acrData.works[0].iswc}</span>
                                </p>
                              )}
                              {acrData.album?.upc && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  <span className="text-slate-500 font-bold uppercase text-[10px]">UPC </span>
                                  <span className="font-mono">{acrData.album.upc}</span>
                                </p>
                              )}
                              {acrData.release_date && (
                                <p className="text-xs text-slate-500 mt-0.5">Released: {acrData.release_date}</p>
                              )}
                            </div>
                          </div>

                          {/* Contributors / Writers */}
                          {acrData.works?.[0]?.contributors?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Writers / Contributors</p>
                              <div className="space-y-1">
                                {acrData.works[0].contributors.map((c: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-lg">
                                    <div>
                                      <span className="text-xs font-medium text-slate-200">{c.name}</span>
                                      {c.roles?.length > 0 && (
                                        <span className="text-[10px] text-slate-500 ml-2">{c.roles.join(', ')}</span>
                                      )}
                                    </div>
                                    {c.ipi ? (
                                      <span className="text-[10px] font-mono text-green-400">IPI: {c.ipi}</span>
                                    ) : (
                                      <span className="text-[10px] text-orange-400">No IPI</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Platform links */}
                          {Object.values(acrData.platforms ?? {}).some(Boolean) && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Platforms</p>
                              <div className="flex flex-wrap gap-2">
                                {acrData.platforms.spotify && (
                                  <a href={acrData.platforms.spotify} target="_blank" rel="noreferrer" className="px-3 py-1 bg-green-800/40 hover:bg-green-700/50 text-green-300 text-[10px] font-bold rounded-lg border border-green-600/30 transition">Spotify ↗</a>
                                )}
                                {acrData.platforms.applemusic && (
                                  <a href={acrData.platforms.applemusic} target="_blank" rel="noreferrer" className="px-3 py-1 bg-pink-900/40 hover:bg-pink-800/50 text-pink-300 text-[10px] font-bold rounded-lg border border-pink-600/30 transition">Apple Music ↗</a>
                                )}
                                {acrData.platforms.youtube && (
                                  <a href={acrData.platforms.youtube} target="_blank" rel="noreferrer" className="px-3 py-1 bg-red-900/40 hover:bg-red-800/50 text-red-300 text-[10px] font-bold rounded-lg border border-red-600/30 transition">YouTube ↗</a>
                                )}
                                {acrData.platforms.deezer && (
                                  <a href={acrData.platforms.deezer} target="_blank" rel="noreferrer" className="px-3 py-1 bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-500/30 transition">Deezer ↗</a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link href={`/mlc-search`} className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition">🔎 Check MLC</Link>
                      <Link href="/cwr-generator" className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/30 transition">📋 CWR Registration</Link>
                      <Link href={`/free-audit?isrc=${results.isrc}`} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold rounded-lg border border-white/10 transition">🔬 Full Forensic Audit</Link>
                      {results.audiodb?.music_video && (
                        <a href={results.audiodb.music_video} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-red-700/60 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition">🎬 Music Video</a>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feature Cards - All black text */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-[#0f172a] p-6 rounded-xl shadow-sm border border-white/10">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-white mb-2">Global PRO Coverage</h3>
            <p className="text-slate-300">
              Scans SMPT + direct links to ASCAP, BMI, SOCAN, PRS — find unclaimed from viral TikToks to radio spins.
            </p>
          </div>
          <div className="bg-[#0f172a] p-6 rounded-xl shadow-sm border border-white/10">
            <div className="text-3xl mb-3">🎫</div>
            <h3 className="text-lg font-semibold text-white mb-2">Real ISRC Data</h3>
            <p className="text-slate-300">
              Pull real ISRCs from SMPT to verify neighboring rights and SoundExchange claims.
            </p>
          </div>
          <div className="bg-[#0f172a] p-6 rounded-xl shadow-sm border border-white/10">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-lg font-semibold text-white mb-2">Claim Your Bag</h3>
            <p className="text-slate-300">
              Direct links to every PRO and rights org — no more guessing where to go.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
