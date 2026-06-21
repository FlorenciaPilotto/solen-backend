/**
 * AudioPlayer — Reproductor somático de Solen.
 *
 * ⚠️  FUENTE DE AUDIO: usa tus propios archivos MP3/WAV.
 *     Subílos a tu servidor/CDN (S3, Cloudflare R2, etc.)
 *     Extraer audio de YouTube viola sus ToS.
 *
 * Funcionalidades:
 * - Gradiente radial animado que reacciona a la amplitud simulada
 * - Sin botones de adelantar/retroceder
 * - Play/Pause oculto: tocar el anillo de progreso
 * - Botón "Finalizar" que se desbloquea al 90% del audio
 * - Ciclo de respiración sincronizado con el protocolo
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableWithoutFeedback,
  TouchableOpacity, Animated, Vibration, Dimensions,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import Svg, { Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, fonts } from '../../theme';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Tipos ─────────────────────────────────────────────────────────

type Protocolo = 'rescate' | 'expansion' | 'coherencia' | 'pineal';

interface BreathPhase { name: string; seconds: number; instruction: string; }
interface AudioTrack { uri: string | number; title: string; subtitulo?: string; duracionSegundos: number; }

// ── Catálogo de audio (reemplazar con tus URLs reales) ────────────
// Ejemplo con archivos locales: require('../../../assets/audio/rescate.mp3')
// Ejemplo con CDN: { uri: 'https://cdn.solen.app/audio/rescate.mp3' }

// ── Audios reales bundleados en assets/audio/ ─────────────────────
const MEDITACION_MANANA = require('../../../assets/audio/meditacion-federico-paz.mp3');
const ACTIVACION_PINEAL = require('../../../assets/audio/activacion-pineal.mp3');
const MEDITACION_DORMIR = require('../../../assets/audio/meditacion-dormir.mp3');

/**
 * AUDIO_CATALOG — Catálogo de audios por protocolo.
 *
 * Audios actuales:
 *   meditacion-federico-paz.mp3  27:01  Rescate + Expansión (mañana)
 *   meditacion-dormir.mp3        21:00  Coherencia (noche, antes de dormir)
 *   activacion-pineal.mp3        71:52  Pineal — La Puerta a la Experiencia Mística
 *
 * Para agregar tus propios audios:
 *   1. Copiar el MP3 a assets/audio/
 *   2. Reemplazar la entrada correspondiente aquí
 *   3. Actualizar duracionSegundos con el valor real
 */
export const AUDIO_CATALOG: Record<Protocolo, AudioTrack> = {
  rescate: {
    uri: MEDITACION_MANANA,
    title: 'Meditación de la Mañana',
    subtitulo: 'Ancla de Serotonina · 27 min',
    duracionSegundos: 1621,   // 27:01
  },
  expansion: {
    uri: ACTIVACION_PINEAL,
    title: 'La Puerta a la Experiencia Mística',
    subtitulo: 'Fuego y Magnetismo · 71 min',
    duracionSegundos: 4312,   // 71:52
  },
  coherencia: {
    uri: MEDITACION_DORMIR,
    title: 'Meditación para Dormir',
    subtitulo: 'Coherencia cardíaca · 21 min',
    duracionSegundos: 1260,   // 21:00
  },
  pineal: {
    uri: ACTIVACION_PINEAL,
    title: 'La Puerta a la Experiencia Mística',
    subtitulo: 'Activación Pineal · Round Tres',
    duracionSegundos: 4312,   // 71:52
  },
};

const BREATH_PHASES: Record<Protocolo, BreathPhase[]> = {
  rescate: [
    { name: 'Inhalar',  seconds: 4, instruction: 'Toda tu atención en el abdomen' },
    { name: 'Retener',  seconds: 7, instruction: 'Deja que la presión se asiente' },
    { name: 'Exhalar',  seconds: 8, instruction: 'La tensión baja hacia la tierra' },
  ],
  expansion: [
    { name: 'Exhalar',  seconds: 0.5, instruction: 'Exhalación explosiva por la nariz' },
    { name: 'Inhalar',  seconds: 0.5, instruction: 'Deja entrar el aire solo' },
  ],
  coherencia: [
    { name: 'Inhalar',  seconds: 5, instruction: 'A través de tu corazón' },
    { name: 'Exhalar',  seconds: 5, instruction: 'Suelta el miedo, entra conexión' },
  ],
  pineal: [
    { name: 'Inhalar',  seconds: 4, instruction: 'Empujá el fluido hacia la coronilla' },
    { name: 'Retener',  seconds: 8, instruction: 'Sostené — sentí la presión' },
    { name: 'Exhalar',  seconds: 6, instruction: 'Soltá desde la coronilla' },
  ],
};

const PROTOCOL_COLORS: Record<Protocolo, [number,number,number]> = {
  rescate:    [255, 255, 255],
  expansion:  [255, 255, 255],
  coherencia: [255, 255, 255],
  pineal:     [255, 255, 255],
};

// ── Props ─────────────────────────────────────────────────────────

interface AudioPlayerProps {
  protocolo: Protocolo;
  onComplete: (duracionEscuchada: number) => void;
  onClose: () => void;
}

// ── Componente ────────────────────────────────────────────────────

export function AudioPlayer({ protocolo, onComplete, onClose }: AudioPlayerProps) {
  const track    = AUDIO_CATALOG[protocolo];
  const phases   = BREATH_PHASES[protocolo];
  const color    = PROTOCOL_COLORS[protocolo];
  const colorStr = `rgb(${color[0]},${color[1]},${color[2]})`;

  const soundRef       = useRef<Audio.Sound | null>(null);
  const [playing,      setPlaying]      = useState(false);
  const [loaded,       setLoaded]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [elapsed,      setElapsed]      = useState(0);
  const [duration,     setDuration]     = useState(track.duracionSegundos);
  const [unlocked,     setUnlocked]     = useState(false);
  const [completed,    setCompleted]    = useState(false);
  const [phaseIdx,     setPhaseIdx]     = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);

  // Animaciones del orbe
  const orbScale  = useRef(new Animated.Value(0.7)).current;
  const orbOpacity= useRef(new Animated.Value(0.6)).current;

  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Audio setup ───────────────────────────────────────────────

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
    loadSound();
    return () => { unloadSound(); };
  }, []);

  const loadSound = async () => {
    try {
      const source = typeof track.uri === 'number' ? track.uri : { uri: track.uri };
      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true, volume: 1.0 },
        onPlaybackStatus,
      );
      soundRef.current = sound;
      setPlaying(true);
      setLoaded(true);
    } catch (e) {
      setError('No se pudo cargar el audio. Verificá tu conexión.');
      // En desarrollo: simular con timer
      startSimulation();
    }
  };

  const unloadSound = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
  };

  const onPlaybackStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    const pos = Math.floor((status.positionMillis ?? 0) / 1000);
    const dur = Math.floor((status.durationMillis ?? track.duracionSegundos * 1000) / 1000);
    setElapsed(pos);
    setDuration(dur);
    if (status.didJustFinish) handleFinish(pos);
  };

  // ── Simulación (cuando no hay audio real) ─────────────────────

  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startSimulation = () => {
    setLoaded(true); setPlaying(true);
    simulationRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (next >= track.duracionSegundos) {
          if (simulationRef.current) clearInterval(simulationRef.current);
        }
        return next;
      });
    }, 1000);
  };

  // ── Ciclo de respiración ──────────────────────────────────────

  useEffect(() => {
    if (!playing) return;
    phaseTimerRef.current = setInterval(() => {
      setPhaseElapsed(pe => {
        const phase = phases[phaseIdx];
        if (pe + 0.1 >= phase.seconds) {
          setPhaseIdx(pi => (pi + 1) % phases.length);
          return 0;
        }
        return pe + 0.1;
      });
    }, 100);
    return () => { if (phaseTimerRef.current) clearInterval(phaseTimerRef.current); };
  }, [playing, phaseIdx, phases]);

  // ── Animación del orbe según fase ────────────────────────────

  useEffect(() => {
    const phase = phases[phaseIdx];
    const expanding = phase.name === 'Inhalar' || phase.name === 'Retener';
    Animated.timing(orbScale, {
      toValue: expanding ? 1.0 : 0.65,
      duration: phase.seconds * 1000,
      useNativeDriver: true,
    }).start();
    Animated.timing(orbOpacity, {
      toValue: expanding ? 0.9 : 0.55,
      duration: phase.seconds * 1000,
      useNativeDriver: true,
    }).start();
  }, [phaseIdx]);

  // ── Desbloqueo del botón Finalizar al 90% ────────────────────

  useEffect(() => {
    const progress = duration > 0 ? elapsed / duration : 0;
    if (progress >= 0.9 && !unlocked) {
      setUnlocked(true);
      Vibration.vibrate([0, 50, 50, 50]);
    }
  }, [elapsed, duration, unlocked]);

  // ── Handlers ──────────────────────────────────────────────────

  const togglePlay = useCallback(async () => {
    if (!loaded) return;
    if (soundRef.current) {
      if (playing) await soundRef.current.pauseAsync();
      else         await soundRef.current.playAsync();
    } else {
      if (simulationRef.current) clearInterval(simulationRef.current);
      else startSimulation();
    }
    setPlaying(p => !p);
    Vibration.vibrate(20);
  }, [playing, loaded]);

  const handleFinish = useCallback((pos: number) => {
    setCompleted(true);
    onComplete(pos);
  }, [onComplete]);

  const handleFinalizar = useCallback(async () => {
    if (!unlocked) return;
    await unloadSound();
    handleFinish(elapsed);
  }, [unlocked, elapsed]);

  // ── Render ────────────────────────────────────────────────────

  const progress  = duration > 0 ? elapsed / duration : 0;
  const phase     = phases[phaseIdx];
  const mins      = Math.floor(elapsed / 60);
  const secs      = elapsed % 60;
  const remSecs   = Math.max(0, duration - elapsed);
  const remMins   = Math.floor(remSecs / 60);
  const remS      = remSecs % 60;

  const RING_R = 108;
  const RING_CX = 130;
  const RING_CY = 130;
  const circumference = 2 * Math.PI * RING_R;
  const strokeDashoffset = circumference * (1 - progress);

  // Ángulo del marcador 90%
  const unlockAngle = 2 * Math.PI * 0.9 - Math.PI / 2;
  const ux = RING_CX + Math.cos(unlockAngle) * RING_R;
  const uy = RING_CY + Math.sin(unlockAngle) * RING_R;

  return (
    <TouchableWithoutFeedback>
      <View style={styles.container}>

        {/* Gradiente radial de fondo animado */}
        <Animated.View style={[styles.orbBg, {
          transform: [{ scale: orbScale }],
          opacity: orbOpacity,
        }]}>
          <Svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={StyleSheet.absoluteFillObject}>
            <Defs>
              <RadialGradient id="grad1" cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor={colorStr} stopOpacity="0.35" />
                <Stop offset="40%"  stopColor={colorStr} stopOpacity="0.15" />
                <Stop offset="100%" stopColor={colorStr} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="grad2" cx="40%" cy="45%" r="45%">
                <Stop offset="0%"   stopColor={`rgb(${color[0]-40},${color[1]-40},${color[2]-40})`} stopOpacity="0.2" />
                <Stop offset="100%" stopColor={colorStr} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={SW/2} cy={SH/2} r={Math.min(SW,SH)*0.6} fill="url(#grad1)" />
            <Circle cx={SW*0.4} cy={SH*0.45} r={Math.min(SW,SH)*0.4} fill="url(#grad2)" />
          </Svg>
        </Animated.View>

        {/* Error state */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTxt}>{error} (modo simulación activo)</Text>
          </View>
        )}

        <View style={styles.trackInfo}>
          <Text style={[styles.trackTag, { color: colorStr }]}>{protocolo.toUpperCase()}</Text>
          <Text style={styles.trackName}>{track.title}</Text>
          {track.subtitulo && <Text style={styles.trackSub}>{track.subtitulo}</Text>}
        </View>

        {/* Anillo de progreso — tocar para play/pause (oculto) */}
        <TouchableWithoutFeedback onPress={togglePlay}>
          <View style={styles.ringWrap}>
            <Svg width={260} height={260} viewBox="0 0 260 260">
              {/* Track bg */}
              <Circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none" stroke={colors.border} strokeWidth={1.5} />
              {/* Progress arc */}
              <Circle
                cx={RING_CX} cy={RING_CY} r={RING_R}
                fill="none"
                stroke={colorStr}
                strokeWidth={1.5}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${RING_CX},${RING_CY}`}
                opacity={0.8}
              />
              {/* Marcador 90% */}
              <Circle cx={ux} cy={uy} r={4} fill={unlocked ? colorStr : colors.textHint} />
            </Svg>

            {/* Tiempo en el centro */}
            <View style={styles.ringCenter}>
              <Text style={styles.timeDisplay}>{mins}:{String(secs).padStart(2,'0')}</Text>
              <Text style={[styles.phaseDisplay, { color: colorStr }]}>{phase.name}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Instrucción de foco */}
        <Text style={styles.instruction}>{phase.instruction}</Text>
        <Text style={styles.timeRemaining}>{remMins}:{String(remS).padStart(2,'0')} restante</Text>

        {/* Botón Finalizar — solo al 90% */}
        <TouchableOpacity
          style={[styles.btnFinalizar, unlocked ? styles.btnUnlocked : styles.btnLocked]}
          onPress={handleFinalizar}
          disabled={!unlocked}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, { color: unlocked ? colorStr : colors.textHint }]}>
            {unlocked ? 'Finalizar práctica' : `Integridad: ${Math.round(progress * 100)}%`}
          </Text>
        </TouchableOpacity>

      </View>
    </TouchableWithoutFeedback>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center', gap: 20,
    paddingHorizontal: 24, paddingVertical: 40,
  },
  orbBg: { ...StyleSheet.absoluteFillObject },

  errorBanner: { backgroundColor: 'rgba(255,69,58,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  errorTxt: { fontSize: 10, fontWeight: fonts.light, color: colors.error, textAlign: 'center' },

  trackInfo: { alignItems: 'center', gap: 4 },
  trackTag: { fontSize: 9, fontWeight: fonts.medium, letterSpacing: 3, textTransform: 'uppercase' },
  trackName: { fontSize: 20, fontWeight: fonts.regular, color: colors.textPrimary },
  trackSub:  { fontSize: 11, fontWeight: fonts.light, color: colors.textMuted, marginTop: 2 },

  ringWrap: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  timeDisplay: { fontSize: 44, fontWeight: fonts.light, color: colors.textPrimary },
  phaseDisplay: { fontSize: 10, fontWeight: fonts.medium, letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 4 },

  instruction: { fontSize: 12, fontWeight: fonts.light, color: colors.textSecondary, letterSpacing: 0.3, textAlign: 'center' },
  timeRemaining: { fontSize: 11, fontWeight: fonts.light, color: colors.textHint },

  btnFinalizar: { borderWidth: 0.5, borderRadius: 50, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  btnLocked:   { borderColor: colors.border, backgroundColor: colors.bgCard },
  btnUnlocked: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  btnText: { fontSize: 13, fontWeight: fonts.medium, letterSpacing: 0.3 },
});
