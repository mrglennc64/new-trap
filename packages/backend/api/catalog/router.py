from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import musicbrainzngs as mb
from collections import Counter

router = APIRouter()

# -----------------------------------
# MusicBrainz Setup
# -----------------------------------
mb.set_useragent(
    "TrapRoyaltiesPro",
    "1.0",
    "youremail@example.com"
)

# -----------------------------------
# Pydantic Models
# -----------------------------------
class CatalogAuditRequest(BaseModel):
    artist_name: str


class MBTrackResult(BaseModel):
    title: str
    artist: str
    isrc: Optional[str]
    release: Optional[str]
    flags: List[str]


class MBAuditResponse(BaseModel):
    artist_name: str
    mb_artist_id: Optional[str]
    tracks: List[MBTrackResult]
    debug: dict


# -----------------------------------
# MusicBrainz Helper
# -----------------------------------
def extract_mb_tracks(artist_id: str) -> List[MBTrackResult]:
    recordings = mb.browse_recordings(
        artist=artist_id,
        includes=["isrcs"],
        limit=200,
    )

    out: List[MBTrackResult] = []

    for rec in recordings.get("recording-list", []):
        title = rec.get("title")
        rec_id = rec.get("id")

        # ISRC
        isrcs = rec.get("isrc-list", [])
        isrc = isrcs[0] if isrcs else None

        # Artist credit
        artists = rec.get("artist-credit", [])
        artist_name = artists[0]["name"] if artists else ""

        # Release enrichment
        release_title = None
        try:
            full = mb.get_recording_by_id(rec_id, includes=["releases"])
            releases = full["recording"].get("release-list", [])
            if releases:
                release_title = releases[0].get("title")
        except Exception:
            pass

        # Flags
        flags = []
        if isrc is None:
            flags.append("missing_isrc")
        if release_title is None:
            flags.append("missing_release")

        out.append(
            MBTrackResult(
                title=title,
                artist=artist_name,
                isrc=isrc,
                release=release_title,
                flags=flags,
            )
        )

    # Duplicate ISRC detection
    isrc_counts = Counter(t.isrc for t in out if t.isrc)
    for t in out:
        if t.isrc and isrc_counts[t.isrc] > 1:
            t.flags.append("duplicate_isrc")

    return out


# -----------------------------------
# MusicBrainz Audit Endpoint
# -----------------------------------
@router.post("/catalog/audit-mb", response_model=MBAuditResponse)
async def catalog_audit_mb(payload: CatalogAuditRequest):
    debug = {"steps": [], "raw": {}}

    # Search for artist
    debug["steps"].append("mb_search_artist")
    result = mb.search_artists(artist=payload.artist_name)
    debug["raw"]["artist_search"] = result

    artists = result.get("artist-list", [])
    if not artists:
        return MBAuditResponse(
            artist_name=payload.artist_name,
            mb_artist_id=None,
            tracks=[],
            debug=debug,
        )

    mb_artist = artists[0]
    artist_id = mb_artist["id"]

    # Fetch recordings
    debug["steps"].append("mb_browse_recordings")
    tracks = extract_mb_tracks(artist_id)
    debug["raw"]["recording_count"] = len(tracks)

    return MBAuditResponse(
        artist_name=payload.artist_name,
        mb_artist_id=artist_id,
        tracks=tracks,
        debug=debug,
    )
