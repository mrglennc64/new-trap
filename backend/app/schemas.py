import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, ConfigDict

from app.db.models import UserRole, AccountType, EarningStatus


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- User ----------

class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: UserRole = UserRole.ARTIST


class UserRead(ORMBase):
    id: uuid.UUID
    email: EmailStr
    name: Optional[str]
    role: UserRole
    created_at: datetime
    updated_at: datetime


# ---------- Account ----------

class AccountCreate(BaseModel):
    user_id: uuid.UUID
    type: AccountType
    provider: str
    account_id: str
    access_token: Optional[str] = None


class AccountRead(ORMBase):
    id: uuid.UUID
    user_id: uuid.UUID
    type: AccountType
    provider: str
    account_id: str
    access_token: Optional[str]
    last_synced: Optional[datetime]
    created_at: datetime
    updated_at: datetime


# ---------- Lead ----------

class LeadCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    search_type: Optional[str] = None
    query: Optional[str] = None
    results_found: Optional[int] = None
    status: Optional[str] = "new"
    user_id: Optional[uuid.UUID] = None


class LeadRead(ORMBase):
    id: uuid.UUID
    email: EmailStr
    name: Optional[str]
    search_type: Optional[str]
    query: Optional[str]
    results_found: Optional[int]
    status: str
    user_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime


# ---------- Track ----------

class TrackCreate(BaseModel):
    title: str
    artist: str
    artists: List[str] = []
    producers: List[str] = []
    writers: List[str] = []
    isrc: Optional[str] = None
    iswc: Optional[str] = None
    label: Optional[str] = None
    release_date: Optional[datetime] = None
    user_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None


class TrackRead(ORMBase):
    id: uuid.UUID
    title: str
    artist: str
    artists: List[str]
    producers: List[str]
    writers: List[str]
    isrc: Optional[str]
    iswc: Optional[str]
    label: Optional[str]
    release_date: Optional[datetime]
    user_id: Optional[uuid.UUID]
    account_id: Optional[uuid.UUID]


# ---------- Earning ----------

class EarningCreate(BaseModel):
    track_id: uuid.UUID
    source: str
    amount: float
    currency: str = "USD"
    period: str
    plays: Optional[int] = None
    status: EarningStatus = EarningStatus.UNMATCHED
    matched_at: Optional[datetime] = None


class EarningRead(ORMBase):
    id: uuid.UUID
    track_id: uuid.UUID
    source: str
    amount: float
    currency: str
    period: str
    plays: Optional[int]
    status: EarningStatus
    matched_at: Optional[datetime]
    created_at: datetime


# ---------- Split ----------

class SplitCreate(BaseModel):
    track_id: uuid.UUID
    contributor: str
    role: str
    percentage: float
    share: Optional[float] = None


class SplitRead(ORMBase):
    id: uuid.UUID
    track_id: uuid.UUID
    contributor: str
    role: str
    percentage: float
    share: Optional[float]
    created_at: datetime
    updated_at: datetime


# ---------- AuditLog ----------

class AuditLogCreate(BaseModel):
    user_id: Optional[uuid.UUID] = None
    action: str
    entity_type: str
    entity_id: str
    changes: Optional[dict] = None
    metadata: Optional[dict] = None


class AuditLogRead(ORMBase):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    action: str
    entity_type: str
    entity_id: str
    changes: Optional[dict]
    metadata: Optional[dict]
    created_at: datetime
