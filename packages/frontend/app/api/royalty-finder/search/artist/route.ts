import { NextResponse } from 'next/server';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const AUDIODB_KEY = '816586';
const AUDIODB_BASE = 'https://www.theaudiodb.com/api/v1/json';
const MB_HEADERS = {
  'User-Agent': 'TrapRoyaltiesPro/1.0 (traproyaltiespro.com)',
  'Accept': 'application/json',
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query')?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    // MusicBrainz artist search
    const mbRes = await fetch(
      `${MB_BASE}/artist?query=${encodeURIComponent(query)}&limit=10&fmt=json`,
      { headers: MB_HEADERS }
    );
    const mbData = mbRes.ok ? await mbRes.json() : { artists: [] };

    const artists = (mbData.artists || []).map((a: any) => ({
      mbid: a.id,
      name: a.name,
      type: a.type || null,
      country: a.country || null,
      disambiguation: a.disambiguation || null,
      score: a.score || 0,
    }));

    // Enrich top result with TheAudioDB
    let audiodbInfo = null;
    if (artists.length > 0) {
      try {
        const adbRes = await fetch(
          `${AUDIODB_BASE}/${AUDIODB_KEY}/search.php?s=${encodeURIComponent(artists[0].name)}`
        );
        const adbData = adbRes.ok ? await adbRes.json() : null;
        if (adbData?.artists?.[0]) {
          const a = adbData.artists[0];
          audiodbInfo = {
            id: a.idArtist,
            name: a.strArtist,
            genre: a.strGenre,
            style: a.strStyle,
            mood: a.strMood,
            country: a.strCountry,
            label: a.strLabel,
            thumb: a.strArtistThumb,
            bio: a.strBiographyEN?.slice(0, 300) || null,
          };
        }
      } catch {
        // AudioDB is bonus data — don't fail if it's unavailable
      }
    }

    return NextResponse.json({
      query,
      total: mbData.count || artists.length,
      artists,
      audiodb: audiodbInfo,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Search failed', details: String(err) }, { status: 500 });
  }
}
