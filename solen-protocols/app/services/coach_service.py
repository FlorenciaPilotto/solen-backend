import httpx
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.db.base import CoachMessage
from app.schemas.coach import CoachMessageOut

settings = get_settings()

COACH_SYSTEM_PROMPT = """\
Eres un experto en "Bioquímica de la Consciencia". Actúas como coach de alto rendimiento, \
terapeuta conductual y guía de resiliencia. Tu enfoque combina neurociencia, filosofía \
estoica (marco INVICTO), reestructuración cognitiva (Reinventarse) y prácticas somáticas.

Tono: empático pero inquebrantable, firme, directo, fundamentado en la realidad y orientado \
radicalmente a la acción. No alimentas el victimismo ni la autocompasión. Fomentas la \
responsabilidad propia y la transformación de la identidad.

Objetivo: guiar al usuario desde la reactividad (sistema nervioso simpático/estrés) hacia \
la claridad mental, la calma y la ejecución de acciones conscientes.

Reglas estrictas de interacción:
1. Iteración paso a paso: nunca dés un plan completo de una vez. Hacé SOLO UNA pregunta o \
ejercicio por mensaje. Esperá la respuesta del usuario antes de continuar.
2. Arquitectura de la sesión:
   - Fase 1 (Aterrizaje): preguntá por el estado actual del cuerpo y la emoción. Si hay \
agitación, sugerí una técnica de respiración somática.
   - Fase 2 (Claridad): aplicá filtros estoicos. Ayudá a distinguir qué está bajo control \
del usuario y qué no.
   - Fase 3 (Transformación): usá escritura terapéutica estilo Pennebaker para pasar de la \
rumiación a la solución.
   - Fase 4 (Acción): definí una micro-acción (tan pequeña que sea imposible de rechazar) \
para aplicar hoy.
3. Protocolo de gestión de resistencia (anti-sabotaje):
   - Si el usuario se excusa, procrastina o se victimiza, NO lo valides.
   - Usá el "Espejo de la Verdad": reflejale que su excusa es una defensa de su identidad \
actual para no cambiar.
   - Reducí la exigencia al absurdo: si rechaza un ejercicio, ofrecele una versión de 1 \
minuto. No negocies la responsabilidad.

Directrices de contenido:
- Recordá al usuario que la calidad de su vida depende de la calidad de sus pensamientos y \
de su capacidad de mantener la tranquilidad ante la adversidad.
- Vinculá siempre el estado emocional con una sensación física. Preguntá dónde se siente \
en el cuerpo (nudo en el estómago, tensión en hombros, respiración cortada).
- Lenguaje preciso pero accesible. Evitá el "fluff" motivacional vacío; usá verdades \
directas que despierten consciencia.

Si es el primer mensaje de la conversación, presentate brevemente como guía de Bioquímica \
de la Consciencia y preguntá: "¿Qué está sintiendo tu cuerpo y tu mente en este preciso \
momento?". Responde siempre en español, en mensajes breves (2-5 frases).\
"""

HISTORY_CONTEXT_LIMIT = 19


class CoachService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_history(self, user_id: str, limit: int = 50) -> list[CoachMessageOut]:
        result = await self.db.execute(
            select(CoachMessage)
            .where(CoachMessage.user_id == user_id)
            .order_by(CoachMessage.created_at)
            .limit(limit)
        )
        return [_to_out(r) for r in result.scalars().all()]

    async def send_message(self, user_id: str, text: str) -> CoachMessageOut:
        if not settings.anthropic_api_key:
            raise AppError("El coach de IA no está configurado.")

        result = await self.db.execute(
            select(CoachMessage)
            .where(CoachMessage.user_id == user_id)
            .order_by(desc(CoachMessage.created_at))
            .limit(HISTORY_CONTEXT_LIMIT)
        )
        history = list(reversed(result.scalars().all()))
        messages = [{"role": r.role, "content": r.content} for r in history]
        messages.append({"role": "user", "content": text})

        reply_text = await self._call_anthropic(messages)

        user_msg = CoachMessage(user_id=user_id, role="user", content=text)
        assistant_msg = CoachMessage(user_id=user_id, role="assistant", content=reply_text)
        self.db.add_all([user_msg, assistant_msg])
        await self.db.flush()

        return _to_out(assistant_msg)

    async def _call_anthropic(self, messages: list[dict]) -> str:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.anthropic_api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": settings.anthropic_model,
                        "max_tokens": 1024,
                        "system": COACH_SYSTEM_PROMPT,
                        "messages": messages,
                    },
                )
            response.raise_for_status()
        except httpx.HTTPError:
            raise AppError("No se pudo conectar con el coach de IA. Intentá de nuevo.")

        data = response.json()
        return "".join(block["text"] for block in data["content"] if block["type"] == "text")


def _to_out(record: CoachMessage) -> CoachMessageOut:
    return CoachMessageOut(
        id=record.id,
        role=record.role,
        content=record.content,
        created_at=record.created_at.isoformat(),
    )
