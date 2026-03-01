import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from enum import Enum
import csv
import io
import json
import hashlib
from dataclasses import dataclass
from decimal import Decimal

# Enums matching previous Prisma schema (now just internal enums)
class AuditStatus(str, Enum):
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class MatchType(str, Enum):
    EXACT = "EXACT"
    FUZZY = "FUZZY"
    MANUAL = "MANUAL"
    ISRC = "ISRC"
    TITLE_ARTIST = "TITLE_ARTIST"

class PRO(str, Enum):
    ASCAP = "ASCAP"
    BMI = "BMI"
    PRS = "PRS"
    SOCAN = "SOCAN"
    GEMA = "GEMA"
    SACEM = "SACEM"
    JASRAC = "JASRAC"
    APRA = "APRA"
    OTHER = "OTHER"

@dataclass
class RoyaltyRecord:
    """Represents a royalty record from external source"""
    isrc: Optional[str]
