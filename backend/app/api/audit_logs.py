from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import AuditLog
from app.schemas import AuditLogCreate, AuditLogRead

router = APIRouter()


@router.post("/", response_model=AuditLogRead, status_code=status.HTTP_201_CREATED)
async def create_audit_log(payload: AuditLogCreate, db: AsyncSession = Depends(get_db)):
    log = AuditLog(
        user_id=payload.user_id,
        action=payload.action,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        changes=payload.changes,
        metadata=payload.metadata,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/", response_model=List[AuditLogRead])
async def list_audit_logs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditLog))
    return result.scalars().all()
