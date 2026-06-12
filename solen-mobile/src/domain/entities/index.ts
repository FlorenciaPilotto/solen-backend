// ── CAPA DOMINIO — entidades puras, sin framework ─────────────────
// No importa React, AsyncStorage ni nada externo.

export type RoundActivo = 'round_uno' | 'accion_masiva' | 'integridad_reset' | 'pineal';

export type NivelIdentidad = 'Inercia' | 'Reactivo' | 'Creador' | 'Arquitecto';

export type EstadoFrecuencia = 'supervivencia' | 'neutro' | 'creacion';

export type EmociónDia =
  | 'fuego'      // determinación / certeza
  | 'calma'      // paz / enfoque
  | 'miedo'      // ansiedad / parálisis
  | 'confusion'  // dispersión / duda
  | 'gratitud'   // expansión / bienestar
  | 'furia';     // ira / frustración

export interface FrecuencyState {
  valor: number;                // 0–100
  estado: EstadoFrecuencia;
  protocolo: 'rescate' | 'expansion';
  timestamp: string;
}

export interface IdentityLevel {
  puntos: number;
  nivel: NivelIdentidad;
  racha: number;
  mejorRacha: number;
}

export interface JournalEntry {
  id: string;
  fecha: string;
  emocion: EmociónDia;
  coherencia: number;    // 1–10
  gratitud: string;
  logro: string;
  puntos: number;
}

export interface MeditationSession {
  id: string;
  fecha: string;
  tipo: 'rescate' | 'expansion' | 'coherencia' | 'pineal';
  duracionSegundos: number;
  completada: boolean;
  hzAlcanzado: number;
}

export interface PowerEvent {
  fecha: string;
  tipo: string;
  puntos: number;
  descripcion: string;
}

// ── Reglas de negocio puras ────────────────────────────────────────

/** Determina qué Round está activo según la hora actual */
export function getRoundActivo(hora: number, minuto: number): RoundActivo {
  const mins = hora * 60 + minuto;
  if (mins >= 5 * 60 && mins < 8 * 60)  return 'round_uno';
  if (mins >= 8 * 60 && mins < 18 * 60) return 'accion_masiva';
  if (mins >= 18 * 60 && mins < 22 * 60) return 'integridad_reset';
  return 'pineal';
}

/** Calcula los puntos por abrir la app (más temprano = más puntos) */
export function calcularPuntosApertura(hora: number, minuto: number): number {
  const mins = hora * 60 + minuto;
  const target = 5 * 60; // 5:00 AM
  if (mins < target) return 100; // Antes de las 5 = máximo
  const retraso = mins - target;
  return Math.max(0, 100 - retraso * 5); // -5 pts por minuto
}

/** Calcula el nivel de identidad según los puntos acumulados */
export function calcularNivel(puntos: number): NivelIdentidad {
  if (puntos < 200)  return 'Inercia';
  if (puntos < 600)  return 'Reactivo';
  if (puntos < 1500) return 'Creador';
  return 'Arquitecto';
}

/** Determina el estado y protocolo según el valor del slider */
export function calcularEstadoFrecuencia(valor: number): FrecuencyState {
  let estado: EstadoFrecuencia;
  if (valor < 45)      estado = 'supervivencia';
  else if (valor > 55) estado = 'creacion';
  else                 estado = 'neutro';

  return {
    valor,
    estado,
    protocolo: valor <= 50 ? 'rescate' : 'expansion',
    timestamp: new Date().toISOString(),
  };
}

/** Calcula el color del gradiente dinámico según el valor (0–100) */
export function calcularGradienteColor(valor: number): { r: number; g: number; b: number } {
  // Ámbar (supervivencia): rgb(186, 117, 23)
  // Cian (creación):       rgb(0, 210, 190)
  const t = valor / 100;
  return {
    r: Math.round(186 + (0 - 186) * t),
    g: Math.round(117 + (210 - 117) * t),
    b: Math.round(23 + (190 - 23) * t),
  };
}
