import httpx
from typing import List, Optional

MUSICBRAINZ_BASE = "https://musicbrainz.org/ws/2"
HEADERS = {
    "User-Agent": "TrapRoyaltiesPro/1.0 (traproyaltiespro.com)"
}

async def search_artist_musicbrainz(artist: str, title: str) -> List[dict]:
    """Search MusicBrainz for recordings by artist and title."""
    try:
        query = f'recording:"{title}" AND artist:"{artist}"'
        url = f"{MUSICBRAINZ_BASE}/recording"
        params = {
            "query": query,
            "fmt": "json",
            "limit": 10,
            "inc": "isrcs artist-credits"
        }
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params, headers=HEADERS)
            response.raise_for_status()
            data = response.json()

        results = []
        for recording in data.get("recordings", []):
            isrcs = recording.get("isrcs", [])
            artist_credits = recording.get("artist-credit", [])
            artist_name = artist_credits[0]["name"] if artist_credits else artist

            # Get release info
            releases = recording.get("releases", [])
            release_date = recording.get("first-release-date")
            label = None
            if releases:
                release = releases[0]
                label_info = release.get("label-info", [])
                if label_info:
                    label_data = label_info[0].get("label")
                    if label_data:
                        label = label_data.get("name")

            results.append({
                "title": recording.get("title"),
                "artist": artist_name,
                "isrc": isrcs[0] if isrcs else None,
                "all_isrcs": isrcs,
                "release_date": release_date,
                "label": label,
                "source": "musicbrainz"
            })
        return results

    except Exception as e:
        print(f"MusicBrainz error: {e}")
        return []


async def lookup_isrc_musicbrainz(isrc: str) -> Optional[dict]:
    """Look up a specific ISRC on MusicBrainz."""
    try:
        url = f"{MUSICBRAINZ_BASE}/isrc/{isrc}"
        params = {
            "fmt": "json",
            "inc": "artist-credits releases"
        }
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params, headers=HEADERS)
            response.raise_for_status()
            data = response.json()

        recordings = data.get("recordings", [])
        if not recordings:
            return None

        rec = recordings[0]
        artist_credits = rec.get("artist-credit", [])
        artist_name = artist_credits[0]["name"] if artist_credits else "Unknown"

        return {
            "title": rec.get("title"),
            "artist": artist_name,
            "isrc": isrc,
            "release_date": rec.get("first-release-date"),
            "source": "musicbrainz"
        }

    except Exception as e:
        print(f"MusicBrainz ISRC error: {e}")
        return None
