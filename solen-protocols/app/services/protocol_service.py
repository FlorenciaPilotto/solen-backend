import httpx
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import NotFoundError
from app.db.base import UserState, Protocol
from app.schemas.protocolo import EstadoInput, EstadoResponse, ProtocolResponse, ProtocolSummary
from app.services.protocol_engine import build_protocol

settings = get_settings()


class ProtocolService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_estado(self, user_id: str, data: EstadoInput) -> EstadoResponse:
        record = UserState(
            user_id=user_id, energy=data.energy, stress=data.stress,
            focus=data.focus, available_minutes=data.available_minutes,
        )
        self.db.add(record)
        await self.db.flush()
        return EstadoResponse(
            id=record.id, user_id=user_id, energy=record.energy,
            stress=record.stress, focus=record.focus,
            available_minutes=record.available_minutes,
            created_at=record.created_at.isoformat(),
        )

    async def generate(self, user_id: str, state: EstadoInput) -> ProtocolResponse:
        protocol = build_protocol(user_id, state)

        record = Protocol(
            user_id=user_id,
            protocol_type=protocol.protocol_type.value,
            energy=state.energy, stress=state.stress, focus=state.focus,
            available_minutes=state.available_minutes,
            total_minutes=protocol.total_minutes,
            payload=protocol.model_dump(mode="json"),
        )
        self.db.add(record)
        await self.db.flush()

        # Emitir evento al servicio de analytics (fire and forget)
        await self._emit_analytics_event(user_id, protocol.protocol_type.value, protocol.total_minutes)

        return protocol

    async def generate_from_latest(self, user_id: str) -> ProtocolResponse:
        result = await self.db.execute(
            select(UserState)
            .where(UserState.user_id == user_id)
            .order_by(desc(UserState.created_at))
            .limit(1)
        )
        record = result.scalar_one_or_none()
        if not record:
            raise NotFoundError("No hay estado registrado. Usá POST /api/v1/estado primero.")
        state = EstadoInput(
            energy=record.energy, stress=record.stress,
            focus=record.focus, available_minutes=record.available_minutes,
        )
        return await self.generate(user_id, state)

    async def get_history(self, user_id: str, limit: int = 10) -> list[ProtocolSummary]:
        result = await self.db.execute(
            select(Protocol)
            .where(Protocol.user_id == user_id)
            .order_by(desc(Protocol.created_at))
            .limit(limit)
        )
        records = list(result.scalars().all())
        return [
            ProtocolSummary(
                id=r.id, protocol_type=r.protocol_type,
                energy=r.energy, stress=r.stress, focus=r.focus,
                total_minutes=r.total_minutes,
                created_at=r.created_at.isoformat(),
            )
            for r in records
        ]

    async def _emit_analytics_event(self, user_id: str, protocol_type: str, total_minutes: int) -> None:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                await client.post(
                    f"{settings.analytics_service_url}/api/v1/events/protocol-generated",
                    json={"user_id": user_id, "protocol_type": protocol_type, "total_minutes": total_minutes},
                )
        except Exception:
            pass  # Fire and forget — no bloquea la respuesta
