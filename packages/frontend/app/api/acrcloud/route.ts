import { NextResponse } from 'next/server';

const ACR_BASE = 'https://eu-api-v2.acrcloud.com/api/external-metadata/tracks';

// Normalised shape returned to callers
export interface ACRTrack {
  name: string;
  isrc: string | null;
  artists: string[];
  album: {
    title: string | null;
    label: string | null;
    upc: string | null;
    release_date: string | null;
    cover: string | null;
  };
  duration_ms: number | null;
  release_date: string | null;
  genres: string[];
  // Works = ISWC + contributors (writers/publishers with IPI)
  works: {
    iswc: string;
    name: string;
    contributors: {
      name: string;
      ipi: number | null;
      roles: string[];
    }[];
  }[];
  // Platform links
  platforms: {
    spotify?: string;
    applemusic?: string;
    youtube?: string;
    deezer?: string;
    tidal?: string;
  };
}

function normalise(raw: any): ACRTrack {
  const ext = raw.external_metadata ?? {};
  return {
    name:         raw.name ?? null,
    isrc:         raw.isrc ?? null,
    artists:      (raw.artists ?? []).map((a: any) => a.name).filter(Boolean),
    album: {
      title:        raw.album?.title ?? null,
      label:        raw.album?.label ?? null,
      upc:          raw.album?.upc ?? null,
      release_date: raw.album?.release_date ?? null,
      cover:        raw.album?.covers?.medium ?? raw.album?.cover ?? null,
    },
    duration_ms:  raw.duration_ms ?? null,
    release_date: raw.release_date ?? null,
    genres:       raw.genres ?? [],
    works: (raw.works ?? []).map((w: any) => ({
      iswc: w.iswc ?? '',
      name: w.name ?? '',
      contributors: (w.contributors ?? []).map((c: any) => ({
        name:  c.name ?? '',
        ipi:   c.ipi  ?? null,
        roles: c.roles ?? [],
      })),
    })),
    platforms: {
      spotify:    ext.spotify?.[0]?.link    ?? undefined,
      applemusic: ext.applemusic?.[0]?.link ?? undefined,
      youtube:    ext.youtube?.[0]?.link    ?? undefined,
      deezer:     ext.deezer?.[0]?.link     ?? undefined,
      tidal:      ext.tidal?.[0]?.link      ?? undefined,
    },
  };
}

export async function GET(req: Request) {
  const token = process.env.ACRCLOUD_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'ACRCLOUD_TOKEN not configured — add it to .env' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const isrc        = searchParams.get('isrc');
  const query       = searchParams.get('query');
  const source_url  = searchParams.get('source_url');
  const acr_id      = searchParams.get('acr_id');
  const platforms   = searchParams.get('platforms') ?? 'spotify,deezer,youtube,applemusic';
  const includeWorks = searchParams.get('include_works') ?? '1';  // default: always fetch works

  if (!isrc && !query && !source_url && !acr_id) {
    return NextResponse.json(
      { error: 'Provide at least one of: isrc, query, source_url, acr_id' },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({ platforms, include_works: includeWorks });
  if (isrc)       params.set('isrc',       isrc);
  if (query)      params.set('query',      query);
  if (source_url) params.set('source_url', source_url);
  if (acr_id)     params.set('acr_id',     acr_id);

  // format: if query looks like JSON, tell ACRCloud
  if (query?.trim().startsWith('{')) params.set('format', 'json');

  try {
    const res = await fetch(`${ACR_BASE}?${params.toString()}`, {
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // 10s timeout
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `ACRCloud error ${res.status}`, detail: text },
        { status: res.status }
      );
    }

    const json = await res.json();
    const tracks: ACRTrack[] = (json.data ?? []).map(normalise);

    return NextResponse.json({ tracks, count: tracks.length });

  } catch (err: any) {
    return NextResponse.json(
      { error: 'ACRCloud request failed', detail: String(err) },
      { status: 500 }
    );
  }
}

// POST variant — accepts JSON body for more complex queries
export async function POST(req: Request) {
  const token = process.env.ACRCLOUD_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'ACRCLOUD_TOKEN not configured' },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const {
    isrc, query, source_url, acr_id,
    platforms = 'spotify,deezer,youtube,applemusic',
    include_works = 1,
  } = body;

  if (!isrc && !query && !source_url && !acr_id) {
    return NextResponse.json(
      { error: 'Provide at least one of: isrc, query, source_url, acr_id' },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    platforms,
    include_works: String(include_works),
  });

  if (isrc)       params.set('isrc',       isrc);
  if (source_url) params.set('source_url', source_url);
  if (acr_id)     params.set('acr_id',     acr_id);
  if (query) {
    const q = typeof query === 'object' ? JSON.stringify(query) : query;
    params.set('query', q);
    if (typeof query === 'object') params.set('format', 'json');
  }

  try {
    const res = await fetch(`${ACR_BASE}?${params.toString()}`, {
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `ACRCloud error ${res.status}`, detail: await res.text() },
        { status: res.status }
      );
    }

    const json = await res.json();
    const tracks: ACRTrack[] = (json.data ?? []).map(normalise);
    return NextResponse.json({ tracks, count: tracks.length });

  } catch (err: any) {
    return NextResponse.json(
      { error: 'ACRCloud request failed', detail: String(err) },
      { status: 500 }
    );
  }
}
