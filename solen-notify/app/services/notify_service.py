"""
notify_service.py — Servicio de notificaciones push de Solen.

Usa la API de Expo Push Notifications:
https://docs.expo.dev/push-notifications/sending-notifications/

Para activar en producción:
1. Configurar EXPO_ACCESS_TOKEN en el .env
2. La app móvil registra el token con POST /api/v1/notify/token
3. El scheduler (APScheduler) dispara las notificaciones por hora
"""

import uuid
import logging
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.base import DeviceToken, NotificacionConfig, NotificacionLog
from app.schemas.notify import LATIGO_MESSAGES

settings = get_settings()
logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


class NotifyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Registro de tokens ────────────────────────────────────────

    async def register_token(self, user_id: str, expo_token: str) -> None:
        result = await self.db.execute(
            select(DeviceToken).where(DeviceToken.expo_token == expo_token)
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.user_id = user_id
            existing.activo = True
        else:
            self.db.add(DeviceToken(
                id=f"dt_{uuid.uuid4().hex[:12]}",
                user_id=user_id,
                expo_token=expo_token,
            ))
        await self.db.flush()

    async def get_tokens(self, user_id: str) -> list[str]:
        result = await self.db.execute(
            select(DeviceToken).where(
                DeviceToken.user_id == user_id,
                DeviceToken.activo == True,
            )
        )
        return [t.expo_token for t in result.scalars().all()]

    # ── Configuración ─────────────────────────────────────────────

    async def get_config(self, user_id: str) -> NotificacionConfig:
        result = await self.db.execute(
            select(NotificacionConfig).where(NotificacionConfig.user_id == user_id)
        )
        config = result.scalar_one_or_none()
        if not config:
            config = NotificacionConfig(
                user_id=user_id,
                latigo_activo=True,
                config={
                    "hora_round_uno":     "05:00",
                    "hora_accion_masiva": "09:00",
                    "hora_tarde":         "17:00",
                    "hora_pineal":        "22:00",
                },
            )
            self.db.add(config)
            await self.db.flush()
        return config

    async def update_config(self, user_id: str, latigo_activo: bool, config: dict) -> None:
        existing = await self.get_config(user_id)
        existing.latigo_activo = latigo_activo
        existing.config = config

    # ── Envío de push ─────────────────────────────────────────────

    async def send_latigo(self, user_id: str, tipo: str) -> bool:
        """
        Envía el 'látigo de identidad' al usuario.
        tipo: round_uno | accion_masiva | gym | tarde | pineal
        """
        config = await self.get_config(user_id)
        if not config.latigo_activo:
            return False

        msg = LATIGO_MESSAGES.get(tipo)
        if not msg:
            return False

        tokens = await self.get_tokens(user_id)
        if not tokens:
            return False

        return await self._send(user_id, tipo, msg["titulo"], msg["cuerpo"], tokens)

    async def send_custom(self, user_id: str, tipo: str, titulo: str, cuerpo: str) -> bool:
        tokens = await self.get_tokens(user_id)
        if not tokens:
            return False
        return await self._send(user_id, tipo, titulo, cuerpo, tokens)

    async def _send(
        self, user_id: str, tipo: str, titulo: str, cuerpo: str, tokens: list[str]
    ) -> bool:
        messages = [
            {
                "to": token,
                "title": titulo,
                "body": cuerpo,
                "sound": "default",
                "data": {"tipo": tipo, "user_id": user_id},
                "priority": "high",
            }
            for token in tokens
        ]

        log = NotificacionLog(
            id=f"nl_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            tipo=tipo,
            titulo=titulo,
            cuerpo=cuerpo,
        )
        self.db.add(log)

        try:
            headers = {"Content-Type": "application/json"}
            if settings.expo_access_token:
                headers["Authorization"] = f"Bearer {settings.expo_access_token}"

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(EXPO_PUSH_URL, json=messages, headers=headers)
                resp.raise_for_status()

            log.enviada = True
            await self.db.flush()
            return True

        except Exception as e:
            logger.warning(f"Push failed for {user_id}: {e}")
            await self.db.flush()
            return False
