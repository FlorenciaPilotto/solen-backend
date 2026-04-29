from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.protocolo import EstadoInput, EstadoResponse, ProtocolResponse, ProtocolSummary
from app.services.protocol_service import ProtocolService
from app.core.deps import get_current_user, CurrentUser
from app.db.session import get_db

router = APIRouter(tags=["Protocolos"])


@router.post("/api/v1/estado", response_model=EstadoResponse, status_code=status.HTTP_201_CREATED)
async def registrar_estado(
    body: EstadoInput,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EstadoResponse:
    return await ProtocolService(db).save_estado(user.user_id, body)


@router.post("/api/v1/protocolo", response_model=ProtocolResponse, status_code=status.HTTP_201_CREATED)
async def generar_protocolo(
    body: EstadoInput,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProtocolResponse:
    return await ProtocolService(db).generate(user.user_id, body)


@router.get("/api/v1/protocolo", response_model=ProtocolResponse)
async def obtener_protocolo(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProtocolResponse:
    return await ProtocolService(db).generate_from_latest(user.user_id)


@router.get("/api/v1/protocolo/historial", response_model=list[ProtocolSummary])
async def historial(
    limit: int = 10,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProtocolSummary]:
    return await ProtocolService(db).get_history(user.user_id, limit)
