import httpx
from typing import List

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://repertoire.bmi.com",
    "Origin": "https://repertoire.bmi.com",
}

async def lookup_bmi(title: str, artist: str) -> List[dict]:
    """Search BMI repertoire for PRO info."""
    try:
        url = "https://repertoire.bmi.com/api/search"
        params = {
            "title": title,
            "artist": artist,
            "page": 1,
            "per_page": 5,
        }
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            response = await client.get(url, params=params, headers=HEADERS)
            if response.status_code != 200:
                print(f"BMI status: {response.status_code}")
                return []
            data = response.json()

        results = []
        works = data.get("works", data.get("results", []))
        for work in works:
            writers = work.get("writers", [])
            for writer in writers:
                results.append({
                    "writer": f"{writer.get('firstName', '')} {writer.get('lastName', '')}".strip(),
                    "ipi": writer.get("ipi"),
                    "pro": "BMI",
                    "title": work.get("title"),
                    "source": "BMI"
                })
            # If no writers, add the work itself
            if not writers:
                results.append({
                    "writer": work.get("writer", artist),
                    "ipi": None,
                    "pro": "BMI",
                    "title": work.get("title", title),
                    "source": "BMI"
                })
        return results

    except Exception as e:
        print(f"BMI error: {e}")
        return []
