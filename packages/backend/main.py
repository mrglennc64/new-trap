from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="TrapRoyaltiesPro API")

# 1. Setup CORS (Allows your Next.js frontend to talk to this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Define Request Models
class Participant(BaseModel):
    name: str
    email: str
    percentage: float
    role: str

class HandshakeCreate(BaseModel):
    trackName: str
    email: str
    percentage: float

# 3. Create a Router with the /api prefix
# This solves the 404 errors you were seeing
api_router = APIRouter(prefix="/api")

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@api_router.post("/handshake/create")
async def create_handshake(data: HandshakeCreate):
    # Log the request logic here
    print(f"Creating handshake for {data.trackName}")
    return {
        "status": "success", 
        "message": f"Handshake sent to {data.email}",
        "data": data
    }

@api_router.get("/catalog/scan")
async def scan_catalog():
    # Simulated scan logic
    return {"status": "complete", "issues_found": 5, "leakage": "31%"}

# 4. Include the router in the app
app.include_router(api_router)

# This handles the root path /
@app.get("/")
async def root():
    return {"message": "TrapRoyaltiesPro Backend is Running"}

if __name__ == "__main__":
    import uvicorn
    # Port 8000 matches your PM2 logs
    uvicorn.run(app, host="0.0.0.0", port=8000)
