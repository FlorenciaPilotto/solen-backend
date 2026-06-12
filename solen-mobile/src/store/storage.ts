import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PoderIdentidad, RoundsDelDia, JournalEntry, BreathingSession,
  AccionMasivaSession, PUNTOS, PuntoEvento,
} from '../models';

const KEYS = {
  PODER:   'solen:poder_identidad',
  ROUNDS:  'solen:rounds',        // prefijo + fecha
  JOURNAL: 'solen:journal',       // prefijo + fecha
  BREATH:  'solen:breathing',     // prefijo + fecha
  ACCION:  'solen:accion_masiva', // prefijo + fecha
  PREFS:   'solen:prefs',
} as const;

// ── Helpers ───────────────────────────────────────────────────────

async function get<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

async function set(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Poder de Identidad ───────────────────────────────────────────

const PODER_DEFAULT: PoderIdentidad = {
  total: 0, nivel: 0, historial: [], racha: 0, mejorRacha: 0,
};

export async function getPoder(): Promise<PoderIdentidad> {
  return (await get<PoderIdentidad>(KEYS.PODER)) ?? PODER_DEFAULT;
}

export async function addPuntos(tipo: string, puntos: number, descripcion: string): Promise<PoderIdentidad> {
  const poder = await getPoder();
  const evento: PuntoEvento = {
    fecha: new Date().toISOString(), tipo, puntos, descripcion,
  };
  const updated: PoderIdentidad = {
    ...poder,
    total: poder.total + puntos,
    nivel: Math.floor((poder.total + puntos) / 100),
    historial: [evento, ...poder.historial].slice(0, 100),
  };
  await set(KEYS.PODER, updated);
  return updated;
}

// ── Rounds del día ───────────────────────────────────────────────

export async function getRoundsHoy(): Promise<RoundsDelDia | null> {
  return get<RoundsDelDia>(`${KEYS.ROUNDS}:${todayStr()}`);
}

export async function activarRoundUno(): Promise<{ puntos: number; racha: number }> {
  const now = new Date();
  const hora = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const [h, m] = hora.split(':').map(Number);
  const minutos = h * 60 + m;

  let puntos: number;
  if (minutos <= 5 * 60)           puntos = PUNTOS.ROUND_UNO_5AM;
  else if (minutos <= 5 * 60 + 15) puntos = PUNTOS.ROUND_UNO_5_15;
  else if (minutos <= 5 * 60 + 30) puntos = PUNTOS.ROUND_UNO_5_30;
  else                              puntos = PUNTOS.ROUND_UNO_TARDE;

  const today = todayStr();
  const existing = await getRoundsHoy();
  const rounds: RoundsDelDia = existing ?? {
    fecha: today,
    roundUnoActivado: false,
    rounds: [],
  };
  rounds.roundUnoActivado = true;
  rounds.roundUnoHora = hora;

  await set(`${KEYS.ROUNDS}:${today}`, rounds);

  // Actualizar racha
  const poder = await getPoder();
  const ayer = new Date(now);
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().split('T')[0];
  const roundsAyer = await get<RoundsDelDia>(`${KEYS.ROUNDS}:${ayerStr}`);
  const nuevaRacha = roundsAyer?.roundUnoActivado ? poder.racha + 1 : 1;
  const mejorRacha = Math.max(nuevaRacha, poder.mejorRacha);

  await addPuntos('ROUND_UNO', puntos, `Round Uno activado a las ${hora}`);
  const updatedPoder = await getPoder();
  await set(KEYS.PODER, { ...updatedPoder, racha: nuevaRacha, mejorRacha });

  return { puntos, racha: nuevaRacha };
}

export async function roundUnoActivo(): Promise<boolean> {
  const rounds = await getRoundsHoy();
  return rounds?.roundUnoActivado ?? false;
}

export async function debeBloquear(): Promise<boolean> {
  const now = new Date();
  const minutos = now.getHours() * 60 + now.getMinutes();
  if (minutos < 5 * 60 + 30) return false; // Antes de las 5:30, no bloquear
  const activo = await roundUnoActivo();
  return !activo;
}

// ── Journal ──────────────────────────────────────────────────────

export async function getJournalHoy(): Promise<JournalEntry | null> {
  return get<JournalEntry>(`${KEYS.JOURNAL}:${todayStr()}`);
}

export async function saveJournal(entry: Omit<JournalEntry, 'id' | 'fecha' | 'puntosGanados'>): Promise<JournalEntry> {
  const puntos = PUNTOS.JOURNAL + (entry.coherencia >= 8 ? PUNTOS.COHERENCIA_ALTA : 0);
  const full: JournalEntry = {
    ...entry,
    id: `j_${Date.now()}`,
    fecha: todayStr(),
    puntosGanados: puntos,
  };
  await set(`${KEYS.JOURNAL}:${todayStr()}`, full);
  await addPuntos('JOURNAL', puntos, `Journal completado · Coherencia ${entry.coherencia}/10`);
  return full;
}

export async function getJournalHistorial(days = 30): Promise<JournalEntry[]> {
  const entries: JournalEntry[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = await get<JournalEntry>(`${KEYS.JOURNAL}:${dateStr}`);
    if (entry) entries.push(entry);
  }
  return entries;
}

// ── Breathing Sessions ───────────────────────────────────────────

export async function saveBreathingSession(session: Omit<BreathingSession, 'id' | 'fecha' | 'puntosGanados'>): Promise<BreathingSession> {
  const puntos = PUNTOS.RESPIRACION;
  const full: BreathingSession = {
    ...session,
    id: `b_${Date.now()}`,
    fecha: todayStr(),
    puntosGanados: puntos,
  };
  const key = `${KEYS.BREATH}:${todayStr()}:${full.id}`;
  await set(key, full);
  await addPuntos('RESPIRACION', puntos, `${session.protocolo} · ${session.ciclosCompletados} ciclos`);
  return full;
}

// ── Acción Masiva ────────────────────────────────────────────────

export async function startAccionMasiva(tarea: string): Promise<AccionMasivaSession> {
  const session: AccionMasivaSession = {
    id: `am_${Date.now()}`,
    fecha: todayStr(),
    iniciado: new Date().toISOString(),
    completado: false,
    duracionMinutos: 90,
    tarea,
    puntosGanados: 0,
  };
  await set(`${KEYS.ACCION}:${todayStr()}`, session);
  return session;
}

export async function completeAccionMasiva(): Promise<void> {
  const key = `${KEYS.ACCION}:${todayStr()}`;
  const session = await get<AccionMasivaSession>(key);
  if (!session) return;
  session.completado = true;
  session.puntosGanados = PUNTOS.ACCION_MASIVA;
  await set(key, session);
  await addPuntos('ACCION_MASIVA', PUNTOS.ACCION_MASIVA, `Acción Masiva completada: ${session.tarea}`);
}

export async function getAccionMasivaHoy(): Promise<AccionMasivaSession | null> {
  return get<AccionMasivaSession>(`${KEYS.ACCION}:${todayStr()}`);
}
