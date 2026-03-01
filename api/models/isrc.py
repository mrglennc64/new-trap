from pydantic import BaseModel

class ISRCMetadata(BaseModel):
    isrc: str
    title: str | None = None
    artist: str | None = None
    release_date: str | None = None
    source: str
