/**
 * MeditationPlayer — Reproductor estética Endel.
 *
 * - Onda circular concéntrica que pulsa según el ritmo de respiración
 * - Canvas animado con react-native-svg
 * - Botón de cerrar que solo aparece al tocar la pantalla
 * - Sin barra de progreso tradicional
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  TouchableWithoutFeedback, Vibration,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { calcularGradienteColor } from '../../domain/entities';

interface Phase {
  name: string;
  seconds: number;
  expanding: boolean;
  instruction: string;
}

interface MeditationPlayerProps {
  protocolo: 'rescate' | 'expansion' | 'coherencia' | 'pineal';
  onComplete: (duracionSegundos: number) => void;
  onClose: () => void;
}

const PHASES: Record<string, Phase[]> = {
  rescate:    [
    { name: 'Inhalar',  seconds: 4, expanding: true,  instruction: 'Toda tu atención en el abdomen' },
    { name: 'Retener',  seconds: 7, expanding: true,  instruction: 'Deja que la presión se asiente' },
    { name: 'Exhalar',  seconds: 8, expanding: false, instruction: 'La tensión baja hacia la tierra' },
  ],
  expansion:  [
    { name: 'Exhalar',  seconds: 0.5, expanding: false, instruction: 'Exhalación explosiva' },
    { name: 'Inhalar',  seconds: 0.5, expanding: true,  instruction: 'Dejar entrar el aire' },
  ],
  coherencia: [
    { name: 'Inhalar',  seconds: 5, expanding: true,  instruction: 'A través de tu corazón' },
    { name: 'Exhalar',  seconds: 5, expanding: false, instruction: 'Suelta el miedo, entra conexión' },
  ],
  pineal: [
    { name: 'Inhalar',  seconds: 4, expanding: true,  instruction: 'Empujá el fluido hacia la coronilla' },
    { name: 'Retener',  seconds: 8, expanding: true,  instruction: 'Sosté — sentí la presión' },
    { name: 'Exhalar',  seconds: 6, expanding: false, instruction: 'Soltá desde la coronilla' },
  ],
};

const PROTOCOL_COLORS = {
  rescate:    { r: 237, g: 147, b: 177 },
  expansion:  { r:  93, g: 202, b: 165 },
  coherencia: { r: 239, g: 159, b:  39 },
  pineal:     { r: 186, g: 117, b:  23 },
};

export function MeditationPlayer({ protocolo, onComplete, onClose }: MeditationPlayerProps) {
  const phases = PHASES[protocolo];
  const baseColor = PROTOCOL_COLORS[protocolo];
  const colorStr = `rgb(${baseColor.r},${baseColor.g},${baseColor.b})`;

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showClose, setShowClose] = useState(false);
  const [phaseProgress, setPhaseProgress] = useState(0);

  const orbScale = useRef(new Animated.Value(0.6)).current;
  const closeOpacity = useRef(new Animated.Value(0)).current;
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed counter
  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, []);

  // Ciclo de respiración
  const runPhase = useCallback((idx: number) => {
    const phase = phases[idx % phases.length];
    const targetScale = phase.expanding ? 1.0 : 0.55;

    Animated.timing(orbScale, {
      toValue: targetScale,
      duration: phase.seconds * 1000,
      useNativeDriver: true,
    }).start();

    // Vibración háptica al cambiar de fase
    Vibration.vibrate(20);

    // Progreso de fase
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const prog = Math.min(1, (Date.now() - startTime) / (phase.seconds * 1000));
      setPhaseProgress(prog);
    }, 100);

    phaseTimerRef.current = setTimeout(() => {
      clearInterval(progressInterval);
      const nextIdx = idx + 1;
      if (nextIdx % phases.length === 0) {
        setCycleCount(c => c + 1);
      }
      setPhaseIdx(nextIdx % phases.length);
      runPhase(nextIdx);
    }, phase.seconds * 1000);
  }, [phases, orbScale]);

  useEffect(() => {
    runPhase(0);
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      orbScale.stopAnimation();
    };
  }, []);

  const handleTouch = () => {
    setShowClose(true);
    Animated.timing(closeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      Animated.timing(closeOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setShowClose(false);
      });
    }, 3000);
  };

  const phase = phases[phaseIdx % phases.length];
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // Ondas concéntricas (5 círculos que pulsan en cascada)
  const waveRadii = [40, 60, 80, 100, 120];

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container}>

        {/* Visualización principal — ondas concéntricas */}
        <View style={styles.orbWrap}>
          <Svg width={280} height={280} viewBox="0 0 280 280">
            <G>
              {waveRadii.map((r, i) => (
                <Circle
                  key={i}
                  cx={140}
                  cy={140}
                  r={r * (phase.expanding ? 1 + phaseProgress * 0.15 : 1 - phaseProgress * 0.12)}
                  fill="none"
                  stroke={colorStr}
                  strokeWidth={0.5}
                  opacity={0.08 + (i / waveRadii.length) * 0.12}
                />
              ))}
            </G>
            {/* Círculo principal animado */}
            <Circle
              cx={140}
              cy={140}
              r={68 * (phase.expanding ? 0.85 + phaseProgress * 0.18 : 1.03 - phaseProgress * 0.18)}
              fill={`rgba(${baseColor.r},${baseColor.g},${baseColor.b},0.08)`}
              stroke={colorStr}
              strokeWidth={0.8}
              opacity={0.6}
            />
            {/* Núcleo */}
            <Circle
              cx={140}
              cy={140}
              r={24 * (phase.expanding ? 0.9 + phaseProgress * 0.2 : 1.1 - phaseProgress * 0.2)}
              fill={`rgba(${baseColor.r},${baseColor.g},${baseColor.b},0.25)`}
            />
          </Svg>
        </View>

        {/* Fase y contador */}
        <View style={styles.phaseInfo}>
          <Text style={[styles.phaseName, { color: colorStr }]}>{phase.name}</Text>
          <Text style={styles.phaseSeconds}>
            {Math.max(0, Math.ceil(phase.seconds * (1 - phaseProgress)))}
          </Text>
          <Text style={styles.phaseInstruction}>{phase.instruction}</Text>
        </View>

        {/* Ciclos y tiempo */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{cycleCount}</Text>
            <Text style={styles.statLabel}>ciclos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</Text>
            <Text style={styles.statLabel}>transcurrido</Text>
          </View>
        </View>

        {/* Botón cerrar (solo visible al tocar) */}
        {showClose && (
          <Animated.View style={[styles.closeBtn, { opacity: closeOpacity }]}>
            <TouchableOpacity onPress={() => onClose()} style={styles.closeBtnInner}>
              <Text style={styles.closeBtnText}>✕  Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onComplete(elapsed)} style={styles.completeBtnInner}>
              <Text style={[styles.closeBtnText, { color: colorStr }]}>Completar</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07050f',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseInfo: {
    alignItems: 'center',
    gap: 6,
  },
  phaseName: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  phaseSeconds: {
    fontSize: 52,
    fontWeight: '200',
    color: '#e8e4ff',
    lineHeight: 56,
  },
  phaseInstruction: {
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(232,224,255,0.4)',
    letterSpacing: 0.3,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: 20,
    fontWeight: '200',
    color: 'rgba(232,224,255,0.7)',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  closeBtn: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 12,
  },
  closeBtnInner: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  completeBtnInner: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.4)',
  },
});
