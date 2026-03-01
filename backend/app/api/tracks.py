from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Track
from app.schemas import TrackCreate, TrackRead

router = APIRouter()


@router.post("/", response_model=TrackRead, status_code=status.HTTP_201_CREATED)
async def create_track(payload: TrackCreate, db: AsyncSession = Depends(get_db)):
    track = Track(
        title=payload.title,
        artist=payload.artist,
        artists=payload.artists,
        producers=payload.producers,
        writers=payload.writers,
        isrc=payload.isrc,
        iswc=payload.iswc,
        label=payload.label,
        release_date=payload.release_date,
        user_id=payload.user_id,
        account_id=payload.account_id,
    )
    db.add(track)
    await db.commit()
    await db.refresh(track)
    return track


@router.get("/", response_model=List[TrackRead])
async def list_tracks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Track))
    return result.scalars().all()


@router.get("/{track_id}", response_model=TrackRead)
async def get_track(track_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return track
