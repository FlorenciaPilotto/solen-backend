import { useState, useEffect } from 'react';
import { getRoundActivo, RoundActivo } from '../../domain/entities';
import { colors } from '../../theme';

interface TimeBasedRound {
  round: RoundActivo;
  hora: number;
  minuto: number;
  label: string;
  descripcion: string;
  colorPrimary: string;
}

const ROUND_META: Record<RoundActivo, Omit<TimeBasedRound, 'round' | 'hora' | 'minuto'>> = {
  round_uno: {
    label: 'Round Uno',
    descripcion: '05:00–08:00 · Activación y protocolo matutino',
    colorPrimary: colors.accent,
  },
  accion_masiva: {
    label: 'Acción Masiva',
    descripcion: '08:00–18:00 · Bloque de flujo y creación',
    colorPrimary: colors.accent,
  },
  integridad_reset: {
    label: 'Integridad y Reset',
    descripcion: '18:00–22:00 · Revisión y recuperación',
    colorPrimary: colors.accent,
  },
  pineal: {
    label: 'Activación Pineal',
    descripcion: '22:00–05:00 · Round Tres y descanso profundo',
    colorPrimary: colors.accent,
  },
};

export function useTimeBasedRound(): TimeBasedRound {
  const [state, setState] = useState<TimeBasedRound>(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const round = getRoundActivo(h, m);
    return { round, hora: h, minuto: m, ...ROUND_META[round] };
  });

  useEffect(() => {
    // Actualizar cada minuto
    const interval = setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const round = getRoundActivo(h, m);
      setState({ round, hora: h, minuto: m, ...ROUND_META[round] });
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return state;
}
