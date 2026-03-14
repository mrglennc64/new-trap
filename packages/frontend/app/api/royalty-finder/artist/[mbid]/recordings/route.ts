import { NextResponse } from 'next/server';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const MB_HEADERS = {
  'User-Agent': 'TrapRoyaltiesPro/1.0 (traproyaltiespro.com)',
  'Accept': 'application/json',
};

export async function GET(
  req: Request,
  { params }: { params: { mbid: string } }
) {
  const { searchParams } = new URL(req.url);
  const limit = 15; // fetch 15 releases to maximize ISRC coverage
  const { mbid } = params;

  if (!mbid || !/^[0-9a-f-]{36}$/.test(mbid)) {
    return NextResponse.json({ error: 'Invalid MBID' }, { status: 400 });
  }

  try {
    // Fetch official/newer releases first to maximize ISRC hits
    const mbRes = await fetch(
      `${MB_BASE}/release?artist=${mbid}&inc=recordings+isrcs&limit=${limit}&status=official&fmt=json`,
      { headers: MB_HEADERS }
    );

    if (!mbRes.ok) {
      return NextResponse.json({ error: 'MusicBrainz request failed' }, { status: 502 });
    }

    const mbData = await mbRes.json();

    // Extract unique recordings with ISRCs from all releases
    const seen = new Set<string>();
    const recordings: any[] = [];

    for (const release of mbData.releases || []) {
      for (const medium of release.media || []) {
        for (const track of medium.tracks || []) {
          const rec = track.recording;
          if (!rec || seen.has(rec.id)) continue;
          seen.add(rec.id);
          const isrcs: string[] = rec.isrcs || [];
          recordings.push({
            id: rec.id,
            title: rec.title,
            length_ms: rec.length || track.length || null,
            primary_isrc: isrcs[0] || null,
            isrc_count: isrcs.length,
            release_title: release.title,
            release_date: release.date || null,
          });
        }
      }
    }

    // Sort: ISRCs first
    recordings.sort((a, b) => b.isrc_count - a.isrc_count);

    return NextResponse.json({
      mbid,
      total: recordings.length,
      recordings: recordings.slice(0, 50),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch recordings', details: String(err) }, { status: 500 });
  }
}
