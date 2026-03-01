from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Dict, List, Any
import random

router = APIRouter(prefix="/api/attorney", tags=["attorney"])

# Mock data - replace with actual database queries
@router.get("/dashboard-stats")
async def get_dashboard_stats() -> Dict:
    """Get real dashboard statistics for the attorney portal"""
    try:
        # TODO: Replace with actual database queries
        return {
            "active_cases": {
                "total": 15,
                "new_this_week": 3
            },
            "pending_verifications": {
                "total": 8,
                "awaiting_response": 5
            },
            "digital_handshakes": {
                "total": 32,
                "completed": 24
            },
            "revenue": {
                "total": "$1,850,000",
                "period": "This quarter"
            },
            "recent_activity": [
                {
                    "id": 1,
                    "action": "Digital Handshake Sent",
                    "track": "God's Plan",
                    "artist": "Drake",
                    "time": "2 hours ago"
                },
                {
                    "id": 2,
                    "action": "Split Verified",
                    "track": "SICKO MODE",
                    "artist": "Travis Scott",
                    "time": "5 hours ago"
                },
                {
                    "id": 3,
                    "action": "Court Report Generated",
                    "track": "Bad Guy",
                    "artist": "Billie Eilish",
                    "time": "1 day ago"
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/matters")
async def get_matters() -> List[Dict]:
    """Get matters for the attorney"""
    return [
        { "id": 1, "name": "RICO Cases", "count": 3, "icon": "⚖️" },
        { "id": 2, "name": "Active Litigation", "count": 7, "icon": "📋" },
        { "id": 3, "name": "Settlements", "count": 4, "icon": "💰" },
        { "id": 4, "name": "Royalty Disputes", "count": 12, "icon": "🎵" }
    ]

@router.get("/recent-activity")
async def get_recent_activity() -> List[Dict]:
    """Get recent activity"""
    return [
        {
            "id": 1,
            "action": "Digital Handshake Sent",
            "track": "God's Plan",
            "artist": "Drake",
            "time": "2 hours ago"
        },
        {
            "id": 2,
            "action": "Split Verified",
            "track": "SICKO MODE",
            "artist": "Travis Scott",
            "time": "5 hours ago"
        }
    ]
