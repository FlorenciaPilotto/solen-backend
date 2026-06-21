import './src/i18n';
import React from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation';

function GestureRoot({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'web') {
    return <View style={{ flex: 1 }}>{children}</View>;
  }
  const { GestureHandlerRootView } =
    require('react-native-gesture-handler') as typeof import('react-native-gesture-handler');
  return <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>;
}

export default function App() {
  return (
    <GestureRoot>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="#000000" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureRoot>
  );
}
