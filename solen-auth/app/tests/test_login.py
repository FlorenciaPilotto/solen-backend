import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_login_exitoso(client: AsyncClient, registered_user: dict):
    r = await client.post("/api/v1/auth/login", json={
        "email": "test@solen.app", "password": "Segura123",
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data


async def test_login_password_incorrecta_devuelve_401(client: AsyncClient, registered_user: dict):
    r = await client.post("/api/v1/auth/login", json={
        "email": "test@solen.app", "password": "Incorrecta1",
    })
    assert r.status_code == 401


async def test_login_email_inexistente_devuelve_401(client: AsyncClient):
    r = await client.post("/api/v1/auth/login", json={
        "email": "fantasma@solen.app", "password": "Cualquiera1",
    })
    assert r.status_code == 401


async def test_login_mismo_error_email_o_password_incorrectos(client: AsyncClient, registered_user: dict):
    """El mensaje de error debe ser idéntico para email incorrecto y password incorrecta
    (previene enumeración de usuarios)."""
    r_email = await client.post("/api/v1/auth/login", json={
        "email": "noexiste@solen.app", "password": "Cualquiera1",
    })
    r_pass = await client.post("/api/v1/auth/login", json={
        "email": "test@solen.app", "password": "Incorrecta1",
    })
    assert r_email.json()["error"] == r_pass.json()["error"]


async def test_login_no_expone_password_en_respuesta(client: AsyncClient, registered_user: dict):
    r = await client.post("/api/v1/auth/login", json={
        "email": "test@solen.app", "password": "Segura123",
    })
    assert r.status_code == 200
    body = r.text
    assert "Segura123" not in body
    assert "hashed_password" not in body


async def test_login_campos_faltantes(client: AsyncClient):
    r = await client.post("/api/v1/auth/login", json={"email": "test@solen.app"})
    assert r.status_code == 422


async def test_login_email_invalido(client: AsyncClient):
    r = await client.post("/api/v1/auth/login", json={
        "email": "no-es-email", "password": "Segura123",
    })
    assert r.status_code == 422


async def test_login_body_vacio(client: AsyncClient):
    r = await client.post("/api/v1/auth/login", json={})
    assert r.status_code == 422


async def test_login_inyeccion_sql_en_password(client: AsyncClient, registered_user: dict):
    r = await client.post("/api/v1/auth/login", json={
        "email": "test@solen.app",
        "password": "' OR '1'='1",
    })
    assert r.status_code == 401
