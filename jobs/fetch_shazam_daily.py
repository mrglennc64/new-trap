#!/usr/bin/env python
"""
Daily Shazam data fetch job
Fetches Shazam charts and stores in database
"""

import asyncio
import aiohttp
from datetime import datetime, date, timedelta
import asyncpg
import json
import os
from typing import Dict, List, Optional

# Database configuration
DB_CONFIG = {
    'user': 'postgres',
    'password': 'Hollywood2026',
    'database': 'royalty_audit',
    'host': 'localhost',
    'port': 5432
}

class ShazamFetcher:
    def __init__(self):
        self.pool = None
        self.session = None
        
    async def connect_db(self):
        """Create database connection pool"""
        self.pool = await asyncpg.create_pool(**DB_CONFIG)
        print(f"✅ Connected to database at {datetime.now()}")
        
    async def close_db(self):
        """Close database connection"""
        if self.pool:
            await self.pool.close()
            print("✅ Database connection closed")
            
    async def init_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            
    async def fetch_us_top_200(self):
        """Fetch US Top 200 Shazam chart"""
        try:
            # Using a public Shazam API endpoint
            url = "https://shazam.p.rapidapi.com/charts/track"
            headers = {
                "X-RapidAPI-Key": "YOUR_API_KEY",  # You'll need to get a key
                "X-RapidAPI-Host": "shazam.p.rapidapi.com"
            }
            params = {
                "locale": "en-US",
                "pageSize": 200,
                "startFrom": 0
            }
            
            # For now, let's create mock data for testing
            # In production, replace with actual API call
            mock_tracks = self.generate_mock_data()
            return mock_tracks
            
        except Exception as e:
            print(f"❌ Error fetching Shazam data: {e}")
            return []
            
    def generate_mock_data(self):
        """Generate mock Shazam data for testing"""
        tracks = []
        today = date.today()
        
        # Mock track data
        mock_titles = [
            "Not Like Us", "Like That", "Family Matters", 
            "Meet The Grahams", "Euphoria", "6:16 in LA",
            "Push Ups", "Taylor Made Freestyle", "The Heart Part 6"
        ]
        
        mock_artists = [
            "Kendrick Lamar", "Future, Metro Boomin", "Kendrick Lamar",
            "Kendrick Lamar", "Drake", "Drake",
            "Drake", "Drake", "Drake"
        ]
        
        mock_isrcs = [
            "USUM72412345", "USUM72412346", "USUM72412347",
            "USUM72412348", "USUM72412349", "USUM72412350",
            "USUM72412351", "USUM72412352", "USUM72412353"
        ]
        
        for i in range(min(len(mock_titles), 9)):
            tracks.append({
                "shazam_id": f"shazam_{i+1}",
                "title": mock_titles[i],
                "artist": mock_artists[i],
                "isrc": mock_isrcs[i],
                "rank": i + 1,
                "count": 10000 - (i * 1000)  # Decreasing counts
            })
            
        return tracks
    
    async def store_track(self, track_data: Dict):
        """Store or update a Shazam track"""
        async with self.pool.acquire() as conn:
            # Check if track exists
            existing = await conn.fetchrow(
                "SELECT id FROM shazam_tracks WHERE shazam_id = $1",
                track_data["shazam_id"]
            )
            
            if existing:
                # Update existing
                await conn.execute("""
                    UPDATE shazam_tracks 
                    SET title = $1, artist = $2, isrc = $3, updated_at = NOW()
                    WHERE shazam_id = $4
                """, track_data["title"], track_data["artist"], 
                    track_data["isrc"], track_data["shazam_id"])
                print(f"🔄 Updated track: {track_data['title']}")
            else:
                # Insert new
                await conn.execute("""
                    INSERT INTO shazam_tracks (shazam_id, title, artist, isrc)
                    VALUES ($1, $2, $3, $4)
                """, track_data["shazam_id"], track_data["title"], 
                    track_data["artist"], track_data["isrc"])
                print(f"✅ Added new track: {track_data['title']}")
    
    async def store_daily_count(self, shazam_id: str, count: int, rank: int, region: str = "US"):
        """Store daily Shazam count"""
        today = date.today()
        
        async with self.pool.acquire() as conn:
            # Insert daily count
            await conn.execute("""
                INSERT INTO shazam_daily (shazam_id, date, count, rank, region)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (shazam_id, date, region) 
                DO UPDATE SET count = EXCLUDED.count, rank = EXCLUDED.rank
            """, shazam_id, today, count, rank, region)
            
            # Check for spikes (compare with yesterday)
            yesterday = await conn.fetchrow("""
                SELECT count FROM shazam_daily 
                WHERE shazam_id = $1 AND date = $2 AND region = $3
            """, shazam_id, today - timedelta(days=1), region)
            
            if yesterday and yesterday["count"] > 0:
                spike_factor = count / yesterday["count"]
                if spike_factor >= 5:  # 5x increase = spike
                    # Get average of last 7 days (excluding today)
                    week_avg = await conn.fetchval("""
                        SELECT AVG(count) 
                        FROM shazam_daily 
                        WHERE shazam_id = $1 
                          AND date >= $2 
                          AND date < $3
                          AND region = $4
                    """, shazam_id, today - timedelta(days=7), today, region)
                    
                    await conn.execute("""
                        INSERT INTO shazam_spikes (shazam_id, spike_date, previous_avg, current_count, spike_factor)
                        VALUES ($1, $2, $3, $4, $5)
                    """, shazam_id, today, week_avg or yesterday["count"], count, spike_factor)
                    
                    print(f"🚨 SPIKE DETECTED! {shazam_id}: {spike_factor}x increase")
    
    async def run_daily_fetch(self):
        """Main function to run daily Shazam fetch"""
        print("\n" + "="*50)
        print(f"🚀 Starting Shazam daily fetch at {datetime.now()}")
        print("="*50)
        
        try:
            # Connect to database
            await self.connect_db()
            
            # Fetch US top tracks
            print("\n📊 Fetching US Top 200 Shazam chart...")
            tracks = await self.fetch_us_top_200()
            print(f"✅ Fetched {len(tracks)} tracks")
            
            # Store each track and its count
            print("\n💾 Storing tracks and counts...")
            for track in tracks:
                await self.store_track(track)
                await self.store_daily_count(
                    track["shazam_id"], 
                    track["count"], 
                    track["rank"],
                    "US"
                )
            
            print("\n" + "="*50)
            print(f"✅ Shazam daily fetch completed at {datetime.now()}")
            print(f"📊 Processed {len(tracks)} tracks")
            print("="*50)
            
        except Exception as e:
            print(f"\n❌ Error in daily fetch: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await self.close_db()
            await self.close_session()

async def main():
    """Main entry point"""
    fetcher = ShazamFetcher()
    await fetcher.init_session()
    await fetcher.run_daily_fetch()

if __name__ == "__main__":
    asyncio.run(main())
