from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from api.services.musicbrainz import search_artist_musicbrainz
from api.services.discogs import search_artist_discogs
from api.services.ascap_stub import lookup_ascap
from api.services.bmi_stub import lookup_bmi

router = APIRouter()

class RoyaltyFinderRequest(BaseModel):
    title: str
    artist: str
    isrc: Optional[str] = None
    year: Optional[str] = None

@router.post("/catalog/royalty-finder")
async def royalty_finder(req: RoyaltyFinderRequest):
    publishing = []
    pro = []
    neighboring = []
    missing = []

    # MusicBrainz lookup
    mb_results = await search_artist_musicbrainz(req.artist, req.title)
    if mb_results:
        for r in mb_results:
            neighboring.append({
                "performer": r.get("artist", req.artist),
                "isrc": r.get("isrc"),
                "all_isrcs": r.get("all_isrcs", []),
                "source": "MusicBrainz",
                "title": r.get("title"),
                "release_date": r.get("release_date"),
                "label": r.get("label"),
            })

    # Discogs lookup
    discogs_results = await search_artist_discogs(req.artist, req.title)
    if discogs_results:
        for r in discogs_results:
            if not any(n.get("title") == r.get("title") for n in neighboring):
                neighboring.append({
                    "performer": req.artist,
                    "isrc": r.get("isrc"),
                    "source": "Discogs",
                    "title": r.get("title"),
                    "release_date": r.get("release_date"),
                    "label": r.get("label"),
                })

    # ASCAP/BMI lookups
    publishing = await lookup_ascap(req.title, req.artist)
    pro = await lookup_bmi(req.title, req.artist)

    # Smart missing rights messages with direct links
    ascap_url = f"https://www.ascap.com/repertory#ace/search/workID/{req.title.replace(' ', '%20')}"
    bmi_url = f"https://repertoire.bmi.com/Search/Titles?SearchType=WorkTitle&SearchStr={req.title.replace(' ', '%20')}"
    soundexchange_url = "https://www.soundexchange.com/performer-copyright-owner/claim-royalties/"

    if not publishing:
        missing.append({
            "reason": f"No ASCAP publishing registration found for '{req.title}'",
            "action": "Verify directly on ASCAP",
            "link": ascap_url,
            "type": "ascap"
        })

    if not pro:
        missing.append({
            "reason": f"No BMI PRO registration found for '{req.title}'",
            "action": "Verify directly on BMI",
            "link": bmi_url,
            "type": "bmi"
        })

    if not any(n.get("isrc") for n in neighboring):
        missing.append({
            "reason": f"No ISRC found for '{req.title}' - you may have unclaimed neighboring rights",
            "action": "Claim SoundExchange royalties",
            "link": soundexchange_url,
            "type": "soundexchange"
        })

    return {
        "publishing": publishing,
        "pro": pro,
        "neighboring": neighboring,
        "missing": missing,
        "search": {
            "title": req.title,
            "artist": req.artist,
            "ascap_link": ascap_url,
            "bmi_link": bmi_url,
        }
    }
