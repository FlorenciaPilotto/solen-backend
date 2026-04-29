from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.notify import RegisterTokenInput, NotificacionConfigInput, SendPushInput, NotificacionConfigResponse
from app.services.notify_service import NotifyService
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

router = APIRouter(tags=["Notifications"])
bearer = HTTPBearer(auto_error=False)


def get_user_id(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if not creds:
        raise UnauthorizedError("Token requerido.")
    try:
        payload = decode_token(creds.credentials)
        return payload["sub"]
    except (JWTError, Exception):
        raise UnauthorizedError("Token inválido.")


@router.post("/api/v1/notify/token", status_code=status.HTTP_204_NO_CONTENT)
async def register_token(
    body: RegisterTokenInput,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Registra el token de Expo Push del dispositivo."""
    await NotifyService(db).register_token(user_id, body.expo_token)


@router.get("/api/v1/notify/config", response_model=NotificacionConfigResponse)
async def get_config(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
) -> NotificacionConfigResponse:
    config = await NotifyService(db).get_config(user_id)
    return NotificacionConfigResponse(
        user_id=config.user_id,
        latigo_activo=config.latigo_activo,
        config=config.config,
    )


@router.put("/api/v1/notify/config", status_code=status.HTTP_204_NO_CONTENT)
async def update_config(
    body: NotificacionConfigInput,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    await NotifyService(db).update_config(
        user_id,
        body.latigo_activo,
        {
            "hora_round_uno":     body.hora_round_uno,
            "hora_accion_masiva": body.hora_accion_masiva,
            "hora_tarde":         body.hora_tarde,
            "hora_pineal":        body.hora_pineal,
        },
    )


@router.post("/api/v1/notify/send", status_code=status.HTTP_204_NO_CONTENT)
async def send_push(
    body: SendPushInput,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Endpoint interno para enviar push desde otros servicios."""
    await NotifyService(db).send_custom(body.user_id, body.tipo, body.titulo, body.cuerpo)


@router.post("/api/v1/notify/latigo/{tipo}", status_code=status.HTTP_204_NO_CONTENT)
async def send_latigo(
    tipo: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Envía el látigo de identidad al usuario autenticado."""
    await NotifyService(db).send_latigo(user_id, tipo)
