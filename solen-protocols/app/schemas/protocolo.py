from enum import Enum
from pydantic import BaseModel, Field


class ProtocolType(str, Enum):
    calma = "calma"
    energia = "energia"
    enfoque = "enfoque"
    claridad = "claridad"
    alto_rendimiento = "alto_rendimiento"


class EstadoInput(BaseModel):
    energy: int = Field(..., ge=0, le=100)
    stress: int = Field(..., ge=0, le=100)
    focus: int = Field(..., ge=0, le=100)
    available_minutes: int = Field(default=60, ge=10, le=240)


class EstadoResponse(BaseModel):
    id: int
    user_id: str
    energy: int
    stress: int
    focus: int
    available_minutes: int
    created_at: str


class MentalPractice(BaseModel):
    name: str
    description: str
    duration_minutes: int
    technique: str


class PhysicalRoutine(BaseModel):
    name: str
    description: str
    duration_minutes: int
    intensity: str
    exercises: list[str]


class NutritionalRecommendation(BaseModel):
    focus: str
    recommended: list[str]
    avoid: list[str]
    supplements: list[str]
    hydration_liters: float


class StrategicFocus(BaseModel):
    priority: str
    technique: str
    duration_minutes: int
    description: str
    blocks: int


class SelectionScore(BaseModel):
    protocol_type: ProtocolType
    score: float
    confidence: float
    primary_driver: str
    runners_up: list[str] = []


class AdaptationHints(BaseModel):
    warnings: list[str] = []
    recommendations: list[str] = []
    track_metric: str


class ProtocolResponse(BaseModel):
    user_id: str
    protocol_type: ProtocolType
    variant: int
    energy: int
    stress: int
    focus: int
    available_minutes: int
    mental: MentalPractice
    physical: PhysicalRoutine
    nutritional: NutritionalRecommendation
    strategic_focus: StrategicFocus
    total_minutes: int
    insight: str
    adaptation: AdaptationHints
    selection: SelectionScore


class ProtocolSummary(BaseModel):
    id: int
    protocol_type: ProtocolType
    energy: int
    stress: int
    focus: int
    total_minutes: int
    created_at: str
