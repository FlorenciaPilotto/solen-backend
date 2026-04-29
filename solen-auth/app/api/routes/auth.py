from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.auth import RegisterInput, LoginInput, RefreshInput, TokenPair, AccessToken, VerifyResponse
from app.services.auth_service import AuthService
from app.db.session import get_db

router = APIRouter(tags=["Auth"])


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterInput, db: AsyncSession = Depends(get_db)) -> TokenPair:
    return await AuthService(db).register(body)


@router.post("/login", response_model=TokenPair)
async def login(body: LoginInput, db: AsyncSession = Depends(get_db)) -> TokenPair:
    return await AuthService(db).login(body)


@router.post("/refresh", response_model=AccessToken)
async def refresh(body: RefreshInput, db: AsyncSession = Depends(get_db)) -> AccessToken:
    return await AuthService(db).refresh(body.refresh_token)


@router.post("/revoke", status_code=status.HTTP_204_NO_CONTENT)
async def revoke(body: RefreshInput, db: AsyncSession = Depends(get_db)) -> None:
    await AuthService(db).revoke(body.refresh_token)


@router.post("/verify", response_model=VerifyResponse)
async def verify(body: RefreshInput, db: AsyncSession = Depends(get_db)) -> VerifyResponse:
    """Endpoint interno para que otros servicios validen tokens."""
    result = await AuthService(db).verify(body.refresh_token)
    return VerifyResponse(**result)
