from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict

class SplitParticipant(BaseModel):
    """Individual participant in a split"""
    name: str
    role: str  # 'artist', 'producer', 'writer', 'label'
    email: str
    percentage: float
    ipi: Optional[str] = None  # International Performer ID
    is_verified: bool = False

class SplitAgreement(BaseModel):
    """Split agreement for a track"""
    track_id: str
    track_title: str
    track_artist: str
    participants: List[SplitParticipant]
    total_percentage: float  # Should always be 100
    created_at: datetime
    updated_at: datetime
    created_by: str  # User ID who created the split
    status: str  # 'draft', 'pending', 'verified', 'disputed'
    verification_hash: Optional[str] = None  # SHA-256 of agreement for tamper-proofing
    
class SplitVerificationRequest(BaseModel):
    """Request to verify a split"""
    track_id: str
    participant_email: str
    verification_code: str
    
class SplitVerificationResponse(BaseModel):
    """Response after split verification"""
    track_id: str
    track_title: str
    participant_name: str
    participant_role: str
    percentage: float
    is_verified: bool
    verified_at: Optional[datetime]
    agreement_hash: str
    digital_handshake: Dict  # Link to Digital Handshake verification
