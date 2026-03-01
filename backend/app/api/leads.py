from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Lead
from app.schemas import LeadCreate, LeadRead

router = APIRouter()


@router.post("/", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
async def create_lead(payload: LeadCreate, db: AsyncSession = Depends(get_db)):
    lead = Lead(
        email=payload.email,
        name=payload.name,
        search_type=payload.search_type,
        query=payload.query,
        results_found=payload.results_found,
        status=payload.status,
        user_id=payload.user_id,
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.get("/", response_model=List[LeadRead])
async def list_leads(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead))
    return result.scalars().all()
