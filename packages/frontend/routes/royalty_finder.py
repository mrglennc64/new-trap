from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class RoyaltyFinderRequest(BaseModel):
    title: str
    artist: str
    isrc: str | None = None
    year: str | None = None

@router.post("/catalog/royalty-finder")
async def royalty_finder(req: RoyaltyFinderRequest):
    # Placeholder logic — replace with real PRO/Publishing lookups later
    return {
        "publishing": [],
        "pro": [],
        "neighboring": [],
        "missing": [
            {"reason": "No publishing registration found"},
            {"reason": "No PRO match found"},
        ],
    }
