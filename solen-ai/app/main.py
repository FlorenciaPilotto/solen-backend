from fastapi import FastAPI
from app.core.config import get_settings
from app.api.routes import ai

settings = get_settings()

app = FastAPI(
    title="solen-ai",
    version=settings.version,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
)

app.include_router(ai.router, prefix="/api/v1/ai")


@app.get("/health", include_in_schema=False)
async def health() -> dict:
    return {"service": "solen-ai", "status": "ok"}
