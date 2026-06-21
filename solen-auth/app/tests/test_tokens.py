import pytest
import time
from datetime import timedelta
from httpx import AsyncClient
from app.core.security import create_token, decode_token

pytestmark = pytest.mark.asyncio


async def test_refresh_exitoso(client: AsyncClient, registered_user: dict):
    r = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": registered_user["refresh_token"],
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


async def test_refresh_token_invalido_devuelve_401(client: AsyncClient):
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": "token.falso.xxx"})
    assert r.status_code == 401


async def test_access_token_usado_como_refresh_devuelve_401(client: AsyncClient, registered_user: dict):
    """Un access token no debe poder usarse como refresh token."""
    r = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": registered_user["access_token"],
    })
    assert r.status_code == 401


async def test_refresh_token_revocado_no_puede_reutilizarse(client: AsyncClient, registered_user: dict):
    refresh = registered_user["refresh_token"]
    await client.post("/api/v1/auth/revoke", json={"refresh_token": refresh})
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 401


async def test_token_manipulado_firma_invalida(client: AsyncClient, registered_user: dict):
    token = registered_user["access_token"]
    partes = token.split(".")
    partes[2] = partes[2][:-4] + "XXXX"
    manipulado = ".".join(partes)
    r = await client.post("/api/v1/auth/verify", json={"refresh_token": manipulado})
    assert r.status_code == 401


async def test_token_con_algoritmo_none_rechazado(client: AsyncClient):
    """El servidor no debe aceptar tokens con alg=none (ataque de degradación)."""
    import base64, json

    def b64(data: dict) -> str:
        return base64.urlsafe_b64encode(json.dumps(data).encode()).rstrip(b"=").decode()

    header = b64({"alg": "none", "typ": "JWT"})
    payload = b64({"sub": "usr_fake", "type": "access", "email": "hack@x.com"})
    none_token = f"{header}.{payload}."

    r = await client.post("/api/v1/auth/verify", json={"refresh_token": none_token})
    assert r.status_code == 401


async def test_verify_con_access_token_valido(client: AsyncClient, registered_user: dict):
    r = await client.post("/api/v1/auth/verify", json={
        "refresh_token": registered_user["access_token"],
    })
    assert r.status_code == 200
    data = r.json()
    assert data["valid"] is True
    assert data["user_id"] == registered_user["user_id"]


async def test_verify_con_refresh_token_devuelve_401(client: AsyncClient, registered_user: dict):
    """Un refresh token no debe poder usarse para verificar identidad."""
    r = await client.post("/api/v1/auth/verify", json={
        "refresh_token": registered_user["refresh_token"],
    })
    assert r.status_code == 401


async def test_verify_token_vacio_devuelve_401(client: AsyncClient):
    r = await client.post("/api/v1/auth/verify", json={"refresh_token": ""})
    assert r.status_code == 401


async def test_revoke_idempotente(client: AsyncClient, registered_user: dict):
    """Revocar dos veces el mismo token no debe causar error."""
    refresh = registered_user["refresh_token"]
    r1 = await client.post("/api/v1/auth/revoke", json={"refresh_token": refresh})
    r2 = await client.post("/api/v1/auth/revoke", json={"refresh_token": refresh})
    assert r1.status_code == 204
    assert r2.status_code == 204


async def test_token_expirado_rechazado(client: AsyncClient):
    """Un token creado con expiración en el pasado debe ser rechazado."""
    expirado = create_token(
        {"sub": "usr_fake", "email": "x@x.com", "type": "access"},
        timedelta(seconds=-1),
    )
    r = await client.post("/api/v1/auth/verify", json={"refresh_token": expirado})
    assert r.status_code == 401
