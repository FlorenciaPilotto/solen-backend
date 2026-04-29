from dataclasses import dataclass
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedError

bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    email: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> CurrentUser:
    if not credentials:
        raise UnauthorizedError("Token requerido.")
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise UnauthorizedError("Token inválido.")
        return CurrentUser(user_id=payload["sub"], email=payload["email"])
    except (JWTError, Exception):
        raise UnauthorizedError("Token inválido o expirado.")
