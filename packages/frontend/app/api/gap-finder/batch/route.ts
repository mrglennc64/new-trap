import { NextResponse } from 'next/server';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const LB_BASE = 'https://api.listenbrainz.org/1';
const MB_HEADERS = {
  'User-Agent': 'TrapRoyaltiesPro/1.0 (traproyaltiespro.com)',
  Accept: 'application/json',
};

const ISRC_RE = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;

function estimateRevenue(listens: number) {
  return Math.round(listens * 0.004 * 100) / 100;
}

async function probeISRC(rawISRC: string): Promise<{
  isrc: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  song_title: string | null;
  artist: string | null;
  gaps: { type: string; severity: string; message: string }[];
  estimated_loss: number;
  listen_count: number;
}> {
  const result = {
    isrc: rawISRC,
    status: 'GREEN' as 'GREEN' | 'YELLOW' | 'RED',
    song_title: null as string | null,
    artist: null as string | null,
    gaps: [] as { type: string; severity: string; message: string }[],
    estimated_loss: 0,
    listen_count: 0,
  };

  // CHECK A: MusicBrainz linkage
  let mbRecording: any = null;
  try {
    const res = await fetch(`${MB_BASE}/isrc/${rawISRC}?inc=artists+releases&fmt=json`, { headers: MB_HEADERS });
    if (res.ok) {
      const data = await res.json();
      const rec = data.recordings?.[0];
      if (rec) {
        mbRecording = {
          mbid: rec.id,
          title: rec.title,
          artist: rec['artist-credit']?.[0]?.name || null,
          artist_mbid: rec['artist-credit']?.[0]?.artist?.id || null,
          has_releases: (rec.releases?.length || 0) > 0,
        };
        result.song_title = rec.title;
        result.artist = mbRecording.artist;
      }
    }
  } catch { /* continue */ }

  if (!mbRecording) {
    result.gaps.push({ type: 'LINKAGE_GAP', severity: 'CRITICAL', message: 'ISRC not in MusicBrainz registry' });
    result.status = 'RED';
    return result;
  }

  // CHECK B: Work / ISWC / writer IPI
  try {
    const wRes = await fetch(`${MB_BASE}/recording/${mbRecording.mbid}?inc=work-rels&fmt=json`, { headers: MB_HEADERS });
    if (wRes.ok) {
      const wData = await wRes.json();
      const workRel = wData.relations?.find((r: any) => r['target-type'] === 'work');
      if (!workRel) {
        result.gaps.push({ type: 'PERCENTAGE_GAP', severity: 'HIGH', message: 'No composition work linked — publishing share unverifiable' });
        if (result.status === 'GREEN') result.status = 'YELLOW';
      } else {
        // Quick work check for ISWC
        const wkRes = await fetch(`${MB_BASE}/work/${workRel.work.id}?inc=artist-rels&fmt=json`, { headers: MB_HEADERS });
        if (wkRes.ok) {
          const wkData = await wkRes.json();
          if (!wkData.iswcs?.[0]) {
            result.gaps.push({ type: 'ISWC_GAP', severity: 'HIGH', message: 'Missing ISWC — unroutable at PROs' });
            if (result.status === 'GREEN') result.status = 'YELLOW';
          }
          const writers = (wkData.relations || []).filter((r: any) =>
            r['target-type'] === 'artist' && ['writer','composer','lyricist'].includes(r.type)
          );
          const noIpi = writers.filter((r: any) => !r.artist?.ipis?.length).length;
          if (noIpi > 0) {
            const pct = writers.length > 0 ? Math.round((noIpi / writers.length) * 100) : 0;
            result.gaps.push({ type: 'PERCENTAGE_GAP', severity: 'HIGH', message: `${noIpi}/${writers.length} writers missing IPI (~${pct}% unclaimed)` });
            if (result.status === 'GREEN') result.status = 'YELLOW';
          }
        }
      }
    }
  } catch { /* continue */ }

  // CHECK C: Artist IPI
  if (mbRecording.artist_mbid) {
    try {
      const aRes = await fetch(`${MB_BASE}/artist/${mbRecording.artist_mbid}?fmt=json`, { headers: MB_HEADERS });
      if (aRes.ok) {
        const aData = await aRes.json();
        if (!aData.ipis?.length) {
          result.gaps.push({ type: 'IDENTITY_GAP', severity: 'MEDIUM', message: 'Artist missing IPI — SoundExchange claim at risk' });
          if (result.status === 'GREEN') result.status = 'YELLOW';
        }
      }
    } catch { /* continue */ }
  }

  // Listen count for revenue estimate
  try {
    const lbRes = await fetch(`${LB_BASE}/popularity/recording/${mbRecording.mbid}`, {
      headers: { 'User-Agent': 'TrapRoyaltiesPro/1.0' },
    });
    if (lbRes.ok) {
      const lbData = await lbRes.json();
      result.listen_count = lbData.total_listen_count ?? 0;
    }
  } catch { /* continue */ }

  if (result.gaps.length > 0) {
    const base = estimateRevenue(result.listen_count);
    const mult = result.gaps.reduce((s, g) => s + (g.severity === 'CRITICAL' ? 0.4 : g.severity === 'HIGH' ? 0.25 : 0.1), 0);
    result.estimated_loss = Math.round(base * Math.min(mult, 1.0) * 100) / 100;
  }

  if (result.gaps.some(g => g.severity === 'CRITICAL')) result.status = 'RED';

  return result;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept either { isrcs: string[] } or { csv_text: string }
    let isrcs: string[] = [];
    if (Array.isArray(body.isrcs)) {
      isrcs = body.isrcs
        .map((s: string) => s.toUpperCase().replace(/-/g, '').trim())
        .filter((s: string) => ISRC_RE.test(s));
    } else if (typeof body.csv_text === 'string') {
      isrcs = body.csv_text
        .split(/[\n,;\s]+/)
        .map((s: string) => s.toUpperCase().replace(/-/g, '').trim())
        .filter((s: string) => ISRC_RE.test(s));
    }

    if (isrcs.length === 0) {
      return NextResponse.json({ error: 'No valid ISRCs provided' }, { status: 400 });
    }
    if (isrcs.length > 100) {
      return NextResponse.json({ error: 'Max 100 ISRCs per batch' }, { status: 400 });
    }

    // Process sequentially with small delay to respect MB rate limit (1 req/s)
    const results = [];
    for (const isrc of isrcs) {
      const r = await probeISRC(isrc);
      results.push(r);
      if (isrcs.length > 1) await new Promise(res => setTimeout(res, 1100));
    }

    const summary = {
      total_tracks: results.length,
      clean: results.filter(r => r.status === 'GREEN').length,
      yellow: results.filter(r => r.status === 'YELLOW').length,
      red: results.filter(r => r.status === 'RED').length,
      gaps_found: results.filter(r => r.status !== 'GREEN').length,
      total_estimated_leakage: Math.round(results.reduce((s, r) => s + r.estimated_loss, 0) * 100) / 100,
    };

    return NextResponse.json({ summary, results });

  } catch (err) {
    return NextResponse.json({ error: 'Batch audit failed', details: String(err) }, { status: 500 });
  }
}
