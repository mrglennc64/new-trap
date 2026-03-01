import httpx
from typing import List

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.ascap.com/repertory",
    "Origin": "https://www.ascap.com",
}

async def lookup_ascap(title: str, artist: str) -> List[dict]:
    """Search ASCAP repertory for publishing info."""
    try:
        url = "https://www.ascap.com/repertory/api/v1/search"
        params = {
            "searchStr": f"{title} {artist}",
            "searchType": "ALL",
            "start": 0,
            "rows": 5,
        }
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            response = await client.get(url, params=params, headers=HEADERS)
            if response.status_code != 200:
                print(f"ASCAP status: {response.status_code}")
                return []
            data = response.json()

        results = []
        works = data.get("results", {}).get("works", [])
        for work in works:
            publishers = work.get("publishers", [])
            writers = work.get("writers", [])
            for pub in publishers:
                results.append({
                    "publisher": pub.get("name", "Unknown Publisher"),
                    "ipi": pub.get("ipiNumber"),
                    "role": pub.get("role"),
                    "title": work.get("title"),
                    "source": "ASCAP"
                })
            for writer in writers:
                results.append({
                    "publisher": f"{writer.get('firstName', '')} {writer.get('lastName', '')}".strip(),
                    "ipi": writer.get("ipiNumber"),
                    "role": "Writer",
                    "title": work.get("title"),
                    "source": "ASCAP"
                })
        return results

    except Exception as e:
        print(f"ASCAP error: {e}")
        return []
