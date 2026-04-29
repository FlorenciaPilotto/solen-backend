import uuid
import hashlib
from datetime import timedelta, datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import hash_password, verify_password, create_token, decode_token
from app.core.exceptions import ConflictError, UnauthorizedError
from app.db.base import User, RefreshToken
from app.schemas.auth import RegisterInput, LoginInput, TokenPair, AccessToken

settings = get_settings()


def _make_access_token(user_id: str, email: str) -> str:
    return create_token(
        {"sub": user_id, "email": email, "type": "access"},
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def _make_refresh_token(user_id: str) -> str:
    return create_token(
        {"sub": user_id, "type": "refresh"},
        timedelta(days=settings.refresh_token_expire_days),
    )


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_user_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def _get_user_by_id(self, user_id: str) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def register(self, data: RegisterInput) -> TokenPair:
        if await self._get_user_by_email(data.email):
            raise ConflictError("Ya existe una cuenta con ese email.")

        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        user = User(
            id=user_id, email=data.email, name=data.name,
            hashed_password=hash_password(data.password),
        )
        self.db.add(user)
        await self.db.flush()

        return await self._issue_token_pair(user)

    async def login(self, data: LoginInput) -> TokenPair:
        user = await self._get_user_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedError("Email o contraseña incorrectos.")
        if not user.is_active:
            raise UnauthorizedError("Cuenta desactivada.")
        return await self._issue_token_pair(user)

    async def refresh(self, refresh_token: str) -> AccessToken:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise UnauthorizedError("Token inválido.")
            user_id = payload["sub"]
        except Exception:
            raise UnauthorizedError("Refresh token inválido o expirado.")

        token_hash = _hash_token(refresh_token)
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,
            )
        )
        record = result.scalar_one_or_none()
        if not record or record.expires_at < datetime.now(timezone.utc):
            raise UnauthorizedError("Refresh token inválido o expirado.")

        user = await self._get_user_by_id(user_id)
        if not user:
            raise UnauthorizedError("Usuario no encontrado.")

        access = _make_access_token(user.id, user.email)
        return AccessToken(access_token=access)

    async def revoke(self, refresh_token: str) -> None:
        token_hash = _hash_token(refresh_token)
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        record = result.scalar_one_or_none()
        if record:
            record.revoked = True

    async def verify(self, access_token: str) -> dict:
        try:
            payload = decode_token(access_token)
            if payload.get("type") != "access":
                raise UnauthorizedError("Token inválido.")
            return {"user_id": payload["sub"], "email": payload["email"], "valid": True}
        except Exception:
            raise UnauthorizedError("Token inválido o expirado.")

    async def _issue_token_pair(self, user: User) -> TokenPair:
        access = _make_access_token(user.id, user.email)
        refresh = _make_refresh_token(user.id)

        refresh_record = RefreshToken(
            id=f"rt_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            token_hash=_hash_token(refresh),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
        )
        self.db.add(refresh_record)

        return TokenPair(
            access_token=access,
            refresh_token=refresh,
            user_id=user.id,
            email=user.email,
            name=user.name,
        )
