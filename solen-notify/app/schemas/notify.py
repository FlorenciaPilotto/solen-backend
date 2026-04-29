from pydantic import BaseModel


class RegisterTokenInput(BaseModel):
    expo_token: str


class NotificacionConfigInput(BaseModel):
    latigo_activo: bool = True
    hora_round_uno: str = "05:00"
    hora_accion_masiva: str = "09:00"
    hora_tarde: str = "17:00"
    hora_pineal: str = "22:00"


class SendPushInput(BaseModel):
    user_id: str
    tipo: str
    titulo: str
    cuerpo: str


class NotificacionConfigResponse(BaseModel):
    user_id: str
    latigo_activo: bool
    config: dict


# Mensajes del látigo de identidad (por tipo)
LATIGO_MESSAGES = {
    "round_uno": {
        "titulo": "Solen",
        "cuerpo": "¿Vas a escuchar a tu debilidad o a tu voluntad? El Round Uno no negocia. Movete.",
    },
    "accion_masiva": {
        "titulo": "Solen · Bloque de trabajo",
        "cuerpo": "Si sabés qué hacer y no lo hacés, estás destruyendo tu autoestima. Ejecutá ahora.",
    },
    "gym": {
        "titulo": "Solen · Round Dos",
        "cuerpo": "Buscá el fallo. Estudiá el dolor. Cruzar esa barrera es lo que te separa del resto.",
    },
    "tarde": {
        "titulo": "Solen · Reset",
        "cuerpo": "Tu energía está cayendo. 10 min de cardio para resetear la química. No seas un civil.",
    },
    "pineal": {
        "titulo": "Solen · Round Tres",
        "cuerpo": "El día se cierra. Tu antena se enciende. Activación Pineal en 5 minutos.",
    },
}
