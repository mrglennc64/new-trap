from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Split
from app.schemas import SplitCreate, SplitRead

router = APIRouter()


@router.post("/", response_model=SplitRead, status_code=status.HTTP_201_CREATED)
async def create_split(payload: SplitCreate, db: AsyncSession = Depends(get_db)):
    split = Split(
        track_id=payload.track_id,
        contributor=payload.contributor,
        role=payload.role,
        percentage=payload.percentage,
        share=payload.share,
    )
    db.add(split)
    await db.commit()
    await db.refresh(split)
    return split


@router.get("/", response_model=List[SplitRead])
async def list_splits(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Split))
    return result.scalars().all()
