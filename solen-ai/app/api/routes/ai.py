from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.sesion import SesionRequest, SesionResponse
from app.core.claude_service import ClaudeService
from app.core.auth import get_current_user

router = APIRouter(tags=["AI"])


@router.post("/sesion", response_model=SesionResponse)
async def sesion_emocional(
    body: SesionRequest,
    current_user: dict = Depends(get_current_user),
) -> SesionResponse:
    """
    Procesa un turno de la sesión emocional con Claude.
    Requiere JWT válido. La API key de Anthropic queda en el servidor.
    """
    if not body.mensajes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Se requiere al menos un mensaje"
        )

    try:
        respuesta, tokens = await ClaudeService().responder(body.mensajes, body.emocion)
        return SesionResponse(respuesta=respuesta, tokens_usados=tokens)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al contactar Claude: {str(e)}"
        )
