/**
 * IdentityManager — Caso de uso principal de Solen.
 *
 * Gestiona el sistema de "Poder de Identidad":
 * - calculatePowerPoints(): calcula y otorga puntos por cada acción
 * - Niveles: Inercia → Reactivo → Creador → Arquitecto
 * - Persistencia delegada al repositorio (Data layer)
 */

import {
  calcularPuntosApertura, calcularNivel,
  IdentityLevel, PowerEvent, NivelIdentidad,
} from '../entities';

export interface IIdentityRepository {
  getIdentityLevel(): Promise<IdentityLevel>;
  saveIdentityLevel(level: IdentityLevel): Promise<void>;
  getHistory(): Promise<PowerEvent[]>;
  addEvent(event: PowerEvent): Promise<void>;
  getRachaData(): Promise<{ racha: number; mejorRacha: number; lastDate: string | null }>;
  setRachaData(racha: number, mejorRacha: number, lastDate: string): Promise<void>;
}

export class IdentityManager {
  constructor(private repo: IIdentityRepository) {}

  // ── Obtener estado actual ────────────────────────────────────────

  async getLevel(): Promise<IdentityLevel> {
    return this.repo.getIdentityLevel();
  }

  async getHistory(limit = 30): Promise<PowerEvent[]> {
    const all = await this.repo.getHistory();
    return all.slice(0, limit);
  }

  // ── Otorgar puntos ───────────────────────────────────────────────

  /**
   * calculatePowerPoints — función principal.
   * Otorga puntos según la hora de apertura del Round Uno.
   * Si es 05:00 AM = 100 pts. Cada minuto de retraso resta 5 pts.
   */
  async calculatePowerPoints(hora: number, minuto: number): Promise<{ puntos: number; evento: PowerEvent }> {
    const puntos = calcularPuntosApertura(hora, minuto);
    const evento = await this._otorgar(
      'APERTURA',
      puntos,
      `Round Uno a las ${String(hora).padStart(2,'0')}:${String(minuto).padStart(2,'0')}`,
    );
    await this._actualizarRacha();
    return { puntos, evento };
  }

  async puntosJournal(coherencia: number): Promise<{ puntos: number; evento: PowerEvent }> {
    const base = 20;
    const bonus = coherencia >= 8 ? 10 : 0;
    const puntos = base + bonus;
    const evento = await this._otorgar(
      'JOURNAL',
      puntos,
      `Journal nocturno · Coherencia ${coherencia}/10${bonus ? ' +bonus alta coherencia' : ''}`,
    );
    return { puntos, evento };
  }

  async puntosAccionMasiva(minutosCompletados: number): Promise<{ puntos: number; evento: PowerEvent }> {
    // 40 pts si completa 90 min, proporcional si menos
    const puntos = Math.round((minutosCompletados / 90) * 40);
    const evento = await this._otorgar(
      'ACCION_MASIVA',
      puntos,
      `Acción Masiva · ${minutosCompletados} min completados`,
    );
    return { puntos, evento };
  }

  async puntosMeditacion(tipo: string, completada: boolean): Promise<{ puntos: number; evento: PowerEvent }> {
    const puntos = completada ? 15 : 5;
    const evento = await this._otorgar(
      'MEDITACION',
      puntos,
      `${tipo} · ${completada ? 'completada' : 'parcial'}`,
    );
    return { puntos, evento };
  }

  async puntosGymFallo(): Promise<{ puntos: number; evento: PowerEvent }> {
    // "Estudio del dolor" — mayor gratificación diferida
    const evento = await this._otorgar('GYM_FALLO', 25, 'Llegó al fallo · Estudio del dolor');
    return { puntos: 25, evento };
  }

  // ── Helpers privados ─────────────────────────────────────────────

  private async _otorgar(tipo: string, puntos: number, descripcion: string): Promise<PowerEvent> {
    const evento: PowerEvent = {
      fecha: new Date().toISOString(),
      tipo, puntos, descripcion,
    };
    await this.repo.addEvent(evento);

    const level = await this.repo.getIdentityLevel();
    const nuevoTotal = level.puntos + puntos;
    const nuevoNivel = calcularNivel(nuevoTotal);
    await this.repo.saveIdentityLevel({ ...level, puntos: nuevoTotal, nivel: nuevoNivel });

    return evento;
  }

  private async _actualizarRacha(): Promise<void> {
    const { racha, mejorRacha, lastDate } = await this.repo.getRachaData();
    const today = new Date().toISOString().split('T')[0];
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    const ayerStr = ayer.toISOString().split('T')[0];

    let nuevaRacha = racha;
    if (lastDate === ayerStr) nuevaRacha = racha + 1;
    else if (lastDate !== today) nuevaRacha = 1;

    const nuevaMejorRacha = Math.max(nuevaRacha, mejorRacha);
    await this.repo.setRachaData(nuevaRacha, nuevaMejorRacha, today);

    // Actualizar nivel con racha
    const level = await this.repo.getIdentityLevel();
    await this.repo.saveIdentityLevel({ ...level, racha: nuevaRacha, mejorRacha: nuevaMejorRacha });
  }

  // ── Progreso hacia siguiente nivel ──────────────────────────────

  async getLevelProgress(): Promise<{ actual: NivelIdentidad; siguiente: NivelIdentidad | null; progreso: number }> {
    const { puntos, nivel } = await this.repo.getIdentityLevel();
    const umbrales: Record<NivelIdentidad, number> = {
      Inercia:    200,
      Reactivo:   600,
      Creador:    1500,
      Arquitecto: Infinity,
    };
    const previos: Record<NivelIdentidad, number> = {
      Inercia: 0, Reactivo: 200, Creador: 600, Arquitecto: 1500,
    };
    const siguientes: Partial<Record<NivelIdentidad, NivelIdentidad>> = {
      Inercia: 'Reactivo', Reactivo: 'Creador', Creador: 'Arquitecto',
    };

    const previo = previos[nivel];
    const tope = umbrales[nivel];
    const siguiente = siguientes[nivel] ?? null;

    if (tope === Infinity) return { actual: nivel, siguiente: null, progreso: 1 };

    const progreso = Math.min(1, (puntos - previo) / (tope - previo));
    return { actual: nivel, siguiente, progreso };
  }
}
