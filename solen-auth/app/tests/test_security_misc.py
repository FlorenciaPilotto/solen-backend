"""Tests de seguridad general: headers, métodos no permitidos, contenido."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_health_accesible_sin_auth(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200


async def test_metodo_get_en_login_rechazado(client: AsyncClient):
    r = await client.get("/api/v1/auth/login")
    assert r.status_code == 405


async def test_metodo_get_en_register_rechazado(client: AsyncClient):
    r = await client.get("/api/v1/auth/register")
    assert r.status_code == 405


async def test_content_type_incorrecto_rechazado(client: AsyncClient):
    r = await client.post(
        "/api/v1/auth/login",
        content="email=test@x.com&password=Abc123",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 422


async def test_json_malformado_devuelve_422_no_500(client: AsyncClient):
    r = await client.post(
        "/api/v1/auth/login",
        content="{esto no es json}",
        headers={"Content-Type": "application/json"},
    )
    assert r.status_code == 422


async def test_error_no_expone_stack_trace(client: AsyncClient):
    r = await client.post("/api/v1/auth/login", json={
        "email": "no@existe.com", "password": "Incorrecta1",
    })
    body = r.text
    assert "Traceback" not in body
    assert "File " not in body
    assert "sqlalchemy" not in body.lower()


async def test_ruta_inexistente_devuelve_404(client: AsyncClient):
    r = await client.get("/api/v1/auth/ruta-que-no-existe")
    assert r.status_code == 404


async def test_body_nulo_devuelve_422(client: AsyncClient):
    r = await client.post(
        "/api/v1/auth/login",
        content="null",
        headers={"Content-Type": "application/json"},
    )
    assert r.status_code == 422


async def test_password_no_aparece_en_error_422(client: AsyncClient):
    password = "contrasena_secreta_xyz"
    r = await client.post("/api/v1/auth/register", json={
        "email": "x@solen.app",
        "password": password,
        "name": "",
    })
    assert r.status_code == 422
    assert password not in r.text


async def test_multiples_logins_fallidos_devuelven_401_consistente(client: AsyncClient, registered_user: dict):
    """Fuerza bruta: todos los intentos fallidos deben retornar 401, no variar."""
    for _ in range(5):
        r = await client.post("/api/v1/auth/login", json={
            "email": "test@solen.app", "password": "Incorrecta1",
        })
        assert r.status_code == 401
