from pydantic import BaseModel
from typing import Literal


class Mensaje(BaseModel):
    rol: Literal["user", "assistant"]
    texto: str


class SesionRequest(BaseModel):
    mensajes: list[Mensaje]
    emocion: str | None = None


class SesionResponse(BaseModel):
    respuesta: str
    tokens_usados: int
