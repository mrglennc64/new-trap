from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import hashlib
import boto3
import os
from datetime import datetime
from botocore.config import Config
import uuid
import logging
from typing import Optional

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize IDrive e2 clients
s3 = boto3.client(
    's3',
    endpoint_url=os.getenv('IDRIVE_ENDPOINT', 'https://s3.eu-central-2.idrivee2.com'),
    aws_access_key_id=os.getenv('IDRIVE_KEY'),
    aws_secret_access_key=os.getenv('IDRIVE_SECRET'),
    config=Config(signature_version='s3v4')
)

PRIVATE_BUCKET = os.getenv('IDRIVE_PRIVATE_BUCKET', 'traproyalties-private')
PUBLIC_BUCKET = os.getenv('IDRIVE_PUBLIC_BUCKET', 'traproyalties-public')

@router.post("/api/catalog/upload")
async def upload_mp3(
    file: UploadFile = File(...),
    artist: str = Form(...),
    title: str = Form(...),
    isrc: Optional[str] = Form(None)
):
    """
    Upload MP3 file to IDrive e2
    - Stores original in private bucket with hash
    - Creates preview in public bucket for streaming
    """
    try:
        logger.info(f"Received upload request: {file.filename}")
        
        # Validate file type
        if not file.filename.endswith('.mp3'):
            raise HTTPException(400, "Only MP3 files are allowed")
        
        # Read file content
        content = await file.read()
        
        # Generate SHA-256 hash for legal verification
        file_hash = hashlib.sha256(content).hexdigest()
        
        # Generate unique track ID
        track_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        # Upload original to PRIVATE bucket (legal evidence)
        private_key = f"originals/{track_id}/{file.filename}"
        
        metadata = {
            'hash': file_hash,
            'artist': artist,
            'title': title,
            'isrc': isrc or '',
            'upload_timestamp': timestamp,
            'original_filename': file.filename
        }
        
        logger.info(f"Uploading original to private bucket: {private_key}")
        
        s3.put_object(
            Bucket=PRIVATE_BUCKET,
            Key=private_key,
            Body=content,
            Metadata=metadata,
            ContentType='audio/mpeg'
        )
        
        # Upload same file to PUBLIC bucket for preview
        public_key = f"previews/{track_id}/preview.mp3"
        
        logger.info(f"Uploading preview to public bucket: {public_key}")
        
        s3.put_object(
            Bucket=PUBLIC_BUCKET,
            Key=public_key,
            Body=content,
            ContentType='audio/mpeg',
            Metadata={
                'track_id': track_id,
                'original_hash': file_hash
            }
        )
        
        # Generate public URL for streaming (valid for 1 hour)
        public_url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': PUBLIC_BUCKET,
                'Key': public_key
            },
            ExpiresIn=3600
        )
        
        logger.info(f"Upload successful for track {track_id}")
        
        return {
            "status": "success",
            "track_id": track_id,
            "artist": artist,
            "title": title,
            "isrc": isrc,
            "hash": file_hash,
            "public_url": public_url,
            "message": "MP3 uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(500, f"Upload failed: {str(e)}")

@router.get("/api/catalog/tracks")
async def list_tracks():
    """
    List all tracks from public bucket previews
    """
    try:
        response = s3.list_objects_v2(
            Bucket=PUBLIC_BUCKET,
            Prefix="previews/",
            MaxKeys=100
        )
        
        tracks = []
        if 'Contents' in response:
            for obj in response['Contents']:
                parts = obj['Key'].split('/')
                if len(parts) >= 2:
                    track_id = parts[1]
                    
                    try:
                        private_key = f"originals/{track_id}/"
                        private_objs = s3.list_objects_v2(
                            Bucket=PRIVATE_BUCKET,
                            Prefix=private_key,
                            MaxKeys=1
                        )
                        
                        if 'Contents' in private_objs:
                            metadata = s3.head_object(
                                Bucket=PRIVATE_BUCKET,
                                Key=private_objs['Contents'][0]['Key']
                            )['Metadata']
                        else:
                            metadata = {}
                    except:
                        metadata = {}
                    
                    url = s3.generate_presigned_url(
                        'get_object',
                        Params={
                            'Bucket': PUBLIC_BUCKET,
                            'Key': obj['Key']
                        },
                        ExpiresIn=3600
                    )
                    
                    tracks.append({
                        "id": track_id,
                        "artist": metadata.get('artist', 'Unknown'),
                        "title": metadata.get('title', 'Unknown'),
                        "isrc": metadata.get('isrc', ''),
                        "hash": metadata.get('hash', ''),
                        "public_url": url,
                        "uploaded": metadata.get('upload_timestamp', '')
                    })
        
        return {"tracks": tracks}
        
    except Exception as e:
        logger.error(f"Failed to list tracks: {str(e)}")
        raise HTTPException(500, f"Failed to list tracks: {str(e)}")
