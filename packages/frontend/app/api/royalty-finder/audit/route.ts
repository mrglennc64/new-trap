import { NextResponse } from 'next/server';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const LB_BASE = 'https://api.listenbrainz.org/1';
const AUDIODB_KEY = '816586';
const AUDIODB_BASE = 'https://www.theaudiodb.com/api/v1/json';
const MB_HEADERS = {
  'User-Agent': 'TrapRoyaltiesPro/1.0 (traproyaltiespro.com)',
  'Accept': 'application/json',
};

function isValidISRC(isrc: string) {
  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(isrc);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isrc = (body.isrc || '').toUpperCase().replace(/-/g, '').trim();

    if (!isrc || !isValidISRC(isrc)) {
      return NextResponse.json({ error: 'Invalid ISRC format' }, { status: 400 });
    }

    // 1. MusicBrainz ISRC lookup
    let mbRecording: any = null;
    try {
      const mbRes = await fetch(
        `${MB_BASE}/isrc/${isrc}?inc=artists+releases&fmt=json`,
        { headers: MB_HEADERS }
      );
      if (mbRes.ok) {
        const mbData = await mbRes.json();
        const rec = mbData.recordings?.[0];
        if (rec) {
          mbRecording = {
            mbid: rec.id,
            title: rec.title,
            length_ms: rec.length || null,
            artist: rec['artist-credit']?.[0]?.name || null,
            artist_mbid: rec['artist-credit']?.[0]?.artist?.id || null,
            releases: (rec.releases || []).slice(0, 3).map((r: any) => ({
              id: r.id,
              title: r.title,
              date: r.date || null,
              country: r.country || null,
            })),
          };
        }
      }
    } catch { /* continue */ }

    // 2. ListenBrainz popularity / listen count
    let listenData: any = null;
    if (mbRecording?.mbid) {
      try {
        const lbRes = await fetch(
          `${LB_BASE}/popularity/recording/${mbRecording.mbid}`,
          { headers: { 'User-Agent': 'TrapRoyaltiesPro/1.0' } }
        );
        if (lbRes.ok) {
          const lbJson = await lbRes.json();
          listenData = {
            total_listen_count: lbJson.total_listen_count ?? null,
            total_user_count: lbJson.total_user_count ?? null,
          };
        }
      } catch { /* ListenBrainz is bonus */ }
    }

    // 3. TheAudioDB track lookup by ISRC (v2 search fallback by title+artist)
    let audiodbTrack: any = null;
    if (mbRecording?.title && mbRecording?.artist) {
      try {
        const adbRes = await fetch(
          `${AUDIODB_BASE}/${AUDIODB_KEY}/searchtrack.php?s=${encodeURIComponent(mbRecording.artist)}&t=${encodeURIComponent(mbRecording.title)}`
        );
        if (adbRes.ok) {
          const adbData = await adbRes.json();
          const track = adbData?.track?.[0];
          if (track) {
            audiodbTrack = {
              id: track.idTrack,
              title: track.strTrack,
              album: track.strAlbum,
              genre: track.strGenre,
              mood: track.strMood,
              theme: track.strTheme,
              music_video: track.strMusicVid || null,
              thumb: track.strTrackThumb || null,
              lyrics_site: track.strTrackLyrics || null,
            };
          }
        }
      } catch { /* AudioDB bonus */ }
    }

    // ── ACRCloud fallback when MB has no record ──────────────────────
    let acrTrack: any = null;
    if (!mbRecording) {
      const acrToken = process.env.ACRCLOUD_TOKEN;
      if (acrToken) {
        try {
          const acrRes = await fetch(
            `https://eu-api-v2.acrcloud.com/api/external-metadata/tracks?isrc=${isrc}&include_works=1&platforms=spotify,deezer,youtube,applemusic`,
            {
              headers: { Authorization: acrToken.startsWith('Bearer ') ? acrToken : `Bearer ${acrToken}` },
              signal: AbortSignal.timeout(8_000),
            }
          );
          if (acrRes.ok) {
            const j = await acrRes.json();
            const t = j.data?.[0];
            if (t) {
              const ext = t.external_metadata ?? {};
              const w = t.works?.[0];
              acrTrack = {
                name: t.name,
                artist: (t.artists ?? [])[0]?.name ?? null,
                album_title: t.album?.title ?? null,
                album_label: t.album?.label ?? null,
                album_cover: t.album?.covers?.medium ?? t.album?.cover ?? null,
                release_date: t.release_date ?? null,
                iswc: w?.iswc ?? null,
                contributors: (w?.contributors ?? []).map((c: any) => ({ name: c.name, ipi: c.ipi ?? null, roles: c.roles ?? [] })),
                platforms: {
                  spotify:    ext.spotify?.[0]?.link    ?? null,
                  applemusic: ext.applemusic?.[0]?.link ?? null,
                  youtube:    ext.youtube?.[0]?.link    ?? null,
                  deezer:     ext.deezer?.[0]?.link     ?? null,
                },
              };
            }
          }
        } catch { /* optional */ }
      }
    }

    // Gap analysis
    const gaps: string[] = [];
    if (!mbRecording && !acrTrack) gaps.push('ISRC not found in MusicBrainz or ACRCloud — may be unregistered');
    if (!mbRecording && acrTrack)  gaps.push('ISRC confirmed via ACRCloud — not yet in MusicBrainz (publishing routing incomplete)');
    if (mbRecording && !mbRecording.releases?.length) gaps.push('No release linked — neighboring rights exposure');
    if (!listenData?.total_listen_count) gaps.push('No ListenBrainz listen data — SoundExchange claim potential');
    if (!audiodbTrack) gaps.push('Not indexed in TheAudioDB — sync licensing gap');

    if (!mbRecording && !acrTrack) {
      return NextResponse.json({
        isrc,
        found: false,
        gaps,
        message: 'No recording found for this ISRC in MusicBrainz.',
      }, { status: 200 });
    }

    // If ACRCloud found it but MB didn't — build result from ACR data
    if (!mbRecording && acrTrack) {
      const riskScore = Math.min(100, gaps.length * 25);
      return NextResponse.json({
        isrc,
        found: true,
        source: 'acrcloud',
        song_title: acrTrack.name,
        artist: acrTrack.artist,
        releases: acrTrack.release_date ? [{ date: acrTrack.release_date }] : [],
        listen_stats: null,
        audiodb: null,
        acr: acrTrack,
        gaps,
        score: riskScore,
      });
    }

    const riskScore = Math.min(100, gaps.length * 25);

    return NextResponse.json({
      isrc,
      found: true,
      song_title: mbRecording.title,
      artist: mbRecording.artist,
      artist_mbid: mbRecording.artist_mbid,
      mbid: mbRecording.mbid,
      releases: mbRecording.releases,
      listen_stats: listenData,
      audiodb: audiodbTrack,
      gaps,
      score: riskScore,
    });

  } catch (err) {
    return NextResponse.json({ error: 'Audit failed', details: String(err) }, { status: 500 });
  }
}
