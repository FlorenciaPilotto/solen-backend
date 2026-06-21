from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import get_settings
from app.core.exceptions import AppError, app_error_handler, unhandled_error_handler
from app.db.session import engine, ping_db
from app.db import base as _models  # noqa: F401
from app.api.routes import auth

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.db import base as _models  # noqa: F401 — ensure models are registered
    async with engine.begin() as conn:
        await conn.run_sync(_models.Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
    lifespan=lifespan,
)

if settings.is_production:
    # En producción no hay gateway nginx delante: cada servicio expone su propio dominio.
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

async def _validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [
        {k: v for k, v in e.items() if k not in ("input", "ctx")}
        for e in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": errors})

app.add_exception_handler(RequestValidationError, _validation_error_handler)
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)
app.include_router(auth.router, prefix="/api/v1/auth")


@app.get("/health", include_in_schema=False)
async def health() -> dict:
    return {"service": settings.app_name, "status": "ok" if await ping_db() else "degraded"}
