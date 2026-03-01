from fastapi import FastAPI
from api.catalog.router import router as catalog_router

app = FastAPI()

# Mount all catalog endpoints
app.include_router(catalog_router)
