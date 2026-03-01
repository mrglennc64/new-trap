import httpx
import os
from typing import List, Optional

DISCOGS_TOKEN = os.getenv("DISCOGS_TOKEN")
DISCOGS_BASE = "https://api.discogs.com"
HEADERS = {
    "User-Agent": "TrapRoyaltiesPro/1.0 (traproyaltiespro.com)",
}

async def search_artist_discogs(artist: str, title: str) -> List[dict]:
    """Search Discogs for releases by artist and title."""
    try:
        params = {
            "artist": artist,
            "track": title,
            "type": "release",
            "per_page": 5,
        }
        if DISCOGS_TOKEN:
            params["token"] = DISCOGS_TOKEN

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{DISCOGS_BASE}/database/search",
                params=params,
                headers=HEADERS
            )
            response.raise_for_status()
            data = response.json()

        results = []
        for item in data.get("results", []):
            title_raw = item.get("title", "")
            results.append({
                "title": title_raw,
                "artist": artist,
                "isrc": None,
                "release_date": str(item.get("year", "")),
                "label": item.get("label", [None])[0] if item.get("label") else None,
                "source": "discogs"
            })
        return results

    except Exception as e:
        print(f"Discogs error: {e}")
        return []


async def lookup_isrc_discogs(isrc: str) -> Optional[dict]:
    """Look up a specific ISRC on Discogs."""
    try:
        params = {
            "type": "release",
            "track_isrc": isrc,
        }
        if DISCOGS_TOKEN:
            params["token"] = DISCOGS_TOKEN

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{DISCOGS_BASE}/database/search",
                params=params,
                headers=HEADERS
            )
            response.raise_for_status()
            data = response.json()

        results = data.get("results", [])
        if not results:
            return None
        r = results[0]
        return {
            "title": r.get("title"),
            "artist": r.get("artist"),
            "isrc": isrc,
            "release_date": str(r.get("year", "")),
            "source": "discogs"
        }
    except Exception as e:
        print(f"Discogs ISRC error: {e}")
        return None
