from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.exceptions import AppError, app_error_handler, unhandled_error_handler
from app.db.session import engine, ping_db
from app.db import base as _models  # noqa
from app.api.routes import analytics

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()

app = FastAPI(title=settings.app_name, version=settings.version, docs_url=None if settings.is_production else "/docs", redoc_url=None, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)
app.include_router(analytics.router)

@app.get("/health", include_in_schema=False)
async def health() -> dict:
    return {"service": settings.app_name, "status": "ok" if await ping_db() else "degraded"}
