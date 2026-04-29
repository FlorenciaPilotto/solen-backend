from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import ProtocolEvent, JournalEvent, WakeupEvent
from app.schemas.analytics import DashboardResponse, HeatmapDay

CREACION_TYPES = {"claridad", "alto_rendimiento"}
SUPERVIVENCIA_TYPES = {"calma", "energia"}

class AnalyticsService:
    def __init__(self, db: AsyncSession): self.db = db

    async def record_protocol(self, user_id: str, protocol_type: str, energy: int, stress: int, focus: int, total_minutes: int):
        self.db.add(ProtocolEvent(user_id=user_id, protocol_type=protocol_type, energy=energy, stress=stress, focus=focus, total_minutes=total_minutes))
        await self.db.flush()

    async def record_journal(self, user_id: str, coherencia: int, gatillo: str = "ninguno"):
        self.db.add(JournalEvent(user_id=user_id, coherencia=coherencia, gatillo=gatillo))
        await self.db.flush()

    async def record_wakeup(self, user_id: str, hora: str, puntos: int):
        self.db.add(WakeupEvent(user_id=user_id, hora=hora, puntos=puntos))
        await self.db.flush()

    async def get_dashboard(self, user_id: str) -> DashboardResponse:
        since = datetime.now(timezone.utc) - timedelta(days=30)

        # Protocolos del mes
        result = await self.db.execute(select(ProtocolEvent).where(ProtocolEvent.user_id == user_id, ProtocolEvent.created_at >= since))
        protocols = list(result.scalars().all())

        total = len(protocols)
        creacion = sum(1 for p in protocols if p.protocol_type in CREACION_TYPES)
        creacion_pct = round((creacion / total * 100) if total > 0 else 0, 1)
        frecuencia = round(creacion_pct, 1)

        # Journal
        result2 = await self.db.execute(select(JournalEvent).where(JournalEvent.user_id == user_id, JournalEvent.created_at >= since))
        journals = list(result2.scalars().all())
        coherencia_media = round(sum(j.coherencia for j in journals) / len(journals), 1) if journals else 0.0
        gatillos = [j.gatillo for j in journals if j.gatillo != "ninguno"]
        gatillo_principal = max(set(gatillos), key=gatillos.count) if gatillos else "ninguno"

        # Wakeup / racha
        result3 = await self.db.execute(select(WakeupEvent).where(WakeupEvent.user_id == user_id).order_by(desc(WakeupEvent.created_at)).limit(30))
        wakeups = list(result3.scalars().all())
        racha = self._calcular_racha(wakeups)
        indice = round(sum(w.puntos for w in wakeups[:7]) / 7, 1) if wakeups else 0.0

        # Biohack level (composite)
        biohack = min(100, int(creacion_pct * 0.4 + coherencia_media * 5 + min(racha * 3, 30)))

        return DashboardResponse(
            frecuencia_dominante=frecuencia, modo_creacion_pct=creacion_pct,
            racha=racha, mejor_racha=max(racha, 0),
            indice_voluntad=indice, biohack_level=biohack,
            coherencia_media=coherencia_media, gatillo_principal=gatillo_principal,
            protocolos_mes=total,
        )

    async def get_heatmap(self, user_id: str, days: int = 28) -> list[HeatmapDay]:
        result = []
        for i in range(days - 1, -1, -1):
            d = datetime.now(timezone.utc) - timedelta(days=i)
            date_str = d.strftime("%Y-%m-%d")
            day_start = d.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            r = await self.db.execute(select(ProtocolEvent).where(ProtocolEvent.user_id == user_id, ProtocolEvent.created_at >= day_start, ProtocolEvent.created_at < day_end))
            protos = list(r.scalars().all())
            if not protos:
                result.append(HeatmapDay(fecha=date_str, valor=0.0, modo="sin_dato"))
            else:
                creacion_count = sum(1 for p in protos if p.protocol_type in CREACION_TYPES)
                valor = round(creacion_count / len(protos), 2)
                modo = "creacion" if valor > 0.5 else "supervivencia"
                result.append(HeatmapDay(fecha=date_str, valor=valor, modo=modo))
        return result

    def _calcular_racha(self, wakeups: list) -> int:
        if not wakeups: return 0
        dates = sorted({w.created_at.date() for w in wakeups}, reverse=True)
        racha = 0
        today = datetime.now(timezone.utc).date()
        for i, d in enumerate(dates):
            expected = today - timedelta(days=i)
            if d == expected: racha += 1
            else: break
        return racha
