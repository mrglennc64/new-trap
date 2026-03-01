from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from api.routes import upload, digital_handshake, splits, attorney
# Import all routers directly from their files
from api.routes.upload import router as upload_router
from api.routes.digital_handshake import router as digital_handshake_router
from api.routes.splits import router as splits_router
app.include_router(attorney.router)

app = FastAPI(
    title="TrapRoyaltiesPro API",
    description="Music royalty tracking and verification system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(upload_router)
app.include_router(digital_handshake_router)
app.include_router(splits_router)

@app.get("/")
async def root():
    return {
        "message": "TrapRoyaltiesPro API",
        "version": "1.0.0",
        "endpoints": [
            "/api/catalog/upload",
            "/api/catalog/tracks",
            "/api/digital-handshake/verify",
            "/api/splits/create",
            "/api/splits/verify",
            "/api/splits/track/{track_id}",
            "/api/splits/verify-page/{track_id}",
            "/health"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
