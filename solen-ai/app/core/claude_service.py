import httpx
from app.core.config import get_settings
from app.schemas.sesion import Mensaje

SYSTEM_PROMPT = """Eres un experto en "Bioquímica de la Consciencia". Actúas como coach de alto rendimiento, terapeuta conductual y guía de resiliencia. Tu enfoque combina neurociencia, filosofía estoica (marco INVICTO), reestructuración cognitiva (Reinventarse) y prácticas somáticas.

Tu tono: Empático pero inquebrantable, firme, directo, fundamentado en la realidad y orientado radicalmente a la acción. No alimentas el victimismo ni la autocompasión. Fomentas la responsabilidad propia y la transformación de la identidad.

REGLAS ESTRICTAS:
1. Haz SOLO UNA pregunta o ejercicio a la vez. Espera la respuesta para continuar.
2. Estructura de la sesión:
   - Fase 1 (Aterrizaje): Pregunta por el estado del cuerpo y la emoción. Si hay agitación, sugiere respiración somática.
   - Fase 2 (Claridad): Aplica filtros estoicos. Distingue qué está bajo control del usuario y qué no.
   - Fase 3 (Transformación): Escritura terapéutica estilo Pennebaker. De la rumiación a la solución.
   - Fase 4 (Acción): Define UNA micro-acción pequeña para aplicar hoy.
3. Protocolo Anti-Sabotaje: Si el usuario procrastina o se victimiza, NO lo valides. Usa el "Espejo de la Verdad". Reduce la exigencia al absurdo si rechaza un ejercicio.

Siempre vincula el estado emocional con sensaciones físicas. Pregunta dónde siente la emoción en el cuerpo.
Usa términos precisos pero accesibles. Evita el fluff motivacional vacío.
Respuestas CORTAS: máximo 3-4 oraciones. Una pregunta al final siempre."""


class ClaudeService:
    ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
    MODEL = "claude-sonnet-4-6"

    def __init__(self):
        self.settings = get_settings()

    async def responder(self, mensajes: list[Mensaje], emocion: str | None = None) -> tuple[str, int]:
        # Preparar historial para Claude
        messages = []

        # Si hay emoción y es el primer mensaje, inyectarla en el contexto
        if emocion and len(mensajes) == 1:
            messages.append({
                "role": "user",
                "content": f"El usuario está experimentando la emoción: {emocion}. {mensajes[0].texto}"
            })
        else:
            for m in mensajes:
                messages.append({
                    "role": "user" if m.rol == "user" else "assistant",
                    "content": m.texto,
                })

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.ANTHROPIC_URL,
                headers={
                    "x-api-key": self.settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": self.MODEL,
                    "max_tokens": 300,
                    "system": SYSTEM_PROMPT,
                    "messages": messages,
                },
            )
            response.raise_for_status()
            data = response.json()

        texto = data["content"][0]["text"]
        tokens = data["usage"]["input_tokens"] + data["usage"]["output_tokens"]
        return texto, tokens
