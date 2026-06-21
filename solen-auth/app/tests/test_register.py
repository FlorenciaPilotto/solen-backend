import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_register_exitoso(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "email": "nuevo@solen.app", "password": "Valida123", "name": "Nuevo",
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["email"] == "nuevo@solen.app"


async def test_register_email_duplicado_devuelve_409(client: AsyncClient):
    payload = {"email": "dup@solen.app", "password": "Valida123", "name": "Dup"}
    await client.post("/api/v1/auth/register", json=payload)
    r = await client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 409


async def test_register_password_muy_corta(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "email": "x@solen.app", "password": "Ab1", "name": "X",
    })
    assert r.status_code == 422


async def test_register_password_sin_numero(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "email": "x@solen.app", "password": "SoloLetras", "name": "X",
    })
    assert r.status_code == 422


async def test_register_password_sin_letra(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "email": "x@solen.app", "password": "12345678", "name": "X",
    })
    assert r.status_code == 422


async def test_register_email_invalido(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "email": "no-es-email", "password": "Valida123", "name": "X",
    })
    assert r.status_code == 422


async def test_register_nombre_vacio(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "email": "x@solen.app", "password": "Valida123", "name": "   ",
    })
    assert r.status_code == 422


async def test_register_campos_faltantes(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={"email": "x@solen.app"})
    assert r.status_code == 422


async def test_register_no_expone_password_en_respuesta(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "email": "safe@solen.app", "password": "Valida123", "name": "Safe",
    })
    assert r.status_code == 201
    body = r.text
    assert "Valida123" not in body
    assert "hashed_password" not in body


async def test_register_inyeccion_sql_en_email(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "email": "x'; DROP TABLE users; --@x.com",
        "password": "Valida123",
        "name": "SQL",
    })
    # Pydantic rechaza el email malformado antes de llegar a la BD
    assert r.status_code == 422


async def test_register_xss_en_nombre_se_almacena_como_texto(client: AsyncClient):
    xss = "<script>alert(1)</script>"
    r = await client.post("/api/v1/auth/register", json={
        "email": "xss@solen.app", "password": "Valida123", "name": xss,
    })
    assert r.status_code == 201
    # El nombre se almacena tal cual; la sanitización es responsabilidad del cliente
    assert r.json()["name"] == xss


async def test_register_input_muy_largo(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "email": "x@solen.app",
        "password": "Valida123",
        "name": "A" * 10_000,
    })
    # No debe crashear el servidor (200/201/422 son aceptables, no 500)
    assert r.status_code != 500
