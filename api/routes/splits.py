from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
import hashlib
import json
import uuid
from datetime import datetime, timedelta
import random
import string

from ..models.split import (
    SplitAgreement, 
    SplitParticipant, 
    SplitVerificationRequest,
    SplitVerificationResponse
)

router = APIRouter(prefix="/api/splits", tags=["splits"])

# In-memory storage (replace with database in production)
split_agreements = {}
verification_codes = {}
verified_splits = {}

def generate_verification_code(length=6):
    """Generate a numeric verification code"""
    return ''.join(random.choices(string.digits, k=length))

def hash_agreement(agreement: SplitAgreement) -> str:
    """Create SHA-256 hash of agreement for tamper-proofing"""
    agreement_dict = agreement.dict()
    # Remove dynamic fields before hashing
    agreement_dict.pop('created_at', None)
    agreement_dict.pop('updated_at', None)
    agreement_dict.pop('verification_hash', None)
    
    agreement_str = json.dumps(agreement_dict, sort_keys=True)
    return hashlib.sha256(agreement_str.encode()).hexdigest()

@router.post("/create", response_model=dict)
async def create_split_agreement(agreement: SplitAgreement):
    """
    Create a new split agreement for a track.
    Links to Digital Handshake for track verification.
    """
    # Validate total percentage = 100
    total = sum(p.percentage for p in agreement.participants)
    if abs(total - 100.0) > 0.01:  # Allow small floating point error
        raise HTTPException(400, f"Split percentages must total 100%, got {total}%")
    
    # Generate agreement ID
    agreement_id = str(uuid.uuid4())
    agreement.created_at = datetime.utcnow()
    agreement.updated_at = datetime.utcnow()
    agreement.status = 'draft'
    
    # Hash the agreement for tamper-proofing
    agreement.verification_hash = hash_agreement(agreement)
    
    # Store agreement
    split_agreements[agreement_id] = agreement
    
    # Generate verification codes for each participant
    codes = {}
    for participant in agreement.participants:
        code = generate_verification_code()
        verification_codes[code] = {
            'agreement_id': agreement_id,
            'participant_email': participant.email,
            'expires_at': datetime.utcnow() + timedelta(days=7)
        }
        codes[participant.email] = code
    
    return {
        "agreement_id": agreement_id,
        "track_id": agreement.track_id,
        "status": "draft",
        "verification_codes": codes,  # In production, email these instead of returning
        "message": "Split agreement created. Share verification codes with participants."
    }

@router.post("/verify", response_model=SplitVerificationResponse)
async def verify_split(request: SplitVerificationRequest):
    """
    Verify a participant's split agreement.
    This is the "Pre-Release Split Verification" handshake.
    """
    # Check verification code
    if request.verification_code not in verification_codes:
        raise HTTPException(404, "Invalid verification code")
    
    code_data = verification_codes[request.verification_code]
    
    # Check expiry
    if code_data['expires_at'] < datetime.utcnow():
        raise HTTPException(410, "Verification code has expired")
    
    # Check email match
    if code_data['participant_email'] != request.participant_email:
        raise HTTPException(403, "Email does not match verification code")
    
    # Get agreement
    agreement_id = code_data['agreement_id']
    agreement = split_agreements.get(agreement_id)
    if not agreement:
        raise HTTPException(404, "Agreement not found")
    
    # Verify agreement hasn't been tampered with
    current_hash = hash_agreement(agreement)
    if current_hash != agreement.verification_hash:
        agreement.status = 'disputed'
        raise HTTPException(409, "Agreement has been tampered with")
    
    # Find participant
    participant = next(
        (p for p in agreement.participants if p.email == request.participant_email),
        None
    )
    if not participant:
        raise HTTPException(404, "Participant not found in agreement")
    
    # Mark as verified
    participant.is_verified = True
    agreement.updated_at = datetime.utcnow()
    
    # Check if all participants verified
    all_verified = all(p.is_verified for p in agreement.participants)
    if all_verified:
        agreement.status = 'verified'
        # Store verified split
        verified_splits[agreement.track_id] = agreement
    
    # Clean up used code
    del verification_codes[request.verification_code]
    
    # Optional: Get Digital Handshake verification
    # digital_handshake = await get_digital_handshake(agreement.track_id)
    digital_handshake = {"verified": True, "message": "Track is authentic"}  # Placeholder
    
    return SplitVerificationResponse(
        track_id=agreement.track_id,
        track_title=agreement.track_title,
        participant_name=participant.name,
        participant_role=participant.role,
        percentage=participant.percentage,
        is_verified=True,
        verified_at=datetime.utcnow(),
        agreement_hash=agreement.verification_hash,
        digital_handshake=digital_handshake
    )

@router.get("/track/{track_id}", response_model=dict)
async def get_track_split_status(track_id: str):
    """
    Get split verification status for a track.
    Used by attorney portal and dashboard.
    """
    if track_id in verified_splits:
        agreement = verified_splits[track_id]
        return {
            "track_id": track_id,
            "track_title": agreement.track_title,
            "status": agreement.status,
            "participants": [
                {
                    "name": p.name,
                    "role": p.role,
                    "percentage": p.percentage,
                    "verified": p.is_verified
                }
                for p in agreement.participants
            ],
            "verified_at": agreement.updated_at,
            "agreement_hash": agreement.verification_hash
        }
    else:
        return {
            "track_id": track_id,
            "status": "not_found",
            "message": "No split agreement found for this track"
        }

@router.get("/verify-page/{track_id}")
async def get_verification_page_data(track_id: str):
    """
    Get data for the pre-release split verification page.
    This is what the frontend loads when a participant clicks the verification link.
    """
    # Find agreement by track_id
    agreement = None
    for aid, agg in split_agreements.items():
        if agg.track_id == track_id:
            agreement = agg
            break
    
    if not agreement:
        raise HTTPException(404, "No split agreement found for this track")
    
    # Don't return full agreement, just public info
    return {
        "track_id": agreement.track_id,
        "track_title": agreement.track_title,
        "track_artist": agreement.track_artist,
        "participant_count": len(agreement.participants),
        "verified_count": sum(1 for p in agreement.participants if p.is_verified),
        "status": agreement.status,
        "requires_verification": agreement.status != 'verified'
    }
