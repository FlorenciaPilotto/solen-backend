from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.coach import CoachMessageIn, CoachMessageOut
from app.services.coach_service import CoachService
from app.core.deps import get_current_user, CurrentUser
from app.db.session import get_db

router = APIRouter(tags=["Coach"])


@router.get("/api/v1/coach/history", response_model=list[CoachMessageOut])
async def historial(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CoachMessageOut]:
    return await CoachService(db).get_history(user.user_id)


@router.post("/api/v1/coach/message", response_model=CoachMessageOut, status_code=status.HTTP_201_CREATED)
async def enviar_mensaje(
    body: CoachMessageIn,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CoachMessageOut:
    return await CoachService(db).send_message(user.user_id, body.message)
