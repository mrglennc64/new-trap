// Site-wide demo mode mock data — TrapRoyaltiesPro
// Demo track: Future feat. Drake & Tems — "Wait for U"
// All data sourced from MusicBrainz + ListenBrainz only

export const DEMO_ISRC = 'USSM12200452';

export const DEMO_ROYALTY_RESULT = {
  isrc: 'USSM12200452',
  found: true,
  source: 'musicbrainz',
  song_title: 'Wait for U',
  artist: 'Future feat. Drake & Tems',
  releases: [{ title: 'I NEVER LIKED YOU', date: '2022-04-29', country: 'US', label: 'Epic Records / Freebandz' }],
  gaps: [
    { type: 'ISWC_GAP', severity: 'HIGH', message: 'ISWC not linked in MusicBrainz — publishing royalties cannot be routed automatically.' },
    { type: 'PERCENTAGE_GAP', severity: 'HIGH', message: '2 of 4 writers missing IPI — publishing share partially unclaimed.' },
  ],
  score: 64,
  work: {
    iswc: null,
    writers: [
      { name: 'Nayvadius Wilburn', role: 'composer', ipi: '00736428519' },
      { name: 'Aubrey Graham', role: 'composer', ipi: null },
      { name: 'Temilade Openiyi', role: 'lyricist', ipi: '00987654321' },
      { name: 'Roderick Raheem Harvey', role: 'composer', ipi: null },
    ],
  },
  listen_stats: { total_listens: 582_000_000, unique_listeners: 48_200_000 },
};

export const DEMO_FREE_AUDIT: any = {
  isrc: 'USSM12200452',
  song_title: 'Wait for U',
  artist: 'Future feat. Drake & Tems',
  audit_started: new Date().toISOString(),
  steps: {
    probe: {
      status: 'found',
      checked_at: new Date().toISOString(),
      source: 'MusicBrainz',
      data: {
        mbid: 'f3c87f3b-1234-5678-abcd-ef0123456789',
        title: 'Wait for U',
        artist: 'Future feat. Drake & Tems',
        releases: [{ title: 'I NEVER LIKED YOU', date: '2022-04-29', country: 'US' }],
      },
    },
    streams: {
      total_listens: 582_000_000,
      unique_listeners: 48_200_000,
      data_level: 'exact',
      checked_at: new Date().toISOString(),
      source: 'ListenBrainz',
    },
    verify: {
      status: 'not_found',
      matched: false,
      mlc_song_code: null,
      iswc: null,
      checked_at: new Date().toISOString(),
      source: 'MLC (manual required)',
      data: {},
    },
    detect: {
      black_box: true,
      severity: 'HIGH',
      findings: [
        {
          type: 'ISWC_GAP',
          severity: 'critical',
          title: 'No ISWC Linked',
          description: 'This recording has no ISWC registered in MusicBrainz — publishing royalties cannot be routed automatically to rights holders.',
          action: 'Register an ISWC through your PRO immediately.',
        },
        {
          type: 'PERCENTAGE_GAP',
          severity: 'warning',
          title: 'Partial IPI Coverage',
          description: '2 of 4 writers (Aubrey Graham, Roderick Harvey) are missing IPI numbers — their publishing share may be held in black box accounts.',
          action: 'Each writer must register with their PRO and obtain an IPI number.',
        },
        {
          type: 'NEIGHBORING_RIGHTS_GAP',
          severity: 'warning',
          title: 'Neighboring Rights Unverified',
          description: 'No confirmed neighboring rights registration found for this master recording. Digital performance royalties may be unclaimed.',
          action: 'Register master recording with your neighboring rights collecting society.',
        },
      ],
      streaming: {
        total_listens: 582_000_000,
        unique_listeners: 48_200_000,
        checked_at: new Date().toISOString(),
        source: 'ListenBrainz',
      },
      revenue: { low: 159_000, mid: 187_200, high: 215_000, confidence: 78, confidence_label: 'Moderate-High' },
    },
    manual_checklist: {
      label: 'Manual Verification Required',
      note: 'The following registries require manual lookup — no public API available.',
      items: [
        { registry: 'MLC', purpose: 'Mechanical royalties (streaming)', check: 'Search by ISRC or song title', url: 'https://www.themlc.com', search_term: 'Wait for U Future', status: 'manual_required', why_manual: 'No public API', what_to_look_for: 'Song code, writer shares, payout status' },
        { registry: 'ASCAP', purpose: 'Performance royalties', check: 'ACE title search', url: 'https://www.ascap.com/repertory', search_term: 'Wait for U', status: 'manual_required', why_manual: 'No public API', what_to_look_for: 'ISWC, writer names, publisher' },
        { registry: 'BMI', purpose: 'Performance royalties', check: 'Repertoire search', url: 'https://repertoire.bmi.com', search_term: 'Wait for U Future', status: 'manual_required', why_manual: 'No public API', what_to_look_for: 'BMI work ID, performing artists' },
        { registry: 'SoundExchange', purpose: 'Digital performance (master)', check: 'Artist/ISRC lookup', url: 'https://www.soundexchange.com', search_term: 'USSM12200452', status: 'manual_required', why_manual: 'No public API', what_to_look_for: 'Registration status, payout account' },
      ],
    },
  },
  statute: {
    level: 'warning',
    label: 'Statute of Limitations Advisory',
    color: 'yellow',
    message: '17 U.S.C. § 507(b): Civil copyright claims must be filed within 3 years of discovery. Royalty claims dating to 2022 should be filed by 2025.',
    release_date: '2022-04-29',
    age_years: 3,
  },
  registry_links: [
    { name: 'MLC', org: 'Mechanical Licensing Collective', url: 'https://www.themlc.com', search_term: 'Wait for U Future', note: 'Search by title or ISRC for mechanical royalties' },
    { name: 'ASCAP', org: 'ASCAP', url: 'https://www.ascap.com/repertory', search_term: 'Wait for U', note: 'Performance royalty registry' },
    { name: 'BMI', org: 'BMI', url: 'https://repertoire.bmi.com', search_term: 'Wait for U Future', note: 'Performance royalty registry' },
    { name: 'SoundExchange', org: 'SoundExchange', url: 'https://www.soundexchange.com', search_term: 'USSM12200452', note: 'Digital performance royalties (master)' },
  ],
  verdict: {
    level: 'critical',
    color: 'red',
    summary: 'Multiple gaps detected — est. $159,000–$215,000 in unclaimed royalties. Immediate action required to register ISWC and complete writer IPI coverage.',
  },
  _demo: true,
};

export const DEMO_SPLITS = [
  { id: '1', name: 'Nayvadius Wilburn (Future)', role: 'Composer/Performer', percentage: 33.33, ipi: '00736428519', pro: 'ASCAP' },
  { id: '2', name: 'Aubrey Graham (Drake)', role: 'Composer/Performer', percentage: 33.33, ipi: '', pro: 'SOCAN' },
  { id: '3', name: 'Temilade Openiyi (Tems)', role: 'Lyricist/Performer', percentage: 16.67, ipi: '00987654321', pro: 'ASCAP' },
  { id: '4', name: 'Roderick Raheem Harvey', role: 'Composer', percentage: 16.67, ipi: '', pro: '' },
];
