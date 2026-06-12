import React from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AudioPlayer } from '../ui/components/AudioPlayer';
import { saveBreathingSession } from '../store/storage';
import { colors } from '../theme';
import type { RootStackParams } from '../navigation';

type Route = RouteProp<RootStackParams, 'Respiracion'>;

export function RespiracionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const protocolo = route.params?.protocolo ?? 'rescate';
  const hzMap: Record<string, number> = { rescate: 4.7, expansion: 12.4, coherencia: 0.1, pineal: 0.5 };

  const handleComplete = async (duracionSegundos: number) => {
    await saveBreathingSession({
      protocolo,
      ciclosCompletados: Math.floor(duracionSegundos / 20),
      duracionSegundos,
      hzAlcanzado: hzMap[protocolo] ?? 8,
      estado: protocolo === 'rescate' ? 'supervivencia' : 'creacion',
    });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AudioPlayer
        protocolo={protocolo}
        onComplete={handleComplete}
        onClose={() => navigation.goBack()}
      />
    </View>
  );
}
