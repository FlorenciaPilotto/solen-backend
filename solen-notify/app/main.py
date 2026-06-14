from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import httpx
import logging

from app.core.config import get_settings
from app.core.exceptions import AppError, app_error_handler, unhandled_error_handler
from app.db.session import engine, ping_db, AsyncSessionLocal
from app.db import base as _models  # noqa
from app.api.routes import notify
from app.services.notify_service import NotifyService
from app.db.base import DeviceToken, NotificacionConfig
from sqlalchemy import select

settings = get_settings()
logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def _broadcast_latigo(tipo: str) -> None:
    """Envía el látigo a todos los usuarios activos con el tipo dado."""
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(NotificacionConfig).where(NotificacionConfig.latigo_activo == True)
            )
            configs = list(result.scalars().all())
            svc = NotifyService(db)
            for config in configs:
                await svc.send_latigo(config.user_id, tipo)
            await db.commit()
            logger.info(f"Látigo '{tipo}' enviado a {len(configs)} usuarios.")
        except Exception as e:
            logger.error(f"Error en broadcast {tipo}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(_models.Base.metadata.create_all)
    # Programar el látigo de identidad
    scheduler.add_job(_broadcast_latigo, CronTrigger(hour=5,  minute=0),  args=["round_uno"],     id="round_uno")
    scheduler.add_job(_broadcast_latigo, CronTrigger(hour=9,  minute=0),  args=["accion_masiva"], id="accion_masiva")
    scheduler.add_job(_broadcast_latigo, CronTrigger(hour=17, minute=0),  args=["tarde"],         id="tarde")
    scheduler.add_job(_broadcast_latigo, CronTrigger(hour=22, minute=0),  args=["pineal"],        id="pineal")
    scheduler.start()
    logger.info("Scheduler iniciado — látigo programado.")
    yield
    scheduler.shutdown()
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

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)
app.include_router(notify.router)


@app.get("/health", include_in_schema=False)
async def health() -> dict:
    return {
        "service": settings.app_name,
        "status": "ok" if await ping_db() else "degraded",
        "scheduler": "running" if scheduler.running else "stopped",
        "jobs": [j.id for j in scheduler.get_jobs()],
    }
