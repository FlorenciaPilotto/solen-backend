from pydantic import BaseModel

class ProtocolEventInput(BaseModel):
    user_id: str; protocol_type: str; energy: int; stress: int; focus: int; total_minutes: int

class JournalEventInput(BaseModel):
    user_id: str; coherencia: int; gatillo: str = "ninguno"

class WakeupEventInput(BaseModel):
    user_id: str; hora: str; puntos: int

class TrackEventInput(BaseModel):
    tipo: str; datos: dict = {}

class DashboardResponse(BaseModel):
    frecuencia_dominante: float
    modo_creacion_pct: float
    racha: int
    mejor_racha: int
    indice_voluntad: float
    biohack_level: int
    coherencia_media: float
    gatillo_principal: str
    protocolos_mes: int

class HeatmapDay(BaseModel):
    fecha: str; valor: float; modo: str
