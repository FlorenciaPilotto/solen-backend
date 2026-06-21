// ── Estado del usuario ────────────────────────────────────────────

export type EstadoMode = 'supervivencia' | 'neutro' | 'creacion';

export interface EstadoDia {
  valor: number;        // 0–100
  modo: EstadoMode;
  timestamp: string;
}

export function calcularModo(valor: number): EstadoMode {
  if (valor < 45) return 'supervivencia';
  if (valor > 55) return 'creacion';
  return 'neutro';
}

// ── Sistema de Rounds ────────────────────────────────────────────

export type RoundId = 'round_uno' | 'round_dos' | 'round_tres';

export interface Round {
  id: RoundId;
  label: string;
  descripcion: string;
  horaTarget: string;   // 'HH:MM'
  completado: boolean;
  completadoAt?: string;
  puntosIdentidad: number;
}

export interface RoundsDelDia {
  fecha: string;        // 'YYYY-MM-DD'
  roundUnoActivado: boolean;
  roundUnoHora?: string;
  rounds: Round[];
}

// ── Journal de Integridad ────────────────────────────────────────

export interface JournalEntry {
  id: string;
  fecha: string;
  coherencia: number;           // 1–10
  gatillo: 'ninguno' | 'pereza' | 'miedo' | 'estrategia';
  textoCoherencia: string;      // pregunta 1: coincidencia claridad vs acción
  textoGratitud: string;        // pregunta 2: regalo del día
  textoCierre: string;          // pregunta 3: acción que confirma identidad nueva
  modoDominante: EstadoMode;
  puntosGanados: number;
}

// ── Journal de Inicio (mañana) ───────────────────────────────────

export interface MorningJournalEntry {
  id: string;
  fecha: string;
  energia: number;        // 0–100
  intencion: string;
  identidad: string;
  puntosGanados: number;
}

// ── Sesiones de respiración ──────────────────────────────────────

export type ProtocoloRespiracion = 'rescate' | 'expansion' | 'coherencia' | 'pineal';

export interface BreathingSession {
  id: string;
  fecha: string;
  protocolo: ProtocoloRespiracion;
  ciclosCompletados: number;
  duracionSegundos: number;
  hzAlcanzado: number;
  estado: EstadoMode;
  puntosGanados: number;
}

// ── Acción Masiva (bloque 90 min) ────────────────────────────────

export interface AccionMasivaSession {
  id: string;
  fecha: string;
  iniciado: string;
  completado: boolean;
  duracionMinutos: number;      // 90 por defecto
  tarea: string;
  puntosGanados: number;
}

// ── Poder de Identidad (puntos locales) ─────────────────────────

export interface PoderIdentidad {
  total: number;
  nivel: number;                // total / 100
  historial: PuntoEvento[];
  racha: number;                // días seguidos con Round Uno
  mejorRacha: number;
}

export interface PuntoEvento {
  fecha: string;
  tipo: string;
  puntos: number;
  descripcion: string;
}

export const PUNTOS = {
  ROUND_UNO_5AM:   50,   // Antes de las 5:00
  ROUND_UNO_5_15:  30,   // 5:00 – 5:15
  ROUND_UNO_5_30:  15,   // 5:15 – 5:30
  ROUND_UNO_TARDE:  5,   // Después de las 5:30
  MEDITACION:      20,
  RESPIRACION:     15,
  GYM_FALLO:       25,   // Estudio del dolor
  MORNING_JOURNAL: 10,
  JOURNAL:         20,
  COHERENCIA_ALTA: 10,   // Coherencia >= 8
  ACCION_MASIVA:   40,
} as const;

// ── Notificaciones ───────────────────────────────────────────────

export interface NotificacionConfig {
  id: string;
  hora: string;
  titulo: string;
  cuerpo: string;
  activa: boolean;
  tipo: 'latigo' | 'suave';
}

export const NOTIFICACIONES_DEFAULT: NotificacionConfig[] = [
  {id:'n1', hora:'05:00', titulo:'Solen', cuerpo:'¿Vas a escuchar a tu debilidad o a tu voluntad? El Round Uno no negocia. Movete.', activa:true, tipo:'latigo'},
  {id:'n2', hora:'09:00', titulo:'Solen · Bloque de trabajo', cuerpo:'Si sabés qué hacer y no lo hacés, estás destruyendo tu autoestima. Ejecutá ahora.', activa:true, tipo:'latigo'},
  {id:'n3', hora:'17:00', titulo:'Solen · Reset', cuerpo:'Tu energía está cayendo. 10 min de cardio para resetear la química. No seas un civil.', activa:true, tipo:'latigo'},
  {id:'n4', hora:'22:00', titulo:'Solen · Round Tres', cuerpo:'El día se cierra. Tu antena se enciende. Activación Pineal en 5 minutos.', activa:true, tipo:'suave'},
];
