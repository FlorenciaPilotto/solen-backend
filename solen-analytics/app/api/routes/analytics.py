from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.analytics import ProtocolEventInput, JournalEventInput, WakeupEventInput, TrackEventInput, DashboardResponse, HeatmapDay
from app.services.analytics_service import AnalyticsService
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends
from jose import JWTError

router = APIRouter(tags=["Analytics"])
bearer = HTTPBearer(auto_error=False)

def get_user_id(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if not creds: raise UnauthorizedError("Token requerido.")
    try:
        payload = decode_token(creds.credentials)
        return payload["sub"]
    except (JWTError, Exception): raise UnauthorizedError("Token inválido.")

@router.get("/api/v1/analytics/dashboard", response_model=DashboardResponse)
async def dashboard(user_id: str = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    return await AnalyticsService(db).get_dashboard(user_id)

@router.get("/api/v1/analytics/heatmap", response_model=list[HeatmapDay])
async def heatmap(days: int = 28, user_id: str = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    return await AnalyticsService(db).get_heatmap(user_id, days)

@router.post("/api/v1/events/protocol-generated", status_code=status.HTTP_204_NO_CONTENT)
async def event_protocol(body: ProtocolEventInput, db: AsyncSession = Depends(get_db)):
    await AnalyticsService(db).record_protocol(body.user_id, body.protocol_type, body.energy, body.stress, body.focus, body.total_minutes)

@router.post("/api/v1/events/journal", status_code=status.HTTP_204_NO_CONTENT)
async def event_journal(body: JournalEventInput, db: AsyncSession = Depends(get_db)):
    await AnalyticsService(db).record_journal(body.user_id, body.coherencia, body.gatillo)

@router.post("/api/v1/events/wakeup", status_code=status.HTTP_204_NO_CONTENT)
async def event_wakeup(body: WakeupEventInput, db: AsyncSession = Depends(get_db)):
    await AnalyticsService(db).record_wakeup(body.user_id, body.hora, body.puntos)

@router.post("/api/v1/events/track", status_code=status.HTTP_204_NO_CONTENT)
async def event_track(body: TrackEventInput, db: AsyncSession = Depends(get_db)):
    pass  # extensible para eventos futuros
