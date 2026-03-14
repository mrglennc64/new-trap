import { NextResponse } from 'next/server';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const MB_HEADERS = {
  'User-Agent': 'TrapRoyaltiesPro/1.0 (traproyaltiespro.com)',
  'Accept': 'application/json',
};

function sanitizeIpi(ipi: string): string | null {
  const clean = ipi.replace(/\D/g, '');
  return clean.length >= 9 && clean.length <= 11 ? clean.padStart(11, '0') : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${MB_BASE}/artist?query=artist:${encodeURIComponent(query)}&limit=5&fmt=json`,
      { headers: MB_HEADERS }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'MusicBrainz lookup failed' }, { status: 502 });
    }

    const data = await res.json();
    const artists = (data.artists || []).map((a: any) => ({
      mbid: a.id,
      stage_name: a.name,
      legal_name: a['sort-name'] || a.name,
      disambiguation: a.disambiguation || null,
      country: a.country || null,
      type: a.type || null,
      score: a.score || 0,
      ipi: a.ipis?.[0] ? sanitizeIpi(a.ipis[0]) : null,
      ipi_list: (a.ipis || []).map((i: string) => sanitizeIpi(i)).filter(Boolean),
      isni_list: a.isnis || [],
    }));

    // Sort: IPIs first (verified), then by score
    artists.sort((a: any, b: any) => {
      if (a.ipi && !b.ipi) return -1;
      if (!a.ipi && b.ipi) return 1;
      return b.score - a.score;
    });

    return NextResponse.json({ query, artists });
  } catch (err) {
    return NextResponse.json({ error: 'Lookup failed', details: String(err) }, { status: 500 });
  }
}
