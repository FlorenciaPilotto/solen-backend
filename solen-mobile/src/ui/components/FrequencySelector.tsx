/**
 * FrequencySelector — El corazón de Solen.
 *
 * Slider vertical elegante con:
 * - Gradiente dinámico: ámbar (supervivencia) → cian (creación)
 * - Feedback háptico al llegar a los extremos
 * - Output: dispara onFrequencyChange con el FrecuencyState calculado
 * - Animación fluida con Animated.Value
 */

import React, { useRef, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, PanResponder, Animated,
  Vibration, Dimensions,
} from 'react-native';
import { calcularEstadoFrecuencia, calcularGradienteColor, FrecuencyState } from '../../domain/entities';

const { height: SCREEN_H } = Dimensions.get('window');
const TRACK_HEIGHT = SCREEN_H * 0.60;
const THUMB_SIZE = 52;

interface FrequencySelectorProps {
  initialValue?: number;
  onFrequencyChange: (state: FrecuencyState) => void;
}

export function FrequencySelector({ initialValue = 50, onFrequencyChange }: FrequencySelectorProps) {
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const thumbY = useRef(new Animated.Value(
    TRACK_HEIGHT - (initialValue / 100) * TRACK_HEIGHT - THUMB_SIZE / 2
  )).current;
  const lastHapticZone = useRef<'low' | 'high' | null>(null);

  const color = calcularGradienteColor(value);
  const colorStr = `rgb(${color.r},${color.g},${color.b})`;
  const colorStrAlpha = `rgba(${color.r},${color.g},${color.b},0.12)`;

  const getValueFromY = useCallback((y: number): number => {
    const clamped = Math.max(0, Math.min(TRACK_HEIGHT, y));
    // Invertido: arriba = 100, abajo = 0
    return Math.round(100 - (clamped / TRACK_HEIGHT) * 100);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        const startY = evt.nativeEvent.locationY - THUMB_SIZE / 2;
        thumbY.setValue(startY);
        const v = getValueFromY(startY);
        setValue(v);
      },

      onPanResponderMove: (_, gestureState) => {
        const newY = gestureState.moveY - THUMB_SIZE / 2 - (SCREEN_H - TRACK_HEIGHT) / 2;
        const clampedY = Math.max(0, Math.min(TRACK_HEIGHT - THUMB_SIZE, newY));
        thumbY.setValue(clampedY);
        const v = getValueFromY(clampedY + THUMB_SIZE / 2);
        setValue(v);

        // Haptic en zonas extremas
        if (v <= 5 && lastHapticZone.current !== 'low') {
          Vibration.vibrate(30);
          lastHapticZone.current = 'low';
        } else if (v >= 95 && lastHapticZone.current !== 'high') {
          Vibration.vibrate([0, 30, 30, 30]);
          lastHapticZone.current = 'high';
        } else if (v > 5 && v < 95) {
          lastHapticZone.current = null;
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        const newY = gestureState.moveY - THUMB_SIZE / 2 - (SCREEN_H - TRACK_HEIGHT) / 2;
        const clampedY = Math.max(0, Math.min(TRACK_HEIGHT - THUMB_SIZE, newY));
        const finalValue = getValueFromY(clampedY + THUMB_SIZE / 2);
        const state = calcularEstadoFrecuencia(finalValue);
        onFrequencyChange(state);
        Vibration.vibrate(15);
      },
    })
  ).current;

  const fillHeight = (value / 100) * TRACK_HEIGHT;

  return (
    <View style={styles.container}>

      {/* Etiqueta superior */}
      <Text style={[styles.labelTop, { color: colorStr }]}>
        {value >= 70 ? 'Creación' : value <= 30 ? 'Supervivencia' : 'Transición'}
      </Text>

      {/* Track principal */}
      <View style={styles.trackWrap} {...panResponder.panHandlers}>

        {/* Track de fondo */}
        <View style={styles.track}>
          {/* Fill dinámico */}
          <View
            style={[
              styles.trackFill,
              { height: fillHeight, backgroundColor: colorStr },
            ]}
          />
        </View>

        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: colorStrAlpha,
              borderColor: colorStr,
              transform: [{ translateY: thumbY }],
              shadowColor: colorStr,
              shadowOpacity: isDragging ? 0.6 : 0.3,
              shadowRadius: isDragging ? 20 : 10,
              elevation: isDragging ? 12 : 6,
            },
          ]}
        >
          <Text style={[styles.thumbValue, { color: colorStr }]}>{value}</Text>
        </Animated.View>

      </View>

      {/* Protocolo sugerido */}
      <View style={[styles.protocolTag, { borderColor: colorStr, backgroundColor: colorStrAlpha }]}>
        <Text style={[styles.protocolText, { color: colorStr }]}>
          {value <= 50 ? 'Protocolo de Rescate' : 'Protocolo de Expansión'}
        </Text>
      </View>

      {/* Etiquetas extremos */}
      <View style={styles.extremes}>
        <Text style={styles.extremeLabel}>Supervivencia</Text>
        <Text style={styles.extremeLabel}>Creación</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  labelTop: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  trackWrap: {
    width: 60,
    height: TRACK_HEIGHT,
    position: 'relative',
    alignItems: 'center',
  },
  track: {
    width: 4,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trackFill: {
    width: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    left: (60 - THUMB_SIZE) / 2,
  },
  thumbValue: {
    fontSize: 16,
    fontWeight: '200',
  },
  protocolTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 0.5,
  },
  protocolText: {
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.4,
  },
  extremes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  extremeLabel: {
    fontSize: 9,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0.8,
  },
});
