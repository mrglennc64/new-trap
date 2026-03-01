from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Earning
from app.schemas import EarningCreate, EarningRead

router = APIRouter()


@router.post("/", response_model=EarningRead, status_code=status.HTTP_201_CREATED)
async def create_earning(payload: EarningCreate, db: AsyncSession = Depends(get_db)):
    earning = Earning(
        track_id=payload.track_id,
        source=payload.source,
        amount=payload.amount,
        currency=payload.currency,
        period=payload.period,
        plays=payload.plays,
        status=payload.status,
        matched_at=payload.matched_at,
    )
    db.add(earning)
    await db.commit()
    await db.refresh(earning)
    return earning


@router.get("/", response_model=List[EarningRead])
async def list_earnings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Earning))
    return result.scalars().all()
