from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import users, tracks, earnings, accounts, leads, splits, audit_logs

app = FastAPI(title="TrapRoyalties Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(tracks.router, prefix="/tracks", tags=["tracks"])
app.include_router(earnings.router, prefix="/earnings", tags=["earnings"])
app.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
app.include_router(leads.router, prefix="/leads", tags=["leads"])
app.include_router(splits.router, prefix="/splits", tags=["splits"])
app.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit_logs"])


@app.get("/")
async def root():
    return {"status": "backend running"}
