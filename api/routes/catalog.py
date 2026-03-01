from fastapi import APIRouter
from api.services.musicbrainz import lookup_isrc_musicbrainz
from api.services.discogs import lookup_isrc_discogs

router = APIRouter(prefix="/catalog")

@router.get("/audit")
def audit_status():
    return {"status": "audit endpoint online"}

@router.get("/isrc/{isrc}")
async def isrc_lookup(isrc: str):
    mb = await lookup_isrc_musicbrainz(isrc)
    if mb:
        return mb

    dc = await lookup_isrc_discogs(isrc)
    if dc:
        return dc

    return {"error": "ISRC not found"}
