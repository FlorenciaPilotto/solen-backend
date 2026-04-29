"""
Motor de selección de protocolos — lógica pura, sin efectos secundarios.
"""
from __future__ import annotations
import hashlib
from dataclasses import dataclass
from datetime import date
from app.schemas.protocolo import (
    ProtocolType, ProtocolResponse, SelectionScore, AdaptationHints,
    MentalPractice, PhysicalRoutine, NutritionalRecommendation, StrategicFocus,
)
from app.schemas.protocolo import EstadoInput


# ── Scoring ponderado ──────────────────────────────────────────────

def _norm(v: int, lo: int, hi: int) -> float:
    return max(0.0, min(1.0, (v - lo) / (hi - lo)))


RULES = [
    # calma
    (ProtocolType.calma, 0.55, lambda e,s,f: _norm(s, 40, 100), "estrés elevado"),
    (ProtocolType.calma, 0.30, lambda e,s,f: _norm(100-e, 30, 80), "energía baja"),
    (ProtocolType.calma,-0.15, lambda e,s,f: _norm(f, 50, 100), "foco alto (penaliza)"),
    # energia
    (ProtocolType.energia, 0.60, lambda e,s,f: _norm(100-e, 50, 100), "energía baja"),
    (ProtocolType.energia, 0.25, lambda e,s,f: _norm(100-s, 20, 70), "estrés manejable"),
    (ProtocolType.energia,-0.15, lambda e,s,f: _norm(s, 60, 100), "estrés alto (penaliza)"),
    # enfoque
    (ProtocolType.enfoque, 0.50, lambda e,s,f: _norm(100-f, 30, 80), "foco disperso"),
    (ProtocolType.enfoque, 0.30, lambda e,s,f: _norm(e, 35, 70), "energía moderada"),
    (ProtocolType.enfoque, 0.20, lambda e,s,f: _norm(100-s, 30, 70), "estrés moderado"),
    # claridad
    (ProtocolType.claridad, 0.45, lambda e,s,f: _norm(f, 55, 100), "foco alto"),
    (ProtocolType.claridad, 0.35, lambda e,s,f: _norm(e, 40, 75), "energía sostenida"),
    (ProtocolType.claridad, 0.20, lambda e,s,f: _norm(100-s, 50, 85), "estrés bajo"),
    # alto_rendimiento
    (ProtocolType.alto_rendimiento, 0.40, lambda e,s,f: _norm(e, 60, 100), "energía alta"),
    (ProtocolType.alto_rendimiento, 0.35, lambda e,s,f: _norm(f, 60, 100), "foco alto"),
    (ProtocolType.alto_rendimiento, 0.25, lambda e,s,f: _norm(100-s, 65, 100), "estrés bajo"),
]


def select_protocol(energy: int, stress: int, focus: int) -> SelectionScore:
    scores: dict[ProtocolType, float] = {t: 0.0 for t in ProtocolType}
    weights: dict[ProtocolType, float] = {t: 0.0 for t in ProtocolType}
    drivers: dict[ProtocolType, str] = {}

    for ptype, weight, fn, label in RULES:
        raw = fn(energy, stress, focus)
        contrib = raw * abs(weight)
        scores[ptype] += contrib if weight > 0 else -contrib
        weights[ptype] += abs(weight)
        if weight > 0 and ptype not in drivers:
            drivers[ptype] = label

    normalized = {t: max(0.0, round((scores[t] / weights[t]) * 100, 1)) for t in ProtocolType}
    ranked = sorted(normalized.items(), key=lambda x: x[1], reverse=True)
    winner, top_score = ranked[0]
    gap = top_score - ranked[1][1] if len(ranked) > 1 else top_score

    return SelectionScore(
        protocol_type=winner,
        score=top_score,
        confidence=min(1.0, round(gap / 40, 2)),
        primary_driver=drivers.get(winner, "estado general"),
        runners_up=[f"{t.value} ({s:.0f}pts)" for t, s in ranked[1:3] if s > 20],
    )


# ── Catálogo simplificado (1 variante por tipo) ────────────────────

@dataclass(frozen=True)
class ProtocolDef:
    insight: str
    mental: MentalPractice
    physical: PhysicalRoutine
    nutritional: NutritionalRecommendation
    strategic_focus: StrategicFocus


CATALOG: dict[ProtocolType, list[ProtocolDef]] = {
    ProtocolType.calma: [
        ProtocolDef(
            insight="Tu sistema nervioso necesita regulación antes que rendimiento. Restaurar el piso hoy es la mejor inversión para mañana.",
            mental=MentalPractice(name="Meditación de compasión", description="Cultivar autocompasión para reducir el estrés.", duration_minutes=20, technique="Metta bhavana en 4 etapas"),
            physical=PhysicalRoutine(name="Movilidad restaurativa", description="Secuencia suave para liberar tensión.", duration_minutes=20, intensity="low", exercises=["Cat-cow 2x10", "Hip flexor stretch 2x45s", "Child's pose 3x30s"]),
            nutritional=NutritionalRecommendation(focus="Anti-inflamatorio y regulación del cortisol", recommended=["Salmón", "Arroz integral", "Arándanos"], avoid=["Café en exceso", "Azúcar refinada"], supplements=["Ashwagandha 600mg", "Magnesio glicinato 400mg"], hydration_liters=3.0),
            strategic_focus=StrategicFocus(priority="Reducir carga cognitiva al mínimo", technique="Pomodoro 20/5", duration_minutes=60, description="Solo 1 tarea. Máximo 3 ciclos.", blocks=3),
        ),
        ProtocolDef(
            insight="El estrés no se combate con más esfuerzo. Se transforma con presencia y movimiento suave.",
            mental=MentalPractice(name="Body scan MBSR", description="Recorrer el cuerpo para liberar tensión.", duration_minutes=25, technique="Escaneo de pies a cabeza, 30s por zona"),
            physical=PhysicalRoutine(name="Yin Yoga restaurativo", description="Posturas pasivas de 3-5 minutos.", duration_minutes=30, intensity="low", exercises=["Mariposa 4 min", "Dragon 3 min por lado", "Savasana 5 min"]),
            nutritional=NutritionalRecommendation(focus="Adaptógenos y neuroprotección", recommended=["Caldo de huesos", "Nueces de Brasil", "Té de manzanilla"], avoid=["Cafeína", "Azúcares simples"], supplements=["Rhodiola 400mg", "Omega-3 2g"], hydration_liters=3.0),
            strategic_focus=StrategicFocus(priority="Una sola tarea de mínimo impacto", technique="Single Tasking", duration_minutes=45, description="Elegir la tarea más pequeña con impacto. Completarla y parar.", blocks=2),
        ),
        ProtocolDef(
            insight="Hoy el cuerpo habla más fuerte que la agenda. Escucharlo es la mejor decisión estratégica.",
            mental=MentalPractice(name="Respiración coherente 5-5", description="Sincronizar el sistema nervioso autónomo.", duration_minutes=15, technique="5s inhalar · 5s exhalar, 15 min"),
            physical=PhysicalRoutine(name="Caminata contemplativa", description="Caminar lento sin auriculares. Atención al entorno.", duration_minutes=30, intensity="low", exercises=["Caminata 25 min", "Respiración nasal", "Pausas de observación cada 5 min"]),
            nutritional=NutritionalRecommendation(focus="Regulación hormonal y microbioma", recommended=["Yogur natural", "Sopa de miso", "Banana"], avoid=["Alcohol", "Azúcar", "Cafeína después del mediodía"], supplements=["Probióticos", "GABA 500mg"], hydration_liters=2.5),
            strategic_focus=StrategicFocus(priority="GTD: capturar y clarificar pendientes", technique="GTD Capture & Clarify", duration_minutes=45, description="Volcar TODO en papel. Clasificar, no ejecutar.", blocks=2),
        ),
    ],
    ProtocolType.energia: [
        ProtocolDef(
            insight="Tu cuerpo necesita activación. El movimiento es el mejor activador natural antes de cafeína.",
            mental=MentalPractice(name="Respiración Wim Hof", description="30 respiraciones + retención. Activa el sistema simpático.", duration_minutes=15, technique="30 resp profundas + retención 60s × 3 rondas"),
            physical=PhysicalRoutine(name="Activación metabólica", description="Circuito para despertar el metabolismo.", duration_minutes=25, intensity="medium", exercises=["Jumping jacks 3x30", "Bodyweight squats 3x15", "Push-ups 3x10", "High knees 3x20s"]),
            nutritional=NutritionalRecommendation(focus="Energía sostenida sin pico glucémico", recommended=["Café + L-Teanina", "Huevos con aguacate", "Avena con proteína"], avoid=["Carbohidratos simples en ayunas", "Jugos de fruta"], supplements=["Cafeína 100mg + L-Teanina 200mg", "B12", "CoQ10 100mg"], hydration_liters=2.5),
            strategic_focus=StrategicFocus(priority="Tareas operativas de alto volumen", technique="Time boxing", duration_minutes=75, description="Empezar por ejecución directa. No trabajo creativo.", blocks=3),
        ),
        ProtocolDef(
            insight="La energía no aparece esperándola. Se genera con movimiento, luz y respiración.",
            mental=MentalPractice(name="Cold exposure + visualización", description="Ducha fría + visualización de un logro reciente.", duration_minutes=10, technique="Cold shower 2 min + power posing + visualización 5 min"),
            physical=PhysicalRoutine(name="HIIT de baja intensidad", description="Intervalos cortos para activar sin agotar.", duration_minutes=20, intensity="medium", exercises=["Burpees suaves 3x8", "Mountain climbers 3x20s", "Jump rope 3x30s", "Cool-down 3 min"]),
            nutritional=NutritionalRecommendation(focus="Activación adrenal y dopamina", recommended=["Proteína whey 30g", "Batata asada", "Arándanos"], avoid=["Comidas pesadas", "Alcohol"], supplements=["Tyrosina 500mg", "Vitamina D3 4000IU"], hydration_liters=2.5),
            strategic_focus=StrategicFocus(priority="Tareas atrasadas con impulso", technique="Eat the frog", duration_minutes=60, description="Empezar por lo que más postergaste.", blocks=3),
        ),
        ProtocolDef(
            insight="Antes de buscar más energía afuera, verificá si hay algo bloqueándola adentro.",
            mental=MentalPractice(name="Bhastrika pranayama", description="Respiración de fuelle para activar el fuego interior.", duration_minutes=12, technique="Respiraciones de fuelle 3x + visualización 5 min"),
            physical=PhysicalRoutine(name="Surya Namaskar dinámico", description="12 rondas de saludo al sol.", duration_minutes=20, intensity="medium", exercises=["Saludo al sol A x6", "Saludo al sol B x6", "Savasana activa 2 min"]),
            nutritional=NutritionalRecommendation(focus="Mitocondrias y producción de ATP", recommended=["Carne roja magra", "Remolacha", "Cacao puro", "Agua con sal del Himalaya"], avoid=["Ayuno prolongado", "Alcohol"], supplements=["CoQ10 200mg", "B-Complex activado"], hydration_liters=2.5),
            strategic_focus=StrategicFocus(priority="Completar tareas atrasadas", technique="Bullet journal diario", duration_minutes=60, description="Lista de 3 tareas más importantes. Checkear cada una.", blocks=2),
        ),
    ],
    ProtocolType.enfoque: [
        ProtocolDef(
            insight="Tenés energía pero el foco está disperso. El objetivo es crear condiciones para el flujo.",
            mental=MentalPractice(name="Shamatha", description="Foco en un único punto. Entrena el músculo de la atención.", duration_minutes=20, technique="Concentración en respiración + mantra 'Aquí. Ahora.'"),
            physical=PhysicalRoutine(name="Cardio Zona 2", description="Cardio aeróbico con respiración nasal. Aumenta el BDNF.", duration_minutes=30, intensity="medium", exercises=["Trote suave 22 min", "Respiración nasal exclusiva", "Caminata cierre 5 min", "Estiramiento 3 min"]),
            nutritional=NutritionalRecommendation(focus="Neurotransmisores y rendimiento cognitivo", recommended=["Proteína magra", "Omega-3", "Verduras de hoja verde", "Matcha"], avoid=["Carbohidratos simples", "Comidas abundantes", "Alcohol"], supplements=["Lion's Mane 500mg", "Bacopa 300mg", "Omega-3 2g"], hydration_liters=2.5),
            strategic_focus=StrategicFocus(priority="Deep work en la tarea de mayor impacto", technique="Newport Deep Work", duration_minutes=90, description="Una tarea de alto apalancamiento. Sin notificaciones.", blocks=1),
        ),
        ProtocolDef(
            insight="El foco no se fuerza, se cultiva. Crea las condiciones y aparece solo.",
            mental=MentalPractice(name="Open Monitoring", description="Observar pensamientos sin engancharse. Metacognición.", duration_minutes=18, technique="Observación desapegada + etiquetado de pensamientos"),
            physical=PhysicalRoutine(name="Yoga de balance", description="Posturas que requieren concentración total.", duration_minutes=25, intensity="low-medium", exercises=["Tree pose 3x45s", "Warrior III 2x30s", "Eagle pose 2x30s", "Crow pose 5 min"]),
            nutritional=NutritionalRecommendation(focus="Acetilcolina y memoria de trabajo", recommended=["Huevos", "Brócoli", "Semillas de girasol", "Café con MCT"], avoid=["Gluten en exceso", "Comidas grasosas"], supplements=["Alpha-GPC 300mg", "Citicolina 250mg", "Zinc 25mg"], hydration_liters=2.5),
            strategic_focus=StrategicFocus(priority="Proyecto creativo o análisis profundo", technique="Pomodoro 45/15", duration_minutes=90, description="Bloques de 45 min. Descanso real sin pantalla.", blocks=2),
        ),
        ProtocolDef(
            insight="Un entorno sin distracciones vale más que cualquier técnica de concentración.",
            mental=MentalPractice(name="Setting intention", description="Establecer intención del día con claridad total.", duration_minutes=15, technique="5 min quietud + 5 min visualización + 5 min declaración"),
            physical=PhysicalRoutine(name="Caminata de atención plena", description="Atención total a cada paso. Entrena presencia.", duration_minutes=25, intensity="low", exercises=["Caminata lenta 20 min", "Contar pasos 1-10", "Escaneo sensorial cada 5 min"]),
            nutritional=NutritionalRecommendation(focus="Glucosa cerebral estable", recommended=["Frutas de bajo IG", "Almendras", "Chocolate 85%", "Agua con limón"], avoid=["Carbohidratos simples", "Cafeína >2 tazas"], supplements=["L-Teanina 200mg", "Magnesio malato 300mg"], hydration_liters=2.5),
            strategic_focus=StrategicFocus(priority="Reducir lista a lo esencial", technique="MIT + time blocking", duration_minutes=75, description="3 tareas más importantes. Bloques de tiempo fijos.", blocks=3),
        ),
    ],
    ProtocolType.claridad: [
        ProtocolDef(
            insight="Estado ideal para decisiones importantes. Tu mente está receptiva — usala para lo que más importa.",
            mental=MentalPractice(name="Visualización + journaling", description="Visualizar objetivos + escritura libre.", duration_minutes=25, technique="Visualización Alpha 10 min + escritura libre 10 min"),
            physical=PhysicalRoutine(name="Yoga funcional", description="Fuerza, movilidad y respiración. Mantiene la claridad.", duration_minutes=30, intensity="low-medium", exercises=["Saludo al sol A x5", "Warrior I y II 2x45s", "Tree pose 2x30s", "Savasana 5 min"]),
            nutritional=NutritionalRecommendation(focus="Claridad mental y balance hormonal", recommended=["Ensalada con proteína", "Nueces", "Matcha", "Agua con limón"], avoid=["Comidas inflamatorias", "Exceso cafeína", "Azúcares"], supplements=["Omega-3 2g", "Vitamina D3 4000IU", "Zinc 25mg"], hydration_liters=2.5),
            strategic_focus=StrategicFocus(priority="Toma de decisiones estratégicas", technique="Strategic thinking blocks", duration_minutes=120, description="Reservar para decisiones de alto impacto.", blocks=2),
        ),
        ProtocolDef(
            insight="Con claridad, la calidad de una decisión supera el trabajo de una semana.",
            mental=MentalPractice(name="Open Monitoring profundo", description="Observar sin dirigir. Activa el modo default network.", duration_minutes=20, technique="Observación sin juicio, sin foco, presencia pura"),
            physical=PhysicalRoutine(name="Pilates de core", description="Core y movilidad espinal. Activa circulación al cerebro.", duration_minutes=25, intensity="low-medium", exercises=["The Hundred 2x", "Roll up 3x10", "Leg circles 2x10", "Swan 3x8"]),
            nutritional=NutritionalRecommendation(focus="Neuroprotección y pensamiento largo plazo", recommended=["Salmón", "Aguacate", "Arándanos", "Cacao puro"], avoid=["Azúcar", "Harinas refinadas"], supplements=["NMN 250mg", "Resveratrol 500mg"], hydration_liters=2.5),
            strategic_focus=StrategicFocus(priority="Weekly review + OKR alignment", technique="Revisión semanal", duration_minutes=90, description="Progreso de objetivos. Cuellos de botella. Top 3 semana siguiente.", blocks=2),
        ),
        ProtocolDef(
            insight="La claridad no es la ausencia de dudas. Es la capacidad de actuar a pesar de ellas.",
            mental=MentalPractice(name="Journaling 10/10/10", description="Perspectiva en 3 horizontes temporales.", duration_minutes=20, technique="Qué siento ahora · en 10 min · en 10 años"),
            physical=PhysicalRoutine(name="Stretching activo", description="Stretching dinámico con respiración.", duration_minutes=20, intensity="low", exercises=["Hip circles 2x10", "Spinal twist 2x8", "Pigeon pose 3 min por lado", "Supine twist 2 min"]),
            nutritional=NutritionalRecommendation(focus="Serotonina y bienestar cognitivo", recommended=["Pavo (triptófano)", "Quínoa", "Espinaca", "Leche de almendras con cúrcuma"], avoid=["Ayuno prolongado", "Cafeína en exceso"], supplements=["5-HTP 100mg", "Magnesio glicinato 400mg"], hydration_liters=2.5),
            strategic_focus=StrategicFocus(priority="Mapa de decisiones pendientes", technique="Decision matrix", duration_minutes=90, description="Clasificar por urgencia e importancia. Documentar razonamiento.", blocks=2),
        ),
    ],
    ProtocolType.alto_rendimiento: [
        ProtocolDef(
            insight="Condiciones óptimas. Hoy ejecutás lo que más importa. Protegé este estado.",
            mental=MentalPractice(name="Priming de activación", description="Respiración + gratitud + intención. Activa el estado pico.", duration_minutes=20, technique="3 min respiración + 3 min gratitud + 3 min intención"),
            physical=PhysicalRoutine(name="Fuerza funcional", description="Compound movements para maximizar testosterona y dopamina.", duration_minutes=45, intensity="high", exercises=["Sentadilla 4x6 (80% 1RM)", "Press banca 4x6", "Peso muerto 3x5", "Pull-ups 3x max"]),
            nutritional=NutritionalRecommendation(focus="Maximizar rendimiento cognitivo y físico", recommended=["Proteína 40g post-entreno", "Arroz integral", "Aguacate", "Caldo de huesos"], avoid=["Alimentos inflamatorios", "Alcohol", "Azúcar refinada"], supplements=["Creatina 5g", "Whey 40g", "Rhodiola 400mg"], hydration_liters=3.0),
            strategic_focus=StrategicFocus(priority="Proyecto de máximo impacto", technique="Flow state 90-min blocks", duration_minutes=180, description="Bloques de 90 min. Sin reuniones antes de 12hs. Solo lo que mueve la aguja.", blocks=2),
        ),
        ProtocolDef(
            insight="Los días pico son raros. Cuando aparecen, el trabajo de 1 día vale el de una semana.",
            mental=MentalPractice(name="Meditación de alta vibración", description="Gratitud + afirmaciones + flow anchoring.", duration_minutes=15, technique="Gratitud 5 min + afirmaciones 5 min + flow anchor 5 min"),
            physical=PhysicalRoutine(name="Sprint intervals + fuerza explosiva", description="HIIT de alta intensidad. Solo para energía real alta.", duration_minutes=35, intensity="high", exercises=["Sprint 30s × 8 rondas", "Box jumps 3x10", "Kettlebell swings 3x15", "Cool-down 5 min"]),
            nutritional=NutritionalRecommendation(focus="Anabolismo y función cognitiva pico", recommended=["Pre-entreno: banana + café", "Post-entreno: whey + arroz 100g", "Carne magra + verduras"], avoid=["Comidas procesadas", "Alcohol", "Azúcar"], supplements=["Beta-alanina 3.2g", "Creatina 5g", "Ashwagandha 600mg"], hydration_liters=3.5),
            strategic_focus=StrategicFocus(priority="Breakthrough en proyecto ambicioso", technique="Maker's schedule sprint", duration_minutes=180, description="Un solo proyecto todo el día. Maker's schedule (Paul Graham).", blocks=2),
        ),
        ProtocolDef(
            insight="Hoy sos la mejor versión de vos mismo. No desperdicies eso en lo ordinario.",
            mental=MentalPractice(name="Meditación de propósito", description="Reconectar con el por qué antes de ejecutar.", duration_minutes=18, technique="Ikigai meditation: 4 preguntas + visualización"),
            physical=PhysicalRoutine(name="Fuerza élite + movilidad", description="Sesión completa de fuerza con movilidad integrada.", duration_minutes=50, intensity="high", exercises=["Sentadilla frontal 4x5", "Dominadas con lastre 3x6", "Press militar 4x6", "Renegade rows 3x8", "Movilidad torácica 5 min"]),
            nutritional=NutritionalRecommendation(focus="Longevidad del rendimiento", recommended=["Salmón salvaje", "Arroz basmati", "Arándanos", "Colágeno + caldo de huesos"], avoid=["Cualquier cosa inflamatoria", "Alcohol esta noche"], supplements=["NMN 250mg", "Colágeno 10g", "Omega-3 3g"], hydration_liters=3.0),
            strategic_focus=StrategicFocus(priority="Decisión estratégica de mayor impacto", technique="CEO thinking + second-order effects", duration_minutes=150, description="Cuál es la decisión que genera más impacto en 90 días. Documentar razonamiento completo.", blocks=2),
        ),
    ],
}


def _select_variant(user_id: str, protocol_type: ProtocolType) -> int:
    seed = f"{user_id}:{protocol_type.value}:{date.today().isoformat()}"
    return int(hashlib.md5(seed.encode()).hexdigest(), 16) % len(CATALOG[protocol_type])


def _build_hints(energy: int, stress: int, focus: int, ptype: ProtocolType) -> AdaptationHints:
    warnings, recommendations = [], []

    if stress >= 80:
        warnings.append("Estrés en nivel crítico (≥80). Considerá hablar con alguien de confianza hoy.")
    elif stress >= 65:
        warnings.append("Estrés elevado. Evitar decisiones importantes que no sean urgentes.")
    if energy <= 20:
        warnings.append("Energía muy baja. Verificar calidad del sueño y niveles de hierro/B12.")
    if stress >= 65 and energy <= 35:
        warnings.append("Estrés alto + energía baja: riesgo de burnout. Priorizá recuperación.")

    if ptype == ProtocolType.alto_rendimiento:
        recommendations.append("Protegé las primeras 3hs de la mañana de reuniones y emails.")
    elif ptype == ProtocolType.calma:
        recommendations.append("Apagar notificaciones no urgentes hasta las 14hs.")
    elif ptype == ProtocolType.enfoque:
        recommendations.append("Configurar modo No Molestar durante los bloques.")

    track_metrics = {
        ProtocolType.calma: "Nivel de estrés percibido (1-10) antes y después de cada práctica",
        ProtocolType.energia: "Energía subjetiva cada 2hs",
        ProtocolType.enfoque: "Minutos de foco sostenido en el primer bloque (target: > 25 min)",
        ProtocolType.claridad: "Calidad y seguridad de las decisiones tomadas",
        ProtocolType.alto_rendimiento: "¿Completaste la tarea principal? ¿Entraste en estado de flujo?",
    }

    return AdaptationHints(warnings=warnings, recommendations=recommendations, track_metric=track_metrics[ptype])


def build_protocol(user_id: str, state: EstadoInput) -> ProtocolResponse:
    selection = select_protocol(state.energy, state.stress, state.focus)
    ptype = selection.protocol_type
    variant_idx = _select_variant(user_id, ptype)
    definition = CATALOG[ptype][variant_idx]
    hints = _build_hints(state.energy, state.stress, state.focus, ptype)

    total = (
        definition.mental.duration_minutes
        + definition.physical.duration_minutes
        + definition.strategic_focus.duration_minutes
    )

    return ProtocolResponse(
        user_id=user_id,
        protocol_type=ptype,
        variant=variant_idx,
        energy=state.energy,
        stress=state.stress,
        focus=state.focus,
        available_minutes=state.available_minutes,
        mental=definition.mental,
        physical=definition.physical,
        nutritional=definition.nutritional,
        strategic_focus=definition.strategic_focus,
        total_minutes=total,
        insight=definition.insight,
        adaptation=hints,
        selection=selection,
    )
