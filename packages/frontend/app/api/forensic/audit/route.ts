import { NextResponse } from 'next/server';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const LB_BASE = 'https://api.listenbrainz.org/1';
const AUDIODB_KEY = '816586';
const MB_HEADERS = {
  'User-Agent': 'TrapRoyaltiesPro/1.0 (traproyaltiespro.com)',
  'Accept': 'application/json',
};

function isValidISRC(isrc: string) {
  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(isrc);
}

function calcStatute(releaseDate: string | null) {
  if (!releaseDate) return null;
  const year = parseInt(releaseDate.slice(0, 4));
  if (isNaN(year)) return null;
  const ageYears = new Date().getFullYear() - year;
  if (ageYears >= 3) {
    return {
      level: 'urgent',
      label: 'Statute of Limitations Warning',
      message: `This recording is ${ageYears} years old. Many royalty claims have a 3-year lookback window under 17 U.S.C. § 507(b). Consult an attorney before filing.`,
      release_date: releaseDate,
      age_years: ageYears,
    };
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isrc = (body.isrc || '').toUpperCase().replace(/-/g, '').trim();

    if (!isrc || !isValidISRC(isrc)) {
      return NextResponse.json({ detail: 'Invalid ISRC format' }, { status: 400 });
    }

    // 1. MusicBrainz ISRC lookup (probe step)
    let mbRec: any = null;
    let probeStatus = 'not_found';
    let probeData: any = null;
    let checkedAt = new Date().toISOString();

    try {
      const mbRes = await fetch(
        `${MB_BASE}/isrc/${isrc}?inc=artists+releases+work-rels&fmt=json`,
        { headers: MB_HEADERS }
      );
      if (mbRes.ok) {
        const mbData = await mbRes.json();
        const rec = mbData.recordings?.[0];
        if (rec) {
          mbRec = rec;
          probeStatus = 'found';
          probeData = {
            song_title: rec.title,
            artist: rec['artist-credit']?.[0]?.name || null,
            iswc: rec.relations?.find((r: any) => r.type === 'performance')?.work?.iswcs?.[0] || null,
            ipi: null, // MusicBrainz doesn't expose IPI directly
            has_work_relationship: (rec.relations || []).some((r: any) => r['target-type'] === 'work'),
            release_date: rec.releases?.[0]?.date || null,
          };
        }
      }
    } catch { /* continue */ }

    // 2. ListenBrainz listen data (detect step)
    let listenCount = 0;
    let userCount = 0;
    let blackBox = false;

    if (mbRec?.id) {
      try {
        const lbRes = await fetch(
          `${LB_BASE}/popularity/recording/${mbRec.id}`,
          { headers: { 'User-Agent': 'TrapRoyaltiesPro/1.0' } }
        );
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          listenCount = lbData.total_listen_count ?? 0;
          userCount = lbData.total_user_count ?? 0;
          // Black box: high listens but low user count ratio = possible streaming fraud
          blackBox = listenCount > 10000 && userCount > 0 && (listenCount / userCount) > 100;
        }
      } catch { /* bonus data */ }
    }

    // 3. TheAudioDB for additional track data
    let audiodbData: any = null;
    const songTitle = mbRec?.title || '';
    const artist = mbRec?.['artist-credit']?.[0]?.name || '';
    if (songTitle && artist) {
      try {
        const adbRes = await fetch(
          `https://www.theaudiodb.com/api/v1/json/${AUDIODB_KEY}/searchtrack.php?s=${encodeURIComponent(artist)}&t=${encodeURIComponent(songTitle)}`
        );
        if (adbRes.ok) {
          const adbData = await adbRes.json();
          audiodbData = adbData?.track?.[0] || null;
        }
      } catch { /* bonus */ }
    }

    // 4. Revenue estimate
    const revLow = Math.round(listenCount * 0.0007);
    const revMid = Math.round(listenCount * 0.003);
    const revHigh = Math.round(listenCount * 0.004);

    // 5. Discogs lookup
    let discogsStatus = 'not_checked';
    let discogsData: any = null;
    if (isrc) {
      try {
        // Discogs requires auth token — mark as manual_required
        discogsStatus = 'manual_required';
      } catch { /* discogs */ }
    }

    // 6. Release date + statute
    const releaseDate = probeData?.release_date || mbRec?.releases?.[0]?.date || null;
    const statute = calcStatute(releaseDate);

    // 7. Build findings array
    const findings: any[] = [];
    if (probeStatus !== 'found') findings.push({
      type: 'isrc_unregistered', severity: 'critical',
      title: 'ISRC Not in MusicBrainz',
      description: 'This ISRC has no matching recording in the MusicBrainz database — may be unregistered.',
      source: 'MusicBrainz', checked_at: checkedAt,
    });
    if (probeStatus === 'found' && !probeData?.iswc) findings.push({
      type: 'missing_iswc', severity: 'warning',
      title: 'No ISWC Found',
      description: 'No International Standard Musical Work Code linked — publishing rights unverified.',
      source: 'MusicBrainz', checked_at: checkedAt,
    });
    if (probeStatus === 'found' && !probeData?.has_work_relationship) findings.push({
      type: 'no_work_link', severity: 'warning',
      title: 'No Work Relationship',
      description: 'Recording has no linked work — performance royalty chain may be broken.',
      source: 'MusicBrainz', checked_at: checkedAt,
    });
    if (listenCount === 0) findings.push({
      type: 'no_listen_data', severity: 'info',
      title: 'No ListenBrainz Data',
      description: 'No public listening data found — SoundExchange neighboring rights claim potential.',
      source: 'ListenBrainz', checked_at: checkedAt,
    });
    if (blackBox) findings.push({
      type: 'black_box', severity: 'critical',
      title: 'Black Box Pattern Detected',
      description: 'Abnormal stream-to-listener ratio detected — possible unmatched or misdirected royalties.',
      source: 'ListenBrainz', checked_at: checkedAt,
    });

    const gaps: string[] = findings.map(f => f.title);
    const riskLevel = findings.length === 0 ? 'Low Risk' : findings.length <= 2 ? 'Medium Risk' : 'High Risk';
    const riskColor = findings.length === 0 ? 'green' : findings.length <= 2 ? 'yellow' : 'red';

    // Probe data with first_release_date alias
    const fullProbeData = probeData ? {
      ...probeData,
      first_release_date: probeData.release_date,
    } : null;

    const manualChecklist = [
      { label: 'Check ASCAP Repertory', url: `https://www.ascap.com/repertory#/?query=${encodeURIComponent(artist + ' ' + songTitle)}`, done: false },
      { label: 'Check BMI Repertoire', url: `https://repertoire.bmi.com/`, done: false },
      { label: 'Search The MLC', url: `https://portal.themlc.com/search`, done: false },
      { label: 'Check SoundExchange', url: `https://www.soundexchange.com/`, done: false },
    ];

    return NextResponse.json({
      isrc,
      song_title: fullProbeData?.song_title || songTitle || 'Unknown',
      artist: fullProbeData?.artist || artist || 'Unknown',
      mbid: mbRec?.id || null,
      verdict: {
        level: riskLevel,
        color: riskColor,
        summary: findings.length === 0
          ? 'Recording is registered and rights appear documented.'
          : `${findings.length} gap${findings.length > 1 ? 's' : ''} detected — review recommended before filing claims.`,
      },
      statute,
      manual_checklist: manualChecklist,
      steps: {
        probe: {
          status: probeStatus,
          source: 'MusicBrainz',
          checked_at: checkedAt,
          data: fullProbeData,
        },
        detect: {
          black_box: blackBox,
          findings,
          streaming: {
            total_listens: listenCount,
            unique_listeners: userCount,
            source: 'ListenBrainz',
          },
          revenue: {
            low: revLow,
            mid: revMid,
            high: revHigh,
            confidence_label: listenCount > 0 ? 'Estimated from ListenBrainz data' : 'No stream data available',
          },
        },
        discogs: {
          status: discogsStatus,
          data: discogsData,
        },
        verify: {
          status: 'manual_required',
          matched: false,
          source: 'Manual verification required',
          checked_at: checkedAt,
          iswc: fullProbeData?.iswc || null,
          mlc_song_code: null,
          note: 'PRO verification (ASCAP/BMI/SESAC) requires manual lookup — no public API.',
        },
        manual_checklist: {
          items: [
            { label: 'Check ASCAP Repertory', url: `https://www.ascap.com/repertory#/?query=${encodeURIComponent(artist + ' ' + songTitle)}`, done: false },
            { label: 'Check BMI Repertoire', url: `https://repertoire.bmi.com/`, done: false },
            { label: 'Search The MLC', url: `https://portal.themlc.com/search`, done: false },
            { label: 'Check SoundExchange', url: `https://www.soundexchange.com/`, done: false },
          ],
        },
      },
      audiodb: audiodbData ? {
        genre: audiodbData.strGenre,
        mood: audiodbData.strMood,
        album: audiodbData.strAlbum,
        music_video: audiodbData.strMusicVid || null,
      } : null,
      gaps,
    });

  } catch (err) {
    return NextResponse.json({ detail: 'Audit failed: ' + String(err) }, { status: 500 });
  }
}
